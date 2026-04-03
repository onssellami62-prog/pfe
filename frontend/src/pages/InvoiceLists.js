import React, { useState, useEffect, useCallback } from 'react';
import './InvoiceLists.js.css';
import { generateTeifXml, downloadXml } from '../utils/teifGenerator';

const API = 'http://localhost:5170/api';

export default function InvoiceLists({ initialFilter = 'validated', onErrorClick }) {
    const [filter, setFilter] = useState(initialFilter); // 'validated', 'pending', 'rejected'
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showXml, setShowXml] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Charger les factures depuis l'API
    const fetchInvoices = React.useCallback(async () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.companyId) return;

        setLoading(true);
        try {
            const res = await fetch(`${API}/Invoices?companyId=${user.companyId}`);
            if (res.ok) {
                const data = await res.json();
                setInvoices(data);
            }
        } catch (error) {
            console.error("Erreur chargement factures:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);


    const closeModal = () => {
        setSelectedInvoice(null);
        setShowXml(false);
    };

    const handleViewInvoice = (invoice) => {
        setSelectedInvoice(invoice);
    };

    const getTitle = () => {
        if (filter === 'validated') return 'Factures Validées';
        if (filter === 'pending') return 'Factures en Attente de Traitement';
        return 'Factures Rejetées & Erreurs de Validation';
    };

    const getData = () => {
        if (filter === 'validated') return invoices.filter(i => i.status === 'Validée');
        if (filter === 'pending') return invoices.filter(i => i.status === 'Brouillon' || i.status === 'En cours' || i.status === 'En Attente');
        return invoices.filter(i => i.status === 'Rejetée');
    };

    const filteredData = getData().filter(item =>
        (item.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        validated: invoices.filter(i => i.status === 'Validée').length,
        pending: invoices.filter(i => i.status === 'Brouillon' || i.status === 'En cours' || i.status === 'En Attente').length,
        rejected: invoices.filter(i => i.status === 'Rejetée').length
    };

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
                    <span className="value">{stats.validated}</span>
                </div>
                <div className={`status-card-mini orange ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
                    <div className="card-top">
                        <span className="icon">🔔</span>
                        <span className="badge">Action requise</span>
                    </div>
                    <span className="label">BRUILLONS / ATTENTE</span>
                    <span className="value">{stats.pending}</span>
                </div>
                <div className={`status-card-mini red ${filter === 'rejected' ? 'active' : ''}`} onClick={() => setFilter('rejected')}>
                    <div className="card-top">
                        <span className="icon">❌</span>
                        <span className="badge">À corriger</span>
                    </div>
                    <span className="label">REJETÉES / ERREURS</span>
                    <span className="value">{stats.rejected}</span>
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
                                <td><span className="invoice-id-link">{row.invoiceNumber}</span></td>
                                <td>
                                    <div className="client-info">
                                        <span className="avatar-small">{row.clientName ? row.clientName.charAt(0) : '?'}</span>
                                        {row.clientName}
                                    </div>
                                </td>
                                <td>{new Date(row.date).toLocaleDateString('fr-TN')}</td>
                                <td className="font-bold">{parseFloat(row.totalTTC).toFixed(3)} DT</td>
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
                                        <p><strong>N° :</strong> {selectedInvoice.invoiceNumber}</p>
                                        <p><strong>Date :</strong> {new Date(selectedInvoice.date).toLocaleDateString('fr-TN')}</p>
                                    </div>
                                </header>

                                <div className="bill-to-section">
                                    <div className="bill-col">
                                        <span>ÉMETTEUR</span>
                                        <p><strong>{JSON.parse(localStorage.getItem('user') || '{}').entreprise}</strong></p>
                                        <p>Mat: {JSON.parse(localStorage.getItem('user') || '{}').matriculeFiscal}</p>
                                    </div>
                                    <div className="bill-col">
                                        <span>DESTINATAIRE</span>
                                        <p><strong>{selectedInvoice.clientName}</strong></p>
                                        <p>Matricule: {selectedInvoice.clientMatricule}</p>
                                        <p>{selectedInvoice.clientAddress}</p>
                                    </div>
                                </div>

                                <table className="paper-table">
                                    <thead>
                                        <tr>
                                            <th>Description</th>
                                            <th className="text-right">Qté</th>
                                            <th className="text-right">P.U HT</th>
                                            <th className="text-right">Total HT</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedInvoice.lines && selectedInvoice.lines.map((line, idx) => (
                                            <tr key={idx}>
                                                <td>{line.description}</td>
                                                <td className="text-right">{line.qty}</td>
                                                <td className="text-right">{parseFloat(line.unitPriceHT).toFixed(3)}</td>
                                                <td className="text-right">{parseFloat(line.totalHT).toFixed(3)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="invoice-summary-box">
                                    <div className="summary-row">
                                        <span>Total HT</span>
                                        <span>{parseFloat(selectedInvoice.totalHT).toFixed(3)} DT</span>
                                    </div>
                                    <div className="summary-row">
                                        <span>Total TVA</span>
                                        <span>{parseFloat(selectedInvoice.totalTVA).toFixed(3)} DT</span>
                                    </div>
                                    <div className="summary-row">
                                        <span>Timbre Fiscal</span>
                                        <span>{parseFloat(selectedInvoice.stampDuty).toFixed(3)} DT</span>
                                    </div>
                                    <div className="summary-row total">
                                        <span>MONTANT TTC</span>
                                        <span>{parseFloat(selectedInvoice.totalTTC).toFixed(3)} DT</span>
                                    </div>
                                </div>

                                {showXml && (
                                    <div className="xml-overlay-container">
                                        <div className="xml-header">
                                            <h4>Structure XML TEIF V2.0 (Généré)</h4>
                                            <button onClick={() => downloadXml(generateTeifXml(
                                                { 
                                                    name: JSON.parse(localStorage.getItem('user') || '{}').entreprise,
                                                    address: JSON.parse(localStorage.getItem('user') || '{}').address,
                                                    matricule: JSON.parse(localStorage.getItem('user') || '{}').matriculeFiscal
                                                }, 
                                                selectedInvoice
                                            ), `${selectedInvoice.invoiceNumber}.xml`)}>📥 Télécharger .xml</button>
                                        </div>
                                        <pre className="xml-preview-code">
                                            {generateTeifXml(
                                                { 
                                                    name: JSON.parse(localStorage.getItem('user') || '{}').entreprise,
                                                    address: JSON.parse(localStorage.getItem('user') || '{}').address,
                                                    matricule: JSON.parse(localStorage.getItem('user') || '{}').matriculeFiscal
                                                }, 
                                                selectedInvoice
                                            )}
                                        </pre>
                                    </div>
                                )}

                                <footer className="paper-footer">
                                    <p>Cette facture est générée électroniquement et conforme aux normes TEIF.</p>
                                    <p>Merci de votre confiance.</p>
                                </footer>
                            </div>

                            <div className="modal-actions-footer">
                                <button className="btn-secondary" onClick={() => setShowXml(!showXml)}>
                                    {showXml ? "📄 Voir Facture" : "📄 Aperçu TEIF (XML)"}
                                </button>
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
