import React, { useState, useEffect } from 'react';
import './TaxDeclaration.css';

const API_BASE    = 'http://localhost:5170/api';
const getToken    = () => localStorage.getItem('token');
const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`
});

const fmt = (n) => parseFloat(n || 0).toFixed(3);

const MOIS_NOMS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

export default function TaxDeclaration() {
    const [decl,    setDecl]    = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(null);
    const [mois,    setMois]    = useState(new Date().getMonth() + 1);
    const [annee,   setAnnee]   = useState(new Date().getFullYear());

    useEffect(() => { fetchDeclaration(); }, [mois, annee]);

    const fetchDeclaration = async () => {
        setLoading(true);
        setError(null);
        try {
            const res  = await fetch(
                `${API_BASE}/statistics/declaration?mois=${mois}&annee=${annee}`,
                { headers: authHeaders() }
            );
            if (!res.ok) throw new Error('Erreur chargement déclaration');
            setDecl(await res.json());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Générer les 12 derniers mois pour le sélecteur
    const derniersMois = [];
    for (let i = 0; i < 12; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        derniersMois.push({ mois: d.getMonth() + 1, annee: d.getFullYear() });
    }

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
            Chargement de la déclaration...
        </div>
    );

    if (error) return (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444', background: '#fef2f2', borderRadius: 8, margin: '2rem' }}>
            {error} — <button onClick={fetchDeclaration} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>Réessayer</button>
        </div>
    );

    return (
        <div className="tax-declaration">
            {/* Header */}
            <header className="tax-header">
                <h1>Déclaration Fiscale Mensuelle</h1>
                <div className="month-selector">
                    <span className="calendar-icon">📅</span>
                    <select
                        value={`${mois}-${annee}`}
                        onChange={e => {
                            const [m, a] = e.target.value.split('-');
                            setMois(parseInt(m));
                            setAnnee(parseInt(a));
                        }}
                    >
                        {derniersMois.map((d, i) => (
                            <option key={i} value={`${d.mois}-${d.annee}`}>
                                {MOIS_NOMS[d.mois - 1]} {d.annee}
                            </option>
                        ))}
                    </select>
                </div>
            </header>

            {/* KPIs */}
            <div className="tax-summary-cards">
                <div className="tax-card">
                    <span className="card-label">CHIFFRE D'AFFAIRES HT</span>
                    <div className="card-value">
                        {fmt(decl?.caHT)} <span className="currency">DT</span>
                    </div>
                    <span className="card-subtitle">
                        Basé sur {decl?.nbFactures ?? 0} facture(s) validée(s)
                    </span>
                </div>

                <div className="tax-card">
                    <span className="card-label">TVA COLLECTÉE (VENTES)</span>
                    <div className="card-value">
                        {fmt(decl?.tvaCollectee)} <span className="currency">DT</span>
                    </div>
                    <span className="card-subtitle">Sur {decl?.nbFactures ?? 0} factures</span>
                </div>

                <div className="tax-card border-orange">
                    <span className="card-label">DROIT DE TIMBRE</span>
                    <div className="card-value orange">
                        {fmt(decl?.timbre)} <span className="currency">DT</span>
                    </div>
                    <span className="card-subtitle">{decl?.nbFactures ?? 0} × 0.600 DT</span>
                </div>

                <div className="tax-card border-blue">
                    <span className="card-label">NET À PAYER</span>
                    <div className="card-value blue">
                        {fmt(decl?.netAPayer)} <span className="currency">DT</span>
                    </div>
                    <span className="card-link">TVA + Timbre</span>
                </div>
            </div>

            {/* Tableau détail */}
            <div className="tax-detail-container">
                <div className="detail-header">
                    <div className="header-text">
                        <h3>Détail de la Déclaration</h3>
                        <p>Répartition de la TVA par taux et droits de timbre — {MOIS_NOMS[mois - 1]} {annee}</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-secondary">
                            <span className="icon">📄</span> Télécharger PDF
                        </button>
                        <button className="btn-primary">
                            <span className="icon">⬇️</span> Générer Déclaration
                        </button>
                    </div>
                </div>

                <table className="tax-table">
                    <thead>
                        <tr>
                            <th>DÉSIGNATION</th>
                            <th>ASSIETTE (BASE HT)</th>
                            <th>TAUX</th>
                            <th>MONTANT TAXE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {decl?.tvaParTaux?.map((t, i) => (
                            <tr key={i}>
                                <td>Chiffre d'Affaires taxable à {t.taux}%</td>
                                <td>{fmt(t.baseHT)} DT</td>
                                <td>
                                    <span className={`tax-badge ${t.taux === 19 ? 'purple' : 'blue'}`}>
                                        {t.taux}%
                                    </span>
                                </td>
                                <td className="font-bold">{fmt(t.montantTVA)} DT</td>
                            </tr>
                        ))}

                        {(!decl?.tvaParTaux || decl.tvaParTaux.length === 0) && (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
                                    Aucune facture validée pour ce mois.
                                </td>
                            </tr>
                        )}

                        <tr className="row-summary">
                            <td className="font-bold">Total TVA Collectée</td>
                            <td className="font-bold">{fmt(decl?.caHT)} DT</td>
                            <td></td>
                            <td className="font-bold blue-text">{fmt(decl?.tvaCollectee)} DT</td>
                        </tr>

                        <tr>
                            <td>Droit de Timbre (Factures Ventes)</td>
                            <td>{decl?.nbFactures ?? 0} Factures</td>
                            <td className="italic-text">0.600 DT / Facture</td>
                            <td className="font-bold">{fmt(decl?.timbre)} DT</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan="3" className="font-bold">
                                Total Net de la Déclaration (TVA + Timbre)
                            </td>
                            <td className="font-bold blue-text total-value">
                                {fmt(decl?.netAPayer)} DT
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Footer */}
            <div className="tax-footer-grid">
                <div className="conformity-info">
                    <div className="info-icon">ℹ️</div>
                    <div className="info-content">
                        <h4>Rappel de conformité</h4>
                        <p>
                            Cette déclaration est générée automatiquement à partir de vos factures
                            validées sur la plateforme pour {MOIS_NOMS[mois - 1]} {annee}.
                        </p>
                    </div>
                </div>
                <div className="status-card">
                    <div className="status-info">
                        <h4>Statut de la déclaration</h4>
                        <p>Dernière mise à jour: {new Date().toLocaleString('fr-TN')}</p>
                    </div>
                    <span className="status-badge-orange">
                        {decl?.nbFactures > 0 ? 'Prête' : 'Aucune donnée'}
                    </span>
                </div>
            </div>
        </div>
    );
}