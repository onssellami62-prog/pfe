import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './MyInvoices.css';

const API_BASE    = 'http://localhost:5170/api';
const IA_BASE     = 'http://localhost:8000';
const getToken    = () => localStorage.getItem('token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });
const fmt = (n) => parseFloat(n || 0).toFixed(3);

// ── Styles ──────────────────────────────────────────────────────────────────
const es = {
    label:      { fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5, display: 'block' },
    input:      { width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
    th:         { padding: '8px 10px', fontSize: 11, fontWeight: 600, color: '#64748b', textAlign: 'left', textTransform: 'uppercase' },
    td:         { padding: '6px 8px' },
    cellInput:  { padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, outline: 'none', width: '100%', fontFamily: 'inherit' },
    addBtn:     { padding: '5px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 7, color: '#1e429f', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
    totalLabel: { fontSize: 11, color: '#64748b', marginBottom: 3 },
    totalVal:   { fontSize: 14, fontWeight: 700, color: '#111827' },
};

const ms = {
    overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
    modal:       { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' },
    header:      { padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    title:       { fontSize: 16, fontWeight: 700, color: '#111827' },
    subtitle:    { fontSize: 13, color: '#64748b', marginTop: 3 },
    closeBtn:    { background: 'none', border: 'none', fontSize: 18, color: '#94a3b8', cursor: 'pointer', padding: '0 4px' },
    actionBtn:   { display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 10, cursor: 'pointer', textAlign: 'left', width: '100%' },
    ttnBtn:      { background: '#1e429f', border: '1px solid #1e3a8a' },
    ttnDisabled: { background: '#f1f5f9', border: '1px solid #e2e8f0', cursor: 'not-allowed', opacity: 0.7 },
    actionIcon:  { fontSize: 22, flexShrink: 0 },
    actionTitle: { fontSize: 13, fontWeight: 600, color: '#111827' },
    actionDesc:  { fontSize: 12, color: '#64748b', marginTop: 1 },
};

export default function MyInvoices({ initialFilter = 'Tous les statuts' }) {
    const [factures,        setFactures]        = useState([]);
    const [loading,         setLoading]         = useState(true);
    const [error,           setError]           = useState(null);
    const [searchTerm,      setSearchTerm]      = useState('');
    const [statusFilter,    setStatusFilter]    = useState(initialFilter);
    const [actionsModal,    setActionsModal]    = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [teifModal,       setTeifModal]       = useState(null);
    const [iaModal,         setIaModal]         = useState(null);
    const [erreurModal,     setErreurModal]     = useState(null);   // { id, erreurs[], xml? }
    const [signModal,       setSignModal]       = useState(null);
    const [editModal,       setEditModal]       = useState(null);
    const [signedFactures,  setSignedFactures]  = useState({});
    const [envoyerState,    setEnvoyerState]    = useState({});
    const [erreursState,    setErreursState]    = useState({});     // id → { erreurs[], xml? }
    const [tiers,           setTiers]           = useState([]);
    const [produits,        setProduits]        = useState([]);
    const [showAll,         setShowAll]         = useState(false);

    useEffect(() => { setShowAll(false); }, [searchTerm, statusFilter]);
    useEffect(() => { setStatusFilter(initialFilter); }, [initialFilter]);
    useEffect(() => { fetchFactures(); }, []);
    useEffect(() => {
        fetch(`${API_BASE}/tiers`,    { headers: authHeaders() }).then(r => r.ok ? r.json() : []).then(setTiers).catch(() => {});
        fetch(`${API_BASE}/produits`, { headers: authHeaders() }).then(r => r.ok ? r.json() : []).then(setProduits).catch(() => {});
    }, []);

    const fetchFactures = async (silent = false) => {
        if (!silent) { setLoading(true); setError(null); }
        try {
            const res = await fetch(`${API_BASE}/factures`, { headers: authHeaders() });
            if (!res.ok) throw new Error('Erreur chargement factures');
            setFactures([...await res.json()]);
        } catch (err) { if (!silent) setError(err.message); }
        finally { if (!silent) setLoading(false); }
    };

    // ── Statut helpers ──────────────────────────────────────────────────────
    const statutLabel = (s) => {
        if (!s) return 'Brouillon';
        if (s.includes('Accept')) return 'Validé';
        if (s.includes('Rejet') || s.includes('ejet')) return 'Rejetée';
        if (s.includes('Annul')) return 'Annulée';
        return s;
    };
    const statutCss = (s) => {
        if (!s) return 'brouillon';
        if (s.includes('Accept')) return 'validé';
        if (s.includes('Rejet') || s.includes('ejet')) return 'rejetée';
        if (s.includes('Annul')) return 'rejetée';
        return 'brouillon';
    };
    const scoreColor = (sc) => sc <= 20 ? '#16a34a' : sc <= 50 ? '#d97706' : '#dc2626';
    const scoreBg    = (sc) => sc <= 20 ? '#f0fdf4' : sc <= 50 ? '#fffbeb' : '#fef2f2';

    // ── Génère un XML de rejet TTN à partir des erreurs TEIF ────────────────
    const buildRejetXml = (id, erreurs = []) => {
        const now = new Date().toISOString();
        const errLines = erreurs
            .map((e, i) => `        <Erreur numero="${i + 1}">\n            <Code>TEIF-ERR-${String(i + 1).padStart(4, '0')}</Code>\n            <Message>${e.replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]))}</Message>\n        </Erreur>`)
            .join('\n');
        return `<?xml version="1.0" encoding="UTF-8"?>
<ReponseTTN xmlns="urn:ttn:facture:v1.8.8" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <Statut>REJETEE</Statut>
    <NumeroFacture>FAC-${id}</NumeroFacture>
    <DateTraitement>${now}</DateTraitement>
    <Source>Tunisie TradeNet — TEIF v1.8.8</Source>
    <Erreurs>
${errLines}
    </Erreurs>
</ReponseTTN>`;
    };

    // ── Handlers ────────────────────────────────────────────────────────────
    const handleView = async (facture) => {
        setActionsModal(null);
        try {
            const res  = await fetch(`${API_BASE}/factures/${facture.numeroFacture}`, { headers: authHeaders() });
            const data = await res.json();
            setSelectedInvoice({ ...data, _prevFacture: facture });
        } catch { setSelectedInvoice({ ...facture, _prevFacture: facture }); }
    };

    const handleCloseDetail = () => {
        const prev = selectedInvoice?._prevFacture;
        setSelectedInvoice(null);
        if (prev) {
            const fresh = factures.find(f => f.numeroFacture === prev.numeroFacture) || prev;
            setActionsModal(fresh);
        }
    };

    const handleApercuTeif = async (id, prevFacture) => {
        setActionsModal(null);
        setSelectedInvoice(null);
        setTeifModal({ id, loading: true, validation: null, _prev: prevFacture || null });
        try {
            const res  = await fetch(`${API_BASE}/teif/valider/${id}`, { headers: authHeaders() });
            const data = await res.json();
            setTeifModal(prev => ({ ...prev, loading: false, validation: data }));
        } catch {
            setTeifModal(prev => ({
                ...prev,
                loading: false,
                validation: { estValide: false, erreurs: ['Erreur connexion serveur'] }
            }));
        }
    };

    const handleTelechargerXml = async (id) => {
        setActionsModal(null);
        try {
            const res  = await fetch(`${API_BASE}/teif/generer/${id}`, { headers: authHeaders() });
            if (!res.ok) { alert('Erreur génération XML'); return; }
            const blob = await res.blob();
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href = url; a.download = `TEIF_FAC-${id}.xml`; a.click();
            URL.revokeObjectURL(url);
        } catch { alert('Erreur téléchargement XML'); }
    };

    const handleTelechargerXmlRejet = (id) => {
        const data   = erreursState[id];
        const xml    = data?.xml || buildRejetXml(id, data?.erreurs || []);
        const blob   = new Blob([xml], { type: 'application/xml' });
        const url    = URL.createObjectURL(blob);
        const a      = document.createElement('a');
        a.href = url; a.download = `TTN_REJET_FAC-${id}.xml`; a.click();
        URL.revokeObjectURL(url);
    };

    const handleVoirReponseRejection = async (facture) => {
        const id = facture.numeroFacture;
        setActionsModal(null);

        const cached = erreursState[id];
        if (cached) {
            setErreurModal({ id, erreurs: cached.erreurs, xml: cached.xml });
            return;
        }

        try {
            const res  = await fetch(`${API_BASE}/teif/valider/${id}`, { headers: authHeaders() });
            const data = await res.json();
            const erreurs  = data.erreurs?.length ? data.erreurs : ['Document non conforme TEIF v1.8.8'];
            const xmlRejet = buildRejetXml(id, erreurs);
            setErreursState(prev => ({ ...prev, [id]: { erreurs, xml: xmlRejet } }));
            setErreurModal({ id, erreurs, xml: xmlRejet });
        } catch {
            setErreurModal({
                id,
                erreurs: ['❌ Impossible de récupérer les erreurs TTN'],
                xml: null,
            });
        }
    };

    const handleAnalyseIA = async (facture) => {
        setActionsModal(null);
        setIaModal({ id: facture.numeroFacture, loading: true, result: null, _prev: facture });
        try {
            const res = await fetch(`${IA_BASE}/fraud/analyser`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    numeroFacture:   facture.numeroFacture,
                    montantTTC:      facture.montantTTC,
                    totalHT:         facture.totalHT,
                    totalTVA:        facture.totalTVA,
                    tiersId:         facture.tiersId,
                    nbLignes:        facture.nbLignes || 0,
                    dateFacture:     facture.dateFacture,
                    matriculeFiscal: facture.tiersMatricule || '',
                    tiersNom:        facture.tiersNom || '',
                    lignes: (facture.lignes || []).map(l => ({
                        designation:  l.designation,
                        prixUnitaire: l.prixUnitaire,
                        tauxTVA:      l.tauxTVA,
                        quantite:     l.quantite,
                    }))
                })
            });
            const result = await res.json();
            setIaModal(prev => ({ ...prev, loading: false, result }));
        } catch {
            setIaModal(prev => ({
                ...prev,
                loading: false,
                result: { error: 'Service IA inaccessible', score: 0, decision: 'autoriser', anomalies: [] }
            }));
        }
    };

    const handleEnvoyerTTN = async (facture) => {
        const id = facture.numeroFacture;
        setActionsModal(null);
        setEnvoyerState(prev => ({ ...prev, [id]: 'loading' }));

        try {
            const teifRes  = await fetch(`${API_BASE}/teif/valider/${id}`, { headers: authHeaders() });
            const teifData = await teifRes.json();

            if (!teifData.estValide) {
                const erreurs    = teifData.erreurs?.length ? teifData.erreurs : ['Document non conforme TEIF v1.8.8'];
                const xmlRejet   = buildRejetXml(id, erreurs);
                const idTTNRejet = Date.now().toString() + Math.floor(Math.random() * 1e13).toString().padStart(13, '0');

                await fetch(`${API_BASE}/factures/${id}/statut`, {
                    method: 'PUT', headers: authHeaders(),
                    body: JSON.stringify({ statut: 'Rejetée', idTTN: idTTNRejet })
                });

                setFactures(prev => prev.map(f =>
                    f.numeroFacture === id ? { ...f, statut: 'Rejetée', idTTN: idTTNRejet } : f
                ));
                setErreursState(prev => ({ ...prev, [id]: { erreurs, xml: xmlRejet } }));
                setEnvoyerState(prev => ({ ...prev, [id]: 'error' }));
                setErreurModal({ id, erreurs, xml: xmlRejet });
                setTimeout(() => fetchFactures(true), 600);
                return;
            }

            const idTTN = Date.now().toString() + Math.floor(Math.random() * 1e13).toString().padStart(13, '0');

            await fetch(`${API_BASE}/factures/${id}/statut`, {
                method: 'PUT', headers: authHeaders(),
                body: JSON.stringify({ statut: 'AcceptéeTTN', idTTN })
            });

            setFactures(prev => prev.map(f =>
                f.numeroFacture === id ? { ...f, statut: 'AcceptéeTTN', idTTN } : f
            ));
            setErreursState(prev => { const n = { ...prev }; delete n[id]; return n; });
            setEnvoyerState(prev => ({ ...prev, [id]: 'success' }));
            alert(`✅ Facture FAC-${id} acceptée par TTN !\nRéférence TTN : ${idTTN}`);
            setTimeout(() => fetchFactures(true), 600);

        } catch {
            setEnvoyerState(prev => ({ ...prev, [id]: 'error' }));
            setErreursState(prev => ({
                ...prev,
                [id]: { erreurs: ['❌ Erreur connexion serveur TTN'], xml: null }
            }));
        }
    };

    const handleSign = (facture) => { setSignModal({ id: facture.numeroFacture, facture }); setActionsModal(null); };
    const confirmSign = (id) => {
        setSignedFactures(prev => ({ ...prev, [id]: true }));
        setSignModal(null);
        const fresh = factures.find(f => f.numeroFacture === id);
        if (fresh) setActionsModal(fresh);
    };

    const handleDelete = async (facture) => {
        if (!window.confirm(`Supprimer FAC-${facture.numeroFacture} ? Action irréversible.`)) return;
        try {
            const res = await fetch(`${API_BASE}/factures/${facture.numeroFacture}`, { method: 'DELETE', headers: authHeaders() });
            if (!res.ok) { const e = await res.json().catch(() => ({})); alert(e.message || 'Erreur suppression'); return; }
            setFactures(prev => prev.filter(f => f.numeroFacture !== facture.numeroFacture));
            setActionsModal(null);
        } catch (e) { alert('Erreur : ' + e.message); }
    };

    const handleOpenEdit = async (facture) => {
        setActionsModal(null);
        try {
            const res  = await fetch(`${API_BASE}/factures/${facture.numeroFacture}`, { headers: authHeaders() });
            const data = await res.json();
            setEditModal({
                ...data,
                dateFacture: data.dateFacture?.split('T')[0] || new Date().toISOString().split('T')[0],
                lignes: data.lignes?.length > 0
                    ? data.lignes.map(l => ({
                        designation:  l.designation || '',
                        quantite:     l.quantite || 1,
                        prixUnitaire: l.prixUnitaire || 0,
                        tauxTVA:      l.tauxTVA || 19,
                        remiseLigne:  l.remiseLigne || 0,
                        produitId:    l.produitId || 1,
                    }))
                    : [{ designation: '', quantite: 1, prixUnitaire: 0, tauxTVA: 19, remiseLigne: 0, produitId: 1 }]
            });
        } catch { alert('Erreur chargement facture'); }
    };

    const handleSaveEdit = async () => {
        if (!editModal) return;
        const id = editModal.numeroFacture;
        const lignesValides = editModal.lignes.filter(
            l => l.designation?.trim() && parseFloat(l.prixUnitaire) > 0 && parseInt(l.quantite) > 0
        );
        if (!lignesValides.length) { alert('Ajoutez au moins une ligne valide.'); return; }
        try {
            const delRes = await fetch(`${API_BASE}/factures/${id}`, { method: 'DELETE', headers: authHeaders() });
            if (!delRes.ok) { const e = await delRes.json().catch(() => ({})); alert(e.message || 'Erreur'); return; }
            const dateO = new Date(editModal.dateFacture);
            const an    = new Date(); an.setFullYear(an.getFullYear() - 1);
            const dateF = dateO > an ? editModal.dateFacture : new Date().toISOString().split('T')[0];
            const res   = await fetch(`${API_BASE}/factures`, {
                method: 'POST', headers: authHeaders(),
                body: JSON.stringify({
                    tiersId:       editModal.tiersId,
                    dateFacture:   dateF,
                    timbreFiscal:  true,
                    remiseGlobale: 0,
                    lignes: lignesValides.map(l => ({
                        produitId:    l.produitId || (produits[0]?.id || 1),
                        designation:  l.designation.trim(),
                        quantite:     parseInt(l.quantite) || 1,
                        prixUnitaire: parseFloat(l.prixUnitaire) || 0,
                        remiseLigne:  parseFloat(l.remiseLigne) || 0,
                        tauxTVA:      parseFloat(l.tauxTVA) || 19,
                    }))
                })
            });
            if (!res.ok) { const e = await res.json().catch(() => ({})); alert(e.message || 'Erreur'); return; }
            setEditModal(null); fetchFactures(true);
        } catch (e) { alert('Erreur : ' + e.message); }
    };

    const updateLigne = (i, f, v) => setEditModal(prev => ({
        ...prev, lignes: prev.lignes.map((l, idx) => idx === i ? { ...l, [f]: v } : l)
    }));
    const addLigne    = () => setEditModal(prev => ({
        ...prev, lignes: [...prev.lignes, { designation: '', quantite: 1, prixUnitaire: 0, tauxTVA: 19, remiseLigne: 0, produitId: produits[0]?.id || 1 }]
    }));
    const removeLigne = (i) => setEditModal(prev => ({
        ...prev, lignes: prev.lignes.filter((_, idx) => idx !== i)
    }));

    const buildQrData = (inv) => [
        `Facture N° : ${inv.numeroFacture}`,
        `Date : ${new Date(inv.dateFacture).toLocaleDateString('fr-TN')}`,
        `Client : ${inv.tiersNom || ''}`,
        `Matricule : ${inv.tiersMatricule || ''}`,
        `Total HT : ${fmt(inv.totalHT)} DT`,
        `Montant TTC : ${fmt(inv.montantTTC)} DT`,
        `Référence TTN : ${inv.idTTN || ''}`,
        `Statut : ACCEPTÉE`,
    ].join('\n');

    const filteredData  = factures.filter(f => {
        const ms = (f.tiersNom || '').toLowerCase().includes(searchTerm.toLowerCase()) || String(f.numeroFacture).includes(searchTerm);
        const ss = statusFilter === 'Tous les statuts' || statutLabel(f.statut) === statusFilter;
        return ms && ss;
    });
    const displayedData = showAll ? filteredData : filteredData.slice(0, 5);

    const isSigned  = (id) => !!signedFactures[id];
    const isSending = (id) => envoyerState[id] === 'loading';

    const ttnBtnStyle = (id) => ({
        ...ms.actionBtn,
        ...(isSigned(id) ? ms.ttnBtn : ms.ttnDisabled),
    });
    const ttnBtnDesc = (id) => {
        if (!isSigned(id)) return '🔒 Signature requise avant l\'envoi';
        return 'Soumettre à Tunisie TradeNet (TTN répondra par XML)';
    };

    // ═══════════════════════════════════════════════════════════════════════
    return (
        <div className="invoices-page">

            {/* ── Header ────────────────────────────────────────────────── */}
            <header className="page-top-header">
                <div className="header-left">
                    <h1>Mes Factures</h1>
                    <div className="search-bar">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="header-actions">
                    <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option>Tous les statuts</option>
                        <option>Validé</option>
                        <option>Rejetée</option>
                        <option>Brouillon</option>
                    </select>
                    <button className="btn-new-invoice" onClick={() => fetchFactures()}>🔄 Actualiser</button>
                </div>
            </header>

            {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Chargement...</div>}
            {error   && <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444', background: '#fef2f2', borderRadius: 8 }}>{error}</div>}

            {/* ── Tableau ───────────────────────────────────────────────── */}
            {!loading && !error && (
                <div className="table-container">
                    <table className="invoices-table">
                        <thead>
                            <tr>
                                <th>DATE</th>
                                <th>N° FACTURE</th>
                                <th>CLIENT</th>
                                <th>TOTAL TTC (DT)</th>
                                <th>RÉFÉRENCE TTN</th>
                                <th>STATUT</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedData.map(f => (
                                <tr key={f.numeroFacture}>
                                    <td>{new Date(f.dateFacture).toLocaleDateString('fr-TN')}</td>
                                    <td className="font-semibold">FAC-{f.numeroFacture}</td>
                                    <td>{f.tiersNom}</td>
                                    <td className="font-semibold">{fmt(f.montantTTC)}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#16a34a' }}>
                                        {f.statut?.includes('Accept') ? (f.idTTN || '—') : '—'}
                                    </td>
                                    <td>
                                        <span className={`status-pill ${statutCss(f.statut)}`}>
                                            {statutLabel(f.statut)}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <button
                                                onClick={() => setActionsModal(f)}
                                                style={{ padding: '5px 12px', fontSize: 12, fontWeight: 600, borderRadius: 7, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', cursor: 'pointer' }}
                                            >
                                                ⚙️ Actions
                                            </button>
                                            {f.statut === 'Brouillon' && (<>
                                                <button
                                                    title="Modifier"
                                                    onClick={() => handleOpenEdit(f)}
                                                    style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 14 }}
                                                >✏️</button>
                                                <button
                                                    title="Supprimer"
                                                    onClick={() => handleDelete(f)}
                                                    style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 14 }}
                                                >🗑️</button>
                                            </>)}
                                            {statutCss(f.statut) === 'rejetée' && (
                                                <button
                                                    title="Voir réponse TTN (XML rejet)"
                                                    onClick={() => handleVoirReponseRejection(f)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#dc2626' }}
                                                >🔍</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredData.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                        Aucune facture trouvée.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <div className="table-footer">
                        <span className="results-count">{displayedData.length} / {filteredData.length} facture(s) affichée(s)</span>
                        {filteredData.length > 5 && (
                            <button
                                onClick={() => setShowAll(!showAll)}
                                style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '5px 14px', fontSize: 12, fontWeight: 600, color: '#2563eb', cursor: 'pointer', marginLeft: 'auto' }}
                            >
                                {showAll ? '▲ Réduire' : `▼ Voir toutes (${filteredData.length})`}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                Modale Actions
            ══════════════════════════════════════════════════════════════ */}
            {actionsModal && (
                <div style={ms.overlay} onClick={() => setActionsModal(null)}>
                    <div style={ms.modal} onClick={e => e.stopPropagation()}>
                        <div style={ms.header}>
                            <div>
                                <div style={ms.title}>Actions — FAC-{actionsModal.numeroFacture}</div>
                                <div style={ms.subtitle}>{actionsModal.tiersNom} · {fmt(actionsModal.montantTTC)} DT</div>
                            </div>
                            <button style={ms.closeBtn} onClick={() => setActionsModal(null)}>✕</button>
                        </div>

                        {/* Badge statut */}
                        <div style={{ padding: '10px 24px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 13, color: '#64748b' }}>Statut :</span>
                            <span className={`status-pill ${statutCss(actionsModal.statut)}`}>
                                {statutLabel(actionsModal.statut)}
                            </span>
                        </div>

                        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>

                            {/* Voir détail — toujours visible */}
                            <button style={ms.actionBtn} onClick={() => handleView(actionsModal)}>
                                <span style={ms.actionIcon}>👁️</span>
                                <div>
                                    <div style={ms.actionTitle}>Voir détail</div>
                                    <div style={ms.actionDesc}>Afficher la facture complète</div>
                                </div>
                            </button>

                            {/* ── Brouillon uniquement ── */}
                            {actionsModal.statut === 'Brouillon' && (<>

                                {/* 1. Analyse Anti-Fraude */}
                                <button style={ms.actionBtn} onClick={() => handleAnalyseIA(actionsModal)}>
                                    <span style={ms.actionIcon}>🤖</span>
                                    <div>
                                        <div style={ms.actionTitle}>Analyse Anti-Fraude</div>
                                        <div style={ms.actionDesc}>Vérifier le score de risque IA</div>
                                    </div>
                                </button>

                                {/* 2. Signer */}
                                <button
                                    style={{
                                        ...ms.actionBtn,
                                        background:  isSigned(actionsModal.numeroFacture) ? '#f0fdf4' : '#f8fafc',
                                        borderColor: isSigned(actionsModal.numeroFacture) ? '#86efac' : '#e5e7eb',
                                    }}
                                    onClick={() => handleSign(actionsModal)}
                                >
                                    <span style={ms.actionIcon}>{isSigned(actionsModal.numeroFacture) ? '✅' : '✍️'}</span>
                                    <div>
                                        <div style={{ ...ms.actionTitle, color: isSigned(actionsModal.numeroFacture) ? '#16a34a' : '#111827' }}>
                                            {isSigned(actionsModal.numeroFacture) ? 'Signée électroniquement' : 'Signer la facture'}
                                        </div>
                                        <div style={ms.actionDesc}>
                                            {isSigned(actionsModal.numeroFacture) ? 'Cliquer pour re-signer' : 'Requis avant envoi TTN'}
                                        </div>
                                    </div>
                                </button>

                                {/* 3. Aperçu TEIF */}
                                <button
                                    style={{ ...ms.actionBtn, ...(isSigned(actionsModal.numeroFacture) ? {} : ms.ttnDisabled) }}
                                    disabled={!isSigned(actionsModal.numeroFacture)}
                                    onClick={() => isSigned(actionsModal.numeroFacture) && handleApercuTeif(actionsModal.numeroFacture, actionsModal)}
                                >
                                    <span style={ms.actionIcon}>📄</span>
                                    <div>
                                        <div style={{ ...ms.actionTitle, color: isSigned(actionsModal.numeroFacture) ? '#111827' : '#9ca3af' }}>
                                            Aperçu TEIF
                                        </div>
                                        <div style={ms.actionDesc}>
                                            {isSigned(actionsModal.numeroFacture)
                                                ? 'Vérifier la conformité (facultatif)'
                                                : '🔒 Signature requise'}
                                        </div>
                                    </div>
                                </button>

                                {/* 4. Envoyer TTN */}
                                <button
                                    style={ttnBtnStyle(actionsModal.numeroFacture)}
                                    disabled={!isSigned(actionsModal.numeroFacture) || isSending(actionsModal.numeroFacture)}
                                    onClick={() => isSigned(actionsModal.numeroFacture) && handleEnvoyerTTN(actionsModal)}
                                >
                                    <span style={ms.actionIcon}>
                                        {isSending(actionsModal.numeroFacture) ? '⏳' : '🚀'}
                                    </span>
                                    <div>
                                        <div style={{
                                            ...ms.actionTitle,
                                            color: isSigned(actionsModal.numeroFacture) ? '#fff' : '#9ca3af'
                                        }}>
                                            {isSending(actionsModal.numeroFacture) ? 'Envoi en cours...' : 'Envoyer à TTN'}
                                        </div>
                                        <div style={{
                                            ...ms.actionDesc,
                                            color: isSigned(actionsModal.numeroFacture) ? 'rgba(255,255,255,0.75)' : '#d1d5db'
                                        }}>
                                            {ttnBtnDesc(actionsModal.numeroFacture)}
                                        </div>
                                    </div>
                                </button>
                            </>)}

                            {/* ── Validée uniquement ── */}
                            {actionsModal.statut?.includes('Accept') && (
                                <button style={ms.actionBtn} onClick={() => handleTelechargerXml(actionsModal.numeroFacture)}>
                                    <span style={ms.actionIcon}>⬇️</span>
                                    <div>
                                        <div style={ms.actionTitle}>Télécharger XML</div>
                                        <div style={ms.actionDesc}>Format TEIF v1.8.8</div>
                                    </div>
                                </button>
                            )}

                            {/* ── Rejetée uniquement ── */}
                            {statutCss(actionsModal.statut) === 'rejetée' && (
                                <button
                                    style={{ ...ms.actionBtn, borderColor: '#fecaca' }}
                                    onClick={() => handleVoirReponseRejection(actionsModal)}
                                >
                                    <span style={ms.actionIcon}>🔍</span>
                                    <div>
                                        <div style={{ ...ms.actionTitle, color: '#dc2626' }}>Réponse TTN (XML)</div>
                                        <div style={ms.actionDesc}>Voir les erreurs TEIF retournées par TTN</div>
                                    </div>
                                </button>
                            )}
                        </div>

                        <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setActionsModal(null)}
                                style={{ padding: '8px 20px', background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                Modale XML TTN (Réponse rejet — fond sombre)
            ══════════════════════════════════════════════════════════════ */}
            {erreurModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        background: '#1e1e2e', borderRadius: 12, width: '80vw', maxWidth: 900,
                        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.5)', overflow: 'hidden'
                    }}>
                        {/* Header */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '16px 20px', borderBottom: '1px solid #374151',
                            background: '#111827'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 18 }}>📄</span>
                                <span style={{ color: '#f9fafb', fontWeight: 600, fontSize: 15 }}>
                                    Réponse TTN — FAC-{erreurModal.id}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    onClick={() => navigator.clipboard.writeText(erreurModal.xml)}
                                    style={{
                                        background: '#374151', border: 'none', borderRadius: 6,
                                        color: '#d1d5db', padding: '6px 12px', cursor: 'pointer', fontSize: 13
                                    }}
                                >
                                    📋 Copier
                                </button>
                                <button
                                    onClick={() => handleTelechargerXmlRejet(erreurModal.id)}
                                    style={{
                                        background: '#374151', border: 'none', borderRadius: 6,
                                        color: '#d1d5db', padding: '6px 12px', cursor: 'pointer', fontSize: 13
                                    }}
                                >
                                    ⬇️ Télécharger
                                </button>
                                <button
                                    onClick={() => setErreurModal(null)}
                                    style={{
                                        background: '#dc2626', border: 'none', borderRadius: 6,
                                        color: '#fff', padding: '6px 12px', cursor: 'pointer', fontSize: 13,
                                        fontWeight: 600
                                    }}
                                >
                                    ✕ Fermer
                                </button>
                            </div>
                        </div>

                        {/* Corps : XML ou erreurs */}
                        {erreurModal.xml ? (
                            <pre style={{
                                flex: 1, overflow: 'auto', margin: 0,
                                padding: '20px', color: '#a3e635',
                                fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6,
                                whiteSpace: 'pre-wrap', wordBreak: 'break-all'
                            }}>
                                {erreurModal.xml}
                            </pre>
                        ) : (
                            <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
                                {(erreurModal.erreurs || []).map((e, i) => (
                                    <div key={i} style={{
                                        fontSize: 13, padding: '10px 14px', marginBottom: 8,
                                        background: '#1a1a2e', border: '1px solid #374151',
                                        borderRadius: 8, color: '#f87171',
                                        display: 'flex', gap: 10, alignItems: 'flex-start',
                                    }}>
                                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748b', flexShrink: 0 }}>
                                            TEIF-ERR-{String(i + 1).padStart(4, '0')}
                                        </span>
                                        <span>{e}</span>
                                    </div>
                                ))}
                                <div style={{ marginTop: 12, padding: '10px 14px', background: '#1e293b', borderRadius: 8, fontSize: 12, color: '#94a3b8' }}>
                                    ⚠️ Aucun XML disponible — soumettez à nouveau via TTN pour obtenir la réponse complète.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                Modale TEIF (informatif uniquement)
            ══════════════════════════════════════════════════════════════ */}
            {teifModal && (
                <div
                    className="invoice-modal-overlay"
                    onClick={() => { const p = teifModal._prev; setTeifModal(null); if (p) setActionsModal(p); }}
                    style={{ zIndex: 4000 }}
                >
                    <div className="invoice-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
                        <button className="close-modal-btn" onClick={() => { const p = teifModal._prev; setTeifModal(null); if (p) setActionsModal(p); }}>✕</button>
                        <div style={{ padding: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 0.25rem', fontSize: 16, fontWeight: 700 }}>
                                📄 Conformité TEIF — FAC-{teifModal.id}
                            </h3>
                            <p style={{ margin: '0 0 1rem', fontSize: 12, color: '#64748b' }}>
                                Aperçu informatif. L'envoi à TTN est possible même en cas d'erreurs — TTN retournera un XML de réponse.
                            </p>

                            {teifModal.loading ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Vérification...</div>
                            ) : (<>
                                <div style={{
                                    padding: '12px 16px', borderRadius: 10, marginBottom: '1rem',
                                    background: teifModal.validation?.estValide ? '#f0fdf4' : '#fef2f2',
                                    border: `1px solid ${teifModal.validation?.estValide ? '#86efac' : '#fecaca'}`,
                                }}>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: teifModal.validation?.estValide ? '#16a34a' : '#dc2626' }}>
                                        {teifModal.validation?.estValide ? '✅ Conforme TEIF v1.8.8' : '⚠️ Non conforme — envoi possible, TTN rejettera'}
                                    </div>
                                    <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>
                                        {teifModal.validation?.message}
                                    </div>
                                </div>

                                {teifModal.validation?.erreurs?.length > 0 && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <p style={{ fontSize: 12, fontWeight: 600, color: '#dc2626', marginBottom: 8 }}>Erreurs détectées :</p>
                                        {teifModal.validation.erreurs.map((e, i) => (
                                            <div key={i} style={{ fontSize: 12, color: '#dc2626', padding: '4px 8px', background: '#fef2f2', borderRadius: 6, marginBottom: 4 }}>
                                                • {e}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => { const p = teifModal._prev; setTeifModal(null); if (p) setActionsModal(p); }}
                                        style={{ padding: '8px 16px', background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
                                    >
                                        Fermer
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleTelechargerXml(teifModal.id);
                                            const p = teifModal._prev; setTeifModal(null); if (p) setActionsModal(p);
                                        }}
                                        style={{ padding: '8px 16px', background: '#1e429f', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                                    >
                                        ⬇️ Télécharger XML TEIF
                                    </button>
                                </div>
                            </>)}
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                Modale IA
            ══════════════════════════════════════════════════════════════ */}
            {iaModal && (
                <div
                    className="invoice-modal-overlay"
                    onClick={() => { const p = iaModal._prev; setIaModal(null); if (p) setActionsModal(p); }}
                    style={{ zIndex: 4000 }}
                >
                    <div className="invoice-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
                        <button className="close-modal-btn" onClick={() => { const p = iaModal._prev; setIaModal(null); if (p) setActionsModal(p); }}>✕</button>
                        <div style={{ padding: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1rem', fontSize: 16, fontWeight: 700 }}>
                                🤖 Analyse Anti-Fraude — FAC-{iaModal.id}
                            </h3>

                            {iaModal.loading ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Analyse en cours...</div>
                            ) : iaModal.result?.error ? (
                                <div style={{ color: '#dc2626', padding: '1rem', background: '#fef2f2', borderRadius: 8 }}>
                                    ❌ {iaModal.result.error}
                                </div>
                            ) : (<>
                                <div style={{
                                    padding: '16px', borderRadius: 12, marginBottom: '1rem',
                                    background: scoreBg(iaModal.result.score),
                                    border: `1px solid ${scoreColor(iaModal.result.score)}30`,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Score de risque</span>
                                        <span style={{ fontSize: 24, fontWeight: 800, color: scoreColor(iaModal.result.score) }}>
                                            {iaModal.result.score}/100
                                        </span>
                                    </div>
                                    <div style={{ background: '#e2e8f0', borderRadius: 10, height: 8, overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', borderRadius: 10,
                                            width: `${iaModal.result.score}%`,
                                            background: scoreColor(iaModal.result.score),
                                            transition: 'width 0.5s ease',
                                        }} />
                                    </div>
                                    <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: scoreColor(iaModal.result.score) }}>
                                        {iaModal.result.decision === 'autoriser'
                                            ? '✅ Autorisé — aucune anomalie détectée'
                                            : iaModal.result.decision === 'avertir'
                                            ? '⚠️ Risque modéré — vérifiez avant envoi'
                                            : '🚫 Risque élevé — envoi déconseillé'}
                                    </div>
                                    <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8', display: 'flex', gap: 8 }}>
                                        <span style={{ background: '#dcfce7', color: '#15803d', padding: '1px 8px', borderRadius: 8, fontWeight: 600 }}>≤20 Faible</span>
                                        <span style={{ background: '#fef3c7', color: '#92400e', padding: '1px 8px', borderRadius: 8, fontWeight: 600 }}>21-50 Modéré</span>
                                        <span style={{ background: '#fee2e2', color: '#dc2626', padding: '1px 8px', borderRadius: 8, fontWeight: 600 }}>&gt;50 Élevé</span>
                                    </div>
                                </div>

                                {iaModal.result.anomalies?.length > 0 && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <p style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Anomalies détectées :</p>
                                        {iaModal.result.anomalies.map((a, i) => (
                                            <div key={i} style={{ fontSize: 12, padding: '6px 10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, marginBottom: 4 }}>
                                                {a}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {iaModal.result.message && (
                                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: '1rem' }}>
                                        {iaModal.result.message}
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => { const p = iaModal._prev; setIaModal(null); if (p) setActionsModal(p); }}
                                        style={{ padding: '8px 16px', background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
                                    >
                                        Fermer
                                    </button>
                                </div>
                            </>)}
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                Modale Signature
            ══════════════════════════════════════════════════════════════ */}
            {signModal && (
                <div style={ms.overlay} onClick={() => setSignModal(null)}>
                    <div style={{ ...ms.modal, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
                        <div style={ms.header}>
                            <div>
                                <div style={ms.title}>✍️ Signature Électronique</div>
                                <div style={ms.subtitle}>FAC-{signModal.id} · {signModal.facture?.tiersNom}</div>
                            </div>
                            <button style={ms.closeBtn} onClick={() => setSignModal(null)}>✕</button>
                        </div>
                        <div style={{ padding: '20px 24px' }}>
                            <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: 10, padding: '14px 16px', marginBottom: 20, fontSize: 13, color: '#1e3a8a', lineHeight: 1.6 }}>
                                En signant cette facture, je certifie que les informations sont exactes et conformes aux normes TEIF v1.8.8.
                            </div>
                            <div style={{ border: '2px dashed #cbd5e1', borderRadius: 10, padding: '20px', textAlign: 'center', marginBottom: 20 }}>
                                <div style={{ fontSize: 32, marginBottom: 8 }}>🖊️</div>
                                <div style={{ fontSize: 13, color: '#64748b' }}>
                                    Signataire : <strong>{localStorage.getItem('userName') || 'Utilisateur'}</strong>
                                </div>
                                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                                    {new Date().toLocaleString('fr-TN')}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setSignModal(null)}
                                    style={{ padding: '10px 20px', background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={() => confirmSign(signModal.id)}
                                    style={{ padding: '10px 24px', background: '#1e429f', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                                >
                                    ✅ Confirmer la signature
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                Modale Modification
            ══════════════════════════════════════════════════════════════ */}
            {editModal && (
                <div
                    style={{ ...ms.overlay, alignItems: 'flex-start', overflowY: 'auto', padding: 20 }}
                    onClick={() => setEditModal(null)}
                >
                    <div style={{ ...ms.modal, maxWidth: 700, width: '100%', margin: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div style={ms.header}>
                            <div>
                                <div style={ms.title}>✏️ Modifier FAC-{editModal.numeroFacture}</div>
                                <div style={ms.subtitle}>Modifications enregistrées comme nouvelle facture</div>
                            </div>
                            <button style={ms.closeBtn} onClick={() => setEditModal(null)}>✕</button>
                        </div>
                        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div>
                                    <label style={es.label}>Client</label>
                                    <select
                                        style={es.input}
                                        value={editModal.tiersId}
                                        onChange={e => setEditModal(prev => ({ ...prev, tiersId: parseInt(e.target.value) }))}
                                    >
                                        {tiers.map(t => <option key={t.id || t.Id} value={t.id || t.Id}>{t.nom || t.Nom}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={es.label}>Date</label>
                                    <input
                                        type="date"
                                        style={es.input}
                                        value={editModal.dateFacture}
                                        onChange={e => setEditModal(prev => ({ ...prev, dateFacture: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <label style={{ ...es.label, marginBottom: 0 }}>Lignes</label>
                                    <button onClick={addLigne} style={es.addBtn}>+ Ajouter</button>
                                </div>
                                <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc' }}>
                                                {['Produit', 'Qté', 'Prix HT', 'TVA%', 'Remise%', ''].map(h => (
                                                    <th key={h} style={es.th}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {editModal.lignes.map((l, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                    <td style={es.td}>
                                                        <select
                                                            style={es.cellInput}
                                                            value={l.produitId || ''}
                                                            onChange={e => {
                                                                const p = produits.find(p => (p.id || p.Id) === parseInt(e.target.value));
                                                                updateLigne(i, 'produitId', parseInt(e.target.value));
                                                                if (p) updateLigne(i, 'designation', p.nom || p.Nom || '');
                                                            }}
                                                        >
                                                            <option value="">-- Produit --</option>
                                                            {produits.map(p => (
                                                                <option key={p.id || p.Id} value={p.id || p.Id}>{p.nom || p.Nom}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td style={es.td}>
                                                        <input type="number" style={{ ...es.cellInput, width: 55 }} value={l.quantite || 1} onChange={e => updateLigne(i, 'quantite', e.target.value)} min="1" />
                                                    </td>
                                                    <td style={es.td}>
                                                        <input type="number" style={{ ...es.cellInput, width: 80 }} value={l.prixUnitaire || 0} onChange={e => updateLigne(i, 'prixUnitaire', e.target.value)} step="0.001" />
                                                    </td>
                                                    <td style={es.td}>
                                                        <select style={{ ...es.cellInput, width: 70 }} value={l.tauxTVA || 19} onChange={e => updateLigne(i, 'tauxTVA', e.target.value)}>
                                                            <option value={7}>7%</option>
                                                            <option value={13}>13%</option>
                                                            <option value={19}>19%</option>
                                                        </select>
                                                    </td>
                                                    <td style={es.td}>
                                                        <input type="number" style={{ ...es.cellInput, width: 60 }} value={l.remiseLigne || 0} onChange={e => updateLigne(i, 'remiseLigne', e.target.value)} min="0" max="100" />
                                                    </td>
                                                    <td style={es.td}>
                                                        {editModal.lignes.length > 1 && (
                                                            <button onClick={() => removeLigne(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16 }}>✕</button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Totaux calculés */}
                            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', display: 'flex', justifyContent: 'flex-end', gap: 32 }}>
                                {(() => {
                                    const totalHT  = editModal.lignes.reduce((s, l) => s + (parseFloat(l.prixUnitaire) || 0) * (parseInt(l.quantite) || 1) * (1 - (parseFloat(l.remiseLigne) || 0) / 100), 0);
                                    const totalTVA = editModal.lignes.reduce((s, l) => {
                                        const ht = (parseFloat(l.prixUnitaire) || 0) * (parseInt(l.quantite) || 1) * (1 - (parseFloat(l.remiseLigne) || 0) / 100);
                                        return s + ht * ((parseFloat(l.tauxTVA) || 19) / 100);
                                    }, 0);
                                    return (<>
                                        <div style={{ textAlign: 'right' }}><div style={es.totalLabel}>Total HT</div><div style={es.totalVal}>{totalHT.toFixed(3)} DT</div></div>
                                        <div style={{ textAlign: 'right' }}><div style={es.totalLabel}>TVA</div><div style={es.totalVal}>{totalTVA.toFixed(3)} DT</div></div>
                                        <div style={{ textAlign: 'right' }}><div style={es.totalLabel}>TTC</div><div style={{ ...es.totalVal, color: '#1e429f', fontSize: 16 }}>{(totalHT + totalTVA + 0.6).toFixed(3)} DT</div></div>
                                    </>);
                                })()}
                            </div>

                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button onClick={() => setEditModal(null)} style={{ padding: '10px 20px', background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Annuler</button>
                                <button onClick={handleSaveEdit}          style={{ padding: '10px 24px', background: '#1e429f', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>💾 Enregistrer</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                Modale Voir Détail
            ══════════════════════════════════════════════════════════════ */}
            {selectedInvoice && (
                <div className="invoice-modal-overlay" onClick={handleCloseDetail} style={{ zIndex: 4000 }}>
                    <div className="invoice-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-modal-btn" onClick={handleCloseDetail}>✕</button>
                        <div className="invoice-paper">

                            {/* En-tête facture */}
                            <header className="paper-header">
                                <div className="company-branding">
                                    <div className="logo-placeholder">EF</div>
                                    <div><h3>El Fatoora Platform</h3><p>Tunis, Tunisie</p></div>
                                </div>
                                <div className="invoice-meta">
                                    <h2>FACTURE</h2>
                                    <p><strong>N° :</strong> FAC-{selectedInvoice.numeroFacture}</p>
                                    <p><strong>Date :</strong> {new Date(selectedInvoice.dateFacture).toLocaleDateString('fr-TN')}</p>
                                    {selectedInvoice.statut?.includes('Accept') && selectedInvoice.idTTN && (
                                        <p style={{ fontSize: 11, color: '#16a34a', fontFamily: 'monospace' }}>
                                            TTN: {selectedInvoice.idTTN}
                                        </p>
                                    )}
                                </div>
                            </header>

                            {/* Parties */}
                            <div className="bill-to-section">
                                <div className="bill-col">
                                    <span>ÉMETTEUR</span>
                                    <p><strong>El Fatoora Platform</strong></p>
                                    <p>Tunis, Tunisie</p>
                                </div>
                                <div className="bill-col">
                                    <span>DESTINATAIRE</span>
                                    <p><strong>{selectedInvoice.tiersNom}</strong></p>
                                    {selectedInvoice.tiersMatricule && <p>Mat: {selectedInvoice.tiersMatricule}</p>}
                                </div>
                            </div>

                            {/* Lignes */}
                            {selectedInvoice.lignes?.length > 0 && (
                                <table className="paper-table">
                                    <thead>
                                        <tr>
                                            <th>Désignation</th>
                                            <th className="text-right">Qté</th>
                                            <th className="text-right">PU HT</th>
                                            <th className="text-right">TVA</th>
                                            <th className="text-right">Total HT</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedInvoice.lignes.map((l, i) => (
                                            <tr key={i}>
                                                <td>{l.designation || l.produitNom}</td>
                                                <td className="text-right">{l.quantite}</td>
                                                <td className="text-right">{fmt(l.prixUnitaire)} DT</td>
                                                <td className="text-right">{l.tauxTVA}%</td>
                                                <td className="text-right">{fmt(l.montantHT)} DT</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {/* Totaux */}
                            <div className="invoice-summary-box">
                                <div className="summary-row"><span>Total HT</span><span>{fmt(selectedInvoice.totalHT)} DT</span></div>
                                <div className="summary-row"><span>TVA</span><span>{fmt(selectedInvoice.totalTVA)} DT</span></div>
                                {selectedInvoice.montantTimbre > 0 && (
                                    <div className="summary-row"><span>Timbre</span><span>{fmt(selectedInvoice.montantTimbre)} DT</span></div>
                                )}
                                <div className="summary-row total"><span>MONTANT TTC</span><span>{fmt(selectedInvoice.montantTTC)} DT</span></div>
                            </div>

                            {/* Montant en lettres */}
                            {selectedInvoice.montantEnLettres && (
                                <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', margin: '1rem 0', fontSize: 12, color: '#475569', fontStyle: 'italic' }}>
                                    {selectedInvoice.montantEnLettres}
                                </div>
                            )}

                            {/* ── Acceptée : QR code + référence TTN ── */}
                            {selectedInvoice.statut?.includes('Accept') && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '1.5rem', padding: '1rem', background: '#f0fdf4', borderRadius: 10, border: '1px solid #86efac' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <QRCodeSVG
                                            value={buildQrData(selectedInvoice)}
                                            size={100} level="M" includeMargin
                                            fgColor="#1e429f"
                                        />
                                        <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>QR Code TTN</div>
                                    </div>
                                    <div style={{ flex: 1, marginLeft: '1rem' }}>
                                        <div style={{ border: '2px solid #1e429f', borderRadius: 8, padding: '10px 14px' }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: '#1e429f', marginBottom: 4 }}>
                                                ✅ ACCEPTÉE TTN
                                            </div>
                                            <div style={{ fontSize: 10, color: '#475569', fontStyle: 'italic', marginBottom: 6 }}>
                                                Copie de la facture électronique enregistrée chez TTN sous la référence :
                                            </div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: '#1e429f', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                                {selectedInvoice.idTTN || '—'}
                                            </div>
                                            <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 6, fontFamily: 'monospace' }}>
                                                Conforme TEIF v1.8.8 — TTN Tunisie
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── Rejetée : erreurs TEIF retournées par TTN ── */}
                            {(selectedInvoice.statut?.includes('Rejet') || selectedInvoice.statut?.includes('ejet')) && (
                                <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca' }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 10 }}>
                                        ❌ REJETÉE PAR TTN
                                    </div>
                                    {(() => {
                                        const d = erreursState[selectedInvoice.numeroFacture];
                                        const erreurs = d?.erreurs || ['Document non conforme TEIF v1.8.8'];
                                        return (<>
                                            <p style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>Erreurs TEIF retournées par TTN :</p>
                                            {erreurs.map((e, i) => (
                                                <div key={i} style={{ fontSize: 12, padding: '6px 10px', background: '#fff', border: '1px solid #fecaca', borderRadius: 6, marginBottom: 4, color: '#dc2626', display: 'flex', gap: 8 }}>
                                                    <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>
                                                        TEIF-ERR-{String(i + 1).padStart(4, '0')}
                                                    </span>
                                                    <span>{e}</span>
                                                </div>
                                            ))}
                                            {d?.xml && (
                                                <button
                                                    onClick={() => {
                                                        setErreurModal({
                                                            id:      selectedInvoice.numeroFacture,
                                                            erreurs: d?.erreurs || [],
                                                            xml:     d?.xml,
                                                        });
                                                        setSelectedInvoice(null);
                                                    }}
                                                    style={{ marginTop: 10, padding: '6px 14px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                                                >
                                                    🔍 Voir XML rejet TTN
                                                </button>
                                            )}
                                        </>);
                                    })()}
                                </div>
                            )}

                            {/* Footer modale détail */}
                            <div className="modal-actions-footer">
                                <button
                                    className="btn-secondary"
                                    onClick={() => { const inv = selectedInvoice; setSelectedInvoice(null); handleApercuTeif(inv.numeroFacture, inv._prevFacture); }}
                                >
                                    📄 Aperçu TEIF
                                </button>
                                <button className="btn-secondary" onClick={() => handleTelechargerXml(selectedInvoice.numeroFacture)}>
                                    ⬇️ XML TEIF
                                </button>
                                <button className="btn-primary" onClick={() => window.print()}>
                                    🖨️ Imprimer
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}