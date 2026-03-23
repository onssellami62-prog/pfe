import React, { useState, useRef } from 'react';
import './ImportInvoice.css';

export default function ImportInvoice() {
    const [importMethod, setImportMethod] = useState('excel'); // 'excel' or 'pdf'
    const fileInputRef = useRef(null);

    const handleChooseFile = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        const files = event.target.files;
        if (files.length > 0) {
            console.log("Fichiers sélectionnés :", files);
            alert(`${files.length} fichier(s) sélectionné(s) : ${Array.from(files).map(f => f.name).join(', ')}`);
        }
    };

    return (
        <div className="import-container">
            {/* Hidden Input File */}
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept={importMethod === 'excel' ? ".xlsx, .xls, .csv" : "application/pdf"}
                multiple={importMethod === 'pdf'}
            />

            <header className="import-header">
                <h1>Importation de Factures</h1>
                <p>Convertissez vos documents en flux XML électronique standardisé.</p>
            </header>

            <div className="import-options">
                {/* Card Excel */}
                <div
                    className={`option-card ${importMethod === 'excel' ? 'active' : ''}`}
                    onClick={() => setImportMethod('excel')}
                >
                    {importMethod === 'excel' && (
                        <div className="check-badge">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                    )}
                    <div className="option-icon">📊</div>
                    <h3>Import Excel</h3>
                    <p>XLSX, CSV, Google Sheets</p>
                </div>

                {/* Card PDF */}
                <div
                    className={`option-card ${importMethod === 'pdf' ? 'active' : ''}`}
                    onClick={() => setImportMethod('pdf')}
                >
                    {importMethod === 'pdf' && (
                        <div className="check-badge">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                    )}
                    <div className="option-icon">📄</div>
                    <h3>Import PDF</h3>
                    <p>Extraction OCR automatique</p>
                </div>
            </div>

            <div
                className="main-dropzone"
                onClick={handleChooseFile}
                style={{ cursor: 'pointer' }}
            >
                <div className="upload-circle">
                    {importMethod === 'excel' ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="16 16 12 12 8 16" />
                            <line x1="12" y1="12" x2="12" y2="21" />
                            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                        </svg>
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="12" y1="18" x2="12" y2="12" />
                            <polyline points="9 15 12 12 15 15" />
                        </svg>
                    )}
                </div>

                {importMethod === 'excel' ? (
                    <>
                        <h2>Téléchargez votre fichier Excel (XLSX, CSV)</h2>
                        <p>Glissez-déposez votre fichier ici ou cliquez pour parcourir vos dossiers locaux.</p>
                    </>
                ) : (
                    <>
                        <h2>Téléchargez vos factures PDF</h2>
                        <p>Glissez-déposez vos fichiers PDF ici. Notre IA extraira automatiquement les données des factures.</p>
                    </>
                )}

                <div className="dropzone-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="btn-primary" onClick={handleChooseFile}>
                        <span>+</span> Choisir {importMethod === 'excel' ? 'un fichier' : 'des PDF'}
                    </button>
                    {importMethod === 'excel' && (
                        <button className="btn-secondary">
                            📥 Modèle type
                        </button>
                    )}
                </div>
            </div>

            <div className="file-list-section">
                <div className="file-list-header">
                    <h3>Fichiers en attente ({importMethod === 'excel' ? '2' : '0'})</h3>
                    <a href="#clear" className="clear-list">Vider la liste</a>
                </div>

                {importMethod === 'excel' && (
                    <>
                        {/* File Item 1 */}
                        <div className="file-item">
                            <div className="file-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                </svg>
                            </div>
                            <div className="file-info">
                                <div className="file-name-row">
                                    <span className="file-name">facturation_ventes_q3.xlsx</span>
                                    <span className="file-size">4.2 MB</span>
                                </div>
                                <div className="progress-bar-container">
                                    <div className="progress-bar" style={{ width: '60%' }}></div>
                                </div>
                                <span className="file-status status-analyzing">ANALYSE DE LA STRUCTURE...</span>
                            </div>
                            <button className="remove-file">✕</button>
                        </div>

                        {/* File Item 2 */}
                        <div className="file-item">
                            <div className="file-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                </svg>
                            </div>
                            <div className="file-info">
                                <div className="file-name-row">
                                    <span className="file-name">recapitulatif_clients_sept.csv</span>
                                    <span className="file-size">1.8 MB</span>
                                </div>
                                <div className="progress-bar-container">
                                    <div className="progress-bar" style={{ width: '100%' }}></div>
                                </div>
                                <span className="file-status status-ready">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    PRÊT POUR CONVERSION <span style={{ marginLeft: '12px', opacity: 0.6 }}>244 lignes détectées</span>
                                </span>
                            </div>
                            <button className="remove-file">✕</button>
                        </div>
                    </>
                )}
            </div>

            <div className="generate-section">
                <button className="btn-generate">
                    <span style={{ fontSize: '18px' }}>⚙️</span> Générer le flux XML
                </button>
                <p>🛡️ Données sécurisées et conformes aux normes DGFIP</p>
            </div>
        </div>
    );
}

