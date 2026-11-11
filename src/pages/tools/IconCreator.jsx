import React, { useState, useRef } from 'react';
import { Download, RefreshCw, Lock, Unlock } from 'lucide-react';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import './IconCreator.css';

const PRESETS = [
  { bg: '#3B82F6', color: '#FFFFFF', text: 'Dev', font: 'Inter', radius: 32 },
  { bg: '#10B981', color: '#FFFFFF', text: 'App', font: 'Montserrat', radius: 48 },
  { bg: '#8B5CF6', color: '#FFFFFF', text: 'Pro', font: 'Poppins', radius: 16 },
  { bg: '#F59E0B', color: '#1F2937', text: 'JS', font: 'Roboto', radius: 128 },
  { bg: '#EF4444', color: '#FFFFFF', text: 'UI', font: 'Inter', radius: 24 },
  { bg: '#EC4899', color: '#FFFFFF', text: 'HQ', font: 'Oswald', radius: 0 },
  { bg: '#14B8A6', color: '#FFFFFF', text: 'API', font: 'System UI', radius: 64 },
  { bg: '#6366F1', color: '#FFFFFF', text: 'CSS', font: 'Montserrat', radius: 128 }
];

const FONTS = ['Inter', 'Montserrat', 'Poppins', 'Roboto', 'Oswald', 'Open Sans', 'System UI', 'Courier New', 'Arial'];

const POPULAR_SIZES = [16, 32, 48, 64, 128, 256, 512, 1024, 2048];

