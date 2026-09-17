import { useState, useEffect } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { Copy, RefreshCw, Check, Play, Square } from 'lucide-react';
import { useToolHistory } from '../../hooks/useToolHistory';
import './AnimationBuilder.css';

const presetAnimations = {
  fadeIn: { keyframes: 'from { opacity: 0; } to { opacity: 1; }' },
  bounce: { keyframes: '0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-30px); } 60% { transform: translateY(-15px); }' },
  pulse: { keyframes: '0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); }' },
  shake: { keyframes: '0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); } 20%, 40%, 60%, 80% { transform: translateX(10px); }' },
  zoomIn: { keyframes: 'from { opacity: 0; transform: scale3d(0.3, 0.3, 0.3); } 50% { opacity: 1; }' },
  slideInLeft: { keyframes: 'from { transform: translate3d(-100%, 0, 0); visibility: visible; } to { transform: translate3d(0, 0, 0); }' },
  slideInRight: { keyframes: 'from { transform: translate3d(100%, 0, 0); visibility: visible; } to { transform: translate3d(0, 0, 0); }' },
  slideInUp: { keyframes: 'from { transform: translate3d(0, 100%, 0); visibility: visible; } to { transform: translate3d(0, 0, 0); }' },
  slideInDown: { keyframes: 'from { transform: translate3d(0, -100%, 0); visibility: visible; } to { transform: translate3d(0, 0, 0); }' },
  rotate: { keyframes: 'from { transform: rotate(0deg); } to { transform: rotate(360deg); }' },
  glow: { keyframes: '0%, 100% { box-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px var(--accent-primary); } 50% { box-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 30px var(--accent-primary); }' },
  flipInX: { keyframes: 'from { transform: perspective(400px) rotate3d(1, 0, 0, 90deg); animation-timing-function: ease-in; opacity: 0; } 40% { transform: perspective(400px) rotate3d(1, 0, 0, -20deg); animation-timing-function: ease-in; } 60% { transform: perspective(400px) rotate3d(1, 0, 0, 10deg); opacity: 1; } 80% { transform: perspective(400px) rotate3d(1, 0, 0, -5deg); } to { transform: perspective(400px); }' },
  flipInY: { keyframes: 'from { transform: perspective(400px) rotate3d(0, 1, 0, 90deg); animation-timing-function: ease-in; opacity: 0; } 40% { transform: perspective(400px) rotate3d(0, 1, 0, -20deg); animation-timing-function: ease-in; } 60% { transform: perspective(400px) rotate3d(0, 1, 0, 10deg); opacity: 1; } 80% { transform: perspective(400px) rotate3d(0, 1, 0, -5deg); } to { transform: perspective(400px); }' },
  swing: { keyframes: '20% { transform: rotate3d(0, 0, 1, 15deg); } 40% { transform: rotate3d(0, 0, 1, -10deg); } 60% { transform: rotate3d(0, 0, 1, 5deg); } 80% { transform: rotate3d(0, 0, 1, -5deg); } to { transform: rotate3d(0, 0, 1, 0deg); }' },
  wobble: { keyframes: 'from { transform: translate3d(0, 0, 0); } 15% { transform: translate3d(-25%, 0, 0) rotate3d(0, 0, 1, -5deg); } 30% { transform: translate3d(20%, 0, 0) rotate3d(0, 0, 1, 3deg); } 45% { transform: translate3d(-15%, 0, 0) rotate3d(0, 0, 1, -3deg); } 60% { transform: translate3d(10%, 0, 0) rotate3d(0, 0, 1, 2deg); } 75% { transform: translate3d(-5%, 0, 0) rotate3d(0, 0, 1, -1deg); } to { transform: translate3d(0, 0, 0); }' },
  heartbeat: { keyframes: '0% { transform: scale(1); } 14% { transform: scale(1.3); } 28% { transform: scale(1); } 42% { transform: scale(1.3); } 70% { transform: scale(1); }' },
};

const defaultState = {
  preset: 'bounce',
  duration: 1,
  delay: 0,
  iterationCount: 'infinite',
  direction: 'normal',
  timingFunction: 'ease-in-out',
  fillMode: 'both',
  transformOrigin: 'center',
  bezierX1: 0.42,
  bezierY1: 0,
  bezierX2: 0.58,
  bezierY2: 1
};

