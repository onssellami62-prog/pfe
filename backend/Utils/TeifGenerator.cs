using System.Text.RegularExpressions;
using System.Xml.Linq;
using backend.Models;

namespace backend.Utils
{
    public static class TeifGenerator
    {
        private static readonly XNamespace ns = "urn:tn:gov:dgi:teif:2.0";
        private static readonly XNamespace ds = "http://www.w3.org/2000/09/xmldsig#";
        private static readonly XNamespace xades = "http://uri.etsi.org/01903/v1.3.2#";

        private class SplitMF {
            public string Id88 { get; set; } = "";
            public string Id89 { get; set; } = "";
            public string Id90 { get; set; } = "";
            public string Id91 { get; set; } = "";
            public string Full => $"{Id88}{Id89}{Id90}{Id91}";
        }

        private static SplitMF SplitMatricule(string mf) {
            string clean = Regex.Replace(mf ?? "", "[^a-zA-Z0-9]", "").ToUpper();
            if (clean.Length < 13) {
                return new SplitMF { 
                    Id88 = clean.PadRight(13, 'X').Substring(0, 8), 
                    Id89 = "X", 
                    Id90 = "X", 
                    Id91 = "000" 
                };
            }
            
            return new SplitMF {
                Id88 = clean.Substring(0, 8),
                Id89 = clean.Substring(8, 1),
                Id90 = clean.Substring(9, 1),
                Id91 = clean.Substring(10, 3)
            };
        }

        private static string ExtractCity(string address) {
            if (string.IsNullOrEmpty(address)) return "Tunis";
            var parts = address.Split(new[] { ',', ' ' }, StringSplitOptions.RemoveEmptyEntries);
            return parts.Last();
        }

        public static string GenerateXml(Invoice invoice, Company company)
        {
            var senderMF = SplitMatricule(company.RegistrationNumber);
            var receiverMF = SplitMatricule(invoice.ClientMatricule);

            var doc = new XDocument(
                new XDeclaration("1.0", "UTF-8", null),
                new XElement(ns + "TEIF",
                    new XAttribute("version", "2.0"),
                    new XAttribute("controlingAgency", "TTN"),
                    new XAttribute(XNamespace.Xmlns + "ds", ds.NamespaceName),
                    new XAttribute(XNamespace.Xmlns + "xades", xades.NamespaceName),

                    new XElement(ns + "INVOICEHEADER",
                        new XElement(ns + "MessageSenderIdentifier", new XAttribute("type", "I-01"), senderMF.Full),
                        new XElement(ns + "MessageRecieverIdentifier", new XAttribute("type", "I-01"), receiverMF.Full)
                    ),

                    new XElement(ns + "INVOICEBODY",
                        new XElement(ns + "BGM",
                            new XElement(ns + "Element1001", invoice.DocumentType)
                        ),
                        new XElement(ns + "DTM", new XAttribute("format", "102"), invoice.Date.Date.ToString("yyyyMMdd")),

                        new XElement(ns + "PartnerSection",
                            new XElement(ns + "NAD",
                                new XElement(ns + "PartyType", "SE"),
                                new XElement(ns + "ID_0088", senderMF.Id88),
                                new XElement(ns + "ID_0089", senderMF.Id89),
                                new XElement(ns + "ID_0090", senderMF.Id90),
                                new XElement(ns + "ID_0091", senderMF.Id91),
                                new XElement(ns + "Name", company.Name),
                                new XElement(ns + "Address", company.Address),
                                new XElement(ns + "City", ExtractCity(company.Address))
                            ),
                            new XElement(ns + "NAD",
                                new XElement(ns + "PartyType", "BY"),
                                new XElement(ns + "ID_0088", receiverMF.Id88),
                                new XElement(ns + "ID_0089", receiverMF.Id89),
                                new XElement(ns + "ID_0090", receiverMF.Id90),
                                new XElement(ns + "ID_0091", receiverMF.Id91),
                                new XElement(ns + "Name", invoice.ClientName),
                                new XElement(ns + "Address", invoice.ClientAddress),
                                new XElement(ns + "City", ExtractCity(invoice.ClientAddress))
                            )
                        ),

                        new XElement(ns + "LINSECTION",
                            invoice.Lines?.Select((line, idx) => 
                                new XElement(ns + "LIN",
                                    new XElement(ns + "Element1082", idx + 1),
                                    new XElement(ns + "Element7008", line.Description),
                                    new XElement(ns + "Element6060", line.Qty.ToString("F3")),
                                    new XElement(ns + "Element5118", line.UnitPriceHT.ToString("F3")),
                                    new XElement(ns + "MOA", line.TotalHT.ToString("F3"))
                                )
                            ) ?? Enumerable.Empty<XElement>()
                        ),

                        new XElement(ns + "TAXSECTION",
                            invoice.Lines?.GroupBy(l => l.TvaRate).Select(g => 
                                new XElement(ns + "TaxGroup",
                                    new XElement(ns + "TaxCategoryCode", "I-1602"),
                                    new XElement(ns + "TaxRate", g.Key.ToString("F3")),
                                    new XElement(ns + "TaxBaseAmount", g.Sum(l => l.TotalHT).ToString("F3")),
                                    new XElement(ns + "TaxAmount", g.Sum(l => l.TotalTVA).ToString("F3"))
                                )
                            ),
                            new XElement(ns + "TaxGroup",
                                new XElement(ns + "TaxCategoryCode", "I-1601"),
                                new XElement(ns + "TaxAmount", invoice.StampDuty.ToString("F3"))
                            )
                        ),

                        new XElement(ns + "MOASECTION",
                            new XElement(ns + "MOA",
                                new XElement(ns + "Element5025", "79"),
                                new XElement(ns + "Element5004", invoice.TotalHT.ToString("F3"))
                            ),
                            new XElement(ns + "MOA",
                                new XElement(ns + "Element5025", "176"),
                                new XElement(ns + "Element5004", invoice.TotalTVA.ToString("F3"))
                            ),
                            new XElement(ns + "MOA",
                                new XElement(ns + "Element5025", "128"),
                                new XElement(ns + "Element5004", invoice.TotalTTC.ToString("F3"))
                            )
                        )
                    ),
                    new XElement(ds + "Signature")
                )
            );

            return doc.ToString();
        }
    }
}
