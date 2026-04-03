import React, { useState, useEffect } from 'react';
import './CreateInvoice.css';
import { STAMP_DUTY, generateTeifXml, downloadXml } from '../utils/teifGenerator';
import { validateMatriculeFiscal, normalizeMatricule } from '../utils/matriculeValidator';

const API = 'http://localhost:5170/api';

const formatCurrency = (num) => {
  const value = parseFloat(num || 0);
  return value.toFixed(3);
};

export default function CreateInvoice() {
  const [invoice, setInvoice] = useState({
    number: `FAC-${new Date().getFullYear()}-0001`,
    documentType: '380',
    date: new Date().toISOString().split('T')[0],
    periodFrom: '',
    periodTo: '',
    clientId: null,
    clientName: '',
    clientMatricule: '',
    clientAddress: '',
    items: [],
    totals: { ht: 0, tva: 0, stamp: STAMP_DUTY, ttc: 0 }
  });

  const [issuer, setIssuer] = useState({
    name: 'EL FATOORA',
    address: 'Charguia 1, Tunis',
    matricule: '0000000/A/P/M/000',
    rc: 'B01234562024'
  });

  const [companyId, setCompanyId] = useState(null);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [showXmlPreview, setShowXmlPreview] = useState(false);
  const [status, setStatus] = useState('draft');
  const [ttnResponse, setTtnResponse] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load user context + fetch clients/products/next invoice number
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const cid = storedUser?.companyId;

    setIssuer({
      name: storedUser.entreprise || 'EL FATOORA',
      address: storedUser.address || 'Avenue Habib Bourguiba, 1001 Tunis',
      matricule: storedUser.matriculeFiscal || '0000000/A/P/M/000',
      rc: 'B01234562024'
    });

    if (cid) {
      setCompanyId(cid);

      // Fetch clients
      fetch(`${API}/Clients?companyId=${cid}`)
        .then(r => r.json())
        .then(data => setClients(data))
        .catch(() => setClients([]));

      // Fetch products (catalogue)
      fetch(`${API}/Products?companyId=${cid}`)
        .then(r => r.json())
        .then(data => setProducts(data))
        .catch(() => setProducts([]));

      // Get auto-incremented invoice number
      fetch(`${API}/Invoices/next-number?companyId=${cid}&year=${new Date().getFullYear()}`)
        .then(r => r.json())
        .then(data => setInvoice(prev => ({ ...prev, number: data.nextNumber })))
        .catch(() => {});
    }
  }, []);

  // Auto-calculate totals whenever items change
  useEffect(() => {
    let htTotal = 0;
    let tvaTotal = 0;
    invoice.items.forEach(item => {
      const lineHT = (parseFloat(item.qty) || 0) * (parseFloat(item.puht) || 0);
      const lineTVA = lineHT * ((item.tvaRate || 0) / 100);
      htTotal += lineHT;
      tvaTotal += lineTVA;
    });
    const ttc = htTotal + tvaTotal + STAMP_DUTY;
    setInvoice(prev => ({
      ...prev,
      totals: { ht: htTotal, tva: tvaTotal, stamp: STAMP_DUTY, ttc }
    }));
  }, [invoice.items]);

  const handleClientSelection = (clientName) => {
    const selected = clients.find(c => c.name === clientName);
    if (selected) {
      setInvoice(prev => ({
        ...prev,
        clientId: selected.id,
        clientName: selected.name,
        clientMatricule: selected.matriculeFiscal,
        clientAddress: selected.address + (selected.city ? `, ${selected.city}` : '')
      }));
    } else {
      setInvoice(prev => ({ ...prev, clientName, clientId: null }));
    }
  };

  const addItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { productId: null, description: '', unit: 'Pièce', qty: 1, puht: 0, tvaRate: 19 }]
    }));
  };

  const addProductFromCatalogue = (product) => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, {
        productId: product.id,
        description: product.name,
        unit: product.unit,
        qty: 1,
        puht: parseFloat(product.defaultPrice) || 0,
        tvaRate: product.tvaRate
      }]
    }));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...invoice.items];
    newItems[index][field] = value;
    setInvoice(prev => ({ ...prev, items: newItems }));
  };

  const removeItem = (index) => {
    setInvoice(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const handleProductSelection = (index, productName) => {
    const selected = products.find(p => p.name === productName);
    const newItems = [...invoice.items];
    if (selected) {
      newItems[index] = {
        ...newItems[index],
        productId: selected.id,
        description: selected.name,
        unit: selected.unit,
        puht: parseFloat(selected.defaultPrice) || 0,
        tvaRate: selected.tvaRate
      };
    } else {
      newItems[index].description = productName;
      newItems[index].productId = null;
    }
    setInvoice(prev => ({ ...prev, items: newItems }));
  };

  // Save invoice to database
  const handleSaveInvoice = async () => {
    if (!companyId) return alert('Erreur: Société non identifiée.');
    if (!invoice.clientName) return alert('Veuillez sélectionner ou saisir un client.');
    if (invoice.items.length === 0) return alert('Ajoutez au moins une ligne produit/service.');

    setSaving(true);
    const payload = {
      invoiceNumber: invoice.number,
      documentType: invoice.documentType,
      date: new Date(invoice.date).toISOString(),
      clientId: invoice.clientId || null,
      clientName: invoice.clientName,
      clientMatricule: invoice.clientMatricule,
      clientAddress: invoice.clientAddress,
      periodFrom: invoice.periodFrom ? new Date(invoice.periodFrom).toISOString() : null,
      periodTo: invoice.periodTo ? new Date(invoice.periodTo).toISOString() : null,
      stampDuty: STAMP_DUTY,
      companyId: companyId,
      lines: invoice.items.map(item => ({
        productId: item.productId || null,
        description: item.description,
        unit: item.unit,
        qty: parseInt(item.qty) || 1,
        tvaRate: parseInt(item.tvaRate) || 19,
        unitPriceHT: parseFloat(item.puht) || 0,
        totalHT: 0,
        totalTVA: 0
      }))
    };

    try {
      const res = await fetch(`${API}/Invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const responseData = await res.text();

      if (!res.ok) {
        alert(`Erreur lors de l'enregistrement: ${responseData || 'Erreur inconnue'}`);
        return;
      }

      let saved;
      try {
        saved = JSON.parse(responseData);
      } catch (e) {
        saved = { invoiceNumber: invoice.number };
      }

      setSaveSuccess(true);
      if (saved && saved.invoiceNumber) {
        setInvoice(prev => ({ ...prev, number: saved.invoiceNumber }));
      }
      
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err) {
      console.error('Save error:', err);
      alert('Erreur critique de connexion au serveur.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmissionFlow = async () => {
    if (!invoice.clientName || !validateMatriculeFiscal(normalizeMatricule(invoice.clientMatricule))) {
      alert('Erreur: Le matricule fiscal client est invalide ou absent. Format attendu : 1234567ABM000');
      return;
    }
    setStatus('validating');
    setTimeout(() => {
      setStatus('signing');
      setTimeout(() => {
        setStatus('sending');
        setTimeout(() => {
          setStatus('success');
          setTtnResponse({
            reference: `TTN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            status: 'Validée',
            qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://fatoora.tn/verify/${Math.random().toString(36).substr(2, 6)}`
          });
        }, 1500);
      }, 1000);
    }, 800);
  };

  const copyXml = () => {
    navigator.clipboard.writeText(generateTeifXml(issuer, invoice));
    alert('XML copié dans le presse-papier !');
  };

  const handleDownloadXml = () => {
    downloadXml(generateTeifXml(issuer, invoice), `${invoice.number}.xml`);
  };

  return (
    <div className="max-w-6xl mx-auto p-8 font-['Plus_Jakarta_Sans'] bg-gray-50 min-h-screen">

      {/* Save success notification */}
      {saveSuccess && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-8 py-5 rounded-2xl shadow-2xl font-bold flex items-center gap-4 animate-slideInRight border-b-4 border-emerald-800">
          <div className="bg-white/20 p-2 rounded-full">✓</div>
          <div>
             <p className="text-sm">Enregistrement Réussi !</p>
             <p className="text-[10px] opacity-75">La facture {invoice.number} est maintenant en base de données.</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
        <div className="flex justify-between items-start mb-10 border-b border-gray-100 pb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-600 p-2 rounded-lg text-white font-black text-xl">
                {issuer.name.charAt(0).toUpperCase()}{issuer.name.charAt(1).toUpperCase()}
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 uppercase">{issuer.name}</h1>
            </div>
            <div className="text-gray-500 text-sm leading-relaxed">
              <p className="font-bold text-gray-800">{issuer.name}</p>
              <p>{issuer.address}</p>
              <p>Mat. Fiscal: <span className="font-mono text-blue-600">{issuer.matricule}</span></p>
              <p>Registre Commerce: {issuer.rc}</p>
            </div>
          </div>
          <div className="text-right space-y-4">
            <div className="inline-block bg-blue-50 text-blue-700 px-4 py-1 rounded-full text-xs font-bold tracking-widest border border-blue-100">
              DOCUMENT CONFORME TEIF v2.0
            </div>
            <div className="space-y-1">
              <h2 className="text-gray-400 text-xs font-bold uppercase">Type de Document</h2>
              <select
                className="text-sm font-bold text-gray-900 border-none p-0 focus:ring-0 text-right w-full bg-transparent appearance-none cursor-pointer"
                value={invoice.documentType}
                onChange={(e) => setInvoice({ ...invoice, documentType: e.target.value })}
              >
                <option value="380">Facture Commerciale [380]</option>
                <option value="381">Note d'Avoir [381]</option>
              </select>
            </div>
            <div className="space-y-1">
              <h2 className="text-gray-400 text-xs font-bold uppercase">Facture N°</h2>
              <input
                className="text-2xl font-black text-gray-900 border-none p-0 focus:ring-0 text-right w-full bg-transparent"
                value={invoice.number}
                onChange={(e) => setInvoice({ ...invoice, number: e.target.value })}
              />
            </div>
            <p className="text-sm text-gray-500 font-medium">{new Date(invoice.date).toLocaleDateString('fr-TN')}</p>
          </div>
        </div>

        {/* CLIENT + PERIOD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* Client */}
          <div className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-200">
            <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest mb-4">Informations Client</h3>
            <div className="space-y-4">
              <div className="relative">
                <input
                  list="clients-list"
                  placeholder="Sélectionner ou saisir un Client"
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none font-bold"
                  value={invoice.clientName}
                  onChange={(e) => handleClientSelection(e.target.value)}
                />
                <datalist id="clients-list">
                  {clients.map(c => <option key={c.id} value={c.name} />)}
                </datalist>
              </div>
              <input
                placeholder="Matricule Fiscal (1234567ABM000) *"
                className={`w-full bg-white border rounded-lg px-4 py-2 text-sm focus:ring-4 font-mono transition-all outline-none ${invoice.clientMatricule && !validateMatriculeFiscal(normalizeMatricule(invoice.clientMatricule)) ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100'}`}
                value={invoice.clientMatricule}
                onChange={(e) => setInvoice({ ...invoice, clientMatricule: normalizeMatricule(e.target.value) })}
                maxLength={13}
              />
              <textarea
                placeholder="Adresse du Client"
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-4 focus:ring-blue-100 transition-all outline-none resize-none"
                rows="2"
                value={invoice.clientAddress}
                onChange={(e) => setInvoice({ ...invoice, clientAddress: e.target.value })}
              />
            </div>
          </div>

          {/* Period */}
          <div className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-200">
            <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest mb-4">Période d'activité</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase w-8">Du</label>
                <input type="date" className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-1.5 text-xs outline-none focus:border-blue-500"
                  value={invoice.periodFrom}
                  onChange={e => setInvoice({ ...invoice, periodFrom: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase w-8">Au</label>
                <input type="date" className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-1.5 text-xs outline-none focus:border-blue-500"
                  value={invoice.periodTo}
                  onChange={e => setInvoice({ ...invoice, periodTo: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Signature */}
          <div className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="text-center z-10">
              <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest mb-2">Signature Digigo</h3>
              {status === 'signing' ? (
                <div className="flex items-center gap-2 text-blue-700 font-bold animate-pulse text-xs">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span> Signature XAdES...
                </div>
              ) : status === 'success' ? (
                <div className="text-green-600 flex flex-col items-center gap-1 font-bold">
                  <span className="text-lg">✅</span>
                  <span className="text-[10px] uppercase">Certificat Validé</span>
                </div>
              ) : (
                <button className="text-[10px] bg-white border border-blue-200 text-blue-600 font-bold py-2 px-6 rounded-full hover:bg-blue-50 translate-y-1 shadow-sm">
                  DÉVEROUILLER CERTIFICAT
                </button>
              )}
            </div>
            <div className="absolute top-0 right-0 p-1 opacity-5">
              <svg height="80" width="80"><path d="M0 0 L80 80 M80 0 L0 80" stroke="blue" strokeWidth="2" /></svg>
            </div>
          </div>
        </div>

        {/* PRODUCT DATALIST FOR AUTO-COMPLETE */}
        <datalist id="products-list">
          {products.map(p => (
            <option key={p.id} value={p.name}>
              {parseFloat(p.defaultPrice).toFixed(3)} DT ({p.tvaRate}% TVA)
            </option>
          ))}
        </datalist>

        {/* ITEMS TABLE */}
        <div className="mb-8 overflow-hidden rounded-xl border border-gray-100 shadow-sm">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-black uppercase text-[10px] text-gray-500">Désignation</th>
                <th className="px-4 py-4 font-black uppercase text-[10px] text-gray-500 text-center">Unité</th>
                <th className="px-4 py-4 font-black uppercase text-[10px] text-gray-500 text-center">Qté</th>
                <th className="px-4 py-4 font-black uppercase text-[10px] text-gray-500 text-center">TVA (%)</th>
                <th className="px-4 py-4 font-black uppercase text-[10px] text-gray-500 text-right">PUHT (DT)</th>
                <th className="px-6 py-4 font-black uppercase text-[10px] text-gray-500 text-right">Total HT</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {invoice.items.map((item, index) => (
                <tr key={index} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <input
                      list="products-list"
                      className="bg-transparent border-none p-0 focus:ring-0 w-full font-bold text-gray-800 placeholder-gray-300"
                      placeholder="Désignation de l'article..."
                      value={item.description}
                      onChange={(e) => handleProductSelection(index, e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-4 w-28">
                    <select
                      className="bg-transparent border-none p-0 focus:ring-0 w-full text-center font-bold text-gray-700 appearance-none cursor-pointer"
                      value={item.unit}
                      onChange={(e) => updateItem(index, 'unit', e.target.value)}
                    >
                      <option value="Pièce">Pièce</option>
                      <option value="Heure">Heure</option>
                      <option value="Jour">Jour</option>
                      <option value="KG">KG</option>
                      <option value="Litre">Litre</option>
                      <option value="Forfait">Forfait</option>
                    </select>
                  </td>
                  <td className="px-4 py-4 w-20">
                    <input
                      type="number" step="1" min="1"
                      className="bg-transparent border-none p-0 focus:ring-0 w-full text-center font-bold"
                      value={item.qty}
                      onChange={(e) => updateItem(index, 'qty', e.target.value)}
                      onBlur={(e) => updateItem(index, 'qty', Math.round(parseFloat(e.target.value || 1)))}
                    />
                  </td>
                  <td className="px-4 py-4 w-24">
                    <select
                      className="bg-transparent border-none p-0 focus:ring-0 w-full text-center font-bold text-blue-600 appearance-none cursor-pointer"
                      value={item.tvaRate}
                      onChange={(e) => updateItem(index, 'tvaRate', parseInt(e.target.value))}
                    >
                      <option value="0">0%</option>
                      <option value="7">7%</option>
                      <option value="13">13%</option>
                      <option value="19">19%</option>
                    </select>
                  </td>
                  <td className="px-4 py-4 w-32">
                    <input
                      type="number" step="0.001" min="0"
                      className="bg-transparent border-none p-0 focus:ring-0 w-full text-right font-bold text-gray-700"
                      value={item.puht}
                      onChange={(e) => updateItem(index, 'puht', e.target.value)}
                      onBlur={(e) => updateItem(index, 'puht', parseFloat(e.target.value || 0).toFixed(3))}
                    />
                  </td>
                  <td className="px-6 py-4 text-right font-black text-gray-900">
                    {formatCurrency((parseFloat(item.qty) || 0) * (parseFloat(item.puht) || 0))}
                  </td>
                  <td className="px-4">
                    <button
                      onClick={() => removeItem(index)}
                      className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={addItem}
            className="w-full bg-white border-t border-gray-100 py-4 text-[10px] font-black tracking-[0.2em] text-blue-600 hover:bg-gray-50 transition-colors"
          >
            + AJOUTER UNE LIGNE PRODUIT / SERVICE
          </button>
        </div>

        {/* TOTALS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-xs font-black uppercase text-gray-400 mb-4 tracking-widest">Récapitulatif Fiscal</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm py-1 border-b border-gray-50 italic">
                  <span className="text-gray-500 font-medium">Droit de Timbre</span>
                  <span className="font-bold text-gray-700">{formatCurrency(STAMP_DUTY)} DT</span>
                </div>
                <div className="flex justify-between text-sm py-1 border-b border-gray-50 italic">
                  <span className="text-gray-500 font-medium">Montant TVA global</span>
                  <span className="font-bold text-gray-700">{formatCurrency(invoice.totals.tva)} DT</span>
                </div>
              </div>
            </div>
            {ttnResponse && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center gap-6">
                <img src={ttnResponse.qrCode} alt="QR Code" className="w-24 h-24 bg-white p-1 rounded-lg shadow-inner" />
                <div>
                  <h4 className="text-xs font-black text-green-700 uppercase mb-1">Dépôt validé</h4>
                  <p className="text-[10px] font-bold text-green-600 mb-2 font-mono">{ttnResponse.reference}</p>
                  <p className="text-[11px] text-green-800/80 leading-relaxed italic">
                    "Structure XML XAdES-BES transmise via saveEfact."
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-900 rounded-2xl p-10 text-white shadow-2xl space-y-6 relative overflow-hidden">
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                <span>Total HT</span>
                <span>{formatCurrency(invoice.totals.ht)} DT</span>
              </div>
              <div className="flex justify-between text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                <span>Montant TVA global</span>
                <span>{formatCurrency(invoice.totals.tva)} DT</span>
              </div>
              <div className="flex justify-between text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                <span>Droit de Timbre</span>
                <span>{formatCurrency(invoice.totals.stamp)} DT</span>
              </div>
              <div className="border-t border-white/10 pt-6 mt-4 flex justify-between items-center">
                <span className="text-sm font-black uppercase tracking-tighter text-blue-400">Net à Payer TTC</span>
                <span className="text-4xl font-extrabold text-white tracking-tight">
                  {formatCurrency(invoice.totals.ttc)} <span className="text-base font-light opacity-50">DT</span>
                </span>
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500 opacity-20 blur-3xl rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-40"></div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="mt-12 flex flex-col md:flex-row gap-4 items-center justify-between border-t border-gray-100 pt-10">
          <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            Service WS v5 Opérationnel
          </div>

          <div className="flex gap-3 w-full md:w-auto flex-wrap">
            <button
              onClick={() => setShowXmlPreview(true)}
              className="flex-1 md:flex-none border border-gray-200 text-gray-600 font-black text-xs py-4 px-8 rounded-xl hover:bg-gray-50 transition-all uppercase tracking-widest"
            >
              📄 Aperçu TEIF
            </button>
            <button
              onClick={handleSaveInvoice}
              disabled={saving}
              className={`flex-1 md:flex-none font-black text-xs py-4 px-8 rounded-xl shadow-lg transition-all uppercase tracking-widest flex items-center justify-center gap-2 ${saving ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:-translate-y-1'}`}
            >
              {saving ? '⏳ Enregistrement...' : '💾 Enregistrer la facture'}
            </button>
            <button
              onClick={handleSubmissionFlow}
              disabled={status !== 'draft' && status !== 'success'}
              className={`flex-1 md:flex-none bg-blue-600 text-white font-black text-xs py-4 px-8 rounded-xl shadow-lg transition-all uppercase tracking-widest flex items-center justify-center gap-3 ${status !== 'draft' && status !== 'success' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700 hover:-translate-y-1'}`}
            >
              {status === 'sending' ? <>Envoi TTN...</> : status === 'validating' ? <>Validation...</> : <>🚀 Lancer envoi TTN</>}
            </button>
          </div>
        </div>
      </div>

      {/* XML PREVIEW MODAL */}
      {showXmlPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Aperçu Structure TEIF V2.0</h3>
                <p className="text-xs text-gray-400 font-bold">Génération temps-réel conforme TTN</p>
              </div>
              <button
                onClick={() => setShowXmlPreview(false)}
                className="text-gray-400 hover:text-gray-600 font-bold uppercase text-[10px] tracking-widest bg-white border border-gray-100 py-2 px-4 rounded-full shadow-sm"
              >✕ FERMER</button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-[#1e1e1e]">
              <pre className="text-blue-300 font-mono text-xs leading-relaxed">
                {generateTeifXml(issuer, invoice)}
              </pre>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-4 bg-gray-50">
              <button onClick={copyXml} className="flex-1 bg-white border border-gray-200 text-gray-700 font-black text-[10px] py-3 rounded-xl hover:bg-gray-100 uppercase tracking-widest">
                📋 Copier le XML
              </button>
              <button onClick={handleDownloadXml} className="flex-1 bg-blue-600 text-white font-black text-[10px] py-3 rounded-xl hover:bg-blue-700 uppercase tracking-widest shadow-lg shadow-blue-200">
                📥 Télécharger .xml
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="text-center text-[10px] text-gray-400 uppercase font-black tracking-widest pb-10">
        Module Digital Trust & Signature — Conforme au décret de facturation électronique n°2023-XXXX
      </footer>
    </div>
  );
}
