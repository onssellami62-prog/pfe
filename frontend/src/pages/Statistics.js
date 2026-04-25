import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './Statistics.css';

const API = 'http://localhost:5170/api';

const Icons = {
    Download: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    ),
    Currency: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    ),
    Document: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    ),
    Building: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
            <path d="M9 22v-4h6v4" />
            <path d="M8 6h.01" />
            <path d="M16 6h.01" />
            <path d="M8 10h.01" />
            <path d="M16 10h.01" />
            <path d="M8 14h.01" />
            <path d="M16 14h.01" />
        </svg>
    ),
    Ticket: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="6" width="18" height="12" rx="2" />
            <line x1="15" y1="6" x2="15" y2="18" />
        </svg>
    ),
    ChartLine: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
        </svg>
    ),
    ChartBar: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
    ),
    Star: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    )
};

export default function Statistics() {
    const pageRef = useRef(null);
    const [exporting, setExporting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeFilter, setActiveFilter] = useState('30j');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [summary, setSummary] = useState({
        totalCA: 0,
        totalVolume: 0,
        totalTva: 0,
        totalStamp: 0,
        caTrend: '0%',
        volTrend: '0%',
        tvaTrend: 'Stable',
        stampTrend: '0%'
    });
    const [evolution, setEvolution] = useState([]);
    const [tvaDistribution, setTvaDistribution] = useState([]);
    const [topClients, setTopClients] = useState([]);

    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const companyId = user.companyId;

    const getDateRange = (filter) => {
        const today = new Date();
        if (filter === '30j') {
            const from = new Date(today);
            from.setDate(from.getDate() - 30);
            return { from: from.toISOString().split('T')[0], to: today.toISOString().split('T')[0] };
        }
        if (filter === 'year') {
            return { from: `${today.getFullYear()}-01-01`, to: today.toISOString().split('T')[0] };
        }
        if (filter === 'custom' && customFrom && customTo) {
            return { from: customFrom, to: customTo };
        }
        return {};
    };

    useEffect(() => {
        if (!companyId) return;
        if (activeFilter === 'custom' && (!customFrom || !customTo)) return;

        const fetchStats = async () => {
            setLoading(true);
            try {
                const range = getDateRange(activeFilter);
                const dateParams = range.from ? `&from=${range.from}&to=${range.to}` : '';

                const [summaryRes, evolutionRes, tvaRes, clientsRes] = await Promise.all([
                    fetch(`${API}/Statistics/summary?companyId=${companyId}${dateParams}`),
                    fetch(`${API}/Statistics/monthly-evolution?companyId=${companyId}`),
                    fetch(`${API}/Statistics/tva-distribution?companyId=${companyId}${dateParams}`),
                    fetch(`${API}/Statistics/top-clients?companyId=${companyId}${dateParams}`)
                ]);

                if (summaryRes.ok) setSummary(await summaryRes.json());
                if (evolutionRes.ok) setEvolution(await evolutionRes.json());
                if (tvaRes.ok) setTvaDistribution(await tvaRes.json());
                if (clientsRes.ok) setTopClients(await clientsRes.json());

            } catch (err) {
                console.error("Erreur stats:", err);
                setError("Impossible de charger les statistiques.");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [companyId, activeFilter, customFrom, customTo]);

    if (loading) return <div className="stats-page"><div className="loading-stats">Chargement des statistiques...</div></div>;
    if (error) return <div className="stats-page"><div className="error-stats">{error}</div></div>;

    // Calculs pour les graphiques
    const maxVal = Math.max(...evolution.map(d => Math.max(d.currentYear, d.pastYear)), 0);
    const maxCA = maxVal > 0 ? maxVal * 1.2 : 100;
    const getY = (val) => 180 - (val / maxCA * 160);
    
    // Points pour le graphique en ligne (SVG Path)
    const pointsCurrent = evolution.map((d, i) => `${(i * 65) + 10},${getY(d.currentYear)}`).join(' ');
    const pointsPast = evolution.map((d, i) => `${(i * 65) + 10},${getY(d.pastYear)}`).join(' ');

    // Calcul pour le donut chart (Répartition TVA)
    let cumulativePercent = 0;
    const donutPaths = tvaDistribution.map((t, idx) => {
        const startPercent = cumulativePercent;
        cumulativePercent += t.percentage;
        const color = idx === 0 ? '#1a56db' : (idx === 1 ? '#1a6b50' : '#8b5cf6');
        return {
            dashArray: `${t.percentage}, 100`,
            dashOffset: `-${startPercent}`,
            color: color
        };
    });

    const MONTHS = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛT', 'SEPT', 'OCT', 'NOV', 'DÉC'];

    const handleExportPDF = async () => {
        if (!pageRef.current || exporting) return;
        setExporting(true);
        try {
            const canvas = await html2canvas(pageRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#f0f2f5'
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('l', 'mm', 'a4');
            const pdfW = pdf.internal.pageSize.getWidth();
            const pdfH = (canvas.height * pdfW) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
            pdf.save(`Statistiques_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error('Export PDF error:', err);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="stats-page" ref={pageRef}>
            <header className="stats-header">
                <div className="header-info">
                    <h1>Tableau de Bord Statistique</h1>
                    <p>Analysez les performances de votre facturation électronique</p>
                </div>
                <div className="header-controls">
                    <div className="filter-group">
                        <button className={`filter-btn ${activeFilter === '30j' ? 'active' : ''}`} onClick={() => setActiveFilter('30j')}>30 derniers jours</button>
                        <button className={`filter-btn ${activeFilter === 'year' ? 'active' : ''}`} onClick={() => setActiveFilter('year')}>Année en cours</button>
                        <button className={`filter-btn ${activeFilter === 'custom' ? 'active' : ''}`} onClick={() => setActiveFilter('custom')}>Personnalisé</button>
                    </div>
                    {activeFilter === 'custom' && (
                        <div className="custom-date-range">
                            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
                            <span className="date-separator">→</span>
                            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} />
                        </div>
                    )}
                    <button className="btn-export" onClick={handleExportPDF} disabled={exporting}>
                        <span className="icon"><Icons.Download /></span> {exporting ? 'Export...' : 'Exporter PDF'}
                    </button>
                </div>
            </header>

            <div className="stats-kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-top">
                        <div className="kpi-icon blue"><Icons.Currency /></div>
                        <span className="trend positive"><Icons.ChartLine /> {summary.caTrend}</span>
                    </div>
                    <div className="kpi-content">
                        <span className="label">Chiffre d'Affaires Global</span>
                        <div className="value">{summary.totalCA.toLocaleString('fr-TN')} <small>DT</small></div>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-top">
                        <div className="kpi-icon green"><Icons.Document /></div>
                        <span className="trend positive"><Icons.ChartLine /> {summary.volTrend}</span>
                    </div>
                    <div className="kpi-content">
                        <span className="label">Volume de Factures</span>
                        <div className="value">{summary.totalVolume.toLocaleString('fr-TN')}</div>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-top">
                        <div className="kpi-icon indigo"><Icons.Building /></div>
                        <span className="trend neutral"> {summary.tvaTrend}</span>
                    </div>
                    <div className="kpi-content">
                        <span className="label">TVA Collectée Totale</span>
                        <div className="value">{summary.totalTva.toLocaleString('fr-TN')} <small>DT</small></div>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-top">
                        <div className="kpi-icon orange"><Icons.Ticket /></div>
                        <span className="trend negative"><Icons.ChartLine /> {summary.stampTrend}</span>
                    </div>
                    <div className="kpi-content">
                        <span className="label">Droit de Timbre Cumulé</span>
                        <div className="value">{summary.totalStamp.toLocaleString('fr-TN')} <small>DT</small></div>
                    </div>
                </div>
            </div>

            <div className="stats-main-grid">
                <div className="stats-chart-card evolution-card">
                    <div className="card-header">
                        <h3><Icons.ChartLine /> Évolution mensuelle du CA</h3>
                        <div className="chart-legend">
                            <span className="legend-item"><span className="dot current"></span> {new Date().getFullYear()}</span>
                            <span className="legend-item"><span className="dot past"></span> {new Date().getFullYear() - 1}</span>
                        </div>
                    </div>
                    <div className="chart-placeholder">
                        <svg viewBox="0 0 800 200" className="line-chart">
                            <polyline points={pointsPast} fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5,5" />
                            <polyline points={pointsCurrent} fill="none" stroke="#0f4c3a" strokeWidth="2.5" />
                            
                            <path d={`M10,${getY(evolution[0]?.currentYear || 0)} ${pointsCurrent} L${((evolution.length-1) * 65) + 10},200 L10,200 Z`} fill="url(#grad1)" opacity="0.1" />
                            
                            <defs>
                                <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#0f4c3a" />
                                    <stop offset="100%" stopColor="transparent" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="x-axis">
                            {MONTHS.map(m => <span key={m}>{m}</span>)}
                        </div>
                    </div>
                </div>

                <div className="stats-chart-card distribution-card">
                    <div className="card-header">
                        <h3><Icons.ChartBar /> Répartition par Taux TVA</h3>
                    </div>
                    <div className="distribution-content">
                        <div className="donut-chart">
                            <svg viewBox="0 0 36 36" className="circular-chart">
                                <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                {donutPaths.map((p, i) => (
                                    <path 
                                        key={i}
                                        className="circle" 
                                        strokeDasharray={p.dashArray} 
                                        strokeDashoffset={p.dashOffset}
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                        stroke={p.color} 
                                    />
                                ))}
                                <text x="18" y="20.35" className="percentage">{Math.round(tvaDistribution.reduce((a,b)=>a+b.percentage, 0))}%</text>
                                <text x="18" y="24" className="chart-label">TOTAL TVA</text>
                            </svg>
                        </div>
                        <div className="legend-list">
                            {tvaDistribution.length > 0 ? tvaDistribution.map((t, idx) => (
                                <div key={idx} className="legend-item">
                                    <span className={`dot ${idx === 0 ? 'blue' : (idx === 1 ? 'green' : 'purple')}`}></span> 
                                    {t.label} <strong>{t.percentage}%</strong>
                                </div>
                            )) : <div className="legend-item">Aucune donnée TVA</div>}
                        </div>
                    </div>
                </div>

                <div className="stats-chart-card sales-card">
                    <div className="card-header">
                        <h3><Icons.ChartBar /> Ventes par mois</h3>
                        <span className="date-range">Jan {new Date().getFullYear()} - Juin {new Date().getFullYear()}</span>
                    </div>
                    <div className="bar-chart">
                        {evolution.slice(0, 6).map((d, i) => (
                            <div key={i} className="bar-container">
                                <div className={`bar ${d.month === (new Date().getMonth() + 1) ? 'active' : ''}`} style={{ height: `${(d.currentYear / maxCA * 100)}%` }}>
                                    <div className="bar-top"></div>
                                </div>
                                <span>{MONTHS[d.month - 1]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="stats-chart-card clients-card">
                    <div className="card-header">
                        <h3><Icons.Star /> Top 5 Clients par Revenu</h3>
                    </div>
                    <table className="clients-table">
                        <thead>
                            <tr>
                                <th>CLIENT</th>
                                <th>FACTURES</th>
                                <th>CA TOTAL (DT)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topClients.length > 0 ? topClients.map((c, i) => (
                                <tr key={i}>
                                    <td><div className="client-cell"><span className="avatar">{c.name.substring(0, 2).toUpperCase()}</span> {c.name}</div></td>
                                    <td>{c.invoiceCount}</td>
                                    <td className="font-bold">{c.totalTTC.toLocaleString('fr-TN')}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>Aucun client trouvé</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <footer className="stats-footer">
                <p>© 2024 El Fatoora - Plateforme de facturation électronique certifiée. Données synchronisées en temps réel avec les services fiscaux.</p>
            </footer>
        </div>
    );
}
