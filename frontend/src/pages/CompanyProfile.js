import React from 'react';
import './CompanyProfile.css';

export default function CompanyProfile() {
    return (
        <div className="profile-container">
            <div className="profile-sidebar">
                <div className="sidebar-section">
                    <h3>PARAMÈTRES</h3>
                    <nav>
                        <button className="nav-item active">
                            <span className="icon">👤</span> Profil
                        </button>
                        <button className="nav-item">
                            <span className="icon">🛡️</span> Sécurité
                        </button>
                        <button className="nav-item">
                            <span className="icon">🔔</span> Notifications
                        </button>
                        <button className="nav-item">
                            <span className="icon">📜</span> Certificats
                        </button>
                    </nav>
                </div>

                <div className="help-card">
                    <div className="help-icon">ℹ️</div>
                    <h4>Besoin d'aide?</h4>
                    <p>Consultez notre guide de configuration fiscale ou contactez le support.</p>
                    <button className="btn-support">Support Technique</button>
                </div>
            </div>

            <div className="profile-main">
                <header className="profile-header">
                    <h1>Profil de l'Entreprise</h1>
                    <p>Gérez les informations légales, fiscales et les paramètres de signature électronique de votre plateforme.</p>
                </header>

                <div className="profile-sections">
                    {/* Identité de l'Entreprise */}
                    <section className="profile-card">
                        <div className="card-header">
                            <span className="card-icon">🏢</span>
                            <h3>Identité de l'Entreprise</h3>
                        </div>
                        <div className="card-content grid-2">
                            <div className="input-group">
                                <label>Raison Sociale</label>
                                <input type="text" defaultValue="El Fatoora Digital Solutions SARL" />
                            </div>
                            <div className="input-group">
                                <label>Capital Social (DT)</label>
                                <input type="text" defaultValue="50,000" />
                            </div>
                            <div className="input-group full-width">
                                <label>Registre de Commerce (RC)</label>
                                <input type="text" defaultValue="B01234562023" />
                            </div>
                        </div>
                    </section>

                    {/* Informations Fiscales */}
                    <section className="profile-card">
                        <div className="card-header">
                            <span className="card-icon">🏛️</span>
                            <h3>Informations Fiscales</h3>
                        </div>
                        <div className="card-content">
                            <label>Matricule Fiscal (Tunisie)</label>
                            <div className="fiscal-grid">
                                <div className="input-group">
                                    <span className="small-label">7 CHIFFRES</span>
                                    <input type="text" defaultValue="1234567" />
                                </div>
                                <div className="input-group">
                                    <span className="small-label">CLÉ</span>
                                    <input type="text" defaultValue="A" />
                                </div>
                                <div className="input-group">
                                    <span className="small-label">CAT</span>
                                    <input type="text" defaultValue="M" />
                                </div>
                                <div className="input-group">
                                    <span className="small-label">CODE</span>
                                    <input type="text" defaultValue="P" />
                                </div>
                                <div className="input-group">
                                    <span className="small-label">BUREAU</span>
                                    <input type="text" defaultValue="000" />
                                </div>
                            </div>
                            <p className="helper-text">Le format doit correspondre au document d'immatriculation fiscale officiel.</p>
                        </div>
                    </section>

                    {/* Coordonnées */}
                    <section className="profile-card">
                        <div className="card-header">
                            <span className="card-icon">👥</span>
                            <h3>Coordonnées</h3>
                        </div>
                        <div className="card-content grid-2">
                            <div className="input-group full-width">
                                <label>Adresse Siège Social</label>
                                <input type="text" defaultValue="Avenue Habib Bourguiba, Immeuble Horizon" />
                            </div>
                            <div className="input-group">
                                <label>Ville</label>
                                <input type="text" defaultValue="Tunis" />
                            </div>
                            <div className="input-group">
                                <label>Code Postal</label>
                                <input type="text" defaultValue="1000" />
                            </div>
                            <div className="input-group">
                                <label>Téléphone</label>
                                <input type="text" defaultValue="+216 71 123 456" />
                            </div>
                            <div className="input-group">
                                <label>Email Administratif</label>
                                <input type="email" defaultValue="contact@elfatoora.tn" />
                            </div>
                        </div>
                    </section>

                    {/* Signature Électronique */}
                    <section className="profile-card">
                        <div className="card-header">
                            <div className="header-left">
                                <span className="card-icon">🖋️</span>
                                <h3>Signature Électronique</h3>
                            </div>
                            <span className="badge-active">● Certificat Actif</span>
                        </div>
                        <div className="card-content">
                            <div className="upload-box">
                                <div className="upload-icon">📄</div>
                                <h4>Mettre à jour le certificat</h4>
                                <p>Importez votre fichier .p12 ou connectez votre Digigo</p>
                                <div className="button-row">
                                    <button className="btn-primary">Charger P12</button>
                                    <button className="btn-outline">Lier Digigo</button>
                                </div>
                            </div>
                            <div className="cert-info">
                                <span className="icon">🛡️</span>
                                <div className="cert-details">
                                    <span className="cert-id">Certificat ID: TN-EL-2023-FATOORA</span>
                                    <span className="cert-expiry">Expire le: 12 Décembre 2024 • Délivré par: ANCE Tunisia</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <footer className="form-footer">
                    <button className="btn-link">Annuler</button>
                    <button className="btn-submit">Enregistrer les modifications</button>
                </footer>
            </div>
        </div>
    );
}
