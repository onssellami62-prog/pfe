using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;
using backend.Data;
using backend.Models;
using UserModel = backend.Models.User;
using backend.DTOs;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using backend.Services;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;

        public AuthController(ApplicationDbContext context, IConfiguration configuration, IEmailService emailService)
        {
            _context = context;
            _configuration = configuration;
            _emailService = emailService;
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login(LoginDto loginDto)
        {
            UserModel user = await _context.Users
                .Include(u => u.Companies)
                .FirstOrDefaultAsync(u => u.Email == loginDto.Email);

            if (user == null || user.Password != loginDto.Password)
            {
                return Unauthorized("Email ou mot de passe incorrect.");
            }

            // VÃ©rifier le statut d'approbation (Seulement pour les clients)
            // On ignore la casse (Upper/Lower) pour ADMIN et Status
            bool isAdmin = user.Role != null && user.Role.Equals("admin", StringComparison.OrdinalIgnoreCase);
            bool isActive = (user.Status != null && (user.Status.Equals("Active", StringComparison.OrdinalIgnoreCase) || user.Status.Equals("Actif", StringComparison.OrdinalIgnoreCase))) 
                            || (string.IsNullOrEmpty(user.Status) && user.Actif);

            if (!isAdmin && !isActive)
            {
                if (user.Status != null && user.Status.Equals("Refused", StringComparison.OrdinalIgnoreCase))
                    return BadRequest("Votre demande d'inscription a Ã©tÃ© refusÃ©e.");
                
                return BadRequest("Votre compte est en attente de validation par l'administrateur.");
            }

            if (user.IsFirstLogin && !isAdmin)
            {
                var random = new Random();
                string otp = random.Next(100000, 999999).ToString();
                
                user.OtpCode = otp;
                user.OtpExpiryTime = DateTime.Now.AddMinutes(5);
                await _context.SaveChangesAsync();

                await _emailService.SendEmailAsync(
                    user.Email,
                    "Code de vÃ©rification - PremiÃ¨re connexion",
                    $"Bonjour {user.Name},\n\nVotre code de vÃ©rification OTP est : {otp}\nCe code est valable pendant 5 minutes."
                );

                return Ok(new { requireOtp = true, email = user.Email, message = "Un code OTP a Ã©tÃ© envoyÃ© Ã  votre email." });
            }

            // Mettre Ã  jour la derniÃ¨re activitÃ©
            user.LastActivity = DateTime.Now;
            await _context.SaveChangesAsync();

            var token = CreateToken(user);

            // Obtenir l'adresse de la premiÃ¨re sociÃ©tÃ© ou une valeur par dÃ©faut
            var firstCompany = user.Companies?.FirstOrDefault();
            string companyAddress = firstCompany?.Address ?? "Avenue Habib Bourguiba, 1001 Tunis";
            if (firstCompany != null && !string.IsNullOrEmpty(firstCompany.City))
                companyAddress = $"{firstCompany.Address}, {firstCompany.PostalCode} {firstCompany.City}";

            return Ok(new AuthResponseDto
            {
                UserId = user.Id,
                Token = token,
                Email = user.Email,
                Name = user.Name,
                Entreprise = user.Entreprise,
                MatriculeFiscal = user.MatriculeFiscal,
                Role = user.Role,
                CompanyId = firstCompany?.Id,
                Rne = firstCompany != null ? (firstCompany.RNE ?? string.Empty) : string.Empty,
                Phone = firstCompany != null ? (firstCompany.Phone ?? string.Empty) : string.Empty,
                Companies = user.Companies.Select(c => new CompanySummaryDto 
                { 
                    Id = c.Id, 
                    Name = c.Name, 
                    RegistrationNumber = c.RegistrationNumber 
                }).ToList(),
                LastActivity = user.LastActivity,
                Address = companyAddress
            });
        }

        [HttpPost("verify-otp")]
        public async Task<ActionResult<AuthResponseDto>> VerifyOtp([FromBody] VerifyOtpDto dto)
        {
            UserModel user = await _context.Users
                .Include(u => u.Companies)
                .FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (user == null || user.OtpCode != dto.OtpCode || user.OtpExpiryTime < DateTime.Now)
            {
                return BadRequest("Code OTP invalide ou expirÃ©.");
            }

            user.IsFirstLogin = false;
            user.OtpCode = null;
            user.OtpExpiryTime = null;
            user.LastActivity = DateTime.Now;
            await _context.SaveChangesAsync();

            var token = CreateToken(user);
            
            var firstCompany = user.Companies?.FirstOrDefault();
            string companyAddress = firstCompany?.Address ?? "Avenue Habib Bourguiba, 1001 Tunis";
            if (firstCompany != null && !string.IsNullOrEmpty(firstCompany.City))
                companyAddress = $"{firstCompany.Address}, {firstCompany.PostalCode} {firstCompany.City}";

            return Ok(new AuthResponseDto
            {
                UserId = user.Id,
                Token = token,
                Email = user.Email,
                Name = user.Name,
                Entreprise = user.Entreprise,
                MatriculeFiscal = user.MatriculeFiscal,
                Role = user.Role,
                CompanyId = firstCompany?.Id,
                Rne = firstCompany != null ? (firstCompany.RNE ?? string.Empty) : string.Empty,
                Phone = firstCompany != null ? (firstCompany.Phone ?? string.Empty) : string.Empty,
                Companies = user.Companies.Select(c => new CompanySummaryDto 
                { 
                    Id = c.Id, 
                    Name = c.Name, 
                    RegistrationNumber = c.RegistrationNumber 
                }).ToList(),
                LastActivity = user.LastActivity,
                Address = companyAddress
            });
        }

        [HttpGet("seed-admin")]
        public async Task<IActionResult> SeedAdmin()
        {
            var existingAdmin = await _context.Users.FirstOrDefaultAsync(u => u.Email == "ja7479845@gmail.com");

            if (existingAdmin != null)
            {
                existingAdmin.Status = "Active";
                existingAdmin.Role = "admin";
                await _context.SaveChangesAsync();
                return Ok("L'admin existait dÃ©jÃ , son statut a Ã©tÃ© mis Ã  jour Ã  'Active'.");
            }

            var admin = new UserModel
            {
                Email = "ja7479845@gmail.com",
                Password = "Admin@2026",
                Name = "Admin Central",
                Role = "admin",
                Username = "admin",
                Status = "Active" // L'admin est toujours actif
            };

            _context.Users.Add(admin);
            await _context.SaveChangesAsync();

            return Ok("Admin crÃ©Ã© avec succÃ¨s ! Login: ja7479845@gmail.com / Pass: Admin@2026");
        }

        /// <summary>
        /// Met Ã  jour tous les mots de passe existants avec des mots de passe alÃ©atoires conformes aux rÃ¨gles de complexitÃ©.
        /// </summary>
        [HttpGet("upgrade-passwords")]
        public async Task<IActionResult> UpgradePasswords()
        {
            var users = await _context.Users.ToListAsync();
            var results = new List<object>();
            var random = new Random();
            string upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            string lowerChars = "abcdefghijklmnopqrstuvwxyz";
            string digits = "0123456789";
            string specials = "@#$*!";
            string allChars = upperChars + lowerChars + digits + specials;

            foreach (var user in users)
            {
                // GÃ©nÃ©rer un mot de passe alÃ©atoire de 10 caractÃ¨res
                var passwordChars = new List<char>
                {
                    upperChars[random.Next(upperChars.Length)],
                    upperChars[random.Next(upperChars.Length)],
                    lowerChars[random.Next(lowerChars.Length)],
                    lowerChars[random.Next(lowerChars.Length)],
                    digits[random.Next(digits.Length)],
                    digits[random.Next(digits.Length)],
                    specials[random.Next(specials.Length)],
                };
                // ComplÃ©ter Ã  10 caractÃ¨res
                for (int i = passwordChars.Count; i < 10; i++)
                    passwordChars.Add(allChars[random.Next(allChars.Length)]);

                // MÃ©langer les caractÃ¨res
                for (int i = passwordChars.Count - 1; i > 0; i--)
                {
                    int j = random.Next(i + 1);
                    (passwordChars[i], passwordChars[j]) = (passwordChars[j], passwordChars[i]);
                }

                string newPassword = new string(passwordChars.ToArray());
                string oldPassword = user.Password;
                user.Password = newPassword;

                results.Add(new { user.Id, user.Name, user.Email, OldPassword = oldPassword, NewPassword = newPassword });
            }

            await _context.SaveChangesAsync();
            return Ok(results);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(UserModel newUser)
        {
            // Validation du format email (@gmail.com uniquement)
            if (string.IsNullOrWhiteSpace(newUser.Email) || 
                !System.Text.RegularExpressions.Regex.IsMatch(newUser.Email.Trim(), @"^[a-zA-Z0-9._%+-]+@gmail\.com$", System.Text.RegularExpressions.RegexOptions.IgnoreCase))
            {
                return BadRequest("L'email doit Ãªtre une adresse Gmail valide (exemple@gmail.com).");
            }

            // VÃ©rifier l'unicitÃ© de l'email (insensible Ã  la casse)
            if (await _context.Users.AnyAsync(u => u.Email.ToLower() == newUser.Email.Trim().ToLower()))
            {
                return BadRequest("Cet email est dÃ©jÃ  utilisÃ©.");
            }

            // Validation de la complexitÃ© du mot de passe
            if (string.IsNullOrEmpty(newUser.Password) || newUser.Password.Length < 8 ||
                !System.Text.RegularExpressions.Regex.IsMatch(newUser.Password, @"[A-Z]") ||
                !System.Text.RegularExpressions.Regex.IsMatch(newUser.Password, @"[a-z]") ||
                !System.Text.RegularExpressions.Regex.IsMatch(newUser.Password, @"\d") ||
                !System.Text.RegularExpressions.Regex.IsMatch(newUser.Password, @"[@#$*!]"))
            {
                return BadRequest("Le mot de passe doit contenir au moins 8 caractÃ¨res, une majuscule, une minuscule, un chiffre et un caractÃ¨re spÃ©cial (@#$*!).");
            }

            // Normes MF El Fatoora (13 car.)
            if (string.IsNullOrEmpty(newUser.MatriculeFiscal) || newUser.MatriculeFiscal.Length != 13)
            {
                return BadRequest("Le MF doit contenir 13 caractÃ¨res (ex: 1234567XAM000).");
            }

            newUser.Role = "CLIENT";
            newUser.Status = "Pending"; // Toujours en attente Ã  l'inscription

            // CrÃ©er ou lier la sociÃ©tÃ© automatiquement
            if (!string.IsNullOrEmpty(newUser.Entreprise) && !string.IsNullOrEmpty(newUser.MatriculeFiscal))
            {
                var existingCompany = await _context.Companies.FirstOrDefaultAsync(c => c.RegistrationNumber == newUser.MatriculeFiscal);
                if (existingCompany == null)
                {
                    var newCompany = new Company
                    {
                        Name = newUser.Entreprise,
                        RegistrationNumber = newUser.MatriculeFiscal
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

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Demande d'inscription envoyÃ©e. En attente de validation." });
        }

        // POST: api/auth/forgot-password
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.Trim().ToLower());
            if (user == null)
                return BadRequest("Aucun compte associÃ© Ã  cet email.");

            var random = new Random();
            string otp = random.Next(100000, 999999).ToString();

            user.OtpCode = otp;
            user.OtpExpiryTime = DateTime.Now.AddMinutes(5);
            await _context.SaveChangesAsync();

            await _emailService.SendEmailAsync(
                user.Email,
                "RÃ©initialisation de mot de passe - El Fatoora",
                $"Bonjour {user.Name},\n\nVotre code de rÃ©initialisation est : {otp}\nCe code est valable pendant 5 minutes.\n\nSi vous n'avez pas demandÃ© cette rÃ©initialisation, ignorez cet email."
            );

            return Ok(new { message = "Un code de vÃ©rification a Ã©tÃ© envoyÃ© Ã  votre email." });
        }

        // POST: api/auth/verify-reset-code
        [HttpPost("verify-reset-code")]
        public async Task<IActionResult> VerifyResetCode([FromBody] VerifyOtpDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.Trim().ToLower());
            if (user == null)
                return BadRequest("Aucun compte associÃ© Ã  cet email.");

            if (user.OtpCode != dto.OtpCode || user.OtpExpiryTime < DateTime.Now)
                return BadRequest("Code invalide ou expirÃ©.");

            return Ok(new { message = "Code vÃ©rifiÃ© avec succÃ¨s." });
        }

        // POST: api/auth/reset-password
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.Trim().ToLower());
            if (user == null)
                return BadRequest("Aucun compte associÃ© Ã  cet email.");

            // Re-vÃ©rifier le OTP (sÃ©curitÃ©)
            if (user.OtpCode != dto.OtpCode || user.OtpExpiryTime < DateTime.Now)
                return BadRequest("Code invalide ou expirÃ©. Veuillez recommencer.");

            // Validation de la complexitÃ© du mot de passe
            if (string.IsNullOrEmpty(dto.NewPassword) || dto.NewPassword.Length < 8 ||
                !System.Text.RegularExpressions.Regex.IsMatch(dto.NewPassword, @"[A-Z]") ||
                !System.Text.RegularExpressions.Regex.IsMatch(dto.NewPassword, @"[a-z]") ||
                !System.Text.RegularExpressions.Regex.IsMatch(dto.NewPassword, @"\d") ||
                !System.Text.RegularExpressions.Regex.IsMatch(dto.NewPassword, @"[@#$*!]"))
            {
                return BadRequest("Le mot de passe doit contenir au moins 8 caractÃ¨res, une majuscule, une minuscule, un chiffre et un caractÃ¨re spÃ©cial (@#$*!).");
            }

            user.Password = dto.NewPassword;
            user.OtpCode = null;
            user.OtpExpiryTime = null;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Mot de passe modifiÃ© avec succÃ¨s." });
        }

        private string CreateToken(UserModel user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("userId", user.Id.ToString())
            };

            var jwtKey = "ElFatoora_Super_Secret_Secure_Key_2026_For_PFE_Project_Management_System_Tunisia_TradeNet_Integration_1234567890!";
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.Now.AddDays(120),
                SigningCredentials = creds,
                Issuer = _configuration["Jwt:Issuer"] ?? "http://localhost:5170",
                Audience = _configuration["Jwt:Audience"] ?? "http://localhost:3000"
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }
    }
}


