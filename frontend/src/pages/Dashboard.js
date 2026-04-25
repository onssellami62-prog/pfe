import React, { useState, useEffect, useCallback, useRef } from 'react';
import './Dashboard.css';
import { formatMatriculeDisplay, validateMatriculeFiscal } from '../utils/matriculeValidator';
import { amountToWords } from '../utils/amountToWords';
import CompanyProfile from './CompanyProfile';
import TaxDeclaration from './TaxDeclaration';
import Statistics from './Statistics';
import InvoiceLists from './InvoiceLists';
import ErrorDiagnostic from './ErrorDiagnostic';
import InvoiceManagement from './InvoiceManagement';
import ClientsProducts from './ClientsProducts';
import InvoicePreviewModal from './InvoicePreviewModal';

const API = 'http://localhost:5170/api';

const Icons = {
    Check: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    Clock: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    Alert: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    ),
    Bell: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    ),
    Logout: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    ),
    Eye: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    Download: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    ),
    Info: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    )
};

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
    let cls = 'en-cours';
    if (s.includes('valid')) cls = 'validee';
    else if (s.includes('rejet')) cls = 'rejetee';
    else if (s.includes('brouillon') || s.includes('attente')) cls = 'en-attente';

    const label = s === 'brouillon' ? 'EN ATTENTE' : (statut || 'EN COURS').toUpperCase();
    const normalizedCls = label.toLowerCase().replace(/\s+/g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // We keep using cls for mapping logic but can also use normalizedCls if we want to be very generic
    return <span className={`pill ${cls}`}>{label}</span>;
}

