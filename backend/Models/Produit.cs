using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class Produit
    {
        public int Id { get; set; }

        [Required]
        /// <summary>Code unique du produit ex: PROD001</summary>
        [MaxLength(35)]
        public string ItemCode { get; set; } = string.Empty;

        /// <summary>Unité de mesure ex: PCE, SRV, KG</summary>
        [MaxLength(8)]
        public string UniteMessure { get; set; } = "PCE";

        public string Nom { get; set; } = string.Empty;

        public string? Description { get; set; }

        public decimal PrixUnitaire { get; set; }

        public decimal TauxTVA { get; set; }
    }
}