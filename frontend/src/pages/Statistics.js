import React, { useState, useEffect } from 'react';
import './Statistics.css';

const IA_BASE = 'http://localhost:8000';

const fmt = (n) => n ? parseFloat(n).toLocaleString('fr-TN', { minimumFractionDigits: 3 }) : '0.000';
const MOIS_NOMS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

export default function Statistics() {
    const [prediction,  setPrediction]  = useState(null);
    const [topClients,  setTopClients]  = useState([]);
    const [topProduits, setTopProduits] = useState([]);
    const [evolution,   setEvolution]   = useState([]);
    const [panierMoyen, setPanierMoyen] = useState(null);
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState(null);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        setError(null);
        try {
            const [predRes, clientsRes, produitsRes, evoRes, panierRes] = await Promise.all([
                fetch(`${IA_BASE}/predict/ca`),
                fetch(`${IA_BASE}/bi/top-clients`),
                fetch(`${IA_BASE}/bi/top-produits`),
                fetch(`${IA_BASE}/bi/evolution-ca`),
                fetch(`${IA_BASE}/bi/panier-moyen`),
            ]);

            const [pred, clients, produits, evo, panier] = await Promise.all([
                predRes.json(),
                clientsRes.json(),
                produitsRes.json(),
                evoRes.json(),
                panierRes.json(),
            ]);

            setPrediction(pred);
            setTopClients(clients.topClients   || []);
            setTopProduits(produits.topProduits || []);
            setEvolution(evo.evolution          || []);
            setPanierMoyen(panier);
        } catch (err) {
            setError('Erreur connexion au microservice IA. Vérifiez que le service Python tourne sur le port 8000.');
        } finally {
            setLoading(false);
        }
    };

    const maxCA = evolution.length ? Math.max(...evolution.map(e => e.caHT), 1) : 1;

    const tendanceBadge = (t) => ({
        'hausse': { bg: '#dcfce7', color: '#16a34a', icon: '📈' },
        'baisse': { bg: '#fee2e2', color: '#dc2626', icon: '📉' },
        'stable': { bg: '#f1f5f9', color: '#64748b', icon: '➡️' },
    }[t] || { bg: '#f1f5f9', color: '#64748b', icon: '➡️' });

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
            🤖 Chargement des analyses IA...
        </div>
    );

    if (error) return (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444', background: '#fef2f2', borderRadius: 8, margin: '2rem' }}>
            {error} — <button onClick={fetchAll} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>Réessayer</button>
        </div>
    );

    const badge = tendanceBadge(prediction?.tendance);

    return (
        <div className="stats-page">
            <header className="stats-header">
                <div className="header-info">
                    <h1>🤖 Tableau de Bord BI & Intelligence Artificielle</h1>
                    <p>Analyses avancées et prédictions basées sur vos données de facturation</p>
                </div>
                <div className="header-controls">
                    <button className="btn-export" onClick={fetchAll}>
                        🔄 Actualiser
                    </button>
                </div>
            </header>

            {/* ── Prédiction CA ── */}
            <div style={{ background: 'linear-gradient(135deg, #1e429f 0%, #3b5bdb 100%)', borderRadius: 16, padding: '1.5rem 2rem', marginBottom: '1.5rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                        🤖 Prédiction IA — CA {MOIS_NOMS[(prediction?.moisProchain || 1) - 1]} {prediction?.anneeProchaine}
                    </div>
                    <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1px' }}>
                        {fmt(prediction?.prediction)} <span style={{ fontSize: 16, fontWeight: 400, opacity: 0.7 }}>DT</span>
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
                        {prediction?.message}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '12px 18px', textAlign: 'center' }}>
                        <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4 }}>CONFIANCE</div>
                        <div style={{ fontSize: 22, fontWeight: 700 }}>{prediction?.confiance}%</div>
                    </div>
                    <div style={{ background: badge.bg, borderRadius: 10, padding: '12px 18px', textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: badge.color, fontWeight: 600, marginBottom: 4 }}>TENDANCE</div>
                        <div style={{ fontSize: 22 }}>{badge.icon}</div>
                        <div style={{ fontSize: 12, color: badge.color, fontWeight: 600 }}>{prediction?.tendance?.toUpperCase()}</div>
                    </div>
                </div>
            </div>

            {/* ── KPIs ── */}
            <div className="stats-kpi-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="kpi-card">
                    <div className="kpi-top"><div className="kpi-icon blue">🛒</div></div>
                    <div className="kpi-content">
                        <span className="label">Panier Moyen Global</span>
                        <div className="value">{fmt(panierMoyen?.panierMoyenGlobal)} <small>DT</small></div>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-top"><div className="kpi-icon green">👥</div></div>
                    <div className="kpi-content">
                        <span className="label">Top Client</span>
                        <div className="value" style={{ fontSize: 18 }}>{topClients[0]?.nomClient || '—'}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{fmt(topClients[0]?.caTotal)} DT</div>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-top"><div className="kpi-icon orange">📦</div></div>
                    <div className="kpi-content">
                        <span className="label">Top Produit</span>
                        <div className="value" style={{ fontSize: 18 }}>{topProduits[0]?.nomProduit || '—'}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{topProduits[0]?.qteTotale || 0} unités vendues</div>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-top"><div className="kpi-icon indigo">📊</div></div>
                    <div className="kpi-content">
                        <span className="label">Mois d'historique</span>
                        <div className="value">{evolution.length}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>utilisés pour la prédiction</div>
                    </div>
                </div>
            </div>

            <div className="stats-main-grid">
                {/* Évolution mensuelle */}
                <div className="stats-chart-card sales-card">
                    <div className="card-header">
                        <h3>📊 Évolution mensuelle du CA</h3>
                    </div>
                    <div className="bar-chart">
                        {evolution.length > 0
                            ? evolution.map((e, i) => (
                                <div className="bar-container" key={i}>
                                    <div className="bar" style={{ height: `${(e.caHT / maxCA) * 85}%` }}>
                                        <div className="bar-top"></div>
                                    </div>
                                    <span>{['JAN','FÉV','MAR','AVR','MAI','JUIN','JUIL','AOÛT','SEPT','OCT','NOV','DÉC'][e.mois - 1]}</span>
                                </div>
                            ))
                            : <p style={{ color: '#94a3b8', padding: '2rem' }}>Aucune donnée disponible</p>
                        }
                    </div>
                </div>

                {/* Top 5 clients */}
                <div className="stats-chart-card clients-card">
                    <div className="card-header">
                        <h3>⭐ Top 5 Clients par CA</h3>
                    </div>
                    <table className="clients-table">
                        <thead>
                            <tr>
                                <th>CLIENT</th>
                                <th>FACTURES</th>
                                <th>CA HT (DT)</th>
                                <th>PANIER MOY.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topClients.map((c, i) => (
                                <tr key={i}>
                                    <td>
                                        <div className="client-cell">
                                            <span className="avatar">{c.nomClient.substring(0, 2).toUpperCase()}</span>
                                            {c.nomClient}
                                        </div>
                                    </td>
                                    <td>{c.nbFactures}</td>
                                    <td className="font-bold">{fmt(c.caTotal)}</td>
                                    <td style={{ color: '#64748b', fontSize: 12 }}>{fmt(c.panierMoyen)}</td>
                                </tr>
                            ))}
                            {topClients.length === 0 && (
                                <tr><td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '1rem' }}>Aucune donnée</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Top 5 produits */}
                <div className="stats-chart-card clients-card">
                    <div className="card-header">
                        <h3>📦 Top 5 Produits Vendus</h3>
                    </div>
                    <table className="clients-table">
                        <thead>
                            <tr>
                                <th>PRODUIT</th>
                                <th>QTÉ</th>
                                <th>CA HT (DT)</th>
                                <th>PRIX MOY.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topProduits.map((p, i) => (
                                <tr key={i}>
                                    <td>
                                        <div className="client-cell">
                                            <span className="avatar">{p.nomProduit.substring(0, 2).toUpperCase()}</span>
                                            {p.nomProduit}
                                        </div>
                                    </td>
                                    <td>{p.qteTotale}</td>
                                    <td className="font-bold">{fmt(p.caHT)}</td>
                                    <td style={{ color: '#64748b', fontSize: 12 }}>{fmt(p.prixMoyen)}</td>
                                </tr>
                            ))}
                            {topProduits.length === 0 && (
                                <tr><td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '1rem' }}>Aucune donnée</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Panier moyen par client */}
                <div className="stats-chart-card clients-card">
                    <div className="card-header">
                        <h3>🛒 Panier Moyen par Client</h3>
                        <span style={{ fontSize: 12, color: '#64748b' }}>Global: {fmt(panierMoyen?.panierMoyenGlobal)} DT</span>
                    </div>
                    <table className="clients-table">
                        <thead>
                            <tr>
                                <th>CLIENT</th>
                                <th>FACTURES</th>
                                <th>PANIER MOYEN</th>
                                <th>MAX</th>
                            </tr>
                        </thead>
                        <tbody>
                            {panierMoyen?.parClient?.map((c, i) => (
                                <tr key={i}>
                                    <td>
                                        <div className="client-cell">
                                            <span className="avatar">{c.nomClient.substring(0, 2).toUpperCase()}</span>
                                            {c.nomClient}
                                        </div>
                                    </td>
                                    <td>{c.nbFactures}</td>
                                    <td className="font-bold" style={{ color: '#1e429f' }}>{fmt(c.panierMoyen)}</td>
                                    <td style={{ color: '#64748b', fontSize: 12 }}>{fmt(c.maxFacture)}</td>
                                </tr>
                            ))}
                            {(!panierMoyen?.parClient || panierMoyen.parClient.length === 0) && (
                                <tr><td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '1rem' }}>Aucune donnée</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <footer className="stats-footer">
                <p>🤖 Analyses générées par le microservice IA Python — El Fatoora {new Date().getFullYear()}</p>
            </footer>
        </div>
    );
}