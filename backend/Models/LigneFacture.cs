using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class LigneFacture
    {
        // ─── Clé primaire ─────────────────────────
        [Key]
        public int Numligne { get; set; }

        [MaxLength(200)]
        public string? Designation { get; set; }

        [Required]
        public int Quantite { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,3)")]
        public decimal PrixUnitaire { get; set; }

        /// <summary>Remise par ligne (%)</summary>
        [Column(TypeName = "decimal(5,2)")]
        [Range(0, 100)]
        public decimal RemiseLigne { get; set; } = 0;

        // ─── Montants ─────────────────────────────
        [Column(TypeName = "decimal(18,3)")]
        public decimal MontantHT { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal TauxTVA { get; set; }

        [Column(TypeName = "decimal(18,3)")]
        public decimal MontantTVA { get; set; }

        [Column(TypeName = "decimal(18,3)")]
        public decimal MontantTTC { get; set; }

        // ─── Relation avec Facture ─────────────────
        [ForeignKey("Facture")]
        public int NumeroFacture { get; set; }

        public Facture? Facture { get; set; }

        // ─── Relation avec Produit ─────────────────
        [ForeignKey("Produit")]
        public int ProduitId { get; set; }

        public Produit? Produit { get; set; }
    }
}