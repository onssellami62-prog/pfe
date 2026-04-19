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
        const data = await response.json();
        setMessage(data.message);
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

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword) || !/[@#$*!]/.test(newPassword)) {
      setError('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@#$*!).');
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
        setTimeout(() => navigate('/login'), 2000);
      } else {
        const errMsg = await response.text();
        setError(errMsg || 'Erreur lors de la réinitialisation.');
      }
    } catch {
      setError('Serveur non disponible.');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-left" style={{ maxWidth: '520px', margin: '0 auto' }}>
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <span className="login-logo-text">El Fatoora</span>
        </div>

        {/* Titre */}
        <div className="login-welcome">
          <h1>Mot de passe oublié</h1>
          <p>
            {step === 1 && "Entrez votre email pour recevoir un code de vérification."}
            {step === 2 && "Entrez le code à 6 chiffres reçu par email."}
            {step === 3 && "Choisissez votre nouveau mot de passe."}
          </p>
        </div>

        {/* Messages */}
        {message && (
          <div style={{ background: '#ecfdf5', border: '1px solid #1a6b50', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#0a3326', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a6b50" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            {message}
          </div>
        )}

        {error && (
          <div className="login-error-msg">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Étape 1 : Email */}
        {step === 1 && (
          <form className="login-form" onSubmit={handleSendCode}>
            <div className="form-group">
              <label>Adresse email</label>
              <input
                type="email"
                placeholder="Entrez votre email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Envoi en cours...' : 'Envoyer le code'}
            </button>
          </form>
        )}

        {/* Étape 2 : Code OTP */}
        {step === 2 && (
          <form className="login-form" onSubmit={handleVerifyCode}>
            <div className="form-group">
              <label>Code de vérification</label>
              <input
                type="text"
                placeholder="Entrez le code à 6 chiffres"
                maxLength="6"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                required
                style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '24px', fontWeight: '700' }}
              />
            </div>
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Vérification...' : 'Vérifier le code'}
            </button>
            <button type="button" className="btn-register-toggle" onClick={() => { setStep(1); setError(''); setMessage(''); }} style={{ width: '100%', marginTop: '8px', background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer', fontWeight: '600' }}>
              Renvoyer un code
            </button>
          </form>
        )}

        {/* Étape 3 : Nouveau mot de passe */}
        {step === 3 && (
          <form className="login-form" onSubmit={handleResetPassword}>
            <div className="form-group">
              <label>Nouveau mot de passe</label>
              <input
                type="password"
                placeholder="Min. 8 car., majuscule, chiffre, @#$*!"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Confirmer le mot de passe</label>
              <input
                type="password"
                placeholder="Retapez le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {/* Indicateurs de complexité */}
            <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: newPassword.length >= 8 ? '#1a6b50' : '#ef4444' }}>
                {newPassword.length >= 8 ? '✓' : '✗'} Minimum 8 caractères
              </span>
              <span style={{ color: /[A-Z]/.test(newPassword) ? '#1a6b50' : '#ef4444' }}>
                {/[A-Z]/.test(newPassword) ? '✓' : '✗'} Une majuscule
              </span>
              <span style={{ color: /[a-z]/.test(newPassword) ? '#1a6b50' : '#ef4444' }}>
                {/[a-z]/.test(newPassword) ? '✓' : '✗'} Une minuscule
              </span>
              <span style={{ color: /\d/.test(newPassword) ? '#1a6b50' : '#ef4444' }}>
                {/\d/.test(newPassword) ? '✓' : '✗'} Un chiffre
              </span>
              <span style={{ color: /[@#$*!]/.test(newPassword) ? '#1a6b50' : '#ef4444' }}>
                {/[@#$*!]/.test(newPassword) ? '✓' : '✗'} Un caractère spécial (@#$*!)
              </span>
              {confirmPassword && (
                <span style={{ color: newPassword === confirmPassword ? '#1a6b50' : '#ef4444' }}>
                  {newPassword === confirmPassword ? '✓' : '✗'} Les mots de passe correspondent
                </span>
              )}
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Valider le nouveau mot de passe'}
            </button>
          </form>
        )}

        {/* Retour au login */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            onClick={() => navigate('/login')}
            style={{ background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
          >
            ← Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  );
}
