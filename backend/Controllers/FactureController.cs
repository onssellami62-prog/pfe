using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FacturesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FacturesController(AppDbContext context)
        {
            _context = context;
        }

        // ── GET toutes les factures ──────────────────────────────────────
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var factures = await _context.Factures
                .Include(f => f.Tiers)
                .Include(f => f.Lignes)
                .OrderByDescending(f => f.NumeroFacture)
                .Select(f => new FactureListDto
                {
                    NumeroFacture = f.NumeroFacture,
                    DateFacture = f.DateFacture,
                    TiersId = f.TiersId,
                    TiersNom = f.Tiers != null ? f.Tiers.Nom : "",
                    TiersMatricule = f.Tiers != null ? f.Tiers.MatriculeFiscal : "",
                    MontantTTC = f.MontantTTC,
                    TotalHT = f.TotalHT,
                    TotalTVA = f.TotalTVA,
                    Statut = f.Statut,
                    IdTTN = f.IdTTN,
                    NbLignes = f.Lignes.Count
                })
                .ToListAsync();

            return Ok(factures);
        }

        // ── GET une facture par numéro ───────────────────────────────────
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var facture = await _context.Factures
                .Include(f => f.Tiers)
                .Include(f => f.Lignes)
                    .ThenInclude(l => l.Produit)
                .FirstOrDefaultAsync(f => f.NumeroFacture == id);

            if (facture == null)
                return NotFound(new { message = "Facture introuvable." });

            return Ok(new FactureDetailDto
            {
                NumeroFacture = facture.NumeroFacture,
                DateFacture = facture.DateFacture,
                DateLimitePaiement = facture.DateLimitePaiement,
                PeriodeDu = facture.PeriodeDu,
                PeriodeAu = facture.PeriodeAu,
                TimbreFiscal = facture.TimbreFiscal,
                MontantTimbre = facture.MontantTimbre,
                RemiseGlobale = facture.RemiseGlobale,
                MontantRemise = facture.MontantRemise,
                TotalHTAvantRemise = facture.TotalHTAvantRemise,
                TotalHT = facture.TotalHT,
                TotalTVA = facture.TotalTVA,
                MontantTTC = facture.MontantTTC,
                MontantEnLettres = facture.MontantEnLettres,
                Statut = facture.Statut,
                IdTTN = facture.IdTTN,
                IdSaveEfact = facture.IdSaveEfact,
                TiersId = facture.TiersId,
                TiersNom = facture.Tiers?.Nom,
                TiersMatricule = facture.Tiers?.MatriculeFiscal,
                TiersAdresse = facture.Tiers?.Adresse,
                TypeDocument = facture.TypeDocument,
                Lignes = facture.Lignes.Select(l => new LigneDto
                {
                    Numligne = l.Numligne,
                    Designation = l.Designation,
                    Quantite = l.Quantite,
                    PrixUnitaire = l.PrixUnitaire,
                    RemiseLigne = l.RemiseLigne,
                    TauxTVA = l.TauxTVA,
                    MontantHT = l.MontantHT,
                    MontantTVA = l.MontantTVA,
                    MontantTTC = l.MontantTTC,
                    ProduitId = l.ProduitId,
                    ProduitNom = l.Produit?.Nom
                }).ToList()
            });
        }

        // ── POST créer une facture ───────────────────────────────────────
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] FactureCreateDto dto)
        {
            // ── Validation client ────────────────────────────────────────
            var tiers = await _context.Tiers.FindAsync(dto.TiersId);
            if (tiers == null)
                return BadRequest(new { message = "Client introuvable." });

            // ── Validation lignes ────────────────────────────────────────
            if (dto.Lignes == null || dto.Lignes.Count == 0)
                return BadRequest(new { message = "La facture doit contenir au moins une ligne." });

            // ── Validation date ──────────────────────────────────────────
            if (!dto.DateFacture.HasValue)
                return BadRequest(new { message = "La date de facture est obligatoire." });

            if (dto.DateFacture.Value > DateTime.Now)
                return BadRequest(new { message = "La date de facture ne peut pas être dans le futur." });

            if (dto.DateFacture.Value < DateTime.Now.AddYears(-1))
                return BadRequest(new { message = "La date de facture ne peut pas dépasser 1 an." });

            // ── Validation date échéance ─────────────────────────────────
            if (dto.DateLimitePaiement.HasValue && dto.DateLimitePaiement.Value < dto.DateFacture.Value)
                return BadRequest(new { message = "La date d'échéance doit être après la date de facture." });

            // ── Validation période ───────────────────────────────────────
            if (dto.PeriodeDu.HasValue && dto.PeriodeAu.HasValue && dto.PeriodeDu.Value > dto.PeriodeAu.Value)
                return BadRequest(new { message = "La date 'Période Au' doit être après 'Période Du'." });

            // ── Validation lignes métier ─────────────────────────────────
            decimal[] tvaValides = { 7m, 13m, 19m };
            foreach (var ligne in dto.Lignes)
            {
                var produit = await _context.Produits.FindAsync(ligne.ProduitId);
                if (produit == null)
                    return BadRequest(new { message = $"Produit ID {ligne.ProduitId} introuvable." });

                if (ligne.PrixUnitaire <= 0)
                    return BadRequest(new { message = $"Le prix unitaire doit être supérieur à 0 pour '{ligne.Designation}'." });

                if (ligne.Quantite <= 0)
                    return BadRequest(new { message = $"La quantité doit être supérieure à 0 pour '{ligne.Designation}'." });

                if (!Array.Exists(tvaValides, t => t == ligne.TauxTVA))
                    return BadRequest(new { message = $"Le taux TVA {ligne.TauxTVA}% est invalide. Valeurs acceptées : 7%, 13%, 19%." });

                if (string.IsNullOrWhiteSpace(ligne.Designation))
                    return BadRequest(new { message = "La désignation est obligatoire pour chaque ligne." });

                if (ligne.RemiseLigne < 0 || ligne.RemiseLigne > 100)
                    return BadRequest(new { message = $"La remise doit être entre 0% et 100% pour '{ligne.Designation}'." });
            }

            // ── Validation remise globale ────────────────────────────────
            if (dto.RemiseGlobale < 0 || dto.RemiseGlobale > 100)
                return BadRequest(new { message = "La remise globale doit être entre 0% et 100%." });

            // ── Vérification doublon (même client + même date + mêmes produits) ──
            var produitIdsNouveaux = dto.Lignes
                .Select(l => l.ProduitId)
                .OrderBy(x => x)
                .ToList();

            var dateFacture = dto.DateFacture.Value.Date;

            var facturesExistantes = await _context.Factures
                .Include(f => f.Lignes)
                .Where(f => f.TiersId == dto.TiersId
                         && f.DateFacture.Date == dateFacture
                         && f.Statut != "Annulée")
                .ToListAsync();

            foreach (var existante in facturesExistantes)
            {
                var produitIdsExistants = existante.Lignes
                    .Select(l => l.ProduitId)
                    .OrderBy(x => x)
                    .ToList();

                if (produitIdsNouveaux.SequenceEqual(produitIdsExistants))
                    return Conflict(new
                    {
                        message = $"Une facture identique existe déjà (FAC-{existante.NumeroFacture}) — même client, même date et mêmes produits."
                    });
            }

            // ── Génération ID personnalisé format AAMMXXXX ───────────────
            // Ex: 26060001 = juin 2026, séquence 0001
            var prefixe = DateTime.Now.ToString("yyMM");

            var dernierIdStr = await _context.Factures
                .Where(f => f.NumeroFacture.ToString().StartsWith(prefixe))
                .OrderByDescending(f => f.NumeroFacture)
                .Select(f => f.NumeroFacture)
                .FirstOrDefaultAsync();

            int sequence = dernierIdStr > 0 ? (dernierIdStr % 10000) + 1 : 1;
            int nouveauId = int.Parse($"{prefixe}{sequence:D4}");

            // ── Calculs automatiques ─────────────────────────────────────
            var lignes = dto.Lignes.Select(l =>
            {
                var montantHTBrut = l.Quantite * l.PrixUnitaire;
                var montantRemise = montantHTBrut * (l.RemiseLigne / 100);
                var montantHT = montantHTBrut - montantRemise;
                var montantTVA = montantHT * (l.TauxTVA / 100);
                var montantTTC = montantHT + montantTVA;

                return new LigneFacture
                {
                    ProduitId = l.ProduitId,
                    Designation = l.Designation,
                    Quantite = l.Quantite,
                    PrixUnitaire = l.PrixUnitaire,
                    RemiseLigne = l.RemiseLigne,
                    TauxTVA = l.TauxTVA,
                    MontantHT = Math.Round(montantHT, 3),
                    MontantTVA = Math.Round(montantTVA, 3),
                    MontantTTC = Math.Round(montantTTC, 3)
                };
            }).ToList();

            var totalHTAvantRemise = lignes.Sum(l => l.Quantite * l.PrixUnitaire);
            var totalHT = lignes.Sum(l => l.MontantHT);
            var totalTVA = lignes.Sum(l => l.MontantTVA);
            var montantRemiseGlob = totalHT * (dto.RemiseGlobale / 100);
            var totalHTApresRemise = totalHT - montantRemiseGlob;
            var montantTimbre = dto.TimbreFiscal ? 0.600m : 0m;
            var montantTTCFinal = totalHTApresRemise + totalTVA + montantTimbre;

            if (montantTTCFinal <= 0)
                return BadRequest(new { message = "Le montant TTC doit être supérieur à 0." });

            var facture = new Facture
            {
                NumeroFacture = nouveauId,
                DateFacture = dto.DateFacture.Value,
                DateLimitePaiement = dto.DateLimitePaiement,
                PeriodeDu = dto.PeriodeDu,
                PeriodeAu = dto.PeriodeAu,
                TiersId = dto.TiersId,
                TimbreFiscal = dto.TimbreFiscal,
                MontantTimbre = montantTimbre,
                RemiseGlobale = dto.RemiseGlobale,
                MontantRemise = Math.Round(montantRemiseGlob, 3),
                TotalHTAvantRemise = Math.Round(totalHTAvantRemise, 3),
                TotalHT = Math.Round(totalHTApresRemise, 3),
                TotalTVA = Math.Round(totalTVA, 3),
                MontantTTC = Math.Round(montantTTCFinal, 3),
                MontantEnLettres = ConvertirEnLettres(montantTTCFinal),
                Statut = "Brouillon",
                TypeDocument = "I-11",
                Lignes = lignes
            };

            _context.Factures.Add(facture);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById),
                new { id = facture.NumeroFacture },
                new { message = "Facture créée avec succès.", numeroFacture = facture.NumeroFacture });
        }

        // ── PUT modifier le statut ───────────────────────────────────────
        [HttpPut("{id}/statut")]
        public async Task<IActionResult> UpdateStatut(int id, [FromBody] UpdateStatutDto dto)
        {
            var facture = await _context.Factures.FindAsync(id);
            if (facture == null)
                return NotFound(new { message = "Facture introuvable." });

            string[] statutsValides = { "Brouillon", "SoumiseTTN", "AcceptéeTTN", "Rejetée", "Annulée" };
            if (!Array.Exists(statutsValides, s => s == dto.Statut))
                return BadRequest(new { message = $"Statut '{dto.Statut}' invalide." });

            if (facture.Statut == "AcceptéeTTN" && dto.Statut == "Brouillon")
                return BadRequest(new { message = "Une facture acceptée ne peut pas redevenir brouillon." });

            facture.Statut = dto.Statut;

            if (!string.IsNullOrEmpty(dto.IdTTN))
                facture.IdTTN = dto.IdTTN;

            if (dto.Statut == "AcceptéeTTN")
                facture.DateValidation = DateTime.Now;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Statut mis à jour." });
        }

        // ── DELETE supprimer (brouillon seulement) ───────────────────────
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var facture = await _context.Factures
                .Include(f => f.Lignes)
                .FirstOrDefaultAsync(f => f.NumeroFacture == id);

            if (facture == null)
                return NotFound(new { message = "Facture introuvable." });

            if (facture.Statut != "Brouillon")
                return BadRequest(new { message = "Seules les factures en brouillon peuvent être supprimées." });

            _context.LigneFactures.RemoveRange(facture.Lignes);
            _context.Factures.Remove(facture);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Facture supprimée." });
        }

        // ── GET statistiques rapides ─────────────────────────────────────
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var factures = await _context.Factures.ToListAsync();
            return Ok(new
            {
                total = factures.Count,
                nbValidees = factures.Count(f => f.Statut == "AcceptéeTTN"),
                nbRejetees = factures.Count(f => f.Statut == "Rejetée"),
                nbBrouillon = factures.Count(f => f.Statut == "Brouillon"),
                caGlobal = factures.Where(f => f.Statut == "AcceptéeTTN").Sum(f => f.TotalHT),
                tvaCollectee = factures.Where(f => f.Statut == "AcceptéeTTN").Sum(f => f.TotalTVA),
            });
        }

        // ── Conversion montant en lettres (DT) ──────────────────────────
        private static string ConvertirEnLettres(decimal montant)
        {
            var dinars = (int)Math.Floor(montant);
            var millimes = (int)Math.Round((montant - dinars) * 1000);
            var result = $"{NombreEnLettres(dinars)} DINAR{(dinars > 1 ? "S" : "")}";
            if (millimes > 0)
                result += $" ET {NombreEnLettres(millimes)} MILLIME{(millimes > 1 ? "S" : "")}";
            return result;
        }

        private static string NombreEnLettres(int n)
        {
            if (n == 0) return "ZÉRO";
            string[] u = { "", "UN", "DEUX", "TROIS", "QUATRE", "CINQ", "SIX", "SEPT", "HUIT", "NEUF",
                           "DIX", "ONZE", "DOUZE", "TREIZE", "QUATORZE", "QUINZE", "SEIZE",
                           "DIX-SEPT", "DIX-HUIT", "DIX-NEUF" };
            string[] d = { "", "", "VINGT", "TRENTE", "QUARANTE", "CINQUANTE", "SOIXANTE",
                           "SOIXANTE", "QUATRE-VINGT", "QUATRE-VINGT" };
            if (n < 20) return u[n];
            if (n < 100)
            {
                int diz = n / 10, uni = n % 10;
                if (diz == 7 || diz == 9) return d[diz] + (uni > 0 ? "-" + u[10 + uni] : diz == 9 && uni == 0 ? "-DIX" : "");
                return d[diz] + (uni == 1 && diz != 8 ? "-ET-UN" : uni > 0 ? "-" + u[uni] : "");
            }
            if (n < 1000)
            {
                int cent = n / 100, reste = n % 100;
                return (cent > 1 ? u[cent] + "-CENT" : "CENT") + (reste > 0 ? "-" + NombreEnLettres(reste) : "");
            }
            if (n < 1000000)
            {
                int mil = n / 1000, reste = n % 1000;
                return (mil > 1 ? NombreEnLettres(mil) + "-MILLE" : "MILLE") + (reste > 0 ? "-" + NombreEnLettres(reste) : "");
            }
            return n.ToString();
        }
    }

    // ── DTOs ─────────────────────────────────────────────────────────────────
    public class FactureListDto
    {
        public int NumeroFacture { get; set; }
        public DateTime DateFacture { get; set; }
        public int TiersId { get; set; }
        public string? TiersNom { get; set; }
        public string? TiersMatricule { get; set; }
        public decimal MontantTTC { get; set; }
        public decimal TotalHT { get; set; }
        public decimal TotalTVA { get; set; }
        public string Statut { get; set; } = string.Empty;
        public string? IdTTN { get; set; }
        public int NbLignes { get; set; }
    }

    public class FactureDetailDto : FactureListDto
    {
        public DateTime? DateLimitePaiement { get; set; }
        public DateTime? PeriodeDu { get; set; }
        public DateTime? PeriodeAu { get; set; }
        public bool TimbreFiscal { get; set; }
        public decimal MontantTimbre { get; set; }
        public decimal RemiseGlobale { get; set; }
        public decimal MontantRemise { get; set; }
        public decimal TotalHTAvantRemise { get; set; }
        public string? MontantEnLettres { get; set; }
        public string? IdSaveEfact { get; set; }
        public string? TiersAdresse { get; set; }
        public string? TypeDocument { get; set; }
        public List<LigneDto> Lignes { get; set; } = new();
    }

    public class LigneDto
    {
        public int Numligne { get; set; }
        public string? Designation { get; set; }
        public int Quantite { get; set; }
        public decimal PrixUnitaire { get; set; }
        public decimal RemiseLigne { get; set; }
        public decimal TauxTVA { get; set; }
        public decimal MontantHT { get; set; }
        public decimal MontantTVA { get; set; }
        public decimal MontantTTC { get; set; }
        public int ProduitId { get; set; }
        public string? ProduitNom { get; set; }
    }

    public class LigneCreateDto
    {
        public int ProduitId { get; set; }
        public string? Designation { get; set; }
        public int Quantite { get; set; }
        public decimal PrixUnitaire { get; set; }
        public decimal RemiseLigne { get; set; } = 0;
        public decimal TauxTVA { get; set; }
    }

    public class FactureCreateDto
    {
        public int TiersId { get; set; }
        public DateTime? DateFacture { get; set; }
        public DateTime? DateLimitePaiement { get; set; }
        public DateTime? PeriodeDu { get; set; }
        public DateTime? PeriodeAu { get; set; }
        public bool TimbreFiscal { get; set; } = true;
        public decimal RemiseGlobale { get; set; } = 0;
        public List<LigneCreateDto> Lignes { get; set; } = new();
    }

    public class UpdateStatutDto
    {
        public string Statut { get; set; } = string.Empty;
        public string? IdTTN { get; set; }
    }
}