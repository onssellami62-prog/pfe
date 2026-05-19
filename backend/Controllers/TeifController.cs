using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Security.Cryptography.Xml;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Xml;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TeifController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public TeifController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        // ── GET générer XML TEIF signé pour une facture ──────────────────
        [HttpGet("generer/{id}")]
        public async Task<IActionResult> GenererXml(int id)
        {
            var facture = await _context.Factures
                .Include(f => f.Tiers)
                .Include(f => f.Lignes).ThenInclude(l => l.Produit)
                .FirstOrDefaultAsync(f => f.NumeroFacture == id);

            if (facture == null)
                return NotFound(new { message = "Facture introuvable." });

            var emetteurMF = _config["Emetteur:MatriculeFiscal"] ?? "1234567AMC000";
            var emetteurNom = _config["Emetteur:RaisonSociale"] ?? "El Fatoora";
            var emetteurVille = _config["Emetteur:Ville"] ?? "Tunis";
            var emetteurPays = _config["Emetteur:Pays"] ?? "TN";

            // Chemin et mot de passe du certificat PFX
            var pfxPath = _config["Signature:PfxPath"] ?? @"C:\temp\TTN_Test.p12";
            var pfxPwd = _config["Signature:PfxPassword"] ?? "1234";

            try
            {
                var xml = BuildTeifXml(facture, emetteurMF, emetteurNom, emetteurVille, emetteurPays);

                // Signer le XML si le certificat existe
                if (System.IO.File.Exists(pfxPath))
                {
                    xml = SignTeifXml(xml, pfxPath, pfxPwd);
                }

                return File(
                    Encoding.UTF8.GetBytes(xml),
                    "application/xml",
                    $"TEIF_FAC-{facture.NumeroFacture}_{DateTime.Now:yyyyMMddHHmmss}.xml"
                );
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Erreur génération XML.", detail = ex.Message });
            }
        }

        // ── GET valider conformité TEIF ──────────────────────────────────
        [HttpGet("valider/{id}")]
        public async Task<IActionResult> ValiderXml(int id)
        {
            var facture = await _context.Factures
                .Include(f => f.Tiers)
                .Include(f => f.Lignes).ThenInclude(l => l.Produit)
                .FirstOrDefaultAsync(f => f.NumeroFacture == id);

            if (facture == null)
                return NotFound(new { message = "Facture introuvable." });

            var erreurs = new List<string>();

            // ── 1. Client (PartnerSection I-62) ──────────────────────────
            if (facture.Tiers == null)
            {
                erreurs.Add("Client (Tiers) manquant — PartnerSection I-62 obligatoire.");
            }
            else
            {
                // TEIF accepte: MF (I-01), CIN (I-02), Carte séjour (I-03), MF étranger (I-04)
                bool hasIdentifiant =
                    !string.IsNullOrEmpty(facture.Tiers.MatriculeFiscal) ||
                    !string.IsNullOrEmpty(facture.Tiers.CIN) ||
                    !string.IsNullOrEmpty(facture.Tiers.CarteSejourPasseport) ||
                    !string.IsNullOrEmpty(facture.Tiers.MatriculeFiscalEtranger);

                if (!hasIdentifiant)
                    erreurs.Add("Identifiant client manquant — MF (I-01), CIN (I-02), Carte séjour (I-03) ou MF étranger (I-04) requis.");

                // Valider format MF si présent
                if (!string.IsNullOrEmpty(facture.Tiers.MatriculeFiscal))
                {
                    var mf = facture.Tiers.MatriculeFiscal.Replace(" ", "").ToUpper();
                    // Format: 7chiffres + Clef(sauf I,O,U) + /CodeTVA(A/P/B/F/N) + /CodeCat(M/P/C/N/E) + /3chiffres
                    var patternNew = @"^\d{7}[A-HJ-NP-TV-Z]/[APBFN]/[MPECN]/\d{3}$";
                    var patternOld = @"^\d{7}[A-HJ-NP-TV-Z]/[APBFN]/\d{3}$";
                    if (!Regex.IsMatch(mf, patternNew) && !Regex.IsMatch(mf, patternOld))
                        erreurs.Add($"Format matricule fiscal non conforme TEIF : {facture.Tiers.MatriculeFiscal} (attendu: ex. 1234567A/A/M/000)");
                }
            }

            // ── 2. Lignes (LinSection obligatoire) ───────────────────────
            if (facture.Lignes == null || !facture.Lignes.Any())
                erreurs.Add("Aucune ligne de facture — LinSection obligatoire dans TEIF.");

            foreach (var ligne in facture.Lignes ?? new List<LigneFacture>())
            {
                if (ligne.Quantite <= 0)
                    erreurs.Add($"Ligne {ligne.Numligne} : quantité invalide (doit être > 0).");

                if (ligne.PrixUnitaire < 0)
                    erreurs.Add($"Ligne {ligne.Numligne} : prix unitaire négatif.");

                // Vérifier taux TVA conforme (0, 7, 13, 19%)
                var tauxValides = new[] { 0m, 7m, 13m, 19m };
                if (!Array.Exists(tauxValides, t => t == ligne.TauxTVA))
                    erreurs.Add($"Ligne {ligne.Numligne} : taux TVA {ligne.TauxTVA}% non conforme TEIF (valeurs: 0%, 7%, 13%, 19%).");
            }

            // ── 3. Montants (InvoiceMoa) ──────────────────────────────────
            if (facture.MontantTTC <= 0)
                erreurs.Add("Montant TTC invalide (≤ 0) — InvoiceMoa I-176 obligatoire.");

            if (facture.TotalTVA < 0)
                erreurs.Add("Montant TVA invalide (négatif).");

            // Vérifier cohérence HT + TVA + Timbre ≈ TTC
            var timbre = facture.TimbreFiscal ? facture.MontantTimbre : 0m;
            var ttcCalcule = Math.Round(facture.TotalHT + facture.TotalTVA + timbre, 3);
            if (Math.Abs(ttcCalcule - facture.MontantTTC) > 0.01m)
                erreurs.Add($"Incohérence montants : HT({facture.TotalHT:0.000}) + TVA({facture.TotalTVA:0.000}) + Timbre({timbre:0.000}) = {ttcCalcule:0.000} ≠ TTC({facture.MontantTTC:0.000}).");

            // ── 4. Type de document (réf. I-1) ────────────────────────────
            var typesValides = new[] { "I-11", "I-14", "I-16" };
            if (!Array.Exists(typesValides, t => t == facture.TypeDocument))
                erreurs.Add($"Type document '{facture.TypeDocument}' non conforme TEIF (I-11=Facture, I-14=Avoir, I-16=Proforma).");

            return Ok(new
            {
                estValide = !erreurs.Any(),
                erreurs,
                message = erreurs.Any()
                    ? $"{erreurs.Count} erreur(s) détectée(s)"
                    : "Facture conforme TEIF v1.8.8 ✅"
            });
        }

        // ── Construction XML TEIF ────────────────────────────────────────
        private string BuildTeifXml(
            Facture facture,
            string emetteurMF,
            string emetteurNom,
            string emetteurVille,
            string emetteurPays)
        {
            var sb = new StringBuilder();
            var settings = new XmlWriterSettings
            {
                Indent = true,
                IndentChars = "  ",
                Encoding = Encoding.UTF8,
                OmitXmlDeclaration = false
            };

            using var writer = XmlWriter.Create(sb, settings);

            // ── Racine TEIF ──────────────────────────────────────────────
            // CORRECTION: version 1.8.7 (dernière version stable selon specs)
            // controlingAgency = "TTN" ou "Tunisie TradeNet"
            writer.WriteStartElement("TEIF");
            writer.WriteAttributeString("version", "1.8.7");
            writer.WriteAttributeString("controlingAgency", "TTN");

            // ── InvoiceHeader ────────────────────────────────────────────
            // CORRECTION: MessageSenderIdentifier = MF émetteur (sans /)
            // MessageRecieverIdentifier = identifiant TTN (optionnel selon specs)
            writer.WriteStartElement("InvoiceHeader");

            writer.WriteStartElement("MessageSenderIdentifier");
            writer.WriteAttributeString("type", "I-01");
            writer.WriteString(NettoyerMF(emetteurMF));
            writer.WriteEndElement();

            // MessageRecieverIdentifier est optionnel selon TEIF specs
            // On ne le met que si le client a un identifiant
            if (facture.Tiers != null)
            {
                var typeId = facture.Tiers.TypeIdentifiant ?? "I-01";
                var identifiant = GetIdentifiantTiers(facture.Tiers, typeId);
                if (!string.IsNullOrEmpty(identifiant))
                {
                    writer.WriteStartElement("MessageRecieverIdentifier");
                    writer.WriteAttributeString("type", typeId);
                    writer.WriteString(identifiant);
                    writer.WriteEndElement();
                }
            }

            writer.WriteEndElement(); // InvoiceHeader

            // ── InvoiceBody ──────────────────────────────────────────────
            writer.WriteStartElement("InvoiceBody");

            // ── Bgm ──────────────────────────────────────────────────────
            writer.WriteStartElement("Bgm");
            writer.WriteElementString("DocumentIdentifier", $"FAC-{facture.NumeroFacture}");

            writer.WriteStartElement("DocumentType");
            writer.WriteAttributeString("code", facture.TypeDocument ?? "I-11");
            writer.WriteString(facture.TypeDocument == "I-14" ? "AVOIR" :
                               facture.TypeDocument == "I-16" ? "PROFORMA" : "FACTURE");
            writer.WriteEndElement();

            if (facture.TypeDocument == "I-14" && facture.FactureOrigineId.HasValue)
            {
                writer.WriteStartElement("DocumentReferences");
                writer.WriteStartElement("DocumentReference");
                writer.WriteStartElement("Rff");
                writer.WriteAttributeString("referenceCodeQualifier", "I-81");
                writer.WriteElementString("ReferenceIdentifier", $"FAC-{facture.FactureOrigineId}");
                writer.WriteEndElement();
                writer.WriteEndElement();
                writer.WriteEndElement();
            }
            writer.WriteEndElement(); // Bgm

            // ── Dtm ──────────────────────────────────────────────────────
            // CORRECTION: format DDMMYY selon specs (pas ddMMyy)
            writer.WriteStartElement("Dtm");

            writer.WriteStartElement("DateText");
            writer.WriteAttributeString("functionCode", "I-31");
            writer.WriteAttributeString("format", "DDMMYY");
            writer.WriteString(facture.DateFacture.ToString("ddMMyy"));
            writer.WriteEndElement();

            if (facture.DateLimitePaiement.HasValue)
            {
                writer.WriteStartElement("DateText");
                writer.WriteAttributeString("functionCode", "I-35");
                writer.WriteAttributeString("format", "DDMMYY");
                writer.WriteString(facture.DateLimitePaiement.Value.ToString("ddMMyy"));
                writer.WriteEndElement();
            }

            if (facture.PeriodeDu.HasValue && facture.PeriodeAu.HasValue)
            {
                writer.WriteStartElement("DateText");
                writer.WriteAttributeString("functionCode", "I-37");
                writer.WriteAttributeString("format", "DDMMYY-DDMMYY");
                writer.WriteString($"{facture.PeriodeDu.Value:ddMMyy}-{facture.PeriodeAu.Value:ddMMyy}");
                writer.WriteEndElement();
            }

            writer.WriteEndElement(); // Dtm

            // ── PartnerSection ───────────────────────────────────────────
            writer.WriteStartElement("PartnerSection");

            // Émetteur (I-61)
            WritePartner(writer, "I-61", NettoyerMF(emetteurMF), "I-01", emetteurNom, emetteurVille, emetteurPays);

            // Client (I-62)
            if (facture.Tiers != null)
            {
                var typeId = facture.Tiers.TypeIdentifiant ?? "I-01";
                var identifiant = GetIdentifiantTiers(facture.Tiers, typeId);
                WritePartner(writer, "I-62", identifiant, typeId, facture.Tiers.Nom ?? "", facture.Tiers.Adresse ?? "", "TN");
            }

            writer.WriteEndElement(); // PartnerSection

            // ── Ftx — Montant en lettres (I-41) ──────────────────────────
            if (!string.IsNullOrEmpty(facture.MontantEnLettres))
            {
                writer.WriteStartElement("Ftx");
                writer.WriteStartElement("FreeTextDetail");
                writer.WriteAttributeString("subjectCode", "I-41");
                writer.WriteElementString("FreeTexts", facture.MontantEnLettres);
                writer.WriteEndElement();
                writer.WriteEndElement();
            }

            // ── LinSection ───────────────────────────────────────────────
            // CORRECTION: LinDtm obligatoire selon specs
            writer.WriteStartElement("LinSection");

            int numLigne = 1;
            foreach (var ligne in facture.Lignes)
            {
                writer.WriteStartElement("Lin");
                writer.WriteElementString("ItemIdentifier", numLigne.ToString());

                // LinImd
                writer.WriteStartElement("LinImd");
                writer.WriteAttributeString("lang", "fr");
                writer.WriteElementString("ItemCode", ligne.Produit?.ItemCode ?? $"ITEM{numLigne:D3}");
                writer.WriteElementString("ItemDescription", ligne.Designation ?? ligne.Produit?.Nom ?? "");
                writer.WriteEndElement();

                // LinQty
                writer.WriteStartElement("LinQty");
                writer.WriteStartElement("Quantity");
                writer.WriteAttributeString("measurementUnit", ligne.Produit?.UniteMessure ?? "PCE");
                writer.WriteString(ligne.Quantite.ToString());
                writer.WriteEndElement();
                writer.WriteEndElement();

                // LinDtm — OBLIGATOIRE selon specs
                writer.WriteStartElement("LinDtm");
                writer.WriteStartElement("DateText");
                writer.WriteAttributeString("functionCode", "I-31");
                writer.WriteAttributeString("format", "DDMMYY");
                writer.WriteString(facture.DateFacture.ToString("ddMMyy"));
                writer.WriteEndElement();
                writer.WriteEndElement();

                // LinTax — CORRECTION: utiliser TaxTypeName/@code selon specs
                writer.WriteStartElement("LinTax");
                writer.WriteStartElement("TaxTypeName");
                writer.WriteAttributeString("code", "I-1602"); // I-1602 = TVA selon TEIF
                writer.WriteEndElement();
                writer.WriteElementString("TaxCategory", ligne.TauxTVA == 0 ? "E" : "S"); // E=exonéré, S=standard
                writer.WriteStartElement("TaxDetails");
                writer.WriteElementString("TaxRate", ligne.TauxTVA.ToString("0.00"));
                writer.WriteEndElement();
                writer.WriteStartElement("AmountDetails");
                writer.WriteStartElement("Moa");
                writer.WriteAttributeString("currencyCodeList", "ISO_4217");
                writer.WriteAttributeString("amountTypeCode", "I-173");
                writer.WriteStartElement("Amount");
                writer.WriteAttributeString("currencyIdentifier", "TND");
                writer.WriteString(ligne.MontantTVA.ToString("0.000"));
                writer.WriteEndElement();
                writer.WriteEndElement();
                writer.WriteEndElement();
                writer.WriteEndElement(); // LinTax

                // LinMoa
                writer.WriteStartElement("LinMoa");
                WriteMoa(writer, "I-171", ligne.PrixUnitaire);  // Prix unitaire
                WriteMoa(writer, "I-172", ligne.MontantHT);     // Montant HT
                WriteMoa(writer, "I-173", ligne.MontantTVA);    // Montant TVA
                WriteMoa(writer, "I-176", ligne.MontantTTC);    // Montant TTC
                writer.WriteEndElement();

                writer.WriteEndElement(); // Lin
                numLigne++;
            }

            writer.WriteEndElement(); // LinSection

            // ── InvoiceMoa ───────────────────────────────────────────────
            // CORRECTION: format Amount = -?[0-9]{1,15}(,[0-9]{2,5})? selon specs
            // On utilise le format tunisien avec virgule pour décimales
            writer.WriteStartElement("InvoiceMoa");
            WriteMoaDetails(writer, "I-177", facture.TotalHTAvantRemise); // Total HT avant remise
            WriteMoaDetails(writer, "I-172", facture.TotalHT);            // Total HT
            WriteMoaDetails(writer, "I-173", facture.TotalTVA);           // Total TVA
            if (facture.TimbreFiscal)
                WriteMoaDetails(writer, "I-181", facture.MontantTimbre);  // Timbre fiscal
            WriteMoaDetails(writer, "I-176", facture.MontantTTC);         // Montant TTC
            writer.WriteEndElement();

            // ── InvoiceTax ───────────────────────────────────────────────
            // CORRECTION: TaxTypeName/@code = "I-1602" (TVA) selon réf. I-16
            writer.WriteStartElement("InvoiceTax");

            var tvaParTaux = new Dictionary<decimal, (decimal BaseHT, decimal MontantTVA)>();
            foreach (var ligne in facture.Lignes)
            {
                if (tvaParTaux.ContainsKey(ligne.TauxTVA))
                    tvaParTaux[ligne.TauxTVA] = (tvaParTaux[ligne.TauxTVA].BaseHT + ligne.MontantHT,
                                                  tvaParTaux[ligne.TauxTVA].MontantTVA + ligne.MontantTVA);
                else
                    tvaParTaux[ligne.TauxTVA] = (ligne.MontantHT, ligne.MontantTVA);
            }

            foreach (var tva in tvaParTaux)
            {
                writer.WriteStartElement("InvoiceTaxDetails");
                writer.WriteStartElement("Tax");
                writer.WriteStartElement("TaxTypeName");
                writer.WriteAttributeString("code", "I-1602");
                writer.WriteEndElement();
                writer.WriteElementString("TaxCategory", tva.Key == 0 ? "E" : "S");
                writer.WriteStartElement("TaxDetails");
                writer.WriteElementString("TaxRate", tva.Key.ToString("0.00"));
                writer.WriteEndElement();
                writer.WriteEndElement(); // Tax
                WriteMoaDetails(writer, "I-172", Math.Round(tva.Value.BaseHT, 3));
                WriteMoaDetails(writer, "I-173", Math.Round(tva.Value.MontantTVA, 3));
                writer.WriteEndElement(); // InvoiceTaxDetails
            }

            writer.WriteEndElement(); // InvoiceTax

            // ── InvoiceAlc — Remise globale ───────────────────────────────
            if (facture.RemiseGlobale > 0)
            {
                writer.WriteStartElement("InvoiceAlc");
                writer.WriteStartElement("AllowanceDetails");
                writer.WriteStartElement("Alc");
                writer.WriteAttributeString("allowanceCode", "I-151");
                writer.WriteElementString("AllowanceIdentifier", "REMISE");
                writer.WriteEndElement();
                WriteMoaDetails(writer, "I-172", facture.MontantRemise);
                writer.WriteEndElement();
                writer.WriteEndElement();
            }

            writer.WriteEndElement(); // InvoiceBody

            // ── RefTtnVal — CORRECTION: section OBLIGATOIRE selon specs ──
            // Reference = clef retournée par TTN (max 70 car.)
            // ReferenceDate = date de génération
            // ReferenceCev = QR code encodé base64 (max 4000 car.)
            writer.WriteStartElement("RefTtnVal");

            var refTTN = facture.IdTTN ?? "";
            writer.WriteElementString("Reference", refTTN);
            writer.WriteStartElement("ReferenceDate");
            writer.WriteAttributeString("functionCode", "I-31");
            writer.WriteAttributeString("format", "DDMMYY");
            writer.WriteString(DateTime.Now.ToString("ddMMyy"));
            writer.WriteEndElement();

            // ReferenceCev = QR code données encodées base64
            if (!string.IsNullOrEmpty(refTTN))
            {
                var qrData = $"FAC-{facture.NumeroFacture}|{facture.DateFacture:ddMMyy}|{refTTN}|{facture.MontantTTC:0.000}";
                var qrBase64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(qrData));
                writer.WriteElementString("ReferenceCev", qrBase64);
            }

            writer.WriteEndElement(); // RefTtnVal

            // ── Signature — placeholder XMLDSIG W3C ───────────────────────
            // CORRECTION: namespace xmldsig correct
            writer.WriteStartElement("ds", "Signature", "http://www.w3.org/2000/09/xmldsig#");
            writer.WriteAttributeString("id", "SigFrs");
            writer.WriteComment("Signature XAdES-BES du fournisseur — à générer avec certificat");
            writer.WriteEndElement();

            writer.WriteEndElement(); // TEIF
            writer.Flush();

            return sb.ToString();
        }

        // ── Helpers ──────────────────────────────────────────────────────

        private string NettoyerMF(string mf)
        {
            // Garder seulement les caractères valides pour l'identifiant
            return (mf ?? "").Replace(" ", "").ToUpper();
        }

        private string GetIdentifiantTiers(Tiers tiers, string typeId)
        {
            return typeId switch
            {
                "I-01" => NettoyerMF(tiers.MatriculeFiscal ?? ""),
                "I-02" => tiers.CIN ?? "",
                "I-03" => tiers.CarteSejourPasseport ?? "",
                "I-04" => NettoyerMF(tiers.MatriculeFiscalEtranger ?? tiers.MatriculeFiscal ?? ""),
                _ => NettoyerMF(tiers.MatriculeFiscal ?? "") != ""
                          ? NettoyerMF(tiers.MatriculeFiscal ?? "")
                          : tiers.CIN ?? tiers.CarteSejourPasseport ?? ""
            };
        }

        private void WritePartner(XmlWriter w, string functionCode, string identifiant, string typeId, string nom, string adresse, string pays)
        {
            w.WriteStartElement("PartnerDetails");
            w.WriteAttributeString("functionCode", functionCode);
            w.WriteStartElement("Nad");

            if (!string.IsNullOrEmpty(identifiant))
            {
                w.WriteStartElement("PartnerIdentifier");
                w.WriteAttributeString("type", typeId);
                w.WriteString(identifiant);
                w.WriteEndElement();
            }

            w.WriteStartElement("PartnerName");
            w.WriteAttributeString("nameType", "Qualification");
            w.WriteString(nom);
            w.WriteEndElement();

            if (!string.IsNullOrEmpty(adresse))
            {
                w.WriteStartElement("PartnerAdresses");
                w.WriteElementString("AdressDescription", adresse);
                w.WriteStartElement("Country");
                w.WriteAttributeString("codeList", "ISO_3166-1");
                w.WriteString(pays);
                w.WriteEndElement();
                w.WriteEndElement();
            }

            w.WriteEndElement(); // Nad
            w.WriteEndElement(); // PartnerDetails
        }

        private void WriteMoa(XmlWriter w, string typeCode, decimal montant)
        {
            w.WriteStartElement("MoaDetails");
            w.WriteStartElement("Moa");
            w.WriteAttributeString("currencyCodeList", "ISO_4217");
            w.WriteAttributeString("amountTypeCode", typeCode);
            w.WriteStartElement("Amount");
            w.WriteAttributeString("currencyIdentifier", "TND");
            // CORRECTION: format avec virgule selon specs (-?[0-9]{1,15}(,[0-9]{2,5})?)
            w.WriteString(montant.ToString("0.000").Replace(".", ","));
            w.WriteEndElement();
            w.WriteEndElement();
            w.WriteEndElement();
        }

        private void WriteMoaDetails(XmlWriter w, string typeCode, decimal montant)
        {
            w.WriteStartElement("AmountDetails");
            w.WriteStartElement("Moa");
            w.WriteAttributeString("currencyCodeList", "ISO_4217");
            w.WriteAttributeString("amountTypeCode", typeCode);
            w.WriteStartElement("Amount");
            w.WriteAttributeString("currencyIdentifier", "TND");
            w.WriteString(montant.ToString("0.000").Replace(".", ","));
            w.WriteEndElement();
            w.WriteEndElement();
            w.WriteEndElement();
        }

        // ── Signature XMLDSIG avec certificat PFX ────────────────────────
        private string SignTeifXml(string xmlContent, string pfxPath, string password)
        {
            // 1. Charger le certificat PFX
            var cert = new X509Certificate2(pfxPath, password,
                X509KeyStorageFlags.MachineKeySet | X509KeyStorageFlags.PersistKeySet);

            // 2. Charger le XML
            var doc = new XmlDocument { PreserveWhitespace = true };
            doc.LoadXml(xmlContent);

            // 3. Supprimer le placeholder de signature existant
            var existingSig = doc.GetElementsByTagName("ds:Signature");
            if (existingSig.Count > 0)
                existingSig[0]!.ParentNode!.RemoveChild(existingSig[0]!);

            // 4. Créer l'objet SignedXml
            var signedXml = new SignedXml(doc);
            signedXml.SigningKey = cert.GetRSAPrivateKey();

            // 5. Référence à signer (document entier)
            var reference = new Reference { Uri = "" };
            reference.AddTransform(new XmlDsigEnvelopedSignatureTransform());
            reference.AddTransform(new XmlDsigC14NTransform()); // Canonicalisation C14N
            signedXml.AddReference(reference);

            // 6. KeyInfo — clé publique du certificat pour vérification TTN
            var keyInfo = new KeyInfo();
            keyInfo.AddClause(new KeyInfoX509Data(cert));
            signedXml.KeyInfo = keyInfo;

            // 7. Calculer et ajouter la signature
            signedXml.ComputeSignature();
            var xmlSig = signedXml.GetXml();

            // Ajouter l'attribut id="SigFrs" conforme TEIF
            xmlSig.SetAttribute("id", "SigFrs");

            doc.DocumentElement!.AppendChild(doc.ImportNode(xmlSig, true));

            // 8. Retourner le XML signé
            using var sw = new StringWriter();
            using var xw = XmlWriter.Create(sw, new XmlWriterSettings { Indent = true, Encoding = Encoding.UTF8 });
            doc.WriteTo(xw);
            xw.Flush();
            return sw.ToString();
        }
    }
}