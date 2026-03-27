import React, { useState } from 'react';
import './Dashboard.css';
import ImportInvoice from './ImportInvoice';
import CreateInvoice from './CreateInvoice';
import CompanyProfile from './CompanyProfile';
import TaxDeclaration from './TaxDeclaration';
import MyInvoices from './MyInvoices';
import Statistics from './Statistics';
import InvoiceLists from './InvoiceLists';
import ErrorDiagnostic from './ErrorDiagnostic';

/* ── Mock data ── */
const FLUX_DATA = [
    { id: 'EF-98234-X', facture: 'FAC-2023-0041', date: '22 Mai 2024', montant: '1,240.00 DT', statut: 'Validé' },
    { id: 'EF-98231-A', facture: 'FAC-2023-0042', date: '22 Mai 2024', montant: '450.50 DT', statut: 'En cours' },
    { id: 'EF-98229-B', facture: 'FAC-2023-0043', date: '21 Mai 2024', montant: '2,100.00 DT', statut: 'Rejeté' },
    { id: 'EF-98211-C', facture: 'FAC-2023-0044', date: '20 Mai 2024', montant: '89.90 DT', statut: 'Validé' },
];

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
        key: 'depot', label: 'Dépôt de Facture',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 16 12 12 8 16" />
                <line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
            </svg>
        ),
    },
    {
        key: 'create', label: 'Créer une Facture',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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
        key: 'factures', label: 'Mes Factures',
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
        key: 'stats', label: 'Statistiques',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
        ),
    },
];

/* ── Status badge helper ── */
function StatusBadge({ statut }) {
    const cls = statut === 'Validé' ? 'valide' : statut === 'En cours' ? 'en-cours' : 'rejete';
    return <span className={`status-badge ${cls}`}>{statut}</span>;
}

/* ══════════════════════════════════════════════════
   DASHBOARD COMPONENT
   ══════════════════════════════════════════════════ */
