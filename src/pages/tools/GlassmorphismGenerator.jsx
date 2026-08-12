import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { Copy, RefreshCw, Check } from 'lucide-react';
import { useToolHistory } from '../../hooks/useToolHistory';
import './GlassmorphismGenerator.css';

const defaultState = {
  blur: 10,
  transparency: 0.2,
  outline: 1,
  color: '#ffffff',
  radius: 16,
  shadow: 0.1
};

const GlassmorphismGenerator = () => {
  const { state, setState, undo, redo, canUndo, canRedo } = useToolHistory(defaultState);
  const [copiedCSS, setCopiedCSS] = useState(false);
  const [copiedTailwind, setCopiedTailwind] = useState(false);

  const handleReset = () => setState(defaultState);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setState({
      ...state,
      [name]: type === 'range' ? Number(value) : value
    });
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 255, 255';
  };

  const rgbColor = hexToRgb(state.color);

  const getCSS = () => {
    return `background: rgba(${rgbColor}, ${state.transparency});
border-radius: ${state.radius}px;
box-shadow: 0 4px 30px rgba(0, 0, 0, ${state.shadow});
backdrop-filter: blur(${state.blur}px);
-webkit-backdrop-filter: blur(${state.blur}px);
border: ${state.outline}px solid rgba(${rgbColor}, 0.3);`;
  };

  const getTailwind = () => {
    // Tailwind approximation
    return `bg-[rgba(${rgbColor},${state.transparency})] backdrop-blur-[${state.blur}px] rounded-[${state.radius}px] shadow-[0_4px_30px_rgba(0,0,0,${state.shadow})] border-[${state.outline}px] border-[rgba(${rgbColor},0.3)]`;
  };

  const cssString = getCSS();
  const tailwindString = getTailwind();

  const copyToClipboard = (text, setCopied) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolLayout 
      id="glassmorphism" 
      title="Glassmorphism Generator" 
      description="Create modern frosted glass effects (glassmorphism) for your UI."
      onUndo={undo}
      onRedo={redo}
      canUndo={canUndo}
      canRedo={canRedo}
      onReset={handleReset}
    >
      <div className="glass-generator">
        <div className="generator-sidebar">
          
          <div className="control-group">
            <div className="control-header">
              <label>Blur</label>
              <span>{state.blur}px</span>
            </div>
            <input type="range" name="blur" min="0" max="40" value={state.blur} onChange={handleChange} />
          </div>

          <div className="control-group">
            <div className="control-header">
              <label>Transparency</label>
              <span>{Math.round(state.transparency * 100)}%</span>
            </div>
            <input type="range" name="transparency" min="0.01" max="1" step="0.01" value={state.transparency} onChange={handleChange} />
          </div>

          <div className="control-group">
            <div className="control-header">
              <label>Border Outline</label>
              <span>{state.outline}px</span>
            </div>
            <input type="range" name="outline" min="0" max="10" value={state.outline} onChange={handleChange} />
          </div>

          <div className="control-group">
            <div className="control-header">
              <label>Border Radius</label>
              <span>{state.radius}px</span>
            </div>
            <input type="range" name="radius" min="0" max="100" value={state.radius} onChange={handleChange} />
          </div>

          <div className="control-group">
            <div className="control-header">
              <label>Shadow Alpha</label>
              <span>{Math.round(state.shadow * 100)}%</span>
            </div>
            <input type="range" name="shadow" min="0" max="1" step="0.01" value={state.shadow} onChange={handleChange} />
          </div>

          <div className="control-group">
            <div className="control-header">
              <label>Glass Color</label>
            </div>
            <div className="color-picker-wrapper">
              <input type="color" name="color" value={state.color} onChange={handleChange} />
              <input type="text" className="input" name="color" value={state.color} onChange={handleChange} />
            </div>
          </div>

        </div>

        <div className="generator-preview-area">
          <div className="preview-container glass-preview-container">
            <div 
              className="glass-card"
              style={{
                background: `rgba(${rgbColor}, ${state.transparency})`,
                borderRadius: `${state.radius}px`,
                boxShadow: `0 4px 30px rgba(0, 0, 0, ${state.shadow})`,
                backdropFilter: `blur(${state.blur}px)`,
                WebkitBackdropFilter: `blur(${state.blur}px)`,
                border: `${state.outline}px solid rgba(${rgbColor}, 0.3)`
              }}
            >
              <h2>Glassmorphism</h2>
              <p>This is a preview of the frosted glass effect. Adjust the sliders to see the live updates.</p>
            </div>
          </div>
          
          <div className="code-output">
            <div className="code-header">
              <span>CSS Code</span>
              <button onClick={() => copyToClipboard(cssString, setCopiedCSS)} className="copy-btn">
                {copiedCSS ? <Check size={16} /> : <Copy size={16} />}
                {copiedCSS ? 'Copied!' : 'Copy CSS'}
              </button>
            </div>
            <pre><code>{cssString}</code></pre>
          </div>

          <div className="code-output">
            <div className="code-header">
              <span>Tailwind CSS</span>
              <button onClick={() => copyToClipboard(tailwindString, setCopiedTailwind)} className="copy-btn">
                {copiedTailwind ? <Check size={16} /> : <Copy size={16} />}
                {copiedTailwind ? 'Copied!' : 'Copy Tailwind'}
              </button>
            </div>
            <pre><code>{tailwindString}</code></pre>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export default GlassmorphismGenerator;
