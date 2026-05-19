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

        /// <summary>JSON array des pages accessibles ex: ["factures","clients","statistiques"]</summary>
        [MaxLength(500)]
        public string? Permissions { get; set; }

        /// <summary>Rôles : SuperAdmin, Admin, Comptable, Commercial</summary>
        [MaxLength(30)]
        public string Role { get; set; } = "Admin";

        public bool PremierConnexion { get; set; } = true;
        public bool EstActif { get; set; } = true;

        // ── Mot de passe oublié ───────────────────────────────────────
        // Token généré à l'étape 6 (POST /forgot_password)
        // Mis à null après réinitialisation réussie (étape 16)
        public string? ResetPasswordToken { get; set; }

        // Expiration du token : 15 min après génération
        public DateTime? ResetPasswordTokenExpiry { get; set; }
    }
}