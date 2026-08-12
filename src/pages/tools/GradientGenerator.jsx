import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { Copy, RefreshCw, Check, Plus, Trash2, Shuffle } from 'lucide-react';
import { useToolHistory } from '../../hooks/useToolHistory';
import './GradientGenerator.css';

const defaultState = {
  type: 'linear-gradient',
  angle: 90,
  stops: [
    { id: 1, color: '#3b82f6', position: 0 },
    { id: 2, color: '#8b5cf6', position: 100 }
  ]
};

const GradientGenerator = () => {
  const { state, setState, undo, redo, canUndo, canRedo } = useToolHistory(defaultState);
  const [copiedCSS, setCopiedCSS] = useState(false);
  const [copiedTailwind, setCopiedTailwind] = useState(false);

  const handleReset = () => setState(defaultState);

  const handleTypeChange = (e) => {
    setState({ ...state, type: e.target.value });
  };

  const handleAngleChange = (e) => {
    setState({ ...state, angle: Number(e.target.value) });
  };

  const handleAddStop = () => {
    const newStops = [...state.stops];
    // Add a stop in the middle of the last two, or at 50%
    const pos = newStops.length > 1 
      ? Math.round((newStops[newStops.length - 2].position + newStops[newStops.length - 1].position) / 2)
      : 50;
    
    newStops.push({ id: Date.now(), color: '#ffffff', position: pos });
    newStops.sort((a, b) => a.position - b.position);
    setState({ ...state, stops: newStops });
  };

  const handleRemoveStop = (id) => {
    if (state.stops.length <= 2) return;
    const newStops = state.stops.filter(s => s.id !== id);
    setState({ ...state, stops: newStops });
  };

  const handleStopChange = (id, field, value) => {
    const newStops = state.stops.map(stop => {
      if (stop.id === id) {
        return { ...stop, [field]: field === 'position' ? Number(value) : value };
      }
      return stop;
    });
    // Don't sort immediately while dragging to prevent jumping, but sort for output
    setState({ ...state, stops: newStops });
  };

  const handleReverse = () => {
    const newStops = state.stops.map(stop => ({
      ...stop,
      position: 100 - stop.position
    })).sort((a, b) => a.position - b.position);
    
    setState({ 
      ...state, 
      stops: newStops,
      angle: (state.angle + 180) % 360
    });
  };

  const handleRandom = () => {
    const randomColor = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    const newStops = state.stops.map(stop => ({
      ...stop,
      color: randomColor()
    }));
    setState({
      ...state,
      angle: Math.floor(Math.random() * 360),
      stops: newStops
    });
  };

  const getGradientString = () => {
    const sortedStops = [...state.stops].sort((a, b) => a.position - b.position);
    const stopsString = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ');
    
    if (state.type === 'linear-gradient') {
      return `linear-gradient(${state.angle}deg, ${stopsString})`;
    } else if (state.type === 'radial-gradient') {
      return `radial-gradient(circle, ${stopsString})`;
    } else {
      return `conic-gradient(from ${state.angle}deg, ${stopsString})`;
    }
  };

  const getTailwindString = () => {
    // Basic approximation for Tailwind
    const sortedStops = [...state.stops].sort((a, b) => a.position - b.position);
    if (sortedStops.length > 3) return '/* Tailwind supports max 3 colors easily (from, via, to) */\n/* Use arbitrary value: */\nbg-[' + getGradientString() + ']';
    
    let tw = 'bg-gradient-to-r'; // Simplified angle mapping
    if (state.angle >= 45 && state.angle < 135) tw = 'bg-gradient-to-r';
    else if (state.angle >= 135 && state.angle < 225) tw = 'bg-gradient-to-b';
    else if (state.angle >= 225 && state.angle < 315) tw = 'bg-gradient-to-l';
    else tw = 'bg-gradient-to-t';

    tw += ` from-[${sortedStops[0].color}]`;
    if (sortedStops.length === 3) {
      tw += ` via-[${sortedStops[1].color}]`;
    }
    tw += ` to-[${sortedStops[sortedStops.length - 1].color}]`;
    return tw;
  };

  const cssString = `background: ${getGradientString()};`;
  const tailwindString = getTailwindString();

  const copyToClipboard = (text, setCopied) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sortedStops = [...state.stops].sort((a, b) => a.position - b.position);

  return (
    <ToolLayout 
      id="gradient-generator" 
      title="Gradient Generator" 
      description="Create and customize beautiful CSS gradients."
      onUndo={undo}
      onRedo={redo}
      canUndo={canUndo}
      canRedo={canRedo}
      onReset={handleReset}
    >
      <div className="gradient-generator">
        <div className="generator-sidebar">
          <div className="control-group">
            <label className="control-label">Type</label>
            <select className="input" value={state.type} onChange={handleTypeChange}>
              <option value="linear-gradient">Linear</option>
              <option value="radial-gradient">Radial</option>
              <option value="conic-gradient">Conic</option>
            </select>
          </div>

          {(state.type === 'linear-gradient' || state.type === 'conic-gradient') && (
            <div className="control-group">
              <div className="control-header">
                <label>Angle</label>
                <span>{state.angle}°</span>
              </div>
              <input type="range" name="angle" min="0" max="360" value={state.angle} onChange={handleAngleChange} />
            </div>
          )}

          <div className="controls-header" style={{ marginTop: '1rem' }}>
            <h3>Color Stops</h3>
            <div className="actions-row">
              <button onClick={handleRandom} className="btn btn-outline icon-btn" title="Randomize Colors">
                <Shuffle size={14} />
              </button>
              <button onClick={handleReverse} className="btn btn-outline icon-btn" title="Reverse Gradient">
                <RefreshCw size={14} />
              </button>
              <button onClick={handleAddStop} className="btn btn-outline reset-btn">
                <Plus size={14} /> Add
              </button>
            </div>
          </div>
          
          <div className="stops-list">
            {sortedStops.map((stop, index) => (
              <div key={stop.id} className="stop-item">
                <div className="stop-controls">
                  <input 
                    type="color" 
                    value={stop.color} 
                    onChange={(e) => handleStopChange(stop.id, 'color', e.target.value)} 
                    className="color-picker-small"
                  />
                  <input 
                    type="text" 
                    value={stop.color} 
                    onChange={(e) => handleStopChange(stop.id, 'color', e.target.value)} 
                    className="input color-input-small"
                  />
                  <input 
                    type="number" 
                    value={stop.position} 
                    min="0" max="100"
                    onChange={(e) => handleStopChange(stop.id, 'position', e.target.value)} 
                    className="input position-input-small"
                  />
                  <span>%</span>
                </div>
                {state.stops.length > 2 && (
                  <button 
                    onClick={() => handleRemoveStop(stop.id)}
                    className="delete-layer-btn"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

        </div>

        <div className="generator-preview-area">
          <div className="preview-container checkerboard-bg">
            <div 
              className="preview-box gradient-preview-box"
              style={{ background: getGradientString() }}
            ></div>
          </div>
          
          <div className="code-output">
            <div className="code-header">
              <span>CSS</span>
              <button onClick={() => copyToClipboard(cssString, setCopiedCSS)} className="copy-btn">
                {copiedCSS ? <Check size={16} /> : <Copy size={16} />}
                {copiedCSS ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre><code>{cssString}</code></pre>
          </div>

          <div className="code-output">
            <div className="code-header">
              <span>Tailwind CSS</span>
              <button onClick={() => copyToClipboard(tailwindString, setCopiedTailwind)} className="copy-btn">
                {copiedTailwind ? <Check size={16} /> : <Copy size={16} />}
                {copiedTailwind ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre><code>{tailwindString}</code></pre>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export default GradientGenerator;
