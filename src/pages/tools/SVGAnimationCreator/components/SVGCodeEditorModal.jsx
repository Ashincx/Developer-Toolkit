import React, { useState, useEffect } from 'react';
import { Code, Check, Copy, X, FileText } from 'lucide-react';
import { generateStylesCSS } from '../utils/animationPresets';

export default function SVGCodeEditorModal({
  isOpen,
  onClose,
  svgString,
  animations,
  onUpdateSvg
}) {
  const [activeTab, setActiveTab] = useState('svg'); // 'svg' or 'css'
  const [editedSvg, setEditedSvg] = useState(svgString || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (svgString) {
      setEditedSvg(svgString);
    }
  }, [svgString]);

  if (!isOpen) return null;

  const generatedCss = generateStylesCSS(animations, {
    scopeSelector: '',
    speed: 1,
    isScrubbing: false
  });

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyChanges = () => {
    if (onUpdateSvg) {
      onUpdateSvg(editedSvg);
    }
    onClose();
  };

  return (
    <div className="svg-modal-overlay" onClick={onClose}>
      <div className="svg-modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="svg-modal-header">
          <div className="svg-modal-title">
            <Code size={20} className="modal-title-icon" />
            <h3>SVG & CSS Code Inspector</h3>
          </div>
          <button className="svg-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="svg-modal-tabs">
          <button
            className={`svg-modal-tab ${activeTab === 'svg' ? 'active' : ''}`}
            onClick={() => setActiveTab('svg')}
          >
            <FileText size={16} />
            <span>Raw SVG Markup</span>
          </button>
          <button
            className={`svg-modal-tab ${activeTab === 'css' ? 'active' : ''}`}
            onClick={() => setActiveTab('css')}
          >
            <Code size={16} />
            <span>Generated CSS Keyframes</span>
          </button>
        </div>

        <div className="svg-modal-body">
          {activeTab === 'svg' ? (
            <div className="code-editor-wrapper">
              <div className="code-editor-toolbar">
                <span className="code-lang-label">SVG / XML</span>
                <button
                  className="code-copy-btn"
                  onClick={() => handleCopy(editedSvg)}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy SVG'}</span>
                </button>
              </div>
              <textarea
                className="code-textarea"
                value={editedSvg}
                onChange={(e) => setEditedSvg(e.target.value)}
                rows={16}
                spellCheck={false}
              />
              <div className="code-modal-footer">
                <button className="btn btn-outline" onClick={onClose}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleApplyChanges}>
                  Apply to Canvas
                </button>
              </div>
            </div>
          ) : (
            <div className="code-editor-wrapper">
              <div className="code-editor-toolbar">
                <span className="code-lang-label">CSS @keyframes</span>
                <button
                  className="code-copy-btn"
                  onClick={() => handleCopy(generatedCss)}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy CSS'}</span>
                </button>
              </div>
              <pre className="code-pre">
                <code>{generatedCss.trim() || '/* No active animations */'}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
