import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login           from './pages/Login';
import Dashboard       from './pages/Dashboard';
import ChangePassword  from './pages/Changepassword';
import Install         from './pages/Install';
import ForgotPassword  from './pages/ForgotPassword';
import ResetPassword   from './pages/ResetPassword';
import useInactivityLogout from './hooks/useInactivityLogout';

const API_BASE = 'http://localhost:5170/api';

function App() {
    const [user, setUser] = useState(() => {
        // ← restaure l'user depuis localStorage au démarrage
        try {
            const saved = localStorage.getItem('user');
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });
    const [mustChangePassword, setMustChangePassword] = useState(false);
    const [installed, setInstalled]                   = useState(null);

    useEffect(() => {
        fetch(`${API_BASE}/install/status`)
            .then(r => r.json())
            .then(data => setInstalled(data.installed))
            .catch(() => setInstalled(false));
    }, []);

    const handleLogin = (userData) => {
        console.log('handleLogin appelé', userData);
        if (userData.premierConnexion) {
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData)); // ← persist
            setMustChangePassword(true);
        } else {
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData)); // ← persist
        }
    };

    const handleLogout = useCallback((raison = '') => {
        setUser(null);
        setMustChangePassword(false);
        localStorage.removeItem('user');  // ← nettoyer
        if (raison === 'desactive') {
            alert('⚠️ Votre compte a été désactivé par l\'administrateur.');
        }
    }, []);

    useInactivityLogout(user, handleLogout);

    // ── Vérification statut compte toutes les 30s ──────────────────────
    useEffect(() => {
        if (!user) return;
        if (user.role === 'SuperAdmin') return;

        const checkStatus = async () => {
            try {
                const res = await fetch(`${API_BASE}/auth/check-status`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (!res.ok) handleLogout('desactive');
            } catch {}
        };

        const timeout = setTimeout(() => {
            checkStatus();
            const interval = setInterval(checkStatus, 30000);
            return () => clearInterval(interval);
        }, 5000);

        return () => clearTimeout(timeout);
    }, [user, handleLogout]);

    if (installed === null) return null;
    if (!installed) return <Install onInstalled={() => setInstalled(true)} />;
    if (mustChangePassword && user) return (
        <ChangePassword user={user} onSuccess={() => setMustChangePassword(false)} />
    );

    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/login"
                    element={user ? <Navigate to="/dashboard" replace /> : <Login onLoginSuccess={handleLogin} />}
                />
                <Route
                    path="/dashboard"
                    element={user ? <Dashboard onLogout={handleLogout} user={user} /> : <Navigate to="/login" replace />}
                />
                <Route
                    path="/forgot-password"
                    element={user ? <Navigate to="/dashboard" replace /> : <ForgotPassword />}
                />
                <Route
                    path="/reset-password"
                    element={<ResetPassword />}
                />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;