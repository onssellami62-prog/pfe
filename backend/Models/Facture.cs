using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    /// <summary>
    /// Représente une facture électronique conforme au format TTN (Tunisie TradeNet)
    /// </summary>
    public class Facture
    {
        public string? IdSaveEfact { get; set; }

        // ─── Référence TTN ─────────────────────────
        [MaxLength(50)]
        public string? IdTTN { get; set; }

        [Key]
        [Required]
        public int NumeroFacture { get; set; }

        // ─── Dates ─────────────────────────────────
        [Required]
        public DateTime DateFacture { get; set; } = DateTime.Now;
        public DateTime DateValidation { get; set; } = DateTime.Now;

        public DateTime? DateLimitePaiement { get; set; }

        public DateTime? PeriodeDu { get; set; }

        public DateTime? PeriodeAu { get; set; }
        public string? QrCode { get; set; }
        /// <summary>I-11 = Facture, I-14 = Avoir</summary>
        [MaxLength(10)]
        public string TypeDocument { get; set; } = "I-11";

        public int? FactureOrigineId { get; set; }

        [ForeignKey("FactureOrigineId")]
        public Facture? FactureOrigine { get; set; }dotne
        // ─── Timbre fiscal ─────────────────────────
        public bool TimbreFiscal { get; set; } = false;

        [Column(TypeName = "decimal(18,3)")]
        public decimal MontantTimbre { get; set; } = 0;

        // ─── Remise globale ────────────────────────
        [Column(TypeName = "decimal(5,2)")]
        [Range(0, 100)]
        public decimal RemiseGlobale { get; set; } = 0;

        [Column(TypeName = "decimal(18,3)")]
        public decimal MontantRemise { get; set; } = 0;

        // ─── Totaux ────────────────────────────────
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

        // ─── Mode / Statut ─────────────────────────
        [MaxLength(50)]
        public string? ModeConnexion { get; set; }

        [Required]
        [MaxLength(30)]
        public string Statut { get; set; } = "Brouillon";

        // ─── Relations ─────────────────────────────
        [Required]
        public int TiersId { get; set; }

        [ForeignKey("TiersId")]
        public Tiers? Tiers { get; set; }

        public ICollection<LigneFacture> Lignes { get; set; } = new List<LigneFacture>();
    }
}