import { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Wand2,
  HelpCircle,
  Smartphone
} from 'lucide-react';

export default function SafariIssuesPanel({
  diagnostics = [],
  isDiagnosing,
  onRunDiagnostics,
  onApplyFix
}) {
  const [filterCategory, setFilterCategory] = useState('all');

  const filtered = diagnostics.filter((item) => {
    if (filterCategory === 'all') return true;
    return item.category === filterCategory;
  });

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error':
        return <AlertCircle size={16} className="diag-icon-error" />;
      case 'warning':
        return <AlertTriangle size={16} className="diag-icon-warning" />;
      case 'info':
      default:
        return <Info size={16} className="diag-icon-info" />;
    }
  };

  const getCategoryClass = (category) => {
    switch (category) {
      case 'Confirmed Error':
        return 'cat-error';
      case 'Observed Layout Problem':
        return 'cat-warning';
      case 'Potential Compatibility Issue':
        return 'cat-potential';
      case 'Requires Real iPhone Verification':
        return 'cat-verify';
      default:
        return 'cat-default';
    }
  };

  return (
    <div className="safari-issues-panel">
      {/* Header with Run Diagnostics action */}
      <div className="issues-panel-header">
        <div className="header-info">
          <span className="panel-title">Safari & WebKit Diagnostics</span>
          <span className="findings-count">{diagnostics.length} issues identified</span>
        </div>

        <button
          type="button"
          onClick={onRunDiagnostics}
          disabled={isDiagnosing}
          className="btn btn-primary btn-mini"
          title="Audit active page for Safari compatibility quirks"
        >
          <RefreshCw size={13} className={isDiagnosing ? 'spin-icon' : ''} />
          <span>{isDiagnosing ? 'Auditing...' : 'Run Audit'}</span>
        </button>
      </div>

      {/* Category Filter Chips */}
      <div className="category-filter-chips">
        <button
          type="button"
          className={`chip-filter ${filterCategory === 'all' ? 'active' : ''}`}
          onClick={() => setFilterCategory('all')}
        >
          All ({diagnostics.length})
        </button>
        <button
          type="button"
          className={`chip-filter ${filterCategory === 'Confirmed Error' ? 'active' : ''}`}
          onClick={() => setFilterCategory('Confirmed Error')}
        >
          Confirmed Errors
        </button>
        <button
          type="button"
          className={`chip-filter ${filterCategory === 'Observed Layout Problem' ? 'active' : ''}`}
          onClick={() => setFilterCategory('Observed Layout Problem')}
        >
          Layout Quirks
        </button>
        <button
          type="button"
          className={`chip-filter ${filterCategory === 'Potential Compatibility Issue' ? 'active' : ''}`}
          onClick={() => setFilterCategory('Potential Compatibility Issue')}
        >
          Potential Issues
        </button>
        <button
          type="button"
          className={`chip-filter ${filterCategory === 'Requires Real iPhone Verification' ? 'active' : ''}`}
          onClick={() => setFilterCategory('Requires Real iPhone Verification')}
        >
          Real iPhone
        </button>
      </div>

      {/* Issues List */}
      <div className="issues-list-container">
        {filtered.length === 0 ? (
          <div className="panel-empty-state">
            <CheckCircle2 size={32} className="success-icon" />
            <h4>
              {diagnostics.length === 0
                ? 'No Safari compatibility issues detected yet'
                : 'No issues match the selected filter'}
            </h4>
            <p>Click "Run Audit" to analyze live DOM nodes and CSS rules in WebKit runtime.</p>
          </div>
        ) : (
          filtered.map((issue) => (
            <div key={issue.id} className={`issue-card ${issue.severity}`}>
              <div className="issue-card-header">
                <div className="header-left">
                  {getSeverityIcon(issue.severity)}
                  <h4 className="issue-title">{issue.title}</h4>
                </div>
                <span className={`category-pill ${getCategoryClass(issue.category)}`}>
                  {issue.category}
                </span>
              </div>

              {issue.target && (
                <div className="issue-target-badge">
                  <span>Target:</span> <code>{issue.target}</code>
                </div>
              )}

              <p className="issue-desc">{issue.description}</p>

              {issue.recommendation && (
                <div className="issue-recommendation-box">
                  <div className="rec-title">
                    <Wand2 size={13} />
                    <span>Recommended Fix:</span>
                  </div>
                  <p className="rec-text">{issue.recommendation}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
