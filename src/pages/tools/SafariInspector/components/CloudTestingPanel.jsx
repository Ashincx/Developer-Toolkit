import { useState } from 'react';
import {
  Smartphone,
  ExternalLink,
  ShieldAlert,
  Info,
  Terminal,
  CheckCircle,
  Sparkles,
  Laptop
} from 'lucide-react';

export default function CloudTestingPanel({ currentUrl }) {
  const [targetUrl, setTargetUrl] = useState(currentUrl || 'https://example.com');

  const handleLaunchBrowserStack = () => {
    const formatted = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
    const bsUrl = `https://live.browserstack.com/dashboard#os=ios&os_version=17.0&device=iPhone+15&zoom_to_fit=true&full_screen=true&url=${encodeURIComponent(formatted)}`;
    window.open(bsUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="cloud-testing-panel">
      {/* Overview Banner */}
      <div className="cloud-intro-banner">
        <div className="banner-left">
          <Smartphone size={24} className="banner-icon" />
          <div>
            <h3>Real iPhone Safari Testing (Optional)</h3>
            <p>
              Local WebKit emulation provides free rendering inspection. When you need to verify iOS-native touches, dynamic address bar shifts, or physical hardware behaviors, test on authentic iOS devices.
            </p>
          </div>
        </div>
      </div>

      <div className="cloud-testing-grid">
        {/* Card 1: BrowserStack Live Direct Launch */}
        <div className="cloud-card">
          <div className="card-header">
            <span className="card-badge">Cloud Provider</span>
            <h4>BrowserStack Live for iOS</h4>
          </div>
          <p className="card-desc">
            Test on genuine iPhone 15, iPhone 14, and iPad devices running real iOS Safari with camera, gestures, and native WebKit.
          </p>

          <div className="card-url-form">
            <label className="form-label">Target URL to inspect:</label>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="input"
              placeholder="https://your-website.com"
            />
          </div>

          <button
            type="button"
            onClick={handleLaunchBrowserStack}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
          >
            <ExternalLink size={15} />
            <span>Launch Real iPhone Session</span>
          </button>

          <div className="card-note">
            <Info size={13} />
            <span>Requires a free or paid BrowserStack account. Session launches in an external tab.</span>
          </div>
        </div>

        {/* Card 2: Testing Localhost on Real Cloud Devices */}
        <div className="cloud-card">
          <div className="card-header">
            <span className="card-badge">Dev Workflow</span>
            <h4>Testing Localhost & Dev URLs</h4>
          </div>
          <p className="card-desc">
            To test private development servers (e.g. <code>http://localhost:3000</code> or <code>http://192.168.x.x</code>) on cloud devices:
          </p>

          <div className="instructions-step-list">
            <div className="step-item">
              <span className="step-number">1</span>
              <div>
                <strong>BrowserStack Local Tunnel:</strong> Download the BrowserStack Local binary and run:
                <pre className="inline-code-block">BrowserStackLocal.exe --key YOUR_ACCESS_KEY</pre>
              </div>
            </div>

            <div className="step-item">
              <span className="step-number">2</span>
              <div>
                <strong>Alternative (ngrok / Cloudflare):</strong> Expose your dev port with a secure tunnel:
                <pre className="inline-code-block">npx ngrok http 3000</pre>
              </div>
            </div>

            <div className="step-item">
              <span className="step-number">3</span>
              <div>
                Paste the generated HTTPS tunnel URL into the target input above and launch your session.
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Real Device Differences */}
        <div className="cloud-card full-width-card">
          <div className="card-header">
            <span className="card-badge">Technical Comparison</span>
            <h4>Local WebKit vs. Authentic iOS Safari</h4>
          </div>

          <div className="comparison-table-wrapper">
            <table className="feature-comparison-table">
              <thead>
                <tr>
                  <th>Capability</th>
                  <th>Local WebKit (Safari Inspector Studio)</th>
                  <th>Real iPhone Hardware</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Rendering Engine</td>
                  <td>Authentic WebKit engine (running locally on Windows)</td>
                  <td>Authentic WebKit (iOS build)</td>
                </tr>
                <tr>
                  <td>Cost & Setup</td>
                  <td><strong>100% Free & Unlimited</strong> (Runs on your PC)</td>
                  <td>Requires physical device or cloud subscription</td>
                </tr>
                <tr>
                  <td>CSS & Layout Inspection</td>
                  <td>Instant live inspection, box-model & styles</td>
                  <td>Requires remote USB debugging setup</td>
                </tr>
                <tr>
                  <td>Dynamic iOS Address Bar</td>
                  <td>Fixed simulated viewport</td>
                  <td>Collapses and expands dynamically on scroll</td>
                </tr>
                <tr>
                  <td>Native Gestures & Rubberband</td>
                  <td>Emulated mouse/wheel scroll events</td>
                  <td>Native momentum physics and edge-swipe back navigation</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
