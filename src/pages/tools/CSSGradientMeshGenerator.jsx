import React, { useState, useRef, useEffect, useCallback } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { Copy, Check, Plus, Trash2, Shuffle, Pipette, Grid, Maximize2, Minimize2, Eye, Edit2 } from 'lucide-react';
import './CSSGradientMeshGenerator.css';

const PRESETS = [
  { name: 'Aurora', baseColor: '#0a0a1a', points: [ {x: 20, y: 20, color: '#4f46e5', intensity: 50}, {x: 80, y: 30, color: '#9333ea', intensity: 60}, {x: 50, y: 80, color: '#0ea5e9', intensity: 55}, {x: 80, y: 80, color: '#10b981', intensity: 45} ] },
  { name: 'Sunset', baseColor: '#1a0500', points: [ {x: 10, y: 90, color: '#dc2626', intensity: 60}, {x: 50, y: 80, color: '#ea580c', intensity: 70}, {x: 90, y: 20, color: '#ca8a04', intensity: 50}, {x: 20, y: 20, color: '#be185d', intensity: 60} ] },
  { name: 'Ocean', baseColor: '#041c2c', points: [ {x: 20, y: 20, color: '#0369a1', intensity: 65}, {x: 80, y: 20, color: '#0284c7', intensity: 55}, {x: 50, y: 80, color: '#0d9488', intensity: 60} ] },
  { name: 'Cyber', baseColor: '#000000', points: [ {x: 10, y: 10, color: '#ff003c', intensity: 45}, {x: 90, y: 10, color: '#00f0ff', intensity: 45}, {x: 50, y: 90, color: '#7000ff', intensity: 55} ] },
  { name: 'Pastel', baseColor: '#fdfdfd', points: [ {x: 25, y: 25, color: '#fbcfe8', intensity: 60}, {x: 75, y: 25, color: '#bfdbfe', intensity: 60}, {x: 50, y: 75, color: '#bbf7d0', intensity: 60} ] },
  { name: 'Neon', baseColor: '#09090b', points: [ {x: 20, y: 50, color: '#fb00ff', intensity: 50}, {x: 80, y: 50, color: '#00ffcc', intensity: 50}, {x: 50, y: 20, color: '#ffff00', intensity: 40} ] }
];

