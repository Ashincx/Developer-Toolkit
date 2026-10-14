import React, { useState } from 'react';
import { Palette, RefreshCw, Check, ArrowRight } from 'lucide-react';
import { extractUniqueColors } from '../utils/svgSanitizer';

export default function SVGPalettePanel({
  layers = [],
  onReplaceGlobalColor,
  onSelectColorElements
}) {
  const uniqueColors = extractUniqueColors(layers);
  const [replacingColor, setReplacingColor] = useState(null);
  const [targetNewColor, setTargetNewColor] = useState('#6366f1');
  const [copiedColor, setCopiedColor] = useState(null);

  const handleStartReplace = (color) => {
    setReplacingColor(color);
    setTargetNewColor(color.startsWith('#') ? color : '#6366f1');
  };

  const handleExecuteReplace = () => {
    if (replacingColor && targetNewColor && onReplaceGlobalColor) {
      onReplaceGlobalColor(replacingColor, targetNewColor);
      setReplacingColor(null);
    }
  };

  const handleCopyHex = (color) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  return (
    <div className="svg-palette-panel">
      <div className="panel-header">
        <div className="panel-header-title">
          <Palette size={16} className="panel-icon" />
          <span>SVG Global Palette</span>
        </div>
        <span className="panel-count-badge">{uniqueColors.length} colors</span>
      </div>

      <div className="palette-panel-info">
        <p>Inspect and recolor all fills and strokes across your entire SVG in one click.</p>
      </div>

      {/* Color Replacement Active Banner */}
      {replacingColor && (
        <div className="palette-recolor-card">
          <div className="recolor-card-title">
            <span>Replace Color Everywhere</span>
            <button className="recolor-cancel-btn" onClick={() => setReplacingColor(null)}>
              Cancel
            </button>
          </div>

          <div className="recolor-swap-row">
            <div className="swap-color-chip">
              <span className="chip-dot" style={{ backgroundColor: replacingColor }} />
              <span className="chip-hex">{replacingColor}</span>
            </div>

            <ArrowRight size={14} className="swap-arrow" />

            <div className="swap-color-chip new">
              <input
                type="color"
                value={targetNewColor.startsWith('#') && targetNewColor.length === 7 ? targetNewColor : '#6366f1'}
                onChange={(e) => setTargetNewColor(e.target.value)}
                className="chip-picker-input"
              />
              <input
                type="text"
                value={targetNewColor}
                onChange={(e) => setTargetNewColor(e.target.value)}
                className="chip-hex-input"
              />
            </div>
          </div>

          <button className="btn btn-primary recolor-apply-btn" onClick={handleExecuteReplace}>
            <Check size={14} />
            <span>Apply Global Recolor</span>
          </button>
        </div>
      )}

      {/* Colors List */}
      <div className="palette-colors-list">
        {uniqueColors.map(({ color, count }) => (
          <div key={color} className="palette-color-item">
            <div className="palette-color-left">
              <span
                className="palette-swatch"
                style={{ backgroundColor: color }}
                onClick={() => handleCopyHex(color)}
                title="Click to copy hex"
              />
              <div className="palette-color-details">
                <span
                  className="palette-hex-code"
                  onClick={() => handleCopyHex(color)}
                  title="Click to copy hex"
                >
                  {copiedColor === color ? 'Copied!' : color}
                </span>
                <span className="palette-usage-count">Used by {count} {count === 1 ? 'element' : 'elements'}</span>
              </div>
            </div>

            <div className="palette-color-actions">
              <button
                className="btn-recolor-action"
                onClick={() => handleStartReplace(color)}
                title={`Replace ${color} across entire SVG`}
              >
                <RefreshCw size={12} />
                <span>Recolor</span>
              </button>
            </div>
          </div>
        ))}

        {uniqueColors.length === 0 && (
          <div className="palette-empty-state">
            <p>No explicit fills or strokes detected in this SVG.</p>
          </div>
        )}
      </div>
    </div>
  );
}
