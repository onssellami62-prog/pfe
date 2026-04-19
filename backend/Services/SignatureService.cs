using System.Security.Cryptography.Xml;
using System.Security.Cryptography.X509Certificates;
using System.Xml;
using System.Security.Cryptography;

namespace backend.Services
{
    public class XadesSignedXml : SignedXml
    {
        private readonly List<DataObject> _dataObjects = new List<DataObject>();

        public XadesSignedXml(XmlDocument document) : base(document) { }

        public new void AddObject(DataObject dataObject)
        {
            _dataObjects.Add(dataObject);
            base.AddObject(dataObject);
        }

        public override XmlElement? GetIdElement(XmlDocument document, string idValue)
        {
            if (string.IsNullOrEmpty(idValue)) return null;

            // 1. Try standard discovery
            XmlElement? xmlElement = base.GetIdElement(document, idValue);
            if (xmlElement != null) return xmlElement;

            // 2. Search in current DataObjects (Required for XAdES)
            foreach (DataObject dataObject in _dataObjects)
            {
                if (dataObject.Data != null)
                {
                    foreach (XmlNode node in dataObject.Data)
                    {
                        if (node is XmlElement el)
                        {
                            if (el.GetAttribute("Id") == idValue) return el;
                            
                            // Recursive search
                            var child = el.SelectSingleNode($".//*[@Id='{idValue}']") as XmlElement;
                            if (child != null) return child;
                        }
                    }
                }
            }
            
            // 3. Last ditch: global scan
            var nodeList = document.GetElementsByTagName("*");
            foreach (XmlNode node in nodeList)
            {
                if (node is XmlElement element && element.GetAttribute("Id") == idValue)
                    return element;
            }

            return null;
        }
    }

    public class SignatureService : ISignatureService
    {
        private readonly IConfiguration _configuration;
        private readonly string _pfxPath;
        private readonly string _password;

        public SignatureService(IConfiguration configuration)
        {
            _configuration = configuration;
            _pfxPath = _configuration["Signature:CertificatePath"] ?? "Certificates/TTN_Test.p12";
            _password = _configuration["Signature:CertificatePassword"] ?? "1234";
        }

