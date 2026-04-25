import './MyInvoices.css';
import InvoicePreviewModal from './InvoicePreviewModal';

const Icons = {
    Search: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    Calendar: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    ),
    Folder: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    ),
    Check: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    Clock: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    Eye: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    More: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
        </svg>
    ),
    Info: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    ),
    Print: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
        </svg>
    ),
    Download: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    )
};

const INVOICE_DATA = [
    { date: '24 Mai 2024', id: 'FAC-2024-0582', client: 'Pharmacie Centrale', amount: '1,245.500', status: 'Validé' },
    { date: '22 Mai 2024', id: 'FAC-2024-0581', client: 'SOCIETE TUNISIE TELECOM', amount: '4,820.000', status: 'En cours' },
    { date: '20 Mai 2024', id: 'FAC-2024-0580', client: 'Clinique El Amen', amount: '850.000', status: 'Rejetée' },
    { date: '18 Mai 2024', id: 'FAC-2024-0579', client: 'STE CARTHAGE CEMENT', amount: '12,600.000', status: 'Validé' },
    { date: '15 Mai 2024', id: 'FAC-2024-0578', client: 'COOPERATIVE EL BARAKA', amount: '2,300.200', status: 'Validé' },
];

export default function MyInvoices({ onNewInvoice }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tous les statuts');
    const [companyLogo, setCompanyLogo] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
 
    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        if (!user.companyId) return;
        fetch(`http://localhost:5170/api/Companies/${user.companyId}`)
            .then(r => r.json())
            .then(data => {
                if (data?.logoPath) setCompanyLogo(`http://localhost:5170/${data.logoPath}`);
            })
            .catch(() => {});
    }, []);

    const closeModal = () => setSelectedInvoice(null);

    const filteredData = INVOICE_DATA.filter(item => {
        const matchesSearch =
            item.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
            statusFilter === 'Tous les statuts' ||
            item.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="invoices-page">
            <header className="page-top-header">
                <div className="header-left">
                    <h1>Mes Factures</h1>
                    <div className="search-bar">
                        <span className="search-icon"><Icons.Search /></span>
                        <input
                            type="text"
                            placeholder="Rechercher une facture..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="header-actions">
                    <select
                        className="filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option>Tous les statuts</option>
                        <option>Validé</option>
                        <option>En cours</option>
                        <option>Rejetée</option>
                    </select>
                    <div className="date-range">
                        <span className="calendar-icon"><Icons.Calendar /></span>
                        01 Mai - 31 Mai 2024
                    </div>
                    <button className="btn-new-invoice" onClick={onNewInvoice}>
                        + Nouvelle Facture
                    </button>
                </div>
            </header>

            <div className="invoice-summary-grid">
                <div className="summary-card">
                    <div className="summary-icon blue"><Icons.Folder /></div>
                    <div className="summary-text">
                        <span className="label">TOTAL FACTURES</span>
                        <span className="value">128</span>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon green"><Icons.Check /></div>
                    <div className="summary-text">
                        <span className="label">MONTANT VALIDÉ</span>
                        <span className="value">53,430.400 <small>DT</small></span>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon orange"><Icons.Clock /></div>
                    <div className="summary-text">
                        <span className="label">MONTANT EN COURS</span>
                        <span className="value">8,120.000 <small>DT</small></span>
                    </div>
                </div>
            </div>

            <div className="table-container">
                <table className="invoices-table">
                    <thead>
                        <tr>
                            <th>Référence</th>
                            <th>Client</th>
                            <th>Date d'émission</th>
                            <th>Montant TTC</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((item, index) => (
                            <tr key={index}>
                                <td><span className="invoice-ref">{item.id}</span></td>
                                <td>
                                    <div className="client-cell">
                                        <span className="client-avatar">{item.client ? item.client.charAt(0) : '?'}</span>
                                        <span>{item.client}</span>
                                    </div>
                                </td>
                                <td className="date-val">{item.date}</td>
                                <td><span className="amount-val">{item.amount}</span></td>
                                <td>
                                    <span className={`status-pill ${item.status.toLowerCase().replace(' ', '-')}`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="icon-btn" onClick={() => setSelectedInvoice(item)}>
                                            <Icons.Eye />
                                        </button>
                                        <button className="icon-btn"><Icons.More /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredData.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                    Aucune facture ne correspond à votre recherche.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div className="table-footer">
                    <span className="results-count">Affichage de 1-{filteredData.length} sur {INVOICE_DATA.length} factures</span>
                    <div className="pagination">
                        <button className="btn-pagination">Précédent</button>
                        <button className="btn-pagination active">Suivant</button>
                    </div>
                </div>
            </div>

            <div className="export-hint">
                <div className="hint-icon"><Icons.Info /></div>
                <div className="hint-content">
                    <h4>Exportations</h4>
                    <p>
                        Vous pouvez exporter la liste filtrée au format Excel ou PDF.
                        Cliquez sur le menu "Actions" d'une facture spécifique pour télécharger son fichier XML conforme à la réglementation fiscale tunisienne.
                    </p>
                </div>
            </div>

            <InvoicePreviewModal 
                isOpen={!!selectedInvoice}
                onClose={closeModal}
                invoice={selectedInvoice ? {
                    invoiceNumber: selectedInvoice.id,
                    date: selectedInvoice.date,
                    clientName: selectedInvoice.client,
                    totalTTC: selectedInvoice.amount.replace(',', ''),
                    totalHT: (parseFloat(selectedInvoice.amount.replace(',', '')) * 0.8).toFixed(3),
                    totalTVA: (parseFloat(selectedInvoice.amount.replace(',', '')) * 0.19).toFixed(3),
                    stampDuty: 1.000,
                    lines: [{ description: 'Services de Facturation', qty: 1, unitPriceHT: (parseFloat(selectedInvoice.amount.replace(',', '')) * 0.8).toFixed(3), totalHT: (parseFloat(selectedInvoice.amount.replace(',', '')) * 0.8).toFixed(3) }]
                } : null}
                user={{ ...JSON.parse(sessionStorage.getItem('user') || '{}'), logo: companyLogo }}
            />
        </div>
    );
}
