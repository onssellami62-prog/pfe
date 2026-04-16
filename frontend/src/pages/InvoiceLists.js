import React, { useState, useEffect } from 'react';
import './InvoiceLists.js.css';

const API_BASE    = 'http://localhost:5170/api';
const getToken    = () => localStorage.getItem('token');
const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`
});

export default function InvoiceLists({ initialFilter = 'validated', onErrorClick }) {
    const [filter, setFilter]               = useState(initialFilter);
    const [factures, setFactures]           = useState([]);
    const [loading, setLoading]             = useState(true);
    const [error, setError]                 = useState(null);
    const [searchTerm, setSearchTerm]       = useState('');
    const [showFilters, setShowFilters]     = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [stats, setStats]                 = useState({ nbValidees: 0, nbRejetees: 0 });

    useEffect(() => { fetchFactures(); }, []);

    const fetchFactures = async () => {
        setLoading(true);
        setError(null);
        try {
            const res  = await fetch(`${API_BASE}/factures`, { headers: authHeaders() });
            if (!res.ok) throw new Error('Erreur chargement factures');
            const data = await res.json();
            setFactures(data);
            setStats({
                nbValidees: data.filter(f => f.statut === 'AcceptéeTTN').length,
                nbRejetees: data.filter(f => f.statut === 'Rejetée').length,
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Charger détail facture pour le modal
    const handleViewInvoice = async (facture) => {
        try {
            const res  = await fetch(`${API_BASE}/factures/${facture.numeroFacture}`, { headers: authHeaders() });
            const data = await res.json();
            setSelectedInvoice(data);
        } catch {
            setSelectedInvoice(facture);
        }
    };

    const closeModal = () => setSelectedInvoice(null);

    const getTitle = () => {
        if (filter === 'validated') return 'Factures Acceptées';
        return 'Factures Rejetées & Erreurs';
    };

    // Filtrage selon statut sélectionné
    const filteredData = factures.filter(f => {
        const matchStatut = filter === 'validated'
            ? f.statut === 'AcceptéeTTN'
            : f.statut === 'Rejetée';

        const matchSearch =
            (f.tiersNom  || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(f.numeroFacture).includes(searchTerm);

        return matchStatut && matchSearch;
    });

    const fmt = (n) => parseFloat(n || 0).toFixed(3);

    return (
        <div className="invoice-lists-container">
            <header className="list-header">
                <h1>{getTitle()}</h1>
            </header>

            {/* ── 2 cartes seulement : Acceptées + Rejetées ── */}
            <div className="status-cards-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div
                    className={`status-card-mini green ${filter === 'validated' ? 'active' : ''}`}
                    onClick={() => setFilter('validated')}
                >
                    <div className="card-top">
                        <span className="icon">✅</span>
                    </div>
                    <span className="label">FACTURES ACCEPTÉES</span>
                    <span className="value">{stats.nbValidees}</span>
                </div>

                <div
                    className={`status-card-mini red ${filter === 'rejected' ? 'active' : ''}`}
                    onClick={() => setFilter('rejected')}
                >
                    <div className="card-top">
                        <span className="icon">❌</span>
                    </div>
                    <span className="label">REJETÉES / ERREURS</span>
                    <span className="value">{stats.nbRejetees}</span>
                </div>
            </div>

            {/* ── Tableau ── */}
            <div className={`table-box ${filter}`}>
                <div className="table-header-row">
                    <h3>
                        {filter === 'validated'
                            ? 'Liste des Factures Acceptées'
                            : 'Liste des Factures Rejetées'}
                    </h3>
                    <div className="table-controls">
                        <div className="search-box">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Rechercher par client ou N°..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="filter-dropdown-container">
                            <button className="filter-btn" onClick={() => setShowFilters(!showFilters)}>
                                Filtres
                            </button>
                            {showFilters && (
                                <div className="filter-popup">
                                    <h4>Filtrer par période</h4>
                                    <label><input type="radio" name="period" /> 7 derniers jours</label>
                                    <label><input type="radio" name="period" /> Ce mois</label>
                                    <label><input type="radio" name="period" /> Année en cours</label>
                                    <hr />
                                    <button className="btn-apply" onClick={() => setShowFilters(false)}>Appliquer</button>
                                </div>
                            )}
                        </div>
                        <button className="export-btn" onClick={() => {
                            const csv = [
                                ['N° Facture', 'Client', 'Date', 'Montant TTC', 'Statut', 'Référence TTN'],
                                ...filteredData.map(f => [
                                    f.numeroFacture,
                                    f.tiersNom,
                                    new Date(f.dateFacture).toLocaleDateString('fr-TN'),
                                    fmt(f.montantTTC),
                                    f.statut,
                                    f.idTTN || ''
                                ])
                            ].map(r => r.join(',')).join('\n');
                            const blob = new Blob([csv], { type: 'text/csv' });
                            const url  = URL.createObjectURL(blob);
                            const a    = document.createElement('a');
                            a.href = url; a.download = `factures_${filter}.csv`; a.click();
                        }}>
                            Exporter (CSV)
                        </button>
                        <button className="export-btn" style={{ background: '#10b981' }} onClick={fetchFactures}>
                            🔄 Actualiser
                        </button>
                    </div>
                </div>

                {/* Loading / Error */}
                {loading && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                        Chargement des factures...
                    </div>
                )}
                {error && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444', background: '#fef2f2', margin: '1rem' , borderRadius: 8 }}>
                        {error} — <button onClick={fetchFactures} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>Réessayer</button>
                    </div>
                )}

                {!loading && !error && (
                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>N° FACTURE</th>
                                <th>CLIENT</th>
                                <th>MATRICULE FISCAL</th>
                                <th>DATE</th>
                                <th>MONTANT TTC</th>
                                <th>RÉFÉRENCE TTN</th>
                                <th>STATUT</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map(row => (
                                <tr key={row.numeroFacture}>
                                    <td>
                                        <span className="blue-text font-bold">
                                            FAC-{row.numeroFacture}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="client-info">
                                            <span className="avatar-small">
                                                {(row.tiersNom || '?').substring(0, 2).toUpperCase()}
                                            </span>
                                            {row.tiersNom}
                                        </div>
                                    </td>
                                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>
                                        {row.tiersMatricule || '—'}
                                    </td>
                                    <td>
                                        {new Date(row.dateFacture).toLocaleDateString('fr-TN')}
                                    </td>
                                    <td className="font-bold">
                                        {fmt(row.montantTTC)} DT
                                    </td>
                                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#16a34a' }}>
                                        {row.idTTN || '—'}
                                    </td>
                                    <td>
                                        <span className={`pill ${filter === 'validated' ? 'validée' : 'rejetée'}`}>
                                            {filter === 'validated' ? 'Acceptée' : 'Rejetée'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="row-actions">
                                            <button className="eye-btn" onClick={() => handleViewInvoice(row)}>👁️</button>
                                            {filter === 'rejected' && (
                                                <button className="error-link"
                                                    onClick={() => onErrorClick && onErrorClick(row)}>
                                                    Voir l'erreur
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredData.length === 0 && (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                        Aucune facture {filter === 'validated' ? 'acceptée' : 'rejetée'} trouvée.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}

                <div className="table-footer-pagination">
                    <span>{filteredData.length} facture(s) affichée(s)</span>
                </div>
            </div>

            {/* Hint erreurs */}
            {filter === 'rejected' && (
                <div className="error-hint-box">
                    <div className="hint-icon">⚠️</div>
                    <div className="hint-content">
                        <h4>Aide au diagnostic</h4>
                        <p>
                            Les erreurs de validation TEIF sont souvent liées à un matricule fiscal invalide ou des montants incohérents.
                            Cliquez sur "Voir l'erreur" pour obtenir le détail technique du rejet TTN.
                        </p>
                    </div>
                </div>
            )}

            {/* Modal détail facture */}
            {selectedInvoice && (
                <div className="invoice-modal-overlay" onClick={closeModal}>
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
                                    {selectedInvoice.tiersMatricule && (
                                        <p>Mat: {selectedInvoice.tiersMatricule}</p>
                                    )}
                                    {selectedInvoice.tiersAdresse && (
                                        <p>{selectedInvoice.tiersAdresse}</p>
                                    )}
                                </div>
                            </div>

                            {/* Lignes */}
                            {selectedInvoice.lignes && selectedInvoice.lignes.length > 0 && (
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