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
  rotate: { keyframes: 'from { transform: rotate(0deg); } to { transform: rotate(360deg); }' },
  glow: { keyframes: '0%, 100% { box-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px var(--accent-primary); } 50% { box-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 30px var(--accent-primary); }' },
};

const defaultState = {
  preset: 'bounce',
  duration: 1,
  delay: 0,
  iterationCount: 'infinite',
  direction: 'normal',
  timingFunction: 'ease-in-out',
  fillMode: 'both'
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
    return `${state.preset} ${state.duration}s ${state.timingFunction} ${state.delay}s ${state.iterationCount} ${state.direction} ${state.fillMode}`;
  };

  const cssString = `@keyframes ${state.preset} {
  ${presetAnimations[state.preset].keyframes}
}

.animated-element {
  animation: ${getAnimationString()};
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
