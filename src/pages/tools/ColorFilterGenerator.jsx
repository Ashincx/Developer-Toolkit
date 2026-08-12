import React, { useState, useEffect, useRef } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { 
  Copy, RefreshCw, Check, Upload, Image as ImageIcon, 
  Home, Search, User, ShoppingCart, Heart, Star, Menu, Settings, X, ArrowRight,
  Sun, Moon
} from 'lucide-react';
import { useToolHistory } from '../../hooks/useToolHistory';
import { hexToCSSFilter } from '../../utils/colorToFilter';
import './ColorFilterGenerator.css';

const popularColors = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Gray', hex: '#6b7280' }
];

const brandColors = [
  { name: 'Facebook', hex: '#1877F2' },
  { name: 'X', hex: '#000000' },
  { name: 'LinkedIn', hex: '#0A66C2' },
  { name: 'YouTube', hex: '#FF0000' },
  { name: 'WhatsApp', hex: '#25D366' },
  { name: 'Discord', hex: '#5865F2' },
  { name: 'GitHub', hex: '#181717' },
  { name: 'Google', hex: '#4285F4' }
];

const icons = [
  { name: 'Home', component: Home },
  { name: 'Search', component: Search },
  { name: 'User', component: User },
  { name: 'Cart', component: ShoppingCart },
  { name: 'Heart', component: Heart },
  { name: 'Star', component: Star },
  { name: 'Menu', component: Menu },
  { name: 'Settings', component: Settings },
  { name: 'Close', component: X },
  { name: 'Arrow', component: ArrowRight }
];

const hexToRgbString = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return 'rgb(0, 0, 0)';
  return `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`;
};

