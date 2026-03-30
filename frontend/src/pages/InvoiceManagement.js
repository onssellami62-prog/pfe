import React, { useState } from 'react';
import ImportInvoice from './ImportInvoice';
import CreateInvoice from './CreateInvoice';
import InvoiceLists from './InvoiceLists';
import './InvoiceManagement.css';

/**
 * InvoiceManagement - Unified view for all invoice operations
 * It combines Landing, Creation, and Listing of invoices as requested.
 */
export default function InvoiceManagement({ onDiagnostic }) {
    // We default to 'list' as requested by the description
    const [activeTab, setActiveTab] = useState('list');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'depot':
                return <ImportInvoice />;
            case 'create':
                return <CreateInvoice />;
            case 'list':
            default:
                // We use InvoiceLists here because it's more feature-rich and supports "Voir l'erreur"
                return (
                    <InvoiceLists 
                        initialFilter="validated" 
                        onErrorClick={onDiagnostic} 
                    />
                );
        }
    };

    return (
        <div className="invoice-management-container">
            <header className="management-header">
                <h1>Gestion des Factures</h1>
                <nav className="management-tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
                        onClick={() => setActiveTab('list')}
                    >
                        <span className="tab-icon">📄</span>
                        Mes Factures
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'depot' ? 'active' : ''}`}
                        onClick={() => setActiveTab('depot')}
                    >
                        <span className="tab-icon">📤</span>
                        Dépôt de Facture (XML)
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
                        onClick={() => setActiveTab('create')}
                    >
                        <span className="tab-icon">✍️</span>
                        Création Manuelle
                    </button>
                </nav>
            </header>
            
            <div className="management-content">
                {renderTabContent()}
            </div>
        </div>
    );
}
