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

    // Liste des utilisateurs statiques pour le test
    const USERS = [
        { email: 'test@gmail.com', password: '123', role: 'user', name: 'User Test' },
        { email: 'ja7479845@gmail.com', password: '123', role: 'admin', name: 'Admin Central' },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        const foundUser = USERS.find(u => u.email === identifiant && u.password === password);
        
        if (foundUser) {
            setLoginError('');
            if (onLoginSuccess) onLoginSuccess(foundUser);
        } else {
            setLoginError('Identifiant ou mot de passe incorrect.');
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

                {/* Welcome */}
                <div className="login-welcome">
                    <h1>Bienvenue</h1>
                    <p>Accédez à votre plateforme de facturation électronique sécurisée.</p>
                </div>

                {/* Form */}
                <form className="login-form" onSubmit={handleSubmit}>
                    {/* Identifiant */}
                    <div className="form-group">
                        <label htmlFor="identifiant">Identifiant / Login</label>
                        <div className="input-wrapper">
                            <span className="input-icon">
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </span>
                            <input
                                id="identifiant"
                                type="text"
                                placeholder="Entrez votre identifiant"
                                value={identifiant}
                                onChange={(e) => setIdentifiant(e.target.value)}
                                autoComplete="username"
                                required
                            />
                        </div>
                    </div>

                    {/* Mot de passe */}
                    <div className="form-group">
                        <label htmlFor="password">Mot de passe</label>
                        <div className="input-wrapper">
                            <span className="input-icon">
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </span>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={
                                    showPassword
                                        ? 'Masquer le mot de passe'
                                        : 'Afficher le mot de passe'
                                }
                            >
                                {showPassword ? (
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Options */}
                    <div className="form-options">
                        <label className="remember-me">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                id="remember"
                            />
                            <span>Se souvenir de moi</span>
                        </label>
                        <a href="/mot-de-passe-oublie" className="forgot-link">
                            Mot de passe oublié ?
                        </a>
                    </div>

                    {/* Error message */}
                    {loginError && (
                        <div className="login-error-msg">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            {loginError}
                        </div>
                    )}

                    {/* Submit */}
                    <button type="submit" className="btn-login" id="btn-se-connecter">
                        Se connecter
                    </button>
                </form>

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