const IconCreator = () => {
  const [text, setText] = useState('LR');
  const [fontSize, setFontSize] = useState(120);
  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontWeight, setFontWeight] = useState('700');
  const [lineHeight, setLineHeight] = useState(1.2);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [bgColor, setBgColor] = useState('#4F46E5');
  const [borderRadius, setBorderRadius] = useState(0);

  // Size and export states
  const [iconSize, setIconSize] = useState('custom');
  const [customWidth, setCustomWidth] = useState(512);
  const [customHeight, setCustomHeight] = useState(512);
  const [lockAspect, setLockAspect] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  const iconRef = useRef(null);
  const widthInputRef = useRef(null);

  const handlePresetChange = (e) => {
    const val = e.target.value;
    if (val === 'custom') {
      setIconSize('custom');
      setTimeout(() => widthInputRef.current?.focus(), 50);
    } else {
      const num = parseInt(val, 10);
      setIconSize(num);
      setCustomWidth(num);
      setCustomHeight(num);
    }
  };

  const handleWidthChange = (val) => {
    const cleaned = String(val).replace(/\D/g, '').slice(0, 4);
    setCustomWidth(cleaned);
    if (lockAspect) {
      setCustomHeight(cleaned);
    }
  };

  const handleHeightChange = (val) => {
    const cleaned = String(val).replace(/\D/g, '').slice(0, 4);
    setCustomHeight(cleaned);
    if (lockAspect) {
      setCustomWidth(cleaned);
    }
  };

  const handleBlurWidth = () => {
    const num = parseInt(customWidth, 10);
    if (!customWidth || isNaN(num) || num < 1) {
      setCustomWidth(512);
      if (lockAspect) setCustomHeight(512);
    } else {
      const clamped = Math.min(Math.max(16, num), 4096);
      setCustomWidth(clamped);
      if (lockAspect) setCustomHeight(clamped);
    }
  };

  const handleBlurHeight = () => {
    const num = parseInt(customHeight, 10);
    if (!customHeight || isNaN(num) || num < 1) {
      setCustomHeight(512);
      if (lockAspect) setCustomWidth(512);
    } else {
      const clamped = Math.min(Math.max(16, num), 4096);
      setCustomHeight(clamped);
      if (lockAspect) setCustomWidth(clamped);
    }
  };

  const toggleLockAspect = () => {
    if (!lockAspect) {
      const num = parseInt(customWidth, 10) || 512;
      setCustomHeight(num);
    }
    setLockAspect(!lockAspect);
  };

  const handleQuickSize = (size) => {
    setCustomWidth(size);
    setCustomHeight(size);
  };

  const handleDownload = async (format = 'jpeg') => {
    if (!iconRef.current || isExporting) return;
    
    setIsExporting(true);
    try {
      const width = iconSize === 'custom'
        ? Math.min(Math.max(16, parseInt(customWidth, 10) || 512), 4096)
        : iconSize;
      const height = iconSize === 'custom'
        ? Math.min(Math.max(16, parseInt(customHeight, 10) || 512), 4096)
        : iconSize;

      let sourceCanvas;
      if (width === height) {
        sourceCanvas = await html2canvas(iconRef.current, {
          backgroundColor: null,
          scale: width / 256, // Internal preview size is 256x256
          logging: false,
          useCORS: true
        });
      } else {
        // For non-square dimensions, render an offscreen container matching exact dimensions
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '-9999px';
        tempContainer.style.width = `${width}px`;
        tempContainer.style.height = `${height}px`;
        tempContainer.style.backgroundColor = bgColor;
        const scaleFactor = Math.min(width, height) / 256;
        tempContainer.style.borderRadius = `${borderRadius * scaleFactor}px`;
        tempContainer.style.display = 'flex';
        tempContainer.style.alignItems = 'center';
        tempContainer.style.justifyContent = 'center';
        tempContainer.style.overflow = 'hidden';

        const tempText = document.createElement('div');
        tempText.className = 'icon-text-content';
        tempText.style.color = textColor;
        tempText.style.fontFamily = `"${fontFamily}", sans-serif`;
        tempText.style.fontSize = `${fontSize * scaleFactor}px`;
        tempText.style.fontWeight = fontWeight;
        tempText.style.lineHeight = lineHeight;
        tempText.style.textAlign = 'center';
        tempText.style.whiteSpace = 'pre-line';
        tempText.innerText = text || ' ';

        tempContainer.appendChild(tempText);
        document.body.appendChild(tempContainer);

        sourceCanvas = await html2canvas(tempContainer, {
          backgroundColor: null,
          scale: 1,
          logging: false,
          useCORS: true
        });

        document.body.removeChild(tempContainer);
      }

      const isJpg = format === 'jpeg' || format === 'jpg';
      let finalCanvas = sourceCanvas;

      if (isJpg) {
        // Compositing onto a white canvas prevents dark/black artifacts around transparent rounded borders in JPEG
        const jpgCanvas = document.createElement('canvas');
        jpgCanvas.width = sourceCanvas.width;
        jpgCanvas.height = sourceCanvas.height;
        const ctx = jpgCanvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, jpgCanvas.width, jpgCanvas.height);
        ctx.drawImage(sourceCanvas, 0, 0);
        finalCanvas = jpgCanvas;
      }
      
      const mimeType = isJpg ? 'image/jpeg' : 'image/png';
      const fileExt = isJpg ? 'jpg' : 'png';
      const slug = text.trim() ? text.trim().toLowerCase().replace(/[^a-z0-9_-]/gi, '_') : 'icon';

      finalCanvas.toBlob(
        (blob) => {
          if (blob) {
            saveAs(blob, `icon-${slug}-${width}x${height}.${fileExt}`);
          }
          setIsExporting(false);
        },
        mimeType,
        0.95
      );
    } catch (err) {
      console.error('Error generating icon:', err);
      setIsExporting(false);
    }
  };

  const applyPreset = (preset) => {
    setText(preset.text);
    setBgColor(preset.bg);
    setTextColor(preset.color);
    setFontFamily(preset.font);
    setBorderRadius(preset.radius);
  };

  const handleRandomize = () => {
    const randomColor = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    setBgColor(randomColor());
    setTextColor(Math.random() > 0.5 ? '#FFFFFF' : '#000000');
    setFontFamily(FONTS[Math.floor(Math.random() * FONTS.length)]);
    setBorderRadius(Math.floor(Math.random() * 64));
  };

  return (
    <div className="icon-creator-container">
      <div className="tool-header">
        <h1>Icon Creator</h1>
        <p>Generate beautiful text-based square icons for your projects.</p>
      </div>

      <div className="icon-creator-content">
        <div className="controls-panel">
          <div className="control-group">
            <label>Icon Text (max 6 chars)</label>
            <input 
              type="text" 
              className="control-input"
              value={text}
              onChange={(e) => setText(e.target.value.substring(0, 6))}
              placeholder="e.g. LR, 26"
            />
          </div>

          {/* Font Size */}
          <div className="control-group">
            <div className="range-header">
              <label>Font Size</label>
              <span className="range-value">{fontSize}px</span>
            </div>
            <input 
              type="range" 
              min="20" 
              max="200" 
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
            />
          </div>

          {/* Line Height */}
          <div className="control-group">
            <div className="range-header">
              <label>Line Height</label>
              <span className="range-value">{lineHeight}</span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="2.5" 
              step="0.1"
              value={lineHeight}
              onChange={(e) => setLineHeight(parseFloat(e.target.value))}
            />
          </div>

          {/* Border Radius */}
          <div className="control-group">
            <div className="range-header">
              <label>Border Radius</label>
              <span className="range-value">{borderRadius}px</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="128" 
              value={borderRadius}
              onChange={(e) => setBorderRadius(parseInt(e.target.value))}
            />
          </div>

          {/* Font Family */}
          <div className="control-group">
            <label>Font Family</label>
            <select 
              className="control-input select-input"
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
            >
              {FONTS.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>

          {/* Font Weight */}
          <div className="control-group">
            <label>Font Weight</label>
            <select 
              className="control-input select-input"
              value={fontWeight}
              onChange={(e) => setFontWeight(e.target.value)}
            >
              <option value="300">Light (300)</option>
              <option value="400">Regular (400)</option>
              <option value="500">Medium (500)</option>
              <option value="700">Bold (700)</option>
              <option value="900">Extra Bold (900)</option>
            </select>
          </div>

          {/* Colors */}
          <div className="color-pickers-row">
            <div className="control-group">
              <label>Text Color</label>
              <input 
                type="color" 
                className="control-input"
                style={{height: '40px', padding: '2px 6px'}}
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
              />
            </div>
            <div className="control-group">
              <label>Background</label>
              <input 
                type="color" 
                className="control-input"
                style={{height: '40px', padding: '2px 6px'}}
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
              />
            </div>
          </div>

          <div className="control-group">
            <label>Quick Presets</label>
            <div className="presets-grid">
              {PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  className="preset-btn"
                  style={{
                    backgroundColor: preset.bg,
                    color: preset.color,
                    borderRadius: preset.radius >= 128 ? '50%' : `${Math.round((preset.radius / 256) * 100)}%`
                  }}
                  onClick={() => applyPreset(preset)}
                >
                  {preset.text.substring(0, 2)}
                </button>
              ))}
            </div>
          </div>
          
          <button className="btn-secondary" style={{width: '100%', justifyContent: 'center'}} onClick={handleRandomize}>
            <RefreshCw size={16} /> Randomize Styles
          </button>
        </div>

        <div className="preview-panel">
          <div className="preview-canvas-container">
            <div 
              ref={iconRef}
              className="icon-preview-box"
              style={{
                width: '256px',
                height: '256px',
                backgroundColor: bgColor,
                borderRadius: `${borderRadius}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div 
                className="icon-text-content"
                style={{
                  color: textColor,
                  fontFamily: `"${fontFamily}", sans-serif`,
                  fontSize: `${fontSize}px`,
                  fontWeight: fontWeight,
                  lineHeight: lineHeight
                }}
              >
                {text || ' '}
              </div>
            </div>
          </div>

          <div className="export-panel">
            <div className="export-header">
              <div className="export-title">Export Settings</div>
              <div className="export-size-badge">
                {iconSize === 'custom' ? `${customWidth || 512} × ${customHeight || 512}` : `${iconSize} × ${iconSize}`} px
              </div>
            </div>

            {/* Select Dropdown (with 128, 256, 512, 1024 removed) */}
            <div className="control-group" style={{ marginBottom: iconSize === 'custom' ? '14px' : '20px' }}>
              <label>Export Size (px)</label>
              <select 
                className="control-input select-input"
                value={iconSize}
                onChange={handlePresetChange}
              >
                <option value="40">40 × 40</option>
                <option value="64">64 × 64</option>
                <option value="custom">Custom Size</option>
              </select>
            </div>

            {/* Custom Sizes Area - visible only when Custom Size is selected in the dropdown */}
            {iconSize === 'custom' && (
              <div className="custom-size-box">
                <div className="custom-size-header">
                  <label className="custom-size-label">Custom Dimensions</label>
                  <button 
                    type="button"
                    className={`aspect-toggle-btn ${lockAspect ? 'locked' : ''}`}
                    onClick={toggleLockAspect}
                    title={lockAspect ? '1:1 Square Ratio Locked' : 'Ratio Unlocked (Free Size)'}
                  >
                    {lockAspect ? <Lock size={12} /> : <Unlock size={12} />}
                    <span>{lockAspect ? '1:1 Ratio' : 'Free Ratio'}</span>
                  </button>
                </div>

                <div className="custom-size-inputs-row">
                  <div className="dimension-input-group">
                    <span className="dimension-tag">W</span>
                    <input 
                      ref={widthInputRef}
                      type="text"
                      inputMode="numeric"
                      className="control-input dimension-input"
                      value={customWidth}
                      onChange={(e) => handleWidthChange(e.target.value)}
                      onBlur={handleBlurWidth}
                      placeholder="512"
                    />
                    <span className="dimension-unit">px</span>
                  </div>

                  <span className="dimension-separator">×</span>

                  <div className="dimension-input-group">
                    <span className="dimension-tag">H</span>
                    <input 
                      type="text"
                      inputMode="numeric"
                      className="control-input dimension-input"
                      value={customHeight}
                      onChange={(e) => handleHeightChange(e.target.value)}
                      onBlur={handleBlurHeight}
                      placeholder="512"
                    />
                    <span className="dimension-unit">px</span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="popular-sizes-wrap">
                  <span className="popular-sizes-label">Popular:</span>
                  <div className="popular-sizes-chips">
                    {POPULAR_SIZES.map((size) => (
                      <button
                        key={size}
                        type="button"
                        className={`size-chip ${Number(customWidth) === size && Number(customHeight) === size ? 'active' : ''}`}
                        onClick={() => handleQuickSize(size)}
                        title={`Set size to ${size}×${size}px`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Actions: Download JPG is default/primary button */}
            <div className="export-actions">
              <button 
                className="btn-primary" 
                onClick={() => handleDownload('jpeg')}
                disabled={isExporting}
              >
                <Download size={18} /> {isExporting ? 'Exporting...' : 'Download JPG'}
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => handleDownload('png')}
                disabled={isExporting}
              >
                Download PNG
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IconCreator;
