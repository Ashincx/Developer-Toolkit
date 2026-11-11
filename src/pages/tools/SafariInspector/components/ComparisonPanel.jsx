import { useState } from 'react';
import {
  GitCompare,
  Download,
  RefreshCw,
  Info,
  Sliders,
  Columns,
  Eye,
  CheckCircle2
} from 'lucide-react';

export default function ComparisonPanel({
  comparisonData,
  isComparing,
  onRunComparison,
  currentUrl
}) {
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'diff' | 'webkit' | 'chromium'
  const [threshold, setThreshold] = useState(0.1);
  const [urlInput, setUrlInput] = useState(currentUrl || 'https://example.com');

  const handleRun = () => {
    onRunComparison(urlInput, threshold);
  };

  const handleDownloadDiff = () => {
    if (!comparisonData || !comparisonData.diffImage) return;
    const a = document.createElement('a');
    a.href = comparisonData.diffImage;
    a.download = `safari-vs-chrome-diff-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="comparison-panel-fullscreen">
      {/* Top Comparison Config Bar */}
      <div className="comparison-config-bar">
        <div className="bar-left">
          <GitCompare size={18} className="brand-accent-icon" />
          <div className="bar-title-group">
            <h3>Chromium vs WebKit Comparison</h3>
            <p>Pixel-level visual comparison between Chrome engine and Safari engine</p>
          </div>
        </div>

        <div className="bar-controls">
          <div className="threshold-control">
            <span className="ctrl-label">Threshold:</span>
            <input
              type="range"
              min="0.05"
              max="0.4"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              title="Sensitivity threshold"
            />
            <span className="ctrl-val">{Math.round(threshold * 100)}%</span>
          </div>

          <button
            type="button"
            onClick={handleRun}
            disabled={isComparing}
            className="btn btn-primary"
          >
            <RefreshCw size={14} className={isComparing ? 'spin-icon' : ''} />
            <span>{isComparing ? 'Rendering engines...' : 'Run Comparison'}</span>
          </button>

          {comparisonData && comparisonData.diffImage && (
            <button
              type="button"
              onClick={handleDownloadDiff}
              className="btn btn-outline"
              title="Download Diff PNG"
            >
              <Download size={14} />
              <span>Export Diff</span>
            </button>
          )}
        </div>
      </div>

      {/* Explanatory Advisory Banner */}
      <div className="comparison-advisory-banner">
        <Info size={15} />
        <span>
          Rendered with identical viewport dimensions and device scale. Differences can arise from font antialiasing (DirectWrite vs CoreText), CSS subpixel rounding, or dynamic animations. Treat diffs as investigation leads.
        </span>
      </div>

      {/* Stats Bar if Comparison is Complete */}
      {comparisonData && comparisonData.success && (
        <div className="comparison-stats-bar">
          <div className="stat-card">
            <span className="stat-label">Visual Mismatch</span>
            <span className={`stat-value ${comparisonData.diffPercentage > 3 ? 'high-diff' : 'low-diff'}`}>
              {comparisonData.diffPercentage}%
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Diff Pixels</span>
            <span className="stat-value">{comparisonData.diffPixelCount?.toLocaleString()}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Resolution</span>
            <span className="stat-value">
              {comparisonData.viewport.width} × {comparisonData.viewport.height}
            </span>
          </div>

          {/* View Mode Switcher */}
          <div className="view-mode-switcher">
            <button
              type="button"
              className={`mode-btn ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
            >
              <Columns size={13} /> Side-by-Side
            </button>
            <button
              type="button"
              className={`mode-btn ${viewMode === 'diff' ? 'active' : ''}`}
              onClick={() => setViewMode('diff')}
            >
              <Eye size={13} /> Visual Diff Only
            </button>
          </div>
        </div>
      )}

      {/* Comparison Viewport Canvas */}
      <div className="comparison-viewport-area">
        {!comparisonData ? (
          <div className="comparison-empty-state">
            <GitCompare size={40} className="muted-icon" />
            <h3>No comparison run yet</h3>
            <p>Click "Run Comparison" above to render the page simultaneously in Chromium and WebKit and compute pixel differences.</p>
          </div>
        ) : !comparisonData.success ? (
          <div className="comparison-empty-state">
            <Info size={40} className="diag-icon-error" />
            <h3>Comparison failed</h3>
            <p>{comparisonData.error}</p>
          </div>
        ) : viewMode === 'split' ? (
          <div className="split-view-container">
            {/* Left: Chromium */}
            <div className="browser-column">
              <div className="column-header cr-header">
                <span className="engine-badge">Chromium (Chrome)</span>
              </div>
              <div className="image-frame">
                <img
                  src={comparisonData.chromiumImage}
                  alt="Chromium render"
                  className="comparison-img"
                />
              </div>
            </div>

            {/* Middle: Diff Overlay */}
            <div className="browser-column diff-column">
              <div className="column-header diff-header">
                <span className="engine-badge diff-badge">Visual Diff (Magenta)</span>
              </div>
              <div className="image-frame">
                <img
                  src={comparisonData.diffImage}
                  alt="Visual diff"
                  className="comparison-img"
                />
              </div>
            </div>

            {/* Right: WebKit */}
            <div className="browser-column">
              <div className="column-header wk-header">
                <span className="engine-badge">WebKit (Safari)</span>
              </div>
              <div className="image-frame">
                <img
                  src={comparisonData.webkitImage}
                  alt="WebKit render"
                  className="comparison-img"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="diff-only-container">
            <div className="diff-hero-frame">
              <img
                src={comparisonData.diffImage}
                alt="Visual diff only"
                className="comparison-img-hero"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
