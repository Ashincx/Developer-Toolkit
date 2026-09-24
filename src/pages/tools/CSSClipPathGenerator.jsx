import React, { useState, useRef, useEffect, useCallback } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { Copy, Check, Plus, Trash2, Scissors } from 'lucide-react';
import './CSSClipPathGenerator.css';

const PRESETS = [
  { name: 'Triangle', icon: 'M50,0 L100,100 L0,100 Z', points: [{x: 50, y: 0}, {x: 100, y: 100}, {x: 0, y: 100}] },
  { name: 'Diamond', icon: 'M50,0 L100,50 L50,100 L0,50 Z', points: [{x: 50, y: 0}, {x: 100, y: 50}, {x: 50, y: 100}, {x: 0, y: 50}] },
  { name: 'Pentagon', icon: 'M50,0 L100,38 L81,100 L19,100 L0,38 Z', points: [{x: 50, y: 0}, {x: 100, y: 38}, {x: 81, y: 100}, {x: 19, y: 100}, {x: 0, y: 38}] },
  { name: 'Hexagon', icon: 'M50,0 L100,25 L100,75 L50,100 L0,75 L0,25 Z', points: [{x: 50, y: 0}, {x: 100, y: 25}, {x: 100, y: 75}, {x: 50, y: 100}, {x: 0, y: 75}, {x: 0, y: 25}] },
  { name: 'Octagon', icon: 'M30,0 L70,0 L100,30 L100,70 L70,100 L30,100 L0,70 L0,30 Z', points: [{x: 30, y: 0}, {x: 70, y: 0}, {x: 100, y: 30}, {x: 100, y: 70}, {x: 70, y: 100}, {x: 30, y: 100}, {x: 0, y: 70}, {x: 0, y: 30}] },
  { name: 'Star', icon: 'M50,0 L61,35 L98,35 L68,57 L79,91 L50,70 L21,91 L32,57 L2,35 L39,35 Z', points: [{x: 50, y: 0}, {x: 61, y: 35}, {x: 98, y: 35}, {x: 68, y: 57}, {x: 79, y: 91}, {x: 50, y: 70}, {x: 21, y: 91}, {x: 32, y: 57}, {x: 2, y: 35}, {x: 39, y: 35}] },
  { name: 'Arrow', icon: 'M100,50 L50,0 L50,30 L0,30 L0,70 L50,70 L50,100 Z', points: [{x: 100, y: 50}, {x: 50, y: 0}, {x: 50, y: 30}, {x: 0, y: 30}, {x: 0, y: 70}, {x: 50, y: 70}, {x: 50, y: 100}] },
  { name: 'Chevron', icon: 'M100,50 L50,100 L0,100 L50,50 L0,0 L50,0 Z', points: [{x: 100, y: 50}, {x: 50, y: 100}, {x: 0, y: 100}, {x: 50, y: 50}, {x: 0, y: 0}, {x: 50, y: 0}] }
];

