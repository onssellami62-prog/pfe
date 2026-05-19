/**
 * ForgotPassword.jsx — src/pages/ForgotPassword.jsx
 *
 * Étapes 2–9 du diagramme de séquence :
 *   2. Affiche formulaire
 *   3. Saisie de l'adresse mail
 *   4. POST /api/auth/forgot_password
 *   7. [e-mail trouvé]  → écran succès
 *   8. [e-mail non trouvé] → erreur backend
 *   9. Affiche msg d'erreur
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:5170/api';

export default function ForgotPassword() {
    const navigate = useNavigate();

    // 'form' | 'success'
    const [step, setStep]       = useState('form');
    const [email, setEmail]     = useState('');
    const [error, setError]     = useState('');
    const [loading, setLoading] = useState(false);

    // ── ÉTAPE 4 — POST /api/auth/forgot_password ──────────────────────
    const handleSubmit = async () => {
        setError('');

        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            setError('Veuillez saisir une adresse e-mail valide.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API}/auth/forgot_password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                // ÉTAPE 8–9 — [e-mail non trouvé] : affiche msg d'erreur
                setError(data.message || 'Adresse e-mail introuvable.');
                return;
            }

            // ÉTAPE 7 — [e-mail trouvé] : email avec lien envoyé
            setStep('success');

        } catch {
            setError('Erreur de connexion. Réessayez.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.card}>

                {/* ── Panneau gauche ──────────────────────────────────── */}
                <div style={styles.left}>

                    {/* Logo */}
                    <div style={styles.logoRow}>
                        <div style={styles.logoBox}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="3" width="18" height="18" rx="3" fill="white" opacity="0.92" />
                                <path d="M7 8h10M7 12h7M7 16h5" stroke="#2347C8" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                        </div>
                        <span style={styles.logoText}>El Fatoora</span>
                    </div>

                    {/* ── Vue : Formulaire (étapes 2–9) ───────────────── */}
                    {step === 'form' && (
                        <>
                            <p style={styles.title}>Mot de passe<br />oublié ?</p>
                            <p style={styles.subtitle}>
                                Saisissez votre adresse e-mail. Nous vous enverrons un lien de réinitialisation.
                            </p>

                            {/* ÉTAPE 9 — message d'erreur */}
                            {error && (
                                <div style={styles.errorBox}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                        stroke="#cf1322" strokeWidth="2" strokeLinecap="round"
                                        style={{ flexShrink: 0, marginTop: 1 }}>
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <label style={styles.label}>Adresse e-mail</label>
                            <div style={styles.inputWrap}>
                                <span style={styles.inputIcon}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                        <rect x="2" y="4" width="20" height="16" rx="3" />
                                        <path d="M2 7l10 7 10-7" />
                                    </svg>
                                </span>
                                {/* ÉTAPE 3 — saisie de l'adresse mail */}
                                <input
                                    style={{ ...styles.input, ...(error ? styles.inputError : {}) }}
                                    type="email"
                                    placeholder="votre@email.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                    autoFocus
                                />
                            </div>

                            <button style={styles.btn} onClick={handleSubmit} disabled={loading}>
                                {loading
                                    ? <span style={styles.spinner} />
                                    : 'Envoyer le lien de réinitialisation'}
                            </button>

                            <div style={styles.backRow}>
                                {/* ÉTAPE 1 — retour vers login */}
                                <span style={styles.backLink} onClick={() => navigate('/login')}>
                                    ← Retour à la connexion
                                </span>
                            </div>
                        </>
                    )}

                    {/* ── Vue : Succès (étape 7 — [e-mail trouvé]) ───── */}
                    {step === 'success' && (
                        <div style={styles.successView}>
                            <div style={styles.successIcon}>
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                                    stroke="#52c41a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <p style={{ ...styles.title, textAlign: 'center' }}>E-mail envoyé !</p>
                            <p style={{ ...styles.subtitle, textAlign: 'center' }}>
                                Vérifiez votre boîte mail.<br />
                                Le lien expire dans <strong style={{ color: '#111' }}>15 min</strong>.
                            </p>
                            <p style={{ ...styles.subtitle, textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>
                                {email}
                            </p>
                            <span
                                style={{ ...styles.backLink, display: 'block', textAlign: 'center', marginTop: 20 }}
                                onClick={() => { setStep('form'); setError(''); }}>
                                Renvoyer l'e-mail
                            </span>
                            <span
                                style={{ ...styles.backLink, display: 'block', textAlign: 'center', marginTop: 10 }}
                                onClick={() => navigate('/login')}>
                                ← Retour à la connexion
                            </span>
                        </div>
                    )}

                    {/* Footer */}
                    <div style={styles.footer}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        Sécurisé par <strong style={{ color: '#6b7280', fontWeight: 500 }}>Tunisie TradeNet</strong>
                    </div>
                </div>

                {/* ── Panneau droit bleu ──────────────────────────────── */}
                <div style={styles.right}>
                    <div style={styles.rightCircle1} />
                    <div style={styles.rightCircle2} />
                </div>
            </div>
        </div>
    );
}

// ── Styles (inline, même approche que ton projet existant) ────────────────
const styles = {
    wrapper: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#f5f7fa',
        fontFamily: "'DM Sans', -apple-system, sans-serif",
    },
    card: {
        display: 'flex', width: 520, minHeight: 460,
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 4px 32px rgba(0,0,0,0.10)', background: '#fff',
    },
    left: {
        flex: 1, padding: '36px 40px 28px',
        display: 'flex', flexDirection: 'column',
    },
    right: {
        width: 130, background: '#2347C8',
        position: 'relative', overflow: 'hidden', flexShrink: 0,
    },
    rightCircle1: {
        position: 'absolute', width: 200, height: 200, borderRadius: '50%',
        background: 'rgba(255,255,255,0.09)', bottom: -70, right: -90,
    },
    rightCircle2: {
        position: 'absolute', width: 130, height: 130, borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)', top: 50, right: -40,
    },
    logoRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 },
    logoBox: {
        width: 36, height: 36, background: '#2347C8',
        borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    logoText: { fontSize: 17, fontWeight: 600, color: '#111' },
    title: { fontSize: 26, fontWeight: 700, color: '#111', marginBottom: 8, lineHeight: 1.2 },
    subtitle: { fontSize: 14, color: '#6b7280', lineHeight: 1.55, marginBottom: 22 },
    label: { fontSize: 13, fontWeight: 500, color: '#111', marginBottom: 6, display: 'block' },
    inputWrap: { position: 'relative', marginBottom: 20 },
    inputIcon: {
        position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
        color: '#9ca3af', pointerEvents: 'none', display: 'flex',
    },
    input: {
        width: '100%', height: 46, border: '1.5px solid #e5e7eb', borderRadius: 10,
        padding: '0 14px 0 40px', fontSize: 14, color: '#111', background: '#f9fafb',
        outline: 'none', boxSizing: 'border-box',
        fontFamily: "'DM Sans', -apple-system, sans-serif",
    },
    inputError: { borderColor: '#e24b4a', background: '#fff5f5' },
    errorBox: {
        background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 8,
        padding: '10px 13px', fontSize: 13, color: '#cf1322',
        display: 'flex', alignItems: 'flex-start', gap: 8,
        marginBottom: 16, lineHeight: 1.4,
    },
    btn: {
        width: '100%', height: 48, background: '#1a3db5', border: 'none',
        borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 600,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Sans', -apple-system, sans-serif",
    },
    backRow: { textAlign: 'center', marginTop: 16 },
    backLink: { fontSize: 13, color: '#2347C8', fontWeight: 500, cursor: 'pointer' },
    successView: {
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '0 8px',
    },
    successIcon: {
        width: 56, height: 56, borderRadius: '50%', border: '2px solid #52c41a',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    },
    footer: {
        marginTop: 'auto', paddingTop: 20, fontSize: 12, color: '#9ca3af',
        display: 'flex', alignItems: 'center', gap: 5,
    },
    spinner: {
        width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)',
        borderTopColor: '#fff', borderRadius: '50%',
        display: 'inline-block', animation: 'spin 0.7s linear infinite',
    },
};