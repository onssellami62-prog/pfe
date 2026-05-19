import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login           from './pages/Login';
import Dashboard       from './pages/Dashboard';
import ChangePassword  from './pages/Changepassword';
import Install         from './pages/Install';
import ForgotPassword  from './pages/ForgotPassword';
import ResetPassword   from './pages/ResetPassword';
import useInactivityLogout from './hooks/useInactivityLogout';

function App() {
    const [user, setUser]                             = useState(null);
    const [mustChangePassword, setMustChangePassword] = useState(false);
    const [installed, setInstalled]                   = useState(null);

    useEffect(() => {
        fetch('http://localhost:5170/api/install/status')
            .then(r => r.json())
            .then(data => setInstalled(data.installed))
            .catch(() => setInstalled(false));
    }, []);

    const handleLogin = (userData) => {
        if (userData.premierConnexion) {
            setUser(userData);
            setMustChangePassword(true);
        } else {
            setUser(userData);
        }
    };

    const handleLogout = useCallback(() => {
        setUser(null);
        setMustChangePassword(false);
    }, []);

    // ── Déconnexion automatique après 5 min d'inactivité ──────────────
    useInactivityLogout(user, handleLogout);

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