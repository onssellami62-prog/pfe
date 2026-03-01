using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class Facture
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Numero { get; set; } = string.Empty;

        [Required]
        public DateTime DateEmission { get; set; } = DateTime.Now;

        // 🔹 Totaux
        public decimal TotalHT { get; set; }
        public decimal TotalTVA { get; set; }
        public decimal TotalTTC { get; set; }

        [MaxLength(50)]
        public string Statut { get; set; } = "Brouillon";

        // 🔹 Relations
        [ForeignKey("Client")]
        public int ClientId { get; set; }
        public Client? Client { get; set; }

        [ForeignKey("Societe")]
        public int SocieteId { get; set; }
        public Societe? Societe { get; set; }

        // 🔹 Navigation vers lignes
        public ICollection<LigneFacture>? Lignes { get; set; }
    }
}