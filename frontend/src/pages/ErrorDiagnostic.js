import React, { useState } from 'react';
import './ErrorDiagnostic.css';

export default function ErrorDiagnostic({ invoice, onBack }) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editedData, setEditedData] = useState({
        taxId: '1234567/A/P/000',
        client: invoice?.client || '',
        amount: invoice?.amount || ''
    });

    if (!invoice) return null;

    const handleSave = () => {
        // Simuler la sauvegarde
        setIsEditModalOpen(false);
        alert("Facture mise à jour et renvoyée pour validation !");
    };

    return (
        <div className="error-diags-page">
            <nav className="breadcrumbs">
                <span>Accueil</span> › <span>Factures</span> › <span className="current">Diagnostic d'erreur</span>
            </nav>

            <header className="error-alert-header">
                <div className="alert-content">
                    <div className="alert-icon-wrap">🚫</div>
                    <div className="alert-text">
                        <h2>Échec de validation - Facture N° {invoice.id}</h2>
                        <p>Cette facture a été rejetée par la plateforme TTN (Tunisie Trust Network) pour non-conformité structurelle.</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn-edit-error" onClick={() => setIsEditModalOpen(true)}>✏️ Modifier la facture</button>
                    <button className="btn-report">📄 Rapport complet</button>
                </div>
            </header>

            <div className="diags-grid">
                <div className="diags-left">
                    <section className="diags-section summary-card">
                        <div className="section-title">
                            <span className="icon">ℹ️</span> Résumé de la Transaction
                        </div>
                        <div className="summary-details">
                            <div className="detail-item">
                                <label>ID DE TRANSACTION (IDSAVEEFACT)</label>
                                <span>TXN - 99283 - EFAC - 2023</span>
                            </div>
                            <div className="detail-item">
                                <label>DATE ET HEURE DU REJET</label>
                                <span>📅 24 Octobre 2023 à 14:35:12</span>
                            </div>
                        </div>
                    </section>

                    <section className="diags-section anomalies-card">
                        <div className="section-title">
                            <span className="icon">📋</span> Détails des Anomalies (2 détectées)
                        </div>

                        <div className="anomaly-item business-rule">
                            <div className="anomaly-icon">🛠️</div>
                            <div className="anomaly-content">
                                <div className="anomaly-header">
                                    <span className="badge">BUSINESS RULE</span>
                                    <span className="code">CODE: ERR_MATRICULE_01</span>
                                    <button className="view-code-link">Voir le code ↓</button>
                                </div>
                                <h4>Format du Matricule Fiscal invalide</h4>
                                <p>Le Matricule Fiscal de l'acheteur (1234567/A/P/000) ne respecte pas le format réglementaire tunisien actuel.</p>
                                <div className="location">
                                    📍 <strong>Localisation:</strong> Header / BuyerDetails  |  {'<>'} <strong>Node:</strong> {'<TaxID>'}
                                </div>
                            </div>
                        </div>

                        <div className="anomaly-item data-integrity">
                            <div className="anomaly-icon">⚠️</div>
                            <div className="anomaly-content">
                                <div className="anomaly-header">
                                    <span className="badge">DATA INTEGRITY</span>
                                    <span className="code">CODE: WRN_SIG_04</span>
                                </div>
                                <h4>Avertissement de Signature Électronique</h4>
                                <p>Le certificat utilisé expire dans moins de 30 jours. Bien que valide, il est recommandé de le renouveler.</p>
                                <div className="location">
                                    📍 <strong>Localisation:</strong> DigitalSignature
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="diags-section code-viewer-card">
                        <div className="code-header">
                            <span className="file-name">📄 invoice_teif_payload.xml</span>
                            <div className="dots"><span></span><span></span><span></span></div>
                        </div>
                        <div className="code-content">
                            <pre><code>
                                {`12  <BuyerDetails>
13    <Name>ENTREPRISE EXEMPLE SARL</Name>`}
                                <span className="highlighted-line">{`14    <TaxID>1234567/A/P/000</TaxID> // ERR_MATRICULE_01`}</span>
                                {`15    <Address>Rue de l'Industrie, Tunis</Address>
16  </BuyerDetails>
17  <InvoiceLines>
18    <Line>
19      <ID>1</ID>
20      <Description>Consulting Services</Description>`}
                            </code></pre>
                        </div>
                    </section>
                </div>

                <div className="diags-right">
                    <div className="action-card-right">
                        <h3>Actions Correctives</h3>
                        <button className="btn-main-action" onClick={() => setIsEditModalOpen(true)}>🚩 Corriger la facture</button>
                        <button className="btn-secondary-action">📥 Télécharger le TEIF</button>

                        <div className="help-box">
                            <div className="help-icon">🎧</div>
                            <div className="help-text">
                                <p><strong>Besoin d'aide ?</strong></p>
                                <span>SUPPORT TECHNIQUE DISPONIBLE</span>
                            </div>
                            <button className="msg-btn">💬</button>
                        </div>
                    </div>

                    <div className="doc-card">
                        <div className="doc-banner">
                            <h2>DOCUMENTATION</h2>
                            <p>REF: TEIF-M-2023 / TUN-TAX</p>
                        </div>
                        <div className="doc-body">
                            <h4>Guide de conformité TTN</h4>
                            <p>Consultez la documentation technique officielle sur les formats de matricule fiscal pour éviter les rejets futurs.</p>
                            <a href="#guide" className="guide-link">Lire le guide ↗</a>
                        </div>
                    </div>

                    <div className="status-indicator">
                        <span className="dot green"></span>
                        Services El Fatoora Opérationnels
                    </div>
                </div>
            </div>

            <footer className="diags-footer">
                <p>© 2023 El Fatoora - Tous droits réservés. Plateforme sécurisée par TTN.</p>
            </footer>

            {/* MODAL DE CORRECTION */}
            {isEditModalOpen && (
                <div className="edit-diag-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
                    <div className="edit-diag-modal-content" onClick={(e) => e.stopPropagation()}>
                        <header className="edit-modal-header">
                            <h3>Correction de la Facture {invoice.id}</h3>
                            <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>✕</button>
                        </header>

                        <div className="edit-modal-body">
                            <p className="modal-intro">Veuillez corriger les champs marqués en rouge pour valider la conformité TEIF.</p>

                            <div className="edit-form-group">
                                <label>Client</label>
                                <input
                                    type="text"
                                    value={editedData.client}
                                    onChange={(e) => setEditedData({ ...editedData, client: e.target.value })}
                                />
                            </div>

                            <div className="edit-form-group error">
                                <label>Matricule Fiscal (ERREUR DÉTECTÉE)</label>
                                <input
                                    type="text"
                                    className="error-input"
                                    value={editedData.taxId}
                                    onChange={(e) => setEditedData({ ...editedData, taxId: e.target.value })}
                                />
                                <span className="error-msg">Le format doit être : 0000000/A/P/000</span>
                            </div>

                            <div className="edit-form-group">
                                <label>Montant total</label>
                                <input
                                    type="text"
                                    value={editedData.amount}
                                    onChange={(e) => setEditedData({ ...editedData, amount: e.target.value })}
                                />
                            </div>
                        </div>

                        <footer className="edit-modal-footer">
                            <button className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>Annuler</button>
                            <button className="btn-save" onClick={handleSave}>Enregistrer et Valider</button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
}
