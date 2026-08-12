import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { Copy, RefreshCw, Check, Plus, Trash2 } from 'lucide-react';
import { useToolHistory } from '../../hooks/useToolHistory';
import './BoxShadowGenerator.css';

const defaultShadow = {
  id: 1,
  offsetX: 0,
  offsetY: 10,
  blur: 15,
  spread: -3,
  color: 'rgba(0, 0, 0, 0.1)',
  inset: false
};

const BoxShadowGenerator = () => {
  const { state: shadows, setState: setShadows, undo, redo, canUndo, canRedo } = useToolHistory([{ ...defaultShadow }]);
  const [activeShadow, setActiveShadow] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleReset = () => {
    setShadows([{ ...defaultShadow }]);
    setActiveShadow(0);
  };

  const handleAddShadow = () => {
    setShadows([...shadows, { ...defaultShadow, id: Date.now() }]);
    setActiveShadow(shadows.length);
  };

  const handleRemoveShadow = (index) => {
    if (shadows.length === 1) return;
    const newShadows = shadows.filter((_, i) => i !== index);
    setShadows(newShadows);
    if (activeShadow >= index) {
      setActiveShadow(Math.max(0, activeShadow - 1));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newShadows = [...shadows];
    newShadows[activeShadow] = {
      ...newShadows[activeShadow],
      [name]: type === 'checkbox' ? checked : value
    };
    setShadows(newShadows);
  };

  const getShadowString = (shadow) => {
    return `${shadow.inset ? 'inset ' : ''}${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.spread}px ${shadow.color}`;
  };

  const getAllShadowsString = () => {
    return shadows.map(getShadowString).join(',\n  ');
  };

  const cssString = `box-shadow: ${getAllShadowsString()};`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cssString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentShadow = shadows[activeShadow];

  return (
    <ToolLayout 
      id="box-shadow" 
      title="Box Shadow Generator" 
      description="Create beautiful CSS box shadows with our interactive generator."
      onUndo={undo}
      onRedo={redo}
      canUndo={canUndo}
      canRedo={canRedo}
      onReset={handleReset}
    >
      <div className="box-shadow-generator">
        <div className="generator-sidebar">
          <div className="controls-header">
            <h3>Shadow Layers</h3>
            <button onClick={handleAddShadow} className="btn btn-outline reset-btn" aria-label="Add Shadow">
              <Plus size={14} /> Add
            </button>
          </div>
          
          <div className="layers-list">
            {shadows.map((shadow, index) => (
              <div 
                key={shadow.id} 
                className={`layer-item ${activeShadow === index ? 'active' : ''}`}
                onClick={() => setActiveShadow(index)}
              >
                <span>Shadow {index + 1}</span>
                {shadows.length > 1 && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveShadow(index);
                    }}
                    className="delete-layer-btn"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="control-group">
            <div className="control-header">
              <label>X Offset</label>
              <span>{currentShadow.offsetX}px</span>
            </div>
            <input type="range" name="offsetX" min="-50" max="50" value={currentShadow.offsetX} onChange={handleChange} />
          </div>

          <div className="control-group">
            <div className="control-header">
              <label>Y Offset</label>
              <span>{currentShadow.offsetY}px</span>
            </div>
            <input type="range" name="offsetY" min="-50" max="50" value={currentShadow.offsetY} onChange={handleChange} />
          </div>

          <div className="control-group">
            <div className="control-header">
              <label>Blur</label>
              <span>{currentShadow.blur}px</span>
            </div>
            <input type="range" name="blur" min="0" max="100" value={currentShadow.blur} onChange={handleChange} />
          </div>

          <div className="control-group">
            <div className="control-header">
              <label>Spread</label>
              <span>{currentShadow.spread}px</span>
            </div>
            <input type="range" name="spread" min="-50" max="50" value={currentShadow.spread} onChange={handleChange} />
          </div>

          <div className="control-group">
            <div className="control-header">
              <label>Color</label>
            </div>
            <div className="color-picker-wrapper">
              <input type="color" name="color" value={currentShadow.color.length === 7 ? currentShadow.color : '#000000'} onChange={handleChange} />
              <input type="text" className="input" name="color" value={currentShadow.color} onChange={handleChange} />
            </div>
          </div>

          <div className="control-group-checkbox">
            <label className="checkbox-label">
              <input type="checkbox" name="inset" checked={currentShadow.inset} onChange={handleChange} />
              <span>Inset Shadow</span>
            </label>
          </div>

          <button onClick={handleReset} className="btn btn-outline" style={{ marginTop: '1rem', width: '100%' }}>
            <RefreshCw size={14} /> Reset All Layers
          </button>
        </div>

        <div className="generator-preview-area">
          <div className="preview-container box-shadow-preview">
            <div 
              className="preview-box"
              style={{ boxShadow: getAllShadowsString() }}
            >
              Preview
            </div>
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

export default BoxShadowGenerator;
