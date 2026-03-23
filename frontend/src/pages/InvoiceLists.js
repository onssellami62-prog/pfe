import React, { useState } from 'react';
import './InvoiceLists.js.css';

const VALIDATED_DATA = [
    { id: '#INV-2023-001', client: 'Alain Dupont', date: '12 Oct 2023', amount: '1,250.00 €', status: 'Validée' },
    { id: '#INV-2023-002', client: 'BatiTech SARL', date: '11 Oct 2023', amount: '4,890.50 €', status: 'Validée' },
    { id: '#INV-2023-005', client: 'Solar Solutions', date: '10 Oct 2023', amount: '945.00 €', status: 'Validée' },
    { id: '#INV-2023-008', client: 'Niko Concept', date: '09 Oct 2023', amount: '2,100.00 €', status: 'Validée' },
    { id: '#INV-2023-012', client: 'Global Media', date: '08 Oct 2023', amount: '720.00 €', status: 'Validée' },
];

const PENDING_DATA = [
    { id: 'FAC-2023-0892', client: 'Sarl TechSolutions', date: '12 Oct 2023', amount: '1 450,00 €', status: 'En Attente' },
    { id: 'FAC-2023-0894', client: 'Global Industrie', date: '14 Oct 2023', amount: '425,50 €', status: 'En cours' },
    { id: 'FAC-2023-0895', client: 'Architecture & Co', date: '14 Oct 2023', amount: '2 890,00 €', status: 'En Attente' },
    { id: 'FAC-2023-0897', client: 'Logistique Express', date: '15 Oct 2023', amount: '120,00 €', status: 'En Attente' },
    { id: 'FAC-2023-0898', client: 'Cabinet Lerois', date: '15 Oct 2023', amount: '3 240,00 €', status: 'En cours' },
];

const REJECTED_DATA = [
    { id: '#F2023-1045', client: 'Global Logistics S.A.', date: '22 Oct 2023', amount: '1,450.00 €', status: 'Rejetée' },
    { id: '#F2023-1042', client: "Boulangerie L'Artisan", date: '21 Oct 2023', amount: '430.50 €', status: 'Rejetée' },
    { id: '#F2023-1039', client: 'TechNova Solutions', date: '20 Oct 2023', amount: '12,890.00 €', status: 'Rejetée' },
];

