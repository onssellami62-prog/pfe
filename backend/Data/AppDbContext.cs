using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<Societe> Societes { get; set; }
        public DbSet<Utilisateur> Utilisateurs { get; set; }
        public DbSet<Client> Clients { get; set; }
        public DbSet<Produit> Produits { get; set; }
        public DbSet<Facture> Factures { get; set; }
        public DbSet<LigneFacture> LigneFactures { get; set; }
    }
}