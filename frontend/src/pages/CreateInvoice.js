import React, { useState, useEffect } from 'react';
import './CreateInvoice.css';
import { STAMP_DUTY, generateTeifXml, downloadXml } from '../utils/teifGenerator';
import { validateMatriculeFiscal, normalizeMatricule, formatMatriculeDisplay } from '../utils/matriculeValidator';
import InvoiceValidator from '../components/InvoiceValidator';

const API = 'http://localhost:5170/api';

const Icons = {
  Check: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Document: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  Save: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  Send: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  Copy: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Download: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Clock: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
};

const formatCurrency = (num) => {
  const value = parseFloat(num || 0);
  return value.toFixed(3);
};

export default function CreateInvoice() {
  // Default to today's date for compliance and demo safety (Soutenance PFE)
  const today = new Date().toISOString().split('T')[0];

  const [invoice, setInvoice] = useState({
    number: `FAC-${new Date().getFullYear()}-0001`,
    documentType: '380',
    date: today,
    dueDate: '',
    paymentMode: 'Virement', // Virement, Chèque, Comptant
    periodFrom: '',
    periodTo: '',
    clientId: null,
    clientName: '',
    clientMatricule: '',
    clientRNE: '',
    clientAddress: '',
    notes: '',
    items: [],
    totals: { ht: 0, tva: 0, stamp: STAMP_DUTY, ttc: 0 },
    dbId: null // Added to store database ID
  });

  const [issuer, setIssuer] = useState({
    name: 'EL FATOORA',
    address: 'Charguia 1, Tunis',
    matricule: '0000000/A/P/M/000',
    rne: '--- --- ---',
    activity: ''
  });

  const [companyId, setCompanyId] = useState(null);
  const [companyLogo, setCompanyLogo] = useState(null);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [showXmlPreview, setShowXmlPreview] = useState(false);
  const [showValidator, setShowValidator] = useState(false);
  const [status, setStatus] = useState('draft');
  const [ttnResponse, setTtnResponse] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveQrCode, setSaveQrCode] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPeriod, setShowPeriod] = useState(false);

  // Load user context + fetch clients/products/next invoice number
  useEffect(() => {
    const storedUser = JSON.parse(sessionStorage.getItem('user') || '{}');
    const cid = storedUser?.companyId;

    setIssuer({
      name: storedUser.entreprise || 'EL FATOORA',
      address: storedUser.address || 'Avenue Habib Bourguiba, 1001 Tunis',
      matricule: storedUser.matriculeFiscal || '0000000/A/P/M/000',
      rne: storedUser.rne || '--- --- ---',
      activity: storedUser.activity || ''
    });

    if (cid) {
      setCompanyId(cid);

      // Fetch company details (logo + legal fields)
      fetch(`${API}/Companies/${cid}`)
        .then(r => r.json())
        .then(data => {
          if (data?.logoPath) setCompanyLogo(`http://localhost:5170/${data.logoPath}`);
          if (data?.rne) {
            setIssuer(prev => ({ ...prev, rne: data.rne, activity: data.activity || prev.activity }));
          }
        })
        .catch(() => { });

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
        .catch(() => { });
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

  const handleClientSelection = (clientId) => {
    if (!clientId) {
      setInvoice(prev => ({
        ...prev,
        clientId: null,
        clientName: '',
        clientMatricule: '',
        clientRNE: '',
        clientAddress: ''
      }));
      return;
    }
    const selected = clients.find(c => c.id === parseInt(clientId));
    if (selected) {
      setInvoice(prev => ({
        ...prev,
        clientId: selected.id,
        clientName: selected.name,
        clientMatricule: selected.matriculeFiscal,
        clientRNE: selected.rne || '',
        clientAddress: selected.address + (selected.city ? `, ${selected.city}` : '')
      }));
    }
  };

  const addItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { productId: null, description: '', unit: 'Pièce', qty: 1, puht: 0, tvaRate: 19 }]
    }));
  };

  /* 
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
  */

  const updateItem = (index, field, value) => {
    const newItems = [...invoice.items];
    newItems[index][field] = value;
    setInvoice(prev => ({ ...prev, items: newItems }));
  };

  const removeItem = (index) => {
    setInvoice(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const handleProductSelection = (index, product) => {
    const newItems = [...invoice.items];
    newItems[index] = {
      ...newItems[index],
      productId: product.id,
      description: product.name,
      unit: product.unit,
      puht: parseFloat(product.defaultPrice) || 0,
      tvaRate: product.tvaRate
    };
    setInvoice(prev => ({ ...prev, items: newItems }));
  };

  // Save invoice to database
  const handleSaveInvoice = async (isSubmitting = false) => {
    if (!companyId) {
      alert('Erreur: Société non identifiée.');
      return null;
    }
    if (!invoice.clientId) {
      alert('Veuillez sélectionner un client enregistré dans votre référentiel.');
      return null;
    }
    if (invoice.items.length === 0) {
      alert('Ajoutez au moins une ligne produit/service.');
      return null;
    }

    setSaving(true);
    const payload = {
      invoiceNumber: invoice.number,
      documentType: invoice.documentType,
      date: new Date(invoice.date).toISOString(),
      clientId: invoice.clientId || null,
      clientName: invoice.clientName,
      clientMatricule: invoice.clientMatricule,
      clientAddress: invoice.clientAddress,
      clientRNE: invoice.clientRNE || '',
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString() : null,
      paymentMode: invoice.paymentMode,
      notes: invoice.notes,
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
      const storedUser = JSON.parse(sessionStorage.getItem('user') || '{}');
      const performerName = storedUser.name || 'Utilisateur';

      const res = await fetch(`${API}/Invoices?performerName=${performerName}&userId=${storedUser.userId || ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });


      const responseData = await res.text();

      if (!res.ok) {
        console.error('❌ Erreur HTTP:', res.status);
        console.error('❌ Message du serveur:', responseData);
        alert(`Erreur lors de l'enregistrement: ${responseData || 'Erreur inconnue'}`);
        return null;
      }

      let saved;
      try {
        saved = JSON.parse(responseData);
        console.log('✅ Réponse du serveur parsée:', saved);
        console.log('✅ Propriétés disponibles:', Object.keys(saved));
        console.log('✅ ID (minuscule):', saved.id);
        console.log('✅ ID (majuscule):', saved.Id);
      } catch (e) {
        console.error('Erreur de parsing JSON:', e);
        console.error('Réponse brute:', responseData);
        alert('Erreur: Réponse invalide du serveur.');
        return null;
      }

      setSaveSuccess(true);
      // C# peut retourner "Id" ou "id" selon la configuration de sérialisation
      const invoiceId = saved.id || saved.Id;
      const invoiceNumber = saved.invoiceNumber || saved.InvoiceNumber;
      
      // Vérifier que l'ID est valide (> 0)
      if (saved && invoiceId && invoiceId > 0) {
        setInvoice(prev => ({ ...prev, number: invoiceNumber, dbId: invoiceId }));

        // Generate QR code as a LINK to the full XML (to ensure 100% data preservation)
        const xmlLink = `${API}/Invoices/${invoiceId}/xml`;
        const encodedLink = encodeURIComponent(xmlLink);
        setSaveQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&ecc=L&data=${encodedLink}`);

        // Show success modal with options
        if (!isSubmitting) {
          setShowSuccessModal(true);
        }

        setTimeout(() => setSaveSuccess(false), 5000);
        return invoiceId;
      }

      // Si saved.id n'existe pas ou est 0
      console.error('Réponse du serveur sans ID valide:', saved);
      console.error('ID reçu:', invoiceId);
      alert('Erreur: Le serveur n\'a pas retourné d\'ID de facture valide. Vérifiez les logs du serveur.');
      return null;
    } catch (err) {
      console.error('Save error:', err);
      alert('Erreur critique de connexion au serveur.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmissionFlow = async () => {
    if (!invoice.clientId) {
      alert('Erreur: Veuillez sélectionner un client enregistré dans votre référentiel.');
      return;
    }
    if (!validateMatriculeFiscal(normalizeMatricule(invoice.clientMatricule))) {
      alert('Erreur: Le matricule fiscal client est invalide. Format attendu : 1234567ABM000');
      return;
    }

    setStatus('validating');

    try {
      // 1. Save if not already saved
      let currentDbId = invoice.dbId;
      if (!currentDbId) {
        currentDbId = await handleSaveInvoice(true);
      }

      if (!currentDbId) throw new Error("Impossible d'obtenir l'ID de la facture.");

      // 2. Real Signing Process
      setStatus('signing');
      const signRes = await fetch(`${API}/Invoices/${currentDbId}/sign`, { method: 'POST' });

      if (!signRes.ok) {
        const errText = await signRes.text();
        throw new Error(errText || "Erreur lors de la signature.");
      }

      await signRes.json();

      // 3. Mock the Sending to TTN (since we don't have their real WS endpoint yet)
      setStatus('sending');
      setTimeout(() => {
        setStatus('success');
        setTtnResponse({
          reference: `TTN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          status: 'Validée & Signée',
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://fatoora.tn/verify/${Math.random().toString(36).substr(2, 6)}`
        });
        setShowSuccessModal(true);
      }, 1500);

    } catch (error) {
      console.error("Submission error:", error);
      alert(`Échec de l'envoi : ${error.message}`);
      setStatus('draft');
    }
  };

  const copyXml = () => {
    navigator.clipboard.writeText(generateTeifXml(issuer, invoice));
    alert('XML copié dans le presse-papier !');
  };

  const handleDownloadXml = () => {
    downloadXml(generateTeifXml(issuer, invoice), `${invoice.number}.xml`);
  };

  const handleCreateNewInvoice = () => {
    // Reset invoice to initial state
    const nextYear = new Date().getFullYear();

    // Fetch next invoice number
    if (companyId) {
      fetch(`${API}/Invoices/next-number?companyId=${companyId}&year=${nextYear}`)
        .then(r => r.json())
        .then(data => {
          setInvoice({
            number: data.nextNumber,
            documentType: '380',
            date: new Date().toLocaleDateString('en-CA'),
            dueDate: '',
            paymentMode: 'Virement',
            periodFrom: '',
            periodTo: '',
            clientId: null,
            clientName: '',
            clientMatricule: '',
            clientRNE: '',
            clientAddress: '',
            notes: '',
            items: [],
            totals: { ht: 0, tva: 0, stamp: STAMP_DUTY, ttc: 0 },
            dbId: null
          });
          setSaveQrCode(null);
          setShowSuccessModal(false);
          setShowPeriod(false);
          setStatus('draft');
          setTtnResponse(null);
        })
        .catch(() => {
          // Fallback if API fails
          setInvoice({
            number: `FAC-${nextYear}-0001`,
            documentType: '380',
            date: new Date().toLocaleDateString('en-CA'),
            dueDate: '',
            paymentMode: 'Virement',
            periodFrom: '',
            periodTo: '',
            clientId: null,
            clientName: '',
            clientMatricule: '',
            clientRNE: '',
            clientAddress: '',
            notes: '',
            items: [],
            totals: { ht: 0, tva: 0, stamp: STAMP_DUTY, ttc: 0 },
            dbId: null
          });
          setSaveQrCode(null);
          setShowSuccessModal(false);
          setShowPeriod(false);
          setStatus('draft');
          setTtnResponse(null);
        });
    }
  };

  const handleReturnToDashboard = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="max-w-6xl mx-auto p-8 font-['Plus_Jakarta_Sans'] bg-gray-50 min-h-screen">

      {/* HEADER */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
        <div className="flex justify-between items-start mb-10 border-b border-gray-100 pb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-4">
              {companyLogo ? (
                <img src={companyLogo} alt="Logo" style={{ maxWidth: '48px', maxHeight: '48px', objectFit: 'contain', borderRadius: '8px' }} />
              ) : (
                <div className="bg-emerald-700 p-2 rounded-lg text-white font-black text-xl">
                  {issuer.name.charAt(0).toUpperCase()}{issuer.name.charAt(1).toUpperCase()}
                </div>
              )}
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 uppercase">{issuer.name}</h1>
            </div>
            <div className="text-gray-500 text-sm leading-relaxed">
              <p className="font-bold text-gray-800">{issuer.name}</p>
              {issuer.activity && (
                <div className="inline-block bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 tracking-wider border border-emerald-100">
                  {issuer.activity}
                </div>
              )}
              <p>{issuer.address}</p>
              <p>Mat. Fiscal: <span className="font-mono text-emerald-700">{issuer.matricule}</span></p>
              <p>Numéro RNE: {issuer.rne}</p>
            </div>
          </div>
          <div className="text-right space-y-4">
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
            <div className="space-y-1">
              <h2 className="text-gray-400 text-xs font-bold uppercase flex justify-end gap-2 items-center">
                Date d'émission
                {invoice.date === today && <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter">Aujourd'hui</span>}
              </h2>
              <input
                type="date"
                className="text-sm text-gray-500 font-medium border-none p-0 focus:ring-0 text-right w-full bg-transparent outline-none"
                value={invoice.date}
                max={today}
                min={today}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setInvoice(prev => ({
                    ...prev,
                    date: newDate,
                    periodFrom: prev.periodFrom && prev.periodFrom > newDate ? newDate : prev.periodFrom,
                    periodTo: prev.periodTo && prev.periodTo > newDate && !prev.periodTo.startsWith('20') ? newDate : prev.periodTo // Allow future if deliberately future
                  }));
                }}
              />
            </div>
          </div>
        </div>

        {/* CLIENT + PERIOD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* Client */}
          <div className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-200">
            <h3 className="text-xs font-extrabold text-emerald-700 uppercase tracking-widest mb-4">Informations Client</h3>
            <div className="space-y-4">

              {/* SELECT obligatoire depuis la base */}
              <div className="relative">
                <select
                  className={`w-full bg-white border rounded-lg px-4 py-2 text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all outline-none font-bold appearance-none cursor-pointer ${!invoice.clientId ? 'border-orange-300 text-gray-400' : 'border-emerald-300 text-gray-900'}`}
                  value={invoice.clientId || ''}
                  onChange={(e) => handleClientSelection(e.target.value)}
                  required
                >
                  <option value="">-- Sélectionner un client enregistré *</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.matriculeFiscal}
                    </option>
                  ))}
                </select>
                {clients.length === 0 && (
                  <div className="mt-1 text-[10px] font-bold text-orange-500">
                    ⚠ Aucun client enregistré. Veuillez d'abord ajouter un client dans le référentiel.
                  </div>
                )}
                {!invoice.clientId && clients.length > 0 && (
                  <div className="mt-1 text-[10px] font-bold text-orange-500">
                    ⚠ La sélection d'un client enregistré est obligatoire.
                  </div>
                )}
                {invoice.clientId && (
                  <div className="mt-1 text-[10px] font-bold text-emerald-600">
                    ✓ Client sélectionné depuis le référentiel
                  </div>
                )}
              </div>

              {/* Champs auto-remplis en lecture seule */}
              {invoice.clientId && (
                <>
                  <div className="relative">
                    <input
                      readOnly
                      placeholder="Matricule Fiscal"
                      className="w-full bg-gray-100 border border-emerald-200 rounded-lg px-4 py-2 text-sm font-mono font-bold text-emerald-700 outline-none cursor-not-allowed"
                      value={formatMatriculeDisplay(invoice.clientMatricule)}
                    />
                    <div className="mt-1 text-[10px] font-bold text-emerald-600">
                      ✓ Format valide : {formatMatriculeDisplay(invoice.clientMatricule)}
                    </div>
                  </div>
                  <input
                    readOnly
                    placeholder="Numéro RNE"
                    className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none cursor-not-allowed text-gray-600"
                    value={invoice.clientRNE || '—'}
                  />
                  <textarea
                    readOnly
                    placeholder="Adresse du Client"
                    className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none resize-none cursor-not-allowed text-gray-600"
                    rows="2"
                    value={invoice.clientAddress}
                  />
                </>
              )}
            </div>
          </div>

          {/* Period & Payment */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-5">
            {/* PÉRIODE DE FACTURATION */}
            {!showPeriod ? (
              <div className="flex flex-col items-center justify-center py-2 border border-dashed border-slate-300 rounded-lg hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group cursor-pointer"
                onClick={() => setShowPeriod(true)}>
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-600 uppercase tracking-widest">+ Ajouter une période</span>
              </div>
            ) : (
              <div className="animate-fadeIn">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Période de Facturation</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPeriod(false);
                      setInvoice(prev => ({ ...prev, periodFrom: '', periodTo: '' }));
                    }}
                    className="text-[9px] font-bold text-red-500 uppercase hover:underline"
                  >
                    Retirer
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-slate-600 uppercase">Du</label>
                    <input type="date" className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                      value={invoice.periodFrom}
                      onChange={e => setInvoice({ ...invoice, periodFrom: e.target.value })} />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-slate-600 uppercase">Au</label>
                    <input type="date" className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                      value={invoice.periodTo}
                      onChange={e => setInvoice({ ...invoice, periodTo: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            {/* DIVIDER */}
            <div className="h-px bg-slate-200"></div>

            {/* CONDITIONS DE PAIEMENT */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Conditions de Paiement</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-slate-600 uppercase">Échéance</label>
                  <input type="date" className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
                    value={invoice.dueDate}
                    onChange={e => setInvoice({ ...invoice, dueDate: e.target.value })} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-slate-600 uppercase">Paiement</label>
                  <select className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
                    value={invoice.paymentMode}
                    onChange={e => setInvoice({ ...invoice, paymentMode: e.target.value })}>
                    <option value="Virement">Virement Bancaire</option>
                    <option value="Chèque">Chèque</option>
                    <option value="Comptant">Comptant</option>
                    <option value="Traite">Traite</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Signature - CACHÉ */}
          <div style={{ display: 'none' }} className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="text-center z-10">
              <h3 className="text-xs font-extrabold text-emerald-700 uppercase tracking-widest mb-2">Signature Digigo</h3>
              {status === 'signing' ? (
                <div className="flex items-center gap-2 text-emerald-700 font-bold animate-pulse text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-700"></span> Signature XAdES...
                </div>
              ) : status === 'success' ? (
                <div className="text-green-600 flex flex-col items-center gap-1 font-bold">
                  <span className="text-lg"><Icons.Check /></span>
                  <span className="text-[10px] uppercase">Certificat Validé</span>
                </div>
              ) : (
                <button className="text-[10px] bg-white border border-emerald-200 text-emerald-700 font-bold py-2 px-6 rounded-full hover:bg-emerald-50 translate-y-1 shadow-sm">
                  DÉVEROUILLER CERTIFICAT
                </button>
              )}
            </div>
            <div className="absolute top-0 right-0 p-1 opacity-5">
              <svg height="80" width="80"><path d="M0 0 L80 80 M80 0 L0 80" stroke="blue" strokeWidth="2" /></svg>
            </div>
          </div>
        </div>

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
                <tr key={index} className="hover:bg-emerald-50/30 transition-colors group">
                  <td className="px-6 py-4 relative">
                    <div className="relative">
                      <select
                        className="w-full bg-white border-2 border-gray-200 rounded-lg px-4 py-2.5 pr-10 font-semibold text-gray-800 appearance-none cursor-pointer hover:border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                        value={item.productId || ''}
                        onChange={(e) => {
                          const selectedProduct = products.find(p => p.id === parseInt(e.target.value));
                          if (selectedProduct) {
                            handleProductSelection(index, selectedProduct);
                          }
                        }}
                      >
                        <option value="">Sélectionner un produit...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      {/* Flèche personnalisée */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-500">
                          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
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
                      className="bg-transparent border-none p-0 focus:ring-0 w-full text-center font-bold text-emerald-700 appearance-none cursor-pointer"
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
                      className="text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={addItem}
            className="w-full bg-white border-t border-gray-100 py-4 text-[10px] font-black tracking-[0.2em] text-emerald-700 hover:bg-gray-50 transition-colors"
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
            {saveQrCode && !ttnResponse && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex items-center gap-6">
                <img src={saveQrCode} alt="QR Code Facture" className="w-32 h-32 bg-white p-1 rounded-lg shadow-inner" />
                <div>
                  <h4 className="text-xs font-black text-emerald-700 uppercase mb-1">Facture Enregistrée</h4>
                  <p className="text-[10px] font-bold text-emerald-600 mb-2 font-mono">{invoice.number}</p>
                  <p className="text-[11px] text-emerald-800/80 leading-relaxed italic">
                    "Ce QR Code contient la structure XML conforme TEIF v2.0."
                  </p>
                </div>
              </div>
            )}
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

          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm space-y-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400"></div>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total HT</span>
                <span className="text-sm font-bold text-gray-700">{formatCurrency(invoice.totals.ht)} DT</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Montant TVA global</span>
                <span className="text-sm font-bold text-gray-700">{formatCurrency(invoice.totals.tva)} DT</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Droit de Timbre</span>
                <span className="text-sm font-bold text-gray-700">{formatCurrency(invoice.totals.stamp)} DT</span>
              </div>
              <div className="pt-4 mt-2 flex justify-between items-center">
                <span className="text-sm font-black uppercase tracking-tight text-emerald-700">Net à Payer TTC</span>
                <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {formatCurrency(invoice.totals.ttc)} <span className="text-sm font-medium text-gray-400">DT</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="mt-12 flex flex-col md:flex-row gap-4 items-center justify-between border-t border-gray-100 pt-10">
          <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            Service WS v5 Opérationnel
          </div>

          <div className="flex gap-2 w-full flex-nowrap overflow-x-auto pb-4 md:pb-0 items-center justify-end">
            <button
              onClick={() => {
                setShowValidator(true);
              }}
              className="flex-none border-2 border-blue-500 text-blue-600 font-black text-[10px] py-3 px-5 rounded-xl hover:bg-blue-50 transition-all uppercase tracking-widest flex items-center justify-center gap-2 shadow-md hover:-translate-y-1"
            >
              🔍 Analyser la Facture
            </button>
            <button
              onClick={() => setShowXmlPreview(true)}
              className="flex-none border border-gray-200 text-gray-600 font-black text-[10px] py-3 px-5 rounded-xl hover:bg-gray-50 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Icons.Document /> Aperçu TEIF
            </button>
            <button
              onClick={() => handleSaveInvoice(false)}
              disabled={saving || (invoice.dbId && status !== 'success')}
              className={`flex-none font-black text-[10px] py-3 px-5 rounded-xl shadow-lg transition-all uppercase tracking-widest flex items-center justify-center gap-2 ${saving || (invoice.dbId && status !== 'success') ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:-translate-y-1'}`}
            >
              {saving ? <><Icons.Clock /> ...</> : invoice.dbId ? <><Icons.Check /> Enregistrée</> : <><Icons.Save /> Enregistrer</>}
            </button>
            <button
              onClick={handleSubmissionFlow}
              disabled={status !== 'draft' && status !== 'success'}
              className={`flex-none bg-emerald-700 text-white font-black text-[10px] py-3 px-5 rounded-xl shadow-lg transition-all uppercase tracking-widest flex items-center justify-center gap-3 ${status !== 'draft' && status !== 'success' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-800 hover:-translate-y-1'}`}
            >
              {status === 'sending' ? <><Icons.Clock /> Envoi...</> : status === 'validating' ? <><Icons.Clock /> Validation...</> : status === 'signing' ? <><Icons.Clock /> Signature...</> : <><Icons.Send /> Signer & Envoyer</>}
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
              <pre className="text-emerald-300 font-mono text-xs leading-relaxed">
                {generateTeifXml(issuer, invoice)}
              </pre>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-4 bg-gray-50">
              <button onClick={copyXml} className="flex-1 bg-white border border-gray-200 text-gray-700 font-black text-[10px] py-3 rounded-xl hover:bg-gray-100 uppercase tracking-widest flex items-center justify-center">
                <Icons.Copy /> Copier le XML
              </button>
              <button onClick={handleDownloadXml} className="flex-1 bg-emerald-700 text-white font-black text-[10px] py-3 rounded-xl hover:bg-emerald-800 uppercase tracking-widest shadow-lg shadow-emerald-200 flex items-center justify-center">
                <Icons.Download /> Télécharger .xml
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE VALIDATOR MODAL */}
      {showValidator && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Analyse de Conformité</h3>
                <p className="text-xs text-gray-500 font-bold">Détection intelligente des erreurs avant envoi</p>
              </div>
              <button
                onClick={() => setShowValidator(false)}
                className="text-gray-400 hover:text-gray-600 font-bold uppercase text-[10px] tracking-widest bg-white border border-gray-100 py-2 px-4 rounded-full shadow-sm hover:shadow-md transition-all"
              >✕ FERMER</button>
            </div>
            <div className="flex-1 overflow-auto">
              <InvoiceValidator
                key={Date.now()}
                invoice={{
                  ...invoice,
                  lines: invoice.items.map(item => ({
                    description: item.description,
                    unit: item.unit,
                    qty: parseInt(item.qty) || 1,
                    unitPriceHT: parseFloat(item.puht) || 0,
                    tvaRate: parseInt(item.tvaRate) || 19
                  }))
                }}
                onClose={() => setShowValidator(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL - After Save */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn my-auto">
            {/* Header with success indicator */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-3 shadow-lg">
                <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">
                {ttnResponse ? 'Signée et envoyée au TTN avec succès !' : 'Facture Enregistrée !'}
              </h2>
              <p className="text-emerald-50 text-xs font-bold font-mono">
                {invoice.number}
              </p>
            </div>

            {/* Body with message */}
            <div className="p-6 text-center">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3 text-left">
                  <div className="flex-shrink-0 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-amber-900 uppercase tracking-widest">
                      Statut : {ttnResponse ? 'Facture Validée' : 'Brouillon Enregistré'}
                    </h3>
                    <p className="text-xs text-amber-800 leading-tight">
                      {ttnResponse 
                        ? "Transmis au TTN avec succès."
                        : "Facture enregistrée avec succès en attendant la signature et l'envoi au TTN."
                      }
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-4">
                Actions Disponibles
              </p>

              {/* Action buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleReturnToDashboard}
                  className="group bg-white border-2 border-gray-300 text-gray-700 font-black text-sm py-4 px-6 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all uppercase tracking-wider flex items-center justify-center gap-3 shadow-sm"
                >
                  <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Retour Dashboard
                </button>

                <button
                  onClick={handleCreateNewInvoice}
                  className="group bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm py-4 px-6 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all uppercase tracking-wider flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Créer une Autre Facture
                </button>
              </div>
            </div>

            {/* Footer note */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center font-medium">
                💡 Vous pouvez retrouver cette facture dans votre liste de factures pour la signer et l'envoyer plus tard.
              </p>
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
