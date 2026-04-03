using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InvoicesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public InvoicesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Invoices?companyId=1
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetInvoices([FromQuery] int? companyId)
        {
            var query = _context.Invoices
                .Include(i => i.Lines)
                .Include(i => i.Client)
                .AsQueryable();

            if (companyId.HasValue)
                query = query.Where(i => i.CompanyId == companyId.Value);

            var invoices = await query
                .OrderByDescending(i => i.Date)
                .Select(i => new
                {
                    i.Id,
                    i.InvoiceNumber,
                    i.DocumentType,
                    i.Date,
                    i.ClientId,
                    i.ClientName,
                    i.ClientMatricule,
                    i.ClientAddress,
                    i.PeriodFrom,
                    i.PeriodTo,
                    i.TotalHT,
                    i.TotalTVA,
                    i.StampDuty,
                    i.TotalTTC,
                    i.Status,
                    i.CompanyId,
                    Lines = i.Lines.Select(l => new
                    {
                        l.Id,
                        l.ProductId,
                        l.Description,
                        l.Unit,
                        l.Qty,
                        l.TvaRate,
                        l.UnitPriceHT,
                        l.TotalHT,
                        l.TotalTVA
                    }).ToList()
                })
                .ToListAsync();

            return Ok(invoices);
        }

        // GET: api/Invoices/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Invoice>> GetInvoice(int id)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Lines)
                .Include(i => i.Client)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null) return NotFound();
            return invoice;
        }

        // GET: api/Invoices/next-number?companyId=1&year=2026
        [HttpGet("next-number")]
        public async Task<ActionResult<object>> GetNextInvoiceNumber([FromQuery] int companyId, [FromQuery] int? year)
        {
            int currentYear = year ?? DateTime.UtcNow.Year;

            // Count invoices for this company in the current year
            int count = await _context.Invoices
                .Where(i => i.CompanyId == companyId && i.Date.Year == currentYear)
                .CountAsync();

            string nextNumber = $"FAC-{currentYear}-{(count + 1):D4}";
            return Ok(new { nextNumber, year = currentYear, count = count + 1 });
        }

        // POST: api/Invoices  — Création complète avec lignes
        [HttpPost]
        public async Task<ActionResult<Invoice>> CreateInvoice(Invoice invoice)
        {
            if (invoice.CompanyId <= 0)
                return BadRequest("La société émettrice est obligatoire.");

            if (string.IsNullOrWhiteSpace(invoice.ClientName))
                return BadRequest("Le client est obligatoire.");

            if (!invoice.Lines.Any())
                return BadRequest("La facture doit contenir au moins une ligne.");

            // Auto-generate invoice number if not provided
            if (string.IsNullOrWhiteSpace(invoice.InvoiceNumber))
            {
                int year = invoice.Date.Year == 1 ? DateTime.UtcNow.Year : invoice.Date.Year;
                int count = await _context.Invoices
                    .Where(i => i.CompanyId == invoice.CompanyId && i.Date.Year == year)
                    .CountAsync();
                invoice.InvoiceNumber = $"FAC-{year}-{(count + 1):D4}";
            }

            // Set invoice date if not set
            if (invoice.Date == default)
                invoice.Date = DateTime.UtcNow;

            // Recalculate totals server-side for integrity
            decimal totalHT = 0;
            decimal totalTVA = 0;

            foreach (var line in invoice.Lines)
            {
                line.TotalHT = Math.Round(line.Qty * line.UnitPriceHT, 3);
                line.TotalTVA = Math.Round(line.TotalHT * (line.TvaRate / 100m), 3);
                totalHT += line.TotalHT;
                totalTVA += line.TotalTVA;
            }

            invoice.TotalHT = Math.Round(totalHT, 3);
            invoice.TotalTVA = Math.Round(totalTVA, 3);
            invoice.TotalTTC = Math.Round(totalHT + totalTVA + invoice.StampDuty, 3);
            invoice.Status = "Brouillon";

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetInvoice), new { id = invoice.Id }, invoice);
        }

        // PUT: api/Invoices/5/status  — Mise à jour du statut uniquement
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] string status)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null) return NotFound();

            invoice.Status = status;
            await _context.SaveChangesAsync();
            return Ok(new { invoice.Id, invoice.InvoiceNumber, invoice.Status });
        }

        // DELETE: api/Invoices/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInvoice(int id)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Lines)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null) return NotFound();

            _context.Invoices.Remove(invoice);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
