import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Étape 1 : Envoyer le code OTP
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!gmailRegex.test(email.trim())) {
      setError("L'email doit être une adresse Gmail valide (exemple@gmail.com).");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5170/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (response.ok) {
        await response.json();
        setMessage("Un code de verification a ete envoye a votre email.");
        setStep(2);
      } else {
        const errMsg = await response.text();
        setError(errMsg || "Erreur lors de l'envoi du code.");
      }
    } catch {
      setError('Serveur non disponible.');
    }
    setLoading(false);
  };

  // Étape 2 : Vérifier le code OTP
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (otpCode.length !== 6) {
      setError('Le code doit contenir 6 chiffres.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5170/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otpCode }),
      });

      if (response.ok) {
        setMessage('Code vérifié ! Choisissez votre nouveau mot de passe.');
        setStep(3);
      } else {
        const errMsg = await response.text();
        setError(errMsg || 'Code invalide ou expiré.');
      }
    } catch {
      setError('Serveur non disponible.');
    }
    setLoading(false);
  };

  // Étape 3 : Réinitialiser le mot de passe
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$*!])[A-Za-z\d@#$*!]{8,}$/;
    if (!complexityRegex.test(newPassword)) {
      setError('Le mot de passe ne respecte pas les critères de sécurité.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5170/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otpCode, newPassword }),
      });

      if (response.ok) {
        setMessage('Mot de passe modifié avec succès ! Redirection...');
        setTimeout(() => navigate('/login'), 2500);
      } else {
        const errMsg = await response.text();
        setError(errMsg || 'Erreur lors de la réinitialisation.');
      }
    } catch {
      setError('Serveur non disponible.');
    }
    setLoading(false);
  };

  const renderContent = () => {
    switch (step) {
      case 1:
        return (
          <form className="login-form" onSubmit={handleSendCode}>
            <div className="form-title">
              <h2>Récupération</h2>
              <p className="form-subtitle">Entrez votre email pour recevoir un code de vérification.</p>
            </div>

            <div className="field">
              <label>ADRESSE EMAIL</label>
              <div className="input-box">
                <span className="input-icon">@</span>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && <div className="error-msg">{error}</div>}
            {message && <div className="error-msg" style={{ backgroundColor: '#ecfdf5', borderColor: '#10b981', color: '#065f46' }}>{message}</div>}

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Envoi en cours...' : 'Envoyer le code'} <span>&#8594;</span>
            </button>

            <div className="toggle-text">
              <button type="button" onClick={() => navigate('/login')}>Retour à la connexion</button>
            </div>
          </form>
        );

      case 2:
        return (
          <form className="login-form" onSubmit={handleVerifyCode}>
            <div className="form-title">
              <h2>Vérification</h2>
              <p className="form-subtitle">Entrez le code à 6 chiffres envoyé à {email}.</p>
            </div>

            <div className="field">
              <label>CODE DE VÉRIFICATION</label>
              <div className="input-box">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="000000"
                  maxLength="6"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                  style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem', fontWeight: '700' }}
                />
              </div>
            </div>

            {error && <div className="error-msg">{error}</div>}
            {message && <div className="error-msg" style={{ backgroundColor: '#ecfdf5', borderColor: '#10b981', color: '#065f46' }}>{message}</div>}

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Vérification...' : 'Vérifier le code'} <span>&#8594;</span>
            </button>

            <div className="toggle-text">
              Pas reçu ? <button type="button" onClick={() => { setStep(1); setError(''); setMessage(''); }}>Renvoyer un code</button>
            </div>
          </form>
        );

      case 3:
        return (
          <form className="login-form" onSubmit={handleResetPassword}>
            <div className="form-title">
              <h2>Nouveau mot de passe</h2>
              <p className="form-subtitle">Définissez votre nouvel accès sécurisé.</p>
            </div>

            <div className="field">
              <label>NOUVEAU MOT DE PASSE</label>
              <div className="input-box">
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  type="password"
                  placeholder="********"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label>CONFIRMER LE MOT DE PASSE</label>
              <div className="input-box">
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </span>
                <input
                  type="password"
                  placeholder="********"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
              <div style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px', color: newPassword.length >= 8 ? '#059669' : '#94a3b8' }}>
                {newPassword.length >= 8 ? '●' : '○'} 8+ caractères
              </div>
              <div style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px', color: /[A-Z]/.test(newPassword) ? '#059669' : '#94a3b8' }}>
                {/[A-Z]/.test(newPassword) ? '●' : '○'} Majuscule
              </div>
              <div style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px', color: /\d/.test(newPassword) ? '#059669' : '#94a3b8' }}>
                {/\d/.test(newPassword) ? '●' : '○'} Chiffre
              </div>
              <div style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px', color: /[@#$*!]/.test(newPassword) ? '#059669' : '#94a3b8' }}>
                {/[@#$*!]/.test(newPassword) ? '●' : '○'} Spécial (@#$*!)
              </div>
            </div>

            {error && <div className="error-msg">{error}</div>}
            {message && <div className="error-msg" style={{ backgroundColor: '#ecfdf5', borderColor: '#10b981', color: '#065f46' }}>{message}</div>}

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Valider le mot de passe'} <span>&#8594;</span>
            </button>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="login-page">
      <nav className="login-navbar">
        <div className="navbar-brand">
          <span className="brand-dot"></span>
          <span className="brand-name">El Fatoora</span>
        </div>
        <div className="navbar-links">
          <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer', letterSpacing: '1.5px' }}>CONNEXION</button>
          <a href="/aide">SUPPORT</a>
        </div>
      </nav>

      <div className="login-center">
        <div className="login-card">
          {renderContent()}
        </div>
      </div>

      <footer className="login-bottom-footer">
        <span>© 2024 El Fatoora - Tous droits réservés</span>
        <div className="bottom-links">
          <a href="/aide">CONFIDENTIALITÉ</a>
          <a href="/aide">CONDITIONS</a>
          <a href="/aide">SÉCURITÉ</a>
        </div>
      </footer>
    </div>
  );
}
