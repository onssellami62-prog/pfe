using System;

namespace backend.DTOs
{
    public class LoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class AuthResponseDto
    {
        public int UserId { get; set; }
        public string Token { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Entreprise { get; set; } = string.Empty;
        public string MatriculeFiscal { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public int? CompanyId { get; set; }
        public List<CompanySummaryDto> Companies { get; set; } = new List<CompanySummaryDto>();
        public DateTime? LastActivity { get; set; }
    }

    public class CompanySummaryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string RegistrationNumber { get; set; } = string.Empty;
    }

    public class ForgotPasswordDto
    {
        public string Email { get; set; } = string.Empty;
    }

    public class ResetPasswordDto
    {
        public string Email { get; set; } = string.Empty;
        public string OtpCode { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}
