/* src/pages/CreateInvoice.js */
import React, { useState } from 'react';
import './CreateInvoice.css';

export default function CreateInvoice() {
    const [items, setItems] = useState([]);

    return (
        <div className="create-invoice-container">
            {/* Header */}
            <div className="invoice-header-row">
                <div className="brand-section">
                    <div className="brand-logo-small">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                        </svg>
                    </div>
                    <div className="brand-text">
                        <h1>El Fatoora</h1>
                        <p>Solutions de facturation TTN</p>
                    </div>
                </div>

                <div className="invoice-meta">
                    <span className="invoice-type-badge">FACTURE ÉLECTRONIQUE</span>
                    <div className="meta-field">
                        <label>N° Facture:</label>
                        <input type="text" placeholder="Ex: 2024-00001" />
                    </div>
                    <div className="meta-field">
                        <label>Date:</label>
                        <input type="date" />
                    </div>
                    <div className="meta-field">
                        <label>Échéance:</label>
                        <input type="date" />
                    </div>
                </div>
            </div>

            {/* Company Info (Static for now) */}
            <div className="company-details">
                <h2>SOCIETE GENERALE DE COMMERCE SA</h2>
                <p>123 Avenue Habib Bourguiba, 1001 Tunis</p>
                <p>Capital: 100.000 DT | RC: B01234562023</p>
                <a href="#fiscal" className="fiscal-link">Matricule Fiscal: 1234567/A/P/M/000</a>
            </div>

            {/* Info Grid */}
            <div className="info-grid">
                <div className="grid-section">
                    <h3>Informations Client (Fiscal)</h3>
                    <div className="input-group">
                        <input type="text" placeholder="Nom ou Raison Sociale du Client" />
                    </div>
                    <div className="input-group">
                        <input type="text" placeholder="Matricule Fiscal (0000000/A/P/M/000)" />
                    </div>
                </div>

                <div className="grid-section">
                    <h3>Période de facturation</h3>
                    <div className="date-range">
                        <div className="input-group"><input type="date" /></div>
                        <span>au</span>
                        <div className="input-group"><input type="date" /></div>
                    </div>
                </div>

                <div className="grid-section">
                    <h3>Référence Unique (TTN)</h3>
                    <div className="input-group">
                        <input type="text" placeholder="REF-TTN-XXXX-XXXX" />
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <table className="items-table">
                <thead>
                    <tr>
                        <th style={{ width: '15%' }}>Code</th>
                        <th style={{ width: '40%' }}>Désignation</th>
                        <th style={{ width: '8%' }}>Qté</th>
                        <th style={{ width: '10%' }}>TVA (%)</th>
                        <th style={{ width: '12%' }}>PUHT (DT)</th>
                        <th style={{ width: '12%' }}>Total HT</th>
                        <th style={{ width: '3%' }}></th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => (
                        <tr key={idx}>
                            <td><input type="text" placeholder="Code" /></td>
                            <td><input type="text" placeholder="Désignation" /></td>
                            <td><input type="number" placeholder="0" /></td>
                            <td><input type="number" placeholder="19" /></td>
                            <td><input type="number" placeholder="0.000" /></td>
                            <td style={{ fontWeight: '700' }}>0,000</td>
                            <td><button className="remove-btn">✕</button></td>
                        </tr>
                    ))}
                    {items.length === 0 && (
                        <tr>
                            <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '13px' }}>
                                Aucune ligne ajoutée. Cliquez sur le bouton ci-dessous pour commencer.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <button className="add-line-btn" onClick={() => setItems([...items, { code: '', design: '', qty: 0, tva: 19, puht: 0, total: 0 }])}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                AJOUTER UNE LIGNE
            </button>

            {/* Summary */}
            <div className="summary-container">
                <div className="tax-summary">
                    <h3>Récapitulatif des Taxes</h3>
                    <table className="tax-table">
                        <thead>
                            <tr>
                                <th>Taux (%)</th>
                                <th>Base HT</th>
                                <th>Montant TVA</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>19%</td>
                                <td>0,000</td>
                                <td>0,000</td>
                            </tr>
                            <tr>
                                <td>Timbres Fiscaux</td>
                                <td>---</td>
                                <td>0,000</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="totals-card">
                    <div className="total-row">
                        <span>Total Hors Taxes (HT)</span>
                        <span>0,000 DT</span>
                    </div>
                    <div className="total-row">
                        <span>Total TVA</span>
                        <span>0,000 DT</span>
                    </div>
                    <div className="total-row">
                        <span>Droit de Timbre</span>
                        <span>0,000 DT</span>
                    </div>
                    <div className="total-row main">
                        <span>NET À PAYER (TTC)</span>
                        <span className="amount">0,000 DT</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="invoice-footer">
                <div className="compliance-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#16a34a" stroke="white" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="16 8 11 15 8 12" stroke="white" fill="none" />
                    </svg>
                    Document conforme aux normes TTN v2.0
                </div>
                <div className="footer-btns">
                    <button className="btn-outline">
                        <span>⚙️</span> SIGNER AVEC DIGIGO
                    </button>
                    <button className="btn-primary-full">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                        ENVOYER À LA PLATEFORME TTN
                    </button>
                </div>
            </div>

            <div className="footer-nav">
                <a href="#help">Aide & Support</a>
                <a href="#history">Historique des envois</a>
                <a href="#settings">Paramètres TTN</a>
            </div>
        </div>
    );
}

