using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    /// <summary>
    /// Facture électronique conforme TEIF v1.8.7 — Tunisie TradeNet (TTN)
    /// </summary>
    public class Facture
    {
        // ─── Clé primaire ──────────────────────────────────────────────
        [Key]
        [Required]
        public int NumeroFacture { get; set; }

        // ─── Référence TTN ─────────────────────────────────────────────
        /// <summary>Numéro unique généré par TTN après saveEfact (IdSaveEfact)</summary>
        [MaxLength(100)]
        public string? IdSaveEfact { get; set; }

        /// <summary>Référence unique TTN (RefTtnVal/Reference — max 70 car.)</summary>
        [MaxLength(70)]
        public string? IdTTN { get; set; }

        /// <summary>
        /// Cachet électronique visible — QR code encodé base64
        /// Retourné par TTN dans RefTtnVal/ReferenceCev (max 4000 car.)
        /// </summary>
        [MaxLength(4000)]
        public string? ReferenceCev { get; set; }

        /// <summary>Date de génération de la référence TTN</summary>
        public DateTime? DateReferenceTTN { get; set; }

        // ─── Type de document (réf. I-1 TEIF) ─────────────────────────
        /// <summary>I-11 = Facture | I-14 = Avoir | I-16 = Proforma</summary>
        [MaxLength(10)]
        public string TypeDocument { get; set; } = "I-11";

        /// <summary>Référence à la facture originale (pour les avoirs I-14)</summary>
        public int? FactureOrigineId { get; set; }
        [ForeignKey("FactureOrigineId")]
        public Facture? FactureOrigine { get; set; }

        // ─── Dates ─────────────────────────────────────────────────────
        [Required]
        public DateTime DateFacture { get; set; } = DateTime.Now;

        /// <summary>Date de validation TTN — null tant que non soumise</summary>
        public DateTime? DateValidation { get; set; }

        /// <summary>Date limite de paiement (DTM I-35)</summary>
        public DateTime? DateLimitePaiement { get; set; }

        /// <summary>Début de période de service (DTM I-37)</summary>
        public DateTime? PeriodeDu { get; set; }

        /// <summary>Fin de période de service (DTM I-37)</summary>
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

        /// <summary>Montant en toutes lettres (Ftx I-41)</summary>
        [MaxLength(500)]
        public string? MontantEnLettres { get; set; }

        // ─── Statut ────────────────────────────────────────────────────
        /// <summary>Brouillon | SoumiseTTN | AcceptéeTTN | Rejetée | Annulée</summary>
        [Required]
        [MaxLength(30)]
        public string Statut { get; set; } = "Brouillon";

        // ─── Relations ─────────────────────────────────────────────────
        [Required]
        public int TiersId { get; set; }

        [ForeignKey("TiersId")]
        public Tiers? Tiers { get; set; }

        public ICollection<LigneFacture> Lignes { get; set; } = new List<LigneFacture>();
    }
}