import React, { useState } from 'react';
import './InvoiceValidator.css';

const InvoiceValidator = ({ invoice, onClose }) => {
  const [validationResult, setValidationResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  React.useEffect(() => {
    setValidationResult(null);
  }, []);

  const analyzeInvoice = async () => {
    setIsAnalyzing(true);
    
    try {
      const invoicePayload = {
        InvoiceNumber: invoice.number,
        DocumentType: invoice.documentType,
        Date: invoice.date,
        ClientId: invoice.clientId,
        ClientName: invoice.clientName,
        ClientMatricule: invoice.clientMatricule,
        ClientRNE: invoice.clientRNE,
        ClientAddress: invoice.clientAddress,
        DueDate: invoice.dueDate,
        PaymentMode: invoice.paymentMode,
        Notes: invoice.notes,
        PeriodFrom: invoice.periodFrom,
        PeriodTo: invoice.periodTo,
        TotalHT: invoice.totals?.ht || 0,
        TotalTVA: invoice.totals?.tva || 0,
        StampDuty: invoice.totals?.stamp || 0,
        TotalTTC: invoice.totals?.ttc || 0,
        Lines: invoice.lines || []
      };

      const response = await fetch('http://localhost:5170/api/Invoices/validate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoicePayload)
      });

      if (response.ok) {
        const result = await response.json();
        setValidationResult(result);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critique': return '#dc2626';
      case 'Majeure': return '#ea580c';
      case 'Mineure': return '#ca8a04';
      default: return '#64748b';
    }
  };

  if (!validationResult && !isAnalyzing) {
    return (
      <div className="validator-initial">
        <div className="validator-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 12l2 2 4-4"></path>
          </svg>
        </div>
        <h3>Analyser la Facture</h3>
        <p>Vérifiez la conformité avant transmission</p>
        <button className="btn-analyze" onClick={analyzeInvoice} disabled={isAnalyzing}>
          {isAnalyzing ? 'Analyse en cours...' : 'Lancer l\'Analyse'}
        </button>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="validator-loading">
        <div className="loading-spinner"></div>
        <p>Analyse en cours...</p>
        <small>Vérification de la conformité TEIF</small>
      </div>
    );
  }

  return (
    <div className="validator-results">
      {/* HEADER SCORE */}
      <div className="results-header">
        <div className="score-main">
          <div className="score-icon" style={{ color: getScoreColor(validationResult.conformityScore) }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {validationResult.conformityScore >= 80 ? (
                <>
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M8 12l2 2 4-4"></path>
                </>
              ) : validationResult.conformityScore >= 60 ? (
                <>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </>
              ) : (
                <>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </>
              )}
            </svg>
          </div>
          <div className="score-value" style={{ color: getScoreColor(validationResult.conformityScore) }}>
            {validationResult.conformityScore}%
          </div>
          <div className="score-label">Conformité</div>
          <div className="score-level">{validationResult.conformityLevel}</div>
        </div>

        <div className="score-bar">
          <div 
            className="score-bar-fill" 
            style={{ 
              width: `${validationResult.conformityScore}%`,
              backgroundColor: getScoreColor(validationResult.conformityScore)
            }}
          ></div>
        </div>

        {/* STATS */}
        <div className="stats-quick">
          <div className="stat-item">
            <span className="stat-label">Total</span>
            <span className="stat-value">{validationResult.totalErrors}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Critiques</span>
            <span className="stat-value critical">{validationResult.criticalErrors}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Majeures</span>
            <span className="stat-value major">{validationResult.majorErrors}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Mineures</span>
            <span className="stat-value minor">{validationResult.minorErrors}</span>
          </div>
        </div>
      </div>

      {/* PREDICTION */}
      <div className="rejection-prediction">
        <div className="prediction-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div className="prediction-content">
          <div className="prediction-title">Prédiction TTN</div>
          <div className="prediction-value">
            Probabilité de rejet : <strong>{(validationResult.rejectionProbability * 100).toFixed(0)}%</strong>
          </div>
          {validationResult.rejectionProbability > 0.5 ? (
            <div className="prediction-warning">Risque élevé - Corrections recommandées</div>
          ) : (
            <div className="prediction-success">Faible risque - Facture conforme</div>
          )}
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="category-scores">
        <h4>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '8px' }}>
            <line x1="12" y1="2" x2="12" y2="22"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          Scores par Catégorie
        </h4>
        <div className="category-grid">
          {Object.entries(validationResult.categoryScores).map(([category, score]) => (
            <div key={category} className="category-item">
              <div className="category-name">{getCategoryLabel(category)}</div>
              <div className="category-score-bar">
                <div 
                  className="category-score-fill"
                  style={{ 
                    width: `${(score / getCategoryMax(category)) * 100}%`,
                    backgroundColor: '#059669'
                  }}
                ></div>
              </div>
              <div className="category-score-text">{score}/{getCategoryMax(category)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ERRORS */}
      {validationResult.errors.length > 0 && (
        <div className="errors-list">
          <h4>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '8px' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            Erreurs Détectées ({validationResult.errors.length})
          </h4>
          {validationResult.errors.map((error, index) => (
            <div key={index} className="error-card" style={{ borderLeftColor: getSeverityColor(error.severity) }}>
              <div className="error-header">
                <span className="error-severity" style={{ color: getSeverityColor(error.severity) }}>
                  {error.severity}
                </span>
                <span className="error-code">{error.code}</span>
                <span className="error-points">-{error.points} pts</span>
              </div>
              <div className="error-field">Champ : <strong>{error.field}</strong></div>
              <div className="error-message">{error.message}</div>
              <div className="error-solution">
                <span className="solution-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <path d="M12 8h.01"></path>
                  </svg>
                </span>
                <span className="solution-text">{error.suggestedSolution}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ACTIONS */}
      <div className="validator-actions">
        {validationResult.conformityScore >= 80 && validationResult.criticalErrors === 0 ? (
          <button className="btn-submit-ready" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '8px' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 12l2 2 4-4"></path>
            </svg>
            Prêt à Soumettre
          </button>
        ) : (
          <button className="btn-fix-errors" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '8px' }}>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Corriger les Erreurs
          </button>
        )}
      </div>
    </div>
  );
};

const getCategoryLabel = (category) => {
  const labels = {
    'DonneesClient': 'Données Client',
    'Montants': 'Montants',
    'TVA': 'TVA',
    'Dates': 'Dates',
    'Lignes': 'Lignes'
  };
  return labels[category] || category;
};

const getCategoryMax = (category) => {
  const maxScores = {
    'DonneesClient': 20,
    'Montants': 25,
    'TVA': 20,
    'Dates': 15,
    'Lignes': 20
  };
  return maxScores[category] || 20;
};

export default InvoiceValidator;
