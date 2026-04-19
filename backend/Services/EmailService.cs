using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace backend.Services
{
    public class EmailService : IEmailService
    {
        public async Task SendEmailAsync(string to, string subject, string body)
        {
            // === CONFIGURATION SMTP À REMPLIR PAR VOUS MÊME ===
            string expediteurEmail = "ja7479845@gmail.com"; // L'e-mail qui ENVOIE
            string expediteurMdp = "bfwb mhmj ypen sfvy"; // Mot de passe d'application généré
            // ===================================================

            try
            {
                var smtpClient = new SmtpClient("smtp.gmail.com")
                {
                    Port = 587,
                    Credentials = new NetworkCredential(expediteurEmail, expediteurMdp),
                    EnableSsl = true,
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(expediteurEmail, "El Fatoora - Sécurité"),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = false,
                };

                mailMessage.To.Add(to);

                await smtpClient.SendMailAsync(mailMessage);
                Console.WriteLine($"[SUCCÈS] E-mail OTP réellement envoyé à : {to}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERREUR SMTP] Impossible d'envoyer l'e-mail: {ex.Message}");
                // Si les identifiants ne sont pas configurés, ça plantera ici mais ne bloquera pas l'application
            }
        }
    }
}
