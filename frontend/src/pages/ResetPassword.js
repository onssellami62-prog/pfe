/**
 * ResetPassword.jsx — src/pages/ResetPassword.jsx
 *
 * Étapes 10–18 du diagramme de séquence :
 *  10. Utilisateur clique le lien reçu par email
 *  11. GET /api/auth/reset-password?token=...
 *  12. Backend vérifie token & expiry
 *  13. [valide] → affiche formulaire nouveau mdp
 *  14. Saisie nouveau mdp
 *  15. POST /api/auth/reset-password
 *  16. Backend MAJ mdp & invalide token
 *  17. Réinitialisation réussie
 *  18. Redirection vers /login
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API = 'http://localhost:5170/api';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // ÉTAPE 10 — token extrait de l'URL (/reset-password?token=...)
    const token = searchParams.get('token');

    // 'loading' | 'invalid' | 'form' | 'success'
    const [view, setView]         = useState('loading');
    const [pwd, setPwd]           = useState('');
    const [confirm, setConfirm]   = useState('');
    const [showPwd, setShowPwd]   = useState(false);
    const [showConf, setShowConf] = useState(false);
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);

    // ── ÉTAPE 11–12 — Vérification token au chargement ────────────────
    useEffect(() => {
        if (!token) { setView('invalid'); return; }

        fetch(`${API}/auth/reset-password?token=${token}`)
            .then(res => {
                if (!res.ok) throw new Error();
                // ÉTAPE 13 — token valide : affiche le formulaire
                setView('form');
            })
            .catch(() => setView('invalid'));
    }, [token]);

    // ── ÉTAPE 15 — POST /api/auth/reset-password ──────────────────────
    const handleSubmit = async () => {
        setError('');

        if (!pwd || pwd.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères.');
            return;
        }
        if (pwd !== confirm) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    password: pwd,
                    passwordConfirmation: confirm,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || 'Erreur lors de la réinitialisation.');
                return;
            }

            // ÉTAPE 17 — réinitialisation réussie
            setView('success');

            // ÉTAPE 18 — redirection vers login après 3s
            setTimeout(() => navigate('/login'), 3000);

        } catch {
            setError('Erreur de connexion. Réessayez.');
        } finally {
            setLoading(false);
        }
    };

    // ── Force du mot de passe ──────────────────────────────────────────
    const getStrength = (p) => {
        if (!p) return null;
        let score = 0;
        if (p.length >= 8)          score++;
        if (/[A-Z]/.test(p))        score++;
        if (/[0-9]/.test(p))        score++;
        if (/[^A-Za-z0-9]/.test(p)) score++;
        return [
            { label: 'Faible',  color: '#e24b4a', width: '25%' },
            { label: 'Faible',  color: '#fa8c16', width: '40%' },
            { label: 'Moyen — ajoutez des caractères spéciaux', color: '#faad14', width: '60%' },
            { label: 'Bon',     color: '#52c41a', width: '80%' },
            { label: 'Excellent', color: '#1a8a00', width: '100%' },
        ][Math.min(score, 4)];
    };

    const strength = getStrength(pwd);

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

                    {/* ── Vue : Chargement (étape 11–12) ──────────────── */}
                    {view === 'loading' && (
                        <div style={styles.centerView}>
                            <div style={styles.bigSpinner} />
                            <p style={{ fontSize: 14, color: '#6b7280', marginTop: 16 }}>
                                Vérification du lien…
                            </p>
                        </div>
                    )}

                    {/* ── Vue : Token invalide / expiré ───────────────── */}
                    {view === 'invalid' && (
                        <div style={styles.centerView}>
                            <div style={styles.invalidIcon}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                                    stroke="#e24b4a" strokeWidth="2.2" strokeLinecap="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </div>
                            <p style={{ ...styles.title, textAlign: 'center' }}>Lien invalide</p>
                            <p style={{ ...styles.subtitle, textAlign: 'center' }}>
                                Ce lien est invalide ou a expiré (15 min).<br />
                                Veuillez faire une nouvelle demande.
                            </p>
                            <button style={{ ...styles.btn, maxWidth: 280 }}
                                onClick={() => navigate('/forgot-password')}>
                                Demander un nouveau lien
                            </button>
                        </div>
                    )}

                    {/* ── Vue : Formulaire (étapes 13–16) ─────────────── */}
                    {view === 'form' && (
                        <>
                            <p style={styles.title}>Nouveau mot<br />de passe</p>
                            <p style={styles.subtitle}>
                                Choisissez un mot de passe sécurisé pour votre compte.
                            </p>

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

                            {/* ÉTAPE 14 — saisie nouveau mdp */}
                            <label style={styles.label}>Nouveau mot de passe</label>
                            <div style={styles.inputWrap}>
                                <span style={styles.inputIcon}><LockIcon /></span>
                                <input
                                    style={styles.input}
                                    type={showPwd ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={pwd}
                                    onChange={e => setPwd(e.target.value)}
                                    autoFocus
                                />
                                <button style={styles.eyeBtn} onClick={() => setShowPwd(v => !v)}>
                                    <EyeIcon open={showPwd} />
                                </button>
                            </div>

                            {/* Barre de force */}
                            {strength && (
                                <>
                                    <div style={styles.strengthBar}>
                                        <div style={{ ...styles.strengthFill, width: strength.width, background: strength.color }} />
                                    </div>
                                    <p style={{ ...styles.strengthText, color: strength.color }}>
                                        {strength.label}
                                    </p>
                                </>
                            )}
                            {!strength && <div style={{ marginBottom: 18 }} />}

                            <label style={styles.label}>Confirmer le mot de passe</label>
                            <div style={{ ...styles.inputWrap, marginBottom: 4 }}>
                                <span style={styles.inputIcon}><LockIcon /></span>
                                <input
                                    style={{
                                        ...styles.input,
                                        ...(confirm && confirm !== pwd ? styles.inputError : {}),
                                    }}
                                    type={showConf ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={confirm}
                                    onChange={e => setConfirm(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                />
                                <button style={styles.eyeBtn} onClick={() => setShowConf(v => !v)}>
                                    <EyeIcon open={showConf} />
                                </button>
                            </div>

                            <button style={{ ...styles.btn, marginTop: 16 }}
                                onClick={handleSubmit} disabled={loading}>
                                {loading
                                    ? <span style={styles.spinner} />
                                    : 'Réinitialiser le mot de passe'}
                            </button>
                        </>
                    )}

                    {/* ── Vue : Succès (étape 17–18) ───────────────────── */}
                    {view === 'success' && (
                        <div style={styles.centerView}>
                            <div style={styles.successIcon}>
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                                    stroke="#52c41a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <p style={{ ...styles.title, textAlign: 'center' }}>
                                Mot de passe réinitialisé !
                            </p>
                            <p style={{ ...styles.subtitle, textAlign: 'center' }}>
                                Votre mot de passe a été mis à jour.<br />
                                Redirection vers la connexion…
                            </p>
                            {/* ÉTAPE 18 — redirection vers login */}
                            <button style={{ ...styles.btn, maxWidth: 240 }}
                                onClick={() => navigate('/login')}>
                                Se connecter maintenant
                            </button>
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

// ── Icônes ────────────────────────────────────────────────────────────────
function LockIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    );
}

function EyeIcon({ open }) {
    return open ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = {
    wrapper: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#f5f7fa',
        fontFamily: "'DM Sans', -apple-system, sans-serif",
    },
    card: {
        display: 'flex', width: 520, minHeight: 480,
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
    inputWrap: { position: 'relative', marginBottom: 6 },
    inputIcon: {
        position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
        color: '#9ca3af', pointerEvents: 'none', display: 'flex',
    },
    eyeBtn: {
        position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#9ca3af', padding: 0, display: 'flex',
    },
    input: {
        width: '100%', height: 46, border: '1.5px solid #e5e7eb', borderRadius: 10,
        padding: '0 42px 0 40px', fontSize: 14, color: '#111', background: '#f9fafb',
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
    strengthBar: {
        height: 3, borderRadius: 2, background: '#e5e7eb',
        overflow: 'hidden', margin: '7px 0 4px',
    },
    strengthFill: { height: '100%', borderRadius: 2, transition: 'width 0.3s, background 0.3s' },
    strengthText: { fontSize: 12, marginBottom: 16 },
    btn: {
        width: '100%', height: 48, background: '#1a3db5', border: 'none',
        borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 600,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Sans', -apple-system, sans-serif",
    },
    centerView: {
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '0 8px',
    },
    invalidIcon: {
        width: 52, height: 52, borderRadius: '50%', border: '2px solid #e24b4a',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    },
    successIcon: {
        width: 56, height: 56, borderRadius: '50%', border: '2px solid #52c41a',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    },
    bigSpinner: {
        width: 36, height: 36,
        border: '3px solid #e5e7eb', borderTopColor: '#2347C8',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
    },
    spinner: {
        width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)',
        borderTopColor: '#fff', borderRadius: '50%',
        display: 'inline-block', animation: 'spin 0.7s linear infinite',
    },
    footer: {
        marginTop: 'auto', paddingTop: 20, fontSize: 12, color: '#9ca3af',
        display: 'flex', alignItems: 'center', gap: 5,
    },
};