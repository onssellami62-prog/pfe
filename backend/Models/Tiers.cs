using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class Tiers
    {
        public int Id { get; set; }

        [MaxLength(100)]
        public string? IdSaveEfact { get; set; }

        [Required]
        [MaxLength(200)]
        public string Nom { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? CIN { get; set; }

        [MaxLength(50)]
        public string? MatriculeFiscal { get; set; }

        [Required]
        [MaxLength(300)]
        public string Adresse { get; set; } = string.Empty;

        [MaxLength(150)]
        public string? Email { get; set; }

        [MaxLength(20)]
        public string? Telephone { get; set; }

        [MaxLength(20)]
        public string? Telecopie { get; set; }

        [MaxLength(150)]
        public string? Contact { get; set; }

        [MaxLength(50)]
        public string? CodeClient { get; set; }

        [MaxLength(50)]
        public string? Profil { get; set; }

        [MaxLength(200)]
        public string? SiteWeb { get; set; }

        public DateTime DateCreation { get; set; } = DateTime.Now;

        public string TypeTiers =>
            !string.IsNullOrWhiteSpace(CIN) ? "Personne Physique" :
            !string.IsNullOrWhiteSpace(MatriculeFiscal) ? "Société" :
            "Non défini";

        public ICollection<Facture> Factures { get; set; } = new List<Facture>();
    }
}