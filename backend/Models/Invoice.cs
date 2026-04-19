using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace backend.Models
{
    public class Invoice
    {
        public int Id { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty; // FAC-2026-0001
        public string DocumentType { get; set; } = "380"; // 380: Facture, 381: Note d'Avoir
        public DateTime Date { get; set; } = DateTime.UtcNow;

        // Client (snapshot + FK)
        public int? ClientId { get; set; }
        public Client? Client { get; set; }
        public string ClientName { get; set; } = string.Empty;
        public string ClientMatricule { get; set; } = string.Empty;
        public string ClientAddress { get; set; } = string.Empty;

        // Period
        public DateTime? PeriodFrom { get; set; }
        public DateTime? PeriodTo { get; set; }

        // Totals
        [Column(TypeName = "decimal(18,3)")]
        public decimal TotalHT { get; set; }

        [Column(TypeName = "decimal(18,3)")]
        public decimal TotalTVA { get; set; }

        [Column(TypeName = "decimal(18,3)")]
        public decimal StampDuty { get; set; } = 0;

        [Column(TypeName = "decimal(18,3)")]
        public decimal TotalTTC { get; set; }

        public string Status { get; set; } = "Brouillon"; // Brouillon, Validée, Rejetée
        public string FilePath { get; set; } = string.Empty;
        public string XmlContent { get; set; } = string.Empty;

        // Signature
        public bool IsSigned { get; set; } = false;
        public DateTime? SignedAt { get; set; }
        public string SignedXmlContent { get; set; } = string.Empty;

        // Issuer
        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        // Lines
        [JsonPropertyName("lines")]
        public ICollection<InvoiceLine> Lines { get; set; } = new List<InvoiceLine>();
    }
}
