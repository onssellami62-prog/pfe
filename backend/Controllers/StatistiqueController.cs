using backend.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StatisticsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StatisticsController(AppDbContext context)
        {
            _context = context;
        }

        // ── GET statistiques globales ────────────────────────────────────
        [HttpGet]
        public async Task<IActionResult> GetStats(
            [FromQuery] string? dateDebut,
            [FromQuery] string? dateFin)
        {
            var debut = string.IsNullOrEmpty(dateDebut)
                ? DateTime.Now.AddDays(-30)
                : DateTime.Parse(dateDebut);

            var fin = string.IsNullOrEmpty(dateFin)
                ? DateTime.Now
                : DateTime.Parse(dateFin);

            var factures = await _context.Factures
                .Include(f => f.Lignes)
                .Where(f => f.DateFacture >= debut && f.DateFacture <= fin)
                .ToListAsync();

            var validees = factures.Where(f => f.Statut == "AcceptéeTTN").ToList();

            // ── KPIs ────────────────────────────────────────────────────
            var caGlobal = validees.Sum(f => f.TotalHT);
            var tvaCollectee = validees.Sum(f => f.TotalTVA);
            var timbreCumule = validees.Sum(f => f.MontantTimbre);
            var volumeFactures = factures.Count;
            var nbValidees = validees.Count;
            var nbRejetees = factures.Count(f => f.Statut == "Rejetée");
            var nbBrouillon = factures.Count(f => f.Statut == "Brouillon");

            // ── Évolution mensuelle ──────────────────────────────────────
            var evolutionMensuelle = validees
                .GroupBy(f => new { f.DateFacture.Year, f.DateFacture.Month })
                .Select(g => new
                {
                    annee = g.Key.Year,
                    mois = g.Key.Month,
                    caHT = g.Sum(f => f.TotalHT),
                    nbFact = g.Count()
                })
                .OrderBy(e => e.annee).ThenBy(e => e.mois)
                .ToList();

            // ── TVA par taux ─────────────────────────────────────────────
            var tvaParTaux = validees
                .SelectMany(f => f.Lignes)
                .GroupBy(l => l.TauxTVA)
                .Select(g => new
                {
                    taux = g.Key,
                    baseHT = g.Sum(l => l.MontantHT),
                    montantTVA = g.Sum(l => l.MontantTVA)
                })
                .OrderBy(t => t.taux)
                .ToList();

            // ── Top 5 clients ────────────────────────────────────────────
            var topClients = validees
                .GroupBy(f => new { f.TiersId })
                .Select(g => new
                {
                    tiersId = g.Key.TiersId,
                    nbFactures = g.Count(),
                    caTotal = g.Sum(f => f.TotalHT)
                })
                .OrderByDescending(c => c.caTotal)
                .Take(5)
                .ToList();

            // Récupérer les noms des clients
            var tiersIds = topClients.Select(c => c.tiersId).ToList();
            var tiersList = await _context.Tiers
                .Where(t => tiersIds.Contains(t.Id))
                .ToListAsync();

            var topClientsNommes = topClients.Select(c => new
            {
                nomClient = tiersList.FirstOrDefault(t => t.Id == c.tiersId)?.Nom ?? "Inconnu",
                nbFactures = c.nbFactures,
                caTotal = c.caTotal
            }).ToList();

            return Ok(new
            {
                caGlobal,
                tvaCollectee,
                timbreCumule,
                volumeFactures,
                nbValidees,
                nbRejetees,
                nbBrouillon,
                evolutionMensuelle,
                tvaParTaux,
                topClients = topClientsNommes
            });
        }

        // ── GET déclaration fiscale mensuelle ────────────────────────────
        [HttpGet("declaration")]
        public async Task<IActionResult> GetDeclaration(
            [FromQuery] int? mois,
            [FromQuery] int? annee)
        {
            var m = mois ?? DateTime.Now.Month;
            var a = annee ?? DateTime.Now.Year;

            var factures = await _context.Factures
                .Include(f => f.Lignes)
                .Where(f => f.Statut == "AcceptéeTTN"
                         && f.DateFacture.Month == m
                         && f.DateFacture.Year == a)
                .ToListAsync();

            var caHT = factures.Sum(f => f.TotalHT);
            var tvaCollectee = factures.Sum(f => f.TotalTVA);
            var timbre = factures.Sum(f => f.MontantTimbre);
            var nbFactures = factures.Count;

            // TVA par taux
            var tvaParTaux = factures
                .SelectMany(f => f.Lignes)
                .GroupBy(l => l.TauxTVA)
                .Select(g => new
                {
                    taux = g.Key,
                    baseHT = Math.Round(g.Sum(l => l.MontantHT), 3),
                    montantTVA = Math.Round(g.Sum(l => l.MontantTVA), 3)
                })
                .OrderBy(t => t.taux)
                .ToList();

            // Mois disponibles (pour le sélecteur)
            var moisDisponibles = await _context.Factures
                .Where(f => f.Statut == "AcceptéeTTN")
                .Select(f => new { f.DateFacture.Month, f.DateFacture.Year })
                .Distinct()
                .OrderByDescending(d => d.Year).ThenByDescending(d => d.Month)
                .Take(12)
                .ToListAsync();

            return Ok(new
            {
                mois = m,
                annee = a,
                caHT = Math.Round(caHT, 3),
                tvaCollectee = Math.Round(tvaCollectee, 3),
                timbre = Math.Round(timbre, 3),
                nbFactures,
                netAPayer = Math.Round(tvaCollectee + timbre, 3),
                tvaParTaux,
                moisDisponibles
            });
        }
    }
}