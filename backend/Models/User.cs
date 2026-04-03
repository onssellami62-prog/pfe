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
        public string Status { get; set; } = "Pending"; // Pending, Active, Refused
        public bool Actif { get; set; } = true;
        
        public int? CompanyId { get; set; }
        public Company? Company { get; set; }
        public DateTime? LastActivity { get; set; }
    }
}
