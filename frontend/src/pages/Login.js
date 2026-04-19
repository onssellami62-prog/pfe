import React, { useState } from 'react';
import './Login.css';
import slide1Img from '../assets/abstract3d.png';

function Login({ onLoginSuccess }) {
    const [identifiant, setIdentifiant] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [requireOtp, setRequireOtp] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false);
    const [nom, setNom] = useState('');
    const [entreprise, setEntreprise] = useState('');
    const [mf, setMf] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoginError('');
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
        if (!gmailRegex.test(identifiant.trim())) {
            setLoginError("L'email doit etre une adresse Gmail valide (exemple@gmail.com).");
            return;
        }
        try {
            const response = await fetch('http://localhost:5170/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: identifiant, password }),
            });
            if (response.ok) {
                const data = await response.json();
                if (data.requireOtp) { setRequireOtp(true); return; }
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify({
                    userId: data.userId || data.UserId,
                    email: data.email, name: data.name,
                    entreprise: data.entreprise || data.Entreprise,
                    matriculeFiscal: data.matriculeFiscal || data.MatriculeFiscal,
                    role: data.role,
                    companyId: data.companyId || data.CompanyId,
                    companies: data.companies || [],
                    address: data.address
                }));
                if (onLoginSuccess) onLoginSuccess(data);
            } else {
                const errorMsg = await response.text();
                setLoginError(errorMsg || 'Identifiant ou mot de passe incorrect.');
            }
        } catch (err) {
            setLoginError('Serveur backend non disponible.');
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setLoginError('');
        try {
            const response = await fetch('http://localhost:5170/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: identifiant, otpCode }),
            });
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify({
                    userId: data.userId || data.UserId,
                    email: data.email, name: data.name,
                    entreprise: data.entreprise || data.Entreprise,
                    matriculeFiscal: data.matriculeFiscal || data.MatriculeFiscal,
                    role: data.role,
                    companyId: data.companyId || data.CompanyId,
                    companies: data.companies || [],
                    address: data.address
                }));
                if (onLoginSuccess) onLoginSuccess(data);
            } else {
                const errorMsg = await response.text();
                setLoginError(errorMsg || 'Code OTP incorrect ou expire.');
            }
        } catch (err) {
            setLoginError('Serveur backend non disponible.');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoginError('');
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
        if (!gmailRegex.test(identifiant.trim())) {
            setLoginError("L'email doit etre une adresse Gmail valide (exemple@gmail.com).");
            return;
        }
        if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[@#$*!]/.test(password)) {
            setLoginError("Le mot de passe doit contenir au moins 8 caracteres, une majuscule, une minuscule, un chiffre et un caractere special (@#$*!).");
            return;
        }
        try {
            const response = await fetch('http://localhost:5170/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: identifiant, password, name: nom,
                    entreprise, matriculeFiscal: mf, username: identifiant
                }),
            });
            if (response.ok) {
                setIsWaiting(true);
            } else {
                const errorMsg = await response.text();
                setLoginError(errorMsg || "Echec de l'inscription.");
            }
        } catch (err) {
            setLoginError("Erreur serveur lors de l'inscription.");
        }
    };

    const renderFormContent = () => {
        if (isWaiting) {
            return (
                <div className="waiting-block">
                    <div className="waiting-icon">&#9203;</div>
                    <h2>Demande envoyee !</h2>
                    <p>Votre compte est en cours d'examen. Vous recevrez un acces des validation par l'administrateur.</p>
                    <button className="btn-login" onClick={() => setIsWaiting(false)}>Retour a la connexion</button>
                </div>
            );
        }
        if (requireOtp) {
            return (
                <form className="login-form" onSubmit={handleOtpSubmit}>
                    <div className="form-title">
                        <h2>Validation de securite</h2>
                        <p className="form-subtitle">Veuillez renseigner le code envoye a votre e-mail.</p>
                    </div>
                    <div className="field">
                        <label>CODE OTP (6 CHIFFRES)</label>
                        <div className="input-box">
                            <span className="input-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            </span>
                            <input type="text" placeholder="000000" maxLength="6" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} required />
                        </div>
                    </div>
                    {loginError && <div className="error-msg">{loginError}</div>}
                    <button type="submit" className="btn-login">Verifier et se connecter <span>&#8594;</span></button>
                    <div className="toggle-text">
                        <button type="button" onClick={() => setRequireOtp(false)}>Annuler</button>
                    </div>
                </form>
            );
        }
        if (isRegistering) {
            return (
                <form className="login-form" onSubmit={handleRegister} autoComplete="off">
                    <div className="form-title">
                        <h2>Creer un compte</h2>
                        <p className="form-subtitle">Rejoignez la plateforme de facturation electronique.</p>
                    </div>
                    <div className="field">
                        <label>NOM COMPLET</label>
                        <div className="input-box">
                            <span className="input-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            </span>
                            <input type="text" placeholder="Nom et prenom" autoComplete="off" value={nom} onChange={(e) => setNom(e.target.value)} required />
                        </div>
                    </div>
                    <div className="field">
                        <label>IDENTIFIANT / EMAIL</label>
                        <div className="input-box">
                            <span className="input-icon">@</span>
                            <input type="email" placeholder="votre@email.com" autoComplete="off" value={identifiant} onChange={(e) => setIdentifiant(e.target.value)} required />
                        </div>
                    </div>
                    <div className="field">
                        <label>NOM DE LA SOCIETE</label>
                        <div className="input-box">
                            <span className="input-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/></svg>
                            </span>
                            <input type="text" placeholder="Ste. Alpha" value={entreprise} onChange={(e) => setEntreprise(e.target.value)} required />
                        </div>
                    </div>
                    <div className="field">
                        <label>MATRICULE FISCAL (13 CAR.)</label>
                        <div className="input-box">
                            <span className="input-icon">#</span>
                            <input type="text" placeholder="1234567XAM000" maxLength="13" value={mf} onChange={(e) => setMf(e.target.value)} required />
                        </div>
                    </div>
                    <div className="field">
                        <label>MOT DE PASSE</label>
                        <div className="input-box">
                            <span className="input-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            </span>
                            <input type="password" placeholder="********" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                    </div>
                    {loginError && <div className="error-msg">{loginError}</div>}
                    <button type="submit" className="btn-login">Creer mon compte <span>&#8594;</span></button>
                    <div className="toggle-text">
                        Deja un compte ? <button type="button" onClick={() => { setIsRegistering(false); setIdentifiant(''); setPassword(''); setNom(''); setEntreprise(''); setMf(''); setLoginError(''); }}>Se connecter</button>
                    </div>
                </form>
            );
        }
        return (
            <form className="login-form" onSubmit={handleSubmit}>
                <div className="form-title">
                    <h2>Bienvenue</h2>
                    <p className="form-subtitle">Connectez-vous à votre espace El Fatoora.</p>
                </div>
                <div className="field">
                    <label>IDENTIFIANT / EMAIL</label>
                    <div className="input-box">
                        <span className="input-icon">@</span>
                        <input type="email" placeholder="votre@email.com" autoComplete="new-password" readOnly onFocus={(e) => e.target.removeAttribute('readonly')} value={identifiant} onChange={(e) => setIdentifiant(e.target.value)} required />
                    </div>
                </div>
                <div className="field">
                    <div className="label-row">
                        <label>MOT DE PASSE</label>
                        <a href="/mot-de-passe-oublie" className="forgot-link">OUBLIE ?</a>
                    </div>
                    <div className="input-box">
                        <span className="input-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                        </span>
                        <input type="password" placeholder="********" autoComplete="new-password" readOnly onFocus={(e) => e.target.removeAttribute('readonly')} value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                </div>
                {loginError && <div className="error-msg">{loginError}</div>}
                <button type="submit" className="btn-login">Se connecter <span>&#8594;</span></button>
                <div className="toggle-text">
                    Vous n'avez pas de compte ? <button type="button" onClick={() => { setIsRegistering(true); setIdentifiant(''); setPassword(''); setLoginError(''); }}>Creer un profil securise</button>
                </div>
            </form>
        );
    };

    return (
        <div className="login-page">
            <nav className="login-navbar">
                <div className="navbar-brand">
                    <span className="brand-dot"></span>
                    <span className="brand-name">El Fatoora</span>
                </div>
                <div className="navbar-links">
                    <a href="/aide">SUPPORT</a>
                    <a href="/contact">SECURITE</a>
                </div>
            </nav>
            <div className="login-center">
                <div className="login-card">
                    <div className="card-image">
                        <img src={slide1Img} alt="El Fatoora" />
                    </div>
                    {renderFormContent()}
                </div>
            </div>
            <footer className="login-bottom-footer">
                <span>&#169; 2024 El Fatoora — Tous droits réservés</span>
                <div className="bottom-links">
                    <a href="/aide">CONFIDENTIALITE</a>
                    <a href="/aide">CONDITIONS</a>
                    <a href="/aide">PROTOCOLE DE SECURITE</a>
                </div>
            </footer>
        </div>
    );
}

export default Login;