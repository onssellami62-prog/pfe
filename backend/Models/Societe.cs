using backend.Models;
namespace backend.Models

{
    public class Societe
    {
        public int Id { get; set; }

        public string RaisonSociale { get; set; } = string.Empty;

        public string MatriculeFiscal { get; set; } = string.Empty;

        public string CodeTVA { get; set; } = string.Empty;

        public string Adresse { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Telephone { get; set; } = string.Empty;

        public DateTime DateCreation { get; set; } = DateTime.UtcNow;
        public List<Utilisateur> Utilisateurs { get; set; } = new();
    }
   
    }
