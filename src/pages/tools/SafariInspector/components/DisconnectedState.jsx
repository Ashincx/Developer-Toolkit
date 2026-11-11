import { useState } from 'react';
import {
  ServerOff,
  RefreshCw,
  ExternalLink,
  Laptop,
  Globe,
  Key,
  CheckCircle
} from 'lucide-react';
import { getInspectorConfig, saveInspectorConfig } from '../../../../services/safariInspector';

export default function DisconnectedState({ onRetry, _backendError, onOpenCloudTab }) {
  const config = getInspectorConfig();
  const [customUrl, setCustomUrl] = useState(config.apiUrl);
  const [customToken, setCustomToken] = useState(config.token);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const isHttpsOrigin = typeof window !== 'undefined' && window.location.protocol === 'https:';

  const handleSaveConfig = (e) => {
    e.preventDefault();
    saveInspectorConfig({ apiUrl: customUrl, token: customToken });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleManualRetry = async () => {
    setIsRetrying(true);
    await onRetry();
    setIsRetrying(false);
  };

  return (
    <div className="disconnected-state-container">
      <div className="disconnected-card">
        <div className="disconnected-icon-wrapper">
          <ServerOff size={36} className="disconnected-icon" />
        </div>

        <h2>Inspection Engine Disconnected</h2>
        <p className="disconnected-subtitle">
          Safari Inspector Studio requires the local Express + Playwright WebKit backend to render and inspect pages.
        </p>

        {isHttpsOrigin && (
          <div className="https-alert-banner">
            <Globe size={18} />
            <div>
              <strong>GitHub Pages Static Deployment Detected</strong>
              <p>
                GitHub Pages hosts static frontend assets only. WebKit browser automation cannot run directly on GitHub Pages, and web browsers prevent HTTPS websites from connecting to unencrypted local servers (Mixed Content security restriction).
              </p>
            </div>
          </div>
        )}

        {/* Windows Local Setup Guide */}
        <div className="setup-guide-box">
          <div className="guide-header">
            <Laptop size={16} />
            <h4>Quick Windows Setup for Free Local WebKit Inspection</h4>
          </div>

          <ol className="setup-steps-list">
            <li>
              <span>Open your terminal in the project directory:</span>
              <pre className="code-snippet">npm install</pre>
            </li>
            <li>
              <span>Start the Developer Toolkit backend engine:</span>
              <pre className="code-snippet">npm run backend</pre>
            </li>
            <li>
              <span>In another terminal, start the Vite development server:</span>
              <pre className="code-snippet">npm run dev</pre>
            </li>
            <li>
              <span>Open the local app in your browser:</span>
              <div className="local-url-badge">http://localhost:5173/#/safari-inspector</div>
            </li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="disconnected-actions-row">
          <button
            type="button"
            onClick={handleManualRetry}
            disabled={isRetrying}
            className="btn btn-primary"
          >
            <RefreshCw size={15} className={isRetrying ? 'spin-icon' : ''} />
            <span>{isRetrying ? 'Checking connection...' : 'Retry Connection'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenCloudTab}
            className="btn btn-outline"
          >
            <ExternalLink size={15} />
            <span>Open Real iPhone Testing Tab</span>
          </button>
        </div>

        {/* Advanced Remote Backend Configuration */}
        <details className="remote-backend-accordion">
          <summary className="accordion-summary">
            <Key size={14} />
            <span>Configure Independently Hosted Backend (For Remote / Online Use)</span>
          </summary>

          <form onSubmit={handleSaveConfig} className="remote-config-form">
            <p className="config-desc">
              If you have deployed the Playwright inspector backend to a private server with HTTPS, enter its endpoint below:
            </p>

            <div className="config-field">
              <label>API Endpoint URL:</label>
              <input
                type="text"
                className="input"
                placeholder="https://your-inspector-backend.com"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
              />
            </div>

            <div className="config-field">
              <label>Authorization Bearer Token (Optional):</label>
              <input
                type="password"
                className="input"
                placeholder="Bearer token if secured"
                value={customToken}
                onChange={(e) => setCustomToken(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-outline" style={{ marginTop: '0.75rem' }}>
              {savedSuccess ? <CheckCircle size={14} /> : null}
              <span>{savedSuccess ? 'Settings Saved' : 'Save Endpoint & Reconnect'}</span>
            </button>
          </form>
        </details>
      </div>
    </div>
  );
}
