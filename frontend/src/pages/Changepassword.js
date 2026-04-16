import React, { useState } from 'react';

const API_BASE = 'http://localhost:5170/api';

export default function ChangePassword({ user, onSuccess }) {
    const [ancienPassword,  setAncienPassword]  = useState('');
    const [nouveauPassword, setNouveauPassword] = useState('');
    const [confirmation,    setConfirmation]    = useState('');
    const [loading,         setLoading]         = useState(false);
    const [error,           setError]           = useState('');
    const [showAncien,      setShowAncien]      = useState(false);
    const [showNouveau,     setShowNouveau]     = useState(false);

    const regles = [
        { label: 'Au moins 8 caractères',         ok: nouveauPassword.length >= 8 },
        { label: 'Au moins une majuscule',         ok: /[A-Z]/.test(nouveauPassword) },
        { label: 'Au moins un chiffre',            ok: /[0-9]/.test(nouveauPassword) },
        { label: 'Au moins un caractère spécial',  ok: /[^A-Za-z0-9]/.test(nouveauPassword) },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (nouveauPassword !== confirmation) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }
        if (regles.some(r => !r.ok)) {
            setError('Le mot de passe ne respecte pas les règles de sécurité.');
            return;
        }

        setLoading(true);
        try {
            const res  = await fetch(`${API_BASE}/auth/change-password`, {
                method:  'PUT',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    email:           user.email,
                    ancienPassword,
                    nouveauPassword
                })
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.message || 'Erreur serveur.');
                return;
            }

            onSuccess();

        } catch {
            setError('Erreur de connexion au serveur.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', background: '#f8fafc',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{
                background: 'white', borderRadius: 16,
                border: '1px solid #e2e8f0', padding: '2.5rem',
                width: '100%', maxWidth: 440,
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: 56, height: 56, background: '#fff7ed',
                        borderRadius: '50%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: 24, margin: '0 auto 1rem'
                    }}>🔐</div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
                        Première connexion
                    </h1>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                        Pour votre sécurité, vous devez définir un nouveau mot de passe avant de continuer.
                    </p>
                </div>

                {/* Alerte */}
                <div style={{
                    background: '#fff7ed', border: '1px solid #fed7aa',
                    borderRadius: 8, padding: '10px 14px',
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                    marginBottom: '1.5rem', fontSize: 12, color: '#9a3412'
                }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
                    <span>Connecté en tant que <strong>{user?.email}</strong>. Ce mot de passe temporaire doit être changé.</span>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Ancien mot de passe */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                            Mot de passe temporaire actuel
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showAncien ? 'text' : 'password'}
                                required value={ancienPassword}
                                onChange={e => setAncienPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{
                                    width: '100%', padding: '9px 36px 9px 12px',
                                    border: '1px solid #e2e8f0', borderRadius: 8,
                                    fontSize: 13, outline: 'none', boxSizing: 'border-box'
                                }}
                            />
                            <button type="button" onClick={() => setShowAncien(!showAncien)}
                                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                                {showAncien ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    {/* Nouveau mot de passe */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                            Nouveau mot de passe
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showNouveau ? 'text' : 'password'}
                                required value={nouveauPassword}
                                onChange={e => setNouveauPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{
                                    width: '100%', padding: '9px 36px 9px 12px',
                                    border: '1px solid #e2e8f0', borderRadius: 8,
                                    fontSize: 13, outline: 'none', boxSizing: 'border-box'
                                }}
                            />
                            <button type="button" onClick={() => setShowNouveau(!showNouveau)}
                                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                                {showNouveau ? '🙈' : '👁️'}
                            </button>
                        </div>

                        {/* Règles de sécurité */}
                        {nouveauPassword.length > 0 && (
                            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {regles.map((r, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                                        <span style={{ color: r.ok ? '#16a34a' : '#94a3b8' }}>
                                            {r.ok ? '✅' : '○'}
                                        </span>
                                        <span style={{ color: r.ok ? '#16a34a' : '#94a3b8' }}>{r.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Confirmation */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                            Confirmer le nouveau mot de passe
                        </label>
                        <input
                            type="password" required value={confirmation}
                            onChange={e => setConfirmation(e.target.value)}
                            placeholder="••••••••"
                            style={{
                                width: '100%', padding: '9px 12px',
                                border: `1px solid ${confirmation && confirmation !== nouveauPassword ? '#ef4444' : '#e2e8f0'}`,
                                borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box'
                            }}
                        />
                        {confirmation && confirmation !== nouveauPassword && (
                            <p style={{ fontSize: 11, color: '#ef4444', margin: '4px 0 0' }}>
                                Les mots de passe ne correspondent pas.
                            </p>
                        )}
                    </div>

                    {/* Erreur */}
                    {error && (
                        <div style={{
                            background: '#fef2f2', border: '1px solid #fecaca',
                            borderRadius: 8, padding: '10px 14px',
                            fontSize: 12, color: '#dc2626', marginBottom: '1rem'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Bouton */}
                    <button type="submit" disabled={loading} style={{
                        width: '100%', padding: '11px',
                        background: loading ? '#93c5fd' : '#1e429f',
                        color: 'white', border: 'none', borderRadius: 8,
                        fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'background 0.2s'
                    }}>
                        {loading ? 'Enregistrement...' : 'Définir mon mot de passe'}
                    </button>
                </form>
            </div>
        </div>
    );
}