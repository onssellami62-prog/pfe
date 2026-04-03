import React, { useState, useEffect, useCallback } from 'react';
import './Dashboard.css';
import CompanyProfile from './CompanyProfile';
import TaxDeclaration from './TaxDeclaration';
import Statistics from './Statistics';
import InvoiceLists from './InvoiceLists';
import ErrorDiagnostic from './ErrorDiagnostic';
import InvoiceManagement from './InvoiceManagement';
import ClientsProducts from './ClientsProducts';

const API = 'http://localhost:5170/api';

const NAV_ITEMS = [
    {
        key: 'accueil', label: 'Accueil',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
        ),
    },
    {
        key: 'gestion-facture', label: 'Gestion Facture',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        ),
    },
    {
        key: 'fiscal', label: 'Déclaration Fiscale',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M14 12H8v6h6v-6z" />
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            </svg>
        ),
    },
    {
        key: 'stats', label: 'Statistiques',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
        ),
    },
    {
        key: 'referentiel', label: 'Clients & Produits',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
    },
];

function StatusBadge({ statut }) {
    const s = (statut || '').toLowerCase();
    const cls = s === 'validée' || s === 'validé' ? 'valide' : (s === 'rejetée' || s === 'rejeté' ? 'rejete' : 'en-cours');
    const label = s === 'brouillon' ? 'EN ATTENTE' : statut.toUpperCase();
    return <span className={`status-badge ${cls}`}>{label}</span>;
}

