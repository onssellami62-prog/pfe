import React, { useState } from 'react';

const API_BASE = 'http://localhost:5170/api';

export default function Install({ onInstalled }) {
    const [form, setForm] = useState({
        nom: '', email: '', password: '', confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');
    const [success, setSuccess] = useState(false);
    const [showPwd, setShowPwd] = useState(false);

    const regles = [
        { label: 'Au moins 8 caractères',        ok: form.password.length >= 8 },
        { label: 'Au moins une majuscule',        ok: /[A-Z]/.test(form.password) },
        { label: 'Au moins un chiffre',           ok: /[0-9]/.test(form.password) },
        { label: 'Au moins un caractère spécial', ok: /[^A-Za-z0-9]/.test(form.password) },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (regles.some(r => !r.ok)) {
            setError('Le mot de passe ne respecte pas les règles de sécurité.');
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        setLoading(true);
        try {
            const res  = await fetch(`${API_BASE}/install/setup`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(form)
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.message || 'Erreur serveur.');
                return;
            }

            setSuccess(true);
            setTimeout(() => onInstalled(), 2000);

        } catch {
            setError('Erreur de connexion au serveur.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #f8fafc 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Inter', sans-serif", padding: '2rem'
        }}>
            <div style={{ width: '100%', maxWidth: 480 }}>

                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: 60, height: 60, background: '#1e429f',
                        borderRadius: 16, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 1rem',
                        fontSize: 22, fontWeight: 800, color: 'white'
                    }}>EF</div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                        Bienvenue sur El Fatoora
                    </h1>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                        Configurez votre compte administrateur pour commencer
                    </p>
                </div>

                {/* Card */}
                <div style={{
                    background: 'white', borderRadius: 16,
                    border: '1px solid #e2e8f0', padding: '2rem',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
                }}>
                    {success ? (
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            <div style={{ fontSize: 48, marginBottom: '1rem' }}>✅</div>
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#16a34a', margin: '0 0 8px' }}>
                                Installation réussie !
                            </h2>
                            <p style={{ fontSize: 13, color: '#64748b' }}>
                                Redirection vers la page de connexion...
                            </p>
                        </div>
                    ) : (
                        <>
                            <div style={{
                                background: '#eff6ff', border: '1px solid #bfdbfe',
                                borderRadius: 8, padding: '10px 14px',
                                fontSize: 12, color: '#1e429f', marginBottom: '1.5rem',
                                display: 'flex', gap: 8, alignItems: 'flex-start'
                            }}>
                                <span>ℹ️</span>
                                <span>Cette page s'affiche uniquement lors de la première installation. Elle sera désactivée après configuration.</span>
                            </div>

                            <form onSubmit={handleSubmit}>
                                {/* Nom */}
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                                        Nom complet
                                    </label>
                                    <input
                                        type="text" required
                                        placeholder="Ex: Ahmed Ben Ali"
                                        value={form.nom}
                                        onChange={e => setForm({ ...form, nom: e.target.value })}
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>

                                {/* Email */}
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                                        Email administrateur
                                    </label>
                                    <input
                                        type="email" required
                                        placeholder="admin@votreentreprise.tn"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                                    />
                                </div>

                                {/* Mot de passe */}
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                                        Mot de passe
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPwd ? 'text' : 'password'} required
                                            placeholder="••••••••"
                                            value={form.password}
                                            onChange={e => setForm({ ...form, password: e.target.value })}
                                            style={{ width: '100%', padding: '9px 36px 9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                                        />
                                        <button type="button" onClick={() => setShowPwd(!showPwd)}
                                            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                                            {showPwd ? '🙈' : '👁️'}
                                        </button>
                                    </div>

                                    {/* Règles */}
                                    {form.password.length > 0 && (
                                        <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                                            {regles.map((r, i) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                                                    <span style={{ color: r.ok ? '#16a34a' : '#94a3b8' }}>{r.ok ? '✅' : '○'}</span>
                                                    <span style={{ color: r.ok ? '#16a34a' : '#94a3b8' }}>{r.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Confirmation */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                                        Confirmer le mot de passe
                                    </label>
                                    <input
                                        type="password" required
                                        placeholder="••••••••"
                                        value={form.confirmPassword}
                                        onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                                        style={{
                                            width: '100%', padding: '9px 12px',
                                            border: `1px solid ${form.confirmPassword && form.confirmPassword !== form.password ? '#ef4444' : '#e2e8f0'}`,
                                            borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box'
                                        }}
                                    />
                                    {form.confirmPassword && form.confirmPassword !== form.password && (
                                        <p style={{ fontSize: 11, color: '#ef4444', margin: '4px 0 0' }}>
                                            Les mots de passe ne correspondent pas.
                                        </p>
                                    )}
                                </div>

                                {/* Erreur */}
                                {error && (
                                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#dc2626', marginBottom: '1rem' }}>
                                        {error}
                                    </div>
                                )}

                                {/* Bouton */}
                                <button type="submit" disabled={loading} style={{
                                    width: '100%', padding: '11px',
                                    background: loading ? '#93c5fd' : '#1e429f',
                                    color: 'white', border: 'none', borderRadius: 8,
                                    fontSize: 14, fontWeight: 600,
                                    cursor: loading ? 'not-allowed' : 'pointer'
                                }}>
                                    {loading ? 'Installation en cours...' : '🚀 Installer El Fatoora'}
                                </button>
                            </form>
                        </>
                    )}
                </div>

                <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: '1rem' }}>
                    El Fatoora — Plateforme de facturation électronique conforme TEIF TTN
                </p>
            </div>
        </div>
    );
}