using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
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
                .OrderByDescending(f => f.DateFacture)
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
            // Vérifier que le tiers existe
            var tiers = await _context.Tiers.FindAsync(dto.TiersId);
            if (tiers == null)
                return BadRequest(new { message = "Client introuvable." });

            // Vérifier que les produits existent
            foreach (var ligne in dto.Lignes)
            {
                var produit = await _context.Produits.FindAsync(ligne.ProduitId);
                if (produit == null)
                    return BadRequest(new { message = $"Produit ID {ligne.ProduitId} introuvable." });
            }

            // ── Calculs automatiques ────────────────────────────────────
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
            var montantTimbre = dto.TimbreFiscal ? 0.500m : 0m;
            var montantTTC = totalHTApresRemise + totalTVA + montantTimbre;

            var facture = new Facture
            {
                DateFacture = dto.DateFacture ?? DateTime.Now,
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
                MontantTTC = Math.Round(montantTTC, 3),
                MontantEnLettres = ConvertirEnLettres(montantTTC),
                Statut = "Brouillon",
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

            facture.Statut = dto.Statut;
            if (!string.IsNullOrEmpty(dto.IdTTN))
                facture.IdTTN = dto.IdTTN;

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