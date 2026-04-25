using System.Collections.Generic;
using System.Linq;

namespace backend.Models
{
    public class ValidationResult
    {
        public bool IsValid { get; set; } = true;
        public int ConformityScore { get; set; } = 100; // Score sur 100
        public string ConformityLevel { get; set; } = "Excellent"; // Excellent, Bon, Moyen, Faible
        public List<ValidationError> Errors { get; set; } = new List<ValidationError>();
        public Dictionary<string, int> CategoryScores { get; set; } = new Dictionary<string, int>();
        public decimal RejectionProbability { get; set; } = 0; // Probabilité de rejet (0-1)
        
        public int TotalErrors => Errors.Count;
        public int CriticalErrors => Errors.Count(e => e.Severity == "Critique");
        public int MajorErrors => Errors.Count(e => e.Severity == "Majeure");
        public int MinorErrors => Errors.Count(e => e.Severity == "Mineure");
    }
}
