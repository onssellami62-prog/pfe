using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TiersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TiersController(AppDbContext context)
        {
            _context = context;
        }

        // ── GET /api/tiers ───────────────────────────────────────────────
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var tiers = await _context.Tiers
                .OrderByDescending(t => t.DateCreation)
                .Select(t => new TiersDto
                {
                    Id = t.Id,
                    Nom = t.Nom,
                    TypeIdentifiant = t.TypeIdentifiant,
                    MatriculeFiscal = t.MatriculeFiscal,
                    CIN = t.CIN,
                    CarteSejourPasseport = t.CarteSejourPasseport,
                    MatriculeFiscalEtranger = t.MatriculeFiscalEtranger,
                    Adresse = t.Adresse,
                    Ville = t.Ville,
                    CodePostal = t.CodePostal,
                    Pays = t.Pays,
                    Email = t.Email,
                    Telephone = t.Telephone,
                    Telecopie = t.Telecopie,
                    Contact = t.Contact,
                    Profil = t.Profil,
                    ModeConnexion = t.ModeConnexion,
                    SiteWeb = t.SiteWeb,
                    TypeTiers = t.TypeTiers,
                    DateCreation = t.DateCreation,
                })
                .ToListAsync();

            return Ok(tiers);
        }

        // ── GET /api/tiers/{id} ──────────────────────────────────────────
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var t = await _context.Tiers.FindAsync(id);
            if (t == null) return NotFound(new { message = "Client introuvable." });
            return Ok(t);
        }

        // ── POST /api/tiers ──────────────────────────────────────────────
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] TiersCreateDto dto)
        {
            // Vérifier doublon matricule fiscal
            if (!string.IsNullOrWhiteSpace(dto.MatriculeFiscal))
            {
                var exists = await _context.Tiers
                    .AnyAsync(t => t.MatriculeFiscal == dto.MatriculeFiscal);
                if (exists)
                    return BadRequest(new { message = "Un client avec ce matricule fiscal existe déjà." });
            }

            // Vérifier doublon CIN
            if (!string.IsNullOrWhiteSpace(dto.CIN))
            {
                var exists = await _context.Tiers
                    .AnyAsync(t => t.CIN == dto.CIN);
                if (exists)
                    return BadRequest(new { message = "Un client avec ce CIN existe déjà." });
            }

            var tiers = new Tiers
            {
                Nom = dto.Nom,
                TypeIdentifiant = dto.TypeIdentifiant ?? "I-01",
                MatriculeFiscal = dto.MatriculeFiscal,
                CIN = dto.CIN,
                CarteSejourPasseport = dto.CarteSejourPasseport,
                MatriculeFiscalEtranger = dto.MatriculeFiscalEtranger,
                Adresse = dto.Adresse ?? string.Empty,
                Ville = dto.Ville,
                CodePostal = dto.CodePostal,
                Pays = dto.Pays ?? "TN",
                Email = dto.Email,
                Telephone = dto.Telephone,
                Telecopie = dto.Telecopie,
                Contact = dto.Contact,
                Profil = dto.Profil,
                ModeConnexion = dto.ModeConnexion,
                SiteWeb = dto.SiteWeb,
                DateCreation = DateTime.Now,
            };

            _context.Tiers.Add(tiers);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Client créé avec succès.", id = tiers.Id });
        }

        // ── PUT /api/tiers/{id} ──────────────────────────────────────────
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] TiersCreateDto dto)
        {
            var tiers = await _context.Tiers.FindAsync(id);
            if (tiers == null) return NotFound(new { message = "Client introuvable." });

            tiers.Nom = dto.Nom;
            tiers.TypeIdentifiant = dto.TypeIdentifiant ?? tiers.TypeIdentifiant;
            tiers.MatriculeFiscal = dto.MatriculeFiscal;
            tiers.CIN = dto.CIN;
            tiers.CarteSejourPasseport = dto.CarteSejourPasseport;
            tiers.MatriculeFiscalEtranger = dto.MatriculeFiscalEtranger;
            tiers.Adresse = dto.Adresse ?? string.Empty;
            tiers.Ville = dto.Ville;
            tiers.CodePostal = dto.CodePostal;
            tiers.Pays = dto.Pays ?? tiers.Pays;
            tiers.Email = dto.Email;
            tiers.Telephone = dto.Telephone;
            tiers.Telecopie = dto.Telecopie;
            tiers.Contact = dto.Contact;
            tiers.Profil = dto.Profil;
            tiers.ModeConnexion = dto.ModeConnexion;
            tiers.SiteWeb = dto.SiteWeb;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Client mis à jour avec succès." });
        }

        // ── DELETE /api/tiers/{id} ───────────────────────────────────────
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var tiers = await _context.Tiers.FindAsync(id);
            if (tiers == null) return NotFound(new { message = "Client introuvable." });

            // Vérifier si le tiers a des factures
            var hasFactures = await _context.Factures.AnyAsync(f => f.TiersId == id);
            if (hasFactures)
                return BadRequest(new { message = "Impossible de supprimer un client ayant des factures." });

            _context.Tiers.Remove(tiers);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Client supprimé avec succès." });
        }
    }

    // ── DTOs ─────────────────────────────────────────────────────────────
    public class TiersDto
    {
        public int Id { get; set; }
        public string Nom { get; set; } = string.Empty;
        public string TypeIdentifiant { get; set; } = "I-01";
        public string? MatriculeFiscal { get; set; }
        public string? CIN { get; set; }
        public string? CarteSejourPasseport { get; set; }
        public string? MatriculeFiscalEtranger { get; set; }
        public string? Adresse { get; set; }
        public string? Ville { get; set; }
        public string? CodePostal { get; set; }
        public string? Pays { get; set; }
        public string? Email { get; set; }
        public string? Telephone { get; set; }
        public string? Telecopie { get; set; }
        public string? Contact { get; set; }
        public string? Profil { get; set; }
        public string? ModeConnexion { get; set; }
        public string? SiteWeb { get; set; }
        public string TypeTiers { get; set; } = string.Empty;
        public DateTime DateCreation { get; set; }
    }

    public class TiersCreateDto
    {
        public string Nom { get; set; } = string.Empty;
        public string? TypeIdentifiant { get; set; }
        public string? MatriculeFiscal { get; set; }
        public string? CIN { get; set; }
        public string? CarteSejourPasseport { get; set; }
        public string? MatriculeFiscalEtranger { get; set; }
        public string? Adresse { get; set; }
        public string? Ville { get; set; }
        public string? CodePostal { get; set; }
        public string? Pays { get; set; }
        public string? Email { get; set; }
        public string? Telephone { get; set; }
        public string? Telecopie { get; set; }
        public string? Contact { get; set; }
        public string? Profil { get; set; }
        public string? ModeConnexion { get; set; }
        public string? SiteWeb { get; set; }
    }
}