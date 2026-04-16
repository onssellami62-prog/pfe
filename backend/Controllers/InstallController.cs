using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InstallController : ControllerBase
    {
        private readonly AppDbContext _context;

        public InstallController(AppDbContext context)
        {
            _context = context;
        }

        // ── Vérifier si installation nécessaire ──────────────────────────
        [HttpGet("status")]
        public async Task<IActionResult> Status()
        {
            var installed = await _context.Utilisateurs
                .AnyAsync(u => u.Role == "SuperAdmin");

            return Ok(new { installed });
        }

        // ── Créer le Super Admin (une seule fois) ────────────────────────
        [HttpPost("setup")]
        public async Task<IActionResult> Setup([FromBody] InstallDto dto)
        {
            // Vérifier que l'installation n'a pas déjà été faite
            var dejaInstalle = await _context.Utilisateurs
                .AnyAsync(u => u.Role == "SuperAdmin");

            if (dejaInstalle)
                return StatusCode(403, new { message = "Installation déjà effectuée. Cet endpoint est désactivé." });

            // Validation
            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest(new { message = "L'email est obligatoire." });

            if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 8)
                return BadRequest(new { message = "Le mot de passe doit contenir au moins 8 caractères." });

            if (dto.Password != dto.ConfirmPassword)
                return BadRequest(new { message = "Les mots de passe ne correspondent pas." });

            // Créer le Super Admin
            var superAdmin = new Utilisateur
            {
                Nom = dto.Nom,
                Email = dto.Email.ToLower().Trim(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = "SuperAdmin",
                PremierConnexion = false,
                EstActif = true
            };

            _context.Utilisateurs.Add(superAdmin);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Installation réussie ! Vous pouvez maintenant vous connecter." });
        }
    }

    // ── DTO ───────────────────────────────────────────────────────────────
    public class InstallDto
    {
        public string Nom { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}