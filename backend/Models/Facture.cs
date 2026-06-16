using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class Facture
    {
        // ─── Clé primaire ──────────────────────────────────────────────
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]  // ← ajouté ici
        [Required]
        public int NumeroFacture { get; set; }

        // ─── Référence TTN ─────────────────────────────────────────────
        [MaxLength(100)]
        public string? IdSaveEfact { get; set; }

        [MaxLength(70)]
        public string? IdTTN { get; set; }

        [MaxLength(4000)]
        public string? ReferenceCev { get; set; }

        public DateTime? DateReferenceTTN { get; set; }

        // ─── Type de document ──────────────────────────────────────────
        [MaxLength(10)]
        public string TypeDocument { get; set; } = "I-11";

        public int? FactureOrigineId { get; set; }
        [ForeignKey("FactureOrigineId")]
        public Facture? FactureOrigine { get; set; }

        // ─── Dates ─────────────────────────────────────────────────────
        [Required]
        public DateTime DateFacture { get; set; } = DateTime.Now;

        public DateTime? DateValidation { get; set; }
        public DateTime? DateLimitePaiement { get; set; }
        public DateTime? PeriodeDu { get; set; }
        public DateTime? PeriodeAu { get; set; }

        // ─── Timbre fiscal ─────────────────────────────────────────────
        public bool TimbreFiscal { get; set; } = false;

        [Column(TypeName = "decimal(18,3)")]
        public decimal MontantTimbre { get; set; } = 0;

        // ─── Remise globale ────────────────────────────────────────────
        [Column(TypeName = "decimal(5,2)")]
        [Range(0, 100)]
        public decimal RemiseGlobale { get; set; } = 0;

        [Column(TypeName = "decimal(18,3)")]
        public decimal MontantRemise { get; set; } = 0;

        // ─── Totaux ────────────────────────────────────────────────────
        [Column(TypeName = "decimal(18,3)")]
        public decimal TotalHTAvantRemise { get; set; }

        [Column(TypeName = "decimal(18,3)")]
        public decimal TotalHT { get; set; }

        [Column(TypeName = "decimal(18,3)")]
        public decimal TotalTVA { get; set; }

        [Column(TypeName = "decimal(18,3)")]
        public decimal MontantTTC { get; set; }

        [MaxLength(500)]
        public string? MontantEnLettres { get; set; }

        // ─── Statut ────────────────────────────────────────────────────
        [Required]
        [MaxLength(30)]
        public string Statut { get; set; } = "Brouillon";

        // ─── Relations ─────────────────────────────────────────────────
        [Required]
        public int TiersId { get; set; }

        [ForeignKey("TiersId")]
        public Tiers? Tiers { get; set; }

        public ICollection<LigneFacture> Lignes { get; set; } = new List<LigneFacture>();

        // ← les 3 lignes en double supprimées ici
    }
}