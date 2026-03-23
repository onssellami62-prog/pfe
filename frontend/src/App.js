import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  // Simule l'authentification sans backend
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        {/* Login — redirect to dashboard if already authenticated */}
        <Route
          path="/login"
          element={
            isAuthenticated
              ? <Navigate to="/dashboard" replace />
              : <Login onLoginSuccess={() => setIsAuthenticated(true)} />
          }
        />

        {/* Dashboard — protected route */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated
              ? <Dashboard onLogout={() => setIsAuthenticated(false)} />
              : <Navigate to="/login" replace />
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
