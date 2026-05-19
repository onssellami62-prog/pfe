using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProduitsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProduitsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var produits = await _context.Produits
                .OrderBy(p => p.Nom)
                .Select(p => new {
                    p.Id,
                    p.Nom,
                    p.Description,
                    p.PrixUnitaire,
                    p.TauxTVA,
                    p.ItemCode,
                    p.UniteMessure
                })
                .ToListAsync();
            return Ok(produits);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var produit = await _context.Produits.FindAsync(id);
            if (produit == null) return NotFound();
            return Ok(produit);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Produit dto)
        {
            _context.Produits.Add(dto);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Produit créé.", id = dto.Id });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Produit dto)
        {
            var produit = await _context.Produits.FindAsync(id);
            if (produit == null) return NotFound();
            produit.Nom = dto.Nom;
            produit.Description = dto.Description;
            produit.PrixUnitaire = dto.PrixUnitaire;
            produit.TauxTVA = dto.TauxTVA;
            produit.ItemCode = dto.ItemCode;
            produit.UniteMessure = dto.UniteMessure;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Produit mis à jour." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var produit = await _context.Produits.FindAsync(id);
            if (produit == null) return NotFound();
            _context.Produits.Remove(produit);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Produit supprimé." });
        }
    }
}