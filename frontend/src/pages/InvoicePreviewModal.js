
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import './InvoicePreviewModal.css';
import { generateTeifXml, downloadXml } from '../utils/teifGenerator';
import { amountToWords, formatMatriculeDisplay, validateMatriculeFiscal } from '../utils/invoiceFormatters';

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
    )
};

const API = 'http://localhost:5170/api';

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
                                        <p className="company-address-small">{user?.address || 'Tunis, Tunisie'}</p>
                                        <div className="contact-small-row">
                                            <span className="contact-item">☎️ {invoice.issuerPhone || user?.phone || '-- -- -- --'}</span>
                                            <span className="contact-item">✉️ {invoice.issuerEmail || user?.email || 'contact@site.com'}</span>
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
                                            <p>💳 {invoice.paymentMode || 'Virement'}</p>
                                        </div>
                                        <div className="mini-item">
                                            <label>ÉCHÉANCE</label>
                                            <p>📅 {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('fr-TN') : 'À réception'}</p>
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

                            {/* QR CODE SECTION */}
                            <div className="invoice-qr-section" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', background: 'rgba(21, 128, 61, 0.05)', borderRadius: '12px', border: '1px dashed rgba(21, 128, 61, 0.2)', marginTop: '20px' }}>
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&ecc=L&data=${encodeURIComponent(`${API}/Invoices/${invoice.id}/xml`)}`} 
                                    alt="QR Code XML" 
                                    className="qr-image" 
                                    style={{ width: '120px', height: '120px', background: 'white', padding: '5px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }} 
                                />
                                <div className="qr-text">
                                    <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#15803d', margin: '0 0 4px 0', textTransform: 'uppercase' }}>QR Code Certifié</h4>
                                    <p style={{ fontSize: '11px', color: '#1e293b', margin: '0', fontStyle: 'italic', opacity: 0.8 }}>
                                        "Ce code contient la structure XML TEIF v2.0 officielle de ce document."
                                    </p>
                                </div>
                            </div>

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
