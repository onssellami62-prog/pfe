import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { formatMatriculeDisplay, validateMatriculeFiscal } from '../utils/invoiceFormatters';
import { amountToWords } from '../utils/invoiceFormatters';
import './InvoiceLists.js.css';
import { generateTeifXml, downloadXml } from '../utils/teifGenerator';
import InvoicePreviewModal from './InvoicePreviewModal';

const API = 'http://localhost:5170/api';

const Icons = {
    Search: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    Eye: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    Download: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    ),
    Check: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    Bell: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    ),
    Alert: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    ),
    Lock: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    ),
    Key: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.5-2.5" />
        </svg>
    ),
    More: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
        </svg>
    ),
    FileCode: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="M10 13l-2 2 2 2M14 17l2-2-2-2" />
        </svg>
    )
};

export default function InvoiceLists({ initialFilter = 'validated', onErrorClick, searchTerm: globalTerm, logo }) {
    const [filter, setFilter] = useState(initialFilter); // 'validated', 'pending', 'rejected'
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showXml, setShowXml] = useState(false);
    const [localSearchTerm, setLocalSearchTerm] = useState('');
    const searchTerm = globalTerm !== undefined ? globalTerm : localSearchTerm;
    const [showFilters, setShowFilters] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

    // Charger les factures depuis l'API
    const fetchInvoices = React.useCallback(async () => {
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
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
        setShowXml(false);
    };

    const handleSignInvoice = async (id) => {
        if (!window.confirm("Êtes-vous sûr de vouloir signer électroniquement cette facture ? Cette action est irréversible et validera le document.")) return;
        
        try {
            const res = await fetch(`${API}/Invoices/${id}/sign`, {
                method: 'POST'
            });
            if (res.ok) {
                alert("Facture signée avec succès !");
                fetchInvoices();
            } else {
                const err = await res.text();
                alert("Erreur de signature: " + err);
            }
        } catch (error) {
            console.error("Erreur signature:", error);
            alert("Erreur réseau lors de la signature.");
        }
    };

    const handleViewXmlRaw = (invoice) => {
        setSelectedInvoice(invoice);
        setShowXml(true);
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

    const sortedData = [...filteredData].sort((a, b) => {
        if (sortConfig.key === 'totalTTC') {
            return sortConfig.direction === 'asc' ? (a.totalTTC - b.totalTTC) : (b.totalTTC - a.totalTTC);
        }
        if (sortConfig.key === 'date') {
            return sortConfig.direction === 'asc' ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date);
        }
        const valA = (a[sortConfig.key] || '').toString().toLowerCase();
        const valB = (b[sortConfig.key] || '').toString().toLowerCase();
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return '↕';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

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
                <div className={`status-card-mini ${filter === 'validated' ? 'active' : ''}`} onClick={() => setFilter('validated')}>
                    <div className="card-icon"><Icons.Check /></div>
                    <div className="card-info">
                        <span className="label">Factures Validées</span>
                        <span className="value">{stats.validated}</span>
                    </div>
                </div>
                <div className={`status-card-mini ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
                    <div className="card-icon"><Icons.Bell /></div>
                    <div className="card-info">
                        <span className="label">Factures en Attente</span>
                        <span className="value">{stats.pending}</span>
                    </div>
                </div>
                <div className={`status-card-mini ${filter === 'rejected' ? 'active' : ''}`} onClick={() => setFilter('rejected')}>
                    <div className="card-icon"><Icons.Alert /></div>
                    <div className="card-info">
                        <span className="label">Rejetées / Erreurs</span>
                        <span className="value">{stats.rejected}</span>
                    </div>
                </div>
            </div>

            <div className={`table-box ${filter}`}>
                <div className="table-header-row">
                    <h3>{filter === 'rejected' ? 'Liste des erreurs détectées' : `Liste des Factures ${filter === 'validated' ? 'Validées' : 'en Attente'}`}</h3>
                    <div className="table-controls">
                        {!globalTerm && (
                            <div className="search-box">
                                <span className="search-icon"><Icons.Search /></span>
                                <input
                                    type="text"
                                    placeholder="Rechercher par client ou N°..."
                                    value={localSearchTerm}
                                    onChange={(e) => setLocalSearchTerm(e.target.value)}
                                />
                            </div>
                        )}
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
                            <th onClick={() => requestSort('invoiceNumber')} style={{ cursor: 'pointer' }}>
                                {filter === 'pending' ? 'RÉFÉRENCE' : (filter === 'rejected' ? 'NUMÉRO DE FACTURE' : 'ID FACTURE')}
                                <span className="sort-icon">{getSortIcon('invoiceNumber')}</span>
                            </th>
                            <th onClick={() => requestSort('clientName')} style={{ cursor: 'pointer' }}>
                                CLIENT <span className="sort-icon">{getSortIcon('clientName')}</span>
                            </th>
                            <th onClick={() => requestSort('date')} style={{ cursor: 'pointer' }}>
                                DATE D'ÉMISSION <span className="sort-icon">{getSortIcon('date')}</span>
                            </th>
                            <th onClick={() => requestSort('totalTTC')} style={{ cursor: 'pointer' }}>
                                MONTANT TTC <span className="sort-icon">{getSortIcon('totalTTC')}</span>
                            </th>
                            <th onClick={() => requestSort('status')} style={{ cursor: 'pointer' }}>
                                STATUT <span className="sort-icon">{getSortIcon('status')}</span>
                            </th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((row) => (
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
                                    <span className={`pill ${row.status.toLowerCase().replace(' ', '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}>
                                        {row.status === 'Brouillon' ? 'EN ATTENTE' : row.status.toUpperCase()}
                                    </span>
                                </td>
                                <td>
                                    <div className="row-actions">
                                        {filter === 'rejected' ? (
                                            <>
                                                <button className="eye-btn" onClick={() => handleViewInvoice(row)} title="Voir Détails"><Icons.Eye /></button>
                                                <button className="xml-btn-small" onClick={() => handleViewXmlRaw(row)} title="Voir Structure XML"><Icons.FileCode /></button>
                                                <button className="error-link" onClick={() => onErrorClick && onErrorClick(row)}>Voir l'erreur</button>
                                            </>
                                        ) : (
                                            <>
                                                <button className="eye-btn" onClick={() => handleViewInvoice(row)} title="Voir Détails"><Icons.Eye /></button>
                                                <button className="xml-btn-small" onClick={() => handleViewXmlRaw(row)} title="Voir Structure XML"><Icons.FileCode /></button>
                                                {row.status === 'Brouillon' && !row.isSigned && (
                                                    <button className="sign-btn-action" onClick={() => handleSignInvoice(row.id)} title="Signer numériquement">
                                                        <Icons.Key />
                                                    </button>
                                                )}
                                                {row.isSigned && (
                                                    <span className="signed-icon-small" title="Facture Signée Électroniquement">
                                                        <Icons.Lock />
                                                    </span>
                                                )}
                                                <button className="more-btn"><Icons.More /></button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* SHARED UNIFIED MODAL */}
                <InvoicePreviewModal 
                    isOpen={!!selectedInvoice}
                    onClose={closeModal}
                    invoice={selectedInvoice}
                    user={{ ...JSON.parse(sessionStorage.getItem('user') || '{}'), logo }}
                    initialView={showXml ? 'xml' : 'invoice'}
                />

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
