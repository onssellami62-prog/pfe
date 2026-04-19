using System.Security.Cryptography.X509Certificates;

namespace backend.Services
{
    public interface ISignatureService
    {
        /// <summary>
        /// Sign a TEIF XML content using the configured certificate.
        /// </summary>
        /// <param name="xmlContent">The raw TEIF XML string.</param>
        /// <returns>The signed XML string.</returns>
        string SignTeifXml(string xmlContent);

        /// <summary>
        /// Verify the digital signature of a signed XML.
        /// </summary>
        /// <param name="signedXml">The signed XML string.</param>
        /// <returns>True if the signature is valid and hasn't been tampered with.</returns>
        bool VerifySignature(string signedXml);
        
        /// <summary>
        /// Get the public part of the signing certificate.
        /// </summary>
        X509Certificate2 GetCertificate();
    }
}
