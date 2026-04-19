using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using System.IO;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CompaniesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        public CompaniesController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // GET: api/Companies
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Company>>> GetCompanies()
        {
            // Sync current companies from users table if needed
            await SyncCompaniesInternal();
            return await _context.Companies.ToListAsync();
        }

        // GET: api/Companies/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Company>> GetCompany(int id)
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null) return NotFound();
            return company;
        }

        private async Task SyncCompaniesInternal()
        {
            var userLevelCompanies = await _context.Users
                .Where(u => !string.IsNullOrEmpty(u.Entreprise) && !string.IsNullOrEmpty(u.MatriculeFiscal))
                .Select(u => new { u.Entreprise, u.MatriculeFiscal })
                .ToListAsync();

            var distinctUserCos = userLevelCompanies
                .GroupBy(u => u.MatriculeFiscal)
                .Select(g => g.First())
                .ToList();

            bool changed = false;
            foreach (var userCo in distinctUserCos)
            {
                var company = await _context.Companies.FirstOrDefaultAsync(c => c.RegistrationNumber == userCo.MatriculeFiscal);
                if (company == null)
                {
                    company = new Company
                    {
                        Name = userCo.Entreprise,
                        RegistrationNumber = userCo.MatriculeFiscal,
                        Address = "Saisie par utilisateur"
                    };
                    _context.Companies.Add(company);
                    await _context.SaveChangesAsync();
                    changed = true;
                }

                // Lier les utilisateurs à cette société
                var usersToLink = await _context.Users
                    .Include(u => u.Companies)
                    .Where(u => u.MatriculeFiscal == company.RegistrationNumber)
                    .ToListAsync();
                
                foreach (var u in usersToLink) 
                {
                    if (!u.Companies.Any(c => c.Id == company.Id))
                    {
                        u.Companies.Add(company);
                        changed = true;
                    }
                }
            }
            if (changed) await _context.SaveChangesAsync();
        }

        // POST: api/Companies?userId=5
        [HttpPost]
        public async Task<ActionResult<Company>> CreateCompany(Company newCompany, [FromQuery] int? userId)
        {
            // Validation du Matricule Fiscal — Norme El Fatoora (13 car. sans /)
            if (string.IsNullOrEmpty(newCompany.RegistrationNumber) || newCompany.RegistrationNumber.Length != 13)
            {
                return BadRequest("Le numéro d'enregistrement (Matricule Fiscal) est obligatoire et doit contenir exactement 13 caractères (ex: 1234567ABM000).");
            }
 
            // Vérifier si le numéro d'enregistrement existe déjà
            if (await _context.Companies.AnyAsync(c => c.RegistrationNumber == newCompany.RegistrationNumber))
            {
                return BadRequest("Ce numéro d'enregistrement (matricule fiscal) est déjà utilisé par une autre société.");
            }
 
            if (string.IsNullOrWhiteSpace(newCompany.Name))
            {
                return BadRequest("Le nom de la société est obligatoire.");
            }
 
            if (userId.HasValue)
            {
                var user = await _context.Users.Include(u => u.Companies).FirstOrDefaultAsync(u => u.Id == userId.Value);
                if (user != null)
                {
                    user.Companies.Add(newCompany);
                }
            }
 
            _context.Companies.Add(newCompany);
            await _context.SaveChangesAsync();
 
            return CreatedAtAction(nameof(GetCompanies), new { id = newCompany.Id }, newCompany);
        }

        // DELETE: api/Companies/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCompany(int id)
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null) return NotFound();

            company.IsArchived = true; // Soft delete
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/Companies/{id}/unarchive
        [HttpPut("{id}/unarchive")]
        public async Task<IActionResult> UnarchiveCompany(int id)
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null) return NotFound();

            company.IsArchived = false;
            await _context.SaveChangesAsync();

            return Ok(company);
        }

        // PUT: api/Companies/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCompany(int id, Company updatedCompany)
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null) return NotFound();

            company.Name = updatedCompany.Name;
            company.RegistrationNumber = updatedCompany.RegistrationNumber;
            company.Address = updatedCompany.Address;
            company.City = updatedCompany.City;
            company.PostalCode = updatedCompany.PostalCode;
            company.Phone = updatedCompany.Phone;

            await _context.SaveChangesAsync();

            // Notification
            int.TryParse(Request.Query["userId"].ToString(), out int nUserId);
            if (nUserId > 0)
            {
                _context.Notifications.Add(new Notification
                {
                    UserId = nUserId,
                    CompanyId = company.Id,
                    Type = "company",
                    Title = "Profil mis a jour",
                    Message = $"Les informations de {company.Name} ont ete mises a jour.",
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();
            }

            return Ok(company);
        }

        // POST: api/Companies/{id}/logo
        [HttpPost("{id}/logo")]
        public async Task<IActionResult> UploadLogo(int id, IFormFile file)
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null) return NotFound();

            if (file == null || file.Length == 0)
                return BadRequest("Aucun fichier envoyé.");

            if (file.Length > 2 * 1024 * 1024)
                return BadRequest("Le fichier ne doit pas dépasser 2 Mo.");

            var allowedTypes = new[] { "image/png", "image/jpeg", "image/jpg", "image/webp" };
            if (!allowedTypes.Contains(file.ContentType.ToLower()))
                return BadRequest("Format non supporté. Utilisez PNG, JPG ou WEBP.");

            var ext = Path.GetExtension(file.FileName).ToLower();
            var fileName = $"company_{id}_logo{ext}";
            var logosDir = Path.Combine(_env.WebRootPath, "logos");

            if (!Directory.Exists(logosDir))
                Directory.CreateDirectory(logosDir);

            // Supprimer l'ancien logo s'il existe
            if (!string.IsNullOrEmpty(company.LogoPath))
            {
                var oldPath = Path.Combine(_env.WebRootPath, company.LogoPath);
                if (System.IO.File.Exists(oldPath))
                    System.IO.File.Delete(oldPath);
            }

            var filePath = Path.Combine(logosDir, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            company.LogoPath = $"logos/{fileName}";
            await _context.SaveChangesAsync();

            return Ok(new { logoUrl = company.LogoPath });
        }

        // DELETE: api/Companies/{id}/logo
        [HttpDelete("{id}/logo")]
        public async Task<IActionResult> DeleteLogo(int id)
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null) return NotFound();

            if (!string.IsNullOrEmpty(company.LogoPath))
            {
                var filePath = Path.Combine(_env.WebRootPath, company.LogoPath);
                if (System.IO.File.Exists(filePath))
                    System.IO.File.Delete(filePath);

                company.LogoPath = null;
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }
    }
}
