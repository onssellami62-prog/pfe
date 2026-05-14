using System.Text.RegularExpressions;
using System.Xml.Linq;
using backend.Models;

namespace backend.Utils
{
    public static class TeifGenerator
    {
        // TEIF v1.8.8 has NO targetNamespace — elements are unqualified
        private static readonly XNamespace ds = "http://www.w3.org/2000/09/xmldsig#";

        // -------------------------------------------------------------------
        // Helper: normalise the Matricule Fiscal to exactly 13 chars
        // Format: 7 digits + letter + letter + letter + 3 digits  (I-01)
        // -------------------------------------------------------------------
        private static string NormaliseMatricule(string mf)
        {
            string clean = Regex.Replace(mf ?? "", "[^a-zA-Z0-9]", "").ToUpper();
            // Pad or truncate to 13 characters so the XSD assert passes
            if (clean.Length < 13)
                clean = clean.PadRight(13, '0');
            else if (clean.Length > 13)
                clean = clean.Substring(0, 13);
            return clean;
        }

        // -------------------------------------------------------------------
        // Helper: format a date as ddMMyy (required by XSD DtmDetailType)
        // -------------------------------------------------------------------
        private static string FormatDate(DateTime d) => d.ToString("ddMMyy");

        // -------------------------------------------------------------------
        // Helper: build a <Moa> element with the mandatory attributes
        //   amountTypeCode codes (v1.8.8):
        //     I-171 … I-188  — see XSD enumeration
        //   Typical usage:
        //     I-171  Line net amount (HT per line)
        //     I-176  Tax amount (TVA total)
        //     I-177  Total TTC
        //     I-179  Total HT (taxable base)
        //     I-175  Stamp duty
        // -------------------------------------------------------------------
        private static XElement MoaElement(string amountTypeCode, decimal amount)
        {
            return new XElement("Moa",
                new XAttribute("currencyCodeList", "ISO_4217"),
                new XAttribute("amountTypeCode", amountTypeCode),
                new XElement("Amount",
                    new XAttribute("currencyIdentifier", "TND"),
                    amount.ToString("F3")
                )
            );
        }

        // -------------------------------------------------------------------
        // Helper: wrap a Moa inside an AmountDetails container
        // -------------------------------------------------------------------
        private static XElement AmountDetails(string amountTypeCode, decimal amount)
        {
            return new XElement("AmountDetails",
                new XElement("MoaDetails",
                    MoaElement(amountTypeCode, amount)
                )
            );
        }

