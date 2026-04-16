import React, { useState, useEffect } from 'react';

const API_BASE    = 'http://localhost:5170/api';
const getToken    = () => localStorage.getItem('token');
const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`
});

const fmt = (n) => parseFloat(n || 0).toFixed(3);

export default function GestionAvoirs() {
    const [view, setView]                 = useState('list'); // 'list' | 'form'
    const [avoirs, setAvoirs]             = useState([]);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState('');
    const [success, setSuccess]           = useState('');
    const [submitting, setSubmitting]     = useState(false);

    // Form state
    const [factureOrigineId, setFactureOrigineId] = useState('');
    const [typeRetour, setTypeRetour]             = useState('Total');
    const [factureOriginale, setFactureOriginale] = useState(null);
    const [loadingFacture, setLoadingFacture]     = useState(false);
    const [errFacture, setErrFacture]             = useState('');
    const [lignesSelectionnees, setLignesSelectionnees] = useState([]);

    // ── Chargement avoirs ─────────────────────────────────────────────
    useEffect(() => { fetchAvoirs(); }, []);

    const fetchAvoirs = async () => {
        setLoading(true);
        try {
            const res  = await fetch(`${API_BASE}/avoirs`, { headers: authHeaders() });
            const data = await res.json();
            setAvoirs(Array.isArray(data) ? data : []);
        } catch {
            setError('Erreur chargement avoirs.');
        } finally {
            setLoading(false);
        }
    };

    // ── Charger la facture originale ─────────────────────────────────
    const chargerFacture = async () => {
        if (!factureOrigineId) return;
        setErrFacture('');
        setFactureOriginale(null);
        setLignesSelectionnees([]);
        setLoadingFacture(true);
        try {
            const res  = await fetch(`${API_BASE}/factures/${factureOrigineId}`, { headers: authHeaders() });
            const data = await res.json();
            if (!res.ok) { setErrFacture(data.message || 'Facture introuvable.'); return; }
            if (data.statut !== 'AcceptéeTTN') {
                setErrFacture(`Cette facture est en statut "${data.statut}". Seules les factures acceptées par TTN peuvent faire l'objet d'un avoir.`);
                return;
            }
            setFactureOriginale(data);
            // Initialiser les lignes avec quantité 0
            setLignesSelectionnees(data.lignes.map(l => ({
                numlignOrigine:   l.numligne,
                designation:      l.designation,
                quantiteMax:      l.quantite,
                prixUnitaire:     l.prixUnitaire,
                tauxTVA:          l.tauxTVA,
                quantiteRetournee: 0,
                selected:         false
            })));
        } catch {
            setErrFacture('Erreur de connexion au serveur.');
        } finally {
            setLoadingFacture(false);
        }
    };

    // ── Soumettre l'avoir ────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            let body = {
                factureOrigineId: parseInt(factureOrigineId),
                typeRetour
            };

            if (typeRetour === 'Partiel') {
                const lignesFiltrees = lignesSelectionnees
                    .filter(l => l.selected && l.quantiteRetournee > 0);

                if (lignesFiltrees.length === 0) {
                    setError('Sélectionnez au moins une ligne avec une quantité > 0.');
                    setSubmitting(false);
                    return;
                }

                body.lignes = lignesFiltrees.map(l => ({
                    numlignOrigine:    l.numlignOrigine,
                    quantiteRetournee: l.quantiteRetournee
                }));
            }

            const res  = await fetch(`${API_BASE}/avoirs`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.message || 'Erreur serveur.');
                return;
            }

            setSuccess(`Avoir N°${data.numeroAvoir} créé avec succès — Montant TTC: ${fmt(data.montantTTC)} DT`);
            setView('list');
            fetchAvoirs();
            resetForm();

        } catch {
            setError('Erreur de connexion au serveur.');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFactureOrigineId('');
        setTypeRetour('Total');
        setFactureOriginale(null);
        setLignesSelectionnees([]);
        setErrFacture('');
        setError('');
    };

    // ── Annuler un avoir ─────────────────────────────────────────────
    const handleAnnuler = async (id) => {
        if (!window.confirm('Annuler cet avoir ?')) return;
        try {
            const res  = await fetch(`${API_BASE}/avoirs/${id}/annuler`, {
                method: 'PUT', headers: authHeaders()
            });
            const data = await res.json();
            if (!res.ok) { alert(data.message); return; }
            toast('Avoir annulé.');
            fetchAvoirs();
        } catch { alert('Erreur.'); }
    };

    const toast = (msg) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(''), 3000);
    };

    const updateLigne = (index, field, value) => {
        const updated = [...lignesSelectionnees];
        updated[index][field] = value;
        if (field === 'selected' && !value) updated[index].quantiteRetournee = 0;
        setLignesSelectionnees(updated);
    };

    // Calcul montant avoir partiel
    const montantAvoirPartiel = lignesSelectionnees
        .filter(l => l.selected && l.quantiteRetournee > 0)
        .reduce((sum, l) => {
            const ht  = l.quantiteRetournee * l.prixUnitaire;
            const tva = ht * (l.tauxTVA / 100);
            return sum + ht + tva;
        }, 0);

    const statutBadge = (statut) => {
        const map = {
            'Brouillon':   'bg-gray-100 text-gray-600',
            'AcceptéeTTN': 'bg-green-100 text-green-700',
            'Rejetée':     'bg-red-100 text-red-700',
            'Annulée':     'bg-orange-100 text-orange-700',
        };
        return map[statut] || 'bg-gray-100 text-gray-600';
    };

    return (
        <div style={{ padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Toast succès */}
            {success && (
                <div style={{
                    background: '#1e429f', color: 'white',
                    padding: '12px 20px', borderRadius: 10,
                    fontSize: 13, fontWeight: 500,
                    display: 'flex', alignItems: 'center', gap: 8
                }}>
                    ✅ {success}
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>
                        Gestion des Avoirs
                    </h1>
                    <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
                        Créez des notes de crédit pour les retours partiels ou totaux de marchandises.
                    </p>
                </div>
                {view === 'list' ? (
                    <button onClick={() => { resetForm(); setView('form'); }} style={{
                        background: '#1e429f', color: 'white', border: 'none',
                        borderRadius: 10, padding: '10px 20px', fontSize: 14,
                        fontWeight: 600, cursor: 'pointer', display: 'flex',
                        alignItems: 'center', gap: 8
                    }}>
                        + Nouvel Avoir
                    </button>
                ) : (
                    <button onClick={() => { resetForm(); setView('list'); }} style={{
                        background: 'white', color: '#475569',
                        border: '1px solid #e2e8f0', borderRadius: 10,
                        padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer'
                    }}>
                        ← Retour à la liste
                    </button>
                )}
            </div>

            {/* ══════════ VUE LISTE ══════════ */}
            {view === 'list' && (
                <div>
                    {loading && (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                            Chargement...
                        </div>
                    )}

                    {!loading && (
                        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc' }}>
                                        {['N° AVOIR', 'DATE', 'CLIENT', 'FACTURE ORIGINALE', 'MONTANT TTC', 'TYPE', 'STATUT', 'ACTIONS'].map(h => (
                                            <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #f1f5f9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {avoirs.map(a => (
                                        <tr key={a.numeroFacture} style={{ borderBottom: '1px solid #f8fafc' }}>
                                            <td style={{ padding: '14px 16px', fontWeight: 700, color: '#1e293b' }}>
                                                AV-{a.numeroFacture}
                                            </td>
                                            <td style={{ padding: '14px 16px', color: '#475569' }}>
                                                {new Date(a.dateFacture).toLocaleDateString('fr-TN')}
                                            </td>
                                            <td style={{ padding: '14px 16px', color: '#475569' }}>
                                                {a.tiersNom}
                                            </td>
                                            <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 12, color: '#1e429f' }}>
                                                FAC-{a.factureOrigineId}
                                            </td>
                                            <td style={{ padding: '14px 16px', fontWeight: 700, color: '#1e293b' }}>
                                                {fmt(a.montantTTC)} DT
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <span style={{
                                                    fontSize: 11, fontWeight: 600, padding: '3px 10px',
                                                    borderRadius: 20,
                                                    background: a.typeRetour === 'Total' ? '#eff6ff' : '#f5f3ff',
                                                    color: a.typeRetour === 'Total' ? '#1e429f' : '#6d28d9'
                                                }}>
                                                    {a.typeRetour}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <span style={{
                                                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20
                                                }} className={statutBadge(a.statut)}>
                                                    {a.statut}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                {a.statut === 'Brouillon' && (
                                                    <button onClick={() => handleAnnuler(a.numeroFacture)} style={{
                                                        background: '#fef2f2', color: '#dc2626',
                                                        border: '1px solid #fecaca', borderRadius: 6,
                                                        padding: '4px 10px', fontSize: 11,
                                                        fontWeight: 600, cursor: 'pointer'
                                                    }}>
                                                        Annuler
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {avoirs.length === 0 && (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                                Aucun avoir créé pour le moment.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            <div style={{ padding: '12px 16px', fontSize: 13, color: '#94a3b8', borderTop: '1px solid #f1f5f9' }}>
                                {avoirs.length} avoir(s)
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ══════════ VUE FORMULAIRE ══════════ */}
            {view === 'form' && (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Étape 1 — Sélection facture */}
                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
                        <div style={{ background: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 16 }}>🔍</span>
                            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1e293b' }}>
                                Étape 1 — Facture originale
                            </h3>
                        </div>
                        <div style={{ padding: '1.25rem', display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                                    Numéro de la facture originale
                                </label>
                                <input
                                    type="number" required
                                    placeholder="Ex: 1"
                                    value={factureOrigineId}
                                    onChange={e => setFactureOrigineId(e.target.value)}
                                    style={{ padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', width: '100%' }}
                                />
                            </div>
                            <button type="button" onClick={chargerFacture} disabled={!factureOrigineId || loadingFacture}
                                style={{
                                    marginTop: 22, background: '#1e429f', color: 'white',
                                    border: 'none', borderRadius: 8, padding: '9px 18px',
                                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                    opacity: !factureOrigineId || loadingFacture ? 0.5 : 1
                                }}>
                                {loadingFacture ? 'Chargement...' : 'Charger la facture'}
                            </button>
                        </div>

                        {errFacture && (
                            <div style={{ margin: '0 1.25rem 1.25rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
                                {errFacture}
                            </div>
                        )}

                        {/* Aperçu facture originale */}
                        {factureOriginale && (
                            <div style={{ margin: '0 1.25rem 1.25rem', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '14px 16px' }}>
                                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: 13 }}>
                                    <div><span style={{ color: '#64748b', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 2 }}>CLIENT</span><strong>{factureOriginale.tiersNom}</strong></div>
                                    <div><span style={{ color: '#64748b', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 2 }}>DATE</span>{new Date(factureOriginale.dateFacture).toLocaleDateString('fr-TN')}</div>
                                    <div><span style={{ color: '#64748b', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 2 }}>MONTANT TTC</span><strong style={{ color: '#1e429f' }}>{fmt(factureOriginale.montantTTC)} DT</strong></div>
                                    <div><span style={{ color: '#64748b', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 2 }}>STATUT</span><span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{factureOriginale.statut}</span></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Étape 2 — Type de retour */}
                    {factureOriginale && (
                        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
                            <div style={{ background: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 16 }}>↩️</span>
                                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1e293b' }}>
                                    Étape 2 — Type de retour
                                </h3>
                            </div>
                            <div style={{ padding: '1.25rem', display: 'flex', gap: 16 }}>
                                {['Total', 'Partiel'].map(type => (
                                    <div key={type} onClick={() => setTypeRetour(type)}
                                        style={{
                                            flex: 1, padding: '1.25rem', borderRadius: 12, cursor: 'pointer',
                                            border: typeRetour === type ? '2px solid #1e429f' : '1px solid #e2e8f0',
                                            background: typeRetour === type ? '#eff6ff' : 'white',
                                            transition: 'all 0.15s'
                                        }}>
                                        <div style={{ fontSize: 20, marginBottom: 6 }}>
                                            {type === 'Total' ? '📦' : '📋'}
                                        </div>
                                        <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', marginBottom: 4 }}>
                                            Retour {type}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#64748b' }}>
                                            {type === 'Total'
                                                ? `Remboursement complet — ${fmt(factureOriginale.montantTTC)} DT`
                                                : 'Sélectionnez les lignes et quantités à retourner'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Étape 3 — Lignes (si partiel) */}
                    {factureOriginale && typeRetour === 'Partiel' && (
                        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
                            <div style={{ background: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 16 }}>📋</span>
                                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1e293b' }}>
                                    Étape 3 — Lignes à retourner
                                </h3>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc' }}>
                                        <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#64748b', fontWeight: 600 }}>SEL.</th>
                                        <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#64748b', fontWeight: 600 }}>DÉSIGNATION</th>
                                        <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 11, color: '#64748b', fontWeight: 600 }}>QTÉ ORIGINALE</th>
                                        <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 11, color: '#64748b', fontWeight: 600 }}>QTÉ À RETOURNER</th>
                                        <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, color: '#64748b', fontWeight: 600 }}>PU HT</th>
                                        <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, color: '#64748b', fontWeight: 600 }}>MONTANT AVOIR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lignesSelectionnees.map((ligne, i) => {
                                        const montantLigne = ligne.selected && ligne.quantiteRetournee > 0
                                            ? ligne.quantiteRetournee * ligne.prixUnitaire * (1 + ligne.tauxTVA / 100)
                                            : 0;
                                        return (
                                            <tr key={i} style={{ borderTop: '1px solid #f1f5f9', background: ligne.selected ? '#f0f9ff' : 'white' }}>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <input type="checkbox" checked={ligne.selected}
                                                        onChange={e => updateLigne(i, 'selected', e.target.checked)}
                                                        style={{ width: 16, height: 16, accentColor: '#1e429f' }} />
                                                </td>
                                                <td style={{ padding: '12px 16px', fontWeight: 500, color: '#1e293b' }}>
                                                    {ligne.designation}
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b' }}>
                                                    {ligne.quantiteMax}
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                    <input type="number" min="0" max={ligne.quantiteMax}
                                                        disabled={!ligne.selected}
                                                        value={ligne.quantiteRetournee}
                                                        onChange={e => updateLigne(i, 'quantiteRetournee', parseInt(e.target.value) || 0)}
                                                        style={{
                                                            width: 70, padding: '6px 8px', textAlign: 'center',
                                                            border: '1px solid #e2e8f0', borderRadius: 6,
                                                            fontSize: 13, fontWeight: 600,
                                                            opacity: ligne.selected ? 1 : 0.4,
                                                            outline: 'none'
                                                        }} />
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#64748b' }}>
                                                    {fmt(ligne.prixUnitaire)} DT
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: montantLigne > 0 ? '#1e429f' : '#94a3b8' }}>
                                                    {fmt(montantLigne)} DT
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                                        <td colSpan="5" style={{ padding: '12px 16px', fontWeight: 700, color: '#1e293b', fontSize: 13 }}>
                                            Total Avoir (TTC)
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, fontSize: 16, color: '#1e429f' }}>
                                            {fmt(montantAvoirPartiel)} DT
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}

                    {/* Erreur */}
                    {error && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    {factureOriginale && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                            <button type="button" onClick={() => { resetForm(); setView('list'); }} style={{
                                background: 'white', color: '#475569', border: '1px solid #e2e8f0',
                                borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer'
                            }}>
                                Annuler
                            </button>
                            <button type="submit" disabled={submitting} style={{
                                background: '#1e429f', color: 'white', border: 'none',
                                borderRadius: 10, padding: '10px 24px', fontSize: 14,
                                fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
                                opacity: submitting ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 8
                            }}>
                                {submitting ? '⏳ Création...' : `✅ Créer l'avoir${typeRetour === 'Total' ? ' total' : ' partiel'}`}
                            </button>
                        </div>
                    )}
                </form>
            )}
        </div>
    );
}