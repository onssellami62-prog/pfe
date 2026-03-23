import React, { useState } from 'react';
import './MyInvoices.css';

const INVOICE_DATA = [
    { date: '24 Mai 2024', id: 'FAC-2024-0582', client: 'Pharmacie Centrale', amount: '1,245.500', status: 'Validé' },
    { date: '22 Mai 2024', id: 'FAC-2024-0581', client: 'SOCIETE TUNISIE TELECOM', amount: '4,820.000', status: 'En cours' },
    { date: '20 Mai 2024', id: 'FAC-2024-0580', client: 'Clinique El Amen', amount: '850.000', status: 'Rejetée' },
    { date: '18 Mai 2024', id: 'FAC-2024-0579', client: 'STE CARTHAGE CEMENT', amount: '12,600.000', status: 'Validé' },
    { date: '15 Mai 2024', id: 'FAC-2024-0578', client: 'COOPERATIVE EL BARAKA', amount: '2,300.200', status: 'Validé' },
];

export default function MyInvoices({ onNewInvoice }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tous les statuts');
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    const closeModal = () => setSelectedInvoice(null);

    const filteredData = INVOICE_DATA.filter(item => {
        const matchesSearch =
            item.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
            statusFilter === 'Tous les statuts' ||
            item.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="invoices-page">
            <header className="page-top-header">
                <div className="header-left">
                    <h1>Mes Factures</h1>
                    <div className="search-bar">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Rechercher une facture..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="header-actions">
                    <select
                        className="filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option>Tous les statuts</option>
                        <option>Validé</option>
                        <option>En cours</option>
                        <option>Rejetée</option>
                    </select>
                    <div className="date-range">
                        <span className="calendar-icon">📅</span>
                        01 Mai - 31 Mai 2024
                    </div>
                    <button className="btn-new-invoice" onClick={onNewInvoice}>
                        + Nouvelle Facture
                    </button>
                </div>
            </header>

            <div className="invoice-summary-grid">
                <div className="summary-card">
                    <div className="summary-icon blue">📁</div>
                    <div className="summary-text">
                        <span className="label">TOTAL FACTURES</span>
                        <span className="value">128</span>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon green">✅</div>
                    <div className="summary-text">
                        <span className="label">MONTANT VALIDÉ</span>
                        <span className="value">53,430.400 <small>DT</small></span>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon orange">⏳</div>
                    <div className="summary-text">
                        <span className="label">MONTANT EN COURS</span>
                        <span className="value">8,120.000 <small>DT</small></span>
                    </div>
                </div>
            </div>

            <div className="table-container">
                <table className="invoices-table">
                    <thead>
                        <tr>
                            <th>DATE</th>
                            <th>N° FACTURE</th>
                            <th>CLIENT</th>
                            <th>TOTAL TTC (DT)</th>
                            <th>STATUT</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((item, index) => (
                            <tr key={index}>
                                <td>{item.date}</td>
                                <td className="font-semibold">{item.id}</td>
                                <td>{item.client}</td>
                                <td className="font-semibold">{item.amount}</td>
                                <td>
                                    <span className={`status-pill ${item.status.toLowerCase().replace(' ', '-')}`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="icon-btn" onClick={() => setSelectedInvoice(item)}>
                                            {item.status === 'En cours' ? '✏️' : '👁️'}
                                        </button>
                                        <button className="icon-btn">⋮</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredData.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                    Aucune facture ne correspond à votre recherche.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div className="table-footer">
                    <span className="results-count">Affichage de 1-{filteredData.length} sur {INVOICE_DATA.length} factures</span>
                    <div className="pagination">
                        <button className="btn-pagination">Précédent</button>
                        <button className="btn-pagination active">Suivant</button>
                    </div>
                </div>
            </div>

            <div className="export-hint">
                <div className="hint-icon">ℹ️</div>
                <div className="hint-content">
                    <h4>Exportations</h4>
                    <p>
                        Vous pouvez exporter la liste filtrée au format Excel ou PDF.
                        Cliquez sur le menu "Actions" d'une facture spécifique pour télécharger son fichier XML conforme à la réglementation fiscale tunisienne.
                    </p>
                </div>
            </div>

            {/* MODAL INVOICE VIEW */}
            {selectedInvoice && (
                <div className="invoice-modal-overlay" onClick={closeModal} style={{ zIndex: 4000 }}>
                    <div className="invoice-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-modal-btn" onClick={closeModal}>✕</button>

                        <div className="invoice-paper">
                            <header className="paper-header">
                                <div className="company-branding">
                                    <div className="logo-placeholder">EF</div>
                                    <div>
                                        <h3>El Fatoora Platform</h3>
                                        <p>Avenue de l'Indépendance, Tunis</p>
                                    </div>
                                </div>
                                <div className="invoice-meta">
                                    <h2>FACTURE</h2>
                                    <p><strong>N° :</strong> {selectedInvoice.id}</p>
                                    <p><strong>Date :</strong> {selectedInvoice.date}</p>
                                </div>
                            </header>

                            <div className="bill-to-section">
                                <div className="bill-col">
                                    <span>ÉMETTEUR</span>
                                    <p><strong>Ste. Alpha Dashboard</strong></p>
                                    <p>Mat: 1234567/A</p>
                                    <p>Tunis, Tunisie</p>
                                </div>
                                <div className="bill-col">
                                    <span>DESTINATAIRE</span>
                                    <p><strong>{selectedInvoice.client}</strong></p>
                                    <p>Identifiant Fiscal: 99887766/B</p>
                                </div>
                            </div>

                            <table className="paper-table">
                                <thead>
                                    <tr>
                                        <th>Description</th>
                                        <th className="text-right">Qté</th>
                                        <th className="text-right">Prix Unitaire</th>
                                        <th className="text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Services de Facturation Électronique</td>
                                        <td className="text-right">1</td>
                                        <td className="text-right">{selectedInvoice.amount} DT</td>
                                        <td className="text-right">{selectedInvoice.amount} DT</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="invoice-summary-box">
                                <div className="summary-row total">
                                    <span>MONTANT TTC</span>
                                    <span>{selectedInvoice.amount} DT</span>
                                </div>
                            </div>

                            <footer className="paper-footer">
                                <p>Cette facture est générée électroniquement et conforme aux normes TEIF.</p>
                            </footer>
                        </div>

                        <div className="modal-actions-footer">
                            <button className="btn-secondary" onClick={() => window.print()}>🖨️ Imprimer</button>
                            <button className="btn-primary">📥 Télécharger PDF</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
