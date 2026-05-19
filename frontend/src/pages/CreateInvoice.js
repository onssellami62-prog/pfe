import React, { useState, useEffect } from 'react';

const API_BASE    = 'http://localhost:5170/api';
const getToken    = () => localStorage.getItem('token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });
const fmt         = (n) => parseFloat(n || 0).toFixed(3);

const emptyInvoice = () => ({
    tiersId: '', clientName: '', clientMatricule: '', clientType: '',
    date: new Date().toISOString().split('T')[0],
    dateLimitePaiement: '', timbreFiscal: true, remiseGlobale: 0,
    items: [], totals: { ht: 0, tva: 0, stamp: 0.6, ttc: 0 }
});

const typeLabel = (t) => ({ 'I-01':'Société Tunisienne','I-02':'Personne Physique','I-03':'Carte Séjour','I-04':'Société Étrangère' }[t] || t || '');

const s = {
    page:    { fontFamily:"'Inter',sans-serif", height:'100%', display:'flex', flexDirection:'column' },
    card:    { background:'#fff', borderRadius:14, border:'1px solid #e5e7eb', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', padding:'18px 22px', flex:1, display:'flex', flexDirection:'column', gap:12, overflow:'hidden' },
    label:   { fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3, display:'block' },
    input:   { width:'100%', border:'1px solid #e5e7eb', borderRadius:7, padding:'6px 10px', fontSize:12, outline:'none', fontFamily:'inherit', background:'#fff' },
    select:  { width:'100%', border:'1px solid #e5e7eb', borderRadius:7, padding:'6px 10px', fontSize:12, outline:'none', fontFamily:'inherit', background:'#fff' },
    section: { background:'#f9fafb', border:'1px solid #f0f0f5', borderRadius:10, padding:'12px 14px' },
    th:      { fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em', padding:'7px 10px', textAlign:'left', borderBottom:'1px solid #f3f4f6', whiteSpace:'nowrap' },
    td:      { padding:'5px 10px', fontSize:12, borderBottom:'1px solid #f9fafb', verticalAlign:'middle' },
    btnPrimary: { background:'#2563eb', color:'#fff', border:'none', borderRadius:9, padding:'9px 20px', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 },
    btnSecondary: { background:'none', color:'#6b7280', border:'1px solid #e5e7eb', borderRadius:9, padding:'9px 16px', fontSize:12, fontWeight:600, cursor:'pointer' },
};

export default function CreateInvoice() {
    const [clients,     setClients]     = useState([]);
    const [produits,    setProduits]    = useState([]);
    const [status,      setStatus]      = useState('draft');
    const [ttnResponse, setTtnResponse] = useState(null);
    const [error,       setError]       = useState('');
    const [invoice,     setInvoice]     = useState(emptyInvoice());

    useEffect(() => {
        fetch(`${API_BASE}/tiers`,    { headers: authHeaders() }).then(r => r.json()).then(setClients).catch(() => {});
        fetch(`${API_BASE}/produits`, { headers: authHeaders() }).then(r => r.json()).then(setProduits).catch(() => {});
    }, []);

    useEffect(() => {
        let ht = 0, tva = 0;
        invoice.items.forEach(item => {
            const net = (item.qty||0)*(item.puht||0)*(1-(item.remise||0)/100);
            ht  += net;
            tva += net * ((item.tvaRate||0)/100);
        });
        const htR  = ht * (1 - (invoice.remiseGlobale||0)/100);
        const stamp = invoice.timbreFiscal ? 0.6 : 0;
        setInvoice(prev => ({ ...prev, totals: { ht: htR, tva, stamp, ttc: htR+tva+stamp } }));
    }, [invoice.items, invoice.remiseGlobale, invoice.timbreFiscal]);

    const handleClientChange = (id) => {
        const c = clients.find(c => c.id === parseInt(id));
        if (c) setInvoice(prev => ({ ...prev, tiersId: c.id, clientName: c.nom, clientType: c.typeIdentifiant||'', clientMatricule: c.matriculeFiscal||c.cin||c.carteSejourPasseport||c.matriculeFiscalEtranger||'' }));
    };

    const addItem    = () => setInvoice(prev => ({ ...prev, items: [...prev.items, { produitId:'', description:'', qty:1, puht:0, tvaRate:19, remise:0 }] }));
    const removeItem = (i) => setInvoice(prev => ({ ...prev, items: prev.items.filter((_,j) => j!==i) }));
    const updateItem = (index, field, value) => {
        const items = [...invoice.items];
        items[index][field] = value;
        if (field === 'produitId' && value) {
            const p = produits.find(p => p.id === parseInt(value));
            if (p) { items[index].description = p.nom; items[index].puht = p.prixUnitaire; items[index].tvaRate = p.tauxTVA; }
        }
        setInvoice(prev => ({ ...prev, items }));
    };

    const resetForm = () => { setInvoice(emptyInvoice()); setStatus('draft'); setTtnResponse(null); setError(''); };

    const handleSubmit = async () => {
        setError('');
        if (!invoice.tiersId)           return setError('Veuillez sélectionner un client.');
        if (!invoice.items.length)      return setError('Ajoutez au moins une ligne.');
        for (const item of invoice.items) {
            if (!item.description)      return setError('Désignation obligatoire pour chaque ligne.');
            if (!item.puht||item.puht<=0) return setError('Prix unitaire doit être > 0.');
        }
        setStatus('sending');
        try {
            const res  = await fetch(`${API_BASE}/factures`, { method:'POST', headers: authHeaders(), body: JSON.stringify({
                tiersId: invoice.tiersId, dateFacture: invoice.date,
                dateLimitePaiement: invoice.dateLimitePaiement||null,
                timbreFiscal: invoice.timbreFiscal, remiseGlobale: invoice.remiseGlobale,
                lignes: invoice.items.map(item => ({ produitId: parseInt(item.produitId)||1, designation: item.description, quantite: parseInt(item.qty)||1, prixUnitaire: parseFloat(item.puht)||0, remiseLigne: parseFloat(item.remise)||0, tauxTVA: parseFloat(item.tvaRate)||19 }))
            })});
            const data = await res.json();
            if (!res.ok) { setError(data.message||'Erreur serveur.'); setStatus('draft'); return; }
            setStatus('success');
            setTtnResponse({ reference:`FAC-${data.numeroFacture}`, message: data.message });
        } catch { setError('Erreur de connexion.'); setStatus('draft'); }
    };

    return (
        <div style={s.page}>
            <div style={s.card}>

                {/* ── HEADER ─────────────────────────────────────────── */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:10, borderBottom:'1px solid #f3f4f6' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ background:'#2563eb', borderRadius:8, padding:'6px 10px', color:'#fff', fontWeight:800, fontSize:14 }}>EF</div>
                        <div>
                            <div style={{ fontWeight:800, fontSize:15, color:'#111827' }}>Nouvelle Facture</div>
                            <div style={{ fontSize:11, color:'#9ca3af' }}>Conforme TEIF v1.8.7 · TTN Tunisie</div>
                        </div>
                    </div>
                    <div style={{ fontSize:11, color:'#9ca3af' }}>{new Date().toLocaleDateString('fr-TN')}</div>
                </div>

                {/* ── INFOS ─────────────────────────────────────────── */}
                <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr', gap:10 }}>

                    {/* Client */}
                    <div style={s.section}>
                        <label style={s.label}>Client</label>
                        <select style={s.select} value={invoice.tiersId} onChange={e => handleClientChange(e.target.value)}>
                            <option value="">-- Sélectionner --</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                        </select>
                        {invoice.clientMatricule && <div style={{ fontSize:11, color:'#2563eb', marginTop:4, fontFamily:'monospace' }}>{invoice.clientMatricule}</div>}
                        {invoice.clientType      && <div style={{ fontSize:10, color:'#9ca3af', marginTop:2 }}>{typeLabel(invoice.clientType)}</div>}
                    </div>

                    {/* Dates */}
                    <div style={s.section}>
                        <label style={s.label}>Dates</label>
                        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                            {[
                                { label:'Facture *',  field:'date',               max: new Date().toISOString().split('T')[0] },
                                { label:'Échéance',   field:'dateLimitePaiement', min: invoice.date },
                            ].map((d, i) => (
                                <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
                                    <span style={{ fontSize:10, color:'#9ca3af', minWidth:52, fontWeight:600 }}>{d.label}</span>
                                    <input type="date" style={{ ...s.input, flex:1 }}
                                        min={d.min} max={d.max}
                                        value={invoice[d.field]||''}
                                        onChange={e => setInvoice(prev => ({ ...prev, [d.field]: e.target.value }))} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Options */}
                    <div style={s.section}>
                        <label style={s.label}>Options</label>
                        <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, cursor:'pointer', marginBottom:8 }}>
                            <input type="checkbox" checked={invoice.timbreFiscal} onChange={e => setInvoice(prev => ({ ...prev, timbreFiscal: e.target.checked }))} />
                            Timbre fiscal (0.600 DT)
                        </label>
                        <label style={s.label}>Remise globale (%)</label>
                        <input type="number" min="0" max="100" step="0.01" style={s.input}
                            value={invoice.remiseGlobale}
                            onChange={e => setInvoice(prev => ({ ...prev, remiseGlobale: parseFloat(e.target.value)||0 }))} />
                    </div>
                </div>

                {/* ── LIGNES ────────────────────────────────────────── */}
                <div style={{ border:'1px solid #f0f0f5', borderRadius:10, overflow:'hidden', flex:1 }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                        <thead>
                            <tr style={{ background:'#f9fafb' }}>
                                <th style={s.th}>Produit</th>
                                <th style={s.th}>Désignation</th>
                                <th style={{ ...s.th, textAlign:'center' }}>Qté</th>
                                <th style={{ ...s.th, textAlign:'center' }}>TVA</th>
                                <th style={{ ...s.th, textAlign:'center' }}>Rem%</th>
                                <th style={{ ...s.th, textAlign:'right' }}>PU HT</th>
                                <th style={{ ...s.th, textAlign:'right' }}>Total HT</th>
                                <th style={{ ...s.th, width:24 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map((item, idx) => {
                                const lineHT = (item.qty||0)*(item.puht||0)*(1-(item.remise||0)/100);
                                return (
                                    <tr key={idx}>
                                        <td style={{ ...s.td, width:130 }}>
                                            <select style={{ ...s.select, fontSize:11 }} value={item.produitId} onChange={e => updateItem(idx,'produitId',e.target.value)}>
                                                <option value="">--</option>
                                                {produits.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                                            </select>
                                        </td>
                                        <td style={s.td}>
                                            <input style={{ border:'none', outline:'none', width:'100%', fontSize:12, fontFamily:'inherit', background:'transparent', fontWeight:600 }}
                                                placeholder="Désignation..." value={item.description}
                                                onChange={e => updateItem(idx,'description',e.target.value)} />
                                        </td>
                                        <td style={{ ...s.td, width:50, textAlign:'center' }}>
                                            <input type="number" min="1" style={{ border:'none', outline:'none', width:'100%', fontSize:12, textAlign:'center', background:'transparent', fontFamily:'inherit', fontWeight:600 }}
                                                value={item.qty} onChange={e => updateItem(idx,'qty',e.target.value)} />
                                        </td>
                                        <td style={{ ...s.td, width:60, textAlign:'center' }}>
                                            <select style={{ border:'none', outline:'none', fontSize:12, color:'#2563eb', fontWeight:700, background:'transparent', fontFamily:'inherit', cursor:'pointer' }}
                                                value={item.tvaRate} onChange={e => updateItem(idx,'tvaRate',parseInt(e.target.value))}>
                                                {[0,7,13,19].map(v => <option key={v} value={v}>{v}%</option>)}
                                            </select>
                                        </td>
                                        <td style={{ ...s.td, width:50, textAlign:'center' }}>
                                            <input type="number" min="0" max="100" style={{ border:'none', outline:'none', width:'100%', fontSize:12, textAlign:'center', background:'transparent', fontFamily:'inherit' }}
                                                value={item.remise} onChange={e => updateItem(idx,'remise',e.target.value)} />
                                        </td>
                                        <td style={{ ...s.td, width:90, textAlign:'right' }}>
                                            <input type="number" step="0.001" min="0" style={{ border:'none', outline:'none', width:'100%', fontSize:12, textAlign:'right', background:'transparent', fontFamily:'inherit', fontWeight:600 }}
                                                value={item.puht} onChange={e => updateItem(idx,'puht',parseFloat(e.target.value))} />
                                        </td>
                                        <td style={{ ...s.td, textAlign:'right', fontWeight:700, color:'#111827' }}>{fmt(lineHT)}</td>
                                        <td style={s.td}>
                                            <button onClick={() => removeItem(idx)} style={{ background:'none', border:'none', cursor:'pointer', color:'#d1d5db', fontSize:14 }}>✕</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <button onClick={addItem} style={{ width:'100%', background:'none', border:'none', borderTop:'1px solid #f3f4f6', padding:'8px', fontSize:11, fontWeight:700, color:'#2563eb', cursor:'pointer', letterSpacing:'0.1em' }}>
                        + AJOUTER UNE LIGNE
                    </button>
                </div>

                {/* ── TOTAUX + ACTIONS ──────────────────────────────── */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:16 }}>

                    {/* Erreur / Succès */}
                    <div style={{ flex:1 }}>
                        {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#dc2626', fontWeight:600 }}>❌ {error}</div>}
                        {ttnResponse && (
                            <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'10px 14px' }}>
                                <div style={{ fontSize:13, fontWeight:700, color:'#16a34a', marginBottom:4 }}>✅ Facture enregistrée</div>
                                <div style={{ fontSize:11, color:'#15803d', fontFamily:'monospace' }}>{ttnResponse.reference}</div>
                                <button onClick={resetForm} style={{ marginTop:8, background:'#16a34a', color:'#fff', border:'none', borderRadius:7, padding:'6px 14px', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                                    + Nouvelle facture
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Totaux */}
                    <div style={{ background:'#111827', borderRadius:12, padding:'14px 20px', color:'#fff', minWidth:220 }}>
                        {[
                            { label:'Total HT',     val: fmt(invoice.totals.ht),    color:'#9ca3af' },
                            { label:'TVA',           val: fmt(invoice.totals.tva),   color:'#9ca3af' },
                            invoice.timbreFiscal && { label:'Timbre',  val: fmt(0.6), color:'#9ca3af' },
                        ].filter(Boolean).map((r, i) => (
                            <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:r.color, marginBottom:5 }}>
                                <span>{r.label}</span><span>{r.val} DT</span>
                            </div>
                        ))}
                        <div style={{ borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:8, marginTop:4, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase' }}>Net TTC</span>
                            <span style={{ fontSize:20, fontWeight:800, color:'#60a5fa' }}>{fmt(invoice.totals.ttc)} <span style={{ fontSize:11, opacity:0.5 }}>DT</span></span>
                        </div>
                    </div>

                    {/* Boutons */}
                    {status !== 'success' && (
                        <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                            <button onClick={resetForm} style={s.btnSecondary}>🗑️ Réinitialiser</button>
                            <button onClick={handleSubmit} disabled={status==='sending'} style={{ ...s.btnPrimary, opacity: status==='sending' ? 0.6 : 1 }}>
                                {status==='sending' ? '⏳ Enregistrement...' : '💾 Enregistrer'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}