const hexToHslString = (hex) => {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return 'hsl(0, 0%, 0%)';
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if(max === min) { h = s = 0; } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch(max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
};

const ColorFilterGenerator = () => {
  const { state: targetColor, setState: setTargetColor, undo, redo, canUndo, canRedo, history } = useToolHistory('#4F46E5');
  
  const [filterData, setFilterData] = useState({ filter: 'none', loss: 0, accuracy: 100 });
  const [copied, setCopied] = useState(false);
  const [copyFormat, setCopyFormat] = useState('css');
  const [activeIcon, setActiveIcon] = useState('Home');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [previewTheme, setPreviewTheme] = useState('light'); // light, dark, custom
  const [customBg, setCustomBg] = useState('#ffffff');
  const [viewMode, setViewMode] = useState('single'); // single, split
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (targetColor) {
      const result = hexToCSSFilter(targetColor);
      setFilterData(result);
    }
  }, [targetColor]);

  const handleColorChange = (e) => {
    let val = e.target.value;
    if (!val.startsWith('#')) val = '#' + val;
    setTargetColor(val);
  };

  const handleReset = () => {
    setTargetColor('#4F46E5');
    setUploadedImage(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setUploadedImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const getCodeString = () => {
    const filterStr = filterData.filter;
    switch (copyFormat) {
      case 'css':
        return `.icon {\n  filter: ${filterStr.replace(/ /g, '\\n  ').replace(/\\n/g, '\n')};\n}`;
      case 'filter-only':
        return filterStr;
      case 'tailwind':
        return `class="[filter:${filterStr.replace(/ /g, '_')}]"`;
      case 'react':
        return `<img\n  src="/icon.svg"\n  style={{\n    filter: "${filterStr}"\n  }}\n/>`;
      case 'css-var':
        return `:root {\n  --icon-filter:\n    ${filterStr.replace(/ /g, '\\n    ').replace(/\\n/g, '\n')};\n}`;
      default:
        return filterStr;
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getCodeString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderIcon = (filterStyle = {}) => {
    if (uploadedImage) {
      return <img src={uploadedImage} alt="Uploaded" className="preview-svg" style={filterStyle} />;
    }
    const ActiveIconComponent = icons.find(i => i.name === activeIcon)?.component || Home;
    return <ActiveIconComponent size={64} className="preview-svg" style={filterStyle} />;
  };

  const rgbString = hexToRgbString(targetColor);
  const hslString = hexToHslString(targetColor);
  
  // Get recent unique colors from history, excluding current
  const recentColors = Array.from(new Set(history.filter(h => h !== targetColor))).slice(0, 8);

  return (
    <ToolLayout 
      id="color-filter" 
      title="CSS Color Filter Generator" 
      description="Generate CSS filter values that transform black (or monochrome) icons/images into any target color using only CSS filters."
      onUndo={undo}
      onRedo={redo}
      canUndo={canUndo}
      canRedo={canRedo}
      onReset={handleReset}
    >
      <div className="color-filter-container">
        {/* Left Column: Controls */}
        <div className="controls-column">
          
          <div className="control-card target-color-card">
            <h3>Target Color</h3>
            <div className="color-picker-wrapper">
              <input 
                type="color" 
                value={targetColor} 
                onChange={handleColorChange} 
                className="native-color-picker"
              />
              <div className="color-inputs">
                <div className="input-group">
                  <label>HEX</label>
                  <input type="text" value={targetColor} onChange={handleColorChange} />
                </div>
                <div className="input-group">
                  <label>RGB</label>
                  <input type="text" value={rgbString} readOnly className="readonly-input" />
                </div>
                <div className="input-group">
                  <label>HSL</label>
                  <input type="text" value={hslString} readOnly className="readonly-input" />
                </div>
              </div>
            </div>
            
            <div className="accuracy-meter">
              <div className="meter-header">
                <span>Color Match Accuracy</span>
                <span className={filterData.accuracy >= 98 ? 'high-acc' : filterData.accuracy >= 90 ? 'med-acc' : 'low-acc'}>
                  {filterData.accuracy}%
                </span>
              </div>
              <div className="meter-bar-bg">
                <div 
                  className="meter-bar-fill" 
                  style={{ width: `${filterData.accuracy}%`, backgroundColor: targetColor }}
                ></div>
              </div>
              {filterData.accuracy < 90 && (
                <p className="accuracy-warning">Note: Try adjusting the color slightly for a better match.</p>
              )}
            </div>
          </div>

          <div className="control-card icon-selection-card">
            <div className="card-header-flex">
              <h3>Icon Source</h3>
              <button className="btn-upload" onClick={() => fileInputRef.current?.click()}>
                <Upload size={14} /> Upload Image
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/png, image/jpeg, image/svg+xml, image/webp" 
                onChange={handleImageUpload} 
                style={{ display: 'none' }}
              />
            </div>
            
            {!uploadedImage ? (
              <div className="icon-grid">
                {icons.map((icon) => {
                  const IconComp = icon.component;
                  return (
                    <button 
                      key={icon.name}
                      className={`icon-btn ${activeIcon === icon.name ? 'active' : ''}`}
                      onClick={() => setActiveIcon(icon.name)}
                      title={icon.name}
                    >
                      <IconComp size={24} />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="uploaded-image-info">
                <ImageIcon size={20} />
                <span>Custom Image Uploaded</span>
                <button className="btn-clear" onClick={() => setUploadedImage(null)}>Clear</button>
              </div>
            )}
            
            <div className="monochrome-warning">
              <span className="warning-icon">ℹ️</span>
              Best results are achieved with black (#000000) or transparent images.
            </div>
          </div>

          <div className="control-card presets-card">
            <div className="preset-group">
              <h4>Popular Colors</h4>
              <div className="color-swatches">
                {popularColors.map(c => (
                  <button 
                    key={c.name}
                    className="swatch" 
                    style={{ backgroundColor: c.hex }}
                    onClick={() => setTargetColor(c.hex)}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
            
            <div className="preset-group">
              <h4>Brand Colors</h4>
              <div className="color-swatches">
                {brandColors.map(c => (
                  <button 
                    key={c.name}
                    className="swatch brand-swatch" 
                    style={{ backgroundColor: c.hex }}
                    onClick={() => setTargetColor(c.hex)}
                    title={c.name}
                  >
                    {c.name[0]}
                  </button>
                ))}
              </div>
            </div>

            {recentColors.length > 0 && (
              <div className="preset-group history-group">
                <h4>Recent History</h4>
                <div className="color-swatches">
                  {recentColors.map(hex => (
                    <button 
                      key={hex}
                      className="swatch" 
                      style={{ backgroundColor: hex }}
                      onClick={() => setTargetColor(hex)}
                      title={hex}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Preview & Output */}
        <div className="preview-column">
          
          <div className="preview-area-wrapper">
            <div className="preview-controls">
              <div className="view-modes">
                <button 
                  className={`mode-btn ${viewMode === 'single' ? 'active' : ''}`}
                  onClick={() => setViewMode('single')}
                >
                  Live Preview
                </button>
                <button 
                  className={`mode-btn ${viewMode === 'split' ? 'active' : ''}`}
                  onClick={() => setViewMode('split')}
                >
                  Before / After
                </button>
              </div>
              
              <div className="theme-toggles">
                <button 
                  className={`theme-btn ${previewTheme === 'light' ? 'active' : ''}`}
                  onClick={() => setPreviewTheme('light')}
                  title="Light Theme"
                >
                  <Sun size={16} />
                </button>
                <button 
                  className={`theme-btn ${previewTheme === 'dark' ? 'active' : ''}`}
                  onClick={() => setPreviewTheme('dark')}
                  title="Dark Theme"
                >
                  <Moon size={16} />
                </button>
                <input 
                  type="color" 
                  value={customBg} 
                  onChange={(e) => {
                    setCustomBg(e.target.value);
                    setPreviewTheme('custom');
                  }} 
                  className="bg-color-picker"
                  title="Custom Background"
                />
              </div>
            </div>

            <div 
              className={`preview-stage ${previewTheme}`}
              style={previewTheme === 'custom' ? { backgroundColor: customBg } : {}}
            >
              {viewMode === 'single' ? (
                <div className="single-preview">
                  {renderIcon({ filter: filterData.filter })}
                </div>
              ) : (
                <div className="split-preview">
                  <div className="split-pane before">
                    <span className="pane-label">Original (Black)</span>
                    <div className="icon-container">
                      {renderIcon()}
                    </div>
                  </div>
                  <div className="split-divider"></div>
                  <div className="split-pane after">
                    <span className="pane-label">Filtered</span>
                    <div className="icon-container">
                      {renderIcon({ filter: filterData.filter })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="code-output-card">
            <div className="code-tabs">
              <button 
                className={`tab-btn ${copyFormat === 'css' ? 'active' : ''}`}
                onClick={() => setCopyFormat('css')}
              >CSS Class</button>
              <button 
                className={`tab-btn ${copyFormat === 'filter-only' ? 'active' : ''}`}
                onClick={() => setCopyFormat('filter-only')}
              >Filter Only</button>
              <button 
                className={`tab-btn ${copyFormat === 'tailwind' ? 'active' : ''}`}
                onClick={() => setCopyFormat('tailwind')}
              >Tailwind</button>
              <button 
                className={`tab-btn ${copyFormat === 'react' ? 'active' : ''}`}
                onClick={() => setCopyFormat('react')}
              >React/JSX</button>
              <button 
                className={`tab-btn ${copyFormat === 'css-var' ? 'active' : ''}`}
                onClick={() => setCopyFormat('css-var')}
              >CSS Variable</button>
            </div>
            
            <div className="code-editor-wrapper">
              <div className="code-header">
                <span className="lang-label">
                  {copyFormat === 'react' ? 'JSX' : copyFormat === 'tailwind' ? 'HTML' : 'CSS'}
                </span>
                <button onClick={copyToClipboard} className="copy-btn">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre><code>{getCodeString()}</code></pre>
            </div>
          </div>
          
        </div>
      </div>
    </ToolLayout>
  );
};

export default ColorFilterGenerator;
