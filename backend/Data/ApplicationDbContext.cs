using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Company> Companies { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<InvoiceLine> InvoiceLines { get; set; }
        public DbSet<Client> Clients { get; set; }
        public DbSet<Product> Products { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Email unique for users
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // MF unique for companies
            modelBuilder.Entity<Company>()
                .HasIndex(c => c.RegistrationNumber)
                .IsUnique();

            // Invoice -> Lines (cascade delete)
            modelBuilder.Entity<InvoiceLine>()
                .HasOne(l => l.Invoice)
                .WithMany(i => i.Lines)
                .HasForeignKey(l => l.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            // InvoiceLine -> Product (optional, no cascade)
            modelBuilder.Entity<InvoiceLine>()
                .HasOne(l => l.Product)
                .WithMany()
                .HasForeignKey(l => l.ProductId)
                .OnDelete(DeleteBehavior.SetNull);

            // Client -> Company
            modelBuilder.Entity<Client>()
                .HasOne(c => c.Company)
                .WithMany(co => co.Clients)
                .HasForeignKey(c => c.CompanyId)
                .OnDelete(DeleteBehavior.Cascade);

            // Matricule Fiscal unique globalement pour les clients
            modelBuilder.Entity<Client>()
                .HasIndex(c => c.MatriculeFiscal)
                .IsUnique();

            // Product -> Company
            modelBuilder.Entity<Product>()
                .HasOne(p => p.Company)
                .WithMany(co => co.Products)
                .HasForeignKey(p => p.CompanyId)
                .OnDelete(DeleteBehavior.Cascade);

            // Invoice -> Client (optional, set null if client deleted)
            modelBuilder.Entity<Invoice>()
                .HasOne(i => i.Client)
                .WithMany()
                .HasForeignKey(i => i.ClientId)
                .OnDelete(DeleteBehavior.SetNull);

            // Invoice -> Company (no cascade — company must not be deleted if invoices exist)
            modelBuilder.Entity<Invoice>()
                .HasOne(i => i.Company)
                .WithMany(co => co.Invoices)
                .HasForeignKey(i => i.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
