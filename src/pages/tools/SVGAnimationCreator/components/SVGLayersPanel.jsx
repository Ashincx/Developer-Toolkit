import React, { useState } from 'react';
import {
  Layers,
  Search,
  Eye,
  EyeOff,
  Trash2,
  Sparkles,
  Circle,
  Square,
  Type,
  Folder,
  Triangle,
  MoveRight
} from 'lucide-react';

const TAG_ICONS = {
  path: Triangle,
  circle: Circle,
  ellipse: Circle,
  rect: Square,
  g: Folder,
  text: Type,
  polygon: Triangle,
  polyline: MoveRight,
  line: MoveRight
};

export default function SVGLayersPanel({
  layers = [],
  animations = {},
  selectedElementId,
  onSelectElement,
  hiddenLayers = new Set(),
  onToggleHideLayer,
  onRemoveAnimation,
  onClearAllAnimations
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLayers = layers.filter((layer) => {
    const q = searchQuery.toLowerCase();
    return (
      layer.id.toLowerCase().includes(q) ||
      layer.label.toLowerCase().includes(q) ||
      layer.tagName.toLowerCase().includes(q)
    );
  });

  const animatedCount = Object.values(animations).filter((a) => a && a.enabled).length;

  return (
    <div className="svg-layers-panel">
      <div className="panel-header">
        <div className="panel-header-title">
          <Layers size={16} className="panel-icon" />
          <span>SVG Elements & Layers</span>
        </div>
        <span className="panel-count-badge">
          {animatedCount} / {layers.length} anim
        </span>
      </div>

      {/* Layer Search Bar */}
      <div className="layers-search-box">
        <Search size={14} className="search-icon" />
        <input
          type="text"
          placeholder="Filter layers by name or tag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="layers-search-input"
        />
      </div>

      {/* Bulk action toolbar */}
      <div className="layers-toolbar">
        <span className="layers-count-label">{filteredLayers.length} layers</span>
        {animatedCount > 0 && (
          <button
            className="clear-all-anim-btn"
            onClick={onClearAllAnimations}
            title="Remove all animations from all layers"
          >
            <Trash2 size={12} />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Layers List */}
      <div className="layers-list">
        {filteredLayers.map((layer) => {
          const isSelected = selectedElementId === layer.id;
          const isHidden = hiddenLayers.has(layer.id);
          const anim = animations[layer.id];
          const hasAnimation = anim && anim.enabled;
          const TagIcon = TAG_ICONS[layer.tagName] || Layers;

          return (
            <div
              key={layer.id}
              className={`layer-item ${isSelected ? 'selected' : ''} ${isHidden ? 'hidden' : ''}`}
              onClick={() => onSelectElement(layer.id)}
            >
              {/* Element Icon */}
              <div className="layer-tag-icon-wrap" title={`<${layer.tagName}>`}>
                <TagIcon size={14} />
              </div>

              {/* Layer Title & ID */}
              <div className="layer-info-column">
                <span className="layer-label-text">{layer.label}</span>
                <span className="layer-id-text">#{layer.id}</span>
              </div>

              {/* Animation Status Badge */}
              {hasAnimation && (
                <div className="layer-anim-badge" title={`Preset: ${anim.preset}`}>
                  <Sparkles size={11} />
                  <span>{anim.preset}</span>
                </div>
              )}

              {/* Layer Row Actions */}
              <div className="layer-actions" onClick={(e) => e.stopPropagation()}>
                {/* Hide / Show Toggle */}
                <button
                  className={`layer-action-btn ${isHidden ? 'active-hide' : ''}`}
                  onClick={() => onToggleHideLayer(layer.id)}
                  title={isHidden ? 'Show layer' : 'Hide layer'}
                >
                  {isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>

                {/* Remove Animation */}
                {hasAnimation && (
                  <button
                    className="layer-action-btn remove-btn"
                    onClick={() => onRemoveAnimation(layer.id)}
                    title="Remove animation"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredLayers.length === 0 && (
          <div className="layers-empty-state">
            <p>No layers match "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
