using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
	public class LigneFacture
	{
		public int Id { get; set; }

		[Required]
		public int Quantite { get; set; }

		[Required]
		public decimal PrixUnitaire { get; set; }

		public decimal MontantHT { get; set; }
		public decimal MontantTVA { get; set; }
		public decimal MontantTTC { get; set; }

		// 🔹 Relation Facture
		[ForeignKey("Facture")]
		public int FactureId { get; set; }
		public Facture? Facture { get; set; }

		// 🔹 Relation Produit
		[ForeignKey("Produit")]
		public int ProduitId { get; set; }
		public Produit? Produit { get; set; }
	}
}