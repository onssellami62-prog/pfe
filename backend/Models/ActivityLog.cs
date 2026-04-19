using System;
using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class ActivityLog
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Actor { get; set; } = string.Empty; // Nom de l'utilisateur (ex: UserName)

        [Required]
        public string Action { get; set; } = string.Empty; // Description de l'action

        [Required]
        public string TargetInfo { get; set; } = string.Empty; // Nom de l'entité concernée (ex: EntityName)

        [Required]
        public string Type { get; set; } = string.Empty; // Type d'action (ex: user_creation, invoice_creation)

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
