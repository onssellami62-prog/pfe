import React, { useState, useEffect, useCallback } from 'react';
import './ClientsProducts.css';
import { validateMatriculeFiscal, getMatriculeError, normalizeMatricule, MF_FORMAT_DISPLAY } from '../utils/matriculeValidator';

const API = 'http://localhost:5170/api';

const UNITS = ['Pièce', 'Heure', 'Jour', 'KG', 'Litre', 'Forfait'];
const TVA_RATES = [0, 7, 13, 19];

export default function ClientsProducts() {
  const [activeTab, setActiveTab] = useState('clients'); // 'clients' | 'products'
  const [companyId, setCompanyId] = useState(null);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false); // false = create, true = edit
  const [currentItem, setCurrentItem] = useState(null);

  // Form state
  const [clientForm, setClientForm] = useState({ name: '', matriculeFiscal: '', address: '', city: '', phone: '' });
  const [productForm, setProductForm] = useState({ name: '', description: '', unit: 'Pièce', tvaRate: 19, defaultPrice: '' });
  const [mfError, setMfError] = useState(null); // validation error for matricule fiscal

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.companyId) {
      setCompanyId(user.companyId);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/Clients?companyId=${companyId}`);
      const data = await res.json();
      setClients(data);
    } catch {
      showToast('Erreur lors du chargement des clients', 'error');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const fetchProducts = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/Products?companyId=${companyId}`);
      const data = await res.json();
      setProducts(data);
    } catch {
      showToast('Erreur lors du chargement des produits', 'error');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) {
      fetchClients();
      fetchProducts();
    }
  }, [companyId, fetchClients, fetchProducts]);

  const openCreateModal = () => {
    setEditMode(false);
    setCurrentItem(null);
    setClientForm({ name: '', matriculeFiscal: '', address: '', city: '', phone: '' });
    setProductForm({ name: '', description: '', unit: 'Pièce', tvaRate: 19, defaultPrice: '' });
    setMfError(null);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditMode(true);
    setCurrentItem(item);
    setMfError(null);
    if (activeTab === 'clients') {
      setClientForm({
        name: item.name || '',
        matriculeFiscal: item.matriculeFiscal || '',
        address: item.address || '',
        city: item.city || '',
        phone: item.phone || '',
      });
    } else {
      setProductForm({
        name: item.name || '',
        description: item.description || '',
        unit: item.unit || 'Pièce',
        tvaRate: item.tvaRate ?? 19,
        defaultPrice: item.defaultPrice || '',
      });
    }
    setShowModal(true);
  };

  const handleMatriculeChange = (value) => {
    const normalized = normalizeMatricule(value);
    setClientForm(prev => ({ ...prev, matriculeFiscal: normalized }));
    if (normalized.length > 0) {
      setMfError(getMatriculeError(normalized));
    } else {
      setMfError(null);
    }
  };

  const handleSaveClient = async () => {
    if (!clientForm.name.trim()) return showToast('Le nom est obligatoire', 'error');

    // Validation format matricule fiscal
    const mf = normalizeMatricule(clientForm.matriculeFiscal);
    const mfErr = getMatriculeError(mf);
    if (mfErr) {
      setMfError(mfErr);
      return showToast(mfErr, 'error');
    }

    const payload = { ...clientForm, matriculeFiscal: mf, companyId };
    const url = editMode ? `${API}/Clients/${currentItem.id}` : `${API}/Clients`;
    const method = editMode ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.text();
        return showToast(err || 'Erreur serveur', 'error');
      }
      showToast(editMode ? 'Client modifié ✓' : 'Client ajouté ✓');
      setShowModal(false);
      setMfError(null);
      fetchClients();
    } catch {
      showToast('Erreur de connexion', 'error');
    }
  };

  const handleSaveProduct = async () => {
    if (!productForm.name.trim()) return showToast('Le nom est obligatoire', 'error');

    const payload = {
      ...productForm,
      tvaRate: parseInt(productForm.tvaRate),
      defaultPrice: parseFloat(productForm.defaultPrice) || 0,
      companyId,
    };
    const url = editMode ? `${API}/Products/${currentItem.id}` : `${API}/Products`;
    const method = editMode ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.text();
        return showToast(err || 'Erreur serveur', 'error');
      }
      showToast(editMode ? 'Produit modifié ✓' : 'Produit ajouté ✓');
      setShowModal(false);
      fetchProducts();
    } catch {
      showToast('Erreur de connexion', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    const url = activeTab === 'clients' ? `${API}/Clients/${id}` : `${API}/Products/${id}`;
    try {
      await fetch(url, { method: 'DELETE' });
      showToast('Supprimé avec succès ✓');
      activeTab === 'clients' ? fetchClients() : fetchProducts();
    } catch {
      showToast('Erreur de suppression', 'error');
    }
  };

  return (
    <div className="cp-container">
      {/* Toast */}
      {toast && (
        <div className={`cp-toast cp-toast--${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="cp-header">
        <div>
          <h1 className="cp-title">Référentiel</h1>
          <p className="cp-subtitle">Gérez vos clients et votre catalogue produits</p>
        </div>
        <button className="cp-btn-primary" onClick={openCreateModal}>
          + {activeTab === 'clients' ? 'Nouveau Client' : 'Nouveau Produit'}
        </button>
      </div>

      {/* Tabs */}
      <div className="cp-tabs">
        <button
          className={`cp-tab ${activeTab === 'clients' ? 'cp-tab--active' : ''}`}
          onClick={() => setActiveTab('clients')}
        >
          <span className="cp-tab-icon">👤</span>
          Clients
          <span className="cp-badge">{clients.length}</span>
        </button>
        <button
          className={`cp-tab ${activeTab === 'products' ? 'cp-tab--active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <span className="cp-tab-icon">📦</span>
          Produits & Services
          <span className="cp-badge">{products.length}</span>
        </button>
      </div>

      {/* Content */}
      <div className="cp-content">
        {loading ? (
          <div className="cp-loading">
            <div className="cp-spinner"></div>
            <p>Chargement...</p>
          </div>
        ) : activeTab === 'clients' ? (
          clients.length === 0 ? (
            <div className="cp-empty">
              <div className="cp-empty-icon">👤</div>
              <h3>Aucun client enregistré</h3>
              <p>Ajoutez vos clients avec leur matricule fiscal pour les utiliser dans vos factures.</p>
              <button className="cp-btn-primary" onClick={openCreateModal}>+ Ajouter un client</button>
            </div>
          ) : (
            <div className="cp-table-wrapper">
              <table className="cp-table">
                <thead>
                  <tr>
                    <th>Nom Client</th>
                    <th>Matricule Fiscal</th>
                    <th>Ville</th>
                    <th>Téléphone</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(c => (
                    <tr key={c.id} className="cp-table-row">
                      <td>
                        <div className="cp-cell-main">{c.name}</div>
                        <div className="cp-cell-sub">{c.address}</div>
                      </td>
                      <td><span className="cp-mono">{c.matriculeFiscal}</span></td>
                      <td>{c.city || '—'}</td>
                      <td>{c.phone || '—'}</td>
                      <td>
                        <div className="cp-actions">
                          <button className="cp-btn-icon cp-btn-edit" onClick={() => openEditModal(c)} title="Modifier">✏️</button>
                          <button className="cp-btn-icon cp-btn-delete" onClick={() => handleDelete(c.id)} title="Supprimer">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          products.length === 0 ? (
            <div className="cp-empty">
              <div className="cp-empty-icon">📦</div>
              <h3>Aucun produit enregistré</h3>
              <p>Créez votre catalogue de produits et services pour les insérer rapidement dans vos factures.</p>
              <button className="cp-btn-primary" onClick={openCreateModal}>+ Ajouter un produit</button>
            </div>
          ) : (
            <div className="cp-table-wrapper">
              <table className="cp-table">
                <thead>
                  <tr>
                    <th>Produit / Service</th>
                    <th>Unité</th>
                    <th>TVA</th>
                    <th>Prix HT (DT)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="cp-table-row">
                      <td>
                        <div className="cp-cell-main">{p.name}</div>
                        <div className="cp-cell-sub">{p.description}</div>
                      </td>
                      <td><span className="cp-tag">{p.unit}</span></td>
                      <td><span className="cp-tag cp-tag--tva">{p.tvaRate}%</span></td>
                      <td><span className="cp-price">{parseFloat(p.defaultPrice).toFixed(3)}</span></td>
                      <td>
                        <div className="cp-actions">
                          <button className="cp-btn-icon cp-btn-edit" onClick={() => openEditModal(p)} title="Modifier">✏️</button>
                          <button className="cp-btn-icon cp-btn-delete" onClick={() => handleDelete(p.id)} title="Supprimer">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="cp-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="cp-modal">
            <div className="cp-modal-header">
              <h2 className="cp-modal-title">
                {editMode ? 'Modifier' : 'Nouveau'} {activeTab === 'clients' ? 'Client' : 'Produit'}
              </h2>
              <button className="cp-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="cp-modal-body">
              {activeTab === 'clients' ? (
                <div className="cp-form">
                  <div className="cp-form-group">
                    <label>Nom du client *</label>
                    <input
                      type="text"
                      placeholder="Ex: Société ABC"
                      value={clientForm.name}
                      onChange={e => setClientForm({ ...clientForm, name: e.target.value })}
                    />
                  </div>
                  <div className="cp-form-group">
                    <label>Matricule Fiscal * <span className="cp-mf-format">{MF_FORMAT_DISPLAY}</span></label>
                    <input
                      type="text"
                      placeholder="1234567A/A/M/000"
                      className={`cp-mono-input ${clientForm.matriculeFiscal && validateMatriculeFiscal(clientForm.matriculeFiscal) ? 'cp-input-valid' : ''} ${mfError ? 'cp-input-error' : ''}`}
                      value={clientForm.matriculeFiscal}
                      onChange={e => handleMatriculeChange(e.target.value)}
                      maxLength={15}
                    />
                    {mfError && <span className="cp-field-error">⚠ {mfError}</span>}
                    {clientForm.matriculeFiscal && validateMatriculeFiscal(clientForm.matriculeFiscal) && (
                      <span className="cp-field-ok">✓ Format valide</span>
                    )}
                  </div>
                  <div className="cp-form-group">
                    <label>Adresse</label>
                    <input
                      type="text"
                      placeholder="Adresse complète"
                      value={clientForm.address}
                      onChange={e => setClientForm({ ...clientForm, address: e.target.value })}
                    />
                  </div>
                  <div className="cp-form-row">
                    <div className="cp-form-group">
                      <label>Ville</label>
                      <input
                        type="text"
                        placeholder="Tunis"
                        value={clientForm.city}
                        onChange={e => setClientForm({ ...clientForm, city: e.target.value })}
                      />
                    </div>
                    <div className="cp-form-group">
                      <label>Téléphone</label>
                      <input
                        type="text"
                        placeholder="+216 XX XXX XXX"
                        value={clientForm.phone}
                        onChange={e => setClientForm({ ...clientForm, phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="cp-form">
                  <div className="cp-form-group">
                    <label>Nom du produit / service *</label>
                    <input
                      type="text"
                      placeholder="Ex: Consultation IT"
                      value={productForm.name}
                      onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                    />
                  </div>
                  <div className="cp-form-group">
                    <label>Description</label>
                    <input
                      type="text"
                      placeholder="Description courte (optionnel)"
                      value={productForm.description}
                      onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                    />
                  </div>
                  <div className="cp-form-row">
                    <div className="cp-form-group">
                      <label>Unité</label>
                      <select value={productForm.unit} onChange={e => setProductForm({ ...productForm, unit: e.target.value })}>
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="cp-form-group">
                      <label>Taux TVA</label>
                      <select value={productForm.tvaRate} onChange={e => setProductForm({ ...productForm, tvaRate: parseInt(e.target.value) })}>
                        {TVA_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="cp-form-group">
                    <label>Prix unitaire HT (DT)</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="0.000"
                      value={productForm.defaultPrice}
                      onChange={e => setProductForm({ ...productForm, defaultPrice: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="cp-modal-footer">
              <button className="cp-btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
              <button
                className="cp-btn-primary"
                onClick={activeTab === 'clients' ? handleSaveClient : handleSaveProduct}
              >
                {editMode ? 'Enregistrer les modifications' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
