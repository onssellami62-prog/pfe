using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UtilisateursController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UtilisateursController(AppDbContext context)
        {
            _context = context;
        }

        // ── GET tous les utilisateurs ────────────────────────────────────
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _context.Utilisateurs
                .Where(u => u.Role != "SuperAdmin")
                .Select(u => new
                {
                    u.Id,
                    u.Nom,
                    u.Email,
                    u.Role,
                    u.EstActif,
                    u.PremierConnexion,
                    permissions = u.Permissions != null
    ? JsonSerializer.Deserialize<List<string>>(u.Permissions, (JsonSerializerOptions?)null)
    : new List<string>()
                })
                .ToListAsync();

            return Ok(users);
        }

        // ── POST créer un employé ────────────────────────────────────────
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateEmployeDto dto)
        {
            if (await _context.Utilisateurs.AnyAsync(u => u.Email == dto.Email))
                return BadRequest(new { message = "Cet email est déjà utilisé." });

            // Générer mot de passe temporaire
            var motDePasseTemp = GeneratePassword();

            var user = new Utilisateur
            {
                Nom = dto.Nom,
                Email = dto.Email.ToLower().Trim(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(motDePasseTemp),
                Role = dto.Role ?? "Employe",
                Permissions = JsonSerializer.Serialize(dto.Permissions ?? new List<string>()),
                PremierConnexion = true,
                EstActif = true
            };

            _context.Utilisateurs.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Compte employé créé avec succès.",
                id = user.Id,
                email = user.Email,
                motDePasseTemp,  // ← à transmettre à l'employé
                note = "L'employé devra changer son mot de passe à la première connexion."
            });
        }

        // ── PUT modifier permissions ─────────────────────────────────────
        [HttpPut("{id}/permissions")]
        public async Task<IActionResult> UpdatePermissions(int id, [FromBody] UpdatePermissionsDto dto)
        {
            var user = await _context.Utilisateurs.FindAsync(id);
            if (user == null)
                return NotFound(new { message = "Utilisateur introuvable." });

            user.Permissions = JsonSerializer.Serialize(dto.Permissions ?? new List<string>());
            await _context.SaveChangesAsync();

            return Ok(new { message = "Permissions mises à jour." });
        }

        // ── PUT activer/désactiver ───────────────────────────────────────
        [HttpPut("{id}/toggle")]
        public async Task<IActionResult> Toggle(int id)
        {
            var user = await _context.Utilisateurs.FindAsync(id);
            if (user == null)
                return NotFound(new { message = "Utilisateur introuvable." });

            user.EstActif = !user.EstActif;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = user.EstActif ? "Compte activé." : "Compte désactivé.",
                estActif = user.EstActif
            });
        }

        // ── DELETE supprimer un employé ──────────────────────────────────
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var user = await _context.Utilisateurs.FindAsync(id);
            if (user == null)
                return NotFound(new { message = "Utilisateur introuvable." });

            if (user.Role == "SuperAdmin")
                return BadRequest(new { message = "Impossible de supprimer le Super Admin." });

            _context.Utilisateurs.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Employé supprimé." });
        }

        // ── Générer mot de passe temporaire ─────────────────────────────
        private static string GeneratePassword()
        {
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
            var random = new Random();
            return new string(Enumerable.Repeat(chars, 10)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        }
    }

    // ── DTOs ─────────────────────────────────────────────────────────────
    public class CreateEmployeDto
    {
        public string Nom { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Role { get; set; }
        public List<string>? Permissions { get; set; }
    }

    public class UpdatePermissionsDto
    {
        public List<string>? Permissions { get; set; }
    }
}