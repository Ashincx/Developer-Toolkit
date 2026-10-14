import React, { useState } from 'react';
import { UploadCloud, FileCode, Sparkles, X, Check, AlertCircle } from 'lucide-react';
import { sampleSvgs } from '../utils/sampleSvgs';
import { parseProjectJson } from '../utils/exportUtils';

export default function SVGUploadModal({
  isOpen,
  onClose,
  onLoadSvg,
  onLoadProject
}) {
  const [activeTab, setActiveTab] = useState('samples'); // 'samples', 'upload', 'paste'
  const [pasteCode, setPasteCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleSelectSample = (sample) => {
    try {
      onLoadSvg(sample.svg, sample.name);
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleApplyPaste = () => {
    setErrorMsg('');
    if (!pasteCode.trim()) {
      setErrorMsg('Please paste your SVG code.');
      return;
    }

    // Check if it's JSON project
    if (pasteCode.trim().startsWith('{')) {
      const parsed = parseProjectJson(pasteCode);
      if (parsed.ok) {
        onLoadProject(parsed.data);
        onClose();
        return;
      }
    }

    try {
      onLoadSvg(pasteCode.trim(), 'Imported SVG');
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to parse SVG markup.');
    }
  };

  const processFile = (file) => {
    setErrorMsg('');
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (!content || typeof content !== 'string') {
        setErrorMsg('Could not read file content.');
        return;
      }

      if (file.name.endsWith('.json')) {
        const parsed = parseProjectJson(content);
        if (parsed.ok) {
          onLoadProject(parsed.data);
          onClose();
        } else {
          setErrorMsg(parsed.error || 'Invalid project file format.');
        }
      } else {
        try {
          onLoadSvg(content, file.name.replace(/\.[^/.]+$/, ''));
          onClose();
        } catch (err) {
          setErrorMsg(err.message || 'Invalid SVG file.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="svg-modal-overlay" onClick={onClose}>
      <div className="svg-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="svg-modal-header">
          <div className="svg-modal-title">
            <UploadCloud size={20} className="modal-title-icon" />
            <h3>Import SVG or Choose Sample</h3>
          </div>
          <button className="svg-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="svg-modal-tabs">
          <button
            className={`svg-modal-tab ${activeTab === 'samples' ? 'active' : ''}`}
            onClick={() => setActiveTab('samples')}
          >
            <Sparkles size={16} />
            <span>Sample Library</span>
          </button>
          <button
            className={`svg-modal-tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <UploadCloud size={16} />
            <span>Upload File</span>
          </button>
          <button
            className={`svg-modal-tab ${activeTab === 'paste' ? 'active' : ''}`}
            onClick={() => setActiveTab('paste')}
          >
            <FileCode size={16} />
            <span>Paste SVG Code</span>
          </button>
        </div>

        {errorMsg && (
          <div className="svg-modal-alert">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="svg-modal-body">
          {/* SAMPLES TAB */}
          {activeTab === 'samples' && (
            <div className="sample-grid">
              {sampleSvgs.map((sample) => (
                <div
                  key={sample.id}
                  className="sample-card"
                  onClick={() => handleSelectSample(sample)}
                >
                  <div
                    className="sample-preview"
                    dangerouslySetInnerHTML={{ __html: sample.svg }}
                  />
                  <div className="sample-info">
                    <span className="sample-name">{sample.name}</span>
                    <span className="sample-desc">{sample.description}</span>
                  </div>
                  <button className="sample-load-btn">
                    <Check size={14} />
                    <span>Load</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* UPLOAD FILE TAB */}
          {activeTab === 'upload' && (
            <div
              className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <UploadCloud size={48} className="dropzone-icon" />
              <h4>Drag & drop SVG or Project JSON file here</h4>
              <p>Supports standalone .svg files or .json project files</p>
              <label className="btn btn-primary dropzone-browse">
                Browse Files
                <input
                  type="file"
                  accept=".svg,.json"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          )}

          {/* PASTE CODE TAB */}
          {activeTab === 'paste' && (
            <div className="paste-area-wrapper">
              <textarea
                className="paste-textarea"
                placeholder="<svg viewBox='0 0 100 100' ...>&#10;  <circle cx='50' cy='50' r='40' fill='#6366f1'/>&#10;</svg>"
                value={pasteCode}
                onChange={(e) => setPasteCode(e.target.value)}
                rows={10}
              />
              <div className="paste-actions">
                <button
                  className="btn btn-outline"
                  onClick={() => setPasteCode('')}
                  disabled={!pasteCode}
                >
                  Clear
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleApplyPaste}
                  disabled={!pasteCode.trim()}
                >
                  Import SVG
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
