/**
 * TEIF V2.0 XML GENERATOR - Unified Utility for El Fatoora PFE
 * Strictly compliant with Tunisia TradeNet (TTN) Technical Dictionary & XSD Sequences
 */

export const STAMP_DUTY = 1.000;

/**
 * Splits a Tunisian Matricule Fiscal (7 digits + 1 key + 1 TVA code + 1 Category + 3 Establishment digits)
 * Handles formats like "1234567APM000" (13 chars)
 */
const splitMatricule = (mf) => {
    const clean = (mf || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (clean.length < 13) return { id88: clean, id89: '', id90: '', id91: '' };
    
    return {
        id88: clean.substring(0, 8),      // e.g. 1234567D (8 chars)
        id89: clean.substring(8, 9),      // e.g. L
        id90: clean.substring(9, 10),     // e.g. C
        id91: clean.slice(-3)             // e.g. 000
    };
};

export const generateTeifXml = (issuer, invoice) => {
  const dateCCYYMMDD = (invoice.date || new Date().toISOString().split('T')[0]).replace(/-/g, '');
  const senderMF = splitMatricule(issuer.matricule);
  const receiverMF = splitMatricule(invoice.clientMatricule);

  const tvaGroups = {};
  const rawItems = invoice.lines || invoice.items || [];
  const items = rawItems.length > 0 ? rawItems : [{ description: 'Ligne de test', qty: 1, puht: 0, tvaRate: 0, unitPriceHT: 0 }];
  
  items.forEach(item => {
    const rate = parseFloat(item.tvaRate || 0);
    const pu = parseFloat(item.puht || item.unitPriceHT || 0);
    const qty = parseFloat(item.qty || 0);
    const ht = qty * pu;
    
    if (!tvaGroups[rate]) tvaGroups[rate] = { ht: 0, tva: 0 };
    tvaGroups[rate].ht += ht;
    tvaGroups[rate].tva += ht * (rate / 100);
  });

  const totalHT = parseFloat(invoice.totalHT || invoice.totals?.ht || 0).toFixed(3);
  const totalTVA = parseFloat(invoice.totalTVA || invoice.totals?.tva || 0).toFixed(3);
  const totalTTC = parseFloat(invoice.totalTTC || invoice.totals?.ttc || 0).toFixed(3);

  return `<?xml version="1.0" encoding="UTF-8"?>
<TEIF xmlns="urn:tn:gov:dgi:teif:2.0" version="2.0" controlingAgency="TTN">
  <INVOICEHEADER>
    <MessageSenderIdentifier>${senderMF.id88}${senderMF.id89}${senderMF.id90}${senderMF.id91}</MessageSenderIdentifier>
    <MessageRecieverIdentifier>${receiverMF.id88}${receiverMF.id89}${receiverMF.id90}${receiverMF.id91}</MessageRecieverIdentifier>
  </INVOICEHEADER>
  <INVOICEBODY>
    <BGM>
      <Element1001>${invoice.documentType || '380'}</Element1001>
    </BGM>
    <DTM>${dateCCYYMMDD}</DTM>
    
    <PartnerSection>
      <NAD>
        <PartyType>SE</PartyType>
        <ID_0088>${senderMF.id88}</ID_0088>
        <ID_0089>${senderMF.id89}</ID_0089>
        <ID_0090>${senderMF.id90}</ID_0090>
        <ID_0091>${senderMF.id91}</ID_0091>
        <Name>${issuer.name}</Name>
        <Address>${issuer.address}</Address>
        <City>Tunis</City>
      </NAD>
      <NAD>
        <PartyType>BY</PartyType>
        <ID_0088>${receiverMF.id88}</ID_0088>
        <ID_0089>${receiverMF.id89}</ID_0089>
        <ID_0090>${receiverMF.id90}</ID_0090>
        <ID_0091>${receiverMF.id91}</ID_0091>
        <Name>${invoice.clientName || 'Client'}</Name>
        <Address>${invoice.clientAddress || 'Adresse Client'}</Address>
        <City>Tunis</City>
      </NAD>
    </PartnerSection>

    <LINSECTION>
${items.map((item, id) => `      <LIN>
        <Element1082>${id + 1}</Element1082>
        <Element7008>${item.description}</Element7008>
        <Element6060>${parseFloat(item.qty || 0).toFixed(3)}</Element6060>
        <Element5118>${parseFloat(item.puht || item.unitPriceHT || 0).toFixed(3)}</Element5118>
        <MOA>${(parseFloat(item.qty || 0) * parseFloat(item.puht || item.unitPriceHT || 0)).toFixed(3)}</MOA>
      </LIN>`).join('\n')}
    </LINSECTION>

    <TAXSECTION>
${Object.entries(tvaGroups).map(([rate, vals]) => `      <TaxGroup>
        <TaxCategoryCode>I-1602</TaxCategoryCode>
        <TaxRate>${parseFloat(rate).toFixed(3)}</TaxRate>
        <TaxBaseAmount>${parseFloat(vals.ht || 0).toFixed(3)}</TaxBaseAmount>
        <TaxAmount>${parseFloat(vals.tva || 0).toFixed(3)}</TaxAmount>
      </TaxGroup>`).join('\n')}
      <TaxGroup>
        <TaxCategoryCode>I-1601</TaxCategoryCode>
        <TaxAmount>1.000</TaxAmount>
      </TaxGroup>
      <TaxGroup>
        <TaxCategoryCode>I-176</TaxCategoryCode>
        <TaxBaseAmount>${totalHT}</TaxBaseAmount>
      </TaxGroup>
    </TAXSECTION>

    <MOASECTION>
      <MOA>
        <Element5025>79</Element5025>
        <Element5004>${totalHT}</Element5004>
      </MOA>
      <MOA>
        <Element5025>176</Element5025>
        <Element5004>${totalTVA}</Element5004>
      </MOA>
      <MOA>
        <Element5025>128</Element5025>
        <Element5004>${totalTTC}</Element5004>
      </MOA>
    </MOASECTION>
  </INVOICEBODY>
  <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#"></ds:Signature>
</TEIF>`;
};

export const downloadXml = (xml, filename = 'facture.xml') => {
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
};