const CSSGradientMeshGenerator = () => {
  // State
  const [points, setPoints] = useState([
    { id: 1, x: 20, y: 30, color: '#7C3AED', intensity: 50 },
    { id: 2, x: 80, y: 20, color: '#EC4899', intensity: 45 },
    { id: 3, x: 50, y: 80, color: '#06B6D4', intensity: 55 }
  ]);
  const [baseColor, setBaseColor] = useState('#0B0B12');
  
  const [settings, setSettings] = useState({
    blur: 0,
    aspectRatio: '16/9',
    compactCSS: false
  });

  const [animation, setAnimation] = useState({
    enabled: false,
    speed: 'Medium'
  });

  const [cssFormat, setCssFormat] = useState('property');
  const [copied, setCopied] = useState(false);
  const [copiedBg, setCopiedBg] = useState(false);
  
  // Interaction state
  const canvasRef = useRef(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [hoverPoint, setHoverPoint] = useState(null);

  // View state
  const [mode, setMode] = useState('edit');
  const [showGrid, setShowGrid] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // History (Undo/Redo)
  const [history, setHistory] = useState([{ points: JSON.parse(JSON.stringify(points)), baseColor }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const saveToHistory = useCallback((newPoints, newBaseColor) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ points: JSON.parse(JSON.stringify(newPoints)), baseColor: newBaseColor });
    if (newHistory.length > 50) newHistory.shift(); // limit history size
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const state = history[historyIndex - 1];
      setPoints(JSON.parse(JSON.stringify(state.points)));
      setBaseColor(state.baseColor);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const state = history[historyIndex + 1];
      setPoints(JSON.parse(JSON.stringify(state.points)));
      setBaseColor(state.baseColor);
    }
  }, [history, historyIndex]);

  const handleReset = () => {
    const defaultPoints = [
      { id: 1, x: 20, y: 30, color: '#7C3AED', intensity: 50 },
      { id: 2, x: 80, y: 20, color: '#EC4899', intensity: 45 },
      { id: 3, x: 50, y: 80, color: '#06B6D4', intensity: 55 }
    ];
    setPoints(defaultPoints);
    setBaseColor('#0B0B12');
    setAnimation({ enabled: false, speed: 'Medium' });
    saveToHistory(defaultPoints, '#0B0B12');
  };

  // Generate the background value
  const generateGradientCSS = (pts, bgColor, compact) => {
    const gradients = pts.map(p => {
      let c1, c2, c3;
      if (p.color.startsWith('#')) {
        let hex = p.color.replace('#', '');
        if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
        const r = parseInt(hex.substring(0,2), 16);
        const g = parseInt(hex.substring(2,4), 16);
        const b = parseInt(hex.substring(4,6), 16);
        c1 = `rgba(${r}, ${g}, ${b}, 1)`;
        c2 = `rgba(${r}, ${g}, ${b}, 0.8)`;
        c3 = `rgba(${r}, ${g}, ${b}, 0.4)`;
      } else if (p.color.startsWith('hsl')) {
        const match = p.color.match(/hsl\((.*?)\)/);
        if (match) {
          const vals = match[1];
          c1 = `hsla(${vals}, 1)`;
          c2 = `hsla(${vals}, 0.8)`;
          c3 = `hsla(${vals}, 0.4)`;
        } else {
          c1 = c2 = c3 = p.color;
        }
      } else {
        c1 = c2 = c3 = p.color;
      }

      const s1 = 0;
      const s2 = Math.round(p.intensity * 0.25);
      const s3 = Math.round(p.intensity * 0.5);
      const s4 = p.intensity;

      const stops = `${c1} ${s1}%, ${c2} ${s2}%, ${c3} ${s3}%, transparent ${s4}%`;
      return `radial-gradient(circle at ${Math.round(p.x)}% ${Math.round(p.y)}%, ${stops})`;
    });
    
    const bgString = gradients.join(compact ? ', ' : ',\n    ');
    
    if (bgColor && bgColor !== 'transparent') {
      return compact ? `${bgString}, ${bgColor}` : `${bgString},\n    ${bgColor}`;
    }
    return bgString;
  };

  const backgroundValue = generateGradientCSS(points, baseColor, settings.compactCSS);

  // Generate CSS based on format
  const getFullCSS = () => {
    let cssText = '';
    
    if (cssFormat === 'property') {
      cssText = `background: ${settings.compactCSS ? backgroundValue : `\n    ${backgroundValue}`};`;
      if (settings.blur > 0) {
        cssText += `\nfilter: blur(${settings.blur}px);`;
      }
    } else if (cssFormat === 'class') {
      cssText = `.mesh-gradient {\n  width: 100%;\n  height: 100%;\n  background: ${settings.compactCSS ? backgroundValue : `\n    ${backgroundValue}`};`;
      if (settings.blur > 0) {
        cssText += `\n  filter: blur(${settings.blur}px);`;
      }
      if (animation.enabled) {
        const speedMap = { 'Slow': '15s', 'Medium': '8s', 'Fast': '4s' };
        cssText += `\n  animation: meshMove ${speedMap[animation.speed]} ease-in-out infinite alternate;`;
      }
      cssText += `\n}`;
      
      if (animation.enabled) {
        cssText += `\n\n@keyframes meshMove {\n  0% { background-position: 0% 0%; }\n  100% { background-position: 100% 100%; }\n}`;
      }
    } else if (cssFormat === 'inline') {
      cssText = `style="background: ${backgroundValue};${settings.blur > 0 ? ` filter: blur(${settings.blur}px);` : ''}"`;
    }
    
    return cssText;
  };

  // Interactions
  const copyToClipboard = (text, type = 'full') => {
    navigator.clipboard.writeText(text);
    if (type === 'full') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopiedBg(true);
      setTimeout(() => setCopiedBg(false), 2000);
    }
  };

  const handlePointChange = (index, field, value) => {
    const newPoints = [...points];
    
    if (field === 'color') {
      newPoints[index][field] = value;
    } else {
      let numValue = parseInt(value, 10);
      if (isNaN(numValue)) numValue = 0;
      if (numValue < 0) numValue = 0;
      if (numValue > 150) numValue = 150;
      newPoints[index][field] = numValue;
    }
    
    setPoints(newPoints);
    saveToHistory(newPoints, baseColor);
  };

  const addPoint = () => {
    if (points.length >= 12) return;
    const newPoints = [...points];
    const newId = points.length > 0 ? Math.max(...points.map(p => p.id)) + 1 : 1;
    newPoints.push({
      id: newId,
      x: 50,
      y: 50,
      color: '#ffffff',
      intensity: 50
    });
    setPoints(newPoints);
    setSelectedPoint(newPoints.length - 1);
    setMode('edit');
    saveToHistory(newPoints, baseColor);
  };

  const deletePoint = (index) => {
    const newPoints = points.filter((_, i) => i !== index);
    setPoints(newPoints);
    if (selectedPoint === index) setSelectedPoint(null);
    else if (selectedPoint > index) setSelectedPoint(selectedPoint - 1);
    saveToHistory(newPoints, baseColor);
  };

  const loadPreset = (preset) => {
    const newPoints = JSON.parse(JSON.stringify(preset.points)).map((p, i) => ({...p, id: i + 1}));
    setPoints(newPoints);
    setBaseColor(preset.baseColor);
    saveToHistory(newPoints, preset.baseColor);
  };

  const randomize = () => {
    const numPoints = Math.floor(Math.random() * 4) + 3; // 3 to 6 points
    const baseHue = Math.floor(Math.random() * 360);
    const isDark = Math.random() > 0.5;
    
    const newBaseColor = isDark ? `hsl(${baseHue}, 20%, 5%)` : `hsl(${baseHue}, 20%, 95%)`;
    
    const newPoints = [];
    for (let i = 0; i < numPoints; i++) {
      const hueOffset = (i * (Math.random() > 0.5 ? 30 : 120)) % 360;
      const hue = (baseHue + hueOffset) % 360;
      const s = Math.floor(Math.random() * 40) + 60;
      const l = Math.floor(Math.random() * 30) + (isDark ? 40 : 50);
      
      newPoints.push({
        id: i + 1,
        x: Math.floor(Math.random() * 100),
        y: Math.floor(Math.random() * 100),
        color: `hsl(${hue}, ${s}%, ${l}%)`,
        intensity: Math.floor(Math.random() * 40) + 40
      });
    }
    
    setPoints(newPoints);
    setBaseColor(newBaseColor);
    saveToHistory(newPoints, newBaseColor);
  };

  // Dragging Logic
  const handlePointerDown = (e, index) => {
    e.preventDefault();
    if (mode !== 'edit') setMode('edit');
    setDragIndex(index);
    setSelectedPoint(index);
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (dragIndex === null || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    
    const newPoints = [...points];
    newPoints[dragIndex] = { ...newPoints[dragIndex], x, y };
    setPoints(newPoints);
  };

  const handlePointerUp = (e) => {
    if (dragIndex !== null) {
      e.target.releasePointerCapture(e.pointerId);
      setDragIndex(null);
      saveToHistory(points, baseColor);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }
      
      // Fullscreen exit
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        return;
      }

      // Point movement
      if (selectedPoint !== null && points[selectedPoint] && mode === 'edit') {
        const step = e.shiftKey ? 5 : 1;
        let dx = 0;
        let dy = 0;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;
        
        if (dx !== 0 || dy !== 0) {
          e.preventDefault();
          const newPoints = [...points];
          newPoints[selectedPoint] = {
            ...newPoints[selectedPoint],
            x: Math.max(0, Math.min(100, newPoints[selectedPoint].x + dx)),
            y: Math.max(0, Math.min(100, newPoints[selectedPoint].y + dy))
          };
          setPoints(newPoints);
        }
      }
    };
    
    const handleKeyUp = (e) => {
      if (selectedPoint !== null && points[selectedPoint] && mode === 'edit') {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          saveToHistory(points, baseColor);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [points, selectedPoint, baseColor, isFullscreen, mode, undo, redo, saveToHistory]);

  const getPreviewStyle = () => {
    const style = {
      background: backgroundValue,
    };
    
    if (settings.blur > 0) {
      style.filter = `blur(${settings.blur}px)`;
    }
    
    if (animation.enabled) {
      style.backgroundSize = '200% 200%';
      const speedMap = { 'Slow': '15s', 'Medium': '8s', 'Fast': '4s' };
      style.animation = `meshGradientMove ${speedMap[animation.speed]} ease-in-out infinite alternate`;
    }
    
    return style;
  };

  useEffect(() => {
    if (animation.enabled) {
      let styleEl = document.getElementById('mesh-anim-style');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'mesh-anim-style';
        styleEl.innerHTML = `@keyframes meshGradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }`;
        document.head.appendChild(styleEl);
      }
    }
  }, [animation.enabled]);

  return (
    <ToolLayout 
      id="mesh-gradient" 
      title="CSS Gradient Mesh Generator" 
      description="Create beautiful mesh gradients visually and generate ready-to-use CSS."
      onUndo={undo}
      onRedo={redo}
      canUndo={historyIndex > 0}
      canRedo={historyIndex < history.length - 1}
      onReset={handleReset}
    >
      <div className="mesh-generator">
        {/* LEFT COLUMN: Controls */}
        <div className="generator-sidebar">
          
          <button className="add-point-btn" onClick={randomize} style={{ borderStyle: 'solid', background: 'var(--accent-glow)' }}>
            <Shuffle size={16} /> Randomize Gradient
          </button>

          <div className="controls-card">
            <h3>
              Gradient Points
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{points.length}/12</span>
            </h3>
            
            <div className="points-list">
              {points.map((point, index) => (
                <div 
                  className={`point-row ${selectedPoint === index ? 'selected' : ''}`} 
                  key={point.id}
                  onClick={() => { setSelectedPoint(index); setMode('edit'); }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '0.75rem' }}>
                    <input 
                      type="color" 
                      className="color-picker"
                      value={point.color.startsWith('#') ? point.color : '#000000'}
                      onChange={(e) => handlePointChange(index, 'color', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      title="Change Color"
                    />
                    
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Point 0{index + 1}</span>
                        <span>{point.intensity}% Spread</span>
                      </div>
                      <input 
                        type="range" 
                        min="10" 
                        max="150" 
                        value={point.intensity} 
                        onChange={(e) => handlePointChange(index, 'intensity', e.target.value)} 
                        style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <button 
                      className="delete-btn" 
                      onClick={(e) => { e.stopPropagation(); deletePoint(index); }}
                      title="Delete Point"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              className="add-point-btn" 
              onClick={addPoint}
              disabled={points.length >= 12}
            >
              <Plus size={16} /> Add Color Point
            </button>
          </div>

          <div className="controls-card">
            <h3>Background Settings</h3>
            <div className="color-input-wrapper">
              <input 
                type="color" 
                className="color-picker" 
                value={baseColor.startsWith('#') ? baseColor : '#000000'} 
                onChange={(e) => { setBaseColor(e.target.value); saveToHistory(points, e.target.value); }} 
              />
              <input 
                type="text" 
                className="hex-input" 
                value={baseColor} 
                onChange={(e) => { setBaseColor(e.target.value); saveToHistory(points, e.target.value); }} 
                placeholder="Transparent or HEX"
              />
            </div>
            
            <div className="control-group" style={{ marginTop: '1.5rem' }}>
              <div className="control-header">
                <label>Overall Blur</label>
                <span>{settings.blur}px</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={settings.blur} 
                onChange={(e) => setSettings({...settings, blur: e.target.value})} 
              />
            </div>
          </div>

          <div className="controls-card">
            <h3>Animation</h3>
            <div className="toggle-group">
              <label>Animate Gradient</label>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={animation.enabled} 
                  onChange={(e) => setAnimation({...animation, enabled: e.target.checked})} 
                />
                <span className="slider"></span>
              </label>
            </div>
            {animation.enabled && (
              <div className="control-group" style={{ marginTop: '1rem' }}>
                <div className="control-header">
                  <label>Speed</label>
                  <select 
                    style={{ padding: '0.2rem', background: 'var(--bg-primary)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                    value={animation.speed}
                    onChange={(e) => setAnimation({...animation, speed: e.target.value})}
                  >
                    <option value="Slow">Slow</option>
                    <option value="Medium">Medium</option>
                    <option value="Fast">Fast</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="controls-card">
            <h3>Presets</h3>
            <div className="presets-grid">
              {PRESETS.map((preset, idx) => {
                const miniBg = preset.points.map(p => `radial-gradient(at ${p.x}% ${p.y}%, ${p.color} 0px, transparent ${p.intensity}%)`).join(',') + `, ${preset.baseColor}`;
                return (
                  <button key={idx} className="preset-btn" onClick={() => loadPreset(preset)}>
                    <div className="preset-preview" style={{ background: miniBg }}></div>
                    <span>{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
        </div>

        {/* RIGHT COLUMN: Preview & Code */}
        <div className="generator-main">
          
          <div className={`preview-card ${isFullscreen ? 'fullscreen-mode' : ''}`}>
            {!isFullscreen && (
              <div className="preview-header">
                <div className="preview-mode-toggle">
                  <button 
                    className={`mode-btn ${mode === 'edit' ? 'active' : ''}`}
                    onClick={() => setMode('edit')}
                  >
                    <Edit2 size={14} /> Edit Points
                  </button>
                  <button 
                    className={`mode-btn ${mode === 'preview' ? 'active' : ''}`}
                    onClick={() => setMode('preview')}
                  >
                    <Eye size={14} /> Preview
                  </button>
                </div>
                
                <div className="preview-controls">
                  <div className="aspect-ratio-toggles" style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    {['16/9', '4/3', '1/1', 'auto'].map(ratio => (
                      <button
                        key={ratio}
                        onClick={() => setSettings({...settings, aspectRatio: ratio})}
                        style={{
                          padding: '0.2rem 0.6rem',
                          fontSize: '0.8rem',
                          background: settings.aspectRatio === ratio ? 'var(--accent-primary)' : 'transparent',
                          color: settings.aspectRatio === ratio ? 'white' : 'var(--text-secondary)',
                          border: 'none',
                          borderRadius: 'calc(var(--radius-sm) - 2px)',
                          cursor: 'pointer',
                          fontWeight: 500
                        }}
                      >
                        {ratio === 'auto' ? 'Auto' : ratio.replace('/', ':')}
                      </button>
                    ))}
                  </div>

                  <div className="icon-tools">
                    <button 
                      className={`icon-btn ${showGrid && mode === 'edit' ? 'active' : ''}`} 
                      onClick={() => setShowGrid(!showGrid)}
                      title="Toggle Grid"
                      disabled={mode === 'preview'}
                    >
                      <Grid size={16} />
                    </button>
                    <button 
                      className="icon-btn" 
                      onClick={() => setIsFullscreen(true)}
                      title="Fullscreen"
                    >
                      <Maximize2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div 
              className={`preview-wrapper ${points.length === 0 ? 'empty' : 'canvas-checkerboard'} ${isFullscreen ? 'fullscreen' : ''}`}
              style={{
                aspectRatio: isFullscreen ? 'unset' : (settings.aspectRatio === 'auto' ? 'unset' : settings.aspectRatio),
                minHeight: settings.aspectRatio === 'auto' ? '400px' : 'auto'
              }}
            >
              {isFullscreen && (
                <button className="exit-fullscreen-btn" onClick={() => setIsFullscreen(false)} title="Exit Fullscreen (Esc)">
                  <Minimize2 size={20} />
                </button>
              )}

              {points.length === 0 ? (
                <div className="empty-canvas-state">
                  <p>Add a color point to start building your mesh</p>
                  <button className="add-point-btn-small" onClick={addPoint}>
                    <Plus size={14} /> Add Color Point
                  </button>
                </div>
              ) : (
                <div 
                  className="interactive-canvas" 
                  ref={canvasRef}
                >
                  <div 
                    className="mesh-shape" 
                    style={getPreviewStyle()}
                  />

                  {showGrid && mode === 'edit' && (
                    <div className="canvas-grid-overlay" />
                  )}

                  {mode === 'edit' && (
                    <div className="canvas-handles-layer">
                      {points.map((point, index) => (
                        <div
                          key={point.id}
                          className={`canvas-point-handle ${selectedPoint === index ? 'selected' : ''} ${dragIndex === index ? 'dragging' : ''}`}
                          style={{
                            left: `${point.x}%`,
                            top: `${point.y}%`,
                            '--point-color': point.color
                          }}
                          onPointerDown={(e) => handlePointerDown(e, index)}
                          onPointerMove={handlePointerMove}
                          onPointerUp={handlePointerUp}
                          onPointerEnter={() => setHoverPoint(index)}
                          onPointerLeave={() => setHoverPoint(null)}
                          tabIndex={0}
                          onFocus={() => setSelectedPoint(index)}
                          aria-label={`Gradient Point ${index + 1}`}
                        >
                          <div className="handle-center"></div>
                          {(selectedPoint === index || hoverPoint === index) && (
                            <div className="handle-tooltip">
                              <div className="tooltip-title">Point {String(index + 1).padStart(2, '0')}</div>
                              <div className="tooltip-stat">X: {Math.round(point.x)}%</div>
                              <div className="tooltip-stat">Y: {Math.round(point.y)}%</div>
                              <div className="tooltip-stat">Spread: {point.intensity}%</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="code-card">
            <div className="code-header">
              <h3>Generated CSS</h3>
              <div className="code-actions">
                <div className="toggle-group" style={{ padding: 0, marginRight: '1rem' }}>
                  <label style={{ marginRight: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Compact</label>
                  <label className="switch" style={{ width: '28px', height: '16px' }}>
                    <input type="checkbox" checked={settings.compactCSS} onChange={(e) => setSettings({...settings, compactCSS: e.target.checked})} />
                    <span className="slider" style={{ ':before': { height: '10px', width: '10px' } }}></span>
                  </label>
                </div>
                
                <select 
                  className="code-format-select" 
                  value={cssFormat} 
                  onChange={(e) => setCssFormat(e.target.value)}
                >
                  <option value="property">CSS Property</option>
                  <option value="class">CSS Class</option>
                  <option value="inline">Inline Style</option>
                </select>
                
                <button 
                  className={`copy-btn-outline copy-btn ${copiedBg ? 'success' : ''}`}
                  onClick={() => copyToClipboard(`background: ${backgroundValue};`, 'bg')}
                >
                  {copiedBg ? <Check size={14} /> : <Copy size={14} />}
                  {copiedBg ? 'Copied BG' : 'Copy BG'}
                </button>
                
                <button 
                  className={`copy-btn ${copied ? 'success' : ''}`}
                  onClick={() => copyToClipboard(getFullCSS(), 'full')}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied Code' : 'Copy Code'}
                </button>
              </div>
            </div>
            <div className="code-content">
              <pre><code>{getFullCSS()}</code></pre>
            </div>
          </div>
          
          <div className="reference-card">
            <h3>How Mesh Gradients Work</h3>
            <p>Modern CSS mesh gradients are created by layering multiple <code>radial-gradient()</code> declarations over a base background color.</p>
            <p>Each point acts as a light source. Its <strong>Position (X/Y)</strong> sets where it originates, and its <strong>Intensity</strong> controls the spread (radius) before fading to transparent. By layering 3 to 8 of these, you create a complex, organic mesh surface.</p>
          </div>
          
        </div>
      </div>
    </ToolLayout>
  );
};

export default CSSGradientMeshGenerator;
