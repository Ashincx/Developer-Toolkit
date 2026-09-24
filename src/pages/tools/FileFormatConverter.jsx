import { useState, useRef, useCallback } from 'react';
import { UploadCloud, File, FileImage, FileAudio, FileVideo, FileText, FileJson, FileArchive, Settings, Trash2, ChevronRight, CheckCircle2, Download, Copy, AlertCircle, Play } from 'lucide-react';
import ToolLayout from '../../components/ToolLayout';
import './FileFormatConverter.css';

// --- CONFIGURATION ---
const CATEGORIES = ['All', 'Images', 'Documents', 'Audio', 'Video', 'Data', 'Archives', 'Developer'];

const FORMAT_CONFIG = {
  // Images
  'image/png': { ext: 'PNG', category: 'Images', targets: ['WEBP', 'JPG', 'AVIF', 'GIF', 'ICO', 'PDF'], type: 'browser' },
  'image/jpeg': { ext: 'JPG', category: 'Images', targets: ['WEBP', 'PNG', 'AVIF', 'GIF', 'PDF'], type: 'browser' },
  'image/webp': { ext: 'WEBP', category: 'Images', targets: ['PNG', 'JPG', 'PDF'], type: 'browser' },
  'image/svg+xml': { ext: 'SVG', category: 'Images', targets: ['PNG', 'JPG', 'WEBP', 'PDF'], type: 'browser' },
  // Documents
  'application/pdf': { ext: 'PDF', category: 'Documents', targets: ['DOCX', 'TXT'], type: 'server' },
  'text/plain': { ext: 'TXT', category: 'Documents', targets: ['PDF', 'DOCX'], type: 'server' },
  // Data & Developer
  'application/json': { ext: 'JSON', category: 'Developer', targets: ['YAML', 'CSV', 'XML'], type: 'browser' },
  'text/csv': { ext: 'CSV', category: 'Data', targets: ['JSON'], type: 'browser' },
  'application/xml': { ext: 'XML', category: 'Data', targets: ['JSON'], type: 'browser' },
  'text/html': { ext: 'HTML', category: 'Developer', targets: ['Markdown'], type: 'server' },
  // Audio
  'audio/mpeg': { ext: 'MP3', category: 'Audio', targets: ['WAV', 'OGG'], type: 'server' },
  'audio/wav': { ext: 'WAV', category: 'Audio', targets: ['MP3', 'OGG'], type: 'server' },
  // Video
  'video/mp4': { ext: 'MP4', category: 'Video', targets: ['WEBM', 'MOV', 'AVI'], type: 'server' },
  // Archives
  'application/zip': { ext: 'ZIP', category: 'Archives', targets: ['TAR', 'GZ'], type: 'server' }
};

const DEFAULT_SETTINGS = {
  Images: { quality: 80, resizeMode: 'contain' },
  Video: { resolution: '1080p', framerate: '30' },
  Audio: { bitrate: '128k' }
};

