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
        private readonly InvoiceValidatorService _validatorService;

        public InvoicesController(ApplicationDbContext context, ISignatureService signatureService, InvoiceValidatorService validatorService)
        {
            _context = context;
            _signatureService = signatureService;
            _validatorService = validatorService;
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
                    i.DueDate,
                    i.PaymentMode,
                    i.Notes,
                    i.ClientId,
                    i.ClientName,
                    i.ClientMatricule,
                    i.ClientRNE,
                    i.ClientAddress,
                    i.RNEIssuer,
                    i.IssuerEmail,
                    i.IssuerPhone,
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
                    lines = i.Lines.Select(l => new
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

            // Set default Stamp Duty if 0
            if (invoice.StampDuty == 0)
                invoice.StampDuty = 1.000m;

            // Capture Issuer Snapshots from Company
            var company = await _context.Companies.FindAsync(invoice.CompanyId);
            if (company != null)
            {
                invoice.RNEIssuer = company.RNE;
                invoice.IssuerEmail = company.Email;
                invoice.IssuerPhone = company.Phone;
            }

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
                        CreatedAt = DateTime.Now
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

            // 3. Générer la référence TTN simulée et la persister en base
            var mfRaw = (invoice.Company?.RegistrationNumber ?? "0000000XXX000").Replace("/", "").ToUpper();
            var mfDigits = new string(mfRaw.Where(char.IsDigit).ToArray()).PadLeft(7, '0');
            if (mfDigits.Length > 7) mfDigits = mfDigits.Substring(0, 7);
            var idPart = invoice.Id.ToString().PadLeft(5, '0');
            var seedVal = ((long)long.Parse(mfDigits == "" ? "0" : mfDigits) * 7919L
                          + (long)invoice.Id * 1013L) % 100_000_000_000_000L;
            var ttnRef = $"{mfDigits}{idPart}{seedVal.ToString().PadLeft(14, '0')}".Substring(0, 26);

            // 4. Update invoice record
            invoice.SignedXmlContent = signedXml;
            invoice.IsSigned = true;
            invoice.SignedAt = DateTime.UtcNow;
            invoice.Status = "Validée";
            invoice.TtnReference = ttnRef; // ← Sauvegarde en base

            await _context.SaveChangesAsync();

            // Log activity
            _context.ActivityLogs.Add(new ActivityLog
            {
                Actor = "Système (Digital Trust)",
                Action = $"a signé électroniquement la facture {invoice.InvoiceNumber} — Réf.TTN: {ttnRef}",
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
                invoice.TtnReference,
                message = "Facture signée avec succès. Référence TTN générée."
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Erreur lors de la signature : {ex.Message}");
        }
    }

        // GET: api/Invoices/5/xml
        [HttpGet("{id}/xml")]
        public async Task<IActionResult> GetInvoiceXml(int id)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Company)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null) return NotFound("Facture introuvable.");

            // Si signée, on renvoie le XML signé
            if (invoice.IsSigned && !string.IsNullOrEmpty(invoice.SignedXmlContent))
                return Content(invoice.SignedXmlContent, "application/xml");

            // Sinon, on régénère toujours le XML frais depuis TeifGenerator (v1.8.8)
            var invoiceWithLines = await _context.Invoices
                .Include(i => i.Lines)
                .Include(i => i.Company)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoiceWithLines == null) return NotFound();
            if (invoiceWithLines.Company == null)
                invoiceWithLines.Company = await _context.Companies.FindAsync(invoiceWithLines.CompanyId);
            if (invoiceWithLines.Company == null) return BadRequest("Données de la société manquantes.");

            string xml = Utils.TeifGenerator.GenerateXml(invoiceWithLines, invoiceWithLines.Company);
            return Content(xml, "application/xml");
        }

        // POST: api/Invoices/validate-draft
        [HttpPost("validate-draft")]
        public ActionResult<Models.ValidationResult> ValidateDraftInvoice([FromBody] Invoice invoice)
        {
            if (invoice == null)
                return BadRequest("Facture invalide");

            // Debug: Log complet des données reçues
            Console.WriteLine("========== VALIDATION DEBUG ==========");
            Console.WriteLine($"ClientMatricule: '{invoice.ClientMatricule}' (Length: {invoice.ClientMatricule?.Length ?? 0})");
            Console.WriteLine($"ClientName: '{invoice.ClientName}'");
            Console.WriteLine($"ClientAddress: '{invoice.ClientAddress}'");
            Console.WriteLine($"ClientRNE: '{invoice.ClientRNE}'");
            Console.WriteLine($"TotalHT: {invoice.TotalHT}");
            Console.WriteLine($"TotalTVA: {invoice.TotalTVA}");
            Console.WriteLine($"TotalTTC: {invoice.TotalTTC}");
            Console.WriteLine($"Lines Count: {invoice.Lines?.Count ?? 0}");
            Console.WriteLine("======================================");

            var validationResult = _validatorService.ValidateInvoice(invoice);
            
            Console.WriteLine($"✅ Score final: {validationResult.ConformityScore}%");
            Console.WriteLine($"✅ Erreurs totales: {validationResult.TotalErrors}");
            Console.WriteLine($"✅ Score Client: {validationResult.CategoryScores["DonneesClient"]}/20");
            
            return Ok(validationResult);
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

        // GET: api/Invoices/{id}/verify  — Page de vérification QR (HTML mobile-friendly)
        [HttpGet("{id}/verify")]
        public async Task<IActionResult> VerifyInvoice(int id)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Company)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null)
                return Content(HtmlNotFound(id), "text/html; charset=utf-8");

            // Lire la référence TTN depuis la base de données (source de vérité)
            var mf = (invoice.Company?.RegistrationNumber ?? "0000000XXX000")
                        .Replace("/", "").ToUpper();
            var refTtn = !string.IsNullOrEmpty(invoice.TtnReference)
                ? invoice.TtnReference
                : "Non disponible";  // Factures signées avant la migration

            // Extraire EMPRUNT depuis SignatureValue (XAdES)
            string emprunt = "Non disponible";
            if (!string.IsNullOrEmpty(invoice.SignedXmlContent))
            {
                var sigMatch = System.Text.RegularExpressions.Regex.Match(
                    invoice.SignedXmlContent,
                    @"<[^:>]*:?SignatureValue[^>]*>([\s\S]*?)</[^:>]*:?SignatureValue>");
                if (sigMatch.Success)
                    emprunt = sigMatch.Groups[1].Value.Replace("\r","").Replace("\n","").Replace(" ","").Substring(0, Math.Min(44, sigMatch.Groups[1].Value.Replace("\r","").Replace("\n","").Replace(" ","").Length));
            }

            var factDate = invoice.Date.ToString("dd/MM/yyyy");
            var clientMf = (invoice.ClientMatricule ?? "").Replace("/", "").ToUpper();
            var isValid = invoice.IsSigned && invoice.Status == "Validée";

            var html = $@"<!DOCTYPE html>
