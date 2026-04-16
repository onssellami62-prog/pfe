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
import Gestionclients from './Gestionclients';
import GestionAvoirs from './Gestionavoirs';

export default function Dashboard({ onLogout, user }) {
    const [activeNav, setActiveNav]                 = useState('accueil');
    const [diagnosticInvoice, setDiagnosticInvoice] = useState(null);
    const [gestionOpen, setGestionOpen]             = useState(false);
const [invoiceFilter, setInvoiceFilter] = useState('Tous les statuts');
    const initiales = user?.name
        ? user.name.substring(0, 2).toUpperCase()
        : user?.email?.substring(0, 2).toUpperCase() || 'EF';

    const navTo = (key) => setActiveNav(key);

    const renderContent = () => {
        if (activeNav === 'avoirs') return <GestionAvoirs />;
        if (activeNav === 'clients') return <Gestionclients />;
        if (activeNav === 'create')   return <CreateInvoice />;
        if (activeNav === 'depot')    return <ImportInvoice />;
      // Après
if (activeNav === 'factures') return (
    <InvoiceLists
        initialFilter={invoiceFilter === 'Validé' ? 'validated' : 
                       invoiceFilter === 'Rejetée' ? 'rejected' : 'validated'}
        onErrorClick={(inv) => { setDiagnosticInvoice(inv); navTo('diagnostic'); }}
    />
);
        if (activeNav === 'stats')    return <Statistics />;
        if (activeNav === 'fiscal')   return <TaxDeclaration />;
        if (activeNav === 'profile') return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
        <CompanyProfile onClose={() => navTo('accueil')} />
    </div>
);
        if (activeNav === 'list-validated') return <InvoiceLists initialFilter="validated" />;
        if (activeNav === 'list-rejected')  return (
            <InvoiceLists
                initialFilter="rejected"
                onErrorClick={(inv) => { setDiagnosticInvoice(inv); navTo('diagnostic'); }}
            />
        );
        if (activeNav === 'diagnostic') return (
            <ErrorDiagnostic invoice={diagnosticInvoice} onBack={() => navTo('list-rejected')} />
        );

        // ── Accueil ─────────────────────────────────────────────────────
        return (
            <div className="home-page">
                <div className="welcome-card">
                    <div className="welcome-avatar">{initiales}</div>
                    <div className="welcome-text">
                        <h1>Bienvenue, {user?.name || user?.email || 'Utilisateur'} 👋</h1>
                        <p>Vous êtes connecté à El Fatoora, votre plateforme de facturation électronique conforme TEIF.</p>
                    </div>
                    <div className="welcome-date">
                        {new Date().toLocaleDateString('fr-TN', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        })}
                    </div>
                </div>

                <div className="home-stats">
                    <div className="home-stat-card green" onClick={() => { setInvoiceFilter('Validé'); navTo('factures'); }}style={{ cursor: 'pointer' }}>
                        <div className="home-stat-top">
                            <div className="home-stat-icon green">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" />
                                </svg>
                            </div>
                            <span className="home-stat-badge green">+12% vs hier</span>
                        </div>
                        <div className="home-stat-label">Factures Acceptées</div>
                        <div className="home-stat-value">128</div>
                    </div>

                    <div className="home-stat-card red" onClick={() => { setInvoiceFilter('Rejetée'); navTo('factures'); }}style={{ cursor: 'pointer' }}>
                        <div className="home-stat-top">
                            <div className="home-stat-icon red">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                            </div>
                            <span className="home-stat-badge red">-1% vs hier</span>
                        </div>
                        <div className="home-stat-label">Factures Refusées</div>
                        <div className="home-stat-value">03</div>
                    </div>
                </div>
            </div>
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
                    {/* Accueil */}
                    <button className={`nav-item ${activeNav === 'accueil' ? 'active' : ''}`} onClick={() => navTo('accueil')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        Accueil
                    </button>
                    <button
    className={`nav-item ${activeNav === 'clients' ? 'active' : ''}`}
    onClick={() => navTo('clients')}
>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
    Gestion Clients
</button>
                    {/* Gestion Factures */}
                    <button className={`nav-item nav-parent ${gestionOpen ? 'open' : ''}`} onClick={() => setGestionOpen(!gestionOpen)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        Gestion Factures
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            style={{ marginLeft: 'auto', transition: 'transform 0.2s', transform: gestionOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>

                    {gestionOpen && (
                        <div className="submenu">
                            <button className={`nav-item submenu-item ${activeNav === 'create' ? 'active' : ''}`} onClick={() => navTo('create')}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Créer une Facture
                            </button>
                            <button className={`nav-item submenu-item ${activeNav === 'depot' ? 'active' : ''}`} onClick={() => navTo('depot')}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="16 16 12 12 8 16" />
                                    <line x1="12" y1="12" x2="12" y2="21" />
                                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                                </svg>
                                Dépôt Facture
                            </button>
                            <button className={`nav-item submenu-item ${activeNav === 'factures' ? 'active' : ''}`} onClick={() => navTo('factures')}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <line x1="3" y1="9" x2="21" y2="9" />
                                    <line x1="9" y1="21" x2="9" y2="9" />
                                </svg>
                                Mes Factures
                            </button>
                            <button
    className={`nav-item submenu-item ${activeNav === 'avoirs' ? 'active' : ''}`}
    onClick={() => navTo('avoirs')}
>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
    Avoirs
</button>
                        </div>
                    )}

                    {/* Déclaration Fiscale */}
                    <button className={`nav-item ${activeNav === 'fiscal' ? 'active' : ''}`} onClick={() => navTo('fiscal')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <path d="M8 13h8M8 17h5" />
                        </svg>
                        Déclaration Fiscale
                    </button>

                    {/* Statistiques */}
                    <button className={`nav-item ${activeNav === 'stats' ? 'active' : ''}`} onClick={() => navTo('stats')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="20" x2="18" y2="10" />
                            <line x1="12" y1="20" x2="12" y2="4" />
                            <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                        Statistiques
                    </button>

                    <div className="nav-section-label">Assistance</div>

                    <button className="nav-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        Support
                    </button>

                    <button className="nav-item logout-item" onClick={onLogout} style={{ color: '#ef4444' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Se déconnecter
                    </button>
                </nav>

                <div className={`sidebar-user ${activeNav === 'profile' ? 'active' : ''}`} onClick={() => navTo('profile')} style={{ cursor: 'pointer' }}>
                    <div className="user-avatar">{initiales}</div>
                    <div className="user-info">
                        <h4>{user?.name || user?.email || 'Utilisateur'}</h4>
                        <span>{user?.role || 'Admin'}</span>
                    </div>
                </div>
            </aside>

            <div className="main-area">
                <header className="topbar">
                    <div className="topbar-search" style={{ position: 'relative' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input type="text" placeholder="Rechercher une facture..." style={{ paddingLeft: 36 }} />
                    </div>
                    <div className="topbar-right">
                        <button className="notif-btn">🔔</button>
                        <button className="company-selector" onClick={() => navTo('profile')}>
                            {user?.name || user?.email || 'Mon compte'} ▾
                        </button>
                        <button className="logout-btn-top" onClick={onLogout} title="Se déconnecter">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </button>
                    </div>
                </header>

                <main className={`page-content ${activeNav === 'profile' ? 'no-padding' : ''}`}>
    {renderContent()}
</main>
            </div>
        </div>
    );
}