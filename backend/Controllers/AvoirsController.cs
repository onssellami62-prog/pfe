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
    public class AvoirsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AvoirsController(AppDbContext context)
        {
            _context = context;
        }

        // ── GET tous les avoirs ──────────────────────────────────────────
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var avoirs = await _context.Factures
                .Include(f => f.Tiers)
                .Include(f => f.Lignes)
                .Where(f => f.TypeDocument == "I-14")
                .OrderByDescending(f => f.DateFacture)
                .Select(f => new
                {
                    numeroFacture = f.NumeroFacture,
                    dateFacture = f.DateFacture,
                    tiersNom = f.Tiers != null ? f.Tiers.Nom : "",
                    montantTTC = f.MontantTTC,
                    statut = f.Statut,
                    factureOrigineId = f.FactureOrigineId,
                    typeRetour = f.Lignes.Count == 0 ? "Total" : "Partiel"
                })
                .ToListAsync();

            return Ok(avoirs);
        }

        // ── GET un avoir par ID ──────────────────────────────────────────
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var avoir = await _context.Factures
                .Include(f => f.Tiers)
                .Include(f => f.Lignes).ThenInclude(l => l.Produit)
                .Include(f => f.FactureOrigine)
                .FirstOrDefaultAsync(f => f.NumeroFacture == id && f.TypeDocument == "I-14");

            if (avoir == null)
                return NotFound(new { message = "Avoir introuvable." });

            return Ok(new
            {
                numeroFacture = avoir.NumeroFacture,
                dateFacture = avoir.DateFacture,
                tiersNom = avoir.Tiers?.Nom,
                tiersMatricule = avoir.Tiers?.MatriculeFiscal,
                montantTTC = avoir.MontantTTC,
                totalHT = avoir.TotalHT,
                totalTVA = avoir.TotalTVA,
                montantEnLettres = avoir.MontantEnLettres,
                statut = avoir.Statut,
                factureOrigineId = avoir.FactureOrigineId,
                factureOrigineRef = avoir.FactureOrigine?.NumeroFacture,
                lignes = avoir.Lignes.Select(l => new
                {
                    numligne = l.Numligne,
                    designation = l.Designation,
                    quantite = l.Quantite,
                    prixUnitaire = l.PrixUnitaire,
                    tauxTVA = l.TauxTVA,
                    montantHT = l.MontantHT,
                    montantTVA = l.MontantTVA,
                    montantTTC = l.MontantTTC,
                    produitNom = l.Produit?.Nom
                })
            });
        }

        // ── POST créer un avoir (partiel ou total) ───────────────────────
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] AvoirCreateDto dto)
        {
            // 1. Vérifier que la facture originale existe et est validée
            var factureOriginale = await _context.Factures
                .Include(f => f.Lignes).ThenInclude(l => l.Produit)
                .Include(f => f.Tiers)
                .FirstOrDefaultAsync(f => f.NumeroFacture == dto.FactureOrigineId);

            if (factureOriginale == null)
                return NotFound(new { message = "Facture originale introuvable." });

            if (factureOriginale.TypeDocument == "I-14")
                return BadRequest(new { message = "Impossible de créer un avoir sur un avoir." });

            if (factureOriginale.Statut != "AcceptéeTTN")
                return BadRequest(new { message = "Seules les factures acceptées par TTN peuvent faire l'objet d'un avoir." });

            // 2. Vérifier qu'un avoir total n'existe pas déjà
            var avoirExistant = await _context.Factures
                .AnyAsync(f => f.FactureOrigineId == dto.FactureOrigineId
                            && f.TypeDocument == "I-14"
                            && f.Statut != "Annulée");
            if (avoirExistant)
                return BadRequest(new { message = "Un avoir existe déjà pour cette facture." });

            List<LigneFacture> lignesAvoir;

            // ── RETOUR TOTAL ─────────────────────────────────────────────
            if (dto.TypeRetour == "Total")
            {
                lignesAvoir = factureOriginale.Lignes.Select(l => new LigneFacture
                {
                    ProduitId = l.ProduitId,
                    Designation = l.Designation,
                    Quantite = l.Quantite,
                    PrixUnitaire = l.PrixUnitaire,
                    RemiseLigne = l.RemiseLigne,
                    TauxTVA = l.TauxTVA,
                    MontantHT = l.MontantHT,
                    MontantTVA = l.MontantTVA,
                    MontantTTC = l.MontantTTC
                }).ToList();
            }
            // ── RETOUR PARTIEL ───────────────────────────────────────────
            else
            {
                if (dto.Lignes == null || dto.Lignes.Count == 0)
                    return BadRequest(new { message = "Pour un retour partiel, précisez les lignes à retourner." });

                lignesAvoir = new List<LigneFacture>();

                foreach (var ligneDto in dto.Lignes)
                {
                    var ligneOriginale = factureOriginale.Lignes
                        .FirstOrDefault(l => l.Numligne == ligneDto.NumlignOrigine);

                    if (ligneOriginale == null)
                        return BadRequest(new { message = $"Ligne {ligneDto.NumlignOrigine} introuvable dans la facture originale." });

                    if (ligneDto.QuantiteRetournee > ligneOriginale.Quantite)
                        return BadRequest(new { message = $"Quantité retournée ({ligneDto.QuantiteRetournee}) supérieure à la quantité originale ({ligneOriginale.Quantite})." });

                    var montantHT = Math.Round(ligneDto.QuantiteRetournee * ligneOriginale.PrixUnitaire, 3);
                    var montantTVA = Math.Round(montantHT * (ligneOriginale.TauxTVA / 100), 3);

                    lignesAvoir.Add(new LigneFacture
                    {
                        ProduitId = ligneOriginale.ProduitId,
                        Designation = ligneOriginale.Designation,
                        Quantite = ligneDto.QuantiteRetournee,
                        PrixUnitaire = ligneOriginale.PrixUnitaire,
                        RemiseLigne = ligneOriginale.RemiseLigne,
                        TauxTVA = ligneOriginale.TauxTVA,
                        MontantHT = montantHT,
                        MontantTVA = montantTVA,
                        MontantTTC = Math.Round(montantHT + montantTVA, 3)
                    });
                }
            }

            // 3. Calcul des totaux de l'avoir
            var totalHT = Math.Round(lignesAvoir.Sum(l => l.MontantHT), 3);
            var totalTVA = Math.Round(lignesAvoir.Sum(l => l.MontantTVA), 3);
            var totalTTC = Math.Round(totalHT + totalTVA, 3);

            // 4. Créer l'avoir
            var avoir = new Facture
            {
                TypeDocument = "I-14",
                FactureOrigineId = dto.FactureOrigineId,
                TiersId = factureOriginale.TiersId,
                DateFacture = DateTime.Now,
                TotalHT = totalHT,
                TotalTVA = totalTVA,
                MontantTTC = totalTTC,
                TotalHTAvantRemise = totalHT,
                MontantEnLettres = ConvertirEnLettres(totalTTC),
                TimbreFiscal = false,
                MontantTimbre = 0,
                RemiseGlobale = 0,
                MontantRemise = 0,
                Statut = "Brouillon",
                Lignes = lignesAvoir
            };

            _context.Factures.Add(avoir);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById),
                new { id = avoir.NumeroFacture },
                new
                {
                    message = "Avoir créé avec succès.",
                    numeroAvoir = avoir.NumeroFacture,
                    factureOrigineId = avoir.FactureOrigineId,
                    montantTTC = avoir.MontantTTC,
                    typeRetour = dto.TypeRetour
                });
        }

        // ── PUT annuler un avoir ─────────────────────────────────────────
        [HttpPut("{id}/annuler")]
        public async Task<IActionResult> Annuler(int id)
        {
            var avoir = await _context.Factures
                .FirstOrDefaultAsync(f => f.NumeroFacture == id && f.TypeDocument == "I-14");

            if (avoir == null)
                return NotFound(new { message = "Avoir introuvable." });

            if (avoir.Statut != "Brouillon")
                return BadRequest(new { message = "Seuls les avoirs en brouillon peuvent être annulés." });

            avoir.Statut = "Annulée";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Avoir annulé." });
        }

        // ── Conversion montant en lettres ────────────────────────────────
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
                if (diz == 7 || diz == 9)
                    return d[diz] + (uni > 0 ? "-" + u[10 + uni] : diz == 9 && uni == 0 ? "-DIX" : "");
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
    public class AvoirCreateDto
    {
        /// <summary>Numéro de la facture originale</summary>
        public int FactureOrigineId { get; set; }

        /// <summary>"Total" ou "Partiel"</summary>
        public string TypeRetour { get; set; } = "Total";

        /// <summary>Lignes à retourner (uniquement pour TypeRetour = "Partiel")</summary>
        public List<LigneAvoirDto>? Lignes { get; set; }
    }

    public class LigneAvoirDto
    {
        /// <summary>Numéro de la ligne dans la facture originale</summary>
        public int NumlignOrigine { get; set; }

        /// <summary>Quantité à retourner (≤ quantité originale)</summary>
        public int QuantiteRetournee { get; set; }
    }
}