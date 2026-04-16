import React, { useState } from 'react';

export default function CompanyProfile({ onClose }) {
    const [activeSection, setActiveSection] = useState('profil');

    const [form, setForm] = useState({
        raisonSociale:    'El Fatoora Digital Solutions SARL',
        registreCommerce: 'B01234562023',
        mf1: '1234567', mf2: 'A', mf3: 'M', mf4: 'P', mf5: '000',
        adresse:          'Avenue Habib Bourguiba, Immeuble Horizon',
        ville:            'Tunis',
        codePostal:       '1000',
        telephone:        '+216 71 123 456',
        email:            'contact@elfatoora.tn',
    });

    const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
    const handleSave   = () => alert('Modifications enregistrées avec succès !');

    const card    = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, marginBottom: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };
    const cHeader = { padding: '12px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
    const cBody   = { padding: '16px 18px' };
    const iGroup  = { display: 'flex', flexDirection: 'column', gap: 5 };
    const lbl     = { fontSize: 12, fontWeight: 600, color: '#475569' };
    const inp     = { padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, background: '#f8fafc', color: '#1e293b', outline: 'none', width: '100%' };

    return (
        <div style={{ maxWidth: 780 }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Profil de l'Entreprise</h1>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Gérez les informations légales et fiscales de votre plateforme.</p>
                </div>
                {onClose && (
                    <button onClick={onClose} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14, color: '#64748b' }}>✕</button>
                )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: 18 }}>
                {[{ key: 'profil', label: '👤 Profil' }, { key: 'certificats', label: '📜 Certificats' }].map(tab => (
                    <button key={tab.key} onClick={() => setActiveSection(tab.key)} style={{
                        padding: '8px 18px', border: 'none', background: 'none', fontSize: 13,
                        fontWeight: 600, cursor: 'pointer',
                        color: activeSection === tab.key ? '#1e429f' : '#64748b',
                        borderBottom: activeSection === tab.key ? '2px solid #1e429f' : '2px solid transparent',
                        marginBottom: -1
                    }}>{tab.label}</button>
                ))}
            </div>

            {/* Profil */}
            {activeSection === 'profil' && (
                <div>
                    <div style={card}>
                        <div style={cHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span>🏢</span>
                                <strong style={{ fontSize: 14, color: '#1e293b' }}>Identité de l'Entreprise</strong>
                            </div>
                        </div>
                        <div style={cBody}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div style={{ ...iGroup, gridColumn: '1/-1' }}>
                                    <label style={lbl}>Raison Sociale</label>
                                    <input style={inp} type="text" value={form.raisonSociale} onChange={e => handleChange('raisonSociale', e.target.value)} />
                                </div>
                                <div style={{ ...iGroup, gridColumn: '1/-1' }}>
                                    <label style={lbl}>Registre de Commerce (RC)</label>
                                    <input style={inp} type="text" value={form.registreCommerce} onChange={e => handleChange('registreCommerce', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={card}>
                        <div style={cHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span>🏛️</span>
                                <strong style={{ fontSize: 14, color: '#1e293b' }}>Informations Fiscales</strong>
                            </div>
                        </div>
                        <div style={cBody}>
                            <label style={lbl}>Matricule Fiscal (Tunisie)</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.6fr 0.6fr 0.6fr 1fr', gap: 8, marginTop: 8 }}>
                                {[['mf1','7 CHIFFRES'],['mf2','CLÉ'],['mf3','CAT'],['mf4','CODE'],['mf5','BUREAU']].map(([k, l]) => (
                                    <div key={k} style={iGroup}>
                                        <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>{l}</span>
                                        <input style={{ ...inp, textAlign: 'center' }} type="text" value={form[k]} onChange={e => handleChange(k, e.target.value)} />
                                    </div>
                                ))}
                            </div>
                            <p style={{ fontSize: 11, color: '#94a3b8', margin: '8px 0 0', fontStyle: 'italic' }}>Format : 1234567/A/M/P/000</p>
                            <div style={{ marginTop: 10, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 7, padding: '8px 12px', fontSize: 12, color: '#0369a1' }}>
                                <strong>Aperçu :</strong> {form.mf1}/{form.mf2}/{form.mf3}/{form.mf4}/{form.mf5}
                            </div>
                        </div>
                    </div>

                    <div style={card}>
                        <div style={cHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span>📍</span>
                                <strong style={{ fontSize: 14, color: '#1e293b' }}>Coordonnées</strong>
                            </div>
                        </div>
                        <div style={cBody}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div style={{ ...iGroup, gridColumn: '1/-1' }}>
                                    <label style={lbl}>Adresse Siège Social</label>
                                    <input style={inp} type="text" value={form.adresse} onChange={e => handleChange('adresse', e.target.value)} />
                                </div>
                                <div style={iGroup}>
                                    <label style={lbl}>Ville</label>
                                    <input style={inp} type="text" value={form.ville} onChange={e => handleChange('ville', e.target.value)} />
                                </div>
                                <div style={iGroup}>
                                    <label style={lbl}>Code Postal</label>
                                    <input style={inp} type="text" value={form.codePostal} onChange={e => handleChange('codePostal', e.target.value)} />
                                </div>
                                <div style={iGroup}>
                                    <label style={lbl}>Téléphone</label>
                                    <input style={inp} type="text" value={form.telephone} onChange={e => handleChange('telephone', e.target.value)} />
                                </div>
                                <div style={iGroup}>
                                    <label style={lbl}>Email Administratif</label>
                                    <input style={inp} type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Certificats */}
            {activeSection === 'certificats' && (
                <div style={card}>
                    <div style={cHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>🖋️</span>
                            <strong style={{ fontSize: 14, color: '#1e293b' }}>Signature Électronique</strong>
                        </div>
                        <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>● Certificat Actif</span>
                    </div>
                    <div style={cBody}>
                        <div style={{ border: '2px dashed #e2e8f0', borderRadius: 10, padding: '1.5rem', textAlign: 'center', background: '#f8fafc', marginBottom: 12 }}>
                            <div style={{ fontSize: 26, marginBottom: 8 }}>📄</div>
                            <h4 style={{ margin: '0 0 4px', fontSize: 14, color: '#1e293b' }}>Mettre à jour le certificat</h4>
                            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Importez votre fichier .p12 ou connectez votre Digigo</p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                                <button style={{ padding: '7px 16px', background: '#1e429f', color: 'white', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Charger P12</button>
                                <button style={{ padding: '7px 16px', background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Lier Digigo</button>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#f1f5f9', borderRadius: 8 }}>
                            <span style={{ fontSize: 18 }}>🛡️</span>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Certificat ID: TN-EL-2023-FATOORA</div>
                                <div style={{ fontSize: 12, color: '#64748b' }}>Expire le: 12 Décembre 2025 • Délivré par: ANCE Tunisia</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}>Annuler</button>
                <button onClick={handleSave} style={{ padding: '8px 18px', background: '#1e429f', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Enregistrer les modifications</button>
            </div>
        </div>
    );
}