const API_BASE = 'http://localhost:5170/api';
const getToken = () => localStorage.getItem('token');

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`
});

// Auth
export const login = (email, password) =>
  fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, passwordHash: password })
  }).then(r => r.json());

// Factures
export const getFactures = () =>
  fetch(`${API_BASE}/factures`, { headers: headers() }).then(r => r.json());

export const createFacture = (data) =>
  fetch(`${API_BASE}/factures`, {
    method: 'POST', headers: headers(), body: JSON.stringify(data)
  }).then(r => r.json());

// Statistiques
export const getStats = (dateDebut, dateFin) =>
  fetch(`${API_BASE}/statistics?dateDebut=${dateDebut}&dateFin=${dateFin}`, {
    headers: headers()
  }).then(r => r.json());