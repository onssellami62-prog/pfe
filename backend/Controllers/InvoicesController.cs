using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.Services;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InvoicesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ISignatureService _signatureService;

        public InvoicesController(ApplicationDbContext context, ISignatureService signatureService)
        {
            _context = context;
            _signatureService = signatureService;
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
                    i.IsSigned,
                    i.SignedXmlContent,
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

            try 
            {
                _context.Invoices.Add(invoice);
                await _context.SaveChangesAsync();
                
                // Log activity
                string performerName = Request.Query["performerName"].ToString();
                if (string.IsNullOrEmpty(performerName)) performerName = "Système";

                _context.ActivityLogs.Add(new ActivityLog
                {
                    Actor = performerName,
                    Action = $"a créé la facture {invoice.InvoiceNumber}",
                    TargetInfo = invoice.ClientName,
                    Type = "invoice_creation",
                    Timestamp = DateTime.UtcNow
                });

                // Notification
                int.TryParse(Request.Query["userId"].ToString(), out int nUserId);
                if (nUserId > 0)
                {
                    _context.Notifications.Add(new Notification
                    {
                        UserId = nUserId,
                        CompanyId = invoice.CompanyId,
                        Type = "invoice",
                        Title = "Facture creee",
                        Message = $"Facture {invoice.InvoiceNumber} pour {invoice.ClientName} creee avec succes.",
                        CreatedAt = DateTime.UtcNow
                    });
                }
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Error Invoices] {ex.Message}");
                if (ex.InnerException != null) Console.WriteLine($"[Inner] {ex.InnerException.Message}");
            }

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

    // POST: api/Invoices/5/sign
    [HttpPost("{id}/sign")]
    public async Task<IActionResult> SignInvoice(int id)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Lines)
            .Include(i => i.Company)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice == null) return NotFound("Facture introuvable.");

        if (invoice.IsSigned)
            return BadRequest("La facture est déjà signée.");

        try
        {
            // 1. Ensure we have XML content to sign
            string xmlToSign = invoice.XmlContent;
            if (string.IsNullOrEmpty(xmlToSign))
            {
                // Fallback: Generate XML if not present
                if (invoice.Company == null) 
                    return BadRequest("Données de la société manquantes pour la génération XML.");
                
                xmlToSign = Utils.TeifGenerator.GenerateXml(invoice, invoice.Company);
                invoice.XmlContent = xmlToSign;
            }

            // 2. Sign the XML
            string signedXml = _signatureService.SignTeifXml(xmlToSign);

            // 3. Update invoice record
            invoice.SignedXmlContent = signedXml;
            invoice.IsSigned = true;
            invoice.SignedAt = DateTime.UtcNow;
            invoice.Status = "Validée";

            await _context.SaveChangesAsync();

            // Log activity
            _context.ActivityLogs.Add(new ActivityLog
            {
                Actor = "Système (Digital Trust)",
                Action = $"a signé électroniquement la facture {invoice.InvoiceNumber}",
                TargetInfo = invoice.ClientName,
                Type = "invoice_signature",
                Timestamp = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            return Ok(new
            {
                invoice.Id,
                invoice.InvoiceNumber,
                invoice.Status,
                invoice.IsSigned,
                invoice.SignedAt,
                message = "Facture signée avec succès."
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Erreur lors de la signature : {ex.Message}");
        }
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

            // Notification
            int.TryParse(Request.Query["userId"].ToString(), out int nUserId);
            if (nUserId > 0)
            {
                _context.Notifications.Add(new Notification
                {
                    UserId = nUserId,
                    CompanyId = invoice.CompanyId,
                    Type = "invoice",
                    Title = "Facture supprimee",
                    Message = $"Facture {invoice.InvoiceNumber} supprimee.",
                    CreatedAt = DateTime.UtcNow
                });
            }
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
