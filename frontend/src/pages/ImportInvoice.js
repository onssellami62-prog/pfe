import React, { useState, useRef } from 'react';
import './ImportInvoice.css';

const PYTHON_API = 'http://localhost:8000';

export default function ImportInvoice() {
    const [importMethod, setImportMethod] = useState('excel');
    const [status,       setStatus]       = useState('idle');
    const [result,       setResult]       = useState(null);
    const [errorMsg,     setErrorMsg]     = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [progress,     setProgress]     = useState(0);
    const fileInputRef = useRef(null);

    const reset = () => {
        setStatus('idle'); setResult(null); setErrorMsg('');
        setSelectedFile(null); setProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleMethodChange = (method) => {
        setImportMethod(method); reset();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSelectedFile(file); setStatus('uploading');
        setProgress(0); setErrorMsg(''); setResult(null);
        await uploadFile(file);
    };

    const uploadFile = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const endpoint = importMethod === 'excel'
            ? `${PYTHON_API}/import/excel`
            : `${PYTHON_API}/import/pdf`;

        const progressInterval = setInterval(() => {
            setProgress(prev => prev < 85 ? prev + 10 : prev);
        }, 300);

        try {
            const res  = await fetch(endpoint, { method: 'POST', body: formData });
            clearInterval(progressInterval);
            setProgress(100);
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Erreur serveur Python.');
            if (!data.success) { setStatus('error'); setErrorMsg(data.message || 'Extraction échouée.'); return; }
            setStatus('success'); setResult(data);
        } catch (err) {
            clearInterval(progressInterval);
            setStatus('error');
            setErrorMsg(
                err.message.includes('fetch')
                    ? 'Impossible de contacter le service Python (port 8000). Vérifiez que main.py est lancé.'
                    : err.message
            );
        }
    };

    const handleDownloadTemplate = () => {
        const csv = "Client,Désignation,Quantité,Prix HT,TVA%,Date\n" +
                    "Pharmacie Centrale Tunis,Consultation Informatique,2,250,19,2026-05-01\n" +
                    "SOCIETE TUNISIE TELECOM,Maintenance Système,1,500,19,2026-05-02\n" +
                    "Clinique El Amen,Formation Informatique,3,300,19,2026-05-03\n";
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = 'modele_import_elfatoora.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="import-container">

            <header className="import-header">
                <h1>Importation de Factures</h1>
                <p>Importez vos anciennes factures Excel ou PDF — créées automatiquement en brouillon.</p>
            </header>

            {/* ── Choix méthode ─────────────────────────────────────────── */}
            <div className="import-options">
                <div className={`option-card ${importMethod === 'excel' ? 'active' : ''}`} onClick={() => handleMethodChange('excel')}>
                    {importMethod === 'excel' && <div className="check-badge"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>}
                    <div className="option-icon">📊</div>
                    <h3>Import Excel</h3>
                    <p>XLSX, CSV — colonnes détectées automatiquement</p>
                </div>
                <div className={`option-card ${importMethod === 'pdf' ? 'active' : ''}`} onClick={() => handleMethodChange('pdf')}>
                    {importMethod === 'pdf' && <div className="check-badge"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>}
                    <div className="option-icon">📄</div>
                    <h3>Import PDF</h3>
                    <p>Extraction automatique des données</p>
                </div>
            </div>

            {/* ── Dropzone ──────────────────────────────────────────────── */}
            {status === 'idle' && (
                <div
                    className="main-dropzone"
                    onClick={() => fileInputRef.current.click()}
                    style={{ cursor: 'pointer' }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file) { setSelectedFile(file); setStatus('uploading'); uploadFile(file); }
                    }}
                >
                    <div className="upload-circle">
                        {importMethod === 'excel' ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                            </svg>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/>
                            </svg>
                        )}
                    </div>
                    {importMethod === 'excel' ? (
                        <><h2>Téléchargez votre fichier Excel (XLSX, CSV)</h2>
                        <p>Glissez-déposez ou cliquez pour parcourir.<br/>Les colonnes sont détectées automatiquement.</p></>
                    ) : (
                        <><h2>Téléchargez votre facture PDF</h2>
                        <p>Les informations sont extraites automatiquement.<br/>Fonctionne sur les PDFs texte (non scannés).</p></>
                    )}
                    <div className="dropzone-actions" onClick={e => e.stopPropagation()}>
                        <button className="btn-primary" onClick={() => fileInputRef.current.click()}>
                            <span>+</span> Choisir {importMethod === 'excel' ? 'un fichier' : 'un PDF'}
                        </button>
                        {importMethod === 'excel' && (
                            <button className="btn-secondary" onClick={handleDownloadTemplate}>
                                📥 Modèle type
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ── En cours ──────────────────────────────────────────────── */}
            {status === 'uploading' && selectedFile && (
                <div style={s.statusCard}>
                    <div style={s.fileRow}>
                        <div style={s.fileIcon}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2" strokeLinecap="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                            </svg>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={s.fileName}>{selectedFile.name}</div>
                            <div style={s.fileSize}>{formatSize(selectedFile.size)}</div>
                            <div style={s.progressWrap}>
                                <div style={{ ...s.progressBar, width: `${progress}%` }} />
                            </div>
                            <div style={s.analyzing}>
                                ⚙️ {importMethod === 'excel'
                                    ? 'Analyse des colonnes et création des brouillons...'
                                    : 'Extraction des données PDF...'}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Erreur ────────────────────────────────────────────────── */}
            {status === 'error' && (
                <div style={s.errorCard}>
                    <div style={s.errorIcon}>❌</div>
                    <div style={{ flex: 1 }}>
                        <div style={s.errorTitle}>Échec de l'importation</div>
                        <div style={s.errorMsg}>{errorMsg}</div>
                    </div>
                    <button style={s.retryBtn} onClick={reset}>Réessayer</button>
                </div>
            )}

            {/* ── Succès ────────────────────────────────────────────────── */}
            {status === 'success' && result && (
                <div style={s.successWrap}>
                    <div style={s.successBanner}>
                        <div style={s.successIcon}>✅</div>
                        <div style={{ flex: 1 }}>
                            <div style={s.successTitle}>{result.message}</div>
                            <div style={s.successSub}>
                                Les factures ont été créées en <strong>Brouillon</strong>.
                                Rendez-vous dans <strong>Mes Factures</strong> pour les envoyer à TTN.
                            </div>
                        </div>
                        <button style={s.newImportBtn} onClick={reset}>+ Nouvel import</button>
                    </div>

                    {/* Colonnes détectées Excel */}
                    {importMethod === 'excel' && result.colonnesDetectees && (
                        <div style={s.colCard}>
                            <div style={s.colTitle}>Colonnes détectées automatiquement</div>
                            <div style={s.colGrid}>
                                {Object.entries(result.colonnesDetectees).map(([champ, col]) => (
                                    <div key={champ} style={s.colItem}>
                                        <span style={s.colChamp}>{champ}</span>
                                        <span style={{ ...s.colVal, color: col ? '#16a34a' : '#9ca3af' }}>
                                            {col ? `✓ "${col}"` : '— non trouvé'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tableau factures créées */}
                    {result.factures?.length > 0 && (
                        <div style={s.facturesCard}>
                            <div style={s.facturesTitle}>
                                Factures créées en brouillon ({result.factures.length})
                            </div>
                            <table style={s.table}>
                                <thead>
                                    <tr>{['N°','Client','Date','Total HT','TTC','Lignes'].map(h => (
                                        <th key={h} style={s.th}>{h}</th>
                                    ))}</tr>
                                </thead>
                                <tbody>
                                    {result.factures.map((f, i) => (
                                        <tr key={i} style={i % 2 === 0 ? {} : { background: '#f8fafc' }}>
                                            <td style={s.td}><span style={s.numBadge}>#{f.numeroFacture}</span></td>
                                            <td style={s.td}>{f.client}</td>
                                            <td style={s.td}>{f.date}</td>
                                            <td style={s.td}>{parseFloat(f.totalHT).toFixed(3)} DT</td>
                                            <td style={{ ...s.td, fontWeight: 600 }}>{parseFloat(f.montantTTC).toFixed(3)} DT</td>
                                            <td style={s.td}><span style={s.lignesBadge}>{f.nbLignes} ligne{f.nbLignes > 1 ? 's' : ''}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <input
                type="file" ref={fileInputRef} style={{ display: 'none' }}
                onChange={handleFileChange}
                accept={importMethod === 'excel' ? '.xlsx,.xls,.csv' : '.pdf'}
            />
        </div>
    );
}

const s = {
    statusCard:    { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px', marginTop: 8 },
    fileRow:       { display: 'flex', alignItems: 'flex-start', gap: 14 },
    fileIcon:      { width: 40, height: 40, background: '#eff6ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    fileName:      { fontSize: 14, fontWeight: 600, color: '#111827' },
    fileSize:      { fontSize: 12, color: '#9ca3af', marginTop: 2 },
    progressWrap:  { height: 4, background: '#e5e7eb', borderRadius: 2, margin: '10px 0 6px', overflow: 'hidden' },
    progressBar:   { height: '100%', background: '#1a56db', borderRadius: 2, transition: 'width 0.3s ease' },
    analyzing:     { fontSize: 12, color: '#1a56db', fontWeight: 500 },
    errorCard:     { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14 },
    errorIcon:     { fontSize: 24, flexShrink: 0 },
    errorTitle:    { fontSize: 14, fontWeight: 600, color: '#dc2626', marginBottom: 4 },
    errorMsg:      { fontSize: 13, color: '#b91c1c', lineHeight: 1.5 },
    retryBtn:      { padding: '8px 18px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0 },
    successWrap:   { display: 'flex', flexDirection: 'column', gap: 14 },
    successBanner: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14 },
    successIcon:   { fontSize: 28, flexShrink: 0 },
    successTitle:  { fontSize: 15, fontWeight: 600, color: '#15803d', marginBottom: 4 },
    successSub:    { fontSize: 13, color: '#166534', lineHeight: 1.5 },
    newImportBtn:  { padding: '10px 20px', background: '#1a56db', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' },
    colCard:       { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '18px 22px' },
    colTitle:      { fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 12 },
    colGrid:       { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
    colItem:       { display: 'flex', flexDirection: 'column', gap: 2 },
    colChamp:      { fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' },
    colVal:        { fontSize: 13, fontWeight: 500 },
    facturesCard:  { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' },
    facturesTitle: { fontSize: 13, fontWeight: 600, color: '#111827', padding: '16px 20px', borderBottom: '1px solid #f3f4f8' },
    table:         { width: '100%', borderCollapse: 'collapse' },
    th:            { fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 16px', textAlign: 'left', background: '#f8fafc', borderBottom: '1px solid #f3f4f8' },
    td:            { fontSize: 13, color: '#374151', padding: '12px 16px', borderBottom: '1px solid #f9fafb' },
    numBadge:      { background: '#eff6ff', color: '#1a56db', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 },
    lignesBadge:   { background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 500 },
};