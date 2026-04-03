using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
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

        public UsersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserModel>>> GetUsers()
        {
            return await _context.Users.ToListAsync();
        }

        // POST: api/Users (Création)
        [HttpPost]
        public async Task<ActionResult<UserModel>> CreateUser(UserModel newUser)
        {
            // Vérifier si l'email existe déjà
            if (await _context.Users.AnyAsync(u => u.Email == newUser.Email))
            {
                return BadRequest("Cet email est déjà utilisé.");
            }

            // Validation : Le mot de passe est obligatoire pour un nouvel utilisateur
            if (string.IsNullOrEmpty(newUser.Password))
            {
                return BadRequest("Le mot de passe est obligatoire.");
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
                        Address = "À compléter par l'admin"
                    };
                    _context.Companies.Add(newCompany);
                    await _context.SaveChangesAsync();
                    newUser.CompanyId = newCompany.Id;
                }
                else
                {
                    newUser.CompanyId = existingCompany.Id;
                }
            }

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUsers), new { id = newUser.Id }, newUser);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            UserModel user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateUserStatus(int id, [FromBody] string status)
        {
            UserModel user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            user.Status = status; // Active, Refused, Pending
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Statut de l'utilisateur mis à jour : {status}" });
        }
    }
}
