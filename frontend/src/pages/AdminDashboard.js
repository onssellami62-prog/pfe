import React, { useState } from 'react';
import './AdminDashboard.css';

const AdminDashboard = ({ user, onLogout }) => {
  const [activeNav, setActiveNav] = useState('dashboard');
  
  // Data State
  const [companies, setCompanies] = useState([
    { id: '123-456-789-00', name: 'Sarl Med-Supply', lastDecl: '12 Oct 2023', status: 'Valide', warning: false },
    { id: '987-654-321-11', name: 'EURL Building-DZ', lastDecl: '08 Oct 2023', status: 'Valide', warning: false },
    { id: '445-556-667-88', name: 'Transport Express', lastDecl: '02 Oct 2023', status: 'Expire dans 3j', warning: true },
    { id: '778-889-990-11', name: 'Algeria Tech Hub', lastDecl: '28 Sep 2023', status: 'Valide', warning: false },
  ]);

  const [usersList, setUsersList] = useState([
    { id: 1, name: 'User Test', email: 'test@gmail.com', role: 'Client', status: 'Actif', lastActive: 'Il y a 5 min' },
  ]);

  const [certificates, setCertificates] = useState([
    { owner: 'Ste. Alpha Dashboard', serial: 'SN-7822-X9', issued: '01/01/2024', expiry: '01/01/2026', type: 'RNE / XML-TEIF', status: 'Valide' },
    { owner: 'Sarl Med-Supply', serial: 'SN-9912-B2', issued: '15/03/2024', expiry: '15/03/2025', type: 'Corporate', status: 'Valide' },
    { owner: 'Algeria Tech Hub', serial: 'SN-1022-K1', issued: '12/10/2023', expiry: '12/10/2024', type: 'Cloud Sign', status: 'Valide' },
  ]);

  // Modal State
  const [userModal, setUserModal] = useState({ isOpen: false, data: null, mode: 'edit' });
  const [companyModal, setCompanyModal] = useState({ isOpen: false, data: null, mode: 'edit' });
  const [certModal, setCertModal] = useState({ isOpen: false, data: null, mode: 'edit' });

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'AD';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  /** ─── USER CRUD ─── **/
  const openUserModal = (mode, user = null) => {
    setUserModal({
      isOpen: true,
      mode: mode,
      data: user || { name: '', email: '', role: 'Client', status: 'Actif' }
    });
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedData = {
      ...userModal.data,
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      role: formData.get('role'),
      status: formData.get('status'),
      lastActive: userModal.mode === 'add' ? 'Jamais' : userModal.data.lastActive
    };

    if (userModal.mode === 'add') {
      updatedData.id = Date.now();
      setUsersList([...usersList, updatedData]);
    } else {
      setUsersList(usersList.map(u => u.id === updatedData.id ? updatedData : u));
    }
    setUserModal({ isOpen: false, data: null });
  };

  const handleDeleteUser = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      setUsersList(usersList.filter(u => u.id !== id));
      setUserModal({ isOpen: false, data: null });
    }
  };

  /** ─── COMPANY CRUD ─── **/
  const openCompanyModal = (mode, company = null) => {
    setCompanyModal({
      isOpen: true,
      mode: mode,
      data: company || { name: '', id: '', status: 'Valide', warning: false, lastDecl: 'Aucune' }
    });
  };

  const handleSaveCompany = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedData = {
      ...companyModal.data,
      name: formData.get('name'),
      id: formData.get('id'),
      status: formData.get('status'),
      warning: formData.get('status') !== 'Valide'
    };

    if (companyModal.mode === 'add') {
      setCompanies([...companies, updatedData]);
    } else {
      setCompanies(companies.map(c => c.id === companyModal.data.id ? updatedData : c));
    }
    setCompanyModal({ isOpen: false, data: null });
  };

  const handleDeleteCompany = (id) => {
    if (window.confirm('Supprimer définitivement cette société ?')) {
      setCompanies(companies.filter(c => c.id !== id));
      setCompanyModal({ isOpen: false, data: null });
    }
  };

  /** ─── CERTIFICATE CRUD ─── **/
  const openCertModal = (mode, cert = null) => {
    setCertModal({
      isOpen: true,
      mode: mode,
      data: cert || { owner: '', serial: '', issued: '', expiry: '', type: 'Corporate', status: 'Valide' }
    });
  };

  const handleSaveCert = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedData = {
      ...certModal.data,
      owner: formData.get('owner'),
      serial: formData.get('serial'),
      issued: formData.get('issued'),
      expiry: formData.get('expiry'),
      type: formData.get('type')
    };

    if (certModal.mode === 'add') {
      setCertificates([...certificates, updatedData]);
    } else {
      setCertificates(certificates.map(c => c.serial === certModal.data.serial ? updatedData : c));
    }
    setCertModal({ isOpen: false, data: null });
  };

  const handleDeleteCert = (serial) => {
    if (window.confirm(`Supprimer définitivement le certificat ${serial} ?`)) {
      setCertificates(certificates.filter(c => c.serial !== serial));
      setCertModal({ isOpen: false, data: null });
    }
  };

  const handleRevokeCertificate = (serial) => {
    if (window.confirm(`Êtes-vous sûr de vouloir révoquer le certificat ${serial} ?`)) {
      setCertificates(certificates.map(c => 
        c.serial === serial ? { ...c, status: 'Révoqué' } : c
      ));
    }
  };

  const KPI_DATA = [
    { label: 'Total Companies', value: companies.length, trend: '+12.5% this month', trendUp: true, icon: '🏢' },
    { label: 'Active Certificates', value: '892', trend: '94% Compliance rate', trendUp: true, icon: '🛡️' },
  ];

  const ACTIVITIES = [
    { user: 'Admin-02', action: 'a révoqué un certificat', time: 'il y a 14 minutes', company: 'Société Technix', type: 'security' },
    { user: 'Système', action: 'déclaration validée', time: 'il y a 1 heure', batch: 'Exportation Batch #12', type: 'description' },
    { user: 'Manager Alpha', action: 'nouvel utilisateur créé', time: 'il y a 3 heures', role: 'Auditeur', type: 'person_add' },
    { user: 'Serveur', action: 'synchronisation cloud', time: 'il y a 5 heures', status: 'Statut: OK', type: 'sync' },
  ];

  const CERTIFICATES = [
    { owner: 'Ste. Alpha Dashboard', serial: 'SN-7822-X9', issued: '01/01/2024', expiry: '01/01/2026', type: 'RNE / XML-TEIF' },
    { owner: 'Sarl Med-Supply', serial: 'SN-9912-B2', issued: '15/03/2024', expiry: '15/03/2025', type: 'Corporate' },
    { owner: 'Algeria Tech Hub', serial: 'SN-1022-K1', issued: '12/10/2023', expiry: '12/10/2024', type: 'Cloud Sign' },
  ];

  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL'];
  const CHART_VALUES = [40, 55, 45, 90, 60, 75, 85];

  const renderContent = () => {
    switch(activeNav) {
      case 'signatures':
        return (
          <div className="admin-content-view">
            <div className="view-header">
              <h3>Certificats & Signatures Électroniques</h3>
              <button className="btn-action" onClick={() => openCertModal('add')}><i>➕</i> Nouveau Certificat</button>
            </div>
            <div className="table-panel">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Titulaire</th>
                    <th>N° de Série</th>
                    <th>Émission</th>
                    <th>Expiration</th>
                    <th>Type</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((c, i) => (
                    <tr key={i}>
                      <td className="company-name">{c.owner}</td>
                      <td className="fiscal-id">{c.serial}</td>
                      <td>{c.issued}</td>
                      <td>{c.expiry}</td>
                      <td><span className="type-badge">{c.type}</span></td>
                      <td>
                        <span className={`status-badge-admin ${c.status === 'Révoqué' ? 'status-revoked' : ''}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex-actions-table">
                          <button 
                            className="btn-table-action" 
                            onClick={() => openCertModal('edit', c)}
                          >
                            ⚙️ Gérer
                          </button>
                          <button 
                            className="btn-table-action btn-danger-action" 
                            onClick={() => handleRevokeCertificate(c.serial)}
                            disabled={c.status === 'Révoqué'}
                          >
                            🔒 Révoquer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MODAL CERTIFICAT */}
            {certModal.isOpen && (
              <div className="admin-modal-overlay" onClick={() => setCertModal({ isOpen: false })}>
                <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>{certModal.mode === 'add' ? 'Créer un Certificat' : 'Modifier le Certificat'}</h3>
                    <button className="close-btn" onClick={() => setCertModal({ isOpen: false })}>✕</button>
                  </div>
                  <form onSubmit={handleSaveCert}>
                    <div className="modal-body">
                      <div className="edit-form">
                        <div className="form-row">
                          <label>Titulaire (Société liée)</label>
                          <select name="owner" defaultValue={certModal.data.owner} required>
                            {companies.map((c) => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                            <option value="Autre / Nom Personnel">Autre / Nom Personnel</option>
                          </select>
                        </div>
                        <div className="form-row">
                          <label>Numéro de Série</label>
                          <input name="serial" type="text" defaultValue={certModal.data.serial} required />
                        </div>
                        <div className="form-row">
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div className="form-row">
                              <label>Date Émission</label>
                              <input name="issued" type="text" defaultValue={certModal.data.issued} placeholder="JJ/MM/AAAA" />
                            </div>
                            <div className="form-row">
                              <label>Date Expiration</label>
                              <input name="expiry" type="text" defaultValue={certModal.data.expiry} placeholder="JJ/MM/AAAA" />
                            </div>
                          </div>
                        </div>
                        <div className="form-row">
                          <label>Type de Certificat</label>
                          <select name="type" defaultValue={certModal.data.type}>
                            <option value="RNE / XML-TEIF">RNE / XML-TEIF</option>
                            <option value="Corporate">Corporate</option>
                            <option value="Cloud Sign">Cloud Sign</option>
                            <option value="Digigo Personnel">Digigo Personnel</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      {certModal.mode === 'edit' && (
                        <button type="button" className="btn-delete-user" onClick={() => handleDeleteCert(certModal.data.serial)}>
                          Supprimer
                        </button>
                      )}
                      <div className="footer-right">
                        <button type="button" className="btn-cancel" onClick={() => setCertModal({ isOpen: false })}>Annuler</button>
                        <button type="submit" className="btn-save">Enregistrer</button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      case 'companies':
        return (
          <div className="admin-content-view">
            <div className="view-header">
              <h3>Gestion des Sociétés</h3>
              <button className="btn-action" onClick={() => openCompanyModal('add')}><i>➕</i> Ajouter une Société</button>
            </div>
            <div className="table-panel">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Dénomination</th>
                    <th>Identifiant Fiscal</th>
                    <th>Certificat</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c, i) => (
                    <tr key={i}>
                      <td className="company-name">{c.name}</td>
                      <td className="fiscal-id">{c.id}</td>
                      <td>
                        <div className={`certify-status ${c.warning ? 'status-warning' : 'status-valid'}`}>
                          {c.warning ? '⚠️' : '✅'} {c.status}
                        </div>
                      </td>
                      <td><span className="status-badge-admin">Actif</span></td>
                      <td>
                        <button 
                          className="btn-table-action"
                          onClick={() => openCompanyModal('edit', c)}
                        >
                          ✏️ Editer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MODAL SOCIETE */}
            {companyModal.isOpen && (
              <div className="admin-modal-overlay" onClick={() => setCompanyModal({ isOpen: false })}>
                <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>{companyModal.mode === 'add' ? 'Ajouter une Société' : 'Modifier la Société'}</h3>
                    <button className="close-btn" onClick={() => setCompanyModal({ isOpen: false })}>✕</button>
                  </div>
                  <form onSubmit={handleSaveCompany}>
                    <div className="modal-body">
                      <div className="edit-form">
                        <div className="form-row">
                          <label>Nom de la Société</label>
                          <input name="name" type="text" defaultValue={companyModal.data.name} required />
                        </div>
                        <div className="form-row">
                          <label>Identifiant Fiscal (NIF)</label>
                          <input name="id" type="text" defaultValue={companyModal.data.id} required />
                        </div>
                        <div className="form-row">
                          <label>Statut Certificat</label>
                          <select name="status" defaultValue={companyModal.data.status}>
                            <option value="Valide">Valide</option>
                            <option value="Expire bientôt">Expire bientôt</option>
                            <option value="Expiré">Expiré</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      {companyModal.mode === 'edit' && (
                        <button type="button" className="btn-delete-user" onClick={() => handleDeleteCompany(companyModal.data.id)}>
                          Supprimer
                        </button>
                      )}
                      <div className="footer-right">
                        <button type="button" className="btn-cancel" onClick={() => setCompanyModal({ isOpen: false })}>Annuler</button>
                        <button type="submit" className="btn-save">Enregistrer</button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      case 'users':
        return (
          <div className="admin-content-view">
            <div className="view-header">
              <h3>Gestion des Utilisateurs</h3>
              <button className="btn-action" onClick={() => openUserModal('add')}><i>➕</i> Nouvel Utilisateur</button>
            </div>
            <div className="table-panel">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Statut</th>
                    <th>Dernière Activité</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u, i) => (
                    <tr key={i}>
                      <td className="company-name">{u.name}</td>
                      <td className="fiscal-id">{u.email}</td>
                      <td><span className="role-badge">{u.role}</span></td>
                      <td>
                        <span className={`status-dot ${u.status === 'Actif' ? 'dot-online' : 'dot-offline'}`}></span>
                        {u.status}
                      </td>
                      <td>{u.lastActive}</td>
                      <td>
                        <button 
                          className="btn-table-action"
                          onClick={() => openUserModal('edit', u)}
                        >
                          ⚙️ Gérer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MODAL UTILISATEUR */}
            {userModal.isOpen && (
              <div className="admin-modal-overlay" onClick={() => setUserModal({ isOpen: false })}>
                <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>{userModal.mode === 'add' ? 'Créer un Utilisateur' : 'Gérer l\'utilisateur'}</h3>
                    <button className="close-btn" onClick={() => setUserModal({ isOpen: false })}>✕</button>
                  </div>
                  <form onSubmit={handleSaveUser}>
                    <div className="modal-body">
                      <div className="user-profile-summary">
                        <div className="large-avatar">{userModal.data.name ? userModal.data.name.charAt(0) : '?'}</div>
                        <div className="summary-info">
                          <h4>{userModal.data.name || 'Nouvel Utilisateur'}</h4>
                          <p>{userModal.data.email || 'Aucun email'}</p>
                        </div>
                      </div>

                      <div className="edit-form">
                        <div className="form-row">
                          <label>Nom complet</label>
                          <input name="name" type="text" defaultValue={userModal.data.name} required />
                        </div>
                        <div className="form-row">
                          <label>Email</label>
                          <input name="email" type="email" defaultValue={userModal.data.email} required />
                        </div>
                        <div className="form-row">
                          <label>Mot de passe</label>
                          <input name="password" type="password" placeholder="••••••••" required={userModal.mode === 'add'} />
                        </div>
                        <div className="form-row">
                          <label>Rôle Système</label>
                          <select name="role" defaultValue={userModal.data.role}>
                            <option value="Super Admin">Super Admin</option>
                            <option value="Auditeur">Auditeur</option>
                            <option value="Support">Support</option>
                            <option value="Client">Client</option>
                          </select>
                        </div>
                        <div className="form-row">
                          <label>Statut du compte</label>
                          <select name="status" defaultValue={userModal.data.status} className="status-select-custom">
                            <option value="Actif">Actif</option>
                            <option value="Inactif">Suspendu</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="modal-footer">
                      {userModal.mode === 'edit' && (
                        <button type="button" className="btn-delete-user" onClick={() => handleDeleteUser(userModal.data.id)}>
                          Supprimer l'accès
                        </button>
                      )}
                      <div className="footer-right">
                        <button type="button" className="btn-cancel" onClick={() => setUserModal({ isOpen: false })}>Annuler</button>
                        <button type="submit" className="btn-save">Enregistrer</button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return (
          <>
            <section className="dashboard-header">
              <div className="header-text">
                <h2>Tableau de Bord</h2>
                <p>Surveillance centralisée de l'activité fiscale et des certifications électroniques pour l'ensemble du réseau El Fatoora.</p>
              </div>
              <div className="header-actions">
                <button className="btn-filter"><i>📅</i> Derniers 30 Jours</button>
              </div>
            </section>

            <div className="kpi-row">
              {KPI_DATA.map((kpi, idx) => (
                <div key={idx} className="kpi-card">
                  <div className="kpi-label"><i>{kpi.icon}</i> {kpi.label}</div>
                  <div className="kpi-value">{kpi.value}</div>
                  <div className={`kpi-trend ${kpi.trendUp ? 'trend-up' : 'trend-down'}`}>
                    {kpi.trendUp ? '↗️ ' : '⚠️ '} {kpi.trend}
                  </div>
                </div>
              ))}
              <div className="report-card">
                <div>
                  <h4>Quick Reports</h4>
                  <h3>Générer le rapport fiscal trimestriel</h3>
                </div>
                <button className="btn-download">Télécharger PDF</button>
              </div>
            </div>

            <div className="main-grid">
              <div className="chart-panel">
                <div className="panel-header">
                  <h3>Croissance des Déclarations</h3>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Fréquence de dépôt électronique par région</div>
                </div>
                <div className="chart-placeholder">
                  {MONTHS.map((m, i) => (
                    <div key={m} className="chart-bar" data-month={m}>
                      <div className="bar-inner" style={{ height: `${CHART_VALUES[i]}%`, opacity: m === 'APR' ? 1 : 0.4 }}></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="activity-panel">
                <div className="panel-header">
                  <h3>Activités Récentes</h3>
                </div>
                <div className="activity-list">
                  {ACTIVITIES.map((act, i) => (
                    <div key={i} className="activity-item">
                      <div className="activity-icon">
                        {act.type === 'security' ? '🔒' : act.type === 'description' ? '📄' : act.type === 'person_add' ? '👤' : '🔄'}
                      </div>
                      <div className="activity-details">
                        <p><strong>{act.user}</strong> {act.action}</p>
                        <span>{act.time} • {act.company || act.batch || act.role || act.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="btn-history">VOIR TOUT L'HISTORIQUE</button>
              </div>
            </div>

            <div className="table-panel">
              <div className="table-panel-header">
                <h3>Sociétés Récemment Actives</h3>
                <div className="table-tabs">
                  <button className="tab-btn active">FILTRER PAR STATUT</button>
                  <button className="tab-btn">VOIR ARCHIVÉES</button>
                </div>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Société</th>
                    <th>Identifiant Fiscal</th>
                    <th>Certificat</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.slice(0, 4).map((c, i) => (
                    <tr key={i}>
                      <td className="company-name">{c.name}</td>
                      <td className="fiscal-id">{c.id}</td>
                      <td>
                        <div className={`certify-status ${c.warning ? 'status-warning' : 'status-valid'}`}>
                          {c.warning ? '⚠️' : '✅'} {c.status}
                        </div>
                      </td>
                      <td><button className="btn-table-action" onClick={() => setActiveNav('companies')}>Détails</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        );
    }
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-logo">
            <h1>El Fatoora</h1>
            <span>Administration Panel</span>
          </div>
        </div>

        <nav className="admin-nav">
          <button 
            className={`admin-nav-item ${activeNav === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveNav('dashboard')}
          >
            <i>📊</i> Dashboard
          </button>
          <button 
            className={`admin-nav-item ${activeNav === 'signatures' ? 'active' : ''}`}
            onClick={() => setActiveNav('signatures')}
          >
            <i>🔐</i> Certificat Électronique
          </button>
          <button 
            className={`admin-nav-item ${activeNav === 'companies' ? 'active' : ''}`}
            onClick={() => setActiveNav('companies')}
          >
            <i>🏢</i> Gérer Société
          </button>
          <button 
            className={`admin-nav-item ${activeNav === 'users' ? 'active' : ''}`}
            onClick={() => setActiveNav('users')}
          >
            <i>👥</i> Gérer Utilisateurs
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-profile-card">
            <div className="admin-avatar">{user?.name ? getInitials(user.name) : 'AD'}</div>
            <div className="admin-profile-info">
              <h4>{user?.name || 'Admin Central'}</h4>
              <p>{user?.email || 'fatoora.admin@gov.dz'}</p>
            </div>
            <button 
              onClick={onLogout}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
              title="Se déconnecter"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-top-actions">
            <span>🔔</span>
            <span>⚙️</span>
            <span>❓</span>
          </div>
        </header>

        {renderContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;
