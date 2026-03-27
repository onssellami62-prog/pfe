import React, { useState, useEffect } from 'react';

/**
 * UTILS: Expert Billing & Tunisian Validation
 */
const STAMP_DUTY = 0.600;

// Format: 0000000/A/P/M/000 (standard 5 segments) OR 0000000/A/P/000 (expert spec 4 segments)
const validateMatriculeFiscal = (value) => {
  // Supporte majuscules/minuscules et les deux variantes de segments
  const regex = /^\d{7}\/([A-Z])\/([A-Z])\/([A-Z]\/)?\d{3}$/i;
  return regex.test(value);
};

const formatAmount = (num) => parseFloat(num || 0).toFixed(3);

export default function CreateInvoice() {
  const [invoice, setInvoice] = useState({
    number: `FAC-${new Date().getFullYear()}-0001`,
    date: new Date().toISOString().split('T')[0],
    periodFrom: '',
    periodTo: '',
    clientName: '',
    clientMatricule: '',
    items: [],
    totals: {
      ht: 0,
      tva: 0,
      stamp: STAMP_DUTY,
      ttc: 0
    }
  });

  const [status, setStatus] = useState('draft'); // draft, validating, signing, sending, success, error
  const [ttnResponse, setTtnResponse] = useState(null);

  // Cascade Calculation logic
  useEffect(() => {
    let htTotal = 0;
    let tvaTotal = 0;

    invoice.items.forEach(item => {
      const lineHT = (item.qty || 0) * (item.puht || 0);
      const lineTVA = lineHT * ((item.tvaRate || 0) / 100);
      htTotal += lineHT;
      tvaTotal += lineTVA;
    });

    const ttc = htTotal + tvaTotal + STAMP_DUTY;

    setInvoice(prev => ({
      ...prev,
      totals: {
        ht: htTotal,
        tva: tvaTotal,
        stamp: STAMP_DUTY,
        ttc: ttc
      }
    }));
  }, [invoice.items]);

  const addItem = () => {
    setInvoice({
      ...invoice,
      items: [...invoice.items, { description: '', qty: 1, puht: 0, tvaRate: 19 }]
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...invoice.items];
    newItems[index][field] = value;
    setInvoice({ ...invoice, items: newItems });
  };

  const removeItem = (index) => {
    setInvoice({ ...invoice, items: invoice.items.filter((_, i) => i !== index) });
  };

  /**
   * SIGNATURE & TTN FLOW SIMULATION
   */
  const handleSubmissionFlow = async () => {
    // 1. Validation Step
    if (!invoice.clientName || !validateMatriculeFiscal(invoice.clientMatricule)) {
      alert("Erreur: Le matricule fiscal client est invalide ou absent.");
      return;
    }

    setStatus('validating');
    setTimeout(() => {
      // 2. Prepare XAdES-BES Placeholder
      setStatus('signing');
      console.log("Génération structure XML TEIF v2.0...");
      setTimeout(() => {
        // 3. WS Call: saveEfact
        setStatus('sending');
        console.log("Appel méthode saveEfact (TTN WS v5)...");
        setTimeout(() => {
          // 4. Result: consultEfact status
          setStatus('success');
          setTtnResponse({
            reference: `TTN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            status: 'Validée',
            qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://fatoora.tn/verify/' + Math.random().toString(36).substr(2, 6)
          });
        }, 1500);
      }, 1000);
    }, 800);
  };

  return (
    <div className="max-w-6xl mx-auto p-8 font-['Plus_Jakarta_Sans'] bg-gray-50 min-h-screen">
      
      {/* HEADER SECTION (replica visuelle) */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
        <div className="flex justify-between items-start mb-10 border-b border-gray-100 pb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-600 p-2 rounded-lg text-white font-black text-xl">EF</div>
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 uppercase">EL FATOORA</h1>
            </div>
            <div className="text-gray-500 text-sm leading-relaxed">
              <p className="font-bold text-gray-800">SOCIETE GENERALE DE COMMERCE SA</p>
              <p>Avenue Habib Bourguiba, 1001 Tunis</p>
              <p>Mat. Fiscal: <span className="font-mono text-blue-600">1234567/A/P/M/000</span></p>
              <p>Registre Commerce: B01234562024</p>
            </div>
          </div>
          <div className="text-right space-y-4">
            <div className="inline-block bg-blue-50 text-blue-700 px-4 py-1 rounded-full text-xs font-bold tracking-widest border border-blue-100">
              DOCUMENT CONFORME TEIF v2.0
            </div>
            <div className="space-y-1">
              <h2 className="text-gray-400 text-xs font-bold uppercase">Facture N°</h2>
              <input 
                className="text-2xl font-black text-gray-900 border-none p-0 focus:ring-0 text-right w-full bg-transparent"
                value={invoice.number}
                onChange={(e) => setInvoice({...invoice, number: e.target.value})}
              />
            </div>
            <p className="text-sm text-gray-500 font-medium">{new Date().toLocaleDateString('fr-TN')}</p>
          </div>
        </div>

        {/* INFO GRID (CLIENT & PERIOD) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-200">
            <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest mb-4">Informations Client</h3>
            <div className="space-y-4">
              <input 
                placeholder="Nom du Client" 
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                value={invoice.clientName}
                onChange={(e) => setInvoice({...invoice, clientName: e.target.value})}
              />
              <input 
                placeholder="Matricule Fiscal (0000000/A/P/M/000)" 
                className={`w-full bg-white border rounded-lg px-4 py-2 text-sm focus:ring-4 font-mono transition-all outline-none ${invoice.clientMatricule && !validateMatriculeFiscal(invoice.clientMatricule) ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100'}`}
                value={invoice.clientMatricule}
                onChange={(e) => setInvoice({...invoice, clientMatricule: e.target.value})}
              />
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-200">
            <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest mb-4">Période d'activité</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase w-8">Du</label>
                <input type="date" className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-1.5 text-xs outline-none focus:border-blue-500" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase w-8">Au</label>
                <input type="date" className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-1.5 text-xs outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>

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
            {/* Background pattern */}
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
                      className="bg-transparent border-none p-0 focus:ring-0 w-full font-bold text-gray-800 placeholder-gray-300"
                      placeholder="Désignation de l'article..."
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-4 w-20">
                    <input 
                      type="number"
                      className="bg-transparent border-none p-0 focus:ring-0 w-full text-center font-bold"
                      value={item.qty}
                      onChange={(e) => updateItem(index, 'qty', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-4 w-24">
                    <select 
                      className="bg-transparent border-none p-0 focus:ring-0 w-full text-center font-bold text-blue-600 appearance-none bg-none"
                      value={item.tvaRate}
                      onChange={(e) => updateItem(index, 'tvaRate', parseInt(e.target.value))}
                    >
                      <option value="7">7%</option>
                      <option value="13">13%</option>
                      <option value="19">19%</option>
                    </select>
                  </td>
                  <td className="px-4 py-4 w-32">
                    <input 
                      type="number"
                      step="0.001"
                      className="bg-transparent border-none p-0 focus:ring-0 w-full text-right font-bold text-gray-700"
                      value={item.puht}
                      onChange={(e) => updateItem(index, 'puht', parseFloat(e.target.value))}
                    />
                  </td>
                  <td className="px-6 py-4 text-right font-black text-gray-900">
                    {formatAmount(item.qty * item.puht)}
                  </td>
                  <td className="px-4">
                    <button 
                      onClick={() => removeItem(index)}
                      className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      ✕
                    </button>
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

        {/* BOTTOM SECTION: TAX RECAP & TOTALS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          <div className="space-y-6">
             <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-xs font-black uppercase text-gray-400 mb-4 tracking-widest">Récapitulatif Fiscal (Cascading)</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm py-1 border-b border-gray-50 italic">
                    <span className="text-gray-500 font-medium">Référentiel I-1601 (Timbre)</span>
                    <span className="font-bold text-gray-700">{formatAmount(STAMP_DUTY)} DT</span>
                  </div>
                  <div className="flex justify-between text-sm py-1 border-b border-gray-50 italic">
                    <span className="text-gray-500 font-medium">Référentiel I-1602 (TVA Totale)</span>
                    <span className="font-bold text-gray-700">{formatAmount(invoice.totals.tva)} DT</span>
                  </div>
                </div>
             </div>

             {/* TTN STATUS PANEL */}
             {ttnResponse && (
               <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center gap-6 animate-fadeIn">
                 <img src={ttnResponse.qrCode} alt="QR Code Signature" className="w-24 h-24 bg-white p-1 rounded-lg shadow-inner" />
                 <div>
                   <h4 className="text-xs font-black text-green-700 uppercase mb-1">Dépôt validé (out@ttn:FTP)</h4>
                   <p className="text-[10px] font-bold text-green-600 mb-2 font-mono">{ttnResponse.reference}</p>
                   <p className="text-[11px] text-green-800/80 leading-relaxed italic">
                     "La structure XML XAdES-BES a été transmise à la méthode saveEfact. Le jeton de consultation est valide."
                   </p>
                 </div>
               </div>
             )}
          </div>

          <div className="bg-gray-900 rounded-2xl p-10 text-white shadow-2xl space-y-6 relative overflow-hidden">
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                <span>Total Hors Taxes (HT)</span>
                <span>{formatAmount(invoice.totals.ht)} DT</span>
              </div>
              <div className="flex justify-between text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                <span>Montant TVA</span>
                <span>{formatAmount(invoice.totals.tva)} DT</span>
              </div>
              <div className="flex justify-between text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                <span>Droit de Timbre (Légal)</span>
                <span>{formatAmount(invoice.totals.stamp)} DT</span>
              </div>
              <div className="border-t border-white/10 pt-6 mt-4 flex justify-between items-center">
                <span className="text-sm font-black uppercase tracking-tighter">NET À PAYER (TTC)</span>
                <span className="text-4xl font-extrabold text-blue-400 tracking-tight">{formatAmount(invoice.totals.ttc)} <span className="text-base font-light opacity-50">DT</span></span>
              </div>
            </div>
            {/* Background design */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500 opacity-20 blur-3xl rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-40"></div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="mt-12 flex flex-col md:flex-row gap-4 items-center justify-between border-t border-gray-100 pt-10">
           <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase">
             <div className="w-2 h-2 rounded-full bg-green-500"></div>
             Service WS v5 Opérationnel (connecté)
           </div>
           
           <div className="flex gap-4 w-full md:w-auto">
             <button className="flex-1 md:flex-none border border-gray-200 text-gray-600 font-black text-xs py-4 px-10 rounded-xl hover:bg-gray-50 transition-all uppercase tracking-widest">
               📄 Aperçu TEIF
             </button>
             <button 
               onClick={handleSubmissionFlow}
               disabled={status !== 'draft' && status !== 'success'}
               className={`flex-1 md:flex-none bg-blue-600 text-white font-black text-xs py-4 px-12 rounded-xl shadow-lg transition-all uppercase tracking-widest flex items-center justify-center gap-3 ${status !== 'draft' && status !== 'success' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700 hover:-translate-y-1'}`}
             >
               {status === 'sending' ? (
                 <>Envoi à TTN (saveEfact)...</>
               ) : status === 'validating' ? (
                 <>Validation Structure...</>
               ) : (
                 <>Lancer la procédure d'envoi</>
               )}
             </button>
           </div>
        </div>

      </div>
      
      {/* SECURITY FOOTER */}
      <footer className="text-center text-[10px] text-gray-400 uppercase font-black tracking-widest pb-10">
         Module Digital Trust & Signature - Conforme au décret de facturation électronique n°2023-XXXX
      </footer>

    </div>
  );
}
