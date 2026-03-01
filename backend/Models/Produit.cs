using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class Produit
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(150)]
        public string Nom { get; set; } = string.Empty;

        [Required]
        public decimal PrixUnitaire { get; set; }

        [Required]
        public decimal TauxTVA { get; set; }

        [MaxLength(250)]
        public string? Description { get; set; }

        // 🔹 Relation avec Societe (multi-société)
        [ForeignKey("Societe")]
        public int SocieteId { get; set; }
        public Societe? Societe { get; set; }
    }
}