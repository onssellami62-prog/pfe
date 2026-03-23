import React from 'react';
import './TaxDeclaration.css';

export default function TaxDeclaration() {
    return (
        <div className="tax-declaration">
            {/* Header section with title and month selector */}
            <header className="tax-header">
                <h1>Déclaration Fiscale Mensuelle</h1>
                <div className="month-selector">
                    <span className="calendar-icon">📅</span>
                    <select defaultValue="mai-2024">
                        <option value="mai-2024">Mai 2024</option>
                        <option value="avril-2024">Avril 2024</option>
                    </select>
                </div>
            </header>

            {/* Summary Stat Cards */}
            <div className="tax-summary-cards">
                <div className="tax-card">
                    <span className="card-label">CHIFFRE D'AFFAIRES HT</span>
                    <div className="card-value">
                        45,280.000 <span className="currency">DT</span>
                    </div>
                    <span className="card-trend positive">📈 +5.4% ce mois</span>
                </div>

                <div className="tax-card">
                    <span className="card-label">TVA COLLECTÉE (VENTES)</span>
                    <div className="card-value">
                        8,150.400 <span className="currency">DT</span>
                    </div>
                    <span className="card-subtitle">Basé sur 128 factures</span>
                </div>

                <div className="tax-card border-orange">
                    <span className="card-label">TVA DÉDUCTIBLE (ACHATS)</span>
                    <div className="card-value orange">
                        3,420.200 <span className="currency">DT</span>
                    </div>
                    <span className="card-subtitle">Total achats déclarés</span>
                </div>

                <div className="tax-card border-blue">
                    <span className="card-label">NET À PAYER/CRÉDIT</span>
                    <div className="card-value blue">
                        4,730.200 <span className="currency">DT</span>
                    </div>
                    <span className="card-link">Solde à régulariser</span>
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
                            <span className="icon">📄</span> Télécharger le Récapitulatif PDF
                        </button>
                        <button className="btn-primary">
                            <span className="icon">⬇️</span> Générer le Fichier de Déclaration
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
                        <tr>
                            <td>Chiffre d'Affaires taxable à 7%</td>
                            <td>12,400.000 DT</td>
                            <td><span className="tax-badge blue">7%</span></td>
                            <td className="font-bold">868.000 DT</td>
                        </tr>
                        <tr>
                            <td>Chiffre d'Affaires taxable à 13%</td>
                            <td>8,500.000 DT</td>
                            <td><span className="tax-badge blue">13%</span></td>
                            <td className="font-bold">1,105.000 DT</td>
                        </tr>
                        <tr>
                            <td>Chiffre d'Affaires taxable à 19%</td>
                            <td>24,380.000 DT</td>
                            <td><span className="tax-badge purple">19%</span></td>
                            <td className="font-bold">4,632.200 DT</td>
                        </tr>
                        <tr className="row-summary">
                            <td className="font-bold">Total TVA Collectée</td>
                            <td className="font-bold">45,280.000 DT</td>
                            <td></td>
                            <td className="font-bold blue-text">6,605.200 DT</td>
                        </tr>
                        <tr>
                            <td>Droit de Timbre (Factures Ventes)</td>
                            <td>128 Factures</td>
                            <td className="italic-text">1.000 DT / Facture</td>
                            <td className="font-bold">128.000 DT</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan="3" className="font-bold">Total Net de la Déclaration (TVA + Timbre - TVA Déductible)</td>
                            <td className="font-bold blue-text total-value">4,730.200 DT</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Bottom Section */}
            <div className="tax-footer-grid">
                <div className="conformity-info">
                    <div className="info-icon">ℹ️</div>
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
