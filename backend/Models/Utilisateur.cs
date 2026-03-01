namespace backend.Models
{
    public class Utilisateur
    {
        public int Id { get; set; }

        public string Nom { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string PasswordHash { get; set; } = string.Empty;

        public string Role { get; set; } = "Admin";

        public int SocieteId { get; set; }

        public Societe? Societe { get; set; }

    }
   
    }