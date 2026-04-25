import React, { useState, useRef } from 'react';
import './ImportInvoice.css';
import { generateTeifXml, downloadXml } from '../utils/teifGenerator';
import * as pdfjs from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

const Icons = {
    Building: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
            <path d="M9 22v-4h6v4" />
            <path d="M8 6h.01" />
            <path d="M16 6h.01" />
            <path d="M8 10h.01" />
            <path d="M16 10h.01" />
            <path d="M8 14h.01" />
            <path d="M16 14h.01" />
        </svg>
    ),
    Document: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    ),
    Flash: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    ),
    Folder: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    ),
    Copy: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
    ),
    Download: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    )
};

// Configuration du Worker PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

export default function ImportInvoice() {
    const [files, setFiles] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [editingFile, setEditingFile] = useState(null);
    const [showXmlPreview, setShowXmlPreview] = useState(false);
    const fileInputRef = useRef(null);

    // Mock Client (The logged in user)
    const storedUser = JSON.parse(sessionStorage.getItem('user') || '{}');
    const currentUser = {
        name: storedUser.entreprise || 'Polysoft Informatique',
        address: storedUser.address || 'Route Teniour KM 0.5 SFAX 3000',
        matricule: storedUser.matriculeFiscal || '147695DAC000'
    };

    const handleChooseFile = () => fileInputRef.current.click();

    // OCR FUNCTION: Read images/scans
    const runOcrOnImage = async (input) => {
        if (typeof input === 'string' && input.startsWith('data:')) {
            const { data: { text } } = await Tesseract.recognize(input, 'fra+eng');
            return text;
        }
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const { data: { text } } = await Tesseract.recognize(reader.result, 'fra+eng');
                    resolve(text);
                } catch (err) { reject(err); }
            };
            reader.readAsDataURL(input);
        });
    };

    // PDF TEXT EXTRACTION
    const extractTextFromPdf = async (file) => {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = async () => {
                try {
                    const typedarray = new Uint8Array(reader.result);
                    const pdf = await pdfjs.getDocument(typedarray).promise;
                    let fullText = "";
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        fullText += textContent.items.map(item => item.str).join(' ');
                    }
                    resolve(fullText);
                } catch (err) { reject(err); }
            };
            reader.readAsArrayBuffer(file);
        });
    };

    // UNIVERSAL ADAPTIVE PARSE: Finding semantic clusters for any invoice layout
    const parseGenericText = (text, fileName) => {
        const cleanText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ');
        const lowerText = cleanText.toLowerCase();

        // 1. SMART KEYWORD MAPPING (Synonyms for reliability)
        const findValueByKeywords = (keywords) => {
           for (const kw of keywords) {
               const regex = new RegExp(`${kw}\\s*[:]?\\s*(\\d+[\\.,]\\d{2,3})`, 'i');
               const match = cleanText.match(regex);
               if (match) return match[1].replace(',', '.');
           }
           return null;
        };

        // 2. EXTRACTION DES TOTAUX
        let totalHT = findValueByKeywords(['total h.t', 'total ht', 'net ht', 'base ht', 'montant ht', 'net hors taxe', 'total net ht']);
        let totalTVA = findValueByKeywords(['total tva', 't.v.a', 'montant tva', 'tva total', 'tva']);
        let totalTTC = findValueByKeywords(['total ttc', 'net à payer', 'net a payer', 'montant total', 't.t.c', 'total à payer']);
        
        // 3. AUTO-RECALCULATION (Math Engine)
        const timbre = 1.000;
        if (!totalTTC && totalHT && totalTVA) {
            totalTTC = (parseFloat(totalHT) + parseFloat(totalTVA) + timbre).toFixed(3);
        } else if (!totalTVA && totalTTC && totalHT) {
            totalTVA = (parseFloat(totalTTC) - parseFloat(totalHT) - timbre).toFixed(3);
        } else if (!totalHT && totalTTC && totalTVA) {
            totalHT = (parseFloat(totalTTC) - parseFloat(totalTVA) - timbre).toFixed(3);
        }

        // 4. MF EXTRACTION
        const mfRegex = /\d{7,8}\s*[A-Z](?:\s*\/\s*[A-Z]\s*\/\s*[A-Z]\s*\/\s*\d{3})?|\d{10,14}/gi;
        let allMfs = (cleanText.match(mfRegex) || []).map(m => m.toUpperCase().replace(/\s/g, ''));
        if (allMfs.some(m => m.includes('/'))) {
            allMfs = allMfs.filter(m => m.includes('/') || m.length >= 10);
        }

        // 5. NAD DETECTION
        const buyerKeywords = ['droit :', 'doit :', 'doit', 'droit', 'facturé à', 'client', 'vendu à', 'destinataire'];
        let buyerIndex = -1;
        for (const kw of buyerKeywords) {
            const idx = lowerText.indexOf(kw);
            if (idx !== -1) { buyerIndex = idx; break; }
        }

        let sellerMatricule = allMfs[0] || "";
        let buyerMatricule = (allMfs.length > 1) ? allMfs[1] : currentUser.matricule;
        let buyerName = "";

        if (buyerIndex !== -1 && allMfs.length > 0) {
            allMfs.forEach(mf => {
                const pos = cleanText.toUpperCase().indexOf(mf.split('/')[0]);
                if (pos > buyerIndex) buyerMatricule = mf;
                else sellerMatricule = mf;
            });
            
            const afterBuyer = cleanText.substring(buyerIndex).split(' ');
            let nameStartIdx = (afterBuyer[1] === ':' || !afterBuyer[1]) ? 2 : 1;
            if (afterBuyer[nameStartIdx] && /^\d+$/.test(afterBuyer[nameStartIdx])) nameStartIdx++; 
            buyerName = afterBuyer.slice(nameStartIdx, nameStartIdx + 3).join(' ').replace(/[0-9\/]/g, '').trim();
        }

        if (!sellerMatricule) throw new Error("Matricule Vendeur non détecté.");

        // 6. ITEMS
        const itemRegex = /([A-Z0-9\s\-]{5,})\s+(\d+\.\d{2})\s+(\d+[\.,]\d{3})\s+(7|13|18|19)\.00/gi;
        const items = [];
        let itemMatch;
        while ((itemMatch = itemRegex.exec(cleanText)) !== null) {
            items.push({
                description: itemMatch[1].trim(),
                qty: parseFloat(itemMatch[2]),
                puht: parseFloat(itemMatch[3].replace(',', '.')),
                tvaRate: parseFloat(itemMatch[4])
            });
        }

        if (items.length === 0) {
            items.push({ description: "Articles Extraits PDF (" + fileName + ")", qty: 1.0, puht: parseFloat(totalHT || 0), tvaRate: 19 });
        }

        return {
            issuer: { 
                name: cleanText.substring(0, 60).replace(/[0-9]/g, '').trim().toUpperCase().split('  ')[0],
                matricule: sellerMatricule,
                address: 'Extrait par Intelligence Adaptative'
            },
            invoice: {
                number: `FCT-${Math.floor(1000 + Math.random() * 8999)}`,
                date: new Date().toISOString().split('T')[0].replace(/-/g, ''),
                clientName: buyerName || 'CLIENT_DETECTE',
                clientMatricule: buyerMatricule,
                clientAddress: 'Tunis, Tunisie (Extraction)',
                items: items,
                totals: { 
                    ht: totalHT || "0.000", 
                    tva: totalTVA || "0.000", 
                    ttc: totalTTC || "0.000" 
                }
            }
        };
    };

    const pdfToImage = async (file) => {
        const reader = new FileReader();
        return new Promise((resolve) => {
            reader.onload = async () => {
                const typedarray = new Uint8Array(reader.result);
                const pdf = await pdfjs.getDocument(typedarray).promise;
                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                resolve(canvas.toDataURL());
            };
            reader.readAsArrayBuffer(file);
        });
    };

    const handleSaveEdit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const ht = parseFloat(formData.get('ht') || 0);
        const ttc = parseFloat(formData.get('ttc') || 0);
        const timbre = 1.000;
        const tva = (ttc - ht - timbre).toFixed(3);

        const updatedExtraction = {
            ...editingFile.extraction,
            issuer: {
                ...editingFile.extraction.issuer,
                name: formData.get('issuerName'),
                matricule: formData.get('issuerMatricule'),
            },
            invoice: {
                ...editingFile.extraction.invoice,
                clientName: formData.get('clientName'),
                clientMatricule: formData.get('clientMatricule'),
                totals: { ht: ht.toFixed(3), tva: tva, ttc: ttc.toFixed(3) }
            }
        };

        setFiles(prev => prev.map(f => f.name === editingFile.name ? { ...f, extraction: updatedExtraction } : f));
        setEditingFile(null);
    };

    const handleFileChange = async (event) => {
        const selectedFiles = Array.from(event.target.files);
        if (selectedFiles.length === 0) return;

        const newFiles = selectedFiles.map(f => ({
            name: f.name, size: (f.size / 1024 / 1024).toFixed(2) + ' MB',
            status: 'extracting', progress: 0, extraction: null
        }));

        setFiles(prev => [...prev, ...newFiles]);
        setIsProcessing(true);

        for (const file of selectedFiles) {
            try {
                let text = "";
                const isPdf = file.type === 'application/pdf';
                setFiles(prev => prev.map(f => f.name === file.name ? { ...f, progress: 10 } : f));
                
                if (isPdf) {
                    text = await extractTextFromPdf(file);
                    if (!text || text.trim().length === 0) {
                        setFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'ocr', progress: 30 } : f));
                        const imageData = await pdfToImage(file);
                        text = await runOcrOnImage(imageData);
                    }
                } else {
                    setFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'ocr', progress: 30 } : f));
                    text = await runOcrOnImage(file); 
                }
                
                const extraction = parseGenericText(text, file.name);
                setFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'ready', progress: 100, extraction } : f));
            } catch (err) {
                console.error("Extraction Error:", err);
                setFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'error' } : f));
            }
        }
        setIsProcessing(false);
    };

    const handleOpenPreview = (file) => {
        setSelectedFile(file);
        setShowXmlPreview(true);
    };

    const handleDownloadXml = () => {
        if (!selectedFile?.extraction) return;
        const { issuer, invoice } = selectedFile.extraction;
        const xml = generateTeifXml(issuer, invoice);
        downloadXml(xml, `TEIF_${issuer.name.replace(/ /g, '_')}_${invoice.number}.xml`);
    };

    const copyXml = () => {
        if (!selectedFile?.extraction) return;
        const { issuer, invoice } = selectedFile.extraction;
        navigator.clipboard.writeText(generateTeifXml(issuer, invoice));
        alert("XML copié !");
    };

    return (
        <div className="import-container animate-slideUp">
            <style>{css}</style>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="application/pdf,image/*" multiple />

            <div className="mb-10 text-center">
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest mb-4 inline-block">Moteur OCR v3.2 Restauré</span>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Intelligence Documentaire</h1>
                <p className="text-gray-500 mt-2 font-medium">Extraction universelle vers la norme TEIF.</p>
            </div>

            <div className="main-dropzone border-4 border-dashed border-emerald-100 bg-emerald-50/20 rounded-[30px] p-16 flex flex-col items-center justify-center hover:border-emerald-200 transition-all cursor-pointer group" onClick={handleChooseFile}>
                <div className="w-20 h-20 bg-emerald-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-200 group-hover:scale-110 transition-transform mb-6">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v10m0 0l-3-3m3 3l3-3" /><path d="M5 20h14a2 2 0 0 0 2-2v-5M5 20a2 2 0 0 1-2-2v-5" /></svg>
                </div>
                <h2 className="text-2xl font-black text-gray-800">Déposez votre facture</h2>
                <p className="text-gray-400 mt-2 font-black uppercase text-[10px] tracking-widest text-center max-w-sm">Le moteur IA analysera matricules et montants automatiquement.</p>
            </div>

            <div className="mt-12">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Documents ({files.length})</h3>
                    <button onClick={() => setFiles([])} className="text-red-500 font-black text-[10px] uppercase hover:underline">Vider</button>
                </div>

                <div className="grid gap-4">
                    {files.map((file, idx) => (
                        <div key={idx} className="bg-white border-2 border-gray-100 rounded-3xl p-6 flex items-center gap-6 animate-fadeIn shadow-sm hover:shadow-md transition-shadow">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${file.status === 'error' ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'}`}>
                                {file.status === 'ready' ? <Icons.Building /> : (file.status === 'extracting' ? <Icons.Document /> : (file.status === 'ocr' ? <Icons.Flash /> : <Icons.Folder />))}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="font-black text-gray-800 truncate max-w-[200px]">{file.name}</span>
                                    {file.extraction && (
                                        <span className="bg-green-50 text-green-700 text-[10px] font-black px-3 py-1 rounded-lg border border-green-100 uppercase tracking-tighter">
                                            {file.extraction.issuer.name}
                                        </span>
                                    )}
                                </div>
                                <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                                    <div className={`h-full transition-all duration-500 ${file.status === 'ready' ? 'bg-green-500' : 'bg-emerald-700'}`} style={{ width: `${file.progress}%` }}></div>
                                </div>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${file.status === 'ready' ? 'text-green-600' : 'text-emerald-600'}`}>
                                        {file.status === 'ready' ? 'Données Certifiées' : 'Traitement IA...'}
                                    </span>
                                </div>
                            </div>
                            {file.status === 'ready' && (
                                <div className="flex gap-2">
                                   <button onClick={() => setEditingFile(file)} className="bg-white border border-gray-200 text-gray-700 font-black text-[10px] px-4 py-3 rounded-xl hover:bg-gray-50 uppercase tracking-widest shadow-sm">Éditer</button>
                                   <button onClick={() => handleOpenPreview(file)} className="bg-emerald-700 text-white font-black text-[10px] px-6 py-3 rounded-xl hover:bg-emerald-800 uppercase tracking-widest shadow-lg shadow-emerald-200">Aperçu XML</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* MANUAL EDITOR MODAL */}
            {editingFile && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleSaveEdit} className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl animate-slideUp overflow-hidden">
                        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Révision des Données</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Corrigez les informations extraites par l'IA</p>
                        </div>
                        <div className="p-8 space-y-6 max-h-[60vh] overflow-auto">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2"><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Vendeur</label><input name="issuerName" defaultValue={editingFile.extraction.issuer.name} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-xs font-bold" /></div>
                                <div className="col-span-2"><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Matricule Vendeur</label><input name="issuerMatricule" defaultValue={editingFile.extraction.issuer.matricule} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-xs font-bold" /></div>
                                <hr className="col-span-2" />
                                <div className="col-span-2"><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Client</label><input name="clientName" defaultValue={editingFile.extraction.invoice.clientName} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-xs font-bold" /></div>
                                <div className="col-span-1"><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">HT</label><input name="ht" defaultValue={editingFile.extraction.invoice.totals.ht} className="w-full bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl text-xs font-black" /></div>
                                <div className="col-span-1"><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">TTC</label><input name="ttc" defaultValue={editingFile.extraction.invoice.totals.ttc} className="w-full bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl text-xs font-black" /></div>
                            </div>
                        </div>
                        <div className="p-8 border-t border-gray-100 flex gap-4 bg-gray-50/50">
                            <button type="button" onClick={() => setEditingFile(null)} className="flex-1 bg-white border border-gray-200 text-gray-400 font-black text-[10px] py-4 rounded-xl uppercase tracking-widest transition-all">Annuler</button>
                            <button type="submit" className="flex-1 bg-emerald-700 text-white font-black text-[10px] py-4 rounded-xl uppercase tracking-widest shadow-lg shadow-emerald-200 transition-all">Enregistrer</button>
                        </div>
                    </form>
                </div>
            )}

            {/* XML PREVIEW MODAL */}
            {showXmlPreview && selectedFile?.extraction && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-slideUp">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div><h3 className="text-lg font-black text-gray-900 uppercase">Aperçu XML TEIF</h3><p className="text-xs text-gray-400 font-bold">{selectedFile.name}</p></div>
                            <button onClick={() => setShowXmlPreview(false)} className="text-gray-400 hover:text-gray-600 font-bold uppercase text-[10px] tracking-widest bg-white border border-gray-100 py-2 px-4 rounded-full shadow-sm">✕ Fermer</button>
                        </div>
                        <div className="flex-1 overflow-auto p-6 bg-[#1e1e1e]">
                            <pre className="text-emerald-300 font-mono text-[11px] leading-relaxed">
                                {generateTeifXml(selectedFile.extraction.issuer, selectedFile.extraction.invoice)}
                            </pre>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex gap-4 bg-gray-50">
                            <button onClick={copyXml} className="flex-1 bg-white border-2 border-gray-100 text-gray-700 font-black text-[10px] py-3 rounded-xl uppercase tracking-widest flex items-center justify-center gap-2">Copier</button>
                            <button onClick={handleDownloadXml} className="flex-1 bg-emerald-700 text-white font-black text-[10px] py-3 rounded-xl uppercase tracking-widest flex items-center justify-center gap-2">Télécharger .xml</button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="mt-12 pb-12">
                <button className={`w-full py-6 rounded-3xl text-white font-black uppercase tracking-widest shadow-2xl transition-all ${files.length === 0 || isProcessing ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-emerald-700 hover:scale-[1.01] shadow-emerald-200'}`} disabled={files.length === 0 || isProcessing} onClick={() => files.filter(f => f.status === 'ready').forEach(f => downloadXml(generateTeifXml(f.extraction.issuer, f.extraction.invoice), `TEIF_${f.extraction.issuer.name}_${f.extraction.invoice.number}.xml`))}>
                    🚀 Télécharger le flux TEIF Final
                </button>
            </div>
        </div>
    );
}

const css = `
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.animate-slideUp { animation: slideUp 0.5s ease-out forwards; }
.animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
`;