export default function Dashboard({ onLogout }) {
    const [activeNav, setActiveNav] = useState('accueil');
    const [diagnosticInvoice, setDiagnosticInvoice] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const closeModal = () => setSelectedInvoice(null);

    // Content rendering logic
    const renderContent = () => {
        if (activeNav === 'depot') return <ImportInvoice />;
        if (activeNav === 'create') return <CreateInvoice />;
        if (activeNav === 'profile') return <CompanyProfile />;
        if (activeNav === 'fiscal') return <TaxDeclaration />;
        if (activeNav === 'factures') return <MyInvoices onNewInvoice={() => setActiveNav('create')} />;
        if (activeNav === 'stats') return <Statistics />;

        // Deep navigation for invoice lists
        if (activeNav === 'list-validated') return <InvoiceLists initialFilter="validated" />;
        if (activeNav === 'list-pending') return <InvoiceLists initialFilter="pending" />;
        if (activeNav === 'list-rejected') return <InvoiceLists initialFilter="rejected" onErrorClick={(inv) => { setDiagnosticInvoice(inv); setActiveNav('diagnostic'); }} />;

        // Diagnostic Error Page
        if (activeNav === 'diagnostic') return <ErrorDiagnostic invoice={diagnosticInvoice} onBack={() => setActiveNav('list-rejected')} />;

        // Default: Accueil content
        return (
            <>
                {/* Header */}
                <div className="page-header">
                    <h1>Tableau de Bord</h1>
                    <p>Bienvenue sur votre espace de gestion de factures électroniques conforme TEIF XML.</p>
                </div>

                {/* ── STAT CARDS ── */}
                <div className="stat-cards">
                    <div className="stat-card green" onClick={() => setActiveNav('list-validated')} style={{ cursor: 'pointer' }}>
                        <div className="stat-card-top">
                            <div className="stat-icon green">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="9 12 11 14 15 10" />
                                </svg>
                            </div>
                            <span className="stat-badge green">+12% vs hier</span>
                        </div>
                        <div className="stat-label">Factures Validées</div>
                        <div className="stat-value">128</div>
                    </div>

                    <div className="stat-card orange" onClick={() => setActiveNav('list-pending')} style={{ cursor: 'pointer' }}>
                        <div className="stat-card-top">
                            <div className="stat-icon orange">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                            </div>
                            <span className="stat-badge orange">+2% vs hier</span>
                        </div>
                        <div className="stat-label">En Attente</div>
                        <div className="stat-value">12</div>
                    </div>

                    <div className="stat-card red" onClick={() => setActiveNav('list-rejected')} style={{ cursor: 'pointer' }}>
                        <div className="stat-card-top">
                            <div className="stat-icon red">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                            </div>
                            <span className="stat-badge red">-1% vs hier</span>
                        </div>
                        <div className="stat-label">Rejetées / Erreurs</div>
                        <div className="stat-value">03</div>
                    </div>
                </div>

                <div className="bottom-panels">
                    <div className="upload-panel">
                        <h3>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="16 16 12 12 8 16" />
                                <line x1="12" y1="12" x2="12" y2="21" />
                                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                            </svg>
                            Dépôt de Facture
                        </h3>

                        <div
                            className="dropzone"
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
                            style={dragOver ? { borderColor: '#1a56db', background: '#eff6ff' } : {}}
                        >
                            <div className="dropzone-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="16 16 12 12 8 16" />
                                    <line x1="12" y1="12" x2="12" y2="21" />
                                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                                </svg>
                            </div>
                            <h4>Glissez-déposez vos fichiers XML</h4>
                            <p>Supporté: Format XML TEIF uniquement</p>
                            <span className="dropzone-link">Parcourir les fichiers</span>
                        </div>

                        <button className="btn-send">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                            Signer et Envoyer
                        </button>
                    </div>

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
                                {FLUX_DATA.map((row) => (
                                    <tr key={row.id}>
                                        <td><span className="tx-id">{row.id}</span></td>
                                        <td><div className="facture-num">{row.facture}</div></td>
                                        <td><div className="date-cell">{row.date}</div></td>
                                        <td><span className="amount-cell">{row.montant}</span></td>
                                        <td><StatusBadge statut={row.statut} /></td>
                                        <td>
                                            <div className="actions-cell">
                                                <button className="action-btn" onClick={() => setSelectedInvoice({ id: row.facture, date: row.date, client: 'Client Inconnu', amount: row.montant })}>👁️</button>
                                                <button className="action-btn">📥</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
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
                        <button
                            key={item.key}
                            className={`nav-item ${activeNav === item.key ? 'active' : ''}`}
                            onClick={() => setActiveNav(item.key)}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                    <div className="nav-section-label">Assistance</div>
                    <button className="nav-item">Support</button>
                    <button
                        className="nav-item logout-item"
                        onClick={onLogout}
                        style={{ marginTop: 'auto', color: '#ef4444' }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Se déconnecter
                    </button>
                </nav>

                <div
                    className={`sidebar-user ${activeNav === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveNav('profile')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="user-avatar">SA</div>
                    <div className="user-info">
                        <h4>Ste. Alpha</h4>
                        <span>Mat: 1234567/A</span>
                    </div>
                </div>
            </aside>

            <div className="main-area">
                <header className="topbar">
                    <div className="topbar-search">
                        <input type="text" placeholder="Rechercher une facture..." />
                    </div>
                    <div className="topbar-right">
                        <button className="notif-btn">🔔</button>
                        <button
                            className="company-selector"
                            onClick={() => setActiveNav('profile')}
                        >
                            Sté Alpha Dashboard ▾
                        </button>
                        <button
                            className="logout-btn-top"
                            onClick={onLogout}
                            title="Se déconnecter"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </button>
                    </div>
                </header>

                <main className="page-content">
                    {renderContent()}
                </main>

                {/* MODAL INVOICE VIEW */}
                {selectedInvoice && (
                    <div className="invoice-modal-overlay" onClick={closeModal} style={{ zIndex: 3000 }}>
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
                                        <p><strong>{selectedInvoice.client || 'Client Professionnel'}</strong></p>
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
                                            <td className="text-right">{selectedInvoice.amount}</td>
                                            <td className="text-right">{selectedInvoice.amount}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                <div className="invoice-summary-box">
                                    <div className="summary-row total">
                                        <span>MONTANT TTC</span>
                                        <span>{selectedInvoice.amount}</span>
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
        </div>
    );
}

