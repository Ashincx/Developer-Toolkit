import React, { useState } from 'react';
import {
  Sliders,
  RotateCw,
  Clock,
  Repeat,
  Compass,
  Copy,
  Trash2,
  Check,
  Sparkles,
  Layers,
  Info,
  Palette
} from 'lucide-react';
import {
  ANIMATION_PRESETS,
  EASING_OPTIONS,
  TRANSFORM_ORIGINS,
  DIRECTION_OPTIONS,
  FILL_MODE_OPTIONS,
  ITERATION_OPTIONS
} from '../utils/animationPresets';

const PRESET_SWATCHES = [
  '#ffffff', '#000000', '#6366f1', '#3b82f6', '#06b6d4',
  '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#64748b'
];

function toPickerHex(colorStr, fallback = '#6366f1') {
  if (!colorStr || colorStr === 'none' || colorStr === 'transparent') {
    return fallback;
  }
  const clean = colorStr.trim();
  if (/^#[0-9a-fA-F]{6}$/i.test(clean)) {
    return clean;
  }
  if (/^#[0-9a-fA-F]{3}$/i.test(clean)) {
    return `#${clean[1]}${clean[1]}${clean[2]}${clean[2]}${clean[3]}${clean[3]}`;
  }
  return fallback;
}

export default function AnimationProperties({
  selectedElementId,
  selectedLayer,
  animation,
  onUpdateAnimation,
  onRemoveAnimation,
  onCopyAnimation,
  onPasteAnimation,
  copiedAnimation,
  onDuplicateToAll,
  onUpdateElementStyle
}) {
  const [applyToChildren, setApplyToChildren] = useState(true);

  if (!selectedElementId || !selectedLayer) {
    return (
      <div className="svg-properties-panel empty">
        <div className="panel-header">
          <div className="panel-header-title">
            <Sliders size={16} className="panel-icon" />
            <span>Properties</span>
          </div>
        </div>

        <div className="properties-empty-state">
          <div className="empty-icon-bubble">
            <Layers size={24} />
          </div>
          <h4>No Element Selected</h4>
          <p>
            Click on any SVG element in the canvas or choose a layer from the left panel to configure its appearance or motion.
          </p>
          <div className="empty-tips">
            <div className="tip-row">
              <span className="kbd">Space</span>
              <span>Play / Pause</span>
            </div>
            <div className="tip-row">
              <span className="kbd">Ctrl+Z</span>
              <span>Undo changes</span>
            </div>
            <div className="tip-row">
              <span className="kbd">Esc</span>
              <span>Deselect layer</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isAnimated = animation && animation.enabled;

  const handleChange = (field, value) => {
    onUpdateAnimation(selectedElementId, {
      ...animation,
      [field]: value
    });
  };

  const handleToggleEnabled = (e) => {
    const checked = e.target.checked;
    onUpdateAnimation(selectedElementId, {
      ...animation,
      enabled: checked
    });
  };

  const handleFillChange = (newFill) => {
    if (onUpdateElementStyle) {
      onUpdateElementStyle(selectedElementId, { fill: newFill }, applyToChildren);
    }
  };

  const handleStrokeChange = (newStroke) => {
    if (onUpdateElementStyle) {
      onUpdateElementStyle(selectedElementId, { stroke: newStroke }, applyToChildren);
    }
  };

  const handleStrokeWidthChange = (newWidth) => {
    if (onUpdateElementStyle) {
      onUpdateElementStyle(selectedElementId, { strokeWidth: newWidth }, applyToChildren);
    }
  };

  const handleOpacityChange = (newOpacity) => {
    if (onUpdateElementStyle) {
      onUpdateElementStyle(selectedElementId, { opacity: newOpacity }, applyToChildren);
    }
  };

  return (
    <div className="svg-properties-panel">
      <div className="panel-header">
        <div className="panel-header-title">
          <Sliders size={16} className="panel-icon" />
          <span>Properties</span>
        </div>

        {/* Copy / Paste / Delete Quick Icons */}
        <div className="panel-header-actions">
          <button
            className="panel-mini-btn"
            onClick={() => onCopyAnimation(selectedElementId)}
            title="Copy animation properties"
          >
            <Copy size={13} />
          </button>
          {copiedAnimation && (
            <button
              className="panel-mini-btn"
              onClick={() => onPasteAnimation(selectedElementId)}
              title="Paste animation properties"
            >
              <Check size={13} />
            </button>
          )}
          {isAnimated && (
            <button
              className="panel-mini-btn danger"
              onClick={() => onRemoveAnimation(selectedElementId)}
              title="Remove animation"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="properties-content-scroll">
        {/* Element Meta Card */}
        <div className="element-meta-card">
          <div className="meta-row">
            <span className="meta-label">ID:</span>
            <span className="meta-value">#{selectedElementId}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Tag:</span>
            <span className="meta-badge">&lt;{selectedLayer.tagName}&gt;</span>
          </div>
        </div>

        {/* Appearance & Color Section */}
        <div className="appearance-section-box">
          <div className="appearance-header">
            <Palette size={14} className="appearance-icon" />
            <span className="appearance-title">Appearance & Color</span>
          </div>

          {/* Fill Color */}
          <div className="prop-group">
            <div className="prop-label-row">
              <label className="prop-label">
                <span>Fill Color</span>
              </label>
              {selectedLayer.fill === 'none' ? (
                <span className="prop-none-badge">None</span>
              ) : (
                <span className="prop-value-display">{selectedLayer.fill || 'Default'}</span>
              )}
            </div>
            <div className="color-control-row">
              <div className="color-picker-wrapper">
                <input
                  type="color"
                  value={toPickerHex(selectedLayer.fill, '#3b82f6')}
                  onChange={(e) => handleFillChange(e.target.value)}
                  className="color-input-circle"
                  title="Pick fill color"
                />
                <span
                  className={`color-preview-disc ${selectedLayer.fill === 'none' ? 'is-none' : ''}`}
                  style={selectedLayer.fill && selectedLayer.fill !== 'none' ? { backgroundColor: selectedLayer.fill } : {}}
                />
              </div>
              <input
                type="text"
                value={selectedLayer.fill || ''}
                onChange={(e) => handleFillChange(e.target.value)}
                placeholder="#3b82f6 or none"
                className="color-hex-text-input"
              />
              <button
                className={`color-none-btn ${selectedLayer.fill === 'none' ? 'active' : ''}`}
                onClick={() => handleFillChange(selectedLayer.fill === 'none' ? '#3b82f6' : 'none')}
                title="Set fill to none"
              >
                None
              </button>
            </div>
            <div className="color-swatches-strip">
              {PRESET_SWATCHES.map((hex) => (
                <button
                  key={hex}
                  className={`swatch-dot ${selectedLayer.fill?.toLowerCase() === hex ? 'active' : ''}`}
                  style={{ backgroundColor: hex }}
                  onClick={() => handleFillChange(hex)}
                  title={hex}
                />
              ))}
            </div>
          </div>

          {/* Stroke Color */}
          <div className="prop-group">
            <div className="prop-label-row">
              <label className="prop-label">
                <span>Stroke Color</span>
              </label>
              {selectedLayer.stroke === 'none' || !selectedLayer.stroke ? (
                <span className="prop-none-badge">None</span>
              ) : (
                <span className="prop-value-display">{selectedLayer.stroke}</span>
              )}
            </div>
            <div className="color-control-row">
              <div className="color-picker-wrapper">
                <input
                  type="color"
                  value={toPickerHex(selectedLayer.stroke, '#ef4444')}
                  onChange={(e) => handleStrokeChange(e.target.value)}
                  className="color-input-circle"
                  title="Pick stroke color"
                />
                <span
                  className={`color-preview-disc ${(!selectedLayer.stroke || selectedLayer.stroke === 'none') ? 'is-none' : ''}`}
                  style={selectedLayer.stroke && selectedLayer.stroke !== 'none' ? { backgroundColor: selectedLayer.stroke } : {}}
                />
              </div>
              <input
                type="text"
                value={selectedLayer.stroke || ''}
                onChange={(e) => handleStrokeChange(e.target.value)}
                placeholder="#ef4444 or none"
                className="color-hex-text-input"
              />
              <button
                className={`color-none-btn ${(!selectedLayer.stroke || selectedLayer.stroke === 'none') ? 'active' : ''}`}
                onClick={() => handleStrokeChange((!selectedLayer.stroke || selectedLayer.stroke === 'none') ? '#ef4444' : 'none')}
                title="Set stroke to none"
              >
                None
              </button>
            </div>
            <div className="color-swatches-strip">
              {PRESET_SWATCHES.map((hex) => (
                <button
                  key={hex}
                  className={`swatch-dot ${selectedLayer.stroke?.toLowerCase() === hex ? 'active' : ''}`}
                  style={{ backgroundColor: hex }}
                  onClick={() => handleStrokeChange(hex)}
                  title={hex}
                />
              ))}
            </div>
          </div>

          {/* Stroke Width Slider */}
          <div className="prop-group">
            <div className="prop-label-row">
              <label className="prop-label">
                <span>Stroke Width</span>
              </label>
              <span className="prop-value-display">{parseFloat(selectedLayer.strokeWidth) || 0}px</span>
            </div>
            <div className="slider-with-number">
              <input
                type="range"
                min="0"
                max="32"
                step="0.5"
                value={parseFloat(selectedLayer.strokeWidth) || 0}
                onChange={(e) => handleStrokeWidthChange(parseFloat(e.target.value))}
                className="prop-slider"
              />
              <input
                type="number"
                min="0"
                max="64"
                step="0.5"
                value={parseFloat(selectedLayer.strokeWidth) || 0}
                onChange={(e) => handleStrokeWidthChange(Math.max(0, parseFloat(e.target.value) || 0))}
                className="prop-num-input"
              />
            </div>
          </div>

          {/* Opacity Slider */}
          <div className="prop-group">
            <div className="prop-label-row">
              <label className="prop-label">
                <span>Layer Opacity</span>
              </label>
              <span className="prop-value-display">{Math.round((parseFloat(selectedLayer.opacity) || 1) * 100)}%</span>
            </div>
            <div className="slider-with-number">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={parseFloat(selectedLayer.opacity) ?? 1}
                onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                className="prop-slider"
              />
              <span className="prop-num-input-text">{Math.round((parseFloat(selectedLayer.opacity) || 1) * 100)}%</span>
            </div>
          </div>

          {/* Group Propagation Checkbox */}
          {selectedLayer.tagName === 'g' && (
            <div className="group-propagate-row">
              <label className="group-propagate-label">
                <input
                  type="checkbox"
                  checked={applyToChildren}
                  onChange={(e) => setApplyToChildren(e.target.checked)}
                />
                <span>Apply color to all child shapes in this group</span>
              </label>
            </div>
          )}
        </div>

        {/* Enable Animation Toggle */}
        <div className="prop-group enable-toggle-group">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={isAnimated}
              onChange={handleToggleEnabled}
              className="toggle-checkbox"
            />
            <span className="toggle-custom" />
            <span className="toggle-text">Enable Motion</span>
          </label>
        </div>

        {isAnimated ? (
          <>
            {/* Preset Selector */}
            <div className="prop-group">
              <label className="prop-label">
                <Sparkles size={13} />
                <span>Animation Preset</span>
              </label>
              <select
                className="prop-select"
                value={animation?.preset || 'pulse'}
                onChange={(e) => handleChange('preset', e.target.value)}
              >
                {ANIMATION_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Duration Control */}
            <div className="prop-group">
              <div className="prop-label-row">
                <label className="prop-label">
                  <Clock size={13} />
                  <span>Duration</span>
                </label>
                <span className="prop-value-display">{animation?.duration ?? 1}s</span>
              </div>
              <div className="slider-with-number">
                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={animation?.duration ?? 1}
                  onChange={(e) => handleChange('duration', parseFloat(e.target.value))}
                  className="prop-slider"
                />
                <input
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={animation?.duration ?? 1}
                  onChange={(e) => handleChange('duration', Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                  className="prop-num-input"
                />
              </div>
            </div>

            {/* Delay Control */}
            <div className="prop-group">
              <div className="prop-label-row">
                <label className="prop-label">
                  <Clock size={13} />
                  <span>Delay</span>
                </label>
                <span className="prop-value-display">{animation?.delay ?? 0}s</span>
              </div>
              <div className="slider-with-number">
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.05"
                  value={animation?.delay ?? 0}
                  onChange={(e) => handleChange('delay', parseFloat(e.target.value))}
                  className="prop-slider"
                />
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.05"
                  value={animation?.delay ?? 0}
                  onChange={(e) => handleChange('delay', Math.max(0, parseFloat(e.target.value) || 0))}
                  className="prop-num-input"
                />
              </div>
            </div>

            {/* Easing Function */}
            <div className="prop-group">
              <label className="prop-label">
                <Sliders size={13} />
                <span>Easing Curve</span>
              </label>
              <select
                className="prop-select"
                value={animation?.easing || 'ease-in-out'}
                onChange={(e) => handleChange('easing', e.target.value)}
              >
                {EASING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Iterations & Infinite */}
            <div className="prop-group">
              <div className="prop-label-row">
                <label className="prop-label">
                  <Repeat size={13} />
                  <span>Repeat Count</span>
                </label>
              </div>
              <div className="iteration-btn-group">
                {ITERATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`iter-chip ${(animation?.iterationCount || 'infinite') === opt.value ? 'active' : ''}`}
                    onClick={() => handleChange('iterationCount', opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Direction */}
            <div className="prop-group">
              <label className="prop-label">
                <RotateCw size={13} />
                <span>Direction</span>
              </label>
              <select
                className="prop-select"
                value={animation?.direction || 'normal'}
                onChange={(e) => handleChange('direction', e.target.value)}
              >
                {DIRECTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Fill Mode */}
            <div className="prop-group">
              <label className="prop-label">
                <Info size={13} />
                <span>Fill Mode</span>
              </label>
              <select
                className="prop-select"
                value={animation?.fillMode || 'both'}
                onChange={(e) => handleChange('fillMode', e.target.value)}
              >
                {FILL_MODE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Transform Origin Picker */}
            <div className="prop-group">
              <label className="prop-label">
                <Compass size={13} />
                <span>Transform Origin</span>
              </label>
              <select
                className="prop-select"
                value={animation?.transformOrigin || 'center'}
                onChange={(e) => handleChange('transformOrigin', e.target.value)}
              >
                {TRANSFORM_ORIGINS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.value})
                  </option>
                ))}
              </select>
            </div>

            {/* Stroke Controls (for strokeDraw / strokeErase or general stroke) */}
            {(animation.preset === 'strokeDraw' || animation.preset === 'strokeErase' || selectedLayer.stroke) && (
              <div className="prop-section-box">
                <span className="prop-section-title">Stroke Styling</span>
                <div className="prop-row-dual">
                  <div className="prop-sub-col">
                    <label className="prop-sub-label">Color:</label>
                    <input
                      type="color"
                      value={animation.strokeColor || selectedLayer.stroke || '#6366f1'}
                      onChange={(e) => handleChange('strokeColor', e.target.value)}
                      className="prop-color-input"
                    />
                  </div>
                  <div className="prop-sub-col">
                    <label className="prop-sub-label">Width (px):</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={animation.strokeWidth || selectedLayer.strokeWidth || 3}
                      onChange={(e) => handleChange('strokeWidth', parseFloat(e.target.value) || 2)}
                      className="prop-num-input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Color Shift Controls */}
            {animation.preset === 'colorChange' && (
              <div className="prop-section-box">
                <span className="prop-section-title">Color Morph Range</span>
                <div className="prop-row-dual">
                  <div className="prop-sub-col">
                    <label className="prop-sub-label">Start Color:</label>
                    <input
                      type="color"
                      value={animation.startColor || '#f43f5e'}
                      onChange={(e) => handleChange('startColor', e.target.value)}
                      className="prop-color-input"
                    />
                  </div>
                  <div className="prop-sub-col">
                    <label className="prop-sub-label">End Color:</label>
                    <input
                      type="color"
                      value={animation.endColor || '#6366f1'}
                      onChange={(e) => handleChange('endColor', e.target.value)}
                      className="prop-color-input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="prop-actions-footer">
              <button
                className="btn btn-outline prop-footer-btn"
                onClick={() => onDuplicateToAll(selectedElementId)}
                title="Apply this exact animation configuration to all other layers"
              >
                <Copy size={13} />
                <span>Apply to All Layers</span>
              </button>
            </div>
          </>
        ) : (
          <div className="animation-disabled-box">
            <p>Animation is currently disabled for this element.</p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onUpdateAnimation(selectedElementId, { ...animation, enabled: true })}
            >
              Enable Animation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
