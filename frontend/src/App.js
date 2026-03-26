import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  // Simule l'authentification sans backend
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
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

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
