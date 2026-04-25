namespace backend.Models
{
    public class ValidationError
    {
        public string Code { get; set; } = string.Empty;
        public string Field { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty; // Critique, Majeure, Mineure
        public string SuggestedSolution { get; set; } = string.Empty;
        public int Points { get; set; } = 0; // Points perdus pour cette erreur
    }
}
