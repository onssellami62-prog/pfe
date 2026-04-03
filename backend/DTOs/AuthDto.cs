using System;

namespace backend.DTOs
{
    public class LoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Entreprise { get; set; } = string.Empty;
        public string MatriculeFiscal { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public int? CompanyId { get; set; }
        public DateTime? LastActivity { get; set; }
    }
}
