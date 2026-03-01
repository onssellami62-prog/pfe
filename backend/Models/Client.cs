using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class Client
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(150)]
        public string Nom { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? MatriculeFiscal { get; set; }

        [MaxLength(250)]
        public string Adresse { get; set; } = string.Empty;

        [EmailAddress]
        public string? Email { get; set; }

        // 🔹 Relation avec Societe
        [ForeignKey("Societe")]
        public int SocieteId { get; set; }
        public Societe? Societe { get; set; }
    }
}