export default function Dashboard({ onLogout }) {
    const [activeNav, setActiveNav] = useState('accueil');
    const [invoices, setInvoices] = useState([]);
    const [diagnosticInvoice, setDiagnosticInvoice] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [user, setUser] = useState(() => JSON.parse(sessionStorage.getItem('user') || '{}'));
    const [showCompanyMenu, setShowCompanyMenu] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [contentVisible, setContentVisible] = useState(true);
    const pendingNavRef = useRef(null);
    const [companyLogo, setCompanyLogo] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const companyName = user.entreprise || 'Ma Societe';
    const hasMultipleCompanies = user.companies && user.companies.length > 1;

    const navigateTo = useCallback((target) => {
        if (target === activeNav) return;
        setContentVisible(false);
        pendingNavRef.current = target;
        setTimeout(() => {
            setActiveNav(target);
            setContentVisible(true);
        }, 180);
    }, [activeNav]);

    const fetchNotifications = useCallback(async () => {
        if (!user.userId) return;
        try {
            const res = await fetch(`${API}/Notifications?userId=${user.userId}`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.isRead).length);
            }
        } catch (err) { console.error('Notif error:', err); }
    }, [user.userId]);

    useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

    const markAsRead = async (id) => {
        await fetch(`${API}/Notifications/${id}/read`, { method: 'PUT' });
        fetchNotifications();
    };

    const markAllRead = async () => {
        await fetch(`${API}/Notifications/read-all?userId=${user.userId}`, { method: 'PUT' });
        fetchNotifications();
    };

    const timeAgo = (dateStr) => {
        // Convertir la date ISO en objet Date
        const date = new Date(dateStr);
        
        // Obtenir l'heure actuelle en UTC
        const now = new Date();
        
        // Calculer la différence en secondes
        const diff = (now.getTime() - date.getTime()) / 1000;
        
        if (diff < 60) return 'A l\'instant';
        if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
        if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
        if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`;
        
        // Pour les dates plus anciennes, afficher la date réelle
        return date.toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const notifIcon = (type) => {
        switch (type) {
            case 'invoice': return '\u{1F4C4}';
            case 'client': return '\u{1F464}';
            case 'product': return '\u{1F4E6}';
            case 'account': return '\u2705';
            case 'company': return '\u{1F3E2}';
            default: return '\u{1F514}';
        }
    };

    const fetchInvoices = useCallback(async () => {
        if (!user.companyId) return;
        try {
            const res = await fetch(`${API}/Invoices?companyId=${user.companyId}`);
            if (res.ok) {
                const data = await res.json();
                setInvoices(data);
            }
        } catch (error) {
            console.error("Erreur dashboard:", error);
        }
    }, [user.companyId]);

    useEffect(() => {
        if (!user.companyId) return;
        fetch(`${API}/Companies/${user.companyId}`)
            .then(r => r.json())
            .then(data => {
                if (data?.logoPath) setCompanyLogo(`http://localhost:5170/${data.logoPath}`);
                else setCompanyLogo(null);
                // Sync rne and phone to user state and sessionStorage
                if (data?.rne || data?.phone) {
                    setUser(prev => {
                        const updated = { 
                            ...prev, 
                            rne: data.rne || prev.rne || '',
                            phone: data.phone || prev.phone || ''
                        };
                        sessionStorage.setItem('user', JSON.stringify(updated));
                        return updated;
                    });
                }
            })
            .catch(() => setCompanyLogo(null));
    }, [user.companyId]);

    const handleCompanySwitch = (newCo) => {
        const updatedUser = { 
            ...user, 
            companyId: newCo.id, 
            entreprise: newCo.name, 
            matriculeFiscal: newCo.registrationNumber 
        };
        setUser(updatedUser);
        sessionStorage.setItem('user', JSON.stringify(updatedUser)); // Persistent update
        setShowCompanyMenu(false);
        // fetchInvoices will be triggered by effect below
    };

    useEffect(() => {
        fetchInvoices();
        setSearchTerm('');
    }, [fetchInvoices, user.companyId, activeNav]);

    const stats = {
        validated: invoices.filter(i => i.status === 'Validée').length,
        pending: invoices.filter(i => i.status === 'Brouillon' || i.status === 'En cours' || i.status === 'En Attente').length,
        rejected: invoices.filter(i => i.status === 'Rejetée').length
    };

    const closeModal = () => setSelectedInvoice(null);

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

    const renderContent = () => {
        if (activeNav === 'list-validated' || activeNav === 'list-pending' || activeNav === 'list-rejected') {
            const initialFilter = activeNav === 'list-validated' ? 'validated' : (activeNav === 'list-pending' ? 'pending' : 'rejected');
            return <InvoiceLists key={user.companyId} initialFilter={initialFilter} searchTerm={searchTerm} logo={companyLogo} onErrorClick={(inv) => { setDiagnosticInvoice(inv); navigateTo('diagnostic'); }} />;
        }
        if (activeNav === 'gestion-facture') return <InvoiceManagement key={user.companyId} searchTerm={searchTerm} logo={companyLogo} onBack={() => navigateTo('accueil')} />;
        if (activeNav === 'referentiel') return <ClientsProducts key={user.companyId} searchTerm={searchTerm} onBack={() => navigateTo('accueil')} />;
        if (activeNav === 'profile') return <CompanyProfile onLogout={onLogout} />;
        if (activeNav === 'fiscal') return <TaxDeclaration searchTerm={searchTerm} />;
        if (activeNav === 'stats') return <Statistics searchTerm={searchTerm} />;
        if (activeNav === 'diagnostic') return <ErrorDiagnostic invoice={diagnosticInvoice} onBack={() => navigateTo('list-rejected')} />;

        const filteredInvoices = invoices.filter(inv =>
            (inv.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (inv.clientName || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

        const sortedInvoices = [...filteredInvoices].sort((a, b) => {
            if (sortConfig.key === 'amount') {
                return sortConfig.direction === 'asc' ? (a.totalTTC - b.totalTTC) : (b.totalTTC - a.totalTTC);
            }
            if (sortConfig.key === 'date') {
                return sortConfig.direction === 'asc' ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date);
            }
            // Default string sort
            const valA = (a[sortConfig.key] || '').toString().toLowerCase();
            const valB = (b[sortConfig.key] || '').toString().toLowerCase();
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return (
            <>
                <div className="page-header">
                    <h1>Tableau de Bord</h1>
                    <p>Bienvenue sur votre espace de gestion de factures électroniques conforme TEIF XML.</p>
                </div>

                <div className="stat-cards">
                    <div className="stat-card" onClick={() => navigateTo('list-validated')} style={{ cursor: 'pointer' }}>
                        <div className="stat-card-header">
                            <div className="stat-icon"><Icons.Check /></div>
                            <div className="stat-info">
                                <div className="stat-label">Factures Validées</div>
                                <div className="stat-value">{stats.validated}</div>
                            </div>
                        </div>
                    </div>
                    <div className="stat-card" onClick={() => navigateTo('list-pending')} style={{ cursor: 'pointer' }}>
                        <div className="stat-card-header">
                            <div className="stat-icon"><Icons.Clock /></div>
                            <div className="stat-info">
                                <div className="stat-label">En Attente</div>
                                <div className="stat-value">{stats.pending}</div>
                            </div>
                        </div>
                    </div>
                    <div className="stat-card" onClick={() => navigateTo('list-rejected')} style={{ cursor: 'pointer' }}>
                        <div className="stat-card-header">
                            <div className="stat-icon"><Icons.Alert /></div>
                            <div className="stat-info">
                                <div className="stat-label">Rejetées / Erreurs</div>
                                <div className="stat-value">{stats.rejected.toString().padStart(2, '0')}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bottom-panels solo">
                    <div className="history-panel">
                        <div className="history-header">
                            <h3>Historique des Flux {searchTerm && <small style={{ color: '#64748b', fontSize: '0.8em', fontWeight: 'normal' }}> (Filtré: {searchTerm})</small>}</h3>
                            <button className="filter-btn" onClick={() => navigateTo('list-validated')}>Voir tout ↗</button>
                        </div>
                        <table className="flux-table">
                            <thead>
                                <tr>
                                    <th onClick={() => requestSort('invoiceNumber')} style={{ cursor: 'pointer' }}>
                                        Référence <span className="sort-icon">{getSortIcon('invoiceNumber')}</span>
                                    </th>
                                    <th onClick={() => requestSort('clientName')} style={{ cursor: 'pointer' }}>
                                        Client <span className="sort-icon">{getSortIcon('clientName')}</span>
                                    </th>
                                    <th onClick={() => requestSort('date')} style={{ cursor: 'pointer' }}>
                                        Date d'émission <span className="sort-icon">{getSortIcon('date')}</span>
                                    </th>
                                    <th onClick={() => requestSort('amount')} style={{ cursor: 'pointer' }}>
                                        Montant TTC <span className="sort-icon">{getSortIcon('amount')}</span>
                                    </th>
                                    <th onClick={() => requestSort('status')} style={{ cursor: 'pointer' }}>
                                        Statut <span className="sort-icon">{getSortIcon('status')}</span>
                                    </th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedInvoices.length > 0 ? sortedInvoices.slice(0, 8).map((row, i) => (
                                    <tr key={i}>
                                        <td><span className="facture-num">{row.invoiceNumber}</span></td>
                                        <td>
                                            <div className="client-cell">
                                                <span className="client-avatar">{row.clientName ? row.clientName.charAt(0) : '?'}</span>
                                                <span>{row.clientName}</span>
                                            </div>
                                        </td>
                                        <td className="date-cell">{new Date(row.date).toLocaleDateString('fr-TN')}</td>
                                        <td><span className="amount-cell">{parseFloat(row.totalTTC).toFixed(3)} DT</span></td>
                                        <td><StatusBadge statut={row.status} /></td>
                                        <td>
                                            <div className="actions-cell">
                                                <button className="action-btn" onClick={() => setSelectedInvoice(row)} title="Voir"><Icons.Eye /></button>
                                                <button className="action-btn" title="Télécharger"><Icons.Download /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                            {searchTerm ? 'Aucun résultat trouvé.' : 'Aucune transaction pour le moment.'}
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
                    {companyLogo ? (
                        <img src={companyLogo} alt="Logo" className="sidebar-company-logo" />
                    ) : (
                        <div className="sidebar-logo-icon">EF</div>
                    )}
                    <div className="sidebar-logo-info">
                        <h2>El Fatoora</h2>
                        <span>E-Invoicing Platform</span>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    {NAV_ITEMS.map((item) => (
                        <button key={item.key} className={`nav-item ${activeNav === item.key || (item.key === 'accueil' && ['list-validated','list-pending','list-rejected','diagnostic'].includes(activeNav)) ? 'active' : ''}`} onClick={() => navigateTo(item.key)}>
                            {item.icon} {item.label}
                        </button>
                    ))}
                    <div className="nav-section-label">Assistance</div>
                    <button className="nav-item">Support</button>
                    <button className="nav-item logout-item" onClick={onLogout} style={{ marginTop: 'auto', color: '#ef4444' }}>
                        Se déconnecter
                    </button>
                </nav>
                <div className="sidebar-user" onClick={() => navigateTo('profile')} style={{ cursor: 'pointer' }}>
                    {companyLogo ? (
                        <img src={companyLogo} alt="Logo" className="user-avatar-logo" />
                    ) : (
                        <div className="user-avatar">{user.name?.charAt(0) || 'U'}</div>
                    )}
                    <div className="user-info">
                        <h4>{companyName}</h4>
                        <span>{user.email}</span>
                    </div>
                </div>
            </aside>

            <div className="main-area">
                <header className="topbar">
                    <div className="topbar-left">
                        {activeNav !== 'accueil' && (
                            <button className="back-btn-header" onClick={() => navigateTo('accueil')}>
                                Retour
                            </button>
                        )}
                        <div className="topbar-search">
                            <input
                                type="text"
                                placeholder={activeNav === 'referentiel' ? 'Rechercher un client ou produit...' : 'Rechercher une facture...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="topbar-right">
                        <div className="notif-wrapper">
                            <button className="notif-btn" onClick={() => setShowNotifPanel(!showNotifPanel)}>
                                <Icons.Bell />
                                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                            </button>
                            {showNotifPanel && (
                                <div className="notif-panel">
                                    <div className="notif-panel-header">
                                        <h4>Notifications</h4>
                                        {unreadCount > 0 && <button className="mark-all-btn" onClick={markAllRead}>Tout lire</button>}
                                        <button className="notif-close" onClick={() => setShowNotifPanel(false)}>&times;</button>
                                    </div>
                                    <div className="notif-panel-body">
                                        {notifications.length === 0 ? (
                                            <div className="notif-empty">Aucune notification</div>
                                        ) : notifications.map(n => (
                                            <div key={n.id} className={`notif-item ${n.isRead ? '' : 'unread'}`} onClick={() => { markAsRead(n.id); }}>
                                                <span className="notif-item-icon">{notifIcon(n.type)}</span>
                                                <div className="notif-item-content">
                                                    <p className="notif-item-title">{n.title}</p>
                                                    <p className="notif-item-msg">{n.message}</p>
                                                    <span className="notif-item-time">{timeAgo(n.createdAt)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="company-switch-anchor" style={{ position: 'relative' }}>
                            <button 
                                className={`company-selector ${hasMultipleCompanies ? 'multi' : ''}`} 
                                onClick={() => hasMultipleCompanies ? setShowCompanyMenu(!showCompanyMenu) : navigateTo('profile')}
                            >
                                {companyName} {hasMultipleCompanies ? '▾' : ''}
                            </button>
                            
                            {showCompanyMenu && hasMultipleCompanies && (
                                <div className="company-dropdown-menu">
                                    <div className="dropdown-header">Vos Sociétés</div>
                                    {user.companies.map(c => (
                                        <div 
                                            key={c.id} 
                                            className={`dropdown-item ${c.id === user.companyId ? 'active' : ''}`}
                                            onClick={() => handleCompanySwitch(c)}
                                        >
                                            <div className="item-name">{c.name}</div>
                                            <div className="item-mf">{c.registrationNumber}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button className="logout-btn-top" onClick={onLogout} title="Se déconnecter"><Icons.Logout /></button>
                    </div>
                </header>

                <main className={`page-content ${contentVisible ? 'content-enter' : 'content-exit'}`}>{renderContent()}</main>

                <InvoicePreviewModal 
                    isOpen={!!selectedInvoice}
                    onClose={closeModal}
                    invoice={selectedInvoice}
                    user={{ ...user, logo: companyLogo }}
                />
            </div>
        </div>
    );
}
