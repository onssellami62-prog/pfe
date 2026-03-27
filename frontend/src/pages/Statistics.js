import React from 'react';
import './Statistics.css';

export default function Statistics() {
    return (
        <div className="stats-page">
            <header className="stats-header">
                <div className="header-info">
                    <h1>Tableau de Bord Statistique</h1>
                    <p>Analysez les performances de votre facturation électronique</p>
                </div>
                <div className="header-controls">
                    <div className="filter-group">
                        <button className="filter-btn active">30 derniers jours</button>
                        <button className="filter-btn">Année en cours</button>
                        <button className="filter-btn">Personnalisé</button>
                    </div>
                    <button className="btn-export">
                        <span className="icon">📥</span> Exporter PDF
                    </button>
                </div>
            </header>

            <div className="stats-kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-top">
                        <div className="kpi-icon blue">💰</div>
                        <span className="trend positive">📈 +12%</span>
                    </div>
                    <div className="kpi-content">
                        <span className="label">Chiffre d'Affaires Global</span>
                        <div className="value">145 280,500 <small>DT</small></div>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-top">
                        <div className="kpi-icon green">📄</div>
                        <span className="trend positive">📈 +5.2%</span>
                    </div>
                    <div className="kpi-content">
                        <span className="label">Volume de Factures</span>
                        <div className="value">1,248</div>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-top">
                        <div className="kpi-icon indigo">🏛️</div>
                        <span className="trend neutral"> Stable</span>
                    </div>
                    <div className="kpi-content">
                        <span className="label">TVA Collectée Totale</span>
                        <div className="value">27 603,295 <small>DT</small></div>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-top">
                        <div className="kpi-icon orange">🎫</div>
                        <span className="trend negative">📉 -0.5%</span>
                    </div>
                    <div className="kpi-content">
                        <span className="label">Droit de Timbre Cumulé</span>
                        <div className="value">1 248,000 <small>DT</small></div>
                    </div>
                </div>
            </div>

            <div className="stats-main-grid">
                <div className="stats-chart-card evolution-card">
                    <div className="card-header">
                        <h3>📈 Évolution mensuelle du CA</h3>
                        <div className="chart-legend">
                            <span className="legend-item"><span className="dot current"></span> 2024</span>
                            <span className="legend-item"><span className="dot past"></span> 2023</span>
                        </div>
                    </div>
                    <div className="chart-placeholder">
                        <svg viewBox="0 0 800 200" className="line-chart">
                            <path d="M0,150 Q50,140 100,160 T200,120 T300,140 T400,100 T500,110 T600,80 T700,50 T800,80" fill="none" stroke="#1a56db" strokeWidth="3" />
                            <path d="M0,150 Q50,140 100,160 T200,120 T300,140 T400,100 T500,110 T600,80 T700,50 T800,80 L800,200 L0,200 Z" fill="url(#grad1)" opacity="0.1" />
                            <defs>
                                <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#1a56db" />
                                    <stop offset="100%" stopColor="transparent" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="x-axis">
                            <span>JAN</span><span>FÉV</span><span>MAR</span><span>AVR</span><span>MAI</span><span>JUIN</span><span>JUIL</span><span>AOÛT</span><span>SEPT</span><span>OCT</span><span>NOV</span><span>DÉC</span>
                        </div>
                    </div>
                </div>

                <div className="stats-chart-card distribution-card">
                    <div className="card-header">
                        <h3>📊 Répartition par Taux TVA</h3>
                    </div>
                    <div className="distribution-content">
                        <div className="donut-chart">
                            <svg viewBox="0 0 36 36" className="circular-chart">
                                <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                <path className="circle" strokeDasharray="60, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" stroke="#1a56db" />
                                <path className="circle" strokeDasharray="25, 100" strokeDashoffset="-60" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" stroke="#10b981" />
                                <path className="circle" strokeDasharray="15, 100" strokeDashoffset="-85" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" stroke="#8b5cf6" />
                                <text x="18" y="20.35" className="percentage">100%</text>
                                <text x="18" y="24" className="chart-label">TOTAL TVA</text>
                            </svg>
                        </div>
                        <div className="legend-list">
                            <div className="legend-item"><span className="dot blue"></span> Taux 19% <strong>60%</strong></div>
                            <div className="legend-item"><span className="dot green"></span> Taux 13% <strong>25%</strong></div>
                            <div className="legend-item"><span className="dot purple"></span> Taux 7% <strong>15%</strong></div>
                        </div>
                    </div>
                </div>

                <div className="stats-chart-card sales-card">
                    <div className="card-header">
                        <h3>📊 Ventes par mois</h3>
                        <span className="date-range">Jan 2024 - Juin 2024</span>
                    </div>
                    <div className="bar-chart">
                        <div className="bar-container">
                            <div className="bar" style={{ height: '40%' }}><div className="bar-top"></div></div>
                            <span>JAN</span>
                        </div>
                        <div className="bar-container">
                            <div className="bar" style={{ height: '60%' }}><div className="bar-top"></div></div>
                            <span>FÉB</span>
                        </div>
                        <div className="bar-container">
                            <div className="bar" style={{ height: '45%' }}><div className="bar-top"></div></div>
                            <span>MAR</span>
                        </div>
                        <div className="bar-container">
                            <div className="bar active" style={{ height: '85%' }}><div className="bar-top"></div></div>
                            <span>APR</span>
                        </div>
                        <div className="bar-container">
                            <div className="bar" style={{ height: '50%' }}><div className="bar-top"></div></div>
                            <span>MAY</span>
                        </div>
                        <div className="bar-container">
                            <div className="bar" style={{ height: '70%' }}><div className="bar-top"></div></div>
                            <span>JUN</span>
                        </div>
                    </div>
                </div>

                <div className="stats-chart-card clients-card">
                    <div className="card-header">
                        <h3>⭐ Top 5 Clients par Revenu</h3>
                    </div>
                    <table className="clients-table">
                        <thead>
                            <tr>
                                <th>CLIENT</th>
                                <th>FACTURES</th>
                                <th>CA TOTAL (DT)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><div className="client-cell"><span className="avatar">BT</span> Banque de Tunisie</div></td>
                                <td>45</td>
                                <td className="font-bold">42 500,000</td>
                            </tr>
                            <tr>
                                <td><div className="client-cell"><span className="avatar tt">TT</span> Tunisie Telecom</div></td>
                                <td>32</td>
                                <td className="font-bold">38 240,000</td>
                            </tr>
                            <tr>
                                <td><div className="client-cell"><span className="avatar of">OF</span> Ooredoo France</div></td>
                                <td>18</td>
                                <td className="font-bold">25 100,000</td>
                            </tr>
                            <tr>
                                <td><div className="client-cell"><span className="avatar sf">SF</span> SFBT Tunisie</div></td>
                                <td>22</td>
                                <td className="font-bold">18 900,000</td>
                            </tr>
                            <tr>
                                <td><div className="client-cell"><span className="avatar ab">AM</span> Amen Bank</div></td>
                                <td>14</td>
                                <td className="font-bold">15 600,000</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <footer className="stats-footer">
                <p>© 2024 El Fatoora - Plateforme de facturation électronique certifiée. Données synchronisées en temps réel avec les services fiscaux.</p>
            </footer>
        </div>
    );
}
