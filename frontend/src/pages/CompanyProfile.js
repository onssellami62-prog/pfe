import React from 'react';
import './CompanyProfile.css';

const Icons = {
    User: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    ),
    Shield: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    ),
    Bell: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    ),
    Scroll: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
    ),
    Info: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    ),
    Building: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
            <line x1="9" y1="22" x2="9" y2="18" />
            <line x1="15" y1="22" x2="15" y2="18" />
            <line x1="18" y1="18" x2="18" y2="18" />
            <line x1="6" y1="18" x2="6" y2="18" />
            <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
        </svg>
    ),
    Institution: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18" />
            <path d="M3 7l9-4 9 4" />
            <path d="M5 21V7" />
            <path d="M19 21V7" />
            <path d="M9 21v-4" />
            <path d="M15 21v-4" />
            <path d="M2 17h20" />
            <path d="M10 21v-4" />
        </svg>
    ),
    Users: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    Pen: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
    ),
    File: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    )
};

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
    const [logoUrl, setLogoUrl] = React.useState(null);
    const [logoUploading, setLogoUploading] = React.useState(false);
    const [editableCompanyName, setEditableCompanyName] = React.useState(companyName);

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
                        if (data.logoPath) {
                            setLogoUrl(`http://localhost:5170/${data.logoPath}`);
                        }
                    }
                })
                .catch(err => console.error("Erreur chargement société:", err));
        }
    }, [savedUser.companyId]);

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !savedUser.companyId) return;
        setLogoUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch(`http://localhost:5170/api/Companies/${savedUser.companyId}/logo`, {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                setLogoUrl(`http://localhost:5170/${data.logoUrl}?t=${Date.now()}`);
            } else {
                const err = await res.text();
                alert(err || 'Erreur lors de l\'upload du logo.');
            }
        } catch (err) {
            console.error('Erreur upload logo:', err);
        }
        setLogoUploading(false);
    };

    const handleLogoDelete = async () => {
        if (!savedUser.companyId) return;
        if (!window.confirm('Supprimer le logo ?')) return;
        try {
            await fetch(`http://localhost:5170/api/Companies/${savedUser.companyId}/logo`, { method: 'DELETE' });
            setLogoUrl(null);
        } catch (err) {
            console.error('Erreur suppression logo:', err);
        }
    };

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
                name: editableCompanyName,
                address: companyInfo.address,
                city: companyInfo.city,
                postalCode: companyInfo.postalCode,
                phone: companyInfo.phone
            };

            const response = await fetch(`http://localhost:5170/api/Companies/${savedUser.companyId}?userId=${savedUser.userId || ''}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });

            if (response.ok) {
                const updated = { ...savedUser, entreprise: editableCompanyName };
                localStorage.setItem('user', JSON.stringify(updated));
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
                            <span className="icon"><Icons.User /></span> Profil
                        </button>
                        <button className="nav-item">
                            <span className="icon"><Icons.Shield /></span> Sécurité
                        </button>
                        <button className="nav-item">
                            <span className="icon"><Icons.Bell /></span> Notifications
                        </button>
                        <button className="nav-item">
                            <span className="icon"><Icons.Scroll /></span> Certificats
                        </button>
                    </nav>
                </div>

                <div className="help-card">
                    <div className="help-icon"><Icons.Info /></div>
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
                    {/* Logo de l'Entreprise */}
                    <section className="profile-card">
                        <div className="card-header">
                            <span className="card-icon"><Icons.File /></span>
                            <h3>Logo de l'Entreprise</h3>
                        </div>
                        <div className="card-content">
                            <div className="logo-upload-zone">
                                {logoUrl ? (
                                    <div className="logo-preview-wrapper">
                                        <img src={logoUrl} alt="Logo" className="company-logo-preview" />
                                        <div className="logo-actions">
                                            <label className="btn-outline logo-btn">
                                                Changer
                                                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoUpload} hidden />
                                            </label>
                                            <button className="btn-outline logo-btn danger" onClick={handleLogoDelete}>Supprimer</button>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="logo-dropzone">
                                        <div className="dropzone-content">
                                            <Icons.File />
                                            <h4>{logoUploading ? 'Upload en cours...' : 'Ajouter un logo'}</h4>
                                            <p>PNG, JPG ou WEBP — max 2 Mo</p>
                                        </div>
                                        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoUpload} hidden />
                                    </label>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Identité de l'Entreprise */}
                    <section className="profile-card">
                        <div className="card-header">
                            <span className="card-icon"><Icons.Building /></span>
                            <h3>Identité de l'Entreprise</h3>
                        </div>
                        <div className="card-content">
                            <div className="input-group">
                                <label>Nom de la Societe</label>
                                <input type="text" value={editableCompanyName} onChange={(e) => setEditableCompanyName(e.target.value)} />
                            </div>
                        </div>
                    </section>

                    {/* Informations Fiscales */}
                    <section className="profile-card">
                        <div className="card-header">
                            <span className="card-icon"><Icons.Institution /></span>
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
                            <span className="card-icon"><Icons.Users /></span>
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
                                <span className="card-icon"><Icons.Pen /></span>
                                <h3>Signature Électronique</h3>
                            </div>
                            <span className="badge-active">● Certificat Actif</span>
                        </div>
                        <div className="card-content">
                            <div className="upload-box">
                                <div className="upload-icon"><Icons.File /></div>
                                <h4>Mettre à jour le certificat</h4>
                                <p>Importez votre fichier .p12 ou connectez votre Digigo</p>
                                <div className="button-row">
                                    <button className="btn-primary">Charger P12</button>
                                    <button className="btn-outline">Lier Digigo</button>
                                </div>
                            </div>
                            <div className="cert-info">
                                <span className="icon"><Icons.Shield /></span>
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