export default function Dashboard({ onLogout }) {
    const [activeNav, setActiveNav] = useState('accueil');
    const [invoices, setInvoices] = useState([]);
    const [diagnosticInvoice, setDiagnosticInvoice] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const companyName = savedUser.entreprise || 'Ma Société';

    const fetchInvoices = useCallback(async () => {
        if (!savedUser.companyId) return;
        try {
            const res = await fetch(`${API}/Invoices?companyId=${savedUser.companyId}`);
            if (res.ok) {
                const data = await res.json();
                setInvoices(data);
            }
        } catch (error) {
            console.error("Erreur dashboard:", error);
        }
    }, [savedUser.companyId]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const stats = {
        validated: invoices.filter(i => i.status === 'Validée').length,
        pending: invoices.filter(i => i.status === 'Brouillon' || i.status === 'En cours' || i.status === 'En Attente').length,
        rejected: invoices.filter(i => i.status === 'Rejetée').length
    };

    const closeModal = () => setSelectedInvoice(null);

    const renderContent = () => {
        if (activeNav === 'gestion-facture') return <InvoiceManagement onDiagnostic={(inv) => { setDiagnosticInvoice(inv); setActiveNav('diagnostic'); }} />;
        if (activeNav === 'profile') return <CompanyProfile />;
        if (activeNav === 'fiscal') return <TaxDeclaration />;
        if (activeNav === 'stats') return <Statistics />;
        if (activeNav === 'referentiel') return <ClientsProducts />;
        if (activeNav === 'list-validated' || activeNav === 'list-pending' || activeNav === 'list-rejected') {
            const initialFilter = activeNav === 'list-validated' ? 'validated' : (activeNav === 'list-pending' ? 'pending' : 'rejected');
            return <InvoiceLists initialFilter={initialFilter} onErrorClick={(inv) => { setDiagnosticInvoice(inv); setActiveNav('diagnostic'); }} />;
        }
        if (activeNav === 'diagnostic') return <ErrorDiagnostic invoice={diagnosticInvoice} onBack={() => setActiveNav('list-rejected')} />;

        return (
            <>
                <div className="page-header">
                    <h1>Tableau de Bord</h1>
                    <p>Bienvenue sur votre espace de gestion de factures électroniques conforme TEIF XML.</p>
                </div>

                <div className="stat-cards">
                    <div className="stat-card green" onClick={() => setActiveNav('list-validated')} style={{ cursor: 'pointer' }}>
                        <div className="stat-card-top">
                            <div className="stat-icon green">✨</div>
                            <span className="stat-badge green">Optimisé</span>
                        </div>
                        <div className="stat-label">Factures Validées</div>
                        <div className="stat-value">{stats.validated}</div>
                    </div>
                    <div className="stat-card orange" onClick={() => setActiveNav('list-pending')} style={{ cursor: 'pointer' }}>
                        <div className="stat-card-top">
                            <div className="stat-icon orange">🔔</div>
                            <span className="stat-badge orange">Action requise</span>
                        </div>
                        <div className="stat-label">En Attente</div>
                        <div className="stat-value">{stats.pending}</div>
                    </div>
                    <div className="stat-card red" onClick={() => setActiveNav('list-rejected')} style={{ cursor: 'pointer' }}>
                        <div className="stat-card-top">
                            <div className="stat-icon red">❌</div>
                            <span className="stat-badge red">Erreurs</span>
                        </div>
                        <div className="stat-label">Rejetées / Erreurs</div>
                        <div className="stat-value">{stats.rejected.toString().padStart(2, '0')}</div>
                    </div>
                </div>

                <div className="bottom-panels solo">
                    <div className="history-panel">
                        <div className="history-header">
                            <h3>Historique des Flux</h3>
                            <button className="filter-btn">Filtrer</button>
                        </div>
                        <table className="flux-table">
                            <thead>
                                <tr>
                                    <th>ID Transaction</th>
                                    <th>N° Facture</th>
                                    <th>Date Dépôt</th>
                                    <th>Montant TTC</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.slice(0, 5).map((row) => (
                                    <tr key={row.id}>
                                        <td><span className="tx-id">EF-{row.id.toString().padStart(5, '0')}</span></td>
                                        <td><div className="facture-num">{row.invoiceNumber}</div></td>
                                        <td><div className="date-cell">{new Date(row.date).toLocaleDateString('fr-TN')}</div></td>
                                        <td><span className="amount-cell">{parseFloat(row.totalTTC).toFixed(3)} DT</span></td>
                                        <td><StatusBadge statut={row.status} /></td>
                                        <td>
                                            <div className="actions-cell">
                                                <button className="action-btn" onClick={() => setSelectedInvoice(row)}>👁️</button>
                                                <button className="action-btn">📥</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {invoices.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                            Aucune transaction pour le moment.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">EF</div>
                    <div className="sidebar-logo-info">
                        <h2>El Fatoora</h2>
                        <span>E-Invoicing Platform</span>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    {NAV_ITEMS.map((item) => (
                        <button key={item.key} className={`nav-item ${activeNav === item.key ? 'active' : ''}`} onClick={() => setActiveNav(item.key)}>
                            {item.icon} {item.label}
                        </button>
                    ))}
                    <div className="nav-section-label">Assistance</div>
                    <button className="nav-item">Support</button>
                    <button className="nav-item logout-item" onClick={onLogout} style={{ marginTop: 'auto', color: '#ef4444' }}>
                        Se déconnecter
                    </button>
                </nav>
                <div className="sidebar-user" onClick={() => setActiveNav('profile')} style={{ cursor: 'pointer' }}>
                    <div className="user-avatar">{savedUser.name?.charAt(0) || 'U'}</div>
                    <div className="user-info">
                        <h4>{companyName}</h4>
                        <span>{savedUser.email}</span>
                    </div>
                </div>
            </aside>

            <div className="main-area">
                <header className="topbar">
                    <div className="topbar-left">
                        {activeNav !== 'accueil' && (
                            <button className="back-btn-header" onClick={() => setActiveNav('accueil')}>
                                Retour
                            </button>
                        )}
                        <div className="topbar-search">
                            <input type="text" placeholder="Rechercher une facture..." />
                        </div>
                    </div>
                    <div className="topbar-right">
                        <button className="notif-btn">🔔</button>
                        <button className="company-selector" onClick={() => setActiveNav('profile')}>{companyName} ▾</button>
                        <button className="logout-btn-top" onClick={onLogout}>🚪</button>
                    </div>
                </header>

                <main className="page-content">{renderContent()}</main>

                {selectedInvoice && (
                    <div className="invoice-modal-overlay" onClick={closeModal} style={{ zIndex: 3000 }}>
                        <div className="invoice-modal-content" onClick={(e) => e.stopPropagation()}>
                            <button className="close-modal-btn" onClick={closeModal}>✕</button>
                            <div className="invoice-paper">
                                <header className="paper-header">
                                    <div className="company-branding">
                                        <div className="logo-placeholder">EF</div>
                                        <div>
                                            <h3>{savedUser.entreprise}</h3>
                                            <p>{savedUser.address || 'Tunis, Tunisie'}</p>
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
                                        <p><strong>{savedUser.entreprise}</strong></p>
                                        <p>Mat: {savedUser.matriculeFiscal}</p>
                                    </div>
                                    <div className="bill-col">
                                        <span>DESTINATAIRE</span>
                                        <p><strong>{selectedInvoice.clientName}</strong></p>
                                        <p>Mat: {selectedInvoice.clientMatricule}</p>
                                    </div>
                                </div>
                                <table className="paper-table">
                                    <thead>
                                        <tr>
                                            <th>Description</th>
                                            <th className="text-right">Qté</th>
                                            <th className="text-right">Total HT</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedInvoice.lines?.map((line, idx) => (
                                            <tr key={idx}>
                                                <td>{line.description}</td>
                                                <td className="text-right">{line.qty}</td>
                                                <td className="text-right">{parseFloat(line.totalHT).toFixed(3)} DT</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="invoice-summary-box">
                                    <div className="summary-row"><span>Total HT</span><span>{parseFloat(selectedInvoice.totalHT).toFixed(3)} DT</span></div>
                                    <div className="summary-row"><span>TVA</span><span>{parseFloat(selectedInvoice.totalTVA).toFixed(3)} DT</span></div>
                                    <div className="summary-row total"><span>MONTANT TTC</span><span>{parseFloat(selectedInvoice.totalTTC).toFixed(3)} DT</span></div>
                                </div>
                            </div>
                            <div className="modal-actions-footer">
                                <button className="btn-secondary" onClick={() => window.print()}>🖨️ Imprimer</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
