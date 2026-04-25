using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.Services;
using UserModel = backend.Models.User;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;

        public UsersController(ApplicationDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        // GET: api/Users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserModel>>> GetUsers()
        {
            return await _context.Users
                .Include(u => u.Companies)
                .ToListAsync();
        }

        // POST: api/Users (Création)
        [HttpPost]
        public async Task<ActionResult<UserModel>> CreateUser(UserModel newUser)
        {
            // Validation du format email (@gmail.com uniquement)
            if (string.IsNullOrWhiteSpace(newUser.Email) || 
                !System.Text.RegularExpressions.Regex.IsMatch(newUser.Email.Trim(), @"^[a-zA-Z0-9._%+-]+@gmail\.com$", System.Text.RegularExpressions.RegexOptions.IgnoreCase))
            {
                return BadRequest("L'email doit être une adresse Gmail valide (exemple@gmail.com).");
            }

            // Vérifier l'unicité de l'email (insensible à la casse)
            if (await _context.Users.AnyAsync(u => u.Email.ToLower() == newUser.Email.Trim().ToLower()))
            {
                return BadRequest("Cet email est déjà utilisé.");
            }

            // Validation de la complexité du mot de passe
            if (string.IsNullOrEmpty(newUser.Password) || newUser.Password.Length < 8 ||
                !System.Text.RegularExpressions.Regex.IsMatch(newUser.Password, @"[A-Z]") ||
                !System.Text.RegularExpressions.Regex.IsMatch(newUser.Password, @"[a-z]") ||
                !System.Text.RegularExpressions.Regex.IsMatch(newUser.Password, @"\d") ||
                !System.Text.RegularExpressions.Regex.IsMatch(newUser.Password, @"[@#$*!]"))
            {
                return BadRequest("Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@#$*!).");
            }



            // Validation du Matricule Fiscal (13 caractères selon les normes El Fatoora)
            if (string.IsNullOrEmpty(newUser.MatriculeFiscal) || newUser.MatriculeFiscal.Length != 13)
            {
                return BadRequest("Le Matricule Fiscal est obligatoire et doit contenir exactement 13 caractères (ex: 1234567XAM000).");
            }
            
            // Catégories autorisées: A, P, B, M au 9ème caractère (index 8)
            char category = newUser.MatriculeFiscal[8];
            if (!"APBM".Contains(category))
            {
                return BadRequest("Code catégorie (9ème caractère) invalide. Valeurs autorisées: A, P, B, M.");
            }

            if (string.IsNullOrEmpty(newUser.Role)) newUser.Role = "Client";
            
            // Si c'est l'admin qui crée, on met direct en Active. 
            // Si c'est l'inscription libre, c'est handled par AuthController.Register (Pending).
            if (string.IsNullOrEmpty(newUser.Status)) newUser.Status = "Active";

            // Lier ou créer la société automatiquement (comme dans AuthController)
            if (!string.IsNullOrEmpty(newUser.Entreprise) && !string.IsNullOrEmpty(newUser.MatriculeFiscal))
            {
                var existingCompany = await _context.Companies.FirstOrDefaultAsync(c => c.RegistrationNumber == newUser.MatriculeFiscal);
                if (existingCompany == null)
                {
                    var newCompany = new Company
                    {
                        Name = newUser.Entreprise,
                        RegistrationNumber = newUser.MatriculeFiscal,
                        RNE = newUser.RNE,
                        Address = "À compléter par l'admin"
                    };
                    _context.Companies.Add(newCompany);
                    await _context.SaveChangesAsync();
                    newUser.Companies.Add(newCompany);
                }
                else
                {
                    newUser.Companies.Add(existingCompany);
                }
            }

            try 
            {
                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();
                
                // Log activity
                string adminName = Request.Query["adminName"].ToString();
                if (string.IsNullOrEmpty(adminName)) adminName = "Admin";

                _context.ActivityLogs.Add(new ActivityLog
                {
                    Actor = adminName,
                    Action = $"a créé l'utilisateur {newUser.Name}",
                    TargetInfo = newUser.Entreprise ?? "Sans société",
                    Type = "user_creation",
                    Timestamp = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Error Users] {ex.Message}");
            }


            return CreatedAtAction(nameof(GetUsers), new { id = newUser.Id }, newUser);
        }

        // PUT: api/Users/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] System.Text.Json.JsonElement body)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            // Mettre à jour les champs envoyés
            if (body.TryGetProperty("name", out var nameVal) && !string.IsNullOrWhiteSpace(nameVal.GetString()))
                user.Name = nameVal.GetString()!;

            if (body.TryGetProperty("email", out var emailVal) && !string.IsNullOrWhiteSpace(emailVal.GetString()))
            {
                string newEmail = emailVal.GetString()!.Trim();
                if (await _context.Users.AnyAsync(u => u.Email.ToLower() == newEmail.ToLower() && u.Id != id))
                    return BadRequest("Cet email est déjà utilisé.");
                user.Email = newEmail;
            }

            if (body.TryGetProperty("password", out var passVal) && !string.IsNullOrWhiteSpace(passVal.GetString()))
            {
                string newPass = passVal.GetString()!;

                // Si l'ancien mot de passe est fourni, le vérifier
                if (body.TryGetProperty("oldPassword", out var oldPassVal) && !string.IsNullOrWhiteSpace(oldPassVal.GetString()))
                {
                    if (user.Password != oldPassVal.GetString())
                        return BadRequest("L'ancien mot de passe est incorrect.");
                }

                if (newPass.Length < 8 ||
                    !System.Text.RegularExpressions.Regex.IsMatch(newPass, @"[A-Z]") ||
                    !System.Text.RegularExpressions.Regex.IsMatch(newPass, @"[a-z]") ||
                    !System.Text.RegularExpressions.Regex.IsMatch(newPass, @"\d") ||
                    !System.Text.RegularExpressions.Regex.IsMatch(newPass, @"[@#$*!]"))
                    return BadRequest("Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@#$*!).");
                user.Password = newPass;
            }

            if (body.TryGetProperty("role", out var roleVal) && !string.IsNullOrWhiteSpace(roleVal.GetString()))
                user.Role = roleVal.GetString()!;

            if (body.TryGetProperty("status", out var statusVal) && !string.IsNullOrWhiteSpace(statusVal.GetString()))
                user.Status = statusVal.GetString()!;

            if (body.TryGetProperty("entreprise", out var entVal) && !string.IsNullOrWhiteSpace(entVal.GetString()))
                user.Entreprise = entVal.GetString()!;

            if (body.TryGetProperty("matriculeFiscal", out var mfVal) && !string.IsNullOrWhiteSpace(mfVal.GetString()))
                user.MatriculeFiscal = mfVal.GetString()!;

            if (body.TryGetProperty("rne", out var rneVal) && !string.IsNullOrWhiteSpace(rneVal.GetString()))
                user.RNE = rneVal.GetString()!;

            await _context.SaveChangesAsync();
            return Ok(user);
        }


        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            UserModel user = await _context.Users
                .Include(u => u.Companies)
                .FirstOrDefaultAsync(u => u.Id == id);
                
            if (user == null) return NotFound();

            // 1. Récupérer les sociétés via la relation (si elle existe)
            var companiesToDelete = user.Companies?.ToList() ?? new List<Company>();

            // 2. Fallback de sécurité : Récupérer via le Matricule Fiscal
            if (!string.IsNullOrEmpty(user.MatriculeFiscal))
            {
                var fallbackCompanies = await _context.Companies
                    .Where(c => c.RegistrationNumber == user.MatriculeFiscal)
                    .ToListAsync();

                foreach(var fc in fallbackCompanies)
                {
                    if (!companiesToDelete.Any(c => c.Id == fc.Id))
                    {
                        companiesToDelete.Add(fc);
                    }
                }
            }

            // Au lieu de supprimer on Archive
            user.Status = "Archived";
            
            // Archiver la sélection de sociétés
            if (companiesToDelete.Any())
            {
                foreach(var c in companiesToDelete)
                {
                    c.IsArchived = true;
                }
            }

            // NE PLUS APPELER : _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateUserStatus(int id, [FromBody] string status)
        {
            UserModel user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            // Vérifier si le statut passe à "Active" pour la première fois
            bool isActivating = user.Status != "Active" && status == "Active";

            user.Status = status; // Active, Refused, Pending
            await _context.SaveChangesAsync();

            // Notification for the user
            if (status == "Active")
            {
                _context.Notifications.Add(new Notification
                {
                    UserId = user.Id,
                    Type = "account",
                    Title = "Compte active",
                    Message = "Votre compte a ete valide par l'administrateur. Bienvenue sur El Fatoora !",
                    CreatedAt = DateTime.Now
                });
                await _context.SaveChangesAsync();
            }
            else if (status == "Refused")
            {
                _context.Notifications.Add(new Notification
                {
                    UserId = user.Id,
                    Type = "account",
                    Title = "Demande refusee",
                    Message = "Votre demande d'inscription a ete refusee par l'administrateur.",
                    CreatedAt = DateTime.Now
                });
                await _context.SaveChangesAsync();
            }

            if (isActivating)
            {
                await _emailService.SendEmailAsync(
                    user.Email,
                    "Votre compte El Fatoora est Activé",
                    $"Bonjour {user.Name},\n\nVotre compte a été approuvé par l'administrateur. Vous pouvez dès à présent vous connecter sur la plateforme.\n\nCordialement,\nL'équipe El Fatoora."
                );
            }

            return Ok(new { message = $"Statut de l'utilisateur mis à jour : {status}" });
        }
    }
}