const AnimationBuilder = () => {
  const { state, setState, undo, redo, canUndo, canRedo } = useToolHistory(defaultState);
  const [isPlaying, setIsPlaying] = useState(true);
  const [copiedCSS, setCopiedCSS] = useState(false);

  // Force re-trigger animation when playing is toggled or state changes
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (isPlaying) {
      setAnimKey(prev => prev + 1);
    }
  }, [state, isPlaying]);

  const handleReset = () => setState(defaultState);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setState({
      ...state,
      [name]: type === 'range' || type === 'number' ? Number(value) : value
    });
  };

  const getAnimationString = () => {
    const timing = state.timingFunction === 'custom' 
      ? `cubic-bezier(${state.bezierX1}, ${state.bezierY1}, ${state.bezierX2}, ${state.bezierY2})` 
      : state.timingFunction;
    return `${state.preset} ${state.duration}s ${timing} ${state.delay}s ${state.iterationCount} ${state.direction} ${state.fillMode}`;
  };

  const cssString = `@keyframes ${state.preset} {
  ${presetAnimations[state.preset].keyframes}
}

.animated-element {
  animation: ${getAnimationString()};
  transform-origin: ${state.transformOrigin};
}`;

  const copyToClipboard = (text, setCopied) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolLayout 
      id="animation-builder" 
      title="Animation Builder" 
      description="Create CSS animations instantly without writing manual keyframes."
      onUndo={undo}
      onRedo={redo}
      canUndo={canUndo}
      canRedo={canRedo}
      onReset={handleReset}
    >
      <div className="animation-builder">
        
        {/* Dynamic style tag for keyframes injection */}
        <style>{`
          @keyframes ${state.preset} {
            ${presetAnimations[state.preset].keyframes}
          }
        `}</style>

        <div className="generator-sidebar">
          
          <div className="control-group">
            <label className="control-label">Animation Preset</label>
            <select className="input" name="preset" value={state.preset} onChange={handleChange}>
              {Object.keys(presetAnimations).map(preset => (
                <option key={preset} value={preset}>
                  {preset.charAt(0).toUpperCase() + preset.slice(1).replace(/([A-Z])/g, ' $1')}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <div className="control-header">
              <label>Duration</label>
              <span>{state.duration}s</span>
            </div>
            <input type="range" name="duration" min="0.1" max="5" step="0.1" value={state.duration} onChange={handleChange} />
          </div>

          <div className="control-group">
            <div className="control-header">
              <label>Delay</label>
              <span>{state.delay}s</span>
            </div>
            <input type="range" name="delay" min="0" max="5" step="0.1" value={state.delay} onChange={handleChange} />
          </div>

          <div className="control-group">
            <label className="control-label">Iteration Count</label>
            <select className="input" name="iterationCount" value={state.iterationCount} onChange={handleChange}>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="infinite">Infinite</option>
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">Timing Function</label>
            <select className="input" name="timingFunction" value={state.timingFunction} onChange={handleChange}>
              <option value="linear">Linear</option>
              <option value="ease">Ease</option>
              <option value="ease-in">Ease In</option>
              <option value="ease-out">Ease Out</option>
              <option value="ease-in-out">Ease In Out</option>
              <option value="custom">Custom (Cubic Bezier)</option>
            </select>
          </div>

          {state.timingFunction === 'custom' && (
            <div className="control-group bezier-controls">
              <label className="control-label">Cubic Bezier</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input type="number" step="0.01" className="input" name="bezierX1" value={state.bezierX1} onChange={handleChange} placeholder="x1" />
                <input type="number" step="0.01" className="input" name="bezierY1" value={state.bezierY1} onChange={handleChange} placeholder="y1" />
                <input type="number" step="0.01" className="input" name="bezierX2" value={state.bezierX2} onChange={handleChange} placeholder="x2" />
                <input type="number" step="0.01" className="input" name="bezierY2" value={state.bezierY2} onChange={handleChange} placeholder="y2" />
              </div>
            </div>
          )}

          <div className="control-group">
            <label className="control-label">Fill Mode</label>
            <select className="input" name="fillMode" value={state.fillMode} onChange={handleChange}>
              <option value="none">None</option>
              <option value="forwards">Forwards</option>
              <option value="backwards">Backwards</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">Transform Origin</label>
            <select className="input" name="transformOrigin" value={state.transformOrigin} onChange={handleChange}>
              <option value="center">Center</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="top left">Top Left</option>
              <option value="top right">Top Right</option>
              <option value="bottom left">Bottom Left</option>
              <option value="bottom right">Bottom Right</option>
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">Direction</label>
            <select className="input" name="direction" value={state.direction} onChange={handleChange}>
              <option value="normal">Normal</option>
              <option value="reverse">Reverse</option>
              <option value="alternate">Alternate</option>
              <option value="alternate-reverse">Alternate Reverse</option>
            </select>
          </div>

        </div>

        <div className="generator-preview-area">
          <div className="preview-container animation-preview-container">
            <div className="animation-stage">
              <div 
                key={animKey}
                className="animated-box"
                style={{
                  animation: isPlaying ? getAnimationString() : 'none',
                  transformOrigin: state.transformOrigin
                }}
              >
                Animate Me!
              </div>
            </div>
            
            <div className="play-controls">
              <button 
                className={`btn ${isPlaying ? 'btn-outline' : 'btn-primary'}`} 
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <><Square size={16} /> Stop</> : <><Play size={16} /> Play</>}
              </button>
              <button 
                className="btn btn-outline" 
                onClick={() => setAnimKey(prev => prev + 1)}
              >
                <RefreshCw size={16} /> Restart
              </button>
            </div>
          </div>
          
          <div className="code-output">
            <div className="code-header">
              <span>CSS Keyframes & Class</span>
              <button onClick={() => copyToClipboard(cssString, setCopiedCSS)} className="copy-btn">
                {copiedCSS ? <Check size={16} /> : <Copy size={16} />}
                {copiedCSS ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre><code>{cssString}</code></pre>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export default AnimationBuilder;
