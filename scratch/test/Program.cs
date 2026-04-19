using System;
using System.Xml;
using System.Security.Cryptography.Xml;
using System.Security.Cryptography.X509Certificates;
using System.IO;

// Create a mock IConfiguration
class MockConfig {
    public string this[string key] {
        get {
            if (key == "Signature:CertificatePath") return "backend/Certificates/TTN_Test.p12";
            if (key == "Signature:CertificatePassword") return "1234";
            return null;
        }
    }
}

class TestSigner {
    static void Main() {
        try {
            Console.WriteLine("--- Diagnostic Signature ---");
            string pfxPath = "backend/Certificates/TTN_Test.p12";
            string password = "1234";
            
            if (!File.Exists(pfxPath)) {
                Console.WriteLine("ERROR: Certificate file not found at " + Path.GetFullPath(pfxPath));
                return;
            }

            X509Certificate2 cert = new X509Certificate2(pfxPath, password, X509KeyStorageFlags.EphemeralKeySet);
            Console.WriteLine("Certificate Loaded: " + cert.Subject);

            string xmlContent = @"<TEIF xmlns=""urn:tn:gov:dgi:teif:2.0"" version=""2.0"">
  <INVOICEBODY>
    <BGM><Element1001>380</Element1001></BGM>
  </INVOICEBODY>
  <ds:Signature xmlns:ds=""http://www.w3.org/2000/09/xmldsig#""></ds:Signature>
</TEIF>";

            XmlDocument doc = new XmlDocument();
            doc.PreserveWhitespace = true;
            doc.LoadXml(xmlContent);

            SignedXml signedXml = new SignedXml(doc);
            signedXml.SigningKey = cert.GetRSAPrivateKey();

            Reference reference = new Reference();
            reference.Uri = "";
            reference.AddTransform(new XmlDsigEnvelopedSignatureTransform());
            reference.AddTransform(new XmlDsigC14NTransform());
            signedXml.AddReference(reference);

            KeyInfo keyInfo = new KeyInfo();
            KeyInfoX509Data x509Data = new KeyInfoX509Data(cert);
            x509Data.AddCertificate(cert);
            keyInfo.AddClause(x509Data);
            signedXml.KeyInfo = keyInfo;

            signedXml.Signature.Id = "Signature-ElFetoora";
            signedXml.ComputeSignature();
            XmlElement xmlDigitalSignature = signedXml.GetXml();

            XmlNamespaceManager nsmgr = new XmlNamespaceManager(doc.NameTable);
            nsmgr.AddNamespace("ds", "http://www.w3.org/2000/09/xmldsig#");
            XmlNode placeholder = doc.SelectSingleNode("//ds:Signature", nsmgr);

            if (placeholder != null) {
                Console.WriteLine("Placeholder found. Replacing...");
                placeholder.ParentNode.ReplaceChild(doc.ImportNode(xmlDigitalSignature, true), placeholder);
            } else {
                Console.WriteLine("Placeholder NOT found. Appending...");
                doc.DocumentElement.AppendChild(doc.ImportNode(xmlDigitalSignature, true));
            }

            Console.WriteLine("--- RESULT ---");
            Console.WriteLine(doc.OuterXml);
            Console.WriteLine("--- END ---");

        } catch (Exception ex) {
            Console.WriteLine("EXCEPTION: " + ex.ToString());
        }
    }
}
