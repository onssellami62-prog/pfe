using System;
using System.Linq;
using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

// Setup
var serviceProvider = new ServiceCollection()
    .AddDbContext<ApplicationDbContext>(options =>
        options.UseMySql("server=localhost;database=pfe_db;user=root;password=", 
            new MySqlServerVersion(new Version(8, 0, 21))))
    .BuildServiceProvider();

using var scope = serviceProvider.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

Console.WriteLine("Updating Companies RNE...");
var companies = db.Companies.ToList();
int count = 1;
foreach (var co in companies)
{
    co.RNE = $"{1000000 + count:D7}A";
    count++;
}

Console.WriteLine("Updating Clients RNE...");
var clients = db.Clients.ToList();
foreach (var cl in clients)
{
    cl.RNE = $"{2000000 + count:D7}B";
    count++;
}

db.SaveChanges();
Console.WriteLine("Database update completed successfully.");