<html lang=""fr"">
<head>
<meta charset=""UTF-8"">
<meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
<title>Vérification Facture — El Fatoora</title>
<style>
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f0fdf4; color:#1e293b; min-height:100vh; }}
  .header {{ background:linear-gradient(135deg,#15803d,#166534); color:white; padding:24px 20px; text-align:center; }}
  .header h1 {{ font-size:20px; font-weight:800; letter-spacing:1px; }}
  .header p {{ font-size:12px; opacity:0.85; margin-top:4px; }}
  .badge {{ display:inline-flex; align-items:center; gap:6px; margin-top:14px; padding:6px 16px; border-radius:999px; font-size:13px; font-weight:700; background:{(isValid ? "rgba(255,255,255,0.25)" : "rgba(239,68,68,0.3)")}; color:white; }}
  .container {{ max-width:480px; margin:0 auto; padding:20px 16px 40px; }}
  .card {{ background:white; border-radius:16px; box-shadow:0 2px 12px rgba(0,0,0,0.08); overflow:hidden; margin-bottom:16px; }}
  .card-title {{ background:#f0fdf4; padding:12px 18px; font-size:11px; font-weight:800; color:#15803d; text-transform:uppercase; letter-spacing:1px; border-bottom:1px solid #dcfce7; }}
  .row {{ display:flex; justify-content:space-between; align-items:center; padding:13px 18px; border-bottom:1px solid #f1f5f9; }}
  .row:last-child {{ border-bottom:none; }}
  .row label {{ font-size:11px; color:#64748b; font-weight:600; text-transform:uppercase; }}
  .row span {{ font-size:14px; font-weight:700; color:#1e293b; text-align:right; max-width:60%; word-break:break-all; }}
  .row span.green {{ color:#15803d; }}
  .row span.mono {{ font-family:monospace; font-size:12px; }}
  .footer {{ text-align:center; padding:20px; font-size:11px; color:#94a3b8; }}
  .footer strong {{ color:#15803d; }}
</style>
</head>
<body>
<div class=""header"">
  <h1>🇹🇳 EL FATOORA</h1>
  <p>Plateforme de Facturation Électronique</p>
  <div class=""badge"">{(isValid ? "✅ FACTURE CERTIFIÉE TTN" : "⚠️ NON VALIDÉE")}</div>
</div>
<div class=""container"">
  <div class=""card"">
    <div class=""card-title"">Identification de la Facture</div>
    <div class=""row""><label>Numéro</label><span class=""green"">{invoice.InvoiceNumber}</span></div>
    <div class=""row""><label>Date</label><span>{factDate}</span></div>
    <div class=""row""><label>Statut</label><span class=""{(isValid ? "green" : "")}"">{invoice.Status}</span></div>
    <div class=""row""><label>Réf. TTN</label><span class=""mono"">{(isValid ? refTtn : "—")}</span></div>
  </div>
  <div class=""card"">
    <div class=""card-title"">Parties Contractantes</div>
    <div class=""row""><label>Émetteur (MF)</label><span class=""mono"">{mf}</span></div>
    <div class=""row""><label>Client</label><span>{invoice.ClientName}</span></div>
    <div class=""row""><label>Client (MF)</label><span class=""mono"">{clientMf}</span></div>
  </div>
  <div class=""card"">
    <div class=""card-title"">Montants Fiscaux</div>
    <div class=""row""><label>Montant HT</label><span>{invoice.TotalHT:F3} DT</span></div>
    <div class=""row""><label>TVA</label><span>{invoice.TotalTVA:F3} DT</span></div>
    <div class=""row""><label>Timbre</label><span>{invoice.StampDuty:F3} DT</span></div>
    <div class=""row""><label>Net TTC</label><span class=""green"">{invoice.TotalTTC:F3} DT</span></div>
  </div>
  {(isValid ? $@"<div class=""card"">
    <div class=""card-title"">Signature Électronique (XAdES-EPES)</div>
    <div class=""row""><label>EMPRUNT</label><span class=""mono"">{emprunt}...</span></div>
    <div class=""row""><label>Signée le</label><span>{invoice.SignedAt?.ToString("dd/MM/yyyy HH:mm") ?? "—"}</span></div>
  </div>" : "")}
</div>
<div class=""footer"">
  Vérification assurée par <strong>El Fatoora</strong> • Tunisie Trade Network (TTN)
</div>
</body>
</html>";

            return Content(html, "text/html; charset=utf-8");
        }

        private static string HtmlNotFound(int id) => $@"<!DOCTYPE html>
<html><head><meta charset=""UTF-8""><title>Introuvable</title>
<style>body{{font-family:sans-serif;text-align:center;padding:60px;background:#fef2f2;color:#7f1d1d;}}</style></head>
<body><h1>❌ Facture #{id} introuvable</h1><p>Ce QR code ne correspond à aucune facture enregistrée.</p></body></html>";
    }
}
