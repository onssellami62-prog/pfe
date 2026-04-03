import React from 'react';
import './CompanyProfile.css';

export default function CompanyProfile() {
    // Récupérer l'utilisateur pour extraire le matricule fiscal
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const mf = savedUser.matriculeFiscal || '';
    const companyName = savedUser.entreprise || 'Votre Entreprise';

    // Découpage du Matricule Fiscal (Structure 13 car: 1234567-X-A-M-000)
    const mf7 = mf.length >= 7 ? mf.substring(0, 7) : '';
    const mfCle = mf.length >= 8 ? mf.substring(7, 8) : '';
    const mfCat = mf.length >= 9 ? mf.substring(8, 9) : '';
    const mfCode = mf.length >= 10 ? mf.substring(9, 10) : '';
    const mfBureau = mf.length >= 13 ? mf.substring(10, 13) : '';

    const [companyInfo, setCompanyInfo] = React.useState({
        address: '',
        city: '',
        postalCode: '',
        phone: ''
    });

    React.useEffect(() => {
        if (savedUser.companyId) {
            fetch(`http://localhost:5170/api/Companies/${savedUser.companyId}`)
                .then(res => res.json())
                .then(data => {
                    if (data) {
                        setCompanyInfo({
                            address: data.address || '',
                            city: data.city || '',
                            postalCode: data.postalCode || '',
                            phone: data.phone || ''
                        });
                    }
                })
                .catch(err => console.error("Erreur chargement société:", err));
        }
    }, [savedUser.companyId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCompanyInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!savedUser.companyId) return;
        
        try {
            // On récupère d'abord l'objet complet pour ne pas perdre le Nom et le Matricule lors du PUT
            const res = await fetch(`http://localhost:5170/api/Companies/${savedUser.companyId}`);
            const fullData = await res.json();

            const updatedData = {
                ...fullData,
                address: companyInfo.address,
                city: companyInfo.city,
                postalCode: companyInfo.postalCode,
                phone: companyInfo.phone
            };

            const response = await fetch(`http://localhost:5170/api/Companies/${savedUser.companyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });

            if (response.ok) {
                alert("Modifications enregistrées avec succès !");
            }
        } catch (err) {
            console.error("Erreur lors de la sauvegarde:", err);
            alert("Une erreur est survenue lors de l'enregistrement.");
        }
    };

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
                                <input type="text" defaultValue={companyName} />
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
                                    <input type="text" defaultValue={mf7} />
                                </div>
                                <div className="input-group">
                                    <span className="small-label">CLÉ</span>
                                    <input type="text" defaultValue={mfCle} />
                                </div>
                                <div className="input-group">
                                    <span className="small-label">CAT</span>
                                    <input type="text" defaultValue={mfCat} />
                                </div>
                                <div className="input-group">
                                    <span className="small-label">CODE</span>
                                    <input type="text" defaultValue={mfCode} />
                                </div>
                                <div className="input-group">
                                    <span className="small-label">BUREAU</span>
                                    <input type="text" defaultValue={mfBureau} />
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
                                <label>Adresse</label>
                                <input 
                                    name="address"
                                    type="text" 
                                    value={companyInfo.address} 
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="input-group">
                                <label>Ville</label>
                                <input 
                                    name="city"
                                    type="text" 
                                    value={companyInfo.city} 
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="input-group">
                                <label>Code Postal</label>
                                <input 
                                    name="postalCode"
                                    type="text" 
                                    value={companyInfo.postalCode} 
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="input-group">
                                <label>Téléphone</label>
                                <input 
                                    name="phone"
                                    type="text" 
                                    value={companyInfo.phone} 
                                    onChange={handleChange}
                                />
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
                    <button className="btn-submit" onClick={handleSave}>Enregistrer les modifications</button>
                </footer>
            </div>
        </div>
    );
}
