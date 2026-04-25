using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace backend.Models
{
    public class Company
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string RegistrationNumber { get; set; } = string.Empty; // Matricule Fiscal
        public string RNE { get; set; } = string.Empty; // Registre National des Entreprises
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string PostalCode { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public bool IsArchived { get; set; } = false;
        public string? LogoPath { get; set; }

        [JsonIgnore]
        public ICollection<User> Users { get; set; } = new List<User>();
        [JsonIgnore]
        public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
        [JsonIgnore]
        public ICollection<Client> Clients { get; set; } = new List<Client>();
        [JsonIgnore]
        public ICollection<Product> Products { get; set; } = new List<Product>();
    }
}
