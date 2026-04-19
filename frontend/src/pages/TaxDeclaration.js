import React, { useState, useEffect, useCallback } from 'react';
import './TaxDeclaration.css';

const API = 'http://localhost:5170/api';

const Icons = {
    Calendar: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    ),
    ChartLine: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
        </svg>
    ),
    Document: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    ),
    Download: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    ),
    Info: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    )
};

export default function TaxDeclaration() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const companyId = user.companyId;

    const [selectedPeriod, setSelectedPeriod] = useState(() => {
        const now = new Date();
        // Par défaut, mois précédent si on est au début du mois, sinon mois en cours
        const d = now.getDate() < 5 ? new Date(now.getFullYear(), now.getMonth() - 1, 1) : now;
        return `${d.getMonth() + 1}-${d.getFullYear()}`;
    });
    
    const [taxData, setTaxData] = useState(null);
    const [loading, setLoading] = useState(true);

    const generatePeriods = () => {
        const p = [];
        const now = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const val = `${d.getMonth() + 1}-${d.getFullYear()}`;
            const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
            p.push({ val, label });
        }
        return p;
    };

    const periods = generatePeriods();

    const fetchTaxData = useCallback(async () => {
        if (!companyId) return;
        setLoading(true);
        try {
            const [m, y] = selectedPeriod.split('-');
            const res = await fetch(`${API}/Statistics/tax-summary?companyId=${companyId}&month=${m}&year=${y}`);
            if (res.ok) {
                setTaxData(await res.json());
            }
        } catch (err) {
            console.error("Tax error:", err);
        } finally {
            setLoading(false);
        }
    }, [companyId, selectedPeriod]);

    useEffect(() => {
        fetchTaxData();
    }, [fetchTaxData]);

    if (loading && !taxData) return <div className="tax-declaration"><div className="loading-stats">Calcul de la déclaration...</div></div>;

    const displayData = taxData || {
        totalCaHT: 0,
        totalTva: 0,
        totalStamp: 0,
        invoiceCount: 0,
        netToPay: 0,
        details: []
    };

    return (
        <div className="tax-declaration">
            {/* Header section with title and month selector */}
            <header className="tax-header">
                <h1>Déclaration Fiscale Mensuelle</h1>
                <div className="month-selector">
                    <span className="calendar-icon"><Icons.Calendar /></span>
                    <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
                        {periods.map(p => (
                            <option key={p.val} value={p.val}>{p.label}</option>
                        ))}
                    </select>
                </div>
            </header>

            {/* Summary Stat Cards */}
            <div className="tax-summary-cards">
                <div className="tax-card">
                    <span className="card-label">CHIFFRE D'AFFAIRES HT</span>
                    <div className="card-value">
                        {displayData.totalCaHT.toLocaleString('fr-TN')} <span className="currency">DT</span>
                    </div>
                    <span className="card-subtitle">Montant total imposable</span>
                </div>

                <div className="tax-card">
                    <span className="card-label">TVA COLLECTÉE (VENTES)</span>
                    <div className="card-value">
                        {displayData.totalTva.toLocaleString('fr-TN')} <span className="currency">DT</span>
                    </div>
                    <span className="card-subtitle">Basé sur {displayData.invoiceCount} facture(s)</span>
                </div>

                <div className="tax-card border-orange">
                    <span className="card-label">TVA DÉDUCTIBLE (ACHATS)</span>
                    <div className="card-value orange">
                        0.000 <span className="currency">DT</span>
                    </div>
                    <span className="card-subtitle">Non géré actuellement</span>
                </div>

                <div className="tax-card border-blue">
                    <span className="card-label">NET À PAYER/CRÉDIT</span>
                    <div className="card-value blue">
                        {displayData.netToPay.toLocaleString('fr-TN')} <span className="currency">DT</span>
                    </div>
                    <span className="card-subtitle">TVA + Timbre</span>
                </div>
            </div>

            {/* Detail Table Container */}
            <div className="tax-detail-container">
                <div className="detail-header">
                    <div className="header-text">
                        <h3>Détail de la Déclaration</h3>
                        <p>Répartition de la TVA par taux et droits de timbre</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-secondary">
                            <span className="icon"><Icons.Document /></span> Télécharger le Récapitulatif PDF
                        </button>
                        <button className="btn-primary">
                            <span className="icon"><Icons.Download /></span> Générer le Fichier de Déclaration
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
                        {displayData.details.map((d, i) => (
                            <tr key={i}>
                                <td>Chiffre d'Affaires taxable à {d.rate}%</td>
                                <td>{d.baseHT.toLocaleString('fr-TN')} DT</td>
                                <td><span className="tax-badge blue">{d.rate}%</span></td>
                                <td className="font-bold">{d.taxAmount.toLocaleString('fr-TN')} DT</td>
                            </tr>
                        ))}
                        {displayData.details.length === 0 && (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Aucune vente pour cette période</td></tr>
                        )}
                        <tr className="row-summary">
                            <td className="font-bold">Total TVA Collectée</td>
                            <td className="font-bold">{displayData.totalCaHT.toLocaleString('fr-TN')} DT</td>
                            <td></td>
                            <td className="font-bold blue-text">{displayData.totalTva.toLocaleString('fr-TN')} DT</td>
                        </tr>
                        <tr>
                            <td>Droit de Timbre (Factures Ventes) {loading && <small>(Mise à jour...)</small>}</td>
                            <td>{displayData.invoiceCount} Facture(s)</td>
                            <td className="italic-text">1.000 DT / Facture</td>
                            <td className="font-bold">{displayData.totalStamp.toLocaleString('fr-TN')} DT</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan="3" className="font-bold">Total Net de la Déclaration (TVA + Timbre - TVA Déductible)</td>
                            <td className="font-bold blue-text total-value">{displayData.netToPay.toLocaleString('fr-TN')} DT</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Bottom Section */}
            <div className="tax-footer-grid">
                <div className="conformity-info">
                    <div className="info-icon"><Icons.Info /></div>
                    <div className="info-content">
                        <h4>Rappel de conformité</h4>
                        <p>
                            Cette déclaration est générée automatiquement à partir de vos factures validées sur la plateforme.
                            Veuillez vérifier que tous vos achats du mois ont également été saisis pour bénéficier de la déduction de TVA correspondante.
                        </p>
                    </div>
                </div>

                <div className="status-card">
                    <div className="status-info">
                        <h4>Statut de la déclaration</h4>
                        <p>Dernière mise à jour: Aujourd'hui à 09:42</p>
                    </div>
                    <span className="status-badge-orange">En préparation</span>
                </div>
            </div>
        </div>
    );
}
