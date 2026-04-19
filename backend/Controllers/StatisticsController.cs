using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StatisticsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StatisticsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Statistics/summary?companyId=1&from=2026-01-01&to=2026-12-31
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary([FromQuery] int companyId, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            var query = _context.Invoices
                .Where(i => i.CompanyId == companyId && i.Status == "Validée");

            if (from.HasValue) query = query.Where(i => i.Date >= from.Value);
            if (to.HasValue) query = query.Where(i => i.Date <= to.Value);

            var invoices = await query.ToListAsync();

            var totalCA = invoices.Sum(i => i.TotalHT);
            var totalVolume = invoices.Count;
            var totalTva = invoices.Sum(i => i.TotalTVA);
            var totalStamp = invoices.Sum(i => i.StampDuty);

            // Compute trends vs previous period of same length
            var caTrend = "0%";
            var volTrend = "0%";
            var tvaTrend = "Stable";
            var stampTrend = "0%";

            if (from.HasValue && to.HasValue)
            {
                var span = to.Value - from.Value;
                var prevFrom = from.Value - span;
                var prevTo = from.Value.AddDays(-1);

                var prevInvoices = await _context.Invoices
                    .Where(i => i.CompanyId == companyId && i.Status == "Validée" && i.Date >= prevFrom && i.Date <= prevTo)
                    .ToListAsync();

                var prevCA = prevInvoices.Sum(i => i.TotalHT);
                var prevVol = prevInvoices.Count;
                var prevTva = prevInvoices.Sum(i => i.TotalTVA);
                var prevStamp = prevInvoices.Sum(i => i.StampDuty);

                caTrend = prevCA > 0 ? $"{(totalCA - prevCA) / prevCA * 100:+0.0;-0.0}%" : (totalCA > 0 ? "+100%" : "0%");
                volTrend = prevVol > 0 ? $"{(double)(totalVolume - prevVol) / prevVol * 100:+0.0;-0.0}%" : (totalVolume > 0 ? "+100%" : "0%");
                tvaTrend = prevTva > 0 ? $"{(totalTva - prevTva) / prevTva * 100:+0.0;-0.0}%" : (totalTva > 0 ? "+100%" : "Stable");
                stampTrend = prevStamp > 0 ? $"{(totalStamp - prevStamp) / prevStamp * 100:+0.0;-0.0}%" : (totalStamp > 0 ? "+100%" : "0%");
            }

            return Ok(new
            {
                totalCA = Math.Round(totalCA, 3),
                totalVolume,
                totalTva = Math.Round(totalTva, 3),
                totalStamp = Math.Round(totalStamp, 3),
                caTrend,
                volTrend,
                tvaTrend,
                stampTrend
            });
        }

        // GET: api/Statistics/monthly-evolution?companyId=1&year=2026
        [HttpGet("monthly-evolution")]
        public async Task<IActionResult> GetMonthlyEvolution([FromQuery] int companyId, [FromQuery] int? year)
        {
            var currentYear = year ?? DateTime.UtcNow.Year;
            var pastYear = currentYear - 1;

            var currentYearData = await _context.Invoices
                .Where(i => i.CompanyId == companyId && i.Date.Year == currentYear && i.Status == "Validée")
                .GroupBy(i => i.Date.Month)
                .Select(g => new { Month = g.Key, TotalHT = g.Sum(x => x.TotalHT) })
                .ToListAsync();

            var pastYearData = await _context.Invoices
                .Where(i => i.CompanyId == companyId && i.Date.Year == pastYear && i.Status == "Validée")
                .GroupBy(i => i.Date.Month)
                .Select(g => new { Month = g.Key, TotalHT = g.Sum(x => x.TotalHT) })
                .ToListAsync();

            var result = new List<object>();
            for (int m = 1; m <= 12; m++)
            {
                result.Add(new
                {
                    month = m,
                    currentYear = Math.Round(currentYearData.FirstOrDefault(d => d.Month == m)?.TotalHT ?? 0, 3),
                    pastYear = Math.Round(pastYearData.FirstOrDefault(d => d.Month == m)?.TotalHT ?? 0, 3)
                });
            }

            return Ok(result);
        }

        // GET: api/Statistics/tva-distribution?companyId=1&from=...&to=...
        [HttpGet("tva-distribution")]
        public async Task<IActionResult> GetTvaDistribution([FromQuery] int companyId, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            var query = _context.InvoiceLines
                .Include(l => l.Invoice)
                .Where(l => l.Invoice != null && l.Invoice.CompanyId == companyId && l.Invoice.Status == "Validée");

            if (from.HasValue) query = query.Where(l => l.Invoice.Date >= from.Value);
            if (to.HasValue) query = query.Where(l => l.Invoice.Date <= to.Value);

            var distribution = await query
                .GroupBy(l => l.TvaRate)
                .Select(g => new
                {
                    rate = g.Key,
                    totalHT = g.Sum(x => x.TotalHT),
                    totalTVA = g.Sum(x => x.TotalTVA)
                })
                .ToListAsync();

            var totalAllTva = distribution.Sum(d => d.totalTVA);

            var result = distribution.Select(d => new
            {
                label = $"Taux {d.rate}%",
                rate = d.rate,
                percentage = totalAllTva > 0 ? (double)Math.Round((d.totalTVA / totalAllTva) * 100, 1) : 0,
                amount = (double)Math.Round(d.totalTVA, 3)
            }).OrderByDescending(x => x.rate).ToList();

            return Ok(result);
        }

        // GET: api/Statistics/top-clients?companyId=1&from=...&to=...
        [HttpGet("top-clients")]
        public async Task<IActionResult> GetTopClients([FromQuery] int companyId, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            var query = _context.Invoices
                .Where(i => i.CompanyId == companyId && i.Status == "Validée");

            if (from.HasValue) query = query.Where(i => i.Date >= from.Value);
            if (to.HasValue) query = query.Where(i => i.Date <= to.Value);

            var topClients = await query
                .GroupBy(i => new { i.ClientId, i.ClientName })
                .Select(g => new
                {
                    name = g.Key.ClientName,
                    invoiceCount = g.Count(),
                    totalCA = g.Sum(x => x.TotalHT),
                    totalTTC = g.Sum(x => x.TotalTTC)
                })
                .OrderByDescending(x => x.totalTTC)
                .Take(5)
                .ToListAsync();

            return Ok(topClients);
        }

        // GET: api/Statistics/tax-summary?companyId=1&month=4&year=2024
        [HttpGet("tax-summary")]
        public async Task<IActionResult> GetTaxSummary([FromQuery] int companyId, [FromQuery] int month, [FromQuery] int year)
        {
            var invoices = await _context.Invoices
                .Where(i => i.CompanyId == companyId && i.Date.Month == month && i.Date.Year == year && i.Status == "Validée")
                .ToListAsync();

            var totalCaHT = invoices.Sum(i => i.TotalHT);
            var totalTva = invoices.Sum(i => i.TotalTVA);
            var totalStamp = invoices.Sum(i => i.StampDuty);
            var invoiceCount = invoices.Count;

            // Detail by tax rate
            var detailByRate = await _context.InvoiceLines
                .Include(l => l.Invoice)
                .Where(l => l.Invoice != null && l.Invoice.CompanyId == companyId && l.Invoice.Date.Month == month && l.Invoice.Date.Year == year && l.Invoice.Status == "Validée")
                .GroupBy(l => l.TvaRate)
                .Select(g => new
                {
                    rate = g.Key,
                    baseHT = g.Sum(x => x.TotalHT),
                    taxAmount = g.Sum(x => x.TotalTVA)
                })
                .OrderBy(x => x.rate)
                .ToListAsync();

            return Ok(new
            {
                totalCaHT = Math.Round(totalCaHT, 3),
                totalTva = Math.Round(totalTva, 3),
                totalStamp = Math.Round(totalStamp, 3),
                invoiceCount,
                netToPay = Math.Round(totalTva + totalStamp, 3), // Currently no deductible TVA
                details = detailByRate.Select(d => new {
                    rate = d.rate,
                    baseHT = Math.Round(d.baseHT, 3),
                    taxAmount = Math.Round(d.taxAmount, 3)
                }).ToList()
            });
        }

        // GET: api/Statistics/global/regional-distribution
        [HttpGet("global/regional-distribution")]
        public async Task<IActionResult> GetGlobalRegionalDistribution()
        {
            var distribution = await _context.Companies
                .Include(c => c.Invoices)
                .Select(c => new
                {
                    City = c.City,
                    InvoiceCount = c.Invoices.Count,
                    TotalTTC = c.Invoices.Sum(i => i.TotalTTC)
                })
                .ToListAsync();

            var grouped = distribution
                .GroupBy(x => string.IsNullOrWhiteSpace(x.City) ? "AUTRE" : x.City.Trim().ToUpper())
                .Select(g => new
                {
                    region = g.Key,
                    count = g.Sum(x => x.InvoiceCount),
                    amount = Math.Round(g.Sum(x => x.TotalTTC), 3),
                    companies = g.Count()
                })
                .OrderByDescending(x => x.count)
                .ToList();

            return Ok(grouped);
        }
    }
}