        public string SignTeifXml(string xmlContent)
        {
            if (string.IsNullOrEmpty(xmlContent))
                throw new ArgumentException("XML content cannot be empty.");

            X509Certificate2 cert;
            try 
            {
                cert = new X509Certificate2(_pfxPath, _password, X509KeyStorageFlags.EphemeralKeySet);
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to load certificate: {ex.Message}", ex);
            }

            XmlDocument doc = new XmlDocument();
            doc.PreserveWhitespace = true;
            doc.LoadXml(xmlContent);

            // Use the custom class for XAdES
            XadesSignedXml signedXml = new XadesSignedXml(doc);
            signedXml.SigningKey = cert.GetRSAPrivateKey();
            signedXml.Signature.Id = "Signature-ElFetoora";

            // 1. Reference to the Document
            Reference reference = new Reference();
            reference.Uri = "";
            reference.AddTransform(new XmlDsigEnvelopedSignatureTransform());
            reference.AddTransform(new XmlDsigC14NTransform());
            signedXml.AddReference(reference);

            // 2. Add KeyInfo
            KeyInfo keyInfo = new KeyInfo();
            KeyInfoX509Data x509Data = new KeyInfoX509Data(cert);
            x509Data.AddCertificate(cert);
            keyInfo.AddClause(x509Data);
            signedXml.KeyInfo = keyInfo;

            // 3. Create XAdES QualifyingProperties
            string xadesNs = "http://uri.etsi.org/01903/v1.3.2#";
            string signedPropertiesId = "SignedProperties-ElFetoora";
            
            XmlElement qualifyingProperties = doc.CreateElement("xades", "QualifyingProperties", xadesNs);
            qualifyingProperties.SetAttribute("Target", "#Signature-ElFetoora");

            XmlElement signedProperties = doc.CreateElement("xades", "SignedProperties", xadesNs);
            signedProperties.SetAttribute("Id", signedPropertiesId);

            XmlElement signedSignatureProperties = doc.CreateElement("xades", "SignedSignatureProperties", xadesNs);

            // SigningTime
            XmlElement signingTime = doc.CreateElement("xades", "SigningTime", xadesNs);
            signingTime.InnerText = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
            signedSignatureProperties.AppendChild(signingTime);

            // SigningCertificate
            XmlElement signingCertificate = doc.CreateElement("xades", "SigningCertificate", xadesNs);
            XmlElement certNode = doc.CreateElement("xades", "Cert", xadesNs);
            XmlElement certDigest = doc.CreateElement("xades", "CertDigest", xadesNs);
            XmlElement digestMethod = doc.CreateElement("xades", "DigestMethod", xadesNs);
            digestMethod.SetAttribute("Algorithm", "http://www.w3.org/2001/04/xmlenc#sha256");
            XmlElement digestValue = doc.CreateElement("xades", "DigestValue", xadesNs);
            digestValue.InnerText = Convert.ToBase64String(SHA256.HashData(cert.RawData));
            
            certDigest.AppendChild(digestMethod);
            certDigest.AppendChild(digestValue);
            certNode.AppendChild(certDigest);
            
            XmlElement issuerSerial = doc.CreateElement("xades", "IssuerSerial", xadesNs);
            XmlElement issuerName = doc.CreateElement("xades", "X509IssuerName", xadesNs);
            issuerName.InnerText = cert.Issuer;
            XmlElement serialNumber = doc.CreateElement("xades", "X509SerialNumber", xadesNs);
            serialNumber.InnerText = cert.SerialNumber;
            issuerSerial.AppendChild(issuerName);
            issuerSerial.AppendChild(serialNumber);
            certNode.AppendChild(issuerSerial);
            
            signingCertificate.AppendChild(certNode);
            signedSignatureProperties.AppendChild(signingCertificate);

            // SignaturePolicyIdentifier (EPES requirement)
            XmlElement policyIdentifier = doc.CreateElement("xades", "SignaturePolicyIdentifier", xadesNs);
            XmlElement signaturePolicyId = doc.CreateElement("xades", "SignaturePolicyId", xadesNs);
            XmlElement sigPolicyId = doc.CreateElement("xades", "SigPolicyId", xadesNs);
            XmlElement identifier = doc.CreateElement("xades", "Identifier", xadesNs);
            identifier.InnerText = "https://www.teif.tn/signature-policy/v1.0";
            sigPolicyId.AppendChild(identifier);
            signaturePolicyId.AppendChild(sigPolicyId);
            
            // Note: EPES would also need a hash of the policy document itself here for full strictness
            XmlElement sigPolicyHash = doc.CreateElement("xades", "SigPolicyHash", xadesNs);
            XmlElement policyDigestMethod = doc.CreateElement("xades", "DigestMethod", xadesNs);
            policyDigestMethod.SetAttribute("Algorithm", "http://www.w3.org/2001/04/xmlenc#sha256");
            XmlElement policyDigestValue = doc.CreateElement("xades", "DigestValue", xadesNs);
            policyDigestValue.InnerText = "0000000000000000000000000000000000000000000="; // Placeholder hash
            sigPolicyHash.AppendChild(policyDigestMethod);
            sigPolicyHash.AppendChild(policyDigestValue);
            signaturePolicyId.AppendChild(sigPolicyHash);

            policyIdentifier.AppendChild(signaturePolicyId);
            signedSignatureProperties.AppendChild(policyIdentifier);

            signedProperties.AppendChild(signedSignatureProperties);
            qualifyingProperties.AppendChild(signedProperties);

            // 4. Add XAdES Object to Signature
            DataObject xadesObject = new DataObject();
            xadesObject.Data = qualifyingProperties.SelectNodes(".")!;
            signedXml.AddObject(xadesObject);

            // 5. Add Reference to SignedProperties (The "linking" part)
            Reference xadesReference = new Reference();
            xadesReference.Uri = "#" + signedPropertiesId;
            xadesReference.Type = "http://uri.etsi.org/01903#SignedProperties";
            signedXml.AddReference(xadesReference);

            // 6. Compute Signature
            signedXml.ComputeSignature();
            XmlElement xmlDigitalSignature = signedXml.GetXml();
            xmlDigitalSignature.Prefix = "ds"; // Force prefix

            // 7. Replace placeholder
            XmlNamespaceManager nsmgr = new XmlNamespaceManager(doc.NameTable);
            nsmgr.AddNamespace("ds", "http://www.w3.org/2000/09/xmldsig#");
            XmlNode? placeholder = doc.SelectSingleNode("//ds:Signature", nsmgr);

            if (placeholder != null)
            {
                XmlNode importNode = doc.ImportNode(xmlDigitalSignature, true);
                placeholder.ParentNode?.ReplaceChild(importNode, placeholder);
            }
            else
            {
                doc.DocumentElement?.AppendChild(doc.ImportNode(xmlDigitalSignature, true));
            }

            return doc.OuterXml;
        }

        public bool VerifySignature(string signedXml)
        {
            if (string.IsNullOrEmpty(signedXml)) return false;
            try 
            {
                XmlDocument doc = new XmlDocument();
                doc.PreserveWhitespace = true;
                doc.LoadXml(signedXml);
                XadesSignedXml signedXmlEngine = new XadesSignedXml(doc);
                XmlNodeList nodeList = doc.GetElementsByTagName("Signature");
                if (nodeList.Count == 0) return false;
                signedXmlEngine.LoadXml((XmlElement)nodeList[0]!);
                return signedXmlEngine.CheckSignature();
            }
            catch { return false; }
        }

        public X509Certificate2 GetCertificate() => new X509Certificate2(_pfxPath, _password);
    }
}
