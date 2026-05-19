import React, { useState, useEffect } from 'react';
import './Gestionclients.css';

const API_BASE    = 'http://localhost:5170/api';
const getToken    = () => localStorage.getItem('token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

// Helpers typeTiers
const isSociete  = (c) => (c.typeTiers || '').toLowerCase().includes('société') || (c.typeTiers || '').toLowerCase().includes('societe') || (c.typeTiers || '').toLowerCase().includes('entreprise');
const isPersonne = (c) => (c.typeTiers || '').toLowerCase().includes('physique') || (c.typeTiers || '').toLowerCase().includes('personne');

export default function GestionClients() {
    const [view,        setView]        = useState('list');
    const [clients,     setClients]     = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState(null);
    const [searchTerm,  setSearchTerm]  = useState('');
    const [editClient,  setEditClient]  = useState(null);
    const [showSuccess, setShowSuccess] = useState('');
    const [submitting,  setSubmitting]  = useState(false);
    const [showAll,     setShowAll]     = useState(false);

    const [form, setForm] = useState({
        nom: '', typeIdentifiant: 'I-01', cin: '', carteSejourPasseport: '',
        matriculeFiscal: '', matriculeFiscalEtranger: '',
        adresse: '', ville: '', codePostal: '', pays: 'TN',
        telephone: '', telecopie: '', email: '', siteWeb: '',
        contact: '', profil: '', modeConnexion: '',
    });

    useEffect(() => { fetchClients(); }, []);

    const fetchClients = async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetch(`${API_BASE}/tiers`, { headers: authHeaders() });
            if (!res.ok) throw new Error('Erreur chargement clients');
            setClients(await res.json());
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    const resetForm = () => {
        setForm({ nom:'', typeIdentifiant:'I-01', cin:'', carteSejourPasseport:'', matriculeFiscal:'', matriculeFiscalEtranger:'', adresse:'', ville:'', codePostal:'', pays:'TN', telephone:'', telecopie:'', email:'', siteWeb:'', contact:'', profil:'', modeConnexion:'' });
        setEditClient(null);
    };

    const handleEdit = (c) => {
        setForm({
            nom:                    c.nom || '',
            typeIdentifiant:        c.typeIdentifiant || 'I-01',
            cin:                    c.cin || '',
            carteSejourPasseport:   c.carteSejourPasseport || '',
            matriculeFiscal:        c.matriculeFiscal || '',
            matriculeFiscalEtranger:c.matriculeFiscalEtranger || '',
            adresse:                c.adresse || '',
            ville:                  c.ville || '',
            codePostal:             c.codePostal || '',
            pays:                   c.pays || 'TN',
            telephone:              c.telephone || '',
            telecopie:              c.telecopie || '',
            email:                  c.email || '',
            siteWeb:                c.siteWeb || '',
            contact:                c.contact || '',
            profil:                 c.profil || '',
            modeConnexion:          c.modeConnexion || '',
        });
        setEditClient(c.id);
        setView('form');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer ce client ?')) return;
        try {
            const res  = await fetch(`${API_BASE}/tiers/${id}`, { method:'DELETE', headers: authHeaders() });
            const data = await res.json();
            if (!res.ok) { alert(data.message); return; }
            toast('Client supprimé avec succès.');
            fetchClients();
        } catch { alert('Erreur lors de la suppression.'); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSubmitting(true);
        try {
            const body = {
                nom:                     form.nom,
                typeIdentifiant:         form.typeIdentifiant,
                cin:                     form.cin || null,
                carteSejourPasseport:    form.carteSejourPasseport || null,
                matriculeFiscal:         form.matriculeFiscal || null,
                matriculeFiscalEtranger: form.matriculeFiscalEtranger || null,
                adresse:                 form.adresse,
                ville:                   form.ville || null,
                codePostal:              form.codePostal || null,
                pays:                    form.pays || 'TN',
                email:                   form.email || null,
                telephone:               form.telephone || null,
                telecopie:               form.telecopie || null,
                contact:                 form.contact || null,
                profil:                  form.profil || null,
                modeConnexion:           form.modeConnexion || null,
                siteWeb:                 form.siteWeb || null,
            };
            const url    = editClient ? `${API_BASE}/tiers/${editClient}` : `${API_BASE}/tiers`;
            const method = editClient ? 'PUT' : 'POST';
            const res    = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
            const data   = await res.json();
            if (!res.ok) { alert(data.message || 'Erreur serveur'); return; }
            toast(editClient ? 'Client modifié avec succès !' : 'Client créé avec succès !');
            resetForm(); setView('list'); fetchClients();
        } catch { alert('Erreur de connexion au serveur.'); }
        finally { setSubmitting(false); }
    };

    const toast = (msg) => { setShowSuccess(msg); setTimeout(() => setShowSuccess(''), 3000); };

    const filtered = clients.filter(c =>
        (c.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.matriculeFiscal || '').includes(searchTerm) ||
        (c.cin || '').includes(searchTerm)
    );

    const displayed = showAll ? filtered : filtered.slice(0, 5);

    const typeLabel = (typeId) => {
        switch(typeId) {
            case 'I-01': return { label:'Société Tunisienne',          cls:'blue'   };
            case 'I-02': return { label:'Personne Physique (CIN)',      cls:'purple' };
            case 'I-03': return { label:'Carte Séjour/Passeport',       cls:'orange' };
            case 'I-04': return { label:'Société Étrangère',            cls:'green'  };
            default:     return { label: typeId || '—',                 cls:'gray'   };
        }
    };

    return (
        <div className="gc-page">

            {showSuccess && (
                <div className="gc-toast">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
                    </svg>
                    {showSuccess}
                </div>
            )}

            <div className="gc-header">
                <div className="gc-header-left">
                    <h1>Gestion des Clients</h1>
                    <p>Gérez votre portefeuille clients et leurs informations fiscales.</p>
                </div>
                <div className="gc-header-actions">
                    {view === 'list' ? (
                        <button className="gc-btn-primary" onClick={() => { resetForm(); setView('form'); }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Nouveau Client
                        </button>
                    ) : (
                        <button className="gc-btn-secondary" onClick={() => { resetForm(); setView('list'); }}>← Retour à la liste</button>
                    )}
                </div>
            </div>

            {/* ════ VUE LISTE ════ */}
            {view === 'list' && (
                <div className="gc-list-view">
                    <div className="gc-stats-row">
                        <div className="gc-stat">
                            <span className="gc-stat-value">{clients.length}</span>
                            <span className="gc-stat-label">Total Clients</span>
                        </div>
                        <div className="gc-stat">
                            <span className="gc-stat-value">{clients.filter(c => c.typeIdentifiant === 'I-01').length}</span>
                            <span className="gc-stat-label">Sociétés Tunisiennes</span>
                        </div>
                        <div className="gc-stat">
                            <span className="gc-stat-value">{clients.filter(c => c.typeIdentifiant === 'I-04').length}</span>
                            <span className="gc-stat-label">Sociétés Étrangères</span>
                        </div>
                        <div className="gc-stat">
                            <span className="gc-stat-value">{clients.filter(c => c.typeIdentifiant === 'I-02' || c.typeIdentifiant === 'I-03').length}</span>
                            <span className="gc-stat-label">Personnes Physiques</span>
                        </div>
                    </div>

                    <div className="gc-search-bar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input type="text" placeholder="Rechercher par nom, matricule fiscal ou CIN..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>

                    {loading && <div style={{ textAlign:'center', padding:'3rem', color:'#64748b' }}>Chargement...</div>}
                    {error   && <div style={{ textAlign:'center', padding:'2rem', color:'#ef4444', background:'#fef2f2', borderRadius:8 }}>
                        {error} — <button onClick={fetchClients} style={{ color:'#2563eb', background:'none', border:'none', cursor:'pointer' }}>Réessayer</button>
                    </div>}

                    {!loading && !error && (
                        <div className="gc-table-box">
                            <table className="gc-table">
                                <thead>
                                    <tr>
                                        <th>CLIENT</th>
                                        <th>TYPE TEIF</th>
                                        <th>IDENTIFIANT</th>
                                        <th>TÉLÉPHONE</th>
                                        <th>EMAIL</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayed.map(c => {
                                        const t = typeLabel(c.typeIdentifiant);
                                        return (
                                            <tr key={c.id}>
                                                <td>
                                                    <div className="gc-client-cell">
                                                        <div className="gc-avatar">{(c.nom || '?').substring(0, 2).toUpperCase()}</div>
                                                        <div>
                                                            <div className="gc-client-name">{c.nom}</div>
                                                            {c.ville && <div className="gc-client-code">{c.ville}</div>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`gc-type-badge ${t.cls}`}>{t.label}</span>
                                                </td>
                                                <td className="gc-mono">{c.matriculeFiscal || c.cin || c.carteSejourPasseport || c.matriculeFiscalEtranger || '—'}</td>
                                                <td>{c.telephone || '—'}</td>
                                                <td>{c.email || '—'}</td>
                                                <td>
                                                    <div className="gc-actions">
                                                        <button className="gc-icon-btn edit" onClick={() => handleEdit(c)} title="Modifier">
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                        </button>
                                                        <button className="gc-icon-btn delete" onClick={() => handleDelete(c.id)} title="Supprimer">
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filtered.length === 0 && (
                                        <tr><td colSpan="6" className="gc-empty">Aucun client trouvé.</td></tr>
                                    )}
                                </tbody>
                            </table>
                            <div className="gc-table-footer" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                <span>{displayed.length} / {filtered.length} client(s) affiché(s)</span>
                                {filtered.length > 5 && (
                                    <button onClick={() => setShowAll(!showAll)} style={{ background:'none', border:'1px solid #e5e7eb', borderRadius:8, padding:'5px 14px', fontSize:12, fontWeight:600, color:'#2563eb', cursor:'pointer' }}>
                                        {showAll ? '▲ Réduire' : `▼ Voir tous (${filtered.length})`}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ════ VUE FORMULAIRE ════ */}
            {view === 'form' && (
                <form className="gc-form" onSubmit={handleSubmit}>
                    <div className="gc-form-grid">

                        {/* Identité */}
                        <div className="gc-section">
                            <div className="gc-section-header"><span className="gc-section-icon">🏢</span><h3>Identité du Client</h3></div>
                            <div className="gc-fields">
                                <div className="gc-field full">
                                    <label>Nom / Raison Sociale <span className="required">*</span></label>
                                    <input type="text" required placeholder="Ex: Société Exemple SARL"
                                        value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
                                </div>
                                <div className="gc-field">
                                    <label>Type d'identifiant TEIF <span className="required">*</span></label>
                                    <select value={form.typeIdentifiant} onChange={e => setForm({ ...form, typeIdentifiant: e.target.value, cin:'', carteSejourPasseport:'', matriculeFiscal:'', matriculeFiscalEtranger:'' })}>
                                        <option value="I-01">I-01 — Matricule fiscal tunisien</option>
                                        <option value="I-02">I-02 — CIN (Personne physique)</option>
                                        <option value="I-03">I-03 — Carte de séjour / Passeport</option>
                                        <option value="I-04">I-04 — Matricule fiscal étranger</option>
                                    </select>
                                </div>
                                <div className="gc-field">
                                    <label>Profil</label>
                                    <select value={form.profil} onChange={e => setForm({ ...form, profil: e.target.value })}>
                                        <option value="">-- Sélectionner --</option>
                                        <option value="Client">Client</option>
                                        <option value="Fournisseur">Fournisseur</option>
                                        <option value="Les deux">Les deux</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Fiscalité */}
                        <div className="gc-section">
                            <div className="gc-section-header"><span className="gc-section-icon">🏛️</span><h3>Informations Fiscales</h3></div>
                            <div className="gc-fields">
                                {form.typeIdentifiant === 'I-01' && (
                                    <div className="gc-field full">
                                        <label>Matricule Fiscal</label>
                                        <div className="gc-mf-grid">
                                            {['1234567','A','M','P','000'].map((ph, i) => (
                                                <input key={i} type="text" placeholder={ph}
                                                    maxLength={i === 0 ? 7 : i === 4 ? 3 : 1}
                                                    value={(form.matriculeFiscal || '').split('/')[i] || ''}
                                                    onChange={e => {
                                                        const parts = (form.matriculeFiscal || '/////').split('/');
                                                        parts[i] = e.target.value.toUpperCase();
                                                        setForm({ ...form, matriculeFiscal: parts.join('/') });
                                                    }} />
                                            ))}
                                        </div>
                                        <p className="gc-hint">Format TEIF : 1234567/A/M/P/000</p>
                                    </div>
                                )}
                                {form.typeIdentifiant === 'I-02' && (
                                    <div className="gc-field full">
                                        <label>CIN</label>
                                        <input type="text" placeholder="8 chiffres" maxLength={8}
                                            value={form.cin} onChange={e => setForm({ ...form, cin: e.target.value })} />
                                    </div>
                                )}
                                {form.typeIdentifiant === 'I-03' && (
                                    <div className="gc-field full">
                                        <label>Numéro Carte de séjour / Passeport</label>
                                        <input type="text" placeholder="Ex: A12345678"
                                            value={form.carteSejourPasseport} onChange={e => setForm({ ...form, carteSejourPasseport: e.target.value })} />
                                    </div>
                                )}
                                {form.typeIdentifiant === 'I-04' && (
                                    <div className="gc-field full">
                                        <label>Matricule Fiscal Étranger</label>
                                        <input type="text" placeholder="Identifiant fiscal du pays d'origine"
                                            value={form.matriculeFiscalEtranger} onChange={e => setForm({ ...form, matriculeFiscalEtranger: e.target.value })} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Coordonnées */}
                        <div className="gc-section">
                            <div className="gc-section-header"><span className="gc-section-icon">📍</span><h3>Coordonnées</h3></div>
                            <div className="gc-fields">
                                <div className="gc-field full">
                                    <label>Adresse <span className="required">*</span></label>
                                    <input type="text" required placeholder="Rue, N°, Immeuble..."
                                        value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} />
                                </div>
                                <div className="gc-field">
                                    <label>Ville</label>
                                    <input type="text" placeholder="Ex: Tunis"
                                        value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })} />
                                </div>
                                <div className="gc-field">
                                    <label>Code Postal</label>
                                    <input type="text" placeholder="Ex: 1000"
                                        value={form.codePostal} onChange={e => setForm({ ...form, codePostal: e.target.value })} />
                                </div>
                                <div className="gc-field">
                                    <label>Téléphone</label>
                                    <input type="tel" placeholder="+216 XX XXX XXX"
                                        value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />
                                </div>
                                <div className="gc-field">
                                    <label>Télécopie</label>
                                    <input type="tel" placeholder="+216 XX XXX XXX"
                                        value={form.telecopie} onChange={e => setForm({ ...form, telecopie: e.target.value })} />
                                </div>
                                <div className="gc-field">
                                    <label>Email</label>
                                    <input type="email" placeholder="contact@exemple.tn"
                                        value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                                </div>
                                <div className="gc-field">
                                    <label>Site Web</label>
                                    <input type="url" placeholder="https://exemple.tn"
                                        value={form.siteWeb} onChange={e => setForm({ ...form, siteWeb: e.target.value })} />
                                </div>
                                <div className="gc-field">
                                    <label>Contact (Responsable)</label>
                                    <input type="text" placeholder="Nom du responsable"
                                        value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="gc-form-footer">
                        <button type="button" className="gc-btn-secondary" onClick={() => { resetForm(); setView('list'); }}>Annuler</button>
                        <button type="submit" className="gc-btn-primary" disabled={submitting}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                            {submitting ? 'Enregistrement...' : editClient ? 'Modifier le client' : 'Créer le client'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}