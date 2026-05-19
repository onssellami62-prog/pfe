import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5170/api';
const IA_BASE  = 'http://localhost:8000';
const getToken = () => localStorage.getItem('token');
const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`
});

const PAGES_DISPONIBLES = [
    { key: 'factures',     label: '📄 Mes Factures' },
    { key: 'create',       label: '✏️ Créer une Facture' },
    { key: 'avoirs',       label: '↩️ Avoirs' },
    { key: 'clients',      label: '👥 Gestion Clients' },
    { key: 'declaration',  label: '📋 Déclaration Fiscale' },
    { key: 'statistiques', label: '📊 Statistiques' },
    { key: 'depot',        label: '📁 Dépôt Facture' },
];

export default function CompanyProfile({ onClose, user }) {
    const [activeSection, setActiveSection] = useState('profil');

    const [form, setForm] = useState({
        raisonSociale: 'El Fatoora Digital Solutions SARL',
        registreCommerce: 'B01234562023',
        mf1: '1234567', mf2: 'A', mf3: 'M', mf4: 'P', mf5: '000',
        adresse: 'Avenue Habib Bourguiba, Immeuble Horizon',
        ville: 'Tunis', codePostal: '1000',
        telephone: '+216 71 123 456',
        email: 'contact@elfatoora.tn',
    });

    const [employes,   setEmployes]   = useState([]);
    const [loadingEmp, setLoadingEmp] = useState(false);
    const [showForm,   setShowForm]   = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg,   setErrorMsg]   = useState('');
    const [newEmploye, setNewEmploye] = useState({ nom: '', email: '', permissions: [] });

    const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
    const handleSave   = () => alert('Modifications enregistrées avec succès !');

    useEffect(() => {
        if (activeSection === 'equipe') fetchEmployes();
    }, [activeSection]);

    const fetchEmployes = async () => {
        setLoadingEmp(true);
        try {
            const res  = await fetch(`${API_BASE}/utilisateurs`, { headers: authHeaders() });
            const data = await res.json();
            setEmployes(Array.isArray(data) ? data : []);
        } catch { setEmployes([]); }
        finally { setLoadingEmp(false); }
    };

    const togglePermission = (key) => {
        setNewEmploye(prev => ({
            ...prev,
            permissions: prev.permissions.includes(key)
                ? prev.permissions.filter(p => p !== key)
                : [...prev.permissions, key]
        }));
    };

    const handleCreateEmploye = async () => {
        setErrorMsg('');
        if (!newEmploye.nom || !newEmploye.email) { setErrorMsg('Nom et email sont obligatoires.'); return; }
        if (newEmploye.permissions.length === 0)  { setErrorMsg('Sélectionnez au moins une page.'); return; }

        setSubmitting(true);
        try {
            const res  = await fetch(`${API_BASE}/utilisateurs`, {
                method: 'POST', headers: authHeaders(),
                body: JSON.stringify({ nom: newEmploye.nom, email: newEmploye.email, permissions: newEmploye.permissions })
            });
            const data = await res.json();

            if (!res.ok) { setErrorMsg(data.message || 'Erreur serveur.'); return; }

            await fetch(`${IA_BASE}/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nom:        newEmploye.nom,
                    email:      newEmploye.email,
                    motDePasse: data.motDePasseTemp,
                    permissions: newEmploye.permissions.map(p =>
                        PAGES_DISPONIBLES.find(pg => pg.key === p)?.label || p
                    )
                })
            });

            setSuccessMsg(`✅ Compte créé ! Email envoyé à ${newEmploye.email}.`);
            setShowForm(false);
            setNewEmploye({ nom: '', email: '', permissions: [] });
            fetchEmployes();
        } catch { setErrorMsg('Erreur de connexion au serveur.'); }
        finally { setSubmitting(false); }
    };

    const handleToggle = async (id) => {
        await fetch(`${API_BASE}/utilisateurs/${id}/toggle`, { method: 'PUT', headers: authHeaders() });
        fetchEmployes();
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer cet employé ?')) return;
        await fetch(`${API_BASE}/utilisateurs/${id}`, { method: 'DELETE', headers: authHeaders() });
        fetchEmployes();
    };

    const card    = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, marginBottom: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };
    const cHeader = { padding: '12px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
    const cBody   = { padding: '16px 18px' };
    const iGroup  = { display: 'flex', flexDirection: 'column', gap: 5 };
    const lbl     = { fontSize: 12, fontWeight: 600, color: '#475569' };
    const inp     = { padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, background: '#f8fafc', color: '#1e293b', outline: 'none', width: '100%' };

    return (
        <div style={{ maxWidth: 780 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Profil de l'Entreprise</h1>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Gérez les informations légales, fiscales et votre équipe.</p>
                </div>
                {onClose && (
                    <button onClick={onClose} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14, color: '#64748b' }}>✕</button>
                )}
            </div>

           {/* Tabs */}
<div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: 18 }}>
    {[
        { key: 'profil',      label: '👤 Profil' },
        { key: 'certificats', label: '📜 Certificats' },
        ...(user?.role === 'SuperAdmin' ? [{ key: 'equipe', label: '👥 Équipe' }] : [])
    ].map(tab => (
        <button key={tab.key} onClick={() => setActiveSection(tab.key)} style={{
            padding: '8px 18px', border: 'none', background: 'none', fontSize: 13,
            fontWeight: 600, cursor: 'pointer',
            color: activeSection === tab.key ? '#1e429f' : '#64748b',
            borderBottom: activeSection === tab.key ? '2px solid #1e429f' : '2px solid transparent',
            marginBottom: -1
        }}>{tab.label}</button>
    ))}
