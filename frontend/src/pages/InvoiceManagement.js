import React, { useState, useCallback } from 'react';
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
    const [tabVisible, setTabVisible] = useState(true);

    const switchTab = useCallback((tab) => {
        if (tab === activeTab) return;
        setTabVisible(false);
        setTimeout(() => {
            setActiveTab(tab);
            setTabVisible(true);
        }, 150);
    }, [activeTab]);

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
                        onClick={() => switchTab('list')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        Mes Factures
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'depot' ? 'active' : ''}`}
                        onClick={() => switchTab('depot')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        Dépôt de Facture (XML)
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
                        onClick={() => switchTab('create')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Création Manuelle
                    </button>
                </nav>
            </header>

            <div className={`management-content ${tabVisible ? 'tab-enter' : 'tab-exit'}`}>
                {renderTabContent()}
            </div>
        </div>
    );
}
