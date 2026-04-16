using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // ── REGISTER ────────────────────────────────────────────────────────
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (await _context.Utilisateurs.AnyAsync(u => u.Email == dto.Email))
                return BadRequest(new { message = "Cet email est déjà utilisé." });

            var user = new Utilisateur
            {
                Nom = dto.Nom,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = dto.Role ?? "Admin"
            };

            _context.Utilisateurs.Add(user);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Utilisateur créé avec succès." });
        }

        // ── LOGIN ────────────────────────────────────────────────────────────
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var user = await _context.Utilisateurs
                .FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (user == null)
                return Unauthorized(new { message = "Email ou mot de passe incorrect." });

            if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                return Unauthorized(new { message = "Email ou mot de passe incorrect." });

            var jwtSettings = _configuration.GetSection("Jwt");
            var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Name,           user.Email),
                    new Claim(ClaimTypes.Role,           user.Role)
                }),
                Expires = DateTime.UtcNow.AddHours(8),
                Issuer = jwtSettings["Issuer"],
                Audience = jwtSettings["Audience"],
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.WriteToken(tokenHandler.CreateToken(tokenDescriptor));

            return Ok(new
            {
                token,
                name = user.Nom,
                email = user.Email,
                role = user.Role,
                premierConnexion = user.PremierConnexion
            });
        }

        // ── CHANGE PASSWORD ──────────────────────────────────────────────────
        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var user = await _context.Utilisateurs
                .FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (user == null)
                return NotFound(new { message = "Utilisateur introuvable." });

            if (!BCrypt.Net.BCrypt.Verify(dto.AncienPassword, user.PasswordHash))
                return Unauthorized(new { message = "Ancien mot de passe incorrect." });

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NouveauPassword);
            user.PremierConnexion = false;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Mot de passe modifié avec succès." });
        }
    }

    // ── DTOs ─────────────────────────────────────────────────────────────────
    public class LoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class RegisterDto
    {
        public string Nom { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? Role { get; set; }
    }

    public class ChangePasswordDto
    {
        public string Email { get; set; } = string.Empty;
        public string AncienPassword { get; set; } = string.Empty;
        public string NouveauPassword { get; set; } = string.Empty;
    }
}