const CSSClipPathGenerator = () => {
  // State
  const [shapeType, setShapeType] = useState('polygon');
  const [polygonPoints, setPolygonPoints] = useState([{x: 50, y: 0}, {x: 100, y: 50}, {x: 50, y: 100}, {x: 0, y: 50}]);
  const [circleParams, setCircleParams] = useState({ radius: 50, cx: 50, cy: 50 });
  const [ellipseParams, setEllipseParams] = useState({ rx: 50, ry: 40, cx: 50, cy: 50 });
  const [insetParams, setInsetParams] = useState({ top: 10, right: 20, bottom: 10, left: 20, radius: 20 });
  
  const [settings, setSettings] = useState({
    shapeColor: '#818cf8',
    bgColor: '#171717',
    showGrid: true,
    showPoints: true,
    showBorder: false,
    previewWidth: 400,
    previewHeight: 300
  });

  const [cssFormat, setCssFormat] = useState('property'); // property, class, inline
  const [copied, setCopied] = useState(false);
  const [copiedPartial, setCopiedPartial] = useState(false);
  
  // Dragging state
  const canvasRef = useRef(null);
  const [dragPointIndex, setDragPointIndex] = useState(null);

  // History (Undo/Redo) - Basic implementation for Polygon points
  const [history, setHistory] = useState([[{x: 50, y: 0}, {x: 100, y: 50}, {x: 50, y: 100}, {x: 0, y: 50}]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const saveToHistory = useCallback((newPoints) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newPoints)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPolygonPoints(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPolygonPoints(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  };

  const handleReset = () => {
    setShapeType('polygon');
    const defaultPoints = [{x: 50, y: 0}, {x: 100, y: 50}, {x: 50, y: 100}, {x: 0, y: 50}];
    setPolygonPoints(defaultPoints);
    setCircleParams({ radius: 50, cx: 50, cy: 50 });
    setEllipseParams({ rx: 50, ry: 40, cx: 50, cy: 50 });
    setInsetParams({ top: 10, right: 20, bottom: 10, left: 20, radius: 20 });
    saveToHistory(defaultPoints);
  };

  // Logic to generate clip-path value
  const getClipPathValue = () => {
    if (shapeType === 'polygon') {
      const pointsStr = polygonPoints.map(p => `${Math.round(p.x)}% ${Math.round(p.y)}%`).join(', ');
      return `polygon(${pointsStr})`;
    }
    if (shapeType === 'circle') {
      return `circle(${circleParams.radius}% at ${circleParams.cx}% ${circleParams.cy}%)`;
    }
    if (shapeType === 'ellipse') {
      return `ellipse(${ellipseParams.rx}% ${ellipseParams.ry}% at ${ellipseParams.cx}% ${ellipseParams.cy}%)`;
    }
    if (shapeType === 'inset') {
      const { top, right, bottom, left, radius } = insetParams;
      return `inset(${top}% ${right}% ${bottom}% ${left}%${radius > 0 ? ` round ${radius}px` : ''})`;
    }
    return 'none';
  };

  const clipPathValue = getClipPathValue();

  // Generate CSS based on format
  const getFullCSS = () => {
    if (cssFormat === 'property') {
      return `clip-path: ${clipPathValue};`;
    }
    if (cssFormat === 'class') {
      return `.clip-shape {\n  width: ${settings.previewWidth}px;\n  height: ${settings.previewHeight}px;\n  background: ${settings.shapeColor};\n  clip-path: ${clipPathValue};\n}`;
    }
    if (cssFormat === 'inline') {
      return `style="clip-path: ${clipPathValue};"`;
    }
    return '';
  };

  // Interactions
  const copyToClipboard = (text, type = 'full') => {
    navigator.clipboard.writeText(text);
    if (type === 'full') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopiedPartial(true);
      setTimeout(() => setCopiedPartial(false), 2000);
    }
  };

  const handlePointChange = (index, field, value) => {
    let numValue = parseInt(value, 10);
    if (isNaN(numValue)) numValue = 0;
    if (numValue < 0) numValue = 0;
    if (numValue > 100) numValue = 100;

    const newPoints = [...polygonPoints];
    newPoints[index][field] = numValue;
    setPolygonPoints(newPoints);
    saveToHistory(newPoints);
  };

  const addPoint = () => {
    const newPoints = [...polygonPoints];
    // Add point between last and first
    const last = newPoints[newPoints.length - 1];
    const first = newPoints[0];
    newPoints.push({
      x: Math.round((last.x + first.x) / 2),
      y: Math.round((last.y + first.y) / 2)
    });
    setPolygonPoints(newPoints);
    saveToHistory(newPoints);
  };

  const deletePoint = (index) => {
    if (polygonPoints.length <= 3) return; // Min 3 points
    const newPoints = polygonPoints.filter((_, i) => i !== index);
    setPolygonPoints(newPoints);
    saveToHistory(newPoints);
  };

  const loadPreset = (preset) => {
    setShapeType('polygon');
    const newPoints = JSON.parse(JSON.stringify(preset.points));
    setPolygonPoints(newPoints);
    saveToHistory(newPoints);
  };

  // Dragging Logic
  const handlePointerDown = (e, index) => {
    if (shapeType !== 'polygon' || !settings.showPoints) return;
    e.preventDefault(); // prevent scrolling
    setDragPointIndex(index);
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (dragPointIndex === null || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    
    const newPoints = [...polygonPoints];
    newPoints[dragPointIndex] = { x, y };
    setPolygonPoints(newPoints);
  };

  const handlePointerUp = (e) => {
    if (dragPointIndex !== null) {
      e.target.releasePointerCapture(e.pointerId);
      setDragPointIndex(null);
      saveToHistory(polygonPoints); // save only at the end of drag
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <ToolLayout 
      id="clip-path" 
      title="CSS Clip-Path Generator" 
      description="Create custom CSS clip-path shapes visually and generate ready-to-use CSS."
      onUndo={undo}
      onRedo={redo}
      canUndo={historyIndex > 0}
      canRedo={historyIndex < history.length - 1}
      onReset={handleReset}
    >
      <div className="clip-path-generator">
        {/* LEFT COLUMN: Controls */}
        <div className="generator-sidebar">
          
          <div className="controls-card">
            <h3>Shape Type</h3>
            <div className="shape-selector">
              {['polygon', 'circle', 'ellipse', 'inset'].map(type => (
                <button 
                  key={type}
                  className={`shape-btn ${shapeType === type ? 'active' : ''}`}
                  onClick={() => setShapeType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {/* Polygon Controls */}
            {shapeType === 'polygon' && (
              <div className="shape-controls">
                <div className="control-header">
                  <label>Polygon Points ({polygonPoints.length})</label>
                </div>
                <div className="points-list">
                  {polygonPoints.map((point, index) => (
                    <div className="point-row" key={index}>
                      <span className="point-label">P{index + 1}</span>
                      <div className="point-input-group">
                        <span>X</span>
                        <input 
                          type="number" 
                          className="point-input" 
                          value={Math.round(point.x)} 
                          onChange={(e) => handlePointChange(index, 'x', e.target.value)}
                        />
                        <span>%</span>
                      </div>
                      <div className="point-input-group">
                        <span>Y</span>
                        <input 
                          type="number" 
                          className="point-input" 
                          value={Math.round(point.y)} 
                          onChange={(e) => handlePointChange(index, 'y', e.target.value)}
                        />
                        <span>%</span>
                      </div>
                      <button 
                        className="delete-btn" 
                        onClick={() => deletePoint(index)}
                        disabled={polygonPoints.length <= 3}
                        title="Delete Point"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button className="add-point-btn" onClick={addPoint}>
                  <Plus size={16} /> Add Point
                </button>
              </div>
            )}

            {/* Circle Controls */}
            {shapeType === 'circle' && (
              <div className="shape-controls">
                <div className="control-group">
                  <div className="control-header">
                    <label>Radius</label>
                    <span>{circleParams.radius}%</span>
                  </div>
                  <input type="range" min="0" max="150" value={circleParams.radius} onChange={(e) => setCircleParams({...circleParams, radius: e.target.value})} />
                </div>
                <div className="control-group">
                  <div className="control-header">
                    <label>Center X</label>
                    <span>{circleParams.cx}%</span>
                  </div>
                  <input type="range" min="-50" max="150" value={circleParams.cx} onChange={(e) => setCircleParams({...circleParams, cx: e.target.value})} />
                </div>
                <div className="control-group">
                  <div className="control-header">
                    <label>Center Y</label>
                    <span>{circleParams.cy}%</span>
                  </div>
                  <input type="range" min="-50" max="150" value={circleParams.cy} onChange={(e) => setCircleParams({...circleParams, cy: e.target.value})} />
                </div>
              </div>
            )}

            {/* Ellipse Controls */}
            {shapeType === 'ellipse' && (
              <div className="shape-controls">
                <div className="control-group">
                  <div className="control-header">
                    <label>Radius X</label>
                    <span>{ellipseParams.rx}%</span>
                  </div>
                  <input type="range" min="0" max="150" value={ellipseParams.rx} onChange={(e) => setEllipseParams({...ellipseParams, rx: e.target.value})} />
                </div>
                <div className="control-group">
                  <div className="control-header">
                    <label>Radius Y</label>
                    <span>{ellipseParams.ry}%</span>
                  </div>
                  <input type="range" min="0" max="150" value={ellipseParams.ry} onChange={(e) => setEllipseParams({...ellipseParams, ry: e.target.value})} />
                </div>
                <div className="control-group">
                  <div className="control-header">
                    <label>Center X</label>
                    <span>{ellipseParams.cx}%</span>
                  </div>
                  <input type="range" min="-50" max="150" value={ellipseParams.cx} onChange={(e) => setEllipseParams({...ellipseParams, cx: e.target.value})} />
                </div>
                <div className="control-group">
                  <div className="control-header">
                    <label>Center Y</label>
                    <span>{ellipseParams.cy}%</span>
                  </div>
                  <input type="range" min="-50" max="150" value={ellipseParams.cy} onChange={(e) => setEllipseParams({...ellipseParams, cy: e.target.value})} />
                </div>
              </div>
            )}

            {/* Inset Controls */}
            {shapeType === 'inset' && (
              <div className="shape-controls">
                <div className="control-group">
                  <div className="control-header">
                    <label>Top</label>
                    <span>{insetParams.top}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={insetParams.top} onChange={(e) => setInsetParams({...insetParams, top: e.target.value})} />
                </div>
                <div className="control-group">
                  <div className="control-header">
                    <label>Right</label>
                    <span>{insetParams.right}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={insetParams.right} onChange={(e) => setInsetParams({...insetParams, right: e.target.value})} />
                </div>
                <div className="control-group">
                  <div className="control-header">
                    <label>Bottom</label>
                    <span>{insetParams.bottom}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={insetParams.bottom} onChange={(e) => setInsetParams({...insetParams, bottom: e.target.value})} />
                </div>
                <div className="control-group">
                  <div className="control-header">
                    <label>Left</label>
                    <span>{insetParams.left}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={insetParams.left} onChange={(e) => setInsetParams({...insetParams, left: e.target.value})} />
                </div>
                <div className="control-group">
                  <div className="control-header">
                    <label>Border Radius</label>
                    <span>{insetParams.radius}px</span>
                  </div>
                  <input type="range" min="0" max="150" value={insetParams.radius} onChange={(e) => setInsetParams({...insetParams, radius: e.target.value})} />
                </div>
              </div>
            )}
          </div>

          {/* Presets Card (Only for Polygon) */}
          {shapeType === 'polygon' && (
            <div className="controls-card">
              <h3>Presets</h3>
              <div className="presets-grid">
                {PRESETS.map((preset, idx) => (
                  <button key={idx} className="preset-btn" onClick={() => loadPreset(preset)}>
                    <svg viewBox="0 0 100 100" className="preset-icon">
                      <path d={preset.icon} />
                    </svg>
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Settings Card */}
          <div className="controls-card">
            <h3>Customization</h3>
            <div className="settings-grid">
              <div className="color-picker-group">
                <label>Shape Color</label>
                <div className="color-input-wrapper">
                  <input type="color" className="color-picker" value={settings.shapeColor} onChange={(e) => setSettings({...settings, shapeColor: e.target.value})} />
                  <input type="text" className="hex-input" value={settings.shapeColor} onChange={(e) => setSettings({...settings, shapeColor: e.target.value})} />
                </div>
              </div>
              <div className="color-picker-group">
                <label>Background Color</label>
                <div className="color-input-wrapper">
                  <input type="color" className="color-picker" value={settings.bgColor} onChange={(e) => setSettings({...settings, bgColor: e.target.value})} />
                  <input type="text" className="hex-input" value={settings.bgColor} onChange={(e) => setSettings({...settings, bgColor: e.target.value})} />
                </div>
              </div>
              <div className="toggle-group">
                <label>Show Grid</label>
                <label className="switch">
                  <input type="checkbox" checked={settings.showGrid} onChange={(e) => setSettings({...settings, showGrid: e.target.checked})} />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="toggle-group">
                <label>Show Points</label>
                <label className="switch">
                  <input type="checkbox" checked={settings.showPoints} onChange={(e) => setSettings({...settings, showPoints: e.target.checked})} />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </div>
          
        </div>

        {/* RIGHT COLUMN: Preview & Code */}
        <div className="generator-main">
          
          <div className="preview-card">
            <div className="preview-header">
              <h3>Live Preview</h3>
              <div className="preview-controls">
                <div className="preview-size-inputs">
                  <input type="number" value={settings.previewWidth} onChange={(e) => setSettings({...settings, previewWidth: e.target.value || 400})} />
                  <span>×</span>
                  <input type="number" value={settings.previewHeight} onChange={(e) => setSettings({...settings, previewHeight: e.target.value || 300})} />
                </div>
              </div>
            </div>
            
            <div 
              className={`preview-wrapper ${settings.showGrid ? 'canvas-checkerboard' : ''}`}
              style={{ backgroundColor: settings.showGrid ? 'transparent' : settings.bgColor }}
            >
              <div 
                className="interactive-canvas" 
                ref={canvasRef}
                style={{ 
                  width: `${settings.previewWidth}px`, 
                  height: `${settings.previewHeight}px` 
                }}
              >
                {/* The actual clipped shape */}
                <div 
                  className="clip-shape" 
                  style={{
                    backgroundColor: settings.shapeColor,
                    clipPath: clipPathValue,
                    WebkitClipPath: clipPathValue
                  }}
                />

                {/* SVG Overlay for drawing lines and points (only for polygon) */}
                {shapeType === 'polygon' && (
                  <svg className="canvas-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Outline connecting points */}
                    {settings.showPoints && (
                      <polygon 
                        points={polygonPoints.map(p => `${p.x},${p.y}`).join(' ')} 
                        fill="none" 
                        stroke="rgba(255, 255, 255, 0.4)" 
                        strokeWidth="0.5" 
                        strokeDasharray="2"
                      />
                    )}
                    
                    {/* Draggable Points */}
                    {settings.showPoints && polygonPoints.map((point, index) => (
                      <circle
                        key={index}
                        cx={`${point.x}`}
                        cy={`${point.y}`}
                        r="4"
                        className="canvas-point"
                        onPointerDown={(e) => handlePointerDown(e, index)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                      />
                    ))}
                  </svg>
                )}
              </div>
            </div>
          </div>

          <div className="code-card">
            <div className="code-header">
              <h3>Generated CSS</h3>
              <div className="code-actions">
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
                  className={`copy-btn ${copiedPartial ? 'success' : ''}`}
                  onClick={() => copyToClipboard(`clip-path: ${clipPathValue};`, 'partial')}
                  title="Copy only the clip-path property"
                >
                  {copiedPartial ? <Check size={16} /> : <Scissors size={16} />}
                  {copiedPartial ? 'Copied Property' : 'Copy Property'}
                </button>
                <button 
                  className={`copy-btn ${copied ? 'success' : ''}`}
                  onClick={() => copyToClipboard(getFullCSS(), 'full')}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied Code' : 'Copy Code'}
                </button>
              </div>
            </div>
            <div className="code-content">
              <pre><code>{getFullCSS()}</code></pre>
            </div>
          </div>
          
          <div className="reference-card">
            <h3>CSS clip-path Reference</h3>
            <p>The <code>clip-path</code> CSS property creates a clipping region that sets what part of an element should be shown. Parts that are inside the region are shown, while those outside are hidden.</p>
            <div className="reference-funcs">
              <code>polygon()</code>
              <code>circle()</code>
              <code>ellipse()</code>
              <code>inset()</code>
              <code>path()</code>
            </div>
          </div>
          
        </div>
      </div>
    </ToolLayout>
  );
};

export default CSSClipPathGenerator;
