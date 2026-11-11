import { useState } from 'react';
import {
  RotateCcw,
  RefreshCw,
  Smartphone,
  Tablet,
  Monitor,
  MousePointer,
  Camera,
  GitCompare,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RotateCw,
  ZoomIn
} from 'lucide-react';

export default function InspectorToolbar({
  url,
  onNavigate,
  onReload,
  engine,
  onEngineChange,
  deviceId,
  onDeviceChange,
  width,
  height,
  onCustomDimensions,
  isLandscape,
  onToggleOrientation,
  zoom,
  onZoomChange,
  isInspectMode,
  onToggleInspect,
  onCaptureScreenshot,
  showComparison,
  onToggleComparison,
  backendStatus,
  isLoading
}) {
  const [inputUrl, setInputUrl] = useState(url);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      onNavigate(inputUrl.trim());
    }
  };

  return (
    <div className="inspector-toolbar">
      {/* 1. Address Bar & Navigation */}
      <form onSubmit={handleSubmit} className="inspector-address-bar">
        <button
          type="button"
          onClick={onReload}
          className="btn-toolbar-icon"
          title="Reload page"
          disabled={isLoading}
        >
          <RefreshCw size={15} className={isLoading ? 'spin-icon' : ''} />
        </button>

        <div className="url-input-container">
          <input
            type="text"
            className="inspector-url-input"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Enter public or localhost URL (e.g. http://localhost:3000)"
          />
          <button type="submit" className="url-submit-btn" title="Navigate">
            <ArrowRight size={14} />
          </button>
        </div>
      </form>

      {/* 2. Engine & Presets */}
      <div className="toolbar-group">
        <label className="toolbar-label">Engine:</label>
        <select
          value={engine}
          onChange={(e) => onEngineChange(e.target.value)}
          className="inspector-select engine-select"
        >
          <option value="webkit">WebKit (Safari Emulation)</option>
          <option value="chromium">Chromium (Chrome Baseline)</option>
        </select>
      </div>

      <div className="toolbar-group">
        <label className="toolbar-label">Device:</label>
        <select
          value={deviceId}
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'iphone-14-pro') onDeviceChange(val, 393, 852);
            else if (val === 'iphone-14') onDeviceChange(val, 390, 844);
            else if (val === 'iphone-se') onDeviceChange(val, 375, 667);
            else if (val === 'ipad-pro-11') onDeviceChange(val, 834, 1194);
            else if (val === 'ipad-air') onDeviceChange(val, 810, 1080);
            else if (val === 'desktop-safari') onDeviceChange(val, 1280, 800);
            else onDeviceChange('custom', width, height);
          }}
          className="inspector-select"
        >
          <option value="iphone-14">iPhone 14 (390×844)</option>
          <option value="iphone-14-pro">iPhone 14 Pro (393×852)</option>
          <option value="iphone-se">iPhone SE 3rd gen (375×667)</option>
          <option value="ipad-pro-11">iPad Pro 11" (834×1194)</option>
          <option value="ipad-air">iPad Air (810×1080)</option>
          <option value="desktop-safari">Desktop Safari Mac (1280×800)</option>
          <option value="custom">Custom Dimensions</option>
        </select>
      </div>

      {/* 3. Dimensions & Orientation */}
      <div className="toolbar-group dimensions-group">
        <input
          type="number"
          className="dim-input"
          value={width}
          onChange={(e) => onCustomDimensions(parseInt(e.target.value, 10) || 320, height)}
          title="Viewport Width"
        />
        <span className="dim-separator">×</span>
        <input
          type="number"
          className="dim-input"
          value={height}
          onChange={(e) => onCustomDimensions(width, parseInt(e.target.value, 10) || 480)}
          title="Viewport Height"
        />

        <button
          type="button"
          onClick={onToggleOrientation}
          className={`btn-toolbar-icon ${isLandscape ? 'active-tool' : ''}`}
          title="Rotate Orientation (Portrait / Landscape)"
        >
          <RotateCw size={15} />
        </button>
      </div>

      {/* 4. Zoom Scale */}
      <div className="toolbar-group zoom-group">
        <ZoomIn size={14} className="toolbar-icon-muted" />
        <select
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="inspector-select-mini"
          title="Preview Zoom"
        >
          <option value={50}>50%</option>
          <option value={65}>65%</option>
          <option value={75}>75% (Fit Screen)</option>
          <option value={85}>85%</option>
          <option value={100}>100%</option>
          <option value={125}>125%</option>
        </select>
      </div>

      {/* 5. Tool Action Toggles */}
      <div className="toolbar-actions">
        <button
          type="button"
          onClick={onToggleInspect}
          className={`btn-action-pill ${isInspectMode ? 'active-pill' : ''}`}
          title="Inspect Element (Click elements inside preview)"
        >
          <MousePointer size={14} />
          <span>{isInspectMode ? 'Inspecting' : 'Inspect'}</span>
        </button>

        <button
          type="button"
          onClick={onToggleComparison}
          className={`btn-action-pill ${showComparison ? 'active-pill' : ''}`}
          title="Compare WebKit vs Chromium side-by-side with visual diff"
        >
          <GitCompare size={14} />
          <span>Compare</span>
        </button>

        <button
          type="button"
          onClick={onCaptureScreenshot}
          className="btn-toolbar-icon"
          title="Download PNG Screenshot"
        >
          <Camera size={15} />
        </button>

        {/* Status Indicator */}
        <div
          className={`backend-status-pill ${backendStatus}`}
          title={
            backendStatus === 'connected'
              ? 'Local Playwright WebKit Engine Connected'
              : 'Backend Disconnected'
          }
        >
          <span className="status-dot"></span>
          <span className="status-label">
            {backendStatus === 'connected' ? 'WebKit Live' : 'Disconnected'}
          </span>
        </div>
      </div>
    </div>
  );
}
