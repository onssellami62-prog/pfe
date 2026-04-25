using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using System.Text.RegularExpressions;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClientsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        // Format TTN tunisien : 1234567ABM000 (13 car. SANS séparateurs)
        private static readonly Regex MfRegex = new Regex(
            @"^\d{7}[A-Z]{3}\d{3}$",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        public ClientsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Clients?companyId=1
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Client>>> GetClients([FromQuery] int? companyId)
        {
            var query = _context.Clients.AsQueryable();
            if (companyId.HasValue)
                query = query.Where(c => c.CompanyId == companyId.Value);

            return await query.OrderBy(c => c.Name).ToListAsync();
        }

        // GET: api/Clients/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Client>> GetClient(int id)
        {
            var client = await _context.Clients.FindAsync(id);
            if (client == null) return NotFound();
            return client;
        }

        // POST: api/Clients
        [HttpPost]
        public async Task<ActionResult<Client>> CreateClient(Client client)
        {
            // Validation nom
            if (string.IsNullOrWhiteSpace(client.Name))
                return BadRequest("Le nom du client est obligatoire.");

            // Validation matricule présent
            if (string.IsNullOrWhiteSpace(client.MatriculeFiscal))
                return BadRequest("Le matricule fiscal est obligatoire.");

            // Validation format matricule fiscal tunisien (1234567ABM000 — 13 caractères)
            var mf = client.MatriculeFiscal.Trim().ToUpper().Replace("/", "");
            if (!MfRegex.IsMatch(mf))
                return BadRequest("Format de matricule fiscal invalide. Format attendu : 1234567ABM000 (7 chiffres + 3 lettres + 3 chiffres, 13 caractères au total).");

            client.MatriculeFiscal = mf; // Normaliser en majuscules

            // Vérification unicité GLOBALE (pas seulement par société)
            var exists = await _context.Clients.AnyAsync(c =>
                c.MatriculeFiscal.ToUpper() == mf);

            if (exists)
                return BadRequest($"Un client avec le matricule fiscal '{mf}' existe déjà dans le système. Chaque matricule fiscal doit être unique.");

            _context.Clients.Add(client);
            await _context.SaveChangesAsync();

            // Notification
            int.TryParse(Request.Query["userId"].ToString(), out int nUserId);
            if (nUserId > 0)
            {
                _context.Notifications.Add(new Notification
                {
                    UserId = nUserId,
                    CompanyId = client.CompanyId,
                    Type = "client",
                    Title = "Client ajoute",
                    Message = $"Client {client.Name} ajoute avec succes.",
                    CreatedAt = DateTime.Now
                });
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(GetClient), new { id = client.Id }, client);
        }

        // PUT: api/Clients/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateClient(int id, Client updatedClient)
        {
            var client = await _context.Clients.FindAsync(id);
            if (client == null) return NotFound();

            // Unicité globale (exclure le client lui-même)
            var newMf = (updatedClient.MatriculeFiscal ?? "").Trim().ToUpper().Replace("/", "");
            if (!MfRegex.IsMatch(newMf))
                return BadRequest("Format de matricule fiscal invalide. Format attendu : 1234567ABM000.");

            // Unicité globale (exclure le client lui-même)
            var duplicate = await _context.Clients.AnyAsync(c =>
                c.MatriculeFiscal.ToUpper() == newMf && c.Id != id);

            if (duplicate)
                return BadRequest($"Le matricule fiscal '{newMf}' est déjà utilisé par un autre client.");

            client.Name = updatedClient.Name;
            client.MatriculeFiscal = newMf;
            client.Address = updatedClient.Address;
            client.City = updatedClient.City;
            client.Phone = updatedClient.Phone;
            client.RNE = updatedClient.RNE;

            await _context.SaveChangesAsync();
            return Ok(client);
        }

        // DELETE: api/Clients/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteClient(int id)
        {
            var client = await _context.Clients.FindAsync(id);
            if (client == null) return NotFound();

            _context.Clients.Remove(client);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
