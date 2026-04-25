import React, { useState, useEffect } from 'react';
import { validateMatriculeFiscal, getMatriculeError, MF_FORMAT_DISPLAY } from '../utils/matriculeValidator';
import './AdminDashboard.css';

const Icons = {
  Dashboard: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V19.875c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  ),
  Certificate: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751A11.959 11.959 0 0 1 12 2.714Z" />
    </svg>
  ),
  Company: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6.75h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
    </svg>
  ),
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '18px', height: '18px' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  Clock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '18px', height: '18px' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  Alert: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '18px', height: '18px' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008h-.008v-.008Z" />
    </svg>
  ),
  Plus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '16px', height: '16px' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  Gear: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '14px', height: '14px' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.592c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  ),
  Lock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '14px', height: '14px' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  ),
  Bell: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Help: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Calendar: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  TrendingUp: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  AlertTriangle: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  BuildingLine: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M8 10h.01" />
      <path d="M16 10h.01" />
      <path d="M8 14h.01" />
      <path d="M16 14h.01" />
    </svg>
  ),
  ShieldCheck: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  DocumentLine: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  UserLine: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Refresh: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
};

const AdminDashboard = ({ user, onLogout }) => {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // Data State
  const [companies, setCompanies] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [activities, setActivities] = useState([]);
  const [allActivitiesModal, setAllActivitiesModal] = useState({ isOpen: false });
  const [regionalData, setRegionalData] = useState([]);
  const [viewArchived, setViewArchived] = useState(false);
  const [userTab, setUserTab] = useState('active');
  const [chartReady, setChartReady] = useState(false);


  // Fetch users and companies from API
  useEffect(() => {
    if (activeNav === 'users' || activeNav === 'companies' || activeNav === 'dashboard') {
      fetchUsers();
    }

    if (activeNav === 'companies' || activeNav === 'dashboard') {
      fetchCompanies();
    }

    if (activeNav === 'dashboard') {
      fetchActivities();
      fetchRegionalStats();
    }
  }, [activeNav]);

  const fetchActivities = async () => {
    try {
      const response = await fetch('http://localhost:5170/api/Activities/recent');
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des activités:", error);
    }
  };

  const fetchRegionalStats = async () => {
    setChartReady(false);
    try {
      const response = await fetch('http://localhost:5170/api/Statistics/global/regional-distribution');
      if (response.ok) {
        const data = await response.json();
        setRegionalData(data);
        setTimeout(() => setChartReady(true), 150);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des stats régionales:", error);
    }
  };

  const fetchAllActivities = async () => {
    try {
      const response = await fetch('http://localhost:5170/api/Activities');
      if (response.ok) {
        const data = await response.json();
        setAllActivitiesModal({ isOpen: true, data: data });
      }
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique complet:", error);
    }
  };


  const fetchCompanies = async () => {
    try {
      const response = await fetch('http://localhost:5170/api/Companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des sociétés:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5170/api/Users');
      if (response.ok) {
        const data = await response.json();
        setUsersList(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
    }
  };

  const [certificates, setCertificates] = useState([
    { owner: 'Ste. Alpha Dashboard', serial: 'SN-7822-X9', issued: '01/01/2024', expiry: '01/01/2026', type: 'RNE / XML-TEIF', status: 'Valide' },
    { owner: 'Sarl Med-Supply', serial: 'SN-9912-B2', issued: '15/03/2024', expiry: '15/03/2025', type: 'Corporate', status: 'Valide' },
    { owner: 'Algeria Tech Hub', serial: 'SN-1022-K1', issued: '12/10/2023', expiry: '12/10/2024', type: 'Cloud Sign', status: 'Valide' },
  ]);

  // Modal State
  const [userModal, setUserModal] = useState({ isOpen: false, data: null, mode: 'edit' });
  const [companyModal, setCompanyModal] = useState({ isOpen: false, data: null, mode: 'edit' });
  const [certModal, setCertModal] = useState({ isOpen: false, data: null, mode: 'edit' });

  // Notifications logic
  const pendingUsersCount = usersList.filter(u => u.status === 'Pending').length;

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'AD';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Jamais';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /** ─── USER CRUD ─── **/
  const openUserModal = (mode, user = null) => {
    setUserModal({
      isOpen: true,
      mode: mode,
      data: user || { name: '', email: '', role: 'Client', status: 'Actif' }
    });
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const emailValue = formData.get('email')?.trim();

    // Validation email @gmail.com
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!gmailRegex.test(emailValue)) {
      alert("L'email doit être une adresse Gmail valide (exemple@gmail.com).");
      return;
    }

    // Validation complexité mot de passe (uniquement pour création)
    const passwordValue = formData.get('password');
    if (userModal.mode === 'add') {
      if (!passwordValue || passwordValue.length < 8 || !/[A-Z]/.test(passwordValue) || !/[a-z]/.test(passwordValue) || !/\d/.test(passwordValue) || !/[@#$*!]/.test(passwordValue)) {
        alert("Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@#$*!).");
        return;
      }
    }

    const updatedData = {
      ...userModal.data,
      name: formData.get('name'),
      email: emailValue,
      password: formData.get('password'),
      oldPassword: formData.get('oldPassword'),
      role: formData.get('role'),
      entreprise: formData.get('entreprise'),
      matriculeFiscal: formData.get('matriculeFiscal'),
      rne: formData.get('rne'),
      username: formData.get('email'),
    };

    // Validation changement mot de passe admin (ancien + nouveau requis ensemble)
    if (userModal.mode === 'edit' && userModal.data.role?.toLowerCase() === 'admin') {
      const oldPwd = updatedData.oldPassword;
      const newPwd = updatedData.password;
      if ((oldPwd && !newPwd) || (!oldPwd && newPwd)) {
        alert("Veuillez remplir l'ancien ET le nouveau mot de passe.");
        return;
      }
      if (newPwd && (newPwd.length < 8 || !/[A-Z]/.test(newPwd) || !/[a-z]/.test(newPwd) || !/\d/.test(newPwd) || !/[@#$*!]/.test(newPwd))) {
        alert("Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@#$*!).");
        return;
      }
    }

    try {
      if (userModal.mode === 'add') {
        const response = await fetch(`http://localhost:5170/api/Users?adminName=${user.name}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData)
        });
        if (response.ok) {
          fetchUsers();
          fetchActivities();
        }

      } else {
        // Mode édition : appel API PUT
        const response = await fetch(`http://localhost:5170/api/Users/${updatedData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData)
        });
        if (response.ok) {
          fetchUsers();
          // Afficher message de succès
          const msg = (updatedData.password && updatedData.oldPassword)
            ? 'Mot de passe modifié avec succès !'
            : 'Modifications enregistrées avec succès !';
          setUserModal(prev => ({ ...prev, successMsg: msg }));
          setTimeout(() => setUserModal({ isOpen: false, data: null }), 2000);
          return;
        } else {
          const errMsg = await response.text();
          alert(errMsg || "Erreur lors de la modification.");
        }
      }
    } catch (error) {
      console.error("Erreur de sauvegarde:", error);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir archiver cet utilisateur ?')) {
      try {
        const response = await fetch(`http://localhost:5170/api/Users/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) fetchUsers();
      } catch (error) {
        console.error("Erreur de suppression:", error);
      }
      setUserModal({ isOpen: false, data: null });
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5170/api/Users/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStatus)
      });
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
    }
  };

  /** ─── COMPANY CRUD ─── **/
  const openCompanyModal = (mode, company = null) => {
    setCompanyModal({
      isOpen: true,
      mode: mode,
      data: company || { name: '', registrationNumber: '', address: '', city: '', postalCode: '', phone: '', userId: null }
    });
  };

  const handleClientSelect = (userId) => {
    if (!userId) return;
    const selectedUser = usersList.find(u => u.id === parseInt(userId));
    if (selectedUser) {
      setCompanyModal(prev => ({
        ...prev,
        data: {
          ...prev.data,
          userId: selectedUser.id,
          name: selectedUser.entreprise || selectedUser.name,
          registrationNumber: selectedUser.matriculeFiscal || '',
          address: '',
          city: '',
          phone: ''
        }
      }));
    }
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    if (!validateMatriculeFiscal(companyModal.data.registrationNumber)) {
      alert(`Erreur : Le Matricule Fiscal est invalide. Format attendu : ${MF_FORMAT_DISPLAY} (13 caractères sans /)`);
      return;
    }

    const formData = new FormData(e.target);
    const updatedData = {
      ...companyModal.data,
      name: formData.get('name'),
      registrationNumber: formData.get('registrationNumber'),
      address: formData.get('address') || '',
      city: formData.get('city'),
      postalCode: formData.get('postalCode'),
      phone: formData.get('phone'),
      rne: formData.get('rne'),
    };

    try {
      if (companyModal.mode === 'add') {
        const url = companyModal.data.userId
          ? `http://localhost:5170/api/Companies?userId=${companyModal.data.userId}`
          : 'http://localhost:5170/api/Companies';

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData)
        });
        if (response.ok) fetchCompanies();
      } else {
        const response = await fetch(`http://localhost:5170/api/Companies/${companyModal.data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData)
        });
        if (response.ok) fetchCompanies();
      }
    } catch (error) {
      console.error("Erreur de sauvegarde de la société:", error);
    }
    setCompanyModal({ isOpen: false, data: null });
  };

  const handleDeleteCompany = async (id) => {
    if (window.confirm('Voulez-vous vraiment archiver cette société ? Elle ne pourra plus émettre de factures.')) {
      try {
        const response = await fetch(`http://localhost:5170/api/Companies/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) fetchCompanies();
      } catch (error) {
        console.error("Erreur de suppression de la société:", error);
      }
      setCompanyModal({ isOpen: false, data: null });
    }
  };

  const handleUnarchiveCompany = async (id) => {
    if (window.confirm('Voulez-vous restaurer cette société ?')) {
      try {
        const response = await fetch(`http://localhost:5170/api/Companies/${id}/unarchive`, {
          method: 'PUT'
        });
        if (response.ok) fetchCompanies();
      } catch (error) {
        console.error("Erreur de restauration de la société:", error);
      }
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
    { label: 'Total Companies', value: companies.length, trend: '+12.5% this month', trendUp: true, icon: <Icons.BuildingLine /> },
    { label: 'Active Certificates', value: '892', trend: '94% Compliance rate', trendUp: true, icon: <Icons.ShieldCheck /> },
  ];

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "à l'instant";
    if (diffInSeconds < 3600) return `il y a ${Math.floor(diffInSeconds / 60)} minutes`;
    if (diffInSeconds < 86400) return `il y a ${Math.floor(diffInSeconds / 3600)} heures`;
    return date.toLocaleDateString('fr-FR');
  };



  const renderContent = () => {
    switch (activeNav) {
      case 'signatures':
        return (
          <div className="admin-content-view">
            <div className="view-header">
              <h3>Certificats & Signatures Électroniques</h3>
              <button className="btn-action" onClick={() => openCertModal('add')}><i><Icons.Plus /></i> Nouveau Certificat</button>
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
                            <Icons.Gear /> Gérer
                          </button>
                          <button
                            className="btn-table-action btn-danger-action"
                            onClick={() => handleRevokeCertificate(c.serial)}
                            disabled={c.status === 'Révoqué'}
                          >
                            <Icons.Lock /> Révoquer
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
              <div className="table-tabs" style={{ marginBottom: 0 }}>
                <button className={`tab-btn ${!viewArchived ? 'active' : ''}`} onClick={() => setViewArchived(false)}>Actives</button>
                <button className={`tab-btn ${viewArchived ? 'active' : ''}`} onClick={() => setViewArchived(true)}>Archivées</button>
              </div>
              <button className="btn-action" onClick={() => openCompanyModal('add')}><Icons.Plus /> Nouvelle Société</button>
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
                  {companies.filter(c => !!c.isArchived === viewArchived).map((c, i) => (
                    <tr key={c.id || i}>
                      <td className="company-name">{c.name}</td>
                      <td className="fiscal-id">{c.registrationNumber}</td>
                      <td>
                        <div className="certify-status status-valid">
                          ✅ Valide
                        </div>
                      </td>
                      <td>
                        {c.isArchived ? (
                          <span className="status-badge-admin status-archived"><Icons.Lock /> Archivé</span>
                        ) : (
                          <span className="status-badge-admin status-valid"><Icons.Check /> Actif</span>
                        )}
                      </td>
                      <td>
                        {c.isArchived ? (
                          <button
                            className="btn-table-action btn-success-action"
                            onClick={() => handleUnarchiveCompany(c.id)}
                          >
                            <Icons.Refresh /> Restaurer
                          </button>
                        ) : (
                          <button
                            className="btn-table-action"
                            onClick={() => openCompanyModal('edit', c)}
                          >
                            <Icons.Gear /> Modifier
                          </button>
                        )}
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
                        {companyModal.mode === 'add' && (
                          <div className="form-row" style={{ borderBottom: '1px solid #e0e3e8', paddingBottom: '15px', marginBottom: '15px' }}>
                            <label style={{ color: '#1e293b', fontWeight: 'bold' }}>Assigner à un Utilisateur (Obligatoire)</label>
                            <select
                              onChange={(e) => handleClientSelect(e.target.value)}
                              required={companyModal.mode === 'add'}
                              style={{ borderColor: '#64748b' }}
                            >
                              <option value="">-- Choisir l'utilisateur titulaire --</option>
                              {usersList.filter(u => u.role !== 'Super Admin').map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                              ))}
                            </select>
                            <small style={{ display: 'block', marginTop: '5px', color: '#64748b' }}>
                              L'utilisateur choisi deviendra le gestionnaire principal de cette société.
                            </small>
                          </div>
                        )}
                        <div className="form-row">
                          <label>Nom de la Société</label>
                          <input name="name" type="text" value={companyModal.data.name} onChange={(e) => setCompanyModal({ ...companyModal, data: { ...companyModal.data, name: e.target.value } })} required />
                        </div>
                        <div className="form-row">
                          <label>Identifiant Fiscal (NIF/SIRET - 13 car.)</label>
                          <input
                            name="registrationNumber"
                            type="text"
                            maxLength="13"
                            placeholder={MF_FORMAT_DISPLAY}
                            value={companyModal.data.registrationNumber}
                            onChange={(e) => setCompanyModal({ ...companyModal, data: { ...companyModal.data, registrationNumber: e.target.value.toUpperCase() } })}
                            required
                          />
                          {!validateMatriculeFiscal(companyModal.data.registrationNumber) && companyModal.data.registrationNumber.length > 0 && (
                            <small style={{ color: '#ef4444' }}>{getMatriculeError(companyModal.data.registrationNumber)}</small>
                          )}
                        </div>
                        <div className="form-row">
                          <label>Adresse</label>
                          <input name="address" type="text" value={companyModal.data.address} onChange={(e) => setCompanyModal({ ...companyModal, data: { ...companyModal.data, address: e.target.value } })} />
                        </div>
                        <div className="form-row">
                          <label>Ville</label>
                          <input name="city" type="text" value={companyModal.data.city} onChange={(e) => setCompanyModal({ ...companyModal, data: { ...companyModal.data, city: e.target.value } })} />
                        </div>
                        <div className="form-row">
                          <label>Code Postal</label>
                          <input name="postalCode" type="text" value={companyModal.data.postalCode} onChange={(e) => setCompanyModal({ ...companyModal, data: { ...companyModal.data, postalCode: e.target.value } })} />
                        </div>
                        <div className="form-row">
                          <label>Téléphone</label>
                          <input name="phone" type="text" value={companyModal.data.phone} onChange={(e) => setCompanyModal({ ...companyModal, data: { ...companyModal.data, phone: e.target.value } })} />
                        </div>
                        <div className="form-row">
                          <label>Statut Certificat (Statique)</label>
                          <select name="status" disabled defaultValue="Valide">
                            <option value="Valide">Valide</option>
                          </select>
                        </div>
                        <div className="form-row">
                          <label>Numéro RNE</label>
                          <input name="rne" type="text" value={companyModal.data.rne || ''} onChange={(e) => setCompanyModal({ ...companyModal, data: { ...companyModal.data, rne: e.target.value } })} />
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      {companyModal.mode === 'edit' && !companyModal.data.isArchived && (
                        <button type="button" className="btn-delete-user" onClick={() => handleDeleteCompany(companyModal.data.id)}>
                          Archiver
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
              <div className="table-tabs" style={{ marginBottom: 0 }}>
                <button className={`tab-btn ${userTab === 'active' ? 'active' : ''}`} onClick={() => setUserTab('active')}>Actifs / En attente</button>
                <button className={`tab-btn ${userTab === 'refused' ? 'active' : ''}`} onClick={() => setUserTab('refused')}>Refusés</button>
                <button className={`tab-btn ${userTab === 'archived' ? 'active' : ''}`} onClick={() => setUserTab('archived')}>Archivés</button>
              </div>
              <button className="btn-action" onClick={() => openUserModal('add')}><Icons.Plus /> Nouvel Utilisateur</button>
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
                  {usersList.filter(u => {
                    if (userTab === 'archived') return u.status === 'Archived';
                    if (userTab === 'refused') return u.status === 'Refused';
                    // Par défaut on montre les actifs et ceux en attente
                    return u.status !== 'Archived' && u.status !== 'Refused';
                  }).map((u, i) => (
                    <tr key={i}>
                      <td className="company-name">{u.name}</td>
                      <td className="fiscal-id">{u.email}</td>
                      <td><span className="role-badge">{u.role}</span></td>
                      <td>
                        <span className={`status-badge-admin ${
                          (u.status === 'Active' || u.status === 'Actif' || (!u.status && u.actif)) ? 'status-valid' : 
                          (u.status === 'Pending' || (!u.status && !u.actif)) ? 'status-warning' : 
                          (u.status === 'Refused') ? 'status-refused' :
                          (u.status === 'Archived') ? 'status-archived' : 'status-revoked'
                        }`}>
                          {(u.status === 'Pending' || (!u.status && !u.actif)) && <><Icons.Clock /> En attente</>}
                          {u.status === 'Refused' && <><Icons.Alert /> Refusé</>}
                          {u.status === 'Archived' && <><Icons.Lock /> Archivé</>}
                          {(u.status === 'Active' || u.status === 'Actif' || (!u.status && u.actif)) && <><Icons.Check /> Actif</>}
                        </span>
                      </td>
                      <td>{formatDate(u.lastActivity)}</td>
                      <td>
                        <div className="flex-actions-table">
                          {(u.status === 'Pending' || (!u.status && !u.actif)) && (
                            <>
                              <button className="btn-table-action btn-success-action" onClick={() => handleStatusUpdate(u.id, 'Active')}>✅ Accepter</button>
                              <button className="btn-table-action btn-danger-action" onClick={() => handleStatusUpdate(u.id, 'Refused')}>❌ Refuser</button>
                            </>
                          )}
                          <button
                            className="btn-table-action"
                            onClick={() => openUserModal('edit', u)}
                          >
                            <Icons.Gear /> {(u.status === 'Archived' || u.status === 'Refused') ? 'Consulter' : 'Gérer'}
                          </button>
                        </div>
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
                    <h3>{userModal.mode === 'add' ? 'Créer un Utilisateur' : (userModal.data.status === 'Archived' || userModal.data.status === 'Refused' ? 'Détails de l\'utilisateur' : 'Gérer l\'utilisateur')}</h3>
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
                          <input name="name" type="text" defaultValue={userModal.data.name} required disabled={userModal.data.status === 'Archived' || userModal.data.status === 'Refused'} />
                        </div>
                        <div className="form-row">
                          <label>Email</label>
                          <input name="email" type="email" defaultValue={userModal.data.email} required disabled={userModal.data.status === 'Archived' || userModal.data.status === 'Refused'} />
                        </div>
                        {userModal.data.role?.toLowerCase() !== 'admin' && (
                        <>
                        <div className="form-row">
                          <label>Nom de la Société</label>
                          <input name="entreprise" type="text" defaultValue={userModal.data.entreprise} required disabled={userModal.data.status === 'Archived' || userModal.data.status === 'Refused'} />
                        </div>
                        <div className="form-row">
                          <label>Matricule Fiscal (13 car.)</label>
                          <input name="matriculeFiscal" type="text" defaultValue={userModal.data.matriculeFiscal} maxLength="13" minLength="13" placeholder="1234567XAM000" required disabled={userModal.data.status === 'Archived' || userModal.data.status === 'Refused'} />
                        </div>
                        <div className="form-row">
                          <label>Numéro RNE</label>
                          <input name="rne" type="text" defaultValue={userModal.data.rne} placeholder="Identifiant RNE" disabled={userModal.data.status === 'Archived' || userModal.data.status === 'Refused'} />
                        </div>
                        </>
                        )}
                        {(userModal.mode === 'add' || userModal.data.role?.toLowerCase() === 'admin') && (
                        <>
                        {userModal.mode === 'add' ? (
                        <div className="form-row">
                          <label>Mot de passe</label>
                          <input name="password" type="password" placeholder="••••••••" required />
                        </div>
                        ) : (
                        <>
                        <div className="form-row">
                          <label>Ancien mot de passe</label>
                          <input name="oldPassword" type="password" placeholder="Entrez l'ancien mot de passe" />
                        </div>
                        <div className="form-row">
                          <label>Nouveau mot de passe</label>
                          <input name="password" type="password" placeholder="Min. 8 car., majuscule, chiffre, @#$*!" />
                        </div>
                        </>
                        )}
                        {userModal.successMsg && (
                          <div style={{ background: '#ecfdf5', border: '1px solid #1a6b50', borderRadius: '8px', padding: '10px 14px', color: '#0a3326', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a6b50" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            {userModal.successMsg}
                          </div>
                        )}
                        </>
                        )}
                        <div className="form-row">
                          <label>Rôle Système</label>
                          <select name="role" defaultValue={userModal.data.role?.toLowerCase()} disabled={userModal.data.status === 'Archived' || userModal.data.status === 'Refused'}>
                            <option value="admin">Super Admin</option>
                            <option value="auditeur">Auditeur</option>
                            <option value="support">Support</option>
                            <option value="client">Client</option>
                          </select>
                        </div>
                        <div className="form-row">
                          <label>Statut du compte</label>
                          <select name="status" defaultValue={userModal.data.status} className="status-select-custom" disabled={userModal.data.status === 'Archived' || userModal.data.status === 'Refused'}>
                            <option value="Actif">Actif</option>
                            <option value="Inactif">Suspendu</option>
                            {userModal.data.status === 'Archived' && <option value="Archived">Archivé</option>}
                            {userModal.data.status === 'Refused' && <option value="Refused">Refusé</option>}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="modal-footer">
                      {userModal.mode === 'edit' && userModal.data.status !== 'Archived' && (
                        <button type="button" className="btn-delete-user" onClick={() => handleDeleteUser(userModal.data.id)}>
                          Archiver l'accès
                        </button>
                      )}
                      <div className="footer-right">
                        <button type="button" className="btn-cancel" onClick={() => setUserModal({ isOpen: false })}>{userModal.data.status === 'Archived' || userModal.data.status === 'Refused' ? 'Fermer' : 'Annuler'}</button>
                        {(userModal.data.status !== 'Archived' && userModal.data.status !== 'Refused') && (
                          <button type="submit" className="btn-save">Enregistrer</button>
                        )}
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
                <button className="btn-filter"><i><Icons.Calendar /></i> Derniers 30 Jours</button>
              </div>
            </section>

            <div className="kpi-row">
              {KPI_DATA.map((kpi, idx) => (
                <div key={idx} className="kpi-card">
                  <div className="kpi-label"><i>{kpi.icon}</i> {kpi.label}</div>
                  <div className="kpi-value">{kpi.value}</div>
                  <div className={`kpi-trend ${kpi.trendUp ? 'trend-up' : 'trend-down'}`}>
                    {kpi.trendUp ? <Icons.TrendingUp /> : <Icons.AlertTriangle />} {kpi.trend}
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
                  <h3>Activité par Ville</h3>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Répartition géographique du volume de facturation</div>
                </div>
                <div className="donut-chart-wrapper">
                  {regionalData.length > 0 ? (() => {
                    const totalCount = regionalData.reduce((s, d) => s + d.count, 0);
                    const r = 68, cx = 88, cy = 88;
                    const circ = 2 * Math.PI * r;
                    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
                    let cumDeg = 0;
                    const segs = regionalData.slice(0, 6).map((rd, i) => {
                      const pct = rd.count / totalCount;
                      const rot = -90 + cumDeg;
                      cumDeg += pct * 360;
                      return { ...rd, pct, rot, color: COLORS[i % COLORS.length], dashLen: pct * circ };
                    });
                    return (
                      <>
                        <div className="donut-chart-area">
                          <svg width="176" height="176" viewBox="0 0 176 176">
                            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0fdf4" strokeWidth="30" />
                            {segs.map((seg, i) => (
                              <circle
                                key={seg.region}
                                cx={cx} cy={cy} r={r}
                                fill="none"
                                stroke={seg.color}
                                strokeWidth="30"
                                strokeDasharray={chartReady ? `${seg.dashLen} ${circ}` : `0 ${circ}`}
                                strokeLinecap="butt"
                                transform={`rotate(${seg.rot}, ${cx}, ${cy})`}
                                style={{
                                  filter: `drop-shadow(0 0 5px ${seg.color}99)`,
                                  transition: `stroke-dasharray 1s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.18}s`
                                }}
                              />
                            ))}
                            <circle cx={cx} cy={cy} r={r - 16} fill="white" />
                            <text x={cx} y={cy - 9} textAnchor="middle" style={{ fontSize: '22px', fontWeight: '800', fill: '#064e3b', fontFamily: 'Inter, sans-serif' }}>
                              {totalCount}
                            </text>
                            <text x={cx} y={cy + 10} textAnchor="middle" style={{ fontSize: '9px', fontWeight: '700', fill: '#94a3b8', fontFamily: 'Inter, sans-serif', letterSpacing: '1.5px' }}>
                              FACTURES
                            </text>
                          </svg>
                        </div>
                        <div className="donut-legend-list">
                          {segs.map((seg) => (
                            <div key={seg.region} className="donut-legend-row">
                              <span className="donut-dot" style={{ background: seg.color, boxShadow: `0 0 8px ${seg.color}88` }}></span>
                              <div className="donut-legend-text">
                                <span className="donut-city">{seg.region}</span>
                                <div className="donut-bar-mini">
                                  <div className="donut-bar-fill" style={{ width: `${seg.pct * 100}%`, background: seg.color }}></div>
                                </div>
                              </div>
                              <div className="donut-legend-nums">
                                <span className="donut-pct">{(seg.pct * 100).toFixed(0)}%</span>
                                <span className="donut-count">{seg.count} fact.</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })() : (
                    <div className="empty-activities">Analyse des données régionales en cours...</div>
                  )}
                </div>
              </div>

              <div className="activity-panel">
                <div className="panel-header">
                  <h3>Activités Récentes</h3>
                </div>
                <div className="activity-list">
                  {activities.length > 0 ? (
                    activities.slice(0, 5).map((act, i) => (
                      <div key={act.id || i} className="activity-item">
                        <div className="activity-icon">
                          {act.type === 'security' ? <Icons.Lock /> : 
                           act.type === 'invoice_creation' ? <Icons.DocumentLine /> : 
                           act.type === 'user_creation' ? <Icons.UserLine /> : <Icons.Refresh />}
                        </div>
                        <div className="activity-details">
                          <p><strong>{act.actor}</strong> {act.action}</p>
                          <span>{formatRelativeTime(act.timestamp)} • {act.targetInfo}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-activities">Aucune activité récente.</div>
                  )}
                </div>
                <button className="btn-history" onClick={fetchAllActivities}>VOIR TOUT L'HISTORIQUE</button>
              </div>

              {/* MODAL HISTORIQUE COMPLET */}
              {allActivitiesModal.isOpen && (
                <div className="admin-modal-overlay" onClick={() => setAllActivitiesModal({ isOpen: false })}>
                  <div className="admin-modal-content history-modal-wide" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                      <h3>Historique Complet des Activités</h3>
                      <button className="close-btn" onClick={() => setAllActivitiesModal({ isOpen: false })}>✕</button>
                    </div>
                    <div className="modal-body">
                      <div className="history-scroll-list">
                        {allActivitiesModal.data && allActivitiesModal.data.map((act, i) => (
                          <div key={act.id || i} className="full-history-item">
                            <div className="history-time-col">
                              <span className="history-date">{new Date(act.timestamp).toLocaleDateString('fr-FR')}</span>
                              <span className="history-hour">{new Date(act.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="history-icon-col">
                              {act.type === 'invoice_creation' ? <Icons.DocumentLine /> : <Icons.UserLine />}
                            </div>
                            <div className="history-content-col">
                              <p><strong>{act.actor}</strong> {act.action}</p>
                              <span className="history-target">{act.targetInfo}</span>
                            </div>
                            <div className="history-type-col">
                              <span className={`type-tag ${act.type}`}>{act.type === 'invoice_creation' ? 'Facture' : 'Utilisateur'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            <div className="table-panel">
              <div className="table-panel-header">
                <h3>Sociétés Récemment Actives</h3>
                <div className="table-tabs">
                  <button className={`tab-btn ${!viewArchived ? 'active' : ''}`} onClick={() => setViewArchived(false)}>FILTRER PAR STATUT</button>
                  <button className={`tab-btn ${viewArchived ? 'active' : ''}`} onClick={() => setViewArchived(true)}>VOIR ARCHIVÉES</button>
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
                  {companies.filter(c => !!c.isArchived === viewArchived).slice(0, 4).map((c, i) => (
                    <tr key={c.id || i}>
                      <td className="company-name">{c.name}</td>
                      <td className="fiscal-id">{c.registrationNumber}</td>
                      <td>
                        <div className="certify-status status-valid">
                          <Icons.Check /> Valide
                        </div>
                      </td>
                      <td>
                        {c.isArchived ? (
                           <button className="btn-table-action btn-success-action" onClick={() => handleUnarchiveCompany(c.id)}>Restaurer</button>
                        ) : (
                           <button className="btn-table-action" onClick={() => setActiveNav('companies')}>Détails</button>
                        )}
                      </td>
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
        <header className="admin-sidebar-header">
          <div className="admin-logo-icon">EF</div>
          <div className="admin-logo-info">
            <h2>EL FATOORA</h2>
            <span>ADMINISTRATION</span>
          </div>
        </header>

        <nav className="admin-nav">
          <button
            className={`admin-nav-item ${activeNav === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveNav('dashboard')}
          >
            <i><Icons.Dashboard /></i> Dashboard
          </button>
          <button
            className={`admin-nav-item ${activeNav === 'signatures' ? 'active' : ''}`}
            onClick={() => setActiveNav('signatures')}
          >
            <i><Icons.Certificate /></i> Certificat Électronique
          </button>
          <button
            className={`admin-nav-item ${activeNav === 'companies' ? 'active' : ''}`}
            onClick={() => setActiveNav('companies')}
          >
            <i><Icons.Company /></i> Gérer Société
          </button>
          <button
            className={`admin-nav-item ${activeNav === 'users' ? 'active' : ''}`}
            onClick={() => setActiveNav('users')}
          >
            <i><Icons.Users /></i> Gérer Utilisateurs
          </button>

          <div style={{ flex: 1 }}></div>

          <button className="admin-nav-item logout-item" onClick={onLogout} style={{ color: '#ef4444', marginBottom: '12px' }}>
            Se déconnecter
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-profile-card">
            <div className="admin-avatar">{user?.name ? getInitials(user.name) : 'AD'}</div>
            <div className="admin-profile-info">
              <h4>{user?.name || 'Admin Central'}</h4>
              <p>{user?.email || 'fatoora.admin@gov.dz'}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            {activeNav !== 'dashboard' && (
              <button className="admin-back-btn" onClick={() => setActiveNav('dashboard')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                <span>Retour au Dashboard</span>
              </button>
            )}
          </div>
          <div className="admin-top-actions">
            <div className="notif-btn-wrapper">
              <span onClick={() => setShowNotifMenu(!showNotifMenu)}>
                <Icons.Bell />
                {pendingUsersCount > 0 && <span className="notif-badge">{pendingUsersCount}</span>}
              </span>
              
              {showNotifMenu && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <h4>Notifications</h4>
                    <button className="close-btn" style={{ width: '20px', height: '20px', fontSize: '10px' }} onClick={() => setShowNotifMenu(false)}>✕</button>
                  </div>
                  <div className="notif-body">
                    {pendingUsersCount > 0 ? (
                      <div className="notif-item" onClick={() => { setActiveNav('users'); setShowNotifMenu(false); }}>
                        <div className="notif-icon-circle"><Icons.Users /></div>
                        <div className="notif-text">
                          <p>Nouvelles inscriptions</p>
                          <span>{pendingUsersCount} utilisateur(s) attendent votre validation</span>
                        </div>
                      </div>
                    ) : (
                      <div className="notif-empty">Aucune nouvelle notification</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <span><Icons.Gear /></span>
            <span><Icons.Help /></span>
          </div>
        </header>

        {renderContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;