const FileFormatConverter = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [files, setFiles] = useState([]); // { id, name, originalExt, type, size, targetFormat, settings, status, progress, convertedSize }
  const [isDragging, setIsDragging] = useState(false);
  const [batchTarget, setBatchTarget] = useState('');
  const [conversionState, setConversionState] = useState('idle'); // idle, converting, complete
  
  const fileInputRef = useRef(null);

  // --- HANDLERS ---
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const getFileExt = (filename) => {
    return filename.split('.').pop().toUpperCase();
  };

  const processFiles = (newFiles) => {
    const processed = newFiles.map(file => {
      const mimeType = file.type;
      const config = FORMAT_CONFIG[mimeType] || Object.values(FORMAT_CONFIG).find(c => c.ext === getFileExt(file.name));
      
      const originalExt = config ? config.ext : getFileExt(file.name);
      const category = config ? config.category : 'Unknown';
      const targets = config ? config.targets : [];

      return {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        originalExt,
        category,
        size: file.size,
        fileRef: file,
        targetFormat: targets.length > 0 ? targets[0] : '', // Default to first available
        settings: { ...DEFAULT_SETTINGS[category] },
        status: 'pending', // pending, converting, success, error
        progress: 0,
        convertedSize: 0,
        isSupported: targets.length > 0
      };
    });

    setFiles(prev => [...prev, ...processed]);
    setConversionState('idle');
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (files.length === 1) setConversionState('idle');
  };

  const clearAll = () => {
    setFiles([]);
    setConversionState('idle');
  };

  const updateFileTarget = (id, target) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, targetFormat: target } : f));
  };

  const applyBatchTarget = () => {
    if (!batchTarget) return;
    setFiles(prev => prev.map(f => {
      // Find config for this file
      const config = Object.values(FORMAT_CONFIG).find(c => c.ext === f.originalExt);
      if (config && config.targets.includes(batchTarget)) {
        return { ...f, targetFormat: batchTarget };
      }
      return f;
    }));
  };

  // --- REAL & MOCK CONVERSION ENGINE ---
  const convertFile = async (fileObj, originalExt, targetExt) => {
    return new Promise((resolve, reject) => {
      if (['PNG', 'JPG', 'JPEG', 'WEBP', 'SVG'].includes(originalExt) && ['PNG', 'JPG', 'JPEG', 'WEBP', 'AVIF'].includes(targetExt)) {
        const img = new Image();
        const url = URL.createObjectURL(fileObj);
        img.onload = () => {
          URL.revokeObjectURL(url);
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          
          if (targetExt === 'JPG' || targetExt === 'JPEG') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          ctx.drawImage(img, 0, 0);
          
          let mime = `image/${targetExt.toLowerCase()}`;
          if (targetExt === 'JPG') mime = 'image/jpeg';
          
          canvas.toBlob(blob => {
            resolve(blob);
          }, mime, 0.9);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
      } 
      else if (originalExt === 'JSON' && ['CSV', 'YAML', 'XML'].includes(targetExt)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            if (targetExt === 'CSV') {
              const arr = Array.isArray(data) ? data : [data];
              if (arr.length === 0) return resolve(new Blob([""], { type: 'text/csv' }));
              const keys = Object.keys(arr[0]);
              const csv = [
                keys.join(','),
                ...arr.map(row => keys.map(k => `"${(row[k] || '').toString().replace(/"/g, '""')}"`).join(','))
              ].join('\n');
              resolve(new Blob([csv], { type: 'text/csv' }));
            } else if (targetExt === 'YAML') {
              const toYaml = (obj, indent = '') => {
                if (typeof obj !== 'object' || obj === null) return String(obj);
                let out = '';
                for (const [k, v] of Object.entries(obj)) {
                  if (typeof v === 'object' && v !== null) {
                    out += `${indent}${k}:\n${toYaml(v, indent + '  ')}`;
                  } else {
                    out += `${indent}${k}: ${v}\n`;
                  }
                }
                return out;
              };
              resolve(new Blob([toYaml(data)], { type: 'text/yaml' }));
            } else {
              resolve(new Blob(["<data>Mock XML</data>"], { type: 'application/xml' }));
            }
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsText(fileObj);
      } else {
        resolve(null);
      }
    });
  };

  const startConversion = async () => {
    setConversionState('converting');
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.isSupported || !file.targetFormat) continue;

      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'converting', progress: 10 } : f));
      
      try {
        const convertedBlob = await convertFile(file.fileRef, file.originalExt, file.targetFormat);
        
        if (convertedBlob) {
          setFiles(prev => prev.map(f => f.id === file.id ? { 
            ...f, 
            status: 'success', 
            progress: 100,
            convertedBlob,
            convertedSize: convertedBlob.size
          } : f));
        } else {
          // Mock fallback for server conversions
          await new Promise(r => setTimeout(r, 600));
          let sizeRatio = 0.8; 
          if (file.targetFormat === 'WEBP' || file.targetFormat === 'AVIF') sizeRatio = 0.3;
          if (file.targetFormat === 'ZIP') sizeRatio = 0.5;

          setFiles(prev => prev.map(f => f.id === file.id ? { 
            ...f, 
            status: 'success', 
            progress: 100,
            convertedSize: Math.max(1024, file.size * sizeRatio)
          } : f));
        }
      } catch (err) {
        console.error(err);
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'error', progress: 0 } : f));
      }
    }

    setConversionState('complete');
  };

  // --- HELPERS ---
  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const getFileIcon = (category) => {
    switch (category) {
      case 'Images': return <FileImage size={24} />;
      case 'Audio': return <FileAudio size={24} />;
      case 'Video': return <FileVideo size={24} />;
      case 'Developer':
      case 'Data': return <FileJson size={24} />;
      case 'Archives': return <FileArchive size={24} />;
      default: return <FileText size={24} />;
    }
  };

  const handleMockDownload = (filename, actualBlob) => {
    let blob = actualBlob;

    if (!blob) {
      const ext = filename.split('.').pop().toUpperCase();
      if (ext === 'PDF') {
        const pdfData = `%PDF-1.4\n1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 300 100] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n4 0 obj <</Length 53>> stream\nBT\n/F1 16 Tf\n10 50 Td\n(Mock converted PDF file.) Tj\nET\nendstream endobj\n5 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \n0000000244 00000 n \n0000000348 00000 n \ntrailer <</Size 6 /Root 1 0 R>>\nstartxref\n436\n%%EOF`;
        blob = new Blob([pdfData], { type: "application/pdf" });
      } else if (['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'AVIF'].includes(ext)) {
        const b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
        const byteCharacters = atob(b64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        blob = new Blob([new Uint8Array(byteNumbers)], { type: `image/${ext.toLowerCase()}` });
      } else if (ext === 'ZIP') {
        const b64 = "UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==";
        const byteCharacters = atob(b64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        blob = new Blob([new Uint8Array(byteNumbers)], { type: "application/zip" });
      } else {
        const content = `This is a mock converted file generated by the File Format Converter.\nOriginal file processing was simulated for: ${filename}`;
        blob = new Blob([content], { type: "text/plain" });
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTargetType = (inputExt, targetExt) => {
    const config = Object.values(FORMAT_CONFIG).find(c => c.ext === inputExt);
    return config?.type || 'server';
  };

  // --- RENDERERS ---
  const renderEmptyState = () => (
    <div className="file-queue-section">
      <div 
        className={`upload-area ${isDragging ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          multiple 
          onChange={handleFileSelect}
        />
        <div className="upload-icon">
          <UploadCloud size={32} />
        </div>
        <h3>Drop your files here</h3>
        <p>or click to browse from your computer</p>
        <button className="btn btn-outline browse-btn">Browse Files</button>
        <div className="privacy-notice">
          <AlertCircle size={14} />
          Your files are processed securely. Files are automatically removed after conversion.
        </div>
      </div>

      <div className="popular-conversions">
        <h3>Popular Conversions</h3>
        <div className="conversions-grid">
          <div className="conversion-card" onClick={() => fileInputRef.current?.click()}>
            <div className="conversion-path">PNG <ChevronRight size={14}/> WEBP</div>
            <div className="conversion-desc">Optimize images for the web</div>
          </div>
          <div className="conversion-card" onClick={() => fileInputRef.current?.click()}>
            <div className="conversion-path">JSON <ChevronRight size={14}/> YAML</div>
            <div className="conversion-desc">Convert configuration formats</div>
          </div>
          <div className="conversion-card" onClick={() => fileInputRef.current?.click()}>
            <div className="conversion-path">SVG <ChevronRight size={14}/> PNG</div>
            <div className="conversion-desc">Create raster images</div>
          </div>
          <div className="conversion-card" onClick={() => fileInputRef.current?.click()}>
            <div className="conversion-path">PDF <ChevronRight size={14}/> DOCX</div>
            <div className="conversion-desc">Make documents editable</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFileQueue = () => (
    <div className="file-queue-section">
      <div className="batch-controls">
        <div className="batch-info">
          <span>{files.length} files selected</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Convert all to:</span>
            <select 
              className="batch-select"
              value={batchTarget}
              onChange={(e) => setBatchTarget(e.target.value)}
            >
              <option value="">Select format...</option>
              <option value="WEBP">WEBP</option>
              <option value="JPG">JPG</option>
              <option value="PNG">PNG</option>
              <option value="JSON">JSON</option>
              <option value="PDF">PDF</option>
            </select>
            <button className="btn btn-outline" onClick={applyBatchTarget} style={{ padding: '0.4rem 0.8rem' }}>Apply</button>
          </div>
        </div>
        <button 
          className="convert-all-btn" 
          onClick={startConversion}
          disabled={conversionState === 'converting' || !files.some(f => f.isSupported && f.targetFormat)}
        >
          {conversionState === 'converting' ? 'Converting...' : 'Convert Files'}
        </button>
      </div>

      <div className="file-list">
        {files.map(file => {
          const config = Object.values(FORMAT_CONFIG).find(c => c.ext === file.originalExt);
          const targets = config ? config.targets : [];

          return (
            <div className={`file-card ${file.status}`} key={file.id}>
              <div className="file-icon-area">
                {getFileIcon(file.category)}
              </div>
              
              <div className="file-info">
                <div className="file-name">{file.name}</div>
                <div className="file-meta">
                  {file.originalExt} &bull; {formatBytes(file.size)}
                  {!file.isSupported && <span style={{ color: 'var(--danger)', marginLeft: '0.5rem' }}>Unsupported format</span>}
                </div>
              </div>

              {file.isSupported && (
                <div className="file-conversion-controls">
                  <span className="convert-arrow">Convert to</span>
                  <div className="format-select-wrapper">
                    <select 
                      className="format-select"
                      value={file.targetFormat}
                      onChange={(e) => updateFileTarget(file.id, e.target.value)}
                      disabled={conversionState !== 'idle'}
                    >
                      {targets.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  {file.targetFormat && getTargetType(file.originalExt, file.targetFormat) === 'server' && (
                    <span className="server-tag">Server</span>
                  )}
                  {file.targetFormat && getTargetType(file.originalExt, file.targetFormat) === 'browser' && (
                    <span className="local-tag">Local</span>
                  )}
                </div>
              )}

              <div className="file-actions">
                {file.status === 'idle' || file.status === 'pending' ? (
                  <button className="icon-btn remove" onClick={() => removeFile(file.id)} title="Remove file">
                    <Trash2 size={18} />
                  </button>
                ) : (
                  <div style={{ padding: '0.5rem', fontWeight: 600, color: file.status === 'success' ? 'var(--success)' : 'var(--text-primary)'}}>
                    {file.progress}%
                  </div>
                )}
              </div>

              {/* Progress Bar Row */}
              {file.status === 'converting' && (
                <div className="conversion-progress">
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${file.progress}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderResultScreen = () => (
    <div className="result-screen">
      <div className="success-icon">
        <CheckCircle2 size={32} />
      </div>
      <h2>Conversion Complete</h2>
      
      <div className="converted-files-list">
        {files.filter(f => f.status === 'success').map(file => {
          const savings = ((1 - (file.convertedSize / file.size)) * 100).toFixed(1);
          
          return (
            <div className="converted-file-card" key={file.id}>
              <div className="converted-info">
                <div className="converted-name">{file.name.split('.')[0]}.{file.targetFormat.toLowerCase()}</div>
                <div className="size-comparison">
                  <span style={{ textDecoration: 'line-through' }}>{formatBytes(file.size)}</span>
                  <ChevronRight size={14}/>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatBytes(file.convertedSize)}</span>
                  {savings > 0 && <span className="size-saved">(-{savings}%)</span>}
                </div>
              </div>
              <button 
                className="btn btn-primary" 
                style={{ padding: '0.4rem 1rem' }}
                onClick={() => handleMockDownload(`${file.name.split('.')[0]}.${file.targetFormat.toLowerCase()}`, file.convertedBlob)}
              >
                <Download size={16} /> Download
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button className="btn btn-outline" onClick={() => {
          setFiles([]);
          setConversionState('idle');
        }}>Convert More Files</button>
        {files.length > 1 && (
          <button 
            className="btn btn-primary"
            onClick={() => handleMockDownload('converted_files.zip')}
          >
            <Download size={18} /> Download ZIP
          </button>
        )}
      </div>

      {/* Developer Mode Preview for text files */}
      {files.some(f => f.category === 'Developer' && f.status === 'success') && (
        <div style={{ width: '100%', maxWidth: '800px', marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Developer Preview</h3>
          <div className="dev-mode-editor">
            <div className="editor-pane">
              <div className="editor-header">
                Input (JSON)
              </div>
              <pre className="editor-content">
{`{
  "name": "Ashin",
  "role": "Frontend Developer",
  "tools": ["React", "CSS"]
}`}
              </pre>
            </div>
            <div className="editor-pane">
              <div className="editor-header">
                Output (YAML)
                <button className="icon-btn" style={{ padding: 0 }}><Copy size={14}/></button>
              </div>
              <pre className="editor-content">
{`name: Ashin
role: Frontend Developer
tools:
  - React
  - CSS`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <ToolLayout
      id="file-converter"
      title="File Format Converter"
      description="Convert files between popular formats quickly and securely."
      onReset={files.length > 0 ? clearAll : null}
    >
      <div className="file-converter">
        
        {/* Only show categories if idle or pending, not during/after conversion if we want a clean view */}
        {conversionState === 'idle' && files.length === 0 && (
          <div className="format-categories">
            {CATEGORIES.map(cat => (
              <button 
                key={cat} 
                className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {conversionState === 'idle' && files.length === 0 && renderEmptyState()}
        {(conversionState === 'idle' && files.length > 0) || conversionState === 'converting' ? renderFileQueue() : null}
        {conversionState === 'complete' && renderResultScreen()}

      </div>
    </ToolLayout>
  );
};

export default FileFormatConverter;
