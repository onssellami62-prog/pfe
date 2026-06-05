import React, { useState, useEffect } from 'react';
import './GestionProduits.css';

const API_BASE    = 'http://localhost:5170/api';
const getToken    = () => localStorage.getItem('token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

const UNITES = ['PCE','SRV','KG','LT','MT','M2','M3','BOX','HR','DAY'];
const TVA_TAUX = [0, 7, 13, 19];

export default function GestionProduits() {
    const [view,        setView]        = useState('list');
    const [produits,    setProduits]    = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState(null);
    const [searchTerm,  setSearchTerm]  = useState('');
    const [editId,      setEditId]      = useState(null);
    const [showSuccess, setShowSuccess] = useState('');
    const [submitting,  setSubmitting]  = useState(false);
    const [showAll,     setShowAll]     = useState(false);
    const [filterTVA,   setFilterTVA]   = useState('');

    const [form, setForm] = useState({
        itemCode: '', nom: '', description: '',
        prixUnitaire: '', tauxTVA: '19', uniteMessure: 'PCE',
    });

    useEffect(() => { fetchProduits(); }, []);

    const fetchProduits = async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetch(`${API_BASE}/produits`, { headers: authHeaders() });
            if (!res.ok) throw new Error('Erreur chargement produits');
            setProduits(await res.json());
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    const resetForm = () => {
        setForm({ itemCode:'', nom:'', description:'', prixUnitaire:'', tauxTVA:'19', uniteMessure:'PCE' });
        setEditId(null);
    };

    const handleEdit = (p) => {
        setForm({
            itemCode:     p.itemCode     || '',
            nom:          p.nom          || '',
            description:  p.description  || '',
            prixUnitaire: p.prixUnitaire  != null ? String(p.prixUnitaire) : '',
            tauxTVA:      p.tauxTVA       != null ? String(p.tauxTVA)      : '19',
            uniteMessure: p.uniteMessure  || 'PCE',
        });
        setEditId(p.id);
        setView('form');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer ce produit ?')) return;
        try {
            const res  = await fetch(`${API_BASE}/produits/${id}`, { method:'DELETE', headers: authHeaders() });
            const data = await res.json();
            if (!res.ok) { alert(data.message); return; }
            toast('Produit supprimé avec succès.');
            fetchProduits();
        } catch { alert('Erreur lors de la suppression.'); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSubmitting(true);
        try {
            const body = {
                itemCode:     form.itemCode,
                nom:          form.nom,
                description:  form.description || null,
                prixUnitaire: parseFloat(form.prixUnitaire) || 0,
                tauxTVA:      parseFloat(form.tauxTVA)      || 19,
                uniteMessure: form.uniteMessure || 'PCE',
            };
            const url    = editId ? `${API_BASE}/produits/${editId}` : `${API_BASE}/produits`;
            const method = editId ? 'PUT' : 'POST';
            const res    = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
            const data   = await res.json();
            if (!res.ok) { alert(data.message || 'Erreur serveur'); return; }
            toast(editId ? 'Produit modifié avec succès !' : 'Produit créé avec succès !');
            resetForm(); setView('list'); fetchProduits();
        } catch { alert('Erreur de connexion au serveur.'); }
        finally { setSubmitting(false); }
    };

    const toast = (msg) => { setShowSuccess(msg); setTimeout(() => setShowSuccess(''), 3000); };

    const filtered = produits.filter(p => {
        const matchSearch = (p.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (p.itemCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (p.description || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchTVA = filterTVA === '' || String(p.tauxTVA) === filterTVA;
        return matchSearch && matchTVA;
    });

    const displayed = showAll ? filtered : filtered.slice(0, 10);

    const tvaColor = (taux) => {
        const t = parseFloat(taux);
        if (t === 0)  return 'gray';
        if (t === 7)  return 'blue';
        if (t === 13) return 'orange';
        if (t === 19) return 'purple';
        return 'gray';
    };

    const prixTTC = (pu, tva) => {
        const p = parseFloat(pu) || 0;
        const t = parseFloat(tva) || 0;
        return (p * (1 + t/100)).toFixed(3);
    };

    return (
        <div className="gp-page">

            {showSuccess && (
                <div className="gp-toast">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
                    </svg>
                    {showSuccess}
                </div>
            )}

            {/* ── Header ── */}
            <div className="gp-header">
                <div className="gp-header-left">
                    <h1>Gestion des Produits</h1>
                    <p>Gérez votre catalogue produits et services pour la facturation TEIF.</p>
                </div>
                <div className="gp-header-actions">
                    {view === 'list' ? (
                        <button className="gp-btn-primary" onClick={() => { resetForm(); setView('form'); }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Nouveau Produit
                        </button>
                    ) : (
                        <button className="gp-btn-secondary" onClick={() => { resetForm(); setView('list'); }}>
                            ← Retour à la liste
                        </button>
                    )}
                </div>
            </div>

            {/* ════ VUE LISTE ════ */}
            {view === 'list' && (
                <div className="gp-list-view">

                    {/* Stats */}
                    <div className="gp-stats-row">
                        <div className="gp-stat">
                            <span className="gp-stat-value">{produits.length}</span>
                            <span className="gp-stat-label">Total Produits</span>
                        </div>
                        <div className="gp-stat">
                            <span className="gp-stat-value">{produits.filter(p => parseFloat(p.tauxTVA) === 19).length}</span>
                            <span className="gp-stat-label">TVA 19%</span>
                        </div>
                        <div className="gp-stat">
                            <span className="gp-stat-value">{produits.filter(p => parseFloat(p.tauxTVA) === 7).length}</span>
                            <span className="gp-stat-label">TVA 7%</span>
                        </div>
                        <div className="gp-stat">
                            <span className="gp-stat-value">{produits.filter(p => parseFloat(p.tauxTVA) === 0).length}</span>
                            <span className="gp-stat-label">Exonérés (0%)</span>
                        </div>
                    </div>

                    {/* Barre recherche + filtre */}
                    <div className="gp-toolbar">
                        <div className="gp-search-bar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            </svg>
                            <input type="text" placeholder="Rechercher par nom, code article..."
                                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <select className="gp-filter-select" value={filterTVA} onChange={e => setFilterTVA(e.target.value)}>
                            <option value="">Tous les taux TVA</option>
                            <option value="0">0% — Exonéré</option>
                            <option value="7">7%</option>
                            <option value="13">13%</option>
                            <option value="19">19%</option>
                        </select>
                    </div>

                    {loading && <div className="gp-loading">Chargement...</div>}
                    {error   && (
                        <div className="gp-error">
                            {error} — <button onClick={fetchProduits}>Réessayer</button>
                        </div>
                    )}

                    {!loading && !error && (
                        <div className="gp-table-box">
                            <table className="gp-table">
                                <thead>
                                    <tr>
                                        <th>CODE ARTICLE</th>
                                        <th>PRODUIT / SERVICE</th>
                                        <th>UNITÉ</th>
                                        <th>PRIX HT (DT)</th>
                                        <th>TVA</th>
                                        <th>PRIX TTC (DT)</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayed.length === 0 ? (
                                        <tr><td colSpan="7" className="gp-empty">
                                            {searchTerm || filterTVA ? 'Aucun produit ne correspond à votre recherche.' : 'Aucun produit enregistré.'}
                                        </td></tr>
                                    ) : displayed.map(p => (
                                        <tr key={p.id}>
                                            <td>
                                                <span className="gp-code">{p.itemCode || '—'}</span>
                                            </td>
                                            <td>
                                                <div className="gp-product-cell">
                                                    <div className="gp-avatar">
                                                        {(p.nom || '?').substring(0,2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="gp-product-name">{p.nom}</div>
                                                        {p.description && (
                                                            <div className="gp-product-desc">{p.description.substring(0,50)}{p.description.length > 50 ? '...' : ''}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="gp-badge gray">{p.uniteMessure || 'PCE'}</span>
                                            </td>
                                            <td className="gp-price">
                                                {parseFloat(p.prixUnitaire || 0).toFixed(3)}
                                            </td>
                                            <td>
                                                <span className={`gp-badge ${tvaColor(p.tauxTVA)}`}>
                                                    {parseFloat(p.tauxTVA || 0)}%
                                                </span>
                                            </td>
                                            <td className="gp-price gp-price-ttc">
                                                {prixTTC(p.prixUnitaire, p.tauxTVA)}
                                            </td>
                                            <td>
                                                <div className="gp-actions">
                                                    <button className="gp-btn-edit" onClick={() => handleEdit(p)} title="Modifier">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                        </svg>
                                                        Modifier
                                                    </button>
                                                    <button className="gp-btn-delete" onClick={() => handleDelete(p.id)} title="Supprimer">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                            <polyline points="3 6 5 6 21 6"/>
                                                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                                            <path d="M10 11v6"/><path d="M14 11v6"/>
                                                            <path d="M9 6V4h6v2"/>
                                                        </svg>
                                                        Supprimer
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {filtered.length > 10 && (
                                <div className="gp-show-more">
                                    <button onClick={() => setShowAll(!showAll)}>
                                        {showAll
                                            ? '▲ Réduire'
                                            : `▼ Voir tous les produits (${filtered.length})`}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ════ VUE FORMULAIRE ════ */}
            {view === 'form' && (
                <div className="gp-form-view">
                    <div className="gp-form-card">
                        <div className="gp-form-title">
                            {editId ? '✏️ Modifier le produit' : '📦 Nouveau produit'}
                        </div>

                        <form onSubmit={handleSubmit} className="gp-form">

                            {/* Ligne 1 : Code + Unité */}
                            <div className="gp-form-row">
                                <div className="gp-field">
                                    <label>Code Article <span className="gp-required">*</span></label>
                                    <input type="text" placeholder="ex : PROD001, SRV-CONSULT"
                                        value={form.itemCode}
                                        onChange={e => setForm({...form, itemCode: e.target.value})}
                                        maxLength={35} required />
                                    <span className="gp-hint">Identifiant unique TEIF (max 35 caractères)</span>
                                </div>
                                <div className="gp-field">
                                    <label>Unité de Mesure <span className="gp-required">*</span></label>
                                    <select value={form.uniteMessure}
                                        onChange={e => setForm({...form, uniteMessure: e.target.value})}>
                                        {UNITES.map(u => (
                                            <option key={u} value={u}>{u}</option>
                                        ))}
                                    </select>
                                    <span className="gp-hint">PCE=Pièce · SRV=Service · KG · LT · MT · M2 · HR · DAY</span>
                                </div>
                            </div>

                            {/* Ligne 2 : Nom */}
                            <div className="gp-field">
                                <label>Désignation / Nom <span className="gp-required">*</span></label>
                                <input type="text" placeholder="ex : Service de Facturation Électronique"
                                    value={form.nom}
                                    onChange={e => setForm({...form, nom: e.target.value})}
                                    required />
                            </div>

                            {/* Ligne 3 : Description */}
                            <div className="gp-field">
                                <label>Description</label>
                                <textarea placeholder="Description détaillée du produit ou service (optionnel)"
                                    value={form.description}
                                    onChange={e => setForm({...form, description: e.target.value})}
                                    rows={3} />
                            </div>

                            {/* Ligne 4 : Prix + TVA */}
                            <div className="gp-form-row">
                                <div className="gp-field">
                                    <label>Prix Unitaire HT (DT) <span className="gp-required">*</span></label>
                                    <input type="number" placeholder="0.000" step="0.001" min="0"
                                        value={form.prixUnitaire}
                                        onChange={e => setForm({...form, prixUnitaire: e.target.value})}
                                        required />
                                </div>
                                <div className="gp-field">
                                    <label>Taux TVA <span className="gp-required">*</span></label>
                                    <select value={form.tauxTVA}
                                        onChange={e => setForm({...form, tauxTVA: e.target.value})}>
                                        {TVA_TAUX.map(t => (
                                            <option key={t} value={String(t)}>
                                                {t}% {t === 0 ? '(Exonéré)' : t === 7 ? '(Réduit)' : t === 13 ? '(Intermédiaire)' : '(Normal)'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Aperçu TTC */}
                            {form.prixUnitaire && (
                                <div className="gp-ttc-preview">
                                    <span>💡 Prix TTC calculé :</span>
                                    <strong>{prixTTC(form.prixUnitaire, form.tauxTVA)} DT</strong>
                                    <span className="gp-ttc-detail">
                                        ({parseFloat(form.prixUnitaire||0).toFixed(3)} HT
                                        + {(parseFloat(form.prixUnitaire||0) * parseFloat(form.tauxTVA||0)/100).toFixed(3)} TVA)
                                    </span>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="gp-form-actions">
                                <button type="button" className="gp-btn-secondary"
                                    onClick={() => { resetForm(); setView('list'); }}>
                                    Annuler
                                </button>
                                <button type="submit" className="gp-btn-primary" disabled={submitting}>
                                    {submitting ? 'Enregistrement...' : editId ? '✓ Enregistrer les modifications' : '+ Créer le produit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}