        // -------------------------------------------------------------------
        // Main entry point
        // -------------------------------------------------------------------
        public static string GenerateXml(Invoice invoice, Company company)
        {
            string senderMF   = NormaliseMatricule(company.RegistrationNumber);
            string receiverMF = NormaliseMatricule(invoice.ClientMatricule);

            var lines = invoice.Lines ?? new List<InvoiceLine>();

            var doc = new XDocument(
                new XDeclaration("1.0", "UTF-8", null),
                new XElement("TEIF",
                    new XAttribute("version", "1.8.8"),
                    new XAttribute("controlingAgency", "TTN"),
                    new XAttribute(XNamespace.Xmlns + "ds", ds.NamespaceName),

                    // ── InvoiceHeader ─────────────────────────────────────
                    new XElement("InvoiceHeader",
                        new XElement("MessageSenderIdentifier",
                            new XAttribute("type", "I-01"),
                            senderMF
                        ),
                        new XElement("MessageRecieverIdentifier",
                            new XAttribute("type", "I-01"),
                            receiverMF
                        )
                    ),

                    // ── InvoiceBody ───────────────────────────────────────
                    new XElement("InvoiceBody",

                        // Bgm — document identification
                        new XElement("Bgm",
                            new XElement("DocumentIdentifier", invoice.InvoiceNumber ?? invoice.Id.ToString()),
                            new XElement("DocumentType",
                                new XAttribute("code", "I-11"),   // I-11 = Facture
                                "Facture"
                            )
                        ),

                        // Dtm — invoice date  (functionCode I-31 = Invoice date)
                        new XElement("Dtm",
                            new XElement("DateText",
                                new XAttribute("functionCode", "I-31"),
                                new XAttribute("format", "ddMMyy"),
                                FormatDate(invoice.Date)
                            )
                        ),

                        // PartnerSection — Seller (I-61) + Buyer (I-62)
                        new XElement("PartnerSection",

                            // Seller
                            new XElement("PartnerDetails",
                                new XAttribute("functionCode", "I-61"),
                                new XElement("Nad",
                                    new XElement("PartnerIdentifier",
                                        new XAttribute("type", "I-01"),
                                        senderMF
                                    ),
                                    new XElement("PartnerName",
                                        new XAttribute("nameType", "Qualification"),
                                        company.Name ?? ""
                                    ),
                                    new XElement("PartnerAdresses",
                                        new XElement("AdressDescription", company.Address ?? ""),
                                        new XElement("Country",
                                            new XAttribute("codeList", "ISO_3166-1"),
                                            "TN"
                                        )
                                    )
                                )
                            ),

                            // Buyer
                            new XElement("PartnerDetails",
                                new XAttribute("functionCode", "I-62"),
                                new XElement("Nad",
                                    new XElement("PartnerIdentifier",
                                        new XAttribute("type", "I-01"),
                                        receiverMF
                                    ),
                                    new XElement("PartnerName",
                                        new XAttribute("nameType", "Qualification"),
                                        invoice.ClientName ?? ""
                                    ),
                                    new XElement("PartnerAdresses",
                                        new XElement("AdressDescription", invoice.ClientAddress ?? ""),
                                        new XElement("Country",
                                            new XAttribute("codeList", "ISO_3166-1"),
                                            "TN"
                                        )
                                    )
                                )
                            )
                        ),

                        // LinSection — one <Lin> per invoice line
                        new XElement("LinSection",
                            lines.Select((line, idx) =>
                                new XElement("Lin",
                                    new XElement("ItemIdentifier", (idx + 1).ToString()),
                                    new XElement("LinImd",
                                        new XAttribute("lang", "fr"),
                                        new XElement("ItemCode", line.Id > 0 ? line.Id.ToString() : (idx + 1).ToString()),
                                        new XElement("ItemDescription", line.Description ?? "")
                                    ),
                                    new XElement("LinQty",
                                        new XElement("Quantity",
                                            new XAttribute("measurementUnit", "UN"),
                                            line.Qty.ToString("F3")
                                        )
                                    ),
                                    new XElement("LinTax",
                                        new XElement("TaxTypeName",
                                            new XAttribute("code", "I-1602"),  // I-1602 = TVA
                                            "TVA"
                                        ),
                                        new XElement("TaxDetails",
                                            new XElement("TaxRate", ((int)line.TvaRate).ToString())
                                        )
                                    ),
                                    new XElement("LinMoa",
                                        // I-171 = line net amount (HT)
                                        new XElement("MoaDetails",
                                            MoaElement("I-171", line.TotalHT)
                                        )
                                    )
                                )
                            )
                        ),

                        // InvoiceMoa — invoice-level amounts
                        new XElement("InvoiceMoa",
                            // I-179 = Total taxable amount (HT)
                            new XElement("AmountDetails",
                                new XElement("MoaDetails", MoaElement("I-179", invoice.TotalHT))
                            ),
                            // I-176 = Total tax amount (TVA)
                            new XElement("AmountDetails",
                                new XElement("MoaDetails", MoaElement("I-176", invoice.TotalTVA))
                            ),
                            // I-175 = Stamp duty
                            new XElement("AmountDetails",
                                new XElement("MoaDetails", MoaElement("I-175", invoice.StampDuty))
                            ),
                            // I-177 = Total payable (TTC)
                            new XElement("AmountDetails",
                                new XElement("MoaDetails", MoaElement("I-177", invoice.TotalTTC))
                            )
                        ),

                        // InvoiceTax — one entry per TVA rate group + stamp duty
                        new XElement("InvoiceTax",
                            // TVA groups
                            lines.GroupBy(l => l.TvaRate).Select(g =>
                                new XElement("InvoiceTaxDetails",
                                    new XElement("Tax",
                                        new XElement("TaxTypeName",
                                            new XAttribute("code", "I-1602"),
                                            "TVA"
                                        ),
                                        new XElement("TaxDetails",
                                            new XElement("TaxRate", ((int)g.Key).ToString())
                                        )
                                    ),
                                    // taxable base for this rate
                                    new XElement("AmountDetails",
                                        new XElement("MoaDetails",
                                            MoaElement("I-179", g.Sum(l => l.TotalHT))
                                        )
                                    ),
                                    // tax amount for this rate
                                    new XElement("AmountDetails",
                                        new XElement("MoaDetails",
                                            MoaElement("I-176", g.Sum(l => l.TotalTVA))
                                        )
                                    )
                                )
                            ),
                            // Stamp duty (I-1601)
                            new XElement("InvoiceTaxDetails",
                                new XElement("Tax",
                                    new XElement("TaxTypeName",
                                        new XAttribute("code", "I-1601"),
                                        "Droit de timbre"
                                    ),
                                    new XElement("TaxDetails",
                                        new XElement("TaxRate", "0")
                                    )
                                ),
                                new XElement("AmountDetails",
                                    new XElement("MoaDetails",
                                        MoaElement("I-175", invoice.StampDuty)
                                    )
                                )
                            )
                        )
                    ),

                    // ── ds:Signature placeholder (filled by signing service) ──
                    new XElement(ds + "Signature")
                )
            );

            return doc.ToString();
        }
    }
}
