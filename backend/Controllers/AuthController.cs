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

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login(LoginDto loginDto)
        {
            UserModel user = await _context.Users
                .Include(u => u.Company)
                .FirstOrDefaultAsync(u => u.Email == loginDto.Email);

            if (user == null || user.Password != loginDto.Password)
            {
                return Unauthorized("Email ou mot de passe incorrect.");
            }

            // Vérifier le statut d'approbation (Seulement pour les clients)
            // On ignore la casse (Upper/Lower) pour ADMIN et Status
            bool isAdmin = user.Role != null && user.Role.Equals("admin", StringComparison.OrdinalIgnoreCase);
            bool isActive = (user.Status != null && (user.Status.Equals("Active", StringComparison.OrdinalIgnoreCase) || user.Status.Equals("Actif", StringComparison.OrdinalIgnoreCase))) 
                            || (string.IsNullOrEmpty(user.Status) && user.Actif);

            if (!isAdmin && !isActive)
            {
                if (user.Status != null && user.Status.Equals("Refused", StringComparison.OrdinalIgnoreCase))
                    return BadRequest("Votre demande d'inscription a été refusée.");
                
                return BadRequest("Votre compte est en attente de validation par l'administrateur.");
            }

            // Mettre à jour la dernière activité
            user.LastActivity = DateTime.Now;
            await _context.SaveChangesAsync();

            var token = CreateToken(user);

            // Obtenir l'adresse de la société ou une valeur par défaut
            string companyAddress = user.Company?.Address ?? "Avenue Habib Bourguiba, 1001 Tunis";
            if (user.Company != null && !string.IsNullOrEmpty(user.Company.City))
                companyAddress = $"{user.Company.Address}, {user.Company.PostalCode} {user.Company.City}";

            return Ok(new AuthResponseDto
            {
                Token = token,
                Email = user.Email,
                Name = user.Name,
                Entreprise = user.Entreprise,
                MatriculeFiscal = user.MatriculeFiscal,
                Role = user.Role,
                CompanyId = user.CompanyId,
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
                return Ok("L'admin existait déjà, son statut a été mis à jour à 'Active'.");
            }

            var admin = new UserModel
            {
                Email = "ja7479845@gmail.com",
                Password = "123",
                Name = "Admin Central",
                Role = "admin",
                Username = "admin",
                Status = "Active" // L'admin est toujours actif
            };

            _context.Users.Add(admin);
            await _context.SaveChangesAsync();

            return Ok("Admin créé avec succès ! Login: ja7479845@gmail.com / Pass: 123");
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(UserModel newUser)
        {
            if (await _context.Users.AnyAsync(u => u.Email == newUser.Email))
            {
                return BadRequest("Cet email est déjà utilisé.");
            }

            // Normes MF El Fatoora (13 car.)
            if (string.IsNullOrEmpty(newUser.MatriculeFiscal) || newUser.MatriculeFiscal.Length != 13)
            {
                return BadRequest("Le MF doit contenir 13 caractères (ex: 1234567XAM000).");
            }

            newUser.Role = "CLIENT";
            newUser.Status = "Pending"; // Toujours en attente à l'inscription

            // Créer ou lier la société automatiquement
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
                    newUser.CompanyId = newCompany.Id;
                }
                else
                {
                    newUser.CompanyId = existingCompany.Id;
                }
            }

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Demande d'inscription envoyée. En attente de validation." });
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
