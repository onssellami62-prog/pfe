using System;
using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class Notification
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        public int? CompanyId { get; set; }

        [Required]
        public string Type { get; set; } = string.Empty; // invoice, account, security, client, product, company

        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Message { get; set; } = string.Empty;

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
