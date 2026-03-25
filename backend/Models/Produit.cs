using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class Produit
    {
        public int Id { get; set; }

        [Required]
        public string Nom { get; set; } = string.Empty;

        public string? Description { get; set; }

        public decimal PrixUnitaire { get; set; }

        public decimal TauxTVA { get; set; }
    }
}