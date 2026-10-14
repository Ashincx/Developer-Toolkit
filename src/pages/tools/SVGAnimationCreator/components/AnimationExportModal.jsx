import React, { useState } from 'react';
import { Download, Copy, Check, X, FileText, Code, Sparkles, Layers } from 'lucide-react';
import { saveAs } from 'file-saver';
import {
  buildStandaloneSvg,
  buildHtmlCss,
  buildReactJsx,
  buildProjectJson
} from '../utils/exportUtils';

export default function AnimationExportModal({
  isOpen,
  onClose,
  svgString,
  animations,
  layers,
  canvasSettings,
  projectName = 'animated-svg'
}) {
  const [activeTab, setActiveTab] = useState('svg'); // 'svg', 'html', 'react', 'json', 'preview'
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const standaloneSvg = buildStandaloneSvg(svgString, animations);
  const htmlCssCode = buildHtmlCss(svgString, animations);
  const reactCode = buildReactJsx(svgString, animations, 'AnimatedIcon');
  const projectJson = buildProjectJson({
    name: projectName,
    svgString,
    animations,
    layers,
    canvasSettings
  });

  const getActiveCode = () => {
    switch (activeTab) {
      case 'svg':
        return standaloneSvg;
      case 'html':
        return htmlCssCode;
      case 'react':
        return reactCode;
      case 'json':
        return projectJson;
      default:
        return standaloneSvg;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const safeName = (projectName || 'animated-svg').toLowerCase().replace(/[^a-z0-9_-]/g, '-');

    switch (activeTab) {
      case 'svg': {
        const blob = new Blob([standaloneSvg], { type: 'image/svg+xml;charset=utf-8' });
        saveAs(blob, `${safeName}.svg`);
        break;
      }
      case 'html': {
        const blob = new Blob([htmlCssCode], { type: 'text/html;charset=utf-8' });
        saveAs(blob, `${safeName}.html`);
        break;
      }
      case 'react': {
        const blob = new Blob([reactCode], { type: 'text/javascript;charset=utf-8' });
        saveAs(blob, `AnimatedIcon.jsx`);
        break;
      }
      case 'json': {
        const blob = new Blob([projectJson], { type: 'application/json;charset=utf-8' });
        saveAs(blob, `${safeName}.project.json`);
        break;
      }
      default:
        break;
    }
  };

  return (
    <div className="svg-modal-overlay" onClick={onClose}>
      <div className="svg-modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="svg-modal-header">
          <div className="svg-modal-title">
            <Download size={20} className="modal-title-icon" />
            <h3>Export Animated SVG</h3>
          </div>
          <button className="svg-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="svg-modal-tabs">
          <button
            className={`svg-modal-tab ${activeTab === 'svg' ? 'active' : ''}`}
            onClick={() => setActiveTab('svg')}
          >
            <Sparkles size={16} />
            <span>Standalone SVG</span>
          </button>
          <button
            className={`svg-modal-tab ${activeTab === 'html' ? 'active' : ''}`}
            onClick={() => setActiveTab('html')}
          >
            <FileText size={16} />
            <span>HTML + CSS</span>
          </button>
          <button
            className={`svg-modal-tab ${activeTab === 'react' ? 'active' : ''}`}
            onClick={() => setActiveTab('react')}
          >
            <Code size={16} />
            <span>React JSX</span>
          </button>
          <button
            className={`svg-modal-tab ${activeTab === 'json' ? 'active' : ''}`}
            onClick={() => setActiveTab('json')}
          >
            <Layers size={16} />
            <span>Project JSON</span>
          </button>
          <button
            className={`svg-modal-tab ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            <Check size={16} />
            <span>Live Standalone Test</span>
          </button>
        </div>

        <div className="svg-modal-body">
          {activeTab === 'preview' ? (
            <div className="export-standalone-preview">
              <div className="standalone-preview-header">
                <h4>Isolated Browser Rendering Test</h4>
                <p>This renders the raw exported standalone SVG directly in an isolated container without JavaScript.</p>
              </div>
              <div
                className="standalone-preview-box checkerboard"
                dangerouslySetInnerHTML={{ __html: standaloneSvg }}
              />
            </div>
          ) : (
            <div className="code-editor-wrapper">
              <div className="code-editor-toolbar">
                <span className="code-lang-label">
                  {activeTab === 'svg' && 'Clean Standalone SVG (Pure CSS, No JavaScript)'}
                  {activeTab === 'html' && 'HTML Component with Scoped CSS'}
                  {activeTab === 'react' && 'React Functional Component (.jsx)'}
                  {activeTab === 'json' && 'Complete Project State (.json)'}
                </span>

                <div className="export-toolbar-buttons">
                  <button className="code-copy-btn" onClick={handleCopy}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                  <button className="btn btn-primary export-download-btn" onClick={handleDownload}>
                    <Download size={14} />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              <pre className="code-pre">
                <code>{getActiveCode()}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
