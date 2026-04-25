using System;

namespace backend.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = "user"; // "admin", "user"
        public string Name { get; set; } = string.Empty;
        public string Entreprise { get; set; } = string.Empty;
        public string MatriculeFiscal { get; set; } = string.Empty;
        public string RNE { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending"; // Pending, Active, Refused
        public bool Actif { get; set; } = true;
        public bool IsFirstLogin { get; set; } = true;
        public string? OtpCode { get; set; }
        public DateTime? OtpExpiryTime { get; set; }
        
        public ICollection<Company> Companies { get; set; } = new List<Company>();
        public DateTime? LastActivity { get; set; }
    }
}
