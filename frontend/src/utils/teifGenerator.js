/**
 * TEIF V1.8.8 XML GENERATOR - El Fatoora PFE
 * Conforme au schéma facture_INVOIC_V1.8.8_withoutSig.xsd (Tunisie TradeNet)
 */

export const STAMP_DUTY = 1.000;

/**
 * Normalise le Matricule Fiscal à exactement 13 caractères
 * Format attendu: 7chiffres + lettre[ABDNP] + lettre[CMNP] + 3chiffres
 */
const normaliseMatricule = (mf) => {
  let clean = (mf || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (clean.length < 13) clean = clean.padEnd(13, '0');
  if (clean.length > 13) clean = clean.substring(0, 13);
  return clean;
};

/**
 * Formate une date en ddMMyy (format exigé par le XSD DtmDetailType)
 * Ex: 2026-05-04 → 040526
 */
const formatDateDDMMYY = (dateStr) => {
  const d = new Date(dateStr || new Date());
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}${mm}${yy}`;
};

export const generateTeifXml = (issuer, invoice) => {
  const senderMF   = normaliseMatricule(issuer?.matriculeFiscal || issuer?.matricule || '');
  const receiverMF = normaliseMatricule(invoice.clientMatricule);

  const rawItems = invoice.lines || invoice.items || [];
  const items = rawItems.length > 0
    ? rawItems
    : [{ description: 'Ligne de test', qty: 1, puht: 0, unitPriceHT: 0, tvaRate: 19 }];

  // Grouper les lignes par taux TVA
  const tvaGroups = {};
  items.forEach(item => {
    const rate = parseFloat(item.tvaRate || item.tva || 19);
    const pu   = parseFloat(item.puht || item.unitPriceHT || 0);
    const qty  = parseFloat(item.qty || 0);
    const ht   = qty * pu;
    if (!tvaGroups[rate]) tvaGroups[rate] = { ht: 0, tva: 0 };
    tvaGroups[rate].ht  += ht;
    tvaGroups[rate].tva += ht * (rate / 100);
  });

  const totalHT   = parseFloat(invoice.totalHT  || invoice.totals?.ht  || 0).toFixed(3);
  const totalTVA  = parseFloat(invoice.totalTVA || invoice.totals?.tva || 0).toFixed(3);
  const totalTTC  = parseFloat(invoice.totalTTC || invoice.totals?.ttc || 0).toFixed(3);
  const stampDuty = parseFloat(invoice.stampDuty || STAMP_DUTY).toFixed(3);
  const dateStr   = formatDateDDMMYY(invoice.date);
  const docId     = invoice.number || invoice.invoiceNumber || 'FAC-0001';
  const senderName   = issuer?.entreprise || issuer?.name || 'Émetteur';
  const senderAddr   = issuer?.address || 'Tunis, Tunisie';
  const receiverName = invoice.clientName || 'Client';
  const receiverAddr = invoice.clientAddress || 'Adresse Client';

  return `<?xml version="1.0" encoding="UTF-8"?>
<TEIF version="1.8.8" controlingAgency="TTN" xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
  <InvoiceHeader>
    <MessageSenderIdentifier type="I-01">${senderMF}</MessageSenderIdentifier>
    <MessageRecieverIdentifier type="I-01">${receiverMF}</MessageRecieverIdentifier>
  </InvoiceHeader>
  <InvoiceBody>
    <Bgm>
      <DocumentIdentifier>${docId}</DocumentIdentifier>
      <DocumentType code="I-11">Facture</DocumentType>
    </Bgm>
    <Dtm>
      <DateText functionCode="I-31" format="ddMMyy">${dateStr}</DateText>
    </Dtm>

    <PartnerSection>
      <PartnerDetails functionCode="I-61">
        <Nad>
          <PartnerIdentifier type="I-01">${senderMF}</PartnerIdentifier>
          <PartnerName nameType="Qualification">${senderName}</PartnerName>
          <PartnerAdresses>
            <AdressDescription>${senderAddr}</AdressDescription>
            <Country codeList="ISO_3166-1">TN</Country>
          </PartnerAdresses>
        </Nad>
      </PartnerDetails>
      <PartnerDetails functionCode="I-62">
        <Nad>
          <PartnerIdentifier type="I-01">${receiverMF}</PartnerIdentifier>
          <PartnerName nameType="Qualification">${receiverName}</PartnerName>
          <PartnerAdresses>
            <AdressDescription>${receiverAddr}</AdressDescription>
            <Country codeList="ISO_3166-1">TN</Country>
          </PartnerAdresses>
        </Nad>
      </PartnerDetails>
    </PartnerSection>

    <LinSection>
${items.map((item, idx) => {
  const pu  = parseFloat(item.puht || item.unitPriceHT || 0);
  const qty = parseFloat(item.qty || 0);
  const ht  = (qty * pu).toFixed(3);
  const rate = parseInt(item.tvaRate || item.tva || 19);
  const itemId = item.id > 0 ? item.id : idx + 1;
  return `      <Lin>
        <ItemIdentifier>${idx + 1}</ItemIdentifier>
        <LinImd lang="fr">
          <ItemCode>${itemId}</ItemCode>
          <ItemDescription>${item.description || ''}</ItemDescription>
        </LinImd>
        <LinQty>
          <Quantity measurementUnit="UN">${qty.toFixed(3)}</Quantity>
        </LinQty>
        <LinTax>
          <TaxTypeName code="I-1602">TVA</TaxTypeName>
          <TaxDetails>
            <TaxRate>${rate}</TaxRate>
          </TaxDetails>
        </LinTax>
        <LinMoa>
          <MoaDetails>
            <Moa currencyCodeList="ISO_4217" amountTypeCode="I-171">
              <Amount currencyIdentifier="TND">${ht}</Amount>
            </Moa>
          </MoaDetails>
        </LinMoa>
      </Lin>`;
}).join('\n')}
    </LinSection>

    <InvoiceMoa>
      <AmountDetails>
        <MoaDetails>
          <Moa currencyCodeList="ISO_4217" amountTypeCode="I-179">
            <Amount currencyIdentifier="TND">${totalHT}</Amount>
          </Moa>
        </MoaDetails>
      </AmountDetails>
      <AmountDetails>
        <MoaDetails>
          <Moa currencyCodeList="ISO_4217" amountTypeCode="I-176">
            <Amount currencyIdentifier="TND">${totalTVA}</Amount>
          </Moa>
        </MoaDetails>
      </AmountDetails>
      <AmountDetails>
        <MoaDetails>
          <Moa currencyCodeList="ISO_4217" amountTypeCode="I-175">
            <Amount currencyIdentifier="TND">${stampDuty}</Amount>
          </Moa>
        </MoaDetails>
      </AmountDetails>
      <AmountDetails>
        <MoaDetails>
          <Moa currencyCodeList="ISO_4217" amountTypeCode="I-177">
            <Amount currencyIdentifier="TND">${totalTTC}</Amount>
          </Moa>
        </MoaDetails>
      </AmountDetails>
    </InvoiceMoa>

    <InvoiceTax>
${Object.entries(tvaGroups).map(([rate, vals]) => `      <InvoiceTaxDetails>
        <Tax>
          <TaxTypeName code="I-1602">TVA</TaxTypeName>
          <TaxDetails>
            <TaxRate>${parseInt(rate)}</TaxRate>
          </TaxDetails>
        </Tax>
        <AmountDetails>
          <MoaDetails>
            <Moa currencyCodeList="ISO_4217" amountTypeCode="I-179">
              <Amount currencyIdentifier="TND">${parseFloat(vals.ht).toFixed(3)}</Amount>
            </Moa>
          </MoaDetails>
        </AmountDetails>
        <AmountDetails>
          <MoaDetails>
            <Moa currencyCodeList="ISO_4217" amountTypeCode="I-176">
              <Amount currencyIdentifier="TND">${parseFloat(vals.tva).toFixed(3)}</Amount>
            </Moa>
          </MoaDetails>
        </AmountDetails>
      </InvoiceTaxDetails>`).join('\n')}
      <InvoiceTaxDetails>
        <Tax>
          <TaxTypeName code="I-1601">Droit de timbre</TaxTypeName>
          <TaxDetails>
            <TaxRate>0</TaxRate>
          </TaxDetails>
        </Tax>
        <AmountDetails>
          <MoaDetails>
            <Moa currencyCodeList="ISO_4217" amountTypeCode="I-175">
              <Amount currencyIdentifier="TND">${stampDuty}</Amount>
            </Moa>
          </MoaDetails>
        </AmountDetails>
      </InvoiceTaxDetails>
    </InvoiceTax>
  </InvoiceBody>
  <ds:Signature/>
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
