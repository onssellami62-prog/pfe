import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Login.css';
import slide1Img from '../assets/abstract3d.png';

const SLIDES = [
    {
        id: 0,
        image: slide1Img,
        title: 'La transformation digitale au service de votre entreprise',
        description:
            'Optimisez votre cycle de facturation, réduisez vos coûts et restez conforme aux réglementations nationales avec El Fatoora.',
    },
    {
        id: 1,
        image: slide1Img,
        title: 'Sécurité et conformité sans compromis',
        description:
            'Vos données sont protégées par les plus hauts standards de sécurité et conformes aux exigences de Tunisie TradeNet.',
    },
    {
        id: 2,
        image: slide1Img,
        title: "L'innovation au cœur de votre facturation",
        description:
            'Simplifiez vos processus métier avec une solution agile, moderne et entièrement digitalisée.',
    },
];

function Login({ onLoginSuccess }) {
    const [showPassword, setShowPassword] = useState(false);
    const [identifiant, setIdentifiant] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loginError, setLoginError] = useState('');

    // Nouveaux états pour l'inscription
    const [isRegistering, setIsRegistering] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false);
    const [nom, setNom] = useState('');
    const [entreprise, setEntreprise] = useState('');
    const [mf, setMf] = useState('');
    const [regSuccess, setRegSuccess] = useState('');

    // Carousel state
    const [activeDot, setActiveDot] = useState(0);
    const [animating, setAnimating] = useState(false);
    const [direction, setDirection] = useState('next');
    const dragStartX = useRef(null);
    const autoPlayRef = useRef(null);

    const goTo = useCallback(
        (index, dir) => {
            if (animating) return;
            setDirection(dir);
            setAnimating(true);
            setTimeout(() => {
                setActiveDot(index);
                setAnimating(false);
            }, 420);
        },
        [animating]
    );

    const goNext = useCallback(() => {
        const next = (activeDot + 1) % SLIDES.length;
        goTo(next, 'next');
    }, [activeDot, goTo]);

    const goPrev = useCallback(() => {
        const prev = (activeDot - 1 + SLIDES.length) % SLIDES.length;
        goTo(prev, 'prev');
    }, [activeDot, goTo]);

    const resetAutoPlay = useCallback(() => {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = setInterval(goNext, 4000);
    }, [goNext]);

    useEffect(() => {
        autoPlayRef.current = setInterval(goNext, 4000);
        return () => clearInterval(autoPlayRef.current);
    }, [goNext]);

    const handleDotClick = (i) => {
        if (i === activeDot) return;
        goTo(i, i > activeDot ? 'next' : 'prev');
        resetAutoPlay();
    };

    const handleDragStart = (e) => {
        dragStartX.current =
            e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    };

    const handleDragEnd = (e) => {
        if (dragStartX.current === null) return;
        const endX =
            e.type === 'touchend' ? e.changedTouches[0].clientX : e.clientX;
        const diff = dragStartX.current - endX;
        if (Math.abs(diff) > 40) {
            diff > 0 ? goNext() : goPrev();
            resetAutoPlay();
        }
        dragStartX.current = null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoginError('');

        try {
            const response = await fetch('http://localhost:5170/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: identifiant,
                    password: password
                }),
            });

            if (response.ok) {
                const data = await response.json();

                // Stocker le token et les infos dans le localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify({
                    email: data.email,
                    name: data.name,
                    entreprise: data.entreprise || data.Entreprise,
                    matriculeFiscal: data.matriculeFiscal || data.MatriculeFiscal,
                    role: data.role,
                    companyId: data.companyId || data.CompanyId,
                    address: data.address
                }));

                if (onLoginSuccess) onLoginSuccess(data);
            } else {
                const errorMsg = await response.text();
                setLoginError(errorMsg || 'Identifiant ou mot de passe incorrect.');
            }
        } catch (err) {
            console.error('Erreur lors de la connexion:', err);
            setLoginError('Serveur backend non disponible.');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoginError('');

        try {
            const response = await fetch('http://localhost:5170/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: identifiant,
                    password: password,
                    name: nom,
                    entreprise: entreprise,
                    matriculeFiscal: mf,
                    username: identifiant // Utilise l'email comme username par défaut
                }),
            });

            if (response.ok) {
                setIsWaiting(true);
            } else {
                const errorMsg = await response.text();
                setLoginError(errorMsg || "Échec de l'inscription.");
            }
        } catch (err) {
            setLoginError('Erreur serveur lors de l\'inscription.');
        }
    };

    const slide = SLIDES[activeDot];

    return (
        <div className="login-page">
            {/* ── LEFT PANEL ── */}
            <div className="login-left">
                {/* Logo */}
                <div className="login-logo">
                    <div className="login-logo-icon">
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                        </svg>
                    </div>
                    <span className="login-logo-text">El Fatoora</span>
                </div>

                {isWaiting ? (
                    <div className="waiting-container" style={{ textAlign: 'center', padding: '20px' }}>
                        <div className="waiting-icon" style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
                        <h2>Demande envoyée !</h2>
                        <p style={{ color: '#64748b', marginBottom: '24px' }}>
                            Votre compte El Fatoora est en cours d'examen. <br />
                            Vous recevrez un accès dès que l'administrateur aura validé votre dossier.
                        </p>
                        <button className="btn-login" onClick={() => setIsWaiting(false)}>Retour à la connexion</button>
                    </div>
                ) : (
                    <>
                        <div className="login-welcome">
                            <h1>{isRegistering ? 'Créer un compte' : 'Bienvenue'}</h1>
                            <p>{isRegistering ? 'Rejoignez la plateforme de facturation éléctronique n°1.' : 'Accédez à votre plateforme de facturation électronique sécurisée.'}</p>
                        </div>

                        <form className="login-form" onSubmit={isRegistering ? handleRegister : handleSubmit}>
                            {isRegistering && (
                                <div className="form-group">
                                    <label>Nom Complet</label>
                                    <input type="text" placeholder="Ex: Ahmed Khlifi" value={nom} onChange={(e) => setNom(e.target.value)} required />
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="identifiant">Identifiant / Email</label>
                                <input
                                  id="identifiant"
                                  type="email"
                                  placeholder="Entrez votre email ici"
                                  autoComplete="new-password"
                                  readOnly
                                  onFocus={(e) => e.target.removeAttribute('readonly')}
                                  value={identifiant}
                                  onChange={(e) => setIdentifiant(e.target.value)}
                                  required
                                />
                            </div>

                            {isRegistering && (
                                <>
                                    <div className="form-group">
                                        <label>Nom de la Société</label>
                                        <input type="text" placeholder="Ex: Ste. Alpha" value={entreprise} onChange={(e) => setEntreprise(e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Matricule Fiscal (13 car.)</label>
                                        <input type="text" placeholder="1234567XAM000" maxLength="13" value={mf} onChange={(e) => setMf(e.target.value)} required />
                                    </div>
                                </>
                            )}

                            <div className="form-group">
                                <label htmlFor="password">Mot de passe</label>
                                <input
                                  id="password"
                                  type={showPassword ? 'text' : 'password'}
                                  placeholder="Entrez votre mot de passe"
                                  autoComplete="new-password"
                                  readOnly
                                  onFocus={(e) => e.target.removeAttribute('readonly')}
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  required
                                />
                            </div>

                            {!isRegistering && (
                                <div className="form-options">
                                    <label className="remember-me">
                                        <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} id="remember" />
                                        <span>Se souvenir de moi</span>
                                    </label>
                                    <a href="/mot-de-passe-oublie" className="forgot-link">Oublié ?</a>
                                </div>
                            )}

                            {loginError && (
                                <div className="login-error-msg">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    {loginError}
                                </div>
                            )}

                            <button type="submit" className="btn-login">
                                {isRegistering ? "Soumettre l'inscription" : "Se connecter"}
                            </button>

                            <button type="button" className="btn-register-toggle" onClick={() => setIsRegistering(!isRegistering)} style={{ width: '100%', marginTop: '12px', background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer', fontWeight: '600' }}>
                                {isRegistering ? "Déjà un compte ? Se connecter" : "Nouveau ? Créer un compte"}
                            </button>
                        </form>
                    </>
                )}

                <hr className="login-divider" />

                {/* Footer */}
                <div className="login-footer">
                    <div className="secured-by">
                        <span className="shield-icon">
                            <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                        </span>
                        <span>
                            Sécurisé par <strong>Tunisie TradeNet</strong>
                        </span>
                    </div>
                    <div className="footer-links">
                        <a href="/aide">
                            <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            Aide
                        </a>
                        <a href="/contact">
                            <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                            Contact
                        </a>
                    </div>
                </div>
            </div>

            {/* ── RIGHT PANEL (CAROUSEL) ── */}
            <div
                className="login-right"
                onMouseDown={handleDragStart}
                onMouseUp={handleDragEnd}
                onTouchStart={handleDragStart}
                onTouchEnd={handleDragEnd}
            >
                {/* Sliding content */}
                <div
                    key={activeDot}
                    className={`carousel-slide ${animating ? `slide-exit-${direction}` : 'slide-enter'}`}
                >
                    <div className="image-card">
                        <img src={slide.image} alt={slide.title} />
                    </div>

                    <div className="right-content">
                        <h2>{slide.title}</h2>
                        <p>{slide.description}</p>
                    </div>
                </div>

                {/* Dots */}
                <div className="carousel-dots">
                    {SLIDES.map((_, i) => (
                        <button
                            key={i}
                            className={`dot ${activeDot === i ? 'active' : ''}`}
                            onClick={() => handleDotClick(i)}
                            aria-label={`Slide ${i + 1}`}
                        />
                    ))}
                </div>

                <div className="right-footer">© 2024 EL FATOORA V2.1.0</div>
            </div>
        </div>
    );
}

export default Login;
