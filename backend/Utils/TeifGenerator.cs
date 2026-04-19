using System.Text;
using System.Text.RegularExpressions;
using backend.Models;

namespace backend.Utils
{
    public static class TeifGenerator
    {
        private class SplitMF {
            public string Id88 { get; set; } = "";
            public string Id89 { get; set; } = "";
            public string Id90 { get; set; } = "";
            public string Id91 { get; set; } = "";
        }

        private static SplitMF SplitMatricule(string mf) {
            string clean = Regex.Replace(mf ?? "", "[^a-zA-Z0-9]", "").ToUpper();
            if (clean.Length < 13) return new SplitMF { Id88 = clean };
            
            return new SplitMF {
                Id88 = clean.Substring(0, 8),   // 8 chars (7 digit + key)
                Id89 = clean.Substring(8, 1),   // Code TVA
                Id90 = clean.Substring(9, 1),   // Category
                Id91 = clean.Substring(clean.Length - 3) // 3 chars estab
            };
        }

        public static string GenerateXml(Invoice invoice, Company company)
        {
            var sb = new StringBuilder();
            string dateCCYYMMDD = invoice.Date.ToString("yyyyMMdd");
            var senderMF = SplitMatricule(company.RegistrationNumber);
            var receiverMF = SplitMatricule(invoice.ClientMatricule);

            // Group by TVA rate for the TAXSECTION
            var tvaGroups = invoice.Lines
                .GroupBy(l => l.TvaRate)
                .Select(g => new { 
                    Rate = g.Key, 
                    HT = g.Sum(l => l.TotalHT), 
                    TVA = g.Sum(l => l.TotalTVA) 
                });

            sb.AppendLine("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
            sb.AppendLine("<TEIF xmlns=\"urn:tn:gov:dgi:teif:2.0\" version=\"2.0\" controlingAgency=\"TTN\">");
            sb.AppendLine("  <INVOICEHEADER>");
            sb.AppendFormat("    <MessageSenderIdentifier>{0}{1}{2}{3}</MessageSenderIdentifier>\n", senderMF.Id88, senderMF.Id89, senderMF.Id90, senderMF.Id91);
            sb.AppendFormat("    <MessageRecieverIdentifier>{0}{1}{2}{3}</MessageRecieverIdentifier>\n", receiverMF.Id88, receiverMF.Id89, receiverMF.Id90, receiverMF.Id91);
            sb.AppendLine("  </INVOICEHEADER>");
            sb.AppendLine("  <INVOICEBODY>");
            sb.AppendLine("    <BGM>");
            sb.AppendFormat("      <Element1001>{0}</Element1001>\n", invoice.DocumentType);
            sb.AppendLine("    </BGM>");
            sb.AppendFormat("    <DTM>{0}</DTM>\n", dateCCYYMMDD);
            sb.AppendLine("    ");
            sb.AppendLine("    <PartnerSection>");
            sb.AppendLine("      <NAD>");
            sb.AppendLine("        <PartyType>SE</PartyType>");
            sb.AppendFormat("        <ID_0088>{0}</ID_0088>\n", senderMF.Id88);
            sb.AppendFormat("        <ID_0089>{0}</ID_0089>\n", senderMF.Id89);
            sb.AppendFormat("        <ID_0090>{0}</ID_0090>\n", senderMF.Id90);
            sb.AppendFormat("        <ID_0091>{0}</ID_0091>\n", senderMF.Id91);
            sb.AppendFormat("        <Name>{0}</Name>\n", company.Name);
            sb.AppendFormat("        <Address>{0}</Address>\n", company.Address);
            sb.AppendLine("        <City>Tunis</City>");
            sb.AppendLine("      </NAD>");
            sb.AppendLine("      <NAD>");
            sb.AppendLine("        <PartyType>BY</PartyType>");
            sb.AppendFormat("        <ID_0088>{0}</ID_0088>\n", receiverMF.Id88);
            sb.AppendFormat("        <ID_0089>{0}</ID_0089>\n", receiverMF.Id89);
            sb.AppendFormat("        <ID_0090>{0}</ID_0090>\n", receiverMF.Id90);
            sb.AppendFormat("        <ID_0091>{0}</ID_0091>\n", receiverMF.Id91);
            sb.AppendFormat("        <Name>{0}</Name>\n", invoice.ClientName);
            sb.AppendFormat("        <Address>{0}</Address>\n", invoice.ClientAddress);
            sb.AppendLine("        <City>Tunis</City>");
            sb.AppendLine("      </NAD>");
            sb.AppendLine("    </PartnerSection>");
            sb.AppendLine("");
            sb.AppendLine("    <LINSECTION>");
            int lineCount = 1;
            var lines = invoice.Lines != null && invoice.Lines.Any() 
                ? invoice.Lines.ToList() 
                : new List<InvoiceLine> { new InvoiceLine { Description = "Ligne de test", Qty = 1, UnitPriceHT = 0 } };
            
            foreach (var line in lines)
            {
                sb.AppendLine("      <LIN>");
                sb.AppendFormat("        <Element1082>{0}</Element1082>\n", lineCount++);
                sb.AppendFormat("        <Element7008>{0}</Element7008>\n", line.Description);
                sb.AppendFormat("        <Element6060>{0:F3}</Element6060>\n", line.Qty);
                sb.AppendFormat("        <Element5118>{0:F3}</Element5118>\n", line.UnitPriceHT);
                sb.AppendFormat("        <MOA>{0:F3}</MOA>\n", line.TotalHT);
                sb.AppendLine("      </LIN>");
            }
            sb.AppendLine("    </LINSECTION>");
            sb.AppendLine("");
            sb.AppendLine("    <TAXSECTION>");
            foreach (var group in tvaGroups)
            {
                sb.AppendLine("      <TaxGroup>");
                sb.AppendLine("        <TaxCategoryCode>I-1602</TaxCategoryCode>");
                sb.AppendFormat("        <TaxRate>{0:F3}</TaxRate>\n", group.Rate);
                sb.AppendFormat("        <TaxBaseAmount>{0:F3}</TaxBaseAmount>\n", group.HT);
                sb.AppendFormat("        <TaxAmount>{0:F3}</TaxAmount>\n", group.TVA);
                sb.AppendLine("      </TaxGroup>");
            }
            
            // Stamp Duty
            sb.AppendLine("      <TaxGroup>");
            sb.AppendLine("        <TaxCategoryCode>I-1601</TaxCategoryCode>");
            sb.AppendFormat("        <TaxAmount>{0:F3}</TaxAmount>\n", invoice.StampDuty);
            sb.AppendLine("      </TaxGroup>");
            
            // Total HT global
            sb.AppendLine("      <TaxGroup>");
            sb.AppendLine("        <TaxCategoryCode>I-176</TaxCategoryCode>");
            sb.AppendFormat("        <TaxBaseAmount>{0:F3}</TaxBaseAmount>\n", invoice.TotalHT);
            sb.AppendLine("      </TaxGroup>");

            sb.AppendLine("    </TAXSECTION>");
            sb.AppendLine("");
            sb.AppendLine("    <MOASECTION>");
            sb.AppendLine("      <MOA>");
            sb.AppendLine("        <Element5025>79</Element5025>");
            sb.AppendFormat("        <Element5004>{0:F3}</Element5004>\n", invoice.TotalHT);
            sb.AppendLine("      </MOA>");
            sb.AppendLine("      <MOA>");
            sb.AppendLine("        <Element5025>176</Element5025>");
            sb.AppendFormat("        <Element5004>{0:F3}</Element5004>\n", invoice.TotalTVA);
            sb.AppendLine("      </MOA>");
            sb.AppendLine("      <MOA>");
            sb.AppendLine("        <Element5025>128</Element5025>");
            sb.AppendFormat("        <Element5004>{0:F3}</Element5004>\n", invoice.TotalTTC);
            sb.AppendLine("      </MOA>");
            sb.AppendLine("    </MOASECTION>");
            sb.AppendLine("");
            sb.AppendLine("  </INVOICEBODY>");
            sb.AppendLine("  <ds:Signature xmlns:ds=\"http://www.w3.org/2000/09/xmldsig#\"></ds:Signature>");
            sb.AppendLine("</TEIF>");

            return sb.ToString();
        }
    }
}