</div>

            {/* Profil */}
            {activeSection === 'profil' && (
                <div>
                    <div style={card}>
                        <div style={cHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span>🏢</span><strong style={{ fontSize: 14, color: '#1e293b' }}>Identité de l'Entreprise</strong></div>
                        </div>
                        <div style={cBody}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div style={{ ...iGroup, gridColumn: '1/-1' }}>
                                    <label style={lbl}>Raison Sociale</label>
                                    <input style={inp} type="text" value={form.raisonSociale} onChange={e => handleChange('raisonSociale', e.target.value)} />
                                </div>
                                <div style={{ ...iGroup, gridColumn: '1/-1' }}>
                                    <label style={lbl}>Registre de Commerce (RC)</label>
                                    <input style={inp} type="text" value={form.registreCommerce} onChange={e => handleChange('registreCommerce', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={card}>
                        <div style={cHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span>🏛️</span><strong style={{ fontSize: 14, color: '#1e293b' }}>Informations Fiscales</strong></div>
                        </div>
                        <div style={cBody}>
                            <label style={lbl}>Matricule Fiscal (Tunisie)</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.6fr 0.6fr 0.6fr 1fr', gap: 8, marginTop: 8 }}>
                                {[['mf1','7 CHIFFRES'],['mf2','CLÉ'],['mf3','CAT'],['mf4','CODE'],['mf5','BUREAU']].map(([k, l]) => (
                                    <div key={k} style={iGroup}>
                                        <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>{l}</span>
                                        <input style={{ ...inp, textAlign: 'center' }} type="text" value={form[k]} onChange={e => handleChange(k, e.target.value)} />
                                    </div>
                                ))}
                            </div>
                            <p style={{ fontSize: 11, color: '#94a3b8', margin: '8px 0 0', fontStyle: 'italic' }}>Format : 1234567/A/M/P/000</p>
                            <div style={{ marginTop: 10, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 7, padding: '8px 12px', fontSize: 12, color: '#0369a1' }}>
                                <strong>Aperçu :</strong> {form.mf1}/{form.mf2}/{form.mf3}/{form.mf4}/{form.mf5}
                            </div>
                        </div>
                    </div>

                    <div style={card}>
                        <div style={cHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span>📍</span><strong style={{ fontSize: 14, color: '#1e293b' }}>Coordonnées</strong></div>
                        </div>
                        <div style={cBody}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div style={{ ...iGroup, gridColumn: '1/-1' }}>
                                    <label style={lbl}>Adresse Siège Social</label>
                                    <input style={inp} type="text" value={form.adresse} onChange={e => handleChange('adresse', e.target.value)} />
                                </div>
                                <div style={iGroup}><label style={lbl}>Ville</label><input style={inp} type="text" value={form.ville} onChange={e => handleChange('ville', e.target.value)} /></div>
                                <div style={iGroup}><label style={lbl}>Code Postal</label><input style={inp} type="text" value={form.codePostal} onChange={e => handleChange('codePostal', e.target.value)} /></div>
                                <div style={iGroup}><label style={lbl}>Téléphone</label><input style={inp} type="text" value={form.telephone} onChange={e => handleChange('telephone', e.target.value)} /></div>
                                <div style={iGroup}><label style={lbl}>Email Administratif</label><input style={inp} type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} /></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Certificats */}
            {activeSection === 'certificats' && (
                <div style={card}>
                    <div style={cHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span>🖋️</span><strong style={{ fontSize: 14, color: '#1e293b' }}>Signature Électronique</strong></div>
                        <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>● Certificat Actif</span>
                    </div>
                    <div style={cBody}>
                        <div style={{ border: '2px dashed #e2e8f0', borderRadius: 10, padding: '1.5rem', textAlign: 'center', background: '#f8fafc', marginBottom: 12 }}>
                            <div style={{ fontSize: 26, marginBottom: 8 }}>📄</div>
                            <h4 style={{ margin: '0 0 4px', fontSize: 14, color: '#1e293b' }}>Mettre à jour le certificat</h4>
                            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Importez votre fichier .p12 ou connectez votre Digigo</p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                                <button style={{ padding: '7px 16px', background: '#1e429f', color: 'white', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Charger P12</button>
                                <button style={{ padding: '7px 16px', background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Lier Digigo</button>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#f1f5f9', borderRadius: 8 }}>
                            <span style={{ fontSize: 18 }}>🛡️</span>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Certificat ID: TN-EL-2023-FATOORA</div>
                                <div style={{ fontSize: 12, color: '#64748b' }}>Expire le: 12 Décembre 2025 • Délivré par: ANCE Tunisia</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Équipe */}
            {activeSection === 'equipe' && (
                <div>
                    {successMsg && (
                        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#16a34a', marginBottom: 14 }}>
                            {successMsg}
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <div>
                            <strong style={{ fontSize: 15, color: '#1e293b' }}>Gestion de l'Équipe</strong>
                            <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Créez des comptes et définissez les accès de vos employés.</p>
                        </div>
                        <button onClick={() => { setShowForm(!showForm); setErrorMsg(''); setSuccessMsg(''); }} style={{
                            padding: '8px 16px', background: '#1e429f', color: 'white',
                            border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                        }}>
                            {showForm ? '✕ Annuler' : '+ Ajouter un employé'}
                        </button>
                    </div>

                    {showForm && (
                        <div style={{ ...card, border: '1px solid #bfdbfe', background: '#f0f9ff' }}>
                            <div style={{ ...cHeader, background: '#eff6ff', borderBottom: '1px solid #bfdbfe' }}>
                                <strong style={{ fontSize: 14, color: '#1e429f' }}>👤 Nouveau compte employé</strong>
                            </div>
                            <div style={cBody}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                                    <div style={iGroup}>
                                        <label style={lbl}>Nom complet *</label>
                                        <input style={inp} type="text" placeholder="Ex: Ahmed Ben Ali"
                                            value={newEmploye.nom}
                                            onChange={e => setNewEmploye(prev => ({ ...prev, nom: e.target.value }))} />
                                    </div>
                                    <div style={iGroup}>
                                        <label style={lbl}>Email *</label>
                                        <input style={inp} type="email" placeholder="ahmed@entreprise.tn"
                                            value={newEmploye.email}
                                            onChange={e => setNewEmploye(prev => ({ ...prev, email: e.target.value }))} />
                                    </div>
                                </div>

                                <label style={{ ...lbl, display: 'block', marginBottom: 8 }}>Pages accessibles *</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    {PAGES_DISPONIBLES.map(page => (
                                        <label key={page.key} style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                                            background: newEmploye.permissions.includes(page.key) ? '#eff6ff' : 'white',
                                            border: `1px solid ${newEmploye.permissions.includes(page.key) ? '#bfdbfe' : '#e2e8f0'}`,
                                        }}>
                                            <input type="checkbox"
                                                checked={newEmploye.permissions.includes(page.key)}
                                                onChange={() => togglePermission(page.key)}
                                                style={{ accentColor: '#1e429f', width: 14, height: 14 }} />
                                            <span style={{ fontSize: 12, fontWeight: 500, color: '#1e293b' }}>{page.label}</span>
                                        </label>
                                    ))}
                                </div>

                                {errorMsg && (
                                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#dc2626', marginTop: 12 }}>
                                        {errorMsg}
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                                    <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}>Annuler</button>
                                    <button onClick={handleCreateEmploye} disabled={submitting} style={{
                                        padding: '8px 18px', background: submitting ? '#93c5fd' : '#1e429f',
                                        color: 'white', border: 'none', borderRadius: 8,
                                        fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 13
                                    }}>
                                        {submitting ? '⏳ Création...' : '✅ Créer et envoyer email'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={card}>
                        <div style={cHeader}>
                            <strong style={{ fontSize: 14, color: '#1e293b' }}>Employés ({employes.length})</strong>
                        </div>
                        {loadingEmp ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: 13 }}>Chargement...</div>
                        ) : employes.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: 13 }}>
                                Aucun employé créé. Cliquez sur "+ Ajouter un employé".
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc' }}>
                                        {['NOM', 'EMAIL', 'ACCÈS', 'STATUT', 'ACTIONS'].map(h => (
                                            <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {employes.map(emp => (
                                        <tr key={emp.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                            <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1e293b' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#eff6ff', color: '#1e429f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                                                        {emp.nom.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    {emp.nom}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 14px', color: '#475569', fontSize: 12 }}>{emp.email}</td>
                                            <td style={{ padding: '12px 14px' }}>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                    {(emp.permissions || []).slice(0, 3).map((p, i) => (
                                                        <span key={i} style={{ background: '#eff6ff', color: '#1e429f', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>
                                                            {PAGES_DISPONIBLES.find(pg => pg.key === p)?.label?.split(' ')[1] || p}
                                                        </span>
                                                    ))}
                                                    {(emp.permissions || []).length > 3 && (
                                                        <span style={{ fontSize: 10, color: '#64748b' }}>+{(emp.permissions || []).length - 3}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 14px' }}>
                                                <span style={{
                                                    padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                                                    background: emp.estActif ? '#dcfce7' : '#fee2e2',
                                                    color: emp.estActif ? '#16a34a' : '#dc2626'
                                                }}>
                                                    {emp.estActif ? 'Actif' : 'Inactif'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 14px' }}>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button onClick={() => handleToggle(emp.id)} style={{
                                                        padding: '4px 8px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
                                                        background: emp.estActif ? '#fff7ed' : '#f0fdf4',
                                                        color: emp.estActif ? '#ea580c' : '#16a34a',
                                                        border: `1px solid ${emp.estActif ? '#fed7aa' : '#86efac'}`
                                                    }}>
                                                        {emp.estActif ? 'Désactiver' : 'Activer'}
                                                    </button>
                                                    <button onClick={() => handleDelete(emp.id)} style={{
                                                        padding: '4px 8px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
                                                        background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca'
                                                    }}>
                                                        Supprimer
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* Footer */}
            {activeSection !== 'equipe' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}>Annuler</button>
                    <button onClick={handleSave} style={{ padding: '8px 18px', background: '#1e429f', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Enregistrer les modifications</button>
                </div>
            )}
        </div>
    );
}