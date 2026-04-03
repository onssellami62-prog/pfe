/**
 * TEIF V2.0 XML GENERATOR - Unified Utility for El Fatoora PFE
 */

export const STAMP_DUTY = 1.000;

export const generateTeifXml = (issuer, invoice) => {
  const dateCCYYMMDD = (invoice.date || new Date().toISOString().split('T')[0]).replace(/-/g, '');
  const senderMF = (issuer.matricule || '').replace(/[^a-zA-Z0-9]/g, '');
  const receiverMF = (invoice.clientMatricule || '').replace(/[^a-zA-Z0-9]/g, '');

  const tvaGroups = {};
  (invoice.items || []).forEach(item => {
    const rate = parseFloat(item.tvaRate || 0);
    const ht = (parseFloat(item.qty || 0)) * (parseFloat(item.puht || 0));
    if (!tvaGroups[rate]) tvaGroups[rate] = { ht: 0, tva: 0 };
    tvaGroups[rate].ht += ht;
    tvaGroups[rate].tva += ht * (rate / 100);
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<TEIF version="2.0" controlingAgency="TTN">
  <INVOICEHEADER>
    <MessageSenderIdentifier>${senderMF}</MessageSenderIdentifier>
    <MessageRecieverIdentifier>${receiverMF}</MessageRecieverIdentifier>
  </INVOICEHEADER>
  <INVOICEBODY>
    <BGM>
      <Element1001>${invoice.documentType || '380'}</Element1001>
    </BGM>
    <DTM>${dateCCYYMMDD}</DTM>
    
    <PartnerSection>
      <NAD>
        <PartyType>Seller</PartyType>
        <Name>${issuer.name}</Name>
        <Address>${issuer.address}</Address>
        <City>Tunis</City>
      </NAD>
      <NAD>
        <PartyType>Buyer</PartyType>
        <Name>${invoice.clientName || 'Client'}</Name>
        <Address>${invoice.clientAddress || 'Adresse Client'}</Address>
        <City>Tunis</City>
      </NAD>
    </PartnerSection>

    <LINSECTION>
${(invoice.items || []).map((item, id) => `      <LIN>
        <LineNumber>${id + 1}</LineNumber>
        <Description>${item.description}</Description>
        <QTY>${Math.round(parseFloat(item.qty || 0))}</QTY>
        <PRI>${parseFloat(item.puht || 0).toFixed(3)}</PRI>
        <MOA>${(parseFloat(item.qty || 0) * parseFloat(item.puht || 0)).toFixed(3)}</MOA>
      </LIN>`).join('\n')}
    </LINSECTION>

    <TAXSECTION>
${Object.entries(tvaGroups).map(([rate, vals]) => `      <TaxGroup>
        <TaxCategoryCode>I-1602</TaxCategoryCode>
        <TaxRate>${rate}</TaxRate>
        <TaxBaseAmount>${parseFloat(vals.ht || 0).toFixed(3)}</TaxBaseAmount>
        <TaxAmount>${parseFloat(vals.tva || 0).toFixed(3)}</TaxAmount>
      </TaxGroup>`).join('\n')}
      <TaxGroup>
        <TaxCategoryCode>I-1601</TaxCategoryCode>
        <TaxAmount>1.000</TaxAmount>
      </TaxGroup>
      <TaxGroup>
        <TaxCategoryCode>I-176</TaxCategoryCode>
        <TaxBaseAmount>${parseFloat(invoice.totals?.ht || 0).toFixed(3)}</TaxBaseAmount>
      </TaxGroup>
    </TAXSECTION>
  </INVOICEBODY>
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
