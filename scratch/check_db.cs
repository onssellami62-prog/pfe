
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
optionsBuilder.UseMySql("server=localhost;database=elfatoora_db;user=root;password=root", ServerVersion.AutoDetect("server=localhost;database=elfatoora_db;user=root;password=root"));

using (var context = new ApplicationDbContext(optionsBuilder.Options))
{
    var lastInvoice = context.Invoices.Include(i => i.Lines).OrderByDescending(i => i.Id).FirstOrDefault();
    if (lastInvoice == null) {
        Console.WriteLine("No invoices found.");
    } else {
        Console.WriteLine($"Invoice: {lastInvoice.InvoiceNumber} (ID: {lastInvoice.Id})");
        Console.WriteLine($"Lines count: {lastInvoice.Lines.Count}");
        foreach (var line in lastInvoice.Lines) {
            Console.WriteLine($"- {line.Description}: {line.Qty} x {line.UnitPriceHT} = {line.TotalHT}");
        }
    }
}
