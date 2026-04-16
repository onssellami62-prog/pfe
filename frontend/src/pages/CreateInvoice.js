import React, { useState, useEffect } from 'react';

const API_BASE    = 'http://localhost:5170/api';
const getToken    = () => localStorage.getItem('token');
const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`
});

const formatAmount = (num) => parseFloat(num || 0).toFixed(3);

export default function CreateInvoice() {
    const [clients, setClients]   = useState([]);
    const [produits, setProduits] = useState([]);
    const [status, setStatus]     = useState('draft');
    const [ttnResponse, setTtnResponse] = useState(null);
    const [error, setError]       = useState('');

    const [invoice, setInvoice] = useState({
        tiersId:            '',
        clientName:         '',
        clientMatricule:    '',
        date:               new Date().toISOString().split('T')[0],
        dateLimitePaiement: '',
        periodFrom:         '',
        periodTo:           '',
        timbreFiscal:       true,
        remiseGlobale:      0,
        items:              [],
        totals:             { ht: 0, tva: 0, stamp: 0.600, ttc: 0 }
    });

    // ── Chargement clients et produits ───────────────────────────────────
    useEffect(() => {
        fetch(`${API_BASE}/tiers`, { headers: authHeaders() })
            .then(r => r.json()).then(setClients).catch(() => {});
        fetch(`${API_BASE}/produits`, { headers: authHeaders() })
            .then(r => r.json()).then(setProduits).catch(() => {});
    }, []);

    // ── Calcul automatique des totaux ────────────────────────────────────
    useEffect(() => {
        let ht = 0, tva = 0;
        invoice.items.forEach(item => {
            const lineHT  = (item.qty || 0) * (item.puht || 0);
            const remise  = lineHT * ((item.remise || 0) / 100);
            const netHT   = lineHT - remise;
            const lineTVA = netHT * ((item.tvaRate || 0) / 100);
            ht  += netHT;
            tva += lineTVA;
        });
        const remiseGlob = ht * ((invoice.remiseGlobale || 0) / 100);
        const htApres    = ht - remiseGlob;
        const stamp      = invoice.timbreFiscal ? 0.600 : 0;
        const ttc        = htApres + tva + stamp;

        setInvoice(prev => ({
            ...prev,
            totals: { ht: htApres, tva, stamp, ttc }
        }));
    }, [invoice.items, invoice.remiseGlobale, invoice.timbreFiscal]);

    // ── Sélection client ─────────────────────────────────────────────────
    const handleClientChange = (id) => {
        const client = clients.find(c => c.id === parseInt(id));
        if (client) {
            setInvoice(prev => ({
                ...prev,
                tiersId:         client.id,
                clientName:      client.nom,
                clientMatricule: client.matriculeFiscal || client.cin || ''
            }));
        }
    };

    // ── Gestion lignes ───────────────────────────────────────────────────
    const addItem = () => {
        setInvoice(prev => ({
            ...prev,
            items: [...prev.items, { produitId: '', description: '', qty: 1, puht: 0, tvaRate: 19, remise: 0 }]
        }));
    };

    const updateItem = (index, field, value) => {
        const newItems = [...invoice.items];
        newItems[index][field] = value;

        // Si on sélectionne un produit → auto-remplir
        if (field === 'produitId' && value) {
            const produit = produits.find(p => p.id === parseInt(value));
            if (produit) {
                newItems[index].description = produit.nom;
                newItems[index].puht        = produit.prixUnitaire;
                newItems[index].tvaRate     = produit.tauxTVA;
            }
        }
        setInvoice(prev => ({ ...prev, items: newItems }));
    };

    const removeItem = (index) => {
        setInvoice(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    // ── Envoi au backend ─────────────────────────────────────────────────
    const handleSubmit = async () => {
        setError('');

        if (!invoice.tiersId) {
            setError('Veuillez sélectionner un client.');
            return;
        }
        if (invoice.items.length === 0) {
            setError('Ajoutez au moins une ligne produit.');
            return;
        }

        setStatus('validating');

        try {
            const body = {
                tiersId:            invoice.tiersId,
                dateFacture:        invoice.date,
                dateLimitePaiement: invoice.dateLimitePaiement || null,
                periodeDu:          invoice.periodFrom || null,
                periodeAu:          invoice.periodTo   || null,
                timbreFiscal:       invoice.timbreFiscal,
                remiseGlobale:      invoice.remiseGlobale,
                lignes: invoice.items.map(item => ({
                    produitId:   parseInt(item.produitId) || 1,
                    designation: item.description,
                    quantite:    parseInt(item.qty)       || 1,
                    prixUnitaire: parseFloat(item.puht)   || 0,
                    remiseLigne:  parseFloat(item.remise) || 0,
                    tauxTVA:      parseFloat(item.tvaRate)|| 19
                }))
            };

            setStatus('sending');

            const res  = await fetch(`${API_BASE}/factures`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.message || 'Erreur serveur.');
                setStatus('draft');
                return;
            }

            setStatus('success');
            setTtnResponse({
                reference:    `FAC-${data.numeroFacture}`,
                numeroFacture: data.numeroFacture,
                message:      data.message
            });

        } catch (err) {
            setError('Erreur de connexion au serveur.');
            setStatus('draft');
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-8 font-['Plus_Jakarta_Sans'] bg-gray-50 min-h-screen">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">

                {/* HEADER */}
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
                        </div>
                    </div>
                    <div className="text-right space-y-2">
                        <div className="inline-block bg-blue-50 text-blue-700 px-4 py-1 rounded-full text-xs font-bold tracking-widest border border-blue-100">
                            DOCUMENT CONFORME TEIF v1.8.8
                        </div>
                        <p className="text-sm text-gray-500 font-medium">{new Date().toLocaleDateString('fr-TN')}</p>
                    </div>
                </div>

                {/* INFOS FACTURE */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                    {/* Sélection client */}
                    <div className="bg-gray-50 p-5 rounded-xl border border-dashed border-gray-200">
                        <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest mb-3">Client</h3>
                        <select
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 outline-none focus:border-blue-500"
                            value={invoice.tiersId}
                            onChange={e => handleClientChange(e.target.value)}
                        >
                            <option value="">-- Sélectionner un client --</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.nom}</option>
                            ))}
                        </select>
                        {invoice.clientMatricule && (
                            <p className="text-xs font-mono text-blue-600 mt-1">
                                Mat: {invoice.clientMatricule}
                            </p>
                        )}
                    </div>

                    {/* Dates */}
                    <div className="bg-gray-50 p-5 rounded-xl border border-dashed border-gray-200">
                        <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest mb-3">Dates</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase w-16">Facture</label>
                                <input type="date" className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                                    value={invoice.date}
                                    onChange={e => setInvoice(prev => ({ ...prev, date: e.target.value }))} />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase w-16">Échéance</label>
                                <input type="date" className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                                    value={invoice.dateLimitePaiement}
                                    onChange={e => setInvoice(prev => ({ ...prev, dateLimitePaiement: e.target.value }))} />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase w-16">Du</label>
                                <input type="date" className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                                    value={invoice.periodFrom}
                                    onChange={e => setInvoice(prev => ({ ...prev, periodFrom: e.target.value }))} />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase w-16">Au</label>
                                <input type="date" className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                                    value={invoice.periodTo}
                                    onChange={e => setInvoice(prev => ({ ...prev, periodTo: e.target.value }))} />
                            </div>
                        </div>
                    </div>

                    {/* Options */}
                    <div className="bg-gray-50 p-5 rounded-xl border border-dashed border-gray-200">
                        <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest mb-3">Options</h3>
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={invoice.timbreFiscal}
                                    onChange={e => setInvoice(prev => ({ ...prev, timbreFiscal: e.target.checked }))}
                                    className="w-4 h-4 accent-blue-600" />
                                <span className="text-xs font-bold text-gray-700">Timbre fiscal (0.600 DT)</span>
                            </label>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Remise globale (%)</label>
                                <input type="number" min="0" max="100" step="0.01"
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                                    value={invoice.remiseGlobale}
                                    onChange={e => setInvoice(prev => ({ ...prev, remiseGlobale: parseFloat(e.target.value) || 0 }))} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* LIGNES PRODUITS */}
                <div className="mb-8 overflow-hidden rounded-xl border border-gray-100 shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 font-black uppercase text-[10px] text-gray-500">Produit</th>
                                <th className="px-4 py-3 font-black uppercase text-[10px] text-gray-500">Désignation</th>
                                <th className="px-3 py-3 font-black uppercase text-[10px] text-gray-500 text-center">Qté</th>
                                <th className="px-3 py-3 font-black uppercase text-[10px] text-gray-500 text-center">TVA</th>
                                <th className="px-3 py-3 font-black uppercase text-[10px] text-gray-500 text-center">Remise%</th>
                                <th className="px-3 py-3 font-black uppercase text-[10px] text-gray-500 text-right">PU HT</th>
                                <th className="px-4 py-3 font-black uppercase text-[10px] text-gray-500 text-right">Total HT</th>
                                <th className="w-8"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                            {invoice.items.map((item, index) => {
                                const lineHT = (item.qty || 0) * (item.puht || 0) * (1 - (item.remise || 0) / 100);
                                return (
                                    <tr key={index} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-4 py-3 w-40">
                                            <select
                                                className="bg-transparent border border-gray-200 rounded px-2 py-1 text-xs w-full outline-none focus:border-blue-500"
                                                value={item.produitId}
                                                onChange={e => updateItem(index, 'produitId', e.target.value)}
                                            >
                                                <option value="">-- Produit --</option>
                                                {produits.map(p => (
                                                    <option key={p.id} value={p.id}>{p.nom}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                className="bg-transparent border-none p-0 focus:ring-0 w-full font-bold text-gray-800 placeholder-gray-300 text-sm"
                                                placeholder="Désignation..."
                                                value={item.description}
                                                onChange={e => updateItem(index, 'description', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-3 py-3 w-16">
                                            <input type="number" min="1"
                                                className="bg-transparent border-none p-0 focus:ring-0 w-full text-center font-bold text-sm"
                                                value={item.qty}
                                                onChange={e => updateItem(index, 'qty', e.target.value)} />
                                        </td>
                                        <td className="px-3 py-3 w-20">
                                            <select
                                                className="bg-transparent border-none p-0 focus:ring-0 w-full text-center font-bold text-blue-600 text-sm"
                                                value={item.tvaRate}
                                                onChange={e => updateItem(index, 'tvaRate', parseInt(e.target.value))}>
                                                <option value="7">7%</option>
                                                <option value="13">13%</option>
                                                <option value="19">19%</option>
                                            </select>
                                        </td>
                                        <td className="px-3 py-3 w-20">
                                            <input type="number" min="0" max="100"
                                                className="bg-transparent border-none p-0 focus:ring-0 w-full text-center font-bold text-sm"
                                                value={item.remise}
                                                onChange={e => updateItem(index, 'remise', e.target.value)} />
                                        </td>
                                        <td className="px-3 py-3 w-28">
                                            <input type="number" step="0.001"
                                                className="bg-transparent border-none p-0 focus:ring-0 w-full text-right font-bold text-gray-700 text-sm"
                                                value={item.puht}
                                                onChange={e => updateItem(index, 'puht', parseFloat(e.target.value))} />
                                        </td>
                                        <td className="px-4 py-3 text-right font-black text-gray-900 text-sm">
                                            {formatAmount(lineHT)}
                                        </td>
                                        <td className="px-2">
                                            <button onClick={() => removeItem(index)}
                                                className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">✕</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <button onClick={addItem}
                        className="w-full bg-white border-t border-gray-100 py-3 text-[10px] font-black tracking-[0.2em] text-blue-600 hover:bg-gray-50 transition-colors">
                        + AJOUTER UNE LIGNE PRODUIT / SERVICE
                    </button>
                </div>

                {/* TOTAUX */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div>
                        {/* Message erreur */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700 font-medium">
                                {error}
                            </div>
                        )}

                        {/* Réponse succès */}
                        {ttnResponse && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-4">
                                <div className="text-3xl">✅</div>
                                <div>
                                    <h4 className="text-xs font-black text-green-700 uppercase mb-1">Facture enregistrée</h4>
                                    <p className="text-xs font-mono text-green-600">{ttnResponse.reference}</p>
                                    <p className="text-xs text-green-800 mt-1">{ttnResponse.message}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-900 rounded-2xl p-8 text-white shadow-2xl space-y-4">
                        <div className="flex justify-between text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                            <span>Total HT</span>
                            <span>{formatAmount(invoice.totals.ht)} DT</span>
                        </div>
                        <div className="flex justify-between text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                            <span>TVA</span>
                            <span>{formatAmount(invoice.totals.tva)} DT</span>
                        </div>
                        {invoice.timbreFiscal && (
                            <div className="flex justify-between text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                                <span>Timbre Fiscal</span>
                                <span>{formatAmount(invoice.totals.stamp)} DT</span>
                            </div>
                        )}
                        {invoice.remiseGlobale > 0 && (
                            <div className="flex justify-between text-orange-400 font-bold uppercase text-[10px] tracking-widest">
                                <span>Remise globale ({invoice.remiseGlobale}%)</span>
                                <span>- {formatAmount(invoice.totals.ht * invoice.remiseGlobale / 100)} DT</span>
                            </div>
                        )}
                        <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                            <span className="text-sm font-black uppercase">NET À PAYER TTC</span>
                            <span className="text-3xl font-extrabold text-blue-400">{formatAmount(invoice.totals.ttc)} <span className="text-sm font-light opacity-50">DT</span></span>
                        </div>
                    </div>
                </div>

                {/* ACTIONS */}
                <div className="mt-10 flex gap-4 items-center justify-end border-t border-gray-100 pt-8">
                    <button className="border border-gray-200 text-gray-600 font-black text-xs py-3 px-8 rounded-xl hover:bg-gray-50 transition-all uppercase tracking-widest">
                        📄 Aperçu TEIF
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={status === 'sending' || status === 'validating'}
                        className={`bg-blue-600 text-white font-black text-xs py-3 px-10 rounded-xl shadow-lg transition-all uppercase tracking-widest flex items-center gap-2 ${status === 'sending' || status === 'validating' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700 hover:-translate-y-0.5'}`}>
                        {status === 'sending'    ? '⏳ Enregistrement...' :
                         status === 'validating' ? '🔍 Validation...'     :
                         status === 'success'    ? '✅ Nouvelle Facture'  :
                         '💾 Enregistrer la Facture'}
                    </button>
                </div>
            </div>

            <footer className="text-center text-[10px] text-gray-400 uppercase font-black tracking-widest pb-8">
                Module Digital Trust & Signature — Conforme TEIF v1.8.8 TTN
            </footer>
        </div>
    );
}