import React, { useState, useEffect, useCallback, useRef } from 'react';
import './TaxDeclaration.css';

const API_BASE    = 'http://localhost:5170/api';
const getToken    = () => localStorage.getItem('token');
const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`
});

const fmt    = (n) => parseFloat(n || 0).toFixed(3);
const fmtNum = (n) => parseFloat(n || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3 });

const MOIS_NOMS = [
    'Janvier','Février','Mars','Avril','Mai','Juin',
    'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
];

export default function TaxDeclaration() {
    const [mode,       setMode]       = useState('mensuel'); // 'mensuel' | 'annuel'
    const [decl,       setDecl]       = useState(null);
    const [declAnnuel, setDeclAnnuel] = useState(null);
    const [loading,    setLoading]    = useState(true);
    const [error,      setError]      = useState(null);
    const [mois,       setMois]       = useState(new Date().getMonth() + 1);
    const [annee,      setAnnee]      = useState(new Date().getFullYear());
    const [anneeAnnuel,setAnneeAnnuel]= useState(new Date().getFullYear());
    const [pdfLoading, setPdfLoading] = useState(false);
    const abortRef = useRef(null);

    // ── Fetch mensuel ─────────────────────────────────────────────────────
    const fetchMensuel = useCallback(async (m, a) => {
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();
        setLoading(true); setError(null);
        try {
            const res = await fetch(
                `${API_BASE}/statistics/declaration?mois=${m}&annee=${a}`,
                { headers: authHeaders(), signal: abortRef.current.signal }
            );
            if (!res.ok) throw new Error('Erreur chargement déclaration');
            setDecl(await res.json());
        } catch (err) {
            if (err.name !== 'AbortError') setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Fetch annuel — appelle statistics avec toute l'année ─────────────
    const fetchAnnuel = useCallback(async (a) => {
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();
        setLoading(true); setError(null);
        try {
            const res = await fetch(
                `${API_BASE}/statistics?dateDebut=${a}-01-01&dateFin=${a}-12-31`,
                { headers: authHeaders(), signal: abortRef.current.signal }
            );
            if (!res.ok) throw new Error('Erreur chargement déclaration annuelle');
            const data = await res.json();

            // Transformer le format statistics → format déclaration
            const tvaParTaux = data.tvaParTaux || [];
            const caHT       = parseFloat(data.caGlobal || 0);
            const tvaTotal   = parseFloat(data.tvaCollectee || 0);
            const timbre     = parseFloat(data.timbreCumule || 0);

            setDeclAnnuel({
                caHT,
                tvaCollectee: tvaTotal,
                timbre,
                netAPayer: tvaTotal + timbre,
                nbFactures: data.nbValidees || 0,
                tvaParTaux,
                evolutionMensuelle: data.evolutionMensuelle || [],
            });
        } catch (err) {
            if (err.name !== 'AbortError') setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (mode === 'mensuel') fetchMensuel(mois, annee);
        else fetchAnnuel(anneeAnnuel);
    }, [mode, mois, annee, anneeAnnuel, fetchMensuel, fetchAnnuel]);

    // Données affichées selon le mode
    const data = mode === 'mensuel' ? decl : declAnnuel;

    // ── Génération PDF ────────────────────────────────────────────────────
    const handleGeneratePDF = async () => {
        if (!data) return;
        setPdfLoading(true);
        try {
            if (!window.jspdf) {
                await new Promise((resolve, reject) => {
                    const s = document.createElement('script');
                    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                    s.onload = resolve; s.onerror = reject;
                    document.head.appendChild(s);
                });
            }
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageW  = doc.internal.pageSize.getWidth();
            const margin = 20;
            const periodeLabel = mode === 'mensuel'
                ? `${MOIS_NOMS[mois - 1]} ${annee}`
                : `Année ${anneeAnnuel}`;
            const typeLabel = mode === 'mensuel' ? 'Declaration Fiscale Mensuelle' : 'Declaration Fiscale Annuelle';

            // En-tête
            doc.setFillColor(26, 86, 219); doc.rect(0, 0, pageW, 40, 'F');
            doc.setTextColor(255,255,255);
            doc.setFontSize(18); doc.setFont('helvetica','bold'); doc.text('El Fatoora', margin, 16);
            doc.setFontSize(10); doc.setFont('helvetica','normal'); doc.text('Plateforme de Facturation Electronique Conforme TEIF', margin, 24);
            doc.setFontSize(13); doc.setFont('helvetica','bold'); doc.text(`${typeLabel} — ${periodeLabel}`, margin, 34);

            doc.setTextColor(100,116,139); doc.setFontSize(9); doc.setFont('helvetica','normal');
            doc.text(`Genere le : ${new Date().toLocaleDateString('fr-TN')}`, margin, 48);

            // KPIs
            let y = 58;
            doc.setFillColor(248,250,252); doc.setDrawColor(226,232,240);
            doc.rect(margin, y, pageW - 2*margin, 32, 'FD');
            const kpis = [
                { label: 'CA HT',         val: `${fmtNum(data.caHT)} DT` },
                { label: 'TVA Collectee', val: `${fmtNum(data.tvaCollectee)} DT` },
                { label: 'Timbre',        val: `${fmtNum(data.timbre)} DT` },
                { label: 'Net a Payer',   val: `${fmtNum(data.netAPayer)} DT` },
            ];
            const kpiW = (pageW - 2*margin) / 4;
            kpis.forEach((k, i) => {
                const x = margin + i*kpiW + kpiW/2;
                doc.setTextColor(100,116,139); doc.setFontSize(7); doc.setFont('helvetica','bold');
                doc.text(k.label.toUpperCase(), x, y+10, { align:'center' });
                doc.setTextColor(30,41,59); doc.setFontSize(11);
                doc.text(k.val, x, y+22, { align:'center' });
            });
            y += 42;

            // Évolution mensuelle (mode annuel seulement)
            if (mode === 'annuel' && data.evolutionMensuelle?.length > 0) {
                doc.setTextColor(30,41,59); doc.setFontSize(12); doc.setFont('helvetica','bold');
                doc.text('Evolution Mensuelle du CA', margin, y); y += 8;

                doc.setFillColor(248,250,252); doc.rect(margin, y, pageW-2*margin, 8, 'F');
                doc.setTextColor(100,116,139); doc.setFontSize(8); doc.setFont('helvetica','bold');
                doc.text('MOIS', margin+2, y+5.5);
                doc.text('NB FACTURES', margin+50, y+5.5);
                doc.text('CA HT (DT)', margin+100, y+5.5);
                y += 8;

                doc.setFont('helvetica','normal'); doc.setTextColor(30,41,59); doc.setFontSize(9);
                data.evolutionMensuelle.forEach(e => {
                    doc.setDrawColor(241,245,249); doc.line(margin, y, pageW-margin, y);
                    doc.text(MOIS_NOMS[e.mois-1], margin+2, y+5);
                    doc.text(`${e.nbFact}`, margin+50, y+5);
                    doc.text(`${fmtNum(e.caHT)} DT`, margin+100, y+5);
                    y += 9;
                });
                y += 6;
            }

            // Tableau TVA
            doc.setTextColor(30,41,59); doc.setFontSize(12); doc.setFont('helvetica','bold');
            doc.text('Detail de la Declaration', margin, y); y += 8;

            const cols = [80, 40, 20, 40];
            doc.setFillColor(248,250,252); doc.rect(margin, y, pageW-2*margin, 8, 'F');
            doc.setTextColor(100,116,139); doc.setFontSize(8); doc.setFont('helvetica','bold');
            let xCur = margin+2;
            ['DESIGNATION','BASE HT','TAUX','MONTANT TVA'].forEach((h,i) => { doc.text(h, xCur, y+5.5); xCur += cols[i]; });
            y += 8;

            doc.setFont('helvetica','normal'); doc.setTextColor(30,41,59); doc.setFontSize(9);
            (data.tvaParTaux || []).forEach(t => {
                doc.setDrawColor(241,245,249); doc.line(margin, y, pageW-margin, y);
                xCur = margin+2;
                doc.text(`CA taxable a ${t.taux}%`, xCur, y+5); xCur += cols[0];
                doc.text(`${fmtNum(t.baseHT)} DT`, xCur, y+5); xCur += cols[1];
                doc.setTextColor(37,99,235); doc.text(`${t.taux}%`, xCur, y+5); xCur += cols[2];
                doc.setTextColor(30,41,59); doc.text(`${fmtNum(t.montantTVA)} DT`, xCur, y+5);
                y += 10;
            });

            doc.setDrawColor(241,245,249); doc.line(margin, y, pageW-margin, y);
            xCur = margin+2;
            doc.text('Droit de Timbre', xCur, y+5); xCur += cols[0];
            doc.text(`${data.nbFactures} Factures`, xCur, y+5); xCur += cols[1];
            doc.setTextColor(148,163,184); doc.text('0.600 DT/Fact.', xCur, y+5); xCur += cols[2];
            doc.setTextColor(30,41,59); doc.text(`${fmtNum(data.timbre)} DT`, xCur, y+5);
            y += 10;

            doc.setFillColor(248,250,252); doc.rect(margin, y, pageW-2*margin, 10, 'F');
            doc.setFont('helvetica','bold'); doc.setTextColor(30,41,59);
            doc.text('Total TVA Collectee', margin+2, y+6);
            doc.setTextColor(26,86,219);
            doc.text(`${fmtNum(data.tvaCollectee)} DT`, margin+cols[0]+cols[1]+cols[2]+2, y+6);
            y += 16;

            doc.setFillColor(26,86,219); doc.rect(margin, y, pageW-2*margin, 12, 'F');
            doc.setTextColor(255,255,255); doc.setFontSize(10);
            doc.text('Total Net de la Declaration (TVA + Timbre)', margin+2, y+8);
            doc.setFontSize(12); doc.text(`${fmtNum(data.netAPayer)} DT`, pageW-margin-2, y+8, { align:'right' });
            y += 20;

            doc.setFillColor(239,246,255); doc.setDrawColor(219,234,254);
            doc.rect(margin, y, pageW-2*margin, 20, 'FD');
            doc.setTextColor(30,58,138); doc.setFontSize(8); doc.setFont('helvetica','bold');
            doc.text('Rappel de conformite', margin+4, y+7);
            doc.setFont('helvetica','normal');
            doc.text(`Declaration generee automatiquement pour ${periodeLabel}.`, margin+4, y+14);

            doc.setTextColor(148,163,184); doc.setFontSize(8);
            doc.text(`El Fatoora — Securise par Tunisie TradeNet | ${new Date().toLocaleString('fr-TN')}`,
                pageW/2, doc.internal.pageSize.getHeight()-10, { align:'center' });

            const fileName = mode === 'mensuel'
                ? `declaration_fiscale_${MOIS_NOMS[mois-1]}_${annee}.pdf`
                : `declaration_fiscale_annuelle_${anneeAnnuel}.pdf`;
            doc.save(fileName);
        } catch (err) {
            console.error('Erreur PDF:', err);
            alert('Erreur lors de la génération du PDF.');
        } finally {
            setPdfLoading(false);
        }
    };

    // Années disponibles (5 dernières)
    const anneesDisponibles = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    const derniersMois = [];
    for (let i = 0; i < 12; i++) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        derniersMois.push({ mois: d.getMonth()+1, annee: d.getFullYear() });
    }

    if (loading) return <div style={{ textAlign:'center', padding:'4rem', color:'#64748b' }}>Chargement...</div>;

    if (error) return (
        <div style={{ textAlign:'center', padding:'2rem', color:'#ef4444', background:'#fef2f2', borderRadius:8, margin:'2rem' }}>
            {error} — <button onClick={() => mode === 'mensuel' ? fetchMensuel(mois, annee) : fetchAnnuel(anneeAnnuel)}
                style={{ color:'#2563eb', background:'none', border:'none', cursor:'pointer' }}>Réessayer</button>
        </div>
    );

    const periodeLabel = mode === 'mensuel' ? `${MOIS_NOMS[mois-1]} ${annee}` : `Année ${anneeAnnuel}`;

    return (
        <div className="tax-declaration">

            {/* ── Header ───────────────────────────────────────────────── */}
            <header className="tax-header">
                <h1>Déclaration Fiscale</h1>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>

                    {/* Toggle Mensuel / Annuel */}
                    <div style={toggle.wrap}>
                        <button
                            style={{ ...toggle.btn, ...(mode==='mensuel' ? toggle.active : {}) }}
                            onClick={() => setMode('mensuel')}>
                            Mensuelle
                        </button>
                        <button
                            style={{ ...toggle.btn, ...(mode==='annuel' ? toggle.active : {}) }}
                            onClick={() => setMode('annuel')}>
                            Annuelle
                        </button>
                    </div>

                    {/* Sélecteur période */}
                    {mode === 'mensuel' ? (
                        <div className="month-selector">
                            <span className="calendar-icon">📅</span>
                            <select value={`${mois}-${annee}`} onChange={e => {
                                const [m, a] = e.target.value.split('-');
                                setMois(parseInt(m)); setAnnee(parseInt(a));
                            }}>
                                {derniersMois.map((d, i) => (
                                    <option key={i} value={`${d.mois}-${d.annee}`}>
                                        {MOIS_NOMS[d.mois-1]} {d.annee}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="month-selector">
                            <span className="calendar-icon">📅</span>
                            <select value={anneeAnnuel} onChange={e => setAnneeAnnuel(parseInt(e.target.value))}>
                                {anneesDisponibles.map(a => (
                                    <option key={a} value={a}>Année {a}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </header>

            {/* ── KPIs ─────────────────────────────────────────────────── */}
            <div className="tax-summary-cards">
                <div className="tax-card">
                    <span className="card-label">Chiffre d'Affaires HT</span>
                    <div className="card-value">{fmt(data?.caHT)} <span className="currency">DT</span></div>
                    <span className="card-subtitle">Basé sur {data?.nbFactures ?? 0} facture(s) validée(s)</span>
                </div>
                <div className="tax-card">
                    <span className="card-label">TVA Collectée (Ventes)</span>
                    <div className="card-value">{fmt(data?.tvaCollectee)} <span className="currency">DT</span></div>
                    <span className="card-subtitle">Sur {data?.nbFactures ?? 0} factures</span>
                </div>
                <div className="tax-card border-orange">
                    <span className="card-label">Droit de Timbre</span>
                    <div className="card-value orange">{fmt(data?.timbre)} <span className="currency">DT</span></div>
                    <span className="card-subtitle">{data?.nbFactures ?? 0} × 0.600 DT</span>
                </div>
                <div className="tax-card border-blue">
                    <span className="card-label">Net à Payer</span>
                    <div className="card-value blue">{fmt(data?.netAPayer)} <span className="currency">DT</span></div>
                    <span className="card-link">TVA + Timbre</span>
                </div>
            </div>

            {/* ── Évolution mensuelle (mode annuel) ────────────────────── */}
            {mode === 'annuel' && data?.evolutionMensuelle?.length > 0 && (
                <div className="tax-detail-container">
                    <div className="detail-header">
                        <div className="header-text">
                            <h3>Évolution mensuelle — {anneeAnnuel}</h3>
                            <p>CA HT validé par mois</p>
                        </div>
                    </div>
                    <table className="tax-table">
                        <thead>
                            <tr><th>Mois</th><th>Nb Factures</th><th>CA HT</th><th>TVA</th></tr>
                        </thead>
                        <tbody>
                            {data.evolutionMensuelle.map((e, i) => (
                                <tr key={i}>
                                    <td>{MOIS_NOMS[e.mois-1]}</td>
                                    <td>{e.nbFact}</td>
                                    <td className="font-bold">{fmt(e.caHT)} DT</td>
                                    <td>{fmt(e.caHT * 0.19)} DT</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Tableau détail TVA ────────────────────────────────────── */}
            <div className="tax-detail-container">
                <div className="detail-header">
                    <div className="header-text">
                        <h3>Détail de la Déclaration</h3>
                        <p>Répartition de la TVA par taux — {periodeLabel}</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-primary" onClick={handleGeneratePDF} disabled={pdfLoading}>
                            <span className="icon">📄</span>
                            {pdfLoading ? 'Génération...' : 'Télécharger PDF'}
                        </button>
                    </div>
                </div>

                <table className="tax-table">
                    <thead>
                        <tr><th>Désignation</th><th>Assiette (Base HT)</th><th>Taux</th><th>Montant Taxe</th></tr>
                    </thead>
                    <tbody>
                        {data?.tvaParTaux?.map((t, i) => (
                            <tr key={i}>
                                <td>Chiffre d'Affaires taxable à {t.taux}%</td>
                                <td>{fmt(t.baseHT)} DT</td>
                                <td><span className={`tax-badge ${t.taux === 19 ? 'purple' : 'blue'}`}>{t.taux}%</span></td>
                                <td className="font-bold">{fmt(t.montantTVA)} DT</td>
                            </tr>
                        ))}
                        {(!data?.tvaParTaux || data.tvaParTaux.length === 0) && (
                            <tr><td colSpan="4" style={{ textAlign:'center', color:'#94a3b8', padding:'1.5rem' }}>Aucune facture validée.</td></tr>
                        )}
                        <tr className="row-summary">
                            <td className="font-bold">Total TVA Collectée</td>
                            <td className="font-bold">{fmt(data?.caHT)} DT</td>
                            <td></td>
                            <td className="font-bold blue-text">{fmt(data?.tvaCollectee)} DT</td>
                        </tr>
                        <tr>
                            <td>Droit de Timbre (Factures Ventes)</td>
                            <td>{data?.nbFactures ?? 0} Factures</td>
                            <td className="italic-text">0.600 DT / Facture</td>
                            <td className="font-bold">{fmt(data?.timbre)} DT</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan="3" className="font-bold">Total Net de la Déclaration (TVA + Timbre)</td>
                            <td className="font-bold blue-text total-value">{fmt(data?.netAPayer)} DT</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* ── Footer ───────────────────────────────────────────────── */}
            <div className="tax-footer-grid">
                <div className="conformity-info">
                    <div className="info-icon">ℹ️</div>
                    <div className="info-content">
                        <h4>Rappel de conformité</h4>
                        <p>Cette déclaration est générée automatiquement à partir de vos factures validées pour {periodeLabel}.</p>
                    </div>
                </div>
                <div className="status-card">
                    <div className="status-info">
                        <h4>Statut de la déclaration</h4>
                        <p>Dernière mise à jour : {new Date().toLocaleString('fr-TN')}</p>
                    </div>
                    <span className="status-badge-orange">{data?.nbFactures > 0 ? 'Prête' : 'Aucune donnée'}</span>
                </div>
            </div>
        </div>
    );
}

// ── Styles toggle ─────────────────────────────────────────────────────────
const toggle = {
    wrap:   { display:'flex', background:'#f1f5f9', borderRadius:8, padding:3, border:'1px solid #e2e8f0' },
    btn:    { padding:'6px 16px', borderRadius:6, border:'none', cursor:'pointer', fontSize:13, fontWeight:500, color:'#64748b', background:'transparent', transition:'all 0.15s', fontFamily:"'Inter',sans-serif" },
    active: { background:'#fff', color:'#1a56db', boxShadow:'0 1px 4px rgba(0,0,0,0.08)', fontWeight:600 },
};