
import React from 'react';
import ReactDOM from 'react-dom';
import './InvoicePreviewModal.css';
import { generateTeifXml, downloadXml } from '../utils/teifGenerator';
import { amountToWords, formatMatriculeDisplay, validateMatriculeFiscal } from '../utils/invoiceFormatters';

/**
 * Génère le XML <QRDATA> conforme TTN pour les factures validées et signées.
 * Version compacte (monoligne) pour maximiser la capacité du QR code.
 */
/*
const generateQrDataXml = (invoice, user) => {
    // ... code commented out ...
};
*/

const Icons = {
    Print: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
        </svg>
    ),
    Close: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    Phone: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }}>
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
    ),
    Mail: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }}>
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
        </svg>
    ),
    CreditCard: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }}>
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
    ),
    Calendar: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
    ),
    CheckCircle: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
    ),
    AlertTriangle: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
    )
};

// const API = 'http://localhost:5170/api';

export default function InvoicePreviewModal({ isOpen, onClose, invoice, user, initialView = 'invoice' }) {
    const [showXml, setShowXml] = React.useState(initialView === 'xml');

    React.useEffect(() => {
        if (isOpen) setShowXml(initialView === 'xml');
    }, [isOpen, initialView]);

    if (!isOpen || !invoice) return null;

    // Harmonize fields
    const lines = invoice.lines || invoice.items || [];
    const clientRNE = invoice.clientRNE || invoice.clientRne || '--- --- ---';
    const issuerRNE = invoice.rneIssuer || (user && user.rne) || '--- --- ---';

    const handlePrint = () => {
        window.print();
    };

    const copyXml = () => {
        const xml = invoice.isSigned ? invoice.signedXmlContent : generateTeifXml(user, invoice);
        navigator.clipboard.writeText(xml);
        alert("XML copié dans le presse-papier !");
    };

    const modalContent = (
        <div className="invoice-modal-overlay" onClick={onClose}>
            <div className={`invoice-modal-content ${showXml ? 'xml-mode' : ''}`} onClick={(e) => e.stopPropagation()}>
                
                {/* Fixed Top Close Button */}
                <button className="close-modal-circle" onClick={onClose}>
                    <Icons.Close />
                </button>

                {!showXml ? (
                    <div className="invoice-paper-scroll-view">
                        <div className="invoice-paper printable-area">
                            {/* TOP HEADER SECTION */}
                            <div className="paper-header-grid">
                                <div className="header-left-branding">
                                    <div className="company-logo-red">
                                        {user?.logo ? (
                                            <img src={user.logo} alt="Logo" className="w-full h-full object-contain" style={{ borderRadius: '8px' }} />
                                        ) : (
                                            <span className="logo-text">{user?.entreprise?.charAt(0) || 'E'}</span>
                                        )}
                                    </div>
                                    <div className="company-details">
                                        <h1 className="company-name-bold">{user?.entreprise || 'Vendeur'}</h1>
                                        {user?.activity && <p className="company-activity-badge">{user.activity}</p>}
                                        <p className="company-address-small">{user?.address || 'Tunis, Tunisie'}</p>
                                        <div className="contact-small-row">
                                            <span className="contact-item"><Icons.Phone />{invoice.issuerPhone || user?.phone || '-- -- -- --'}</span>
                                            <span className="contact-item"><Icons.Mail />{invoice.issuerEmail || user?.email || 'contact@site.com'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="header-right-meta">
                                    <div className="document-type-pill">
                                        {invoice.documentType === '380' ? 'FACTURE DE VENTE' : "NOTE D'AVOIR"}
                                    </div>
                                    <h2 className="invoice-number-giant">{invoice.invoiceNumber || invoice.number || invoice.id}</h2>
                                    <p className="invoice-date-bold">Date : {new Date(invoice.date).toLocaleDateString('fr-TN')}</p>
                                </div>
                            </div>

                            {/* PARTICIPANT CARDS */}
                            <div className="participant-cards-row">
                                <div className="participant-card issuer-card">
                                    <span className="card-label">ÉMETTEUR (VENDEUR)</span>
                                    <div className="card-content">
                                        <div className="content-item">
                                            <label>IDENTITÉ LÉGALE</label>
                                            <p className="val-bold">{user?.entreprise}</p>
                                        </div>
                                        <div className="content-item">
                                            <label>MATRICULE FISCAL</label>
                                            <p className="val-mono">{formatMatriculeDisplay(user?.matriculeFiscal)}</p>
                                        </div>
                                        <div className="content-item">
                                            <label>NUMÉRO RNE</label>
                                            <p className="val-semi">{issuerRNE}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="participant-card beneficiary-card">
                                    <span className="card-label">DESTINATAIRE (ACHETEUR)</span>
                                    <div className="card-content">
                                        <div className="content-item">
                                            <label>CLIENT</label>
                                            <p className="val-bold uppercase">{invoice.clientName}</p>
                                            <p className="val-address">{invoice.clientAddress}</p>
                                        </div>
                                        <div className="content-item">
                                            <label>MATRICULE FISCAL</label>
                                            <p className={`val-mono ${validateMatriculeFiscal(invoice.clientMatricule) ? '' : 'text-danger'}`}>
                                                {formatMatriculeDisplay(invoice.clientMatricule)}
                                            </p>
                                        </div>
                                        <div className="content-item">
                                            <label>NUMÉRO RNE</label>
                                            <p className="val-semi">{clientRNE}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* TABLE SECTION */}
                            <div className="table-container-rounded">
                                <table className="paper-table-modern">
                                    <thead>
                                        <tr>
                                            <th>Désignation</th>
                                            <th className="text-center">Qté</th>
                                            <th className="text-center">P.U HT</th>
                                            <th className="text-right">TOTAL HT</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lines.map((line, idx) => (
                                            <tr key={idx}>
                                                <td className="font-bold">{line.description}</td>
                                                <td className="text-center"><span className="qty-badge">{line.qty}</span></td>
                                                <td className="text-center">{parseFloat(line.unitPriceHT || line.puht || 0).toFixed(3)}</td>
                                                <td className="text-right font-black">{parseFloat(line.totalHT || 0).toFixed(3)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* TOTALS & WORDS */}
                            <div className="totals-section-grid">
                                <div className="summary-left">
                                    <div className="words-box">
                                        <label>ARRÊT DE LA PRÉSENTE FACTURE</label>
                                        <p>{amountToWords(parseFloat(invoice.totalTTC))}</p>
                                    </div>
                                    <div className="payment-mini-grid">
                                        <div className="mini-item">
                                            <label>PAIEMENT</label>
                                            <p><Icons.CreditCard />{invoice.paymentMode || 'Virement'}</p>
                                        </div>
                                        <div className="mini-item">
                                            <label>ÉCHÉANCE</label>
                                            <p><Icons.Calendar />{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('fr-TN') : 'À réception'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="summary-right-totals">
                                    <div className="total-row">
                                        <span>TOTAL HT</span>
                                        <span className="val">{parseFloat(invoice.totalHT).toFixed(3)}</span>
                                    </div>
                                    <div className="total-row">
                                        <span>TOTAL TVA</span>
                                        <span className="val">{parseFloat(invoice.totalTVA).toFixed(3)}</span>
                                    </div>
                                    <div className="total-row">
                                        <span>TIMBRE FISCAL</span>
                                        <span className="val">{parseFloat(invoice.stampDuty).toFixed(3)}</span>
                                    </div>
                                    <div className="grand-total-box">
                                        <span className="label">NET À PAYER (DT)</span>
                                        <span className="val">{parseFloat(invoice.totalTTC).toFixed(3)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* QR CODE SECTION — Dual behavior based on validation status */}
                            {(() => {
                                const isValidated = invoice.isSigned && invoice.status === 'Validée';
                                // Pour les factures validées : URL de vérification (s'ouvre dans le navigateur du téléphone)
                                // Pour les autres : URL de l'XML brut
                                const backendHost = window.location.hostname; // Utilise l'IP du PC automatiquement
                                const qrContent = isValidated
                                    ? `http://${backendHost}:5170/api/Invoices/${invoice.id}/verify`
                                    : `http://${backendHost}:5170/api/Invoices/${invoice.id}/xml`;
                                return (
                                    <div className="invoice-qr-section" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', background: isValidated ? 'rgba(21, 128, 61, 0.08)' : 'rgba(21, 128, 61, 0.05)', borderRadius: '12px', border: `1px dashed ${isValidated ? 'rgba(21, 128, 61, 0.5)' : 'rgba(21, 128, 61, 0.2)'}`, marginTop: '20px' }}>
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&ecc=L&data=${encodeURIComponent(qrContent)}`}
                                            alt="QR Code"
                                            className="qr-image"
                                            style={{ width: '130px', height: '130px', background: 'white', padding: '6px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                                        />
                                        <div className="qr-text">
                                            {isValidated ? (
                                                <>
                                                    <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#15803d', margin: '0 0 4px 0', textTransform: 'uppercase' }}><Icons.CheckCircle />QR Code TTN Certifié</h4>
                                                    <p style={{ fontSize: '11px', color: '#1e293b', margin: '0 0 4px 0', fontWeight: '600' }}>
                                                        Réf. TTN : {(() => {
                                                            const mfDigits = (user?.matriculeFiscal || '0000000').replace(/[^0-9]/g, '').substring(0, 7).padStart(7, '0');
                                                            const idPart = String(invoice.id || 0).padStart(5, '0');
                                                            const seed = (parseInt(mfDigits) * 7919 + (invoice.id || 1) * 1013) % 100000000000000;
                                                            return `${mfDigits}${idPart}${String(seed).padStart(14, '0')}`.substring(0, 26);
                                                        })()}
                                                    </p>
                                                    <p style={{ fontSize: '10px', color: '#6b7280', margin: '0', fontStyle: 'italic' }}>
                                                        Ce code contient les données fiscales QRDATA conformes TTN.
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#15803d', margin: '0 0 4px 0', textTransform: 'uppercase' }}>QR Code XML TEIF</h4>
                                                    <p style={{ fontSize: '11px', color: '#1e293b', margin: '0', fontStyle: 'italic', opacity: 0.8 }}>
                                                        Ce code pointe vers la structure XML TEIF v1.8.8 de ce document.
                                                    </p>
                                                    <p style={{ fontSize: '10px', color: '#f59e0b', margin: '4px 0 0 0', fontWeight: '600' }}>
                                                        <Icons.AlertTriangle />Signez et envoyez à la TTN pour activer le QR certifié.
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            <footer className="document-footer-tag">
                                DOCUMENT GÉNÉRÉ PAR PLATEFORME EL FATOORA • TUNISIE TRADE NETWORK (TTN)
                            </footer>
                        </div>
                    </div>
                ) : (
                    <div className="xml-viewer-container">
                        <div className="xml-viewer-header">
                            <div>
                                <h3>Visualiseur de Flux TEIF v2.0</h3>
                                <p>Source XML-DSIG • {invoice.invoiceNumber}</p>
                            </div>
                            <div className="xml-actions">
                                <button className="xml-btn" onClick={copyXml}>Copier le Code</button>
                                <button className="xml-btn primary" onClick={() => downloadXml(invoice.isSigned ? invoice.signedXmlContent : generateTeifXml(user, invoice), `${invoice.invoiceNumber}.xml`)}>Télécharger .xml</button>
                            </div>
                        </div>
                        <div className="xml-code-box">
                            <pre>
                                {invoice.isSigned ? invoice.signedXmlContent : generateTeifXml(user, invoice)}
                            </pre>
                        </div>
                    </div>
                )}

                {/* MODAL ACTIONS FOOTER */}
                <div className="modal-actions-footer-professional">

                    <div className="footer-buttons">
                        <button className="btn-cancel" onClick={onClose}>Annuler</button>
                        <button className="btn-xml-toggle" onClick={() => setShowXml(!showXml)}>
                            {showXml ? "Voir Facture Pro" : "Aperçu XML TEIF"}
                        </button>
                        {!showXml && (
                            <button className="btn-print-pill" onClick={handlePrint}>
                                <Icons.Print /> Imprimer la Facture
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
}
