using System.Collections.Generic;

namespace backend.Models
{
    public class Company
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string RegistrationNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string PostalCode { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;

        public ICollection<User> Users { get; set; } = new List<User>();
        public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
        public ICollection<Client> Clients { get; set; } = new List<Client>();
        public ICollection<Product> Products { get; set; } = new List<Product>();
    }
}
