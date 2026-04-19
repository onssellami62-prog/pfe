using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace backend.Models
{
    public class Client
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string MatriculeFiscal { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;

        // Relationship: A client belongs to a specific company (the issuer)
        public int CompanyId { get; set; }
        [JsonIgnore]
        public Company? Company { get; set; }
    }
}
