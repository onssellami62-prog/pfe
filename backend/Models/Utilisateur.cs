using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class Utilisateur
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(150)]
        public string Nom { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        /// <summary>Rôles : SuperAdmin, Admin, Comptable, Commercial</summary>
        [MaxLength(30)]
        public string Role { get; set; } = "Admin";

        public bool PremierConnexion { get; set; } = true;
        public bool EstActif { get; set; } = true;
    }
}