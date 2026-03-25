using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

// ══════════════════════════════════════════════════════════════════════════════
//  FICHIER : Utilisateur.cs
//  Note    : SocieteId conservé car l'utilisateur (la société qui possède le
//            système) reste lié à une Societe (émetteur des factures).
//            Ce n'est pas la même chose que Tiers (= destinataire/client).
// ══════════════════════════════════════════════════════════════════════════════
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

        /// <summary>Rôles possibles : Admin, Comptable, Commercial.</summary>
        [MaxLength(30)]
        public string Role { get; set; } = "Admin";
    }
}