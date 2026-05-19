using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    /// <summary>
    /// Partenaire commercial conforme TEIF v1.8.7 — PartnerSection TTN
    /// </summary>
    public class Tiers
    {
        // ─── Clé primaire ──────────────────────────────────────────────
        public int Id { get; set; }

        // ─── Identification TEIF (réf. I-0) ───────────────────────────
        /// <summary>
        /// Type d'identifiant TEIF :
        /// I-01 = Matricule fiscal tunisien
        /// I-02 = CIN (Carte d'Identité Nationale)
        /// I-03 = Carte de séjour
        /// I-04 = Matricule fiscal étranger
        /// </summary>
        [MaxLength(6)]
        public string TypeIdentifiant { get; set; } = "I-01";

        /// <summary>Matricule fiscal (I-01) — format: 7chiffres+Clef/CodeTVA/CodeCat/3chiffres</summary>
        [MaxLength(50)]
        public string? MatriculeFiscal { get; set; }

        /// <summary>CIN (Carte d'Identité Nationale) — type I-02</summary>
        [MaxLength(20)]
        public string? CIN { get; set; }

        /// <summary>Carte de séjour ou Passeport — type I-03</summary>
        [MaxLength(30)]
        public string? CarteSejourPasseport { get; set; }

        /// <summary>Matricule fiscal étranger — type I-04</summary>
        [MaxLength(50)]
        public string? MatriculeFiscalEtranger { get; set; }

        // ─── Informations générales ────────────────────────────────────
        [Required]
        [MaxLength(200)]
        public string Nom { get; set; } = string.Empty;

        [MaxLength(300)]
        public string? Adresse { get; set; }

        /// <summary>Ville (PartnerAdresses/CityName)</summary>
        [MaxLength(100)]
        public string? Ville { get; set; }

        /// <summary>Code postal (PartnerAdresses/PostalCode)</summary>
        [MaxLength(10)]
        public string? CodePostal { get; set; }

        /// <summary>Pays ISO 3166-1 (ex: TN, FR) — défaut TN</summary>
        [MaxLength(2)]
        public string? Pays { get; set; } = "TN";

        // ─── Contact ───────────────────────────────────────────────────
        [MaxLength(150)]
        public string? Email { get; set; }

        [MaxLength(20)]
        public string? Telephone { get; set; }

        [MaxLength(20)]
        public string? Telecopie { get; set; }

        [MaxLength(150)]
        public string? Contact { get; set; }

        [MaxLength(200)]
        public string? SiteWeb { get; set; }

        // ─── Informations TTN ──────────────────────────────────────────
        /// <summary>Mode de connexion TTN (SMTP, FTP, etc.)</summary>
        [MaxLength(20)]
        public string? ModeConnexion { get; set; }

        /// <summary>Rang/Profil du compte TTN (NP, VP, etc.)</summary>
        [MaxLength(20)]
        public string? Profil { get; set; }

        // ─── Métadonnées ───────────────────────────────────────────────
        public DateTime DateCreation { get; set; } = DateTime.Now;

        // ─── Propriété calculée ────────────────────────────────────────
        /// <summary>Type du tiers déduit automatiquement de l'identifiant</summary>
        public string TypeTiers =>
            TypeIdentifiant == "I-02" || !string.IsNullOrWhiteSpace(CIN)
                ? "Personne Physique (CIN)"
                : TypeIdentifiant == "I-03" || !string.IsNullOrWhiteSpace(CarteSejourPasseport)
                    ? "Personne Physique (Carte Séjour/Passeport)"
                    : TypeIdentifiant == "I-04" || (!string.IsNullOrWhiteSpace(MatriculeFiscalEtranger))
                        ? "Société Étrangère"
                        : !string.IsNullOrWhiteSpace(MatriculeFiscal)
                            ? "Société Tunisienne"
                            : "Non défini";

        // ─── Relations ─────────────────────────────────────────────────
        public ICollection<Facture> Factures { get; set; } = new List<Facture>();
    }
}