using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Mail;
using System.Security.Claims;
using System.Security.Cryptography;
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

        // ── CHECK STATUS ─────────────────────────────────────────────────────
        [HttpGet("check-status")]
        [Authorize]
        public async Task<IActionResult> CheckStatus()
        {
            var email = User.Identity?.Name;
            var user = await _context.Utilisateurs
                .FirstOrDefaultAsync(u => u.Email == email);

            if (user == null || !user.EstActif)
                return Unauthorized(new { message = "Compte désactivé ou supprimé." });

            return Ok(new { active = true });
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
                premierConnexion = user.PremierConnexion,
                permissions = user.Permissions != null
                    ? System.Text.Json.JsonSerializer.Deserialize<List<string>>(user.Permissions)
                    : new List<string>()
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

        // ── FORGOT PASSWORD ──────────────────────────────────────────────────
        [HttpPost("forgot_password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            var user = await _context.Utilisateurs
                .FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower().Trim());

            if (user == null)
                return NotFound(new { message = "Adresse e-mail introuvable." });

            var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
            var expiry = DateTime.UtcNow.AddMinutes(15);

            user.ResetPasswordToken = token;
            user.ResetPasswordTokenExpiry = expiry;
            await _context.SaveChangesAsync();

            var frontendUrl = _configuration["Frontend:Url"] ?? "http://localhost:3000";
            var resetLink = $"{frontendUrl}/reset-password?token={token}";
            await SendResetEmailAsync(user.Email, user.Nom, resetLink);

            return Ok(new { message = "Lien de réinitialisation envoyé." });
        }

        // ── VERIFY RESET TOKEN ───────────────────────────────────────────────
        [HttpGet("reset-password")]
        public async Task<IActionResult> VerifyResetToken([FromQuery] string token)
        {
            if (string.IsNullOrWhiteSpace(token))
                return BadRequest(new { message = "Token manquant." });

            var user = await _context.Utilisateurs
                .FirstOrDefaultAsync(u => u.ResetPasswordToken == token);

            if (user == null)
                return BadRequest(new { message = "Lien invalide ou déjà utilisé." });

            if (user.ResetPasswordTokenExpiry == null || user.ResetPasswordTokenExpiry < DateTime.UtcNow)
                return BadRequest(new { message = "Ce lien a expiré. Veuillez en demander un nouveau." });

            return Ok(new { valid = true, email = user.Email });
        }

        // ── RESET PASSWORD ───────────────────────────────────────────────────
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Token))
                return BadRequest(new { message = "Token manquant." });

            if (dto.Password != dto.PasswordConfirmation)
                return BadRequest(new { message = "Les mots de passe ne correspondent pas." });

            if (dto.Password.Length < 8)
                return BadRequest(new { message = "Le mot de passe doit contenir au moins 8 caractères." });

            var user = await _context.Utilisateurs
                .FirstOrDefaultAsync(u => u.ResetPasswordToken == dto.Token);

            if (user == null)
                return BadRequest(new { message = "Lien invalide ou déjà utilisé." });

            if (user.ResetPasswordTokenExpiry == null || user.ResetPasswordTokenExpiry < DateTime.UtcNow)
                return BadRequest(new { message = "Ce lien a expiré. Veuillez en demander un nouveau." });

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            user.ResetPasswordToken = null;
            user.ResetPasswordTokenExpiry = null;
            user.PremierConnexion = false;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Mot de passe réinitialisé avec succès." });
        }

        // ── SEND RESET EMAIL (SMTP) ──────────────────────────────────────────
        private async Task SendResetEmailAsync(string toEmail, string nom, string resetLink)
        {
            var smtp = _configuration.GetSection("Smtp");

            using var client = new SmtpClient(smtp["Host"], int.Parse(smtp["Port"]!))
            {
                Credentials = new NetworkCredential(smtp["User"], smtp["Password"]),
                EnableSsl = true
            };

            var mail = new MailMessage
            {
                From = new MailAddress(smtp["From"]!, "El Fatoora"),
                Subject = "Réinitialisation de votre mot de passe",
                IsBodyHtml = true,
                Body = $@"
                    <div style='font-family:DM Sans,sans-serif;max-width:520px;margin:auto;'>
                        <div style='background:#2347C8;padding:24px 32px;border-radius:12px 12px 0 0;'>
                            <h2 style='color:#fff;margin:0;'>El Fatoora</h2>
                        </div>
                        <div style='background:#fff;padding:32px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px;'>
                            <p style='font-size:16px;color:#111;'>Bonjour <strong>{nom}</strong>,</p>
                            <p style='color:#6b7280;'>Vous avez demandé la réinitialisation de votre mot de passe.</p>
                            <p style='color:#6b7280;'>Cliquez sur le bouton ci-dessous. Ce lien expire dans <strong>15 minutes</strong>.</p>
                            <div style='text-align:center;margin:32px 0;'>
                                <a href='{resetLink}'
                                   style='background:#1a3db5;color:#fff;padding:14px 32px;border-radius:10px;
                                          text-decoration:none;font-weight:600;font-size:15px;'>
                                    Réinitialiser mon mot de passe
                                </a>
                            </div>
                            <p style='color:#9ca3af;font-size:12px;'>
                                Si vous n'avez pas fait cette demande, ignorez cet e-mail.<br/>
                                Sécurisé par <strong>Tunisie TradeNet</strong>
                            </p>
                        </div>
                    </div>"
            };

            mail.To.Add(toEmail);
            await client.SendMailAsync(mail);
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

    public class ForgotPasswordDto
    {
        public string Email { get; set; } = string.Empty;
    }

    public class ResetPasswordDto
    {
        public string Token { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string PasswordConfirmation { get; set; } = string.Empty;
    }
}