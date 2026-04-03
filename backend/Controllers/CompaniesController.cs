using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CompaniesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CompaniesController(ApplicationDbContext context)
        {
            _context = context;
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
                    .Where(u => u.MatriculeFiscal == company.RegistrationNumber && u.CompanyId == null)
                    .ToListAsync();

                if (usersToLink.Any())
                {
                    foreach (var u in usersToLink) u.CompanyId = company.Id;
                    changed = true;
                }
            }
            if (changed) await _context.SaveChangesAsync();
        }

        // POST: api/Companies
        [HttpPost]
        public async Task<ActionResult<Company>> CreateCompany(Company newCompany)
        {
            // Vérifier si le numéro d'enregistrement existe déjà
            if (await _context.Companies.AnyAsync(c => c.RegistrationNumber == newCompany.RegistrationNumber))
            {
                return BadRequest("Ce numéro d'enregistrement (matricule fiscal) est déjà utilisé.");
            }

            if (string.IsNullOrWhiteSpace(newCompany.Name))
            {
                return BadRequest("Le nom de la société est obligatoire.");
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

            _context.Companies.Remove(company);
            await _context.SaveChangesAsync();

            return NoContent();
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

            return Ok(company);
        }
    }
}
