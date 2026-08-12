import React, { useState, useRef } from 'react';
import { Download, RefreshCw, Type, Layout } from 'lucide-react';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import './IconCreator.css';

const PRESETS = [
  { bg: '#3B82F6', color: '#FFFFFF', text: 'Dev', font: 'Inter', radius: 16 },
  { bg: '#10B981', color: '#FFFFFF', text: 'App', font: 'Montserrat', radius: 24 },
  { bg: '#8B5CF6', color: '#FFFFFF', text: 'Pro', font: 'Poppins', radius: 8 },
  { bg: '#F59E0B', color: '#1F2937', text: 'JS', font: 'Roboto', radius: 50 },
  { bg: '#EF4444', color: '#FFFFFF', text: 'UI', font: 'Inter', radius: 12 },
  { bg: '#EC4899', color: '#FFFFFF', text: 'HQ', font: 'Oswald', radius: 0 },
  { bg: '#14B8A6', color: '#FFFFFF', text: 'API', font: 'System UI', radius: 30 },
  { bg: '#6366F1', color: '#FFFFFF', text: 'CSS', font: 'Montserrat', radius: 50 }
];

const FONTS = ['Inter', 'Montserrat', 'Poppins', 'Roboto', 'Oswald', 'Open Sans', 'System UI', 'Courier New', 'Arial'];

const IconCreator = () => {
  const [text, setText] = useState('LR');
  const [fontSize, setFontSize] = useState(120);
  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontWeight, setFontWeight] = useState('700');
  const [lineHeight, setLineHeight] = useState(1.2);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [bgColor, setBgColor] = useState('#4F46E5');
  const [borderRadius, setBorderRadius] = useState(24);
  const [iconSize, setIconSize] = useState(512);
  
  const iconRef = useRef(null);

  const handleDownload = async (format = 'png') => {
    if (!iconRef.current) return;
    
    try {
      const canvas = await html2canvas(iconRef.current, {
        backgroundColor: null,
        scale: iconSize / 256, // Internal preview size is 256x256
        logging: false,
        useCORS: true
      });
      
      canvas.toBlob((blob) => {
        saveAs(blob, `icon-${text.toLowerCase()}-${iconSize}x${iconSize}.${format}`);
      }, `image/${format}`);
    } catch (err) {
      console.error('Error generating icon:', err);
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
    setBorderRadius(Math.floor(Math.random() * 50));
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
            <div className="range-header">
              <label>Border Radius</label>
              <span className="range-value">{borderRadius}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="50" 
              value={borderRadius}
              onChange={(e) => setBorderRadius(parseInt(e.target.value))}
            />
          </div>

          <div className="control-group">
            <label>Quick Presets</label>
            <div className="presets-grid">
              {PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  className="preset-btn"
                  style={{ backgroundColor: preset.bg, color: preset.color, borderRadius: `${preset.radius}%` }}
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
                borderRadius: `${borderRadius}%`,
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
            </div>
            <div className="control-group" style={{marginBottom: '20px'}}>
              <label>Export Size (px)</label>
              <select 
                className="control-input select-input"
                value={iconSize}
                onChange={(e) => setIconSize(parseInt(e.target.value))}
              >
                <option value="40">40 × 40</option>
                <option value="64">64 × 64</option>
                <option value="128">128 × 128</option>
                <option value="256">256 × 256</option>
                <option value="512">512 × 512</option>
                <option value="1024">1024 × 1024</option>
              </select>
            </div>
            
            <div className="export-actions">
              <button className="btn-primary" onClick={() => handleDownload('png')}>
                <Download size={18} /> Download PNG
              </button>
              <button className="btn-secondary" onClick={() => handleDownload('jpeg')}>
                Download JPG
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IconCreator;
