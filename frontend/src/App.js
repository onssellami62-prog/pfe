import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  // Initialize authentication from localStorage
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Login — redirect based on role if already authenticated */}
        <Route
          path="/login"
          element={
            user
              ? <Navigate to="/dashboard" replace />
              : <Login onLoginSuccess={handleLogin} />
          }
        />

        {/* Dashboard — protected route */}
        <Route
          path="/dashboard"
          element={
            user ? (
              user.role === 'admin' ? (
                <AdminDashboard user={user} onLogout={handleLogout} />
              ) : (
                <Dashboard onLogout={handleLogout} />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Mot de passe oublié */}
        <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
