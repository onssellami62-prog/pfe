import React, { useState, useEffect } from 'react';
import './MyInvoices.css';

const API_BASE    = 'http://localhost:5170/api';
const getToken    = () => localStorage.getItem('token');
const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`
});

const fmt = (n) => parseFloat(n || 0).toFixed(3);

export default function MyInvoices({ onNewInvoice, initialFilter = 'Tous les statuts' }) {
    const [factures, setFactures]         = useState([]);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState(null);
    const [searchTerm, setSearchTerm]     = useState('');
    const [statusFilter, setStatusFilter] = useState(initialFilter);

    // Met à jour le filtre quand on arrive depuis l'accueil
    useEffect(() => {
        setStatusFilter(initialFilter);
    }, [initialFilter]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    useEffect(() => { fetchFactures(); }, []);

    const fetchFactures = async () => {
        setLoading(true);
        setError(null);
        try {
            const res  = await fetch(`${API_BASE}/factures`, { headers: authHeaders() });
            if (!res.ok) throw new Error('Erreur chargement factures');
            setFactures(await res.json());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleView = async (facture) => {
        try {
            const res  = await fetch(`${API_BASE}/factures/${facture.numeroFacture}`, { headers: authHeaders() });
            const data = await res.json();
            setSelectedInvoice(data);
        } catch {
            setSelectedInvoice(facture);
        }
    };

    const closeModal = () => setSelectedInvoice(null);

    // Libellés statuts
    const statutLabel = (s) => ({
        'Brouillon':   'Brouillon',
        'SoumiseTTN':  'En cours',
        'AcceptéeTTN': 'Validé',
        'Rejetée':     'Rejetée',
        'Annulée':     'Annulée',
    }[s] || s);

    const statutCss = (s) => ({
        'AcceptéeTTN': 'validé',
        'SoumiseTTN':  'en-cours',
        'Rejetée':     'rejetée',
        'Annulée':     'rejetée',
    }[s] || 'brouillon');

    const filteredData = factures.filter(f => {
        const matchSearch =
            (f.tiersNom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(f.numeroFacture).includes(searchTerm);
        const matchStatus =
            statusFilter === 'Tous les statuts' ||
            statutLabel(f.statut) === statusFilter;
        return matchSearch && matchStatus;
    });

    // KPIs
    const totalValidees  = factures.filter(f => f.statut === 'AcceptéeTTN').reduce((s, f) => s + f.montantTTC, 0);
    const totalEnCours   = factures.filter(f => f.statut === 'SoumiseTTN').reduce((s, f) => s + f.montantTTC, 0);

    return (
        <div className="invoices-page">
            <header className="page-top-header">
                <div className="header-left">
                    <h1>Mes Factures</h1>
                    <div className="search-bar">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Rechercher une facture..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="header-actions">
                    <select className="filter-select" value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}>
                        <option>Tous les statuts</option>
                        <option>Validé</option>
                        <option>En cours</option>
                        <option>Rejetée</option>
                        <option>Brouillon</option>
                    </select>
                    <button className="btn-new-invoice" onClick={fetchFactures}>
                        🔄 Actualiser
                    </button>
                    <button className="btn-new-invoice" onClick={onNewInvoice}>
                        + Nouvelle Facture
                    </button>
                </div>
            </header>

            {/* KPIs */}
            <div className="invoice-summary-grid">
                <div className="summary-card">
                    <div className="summary-icon blue">📁</div>
                    <div className="summary-text">
                        <span className="label">TOTAL FACTURES</span>
                        <span className="value">{factures.length}</span>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon green">✅</div>
                    <div className="summary-text">
                        <span className="label">MONTANT VALIDÉ</span>
                        <span className="value">{fmt(totalValidees)} <small>DT</small></span>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon orange">⏳</div>
                    <div className="summary-text">
                        <span className="label">MONTANT EN COURS</span>
                        <span className="value">{fmt(totalEnCours)} <small>DT</small></span>
                    </div>
                </div>
            </div>

            {/* Loading / Error */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    Chargement des factures...
                </div>
            )}
            {error && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444', background: '#fef2f2', borderRadius: 8, margin: '1rem 0' }}>
                    {error} — <button onClick={fetchFactures} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>Réessayer</button>
                </div>
            )}

            {/* Tableau */}
            {!loading && !error && (
                <div className="table-container">
                    <table className="invoices-table">
                        <thead>
                            <tr>
                                <th>DATE</th>
                                <th>N° FACTURE</th>
                                <th>CLIENT</th>
                                <th>TOTAL TTC (DT)</th>
                                <th>RÉFÉRENCE TTN</th>
                                <th>STATUT</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map(f => (
                                <tr key={f.numeroFacture}>
                                    <td>{new Date(f.dateFacture).toLocaleDateString('fr-TN')}</td>
                                    <td className="font-semibold">FAC-{f.numeroFacture}</td>
                                    <td>{f.tiersNom}</td>
                                    <td className="font-semibold">{fmt(f.montantTTC)}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#16a34a' }}>
                                        {f.idTTN || '—'}
                                    </td>
                                    <td>
                                        <span className={`status-pill ${statutCss(f.statut)}`}>
                                            {statutLabel(f.statut)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="icon-btn" onClick={() => handleView(f)}>👁️</button>
                                            <button className="icon-btn">⋮</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredData.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                        Aucune facture trouvée.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <div className="table-footer">
                        <span className="results-count">{filteredData.length} facture(s) affichée(s)</span>
                    </div>
                </div>
            )}

            <div className="export-hint">
                <div className="hint-icon">ℹ️</div>
                <div className="hint-content">
                    <h4>Exportations</h4>
                    <p>Cliquez sur 👁️ pour voir le détail d'une facture. Le téléchargement XML TEIF sera disponible prochainement.</p>
                </div>
            </div>

            {/* Modal détail */}
            {selectedInvoice && (
                <div className="invoice-modal-overlay" onClick={closeModal} style={{ zIndex: 4000 }}>
                    <div className="invoice-modal-content" onClick={e => e.stopPropagation()}>
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
                                    <p><strong>N° :</strong> FAC-{selectedInvoice.numeroFacture}</p>
                                    <p><strong>Date :</strong> {new Date(selectedInvoice.dateFacture).toLocaleDateString('fr-TN')}</p>
                                    {selectedInvoice.idTTN && (
                                        <p style={{ fontSize: 11, color: '#16a34a', fontFamily: 'monospace' }}>
                                            TTN: {selectedInvoice.idTTN}
                                        </p>
                                    )}
                                </div>
                            </header>

                            <div className="bill-to-section">
                                <div className="bill-col">
                                    <span>ÉMETTEUR</span>
                                    <p><strong>El Fatoora Platform</strong></p>
                                    <p>Tunis, Tunisie</p>
                                </div>
                                <div className="bill-col">
                                    <span>DESTINATAIRE</span>
                                    <p><strong>{selectedInvoice.tiersNom}</strong></p>
                                    {selectedInvoice.tiersMatricule && <p>Mat: {selectedInvoice.tiersMatricule}</p>}
                                    {selectedInvoice.tiersAdresse && <p>{selectedInvoice.tiersAdresse}</p>}
                                </div>
                            </div>

                            {selectedInvoice.lignes?.length > 0 && (
                                <table className="paper-table">
                                    <thead>
                                        <tr>
                                            <th>Désignation</th>
                                            <th className="text-right">Qté</th>
                                            <th className="text-right">PU HT</th>
                                            <th className="text-right">TVA</th>
                                            <th className="text-right">Total HT</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedInvoice.lignes.map((l, i) => (
                                            <tr key={i}>
                                                <td>{l.designation || l.produitNom}</td>
                                                <td className="text-right">{l.quantite}</td>
                                                <td className="text-right">{fmt(l.prixUnitaire)} DT</td>
                                                <td className="text-right">{l.tauxTVA}%</td>
                                                <td className="text-right">{fmt(l.montantHT)} DT</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            <div className="invoice-summary-box">
                                <div className="summary-row">
                                    <span>Total HT</span>
                                    <span>{fmt(selectedInvoice.totalHT)} DT</span>
                                </div>
                                <div className="summary-row">
                                    <span>TVA</span>
                                    <span>{fmt(selectedInvoice.totalTVA)} DT</span>
                                </div>
                                {selectedInvoice.montantTimbre > 0 && (
                                    <div className="summary-row">
                                        <span>Timbre Fiscal</span>
                                        <span>{fmt(selectedInvoice.montantTimbre)} DT</span>
                                    </div>
                                )}
                                <div className="summary-row total">
                                    <span>MONTANT TTC</span>
                                    <span>{fmt(selectedInvoice.montantTTC)} DT</span>
                                </div>
                            </div>

                            {selectedInvoice.montantEnLettres && (
                                <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', margin: '1rem 0', fontSize: 12, color: '#475569', fontStyle: 'italic' }}>
                                    {selectedInvoice.montantEnLettres}
                                </div>
                            )}
                        </div>

                        <div className="modal-actions-footer">
                            <button className="btn-secondary" onClick={() => window.print()}>🖨️ Imprimer</button>
                            <button className="btn-primary">📥 Télécharger PDF</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}