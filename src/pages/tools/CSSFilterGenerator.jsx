import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { Copy, RefreshCw, Check } from 'lucide-react';
import { useToolHistory } from '../../hooks/useToolHistory';
import './CSSFilterGenerator.css';

const defaultFilters = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  invert: 0,
  opacity: 100,
  'hue-rotate': 0,
};

const CSSFilterGenerator = () => {
  const { state: filters, setState: setFilters, undo, redo, canUndo, canRedo } = useToolHistory(defaultFilters);
  const [copied, setCopied] = useState(false);

  const handleReset = () => setFilters(defaultFilters);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: Number(value)
    });
  };

  const getFilterString = () => {
    const parts = [];
    if (filters.brightness !== 100) parts.push(`brightness(${filters.brightness}%)`);
    if (filters.contrast !== 100) parts.push(`contrast(${filters.contrast}%)`);
    if (filters.saturate !== 100) parts.push(`saturate(${filters.saturate}%)`);
    if (filters.blur !== 0) parts.push(`blur(${filters.blur}px)`);
    if (filters.grayscale !== 0) parts.push(`grayscale(${filters.grayscale}%)`);
    if (filters.sepia !== 0) parts.push(`sepia(${filters.sepia}%)`);
    if (filters.invert !== 0) parts.push(`invert(${filters.invert}%)`);
    if (filters.opacity !== 100) parts.push(`opacity(${filters.opacity}%)`);
    if (filters['hue-rotate'] !== 0) parts.push(`hue-rotate(${filters['hue-rotate']}deg)`);
    
    return parts.length > 0 ? parts.join(' ') : 'none';
  };

  const cssString = `filter: ${getFilterString()};`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cssString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolLayout 
      id="css-filter" 
      title="CSS Filter Generator" 
      description="Visually generate CSS filter properties to apply graphics effects like blur or color shifting to elements."
      onUndo={undo}
      onRedo={redo}
      canUndo={canUndo}
      canRedo={canRedo}
      onReset={handleReset}
    >
      <div className="filter-generator">
        <div className="generator-controls">
          <div className="controls-header">
            <h3>Filter Properties</h3>
          </div>
          
          <div className="control-group">
            <div className="control-header">
              <label>Brightness</label>
              <span>{filters.brightness}%</span>
            </div>
            <input type="range" name="brightness" min="0" max="200" value={filters.brightness} onChange={handleChange} />
          </div>

          <div className="control-group">
            <div className="control-header">
              <label>Contrast</label>
              <span>{filters.contrast}%</span>
            </div>
            <input type="range" name="contrast" min="0" max="200" value={filters.contrast} onChange={handleChange} />
          </div>

          <div className="control-group">
            <div className="control-header">
              <label>Saturate</label>
              <span>{filters.saturate}%</span>
            </div>
            <input type="range" name="saturate" min="0" max="200" value={filters.saturate} onChange={handleChange} />
          </div>

          <div className="control-group">
            <div className="control-header">
              <label>Blur</label>
              <span>{filters.blur}px</span>
            </div>
            <input type="range" name="blur" min="0" max="50" value={filters.blur} onChange={handleChange} />
          </div>

          <div className="control-group">
            <div className="control-header">
              <label>Grayscale</label>
              <span>{filters.grayscale}%</span>
            </div>
            <input type="range" name="grayscale" min="0" max="100" value={filters.grayscale} onChange={handleChange} />
          </div>

          <div className="control-group">
            <div className="control-header">
              <label>Sepia</label>
              <span>{filters.sepia}%</span>
            </div>
            <input type="range" name="sepia" min="0" max="100" value={filters.sepia} onChange={handleChange} />
          </div>

          <div className="control-group">
            <div className="control-header">
              <label>Invert</label>
              <span>{filters.invert}%</span>
            </div>
            <input type="range" name="invert" min="0" max="100" value={filters.invert} onChange={handleChange} />
          </div>
          
          <div className="control-group">
            <div className="control-header">
              <label>Opacity</label>
              <span>{filters.opacity}%</span>
            </div>
            <input type="range" name="opacity" min="0" max="100" value={filters.opacity} onChange={handleChange} />
          </div>

          <div className="control-group">
            <div className="control-header">
              <label>Hue Rotate</label>
              <span>{filters['hue-rotate']}deg</span>
            </div>
            <input type="range" name="hue-rotate" min="0" max="360" value={filters['hue-rotate']} onChange={handleChange} />
          </div>
        </div>

        <div className="generator-preview-area">
          <div className="preview-container">
            <img 
              src="https://images.unsplash.com/photo-1605379399642-870262d3d051?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" 
              alt="Preview" 
              className="preview-image"
              style={{ filter: getFilterString() }}
            />
          </div>
          
          <div className="code-output">
            <div className="code-header">
              <span>CSS Code</span>
              <button onClick={copyToClipboard} className="copy-btn">
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy CSS'}
              </button>
            </div>
            <pre><code>{cssString}</code></pre>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export default CSSFilterGenerator;
