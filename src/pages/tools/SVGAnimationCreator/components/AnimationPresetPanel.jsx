import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  ArrowRight,
  Layers,
  Search,
  Clock
} from 'lucide-react';
import { ANIMATION_PRESETS } from '../utils/animationPresets';

const CATEGORIES = ['All', 'Entrance', 'Exit', 'Attention', 'Transforms', 'SVG Strokes', 'Colors'];

export default function AnimationPresetPanel({
  selectedElementId,
  selectedLayer,
  onApplyPreset,
  onApplyToAll,
  onApplyStagger
}) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [staggerStep, setStaggerStep] = useState(0.15);

  const filteredPresets = ANIMATION_PRESETS.filter((preset) => {
    const matchesCategory = activeCategory === 'All' || preset.category === activeCategory;
    const matchesSearch =
      preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="svg-preset-panel">
      <div className="panel-header">
        <div className="panel-header-title">
          <Sparkles size={16} className="panel-icon" />
          <span>Animation Presets</span>
        </div>
        <span className="panel-count-badge">{filteredPresets.length}</span>
      </div>

      {/* Target indicator banner */}
      <div className={`preset-target-banner ${selectedElementId ? 'has-target' : 'no-target'}`}>
        <Layers size={14} />
        <span className="target-banner-text">
          {selectedElementId ? (
            <>Target: <strong>#{selectedElementId}</strong> ({selectedLayer?.tagName || 'element'})</>
          ) : (
            <>Target: <em>No layer selected (will prompt or apply to all)</em></>
          )}
        </span>
      </div>

      {/* Search Input */}
      <div className="preset-search-box">
        <Search size={14} className="search-icon" />
        <input
          type="text"
          placeholder="Filter animations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="preset-search-input"
        />
      </div>

      {/* Category Pills */}
      <div className="preset-categories-bar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`preset-cat-pill ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stagger Controls Bar */}
      <div className="stagger-actions-bar">
        <div className="stagger-input-group">
          <Clock size={13} />
          <span>Step:</span>
          <input
            type="number"
            step="0.05"
            min="0.05"
            max="1"
            value={staggerStep}
            onChange={(e) => setStaggerStep(parseFloat(e.target.value) || 0.1)}
            className="stagger-step-input"
            title="Stagger delay increment per layer in seconds"
          />
          <span>s</span>
        </div>
        <button
          className="stagger-apply-btn"
          onClick={() => onApplyStagger(staggerStep)}
          title="Sequentially stagger delay across all layers"
        >
          <Zap size={13} />
          <span>Stagger All</span>
        </button>
      </div>

      {/* Presets List */}
      <div className="preset-cards-list">
        {filteredPresets.map((preset) => (
          <div key={preset.id} className="preset-card">
            <div className="preset-card-top">
              <div className="preset-card-title-row">
                <span className="preset-name">{preset.name}</span>
                <span className="preset-cat-tag">{preset.category}</span>
              </div>
              <p className="preset-desc">{preset.description}</p>
            </div>

            <div className="preset-card-actions">
              <button
                className="btn-preset-apply"
                onClick={() => onApplyPreset(preset.id)}
                title={
                  selectedElementId
                    ? `Apply ${preset.name} to #${selectedElementId}`
                    : `Apply ${preset.name}`
                }
              >
                <ArrowRight size={13} />
                <span>Apply</span>
              </button>
              <button
                className="btn-preset-all"
                onClick={() => onApplyToAll(preset.id)}
                title={`Apply ${preset.name} to all layers in SVG`}
              >
                <span>To All</span>
              </button>
            </div>
          </div>
        ))}

        {filteredPresets.length === 0 && (
          <div className="presets-empty-state">
            <p>No animation presets found matching "{searchQuery}".</p>
          </div>
        )}
      </div>
    </div>
  );
}
