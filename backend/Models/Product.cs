using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class Product
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Unit { get; set; } = "Pièce"; // Pièce, Heure, Jour, KG
        public int TvaRate { get; set; } = 19; // 0, 7, 13, 19

        [Column(TypeName = "decimal(18,3)")]
        public decimal DefaultPrice { get; set; } = 0;

        // Relationship: A product belongs to a specific company
        public int CompanyId { get; set; }
        public Company? Company { get; set; }
    }
}