export default function InvoiceLists({ initialFilter = 'validated', onErrorClick }) {
    const [filter, setFilter] = useState(initialFilter); // 'validated', 'pending', 'rejected'
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const closeModal = () => setSelectedInvoice(null);

    const handleViewInvoice = (invoice) => {
        setSelectedInvoice(invoice);
    };

    const getTitle = () => {
        if (filter === 'validated') return 'Factures Validées';
        if (filter === 'pending') return 'Factures en Attente de Traitement';
        return 'Factures Rejetées & Erreurs de Validation';
    };

    const getData = () => {
        if (filter === 'validated') return VALIDATED_DATA;
        if (filter === 'pending') return PENDING_DATA;
        return REJECTED_DATA;
    };

    const filteredData = getData().filter(item =>
        item.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="invoice-lists-container">
            <header className="list-header">
                <p className="welcome-text">Bienvenue sur votre espace de gestion de factures électroniques conforme TEIF XML.</p>
                <h1>{getTitle()}</h1>
            </header>

            <div className="status-cards-row">
                <div className={`status-card-mini green ${filter === 'validated' ? 'active' : ''}`} onClick={() => setFilter('validated')}>
                    <div className="card-top">
                        <span className="icon">✅</span>
                        <span className="badge">+12% vs hier</span>
                    </div>
                    <span className="label">FACTURES VALIDÉES</span>
                    <span className="value">128</span>
                </div>
                <div className={`status-card-mini orange ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
                    <div className="card-top">
                        <span className="icon">🔔</span>
                        <span className="badge">+2% vs hier</span>
                    </div>
                    <span className="label">EN ATTENTE</span>
                    <span className="value">12</span>
                </div>
                <div className={`status-card-mini red ${filter === 'rejected' ? 'active' : ''}`} onClick={() => setFilter('rejected')}>
                    <div className="card-top">
                        <span className="icon">❌</span>
                        <span className="badge">-1% vs hier</span>
                    </div>
                    <span className="label">REJETÉES / ERREURS</span>
                    <span className="value">03</span>
                </div>
            </div>

            <div className={`table-box ${filter}`}>
                <div className="table-header-row">
                    <h3>{filter === 'rejected' ? 'Liste des erreurs détectées' : `Liste des Factures ${filter === 'validated' ? 'Validées' : 'en Attente'}`}</h3>
                    <div className="table-controls">
                        <div className="search-box">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Rechercher par client ou N°..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="filter-dropdown-container">
                            <button className="filter-btn" onClick={() => setShowFilters(!showFilters)}>
                                Filtres
                            </button>
                            {showFilters && (
                                <div className="filter-popup">
                                    <h4>Filtrer par période</h4>
                                    <label><input type="radio" name="period" /> 7 derniers jours</label>
                                    <label><input type="radio" name="period" /> Ce mois</label>
                                    <label><input type="radio" name="period" /> Année en cours</label>
                                    <hr />
                                    <button className="btn-apply" onClick={() => setShowFilters(false)}>Appliquer</button>
                                </div>
                            )}
                        </div>
                        <button className="export-btn">Exporter {filter === 'validated' ? '(CSV)' : ''}</button>
                        {filter === 'pending' && <button className="btn-add-val">+ Nouvelle Facture</button>}
                    </div>
                </div>

                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>{filter === 'pending' ? 'RÉFÉRENCE' : (filter === 'rejected' ? 'NUMÉRO DE FACTURE' : 'ID FACTURE')}</th>
                            <th>CLIENT</th>
                            <th>DATE D'ÉMISSION</th>
                            <th>MONTANT TTC</th>
                            <th>STATUT</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((row) => (
                            <tr key={row.id}>
                                <td><span className="invoice-id-link">{row.id}</span></td>
                                <td>
                                    <div className="client-info">
                                        {filter === 'validated' && <span className="avatar-small">{row.client.split(' ').map(n => n[0]).join('')}</span>}
                                        {row.client}
                                    </div>
                                </td>
                                <td>{row.date}</td>
                                <td className="font-bold">{row.amount}</td>
                                <td>
                                    <span className={`pill ${row.status.toLowerCase().replace(' ', '-')}`}>
                                        {row.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="row-actions">
                                        {filter === 'rejected' ? (
                                            <>
                                                <button className="eye-btn" onClick={() => handleViewInvoice(row)}>👁️</button>
                                                <button className="error-link" onClick={() => onErrorClick && onErrorClick(row)}>Voir l'erreur</button>
                                            </>
                                        ) : (
                                            <>
                                                <button className="eye-btn" onClick={() => handleViewInvoice(row)}>👁️️</button>
                                                <button className="more-btn">⋮</button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* MODAL INVOICE VIEW */}
                {selectedInvoice && (
                    <div className="invoice-modal-overlay" onClick={closeModal}>
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
                                        <p>Client Professionnel</p>
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
                                            <td>Services de Facturation Électronique - Licence Annuelle</td>
                                            <td className="text-right">1</td>
                                            <td className="text-right">{selectedInvoice.amount}</td>
                                            <td className="text-right">{selectedInvoice.amount}</td>
                                        </tr>
                                        <tr>
                                            <td>Frais de traitement TEIF XML</td>
                                            <td className="text-right">1</td>
                                            <td className="text-right">0.00 €</td>
                                            <td className="text-right">0.00 €</td>
                                        </tr>
                                    </tbody>
                                </table>

                                <div className="invoice-summary-box">
                                    <div className="summary-row">
                                        <span>Montant HT</span>
                                        <span>{selectedInvoice.amount}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span>TVA (19%)</span>
                                        <span>Inclus</span>
                                    </div>
                                    <div className="summary-row total">
                                        <span>MONTANT TTC</span>
                                        <span>{selectedInvoice.amount}</span>
                                    </div>
                                </div>

                                <footer className="paper-footer">
                                    <p>Cette facture est générée électroniquement et conforme aux normes TEIF.</p>
                                    <p>Merci de votre confiance.</p>
                                </footer>
                            </div>

                            <div className="modal-actions-footer">
                                <button className="btn-secondary" onClick={() => window.print()}>🖨️ Imprimer</button>
                                <button className="btn-primary">📥 Télécharger PDF</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="table-footer-pagination">
                    <span>Affichage de 1-5 sur {filter === 'rejected' ? '3' : getData().length} factures</span>
                    <div className="pagination-controls">
                        <button className="arrow">‹</button>
                        <button className="page active">1</button>
                        <button className="page">2</button>
                        <button className="page">3</button>
                        <button className="arrow">›</button>
                    </div>
                </div>
            </div>

            {filter === 'rejected' && (
                <div className="error-hint-box">
                    <div className="hint-icon">⚠️</div>
                    <div className="hint-content">
                        <h4>Aide au diagnostic</h4>
                        <p>
                            Les erreurs de validation (TEIF XML) sont souvent liées à des informations manquantes dans la fiche client ou à un format de numéro de TVA intracommunautaire invalide. Cliquez sur "Voir l'erreur" pour obtenir le détail technique du rejet par la plateforme.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
