import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login          from './pages/Login';
import Dashboard      from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import ChangePassword from './pages/Changepassword';
import Install        from './pages/Install';

function App() {
    const [user, setUser]                       = useState(null);
    const [mustChangePassword, setMustChangePassword] = useState(false);
    const [installed, setInstalled]             = useState(null);

    // Vérifier au démarrage si installation nécessaire
    useEffect(() => {
        fetch('http://localhost:5170/api/install/status')
            .then(r => r.json())
            .then(data => setInstalled(data.installed))
            .catch(() => setInstalled(true));
    }, []);

    const handleLogin = (userData) => {
        if (userData.premierConnexion) {
            setUser(userData);
            setMustChangePassword(true);
        } else {
            setUser(userData);
        }
    };

    const handleLogout = () => {
        setUser(null);
        setMustChangePassword(false);
    };

    // Chargement
    if (installed === null) return null;

    // Page d'installation (première fois)
    if (!installed) return <Install onInstalled={() => setInstalled(true)} />;

    // Page changement de mot de passe (première connexion)
    if (mustChangePassword && user) return (
        <ChangePassword
            user={user}
            onSuccess={() => setMustChangePassword(false)}
        />
    );

    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/login"
                    element={
                        user
                            ? <Navigate to="/dashboard" replace />
                            : <Login onLoginSuccess={handleLogin} />
                    }
                />
                <Route
                    path="/dashboard"
                    element={
                        user ? (
                            user.role === 'SuperAdmin' || user.role === 'Admin' ? (
                                <Dashboard onLogout={handleLogout} user={user} />
                            ) : (
                                <AdminDashboard user={user} onLogout={handleLogout} />
                            )
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;