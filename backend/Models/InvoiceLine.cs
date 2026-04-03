using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class InvoiceLine
    {
        public int Id { get; set; }
        public int InvoiceId { get; set; }
        public Invoice? Invoice { get; set; }

        public int? ProductId { get; set; }
        public Product? Product { get; set; }

        public string Description { get; set; } = string.Empty;
        public string Unit { get; set; } = "Pièce";
        public int Qty { get; set; } = 1;
        public int TvaRate { get; set; } = 19;

        [Column(TypeName = "decimal(18,3)")]
        public decimal UnitPriceHT { get; set; }

        [Column(TypeName = "decimal(18,3)")]
        public decimal TotalHT { get; set; }

        [Column(TypeName = "decimal(18,3)")]
        public decimal TotalTVA { get; set; }
    }
}
