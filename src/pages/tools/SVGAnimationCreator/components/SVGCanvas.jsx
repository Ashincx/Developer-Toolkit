import React, { useRef, useState, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Palette,
  Check
} from 'lucide-react';
import { generateStylesCSS } from '../utils/animationPresets';

const BG_PRESETS = [
  { id: 'checkerboard', label: 'Checkerboard', value: 'checkerboard' },
  { id: 'dark', label: 'Dark', value: '#09090b' },
  { id: 'slate', label: 'Slate', value: '#1e293b' },
  { id: 'light', label: 'Light', value: '#ffffff' }
];

export default function SVGCanvas({
  svgString,
  animations,
  selectedElementId,
  onSelectElement,
  playbackSpeed = 1,
  isScrubbing = false,
  scrubTime = 0,
  hiddenLayers = new Set()
}) {
  const containerRef = useRef(null);
  const svgWrapperRef = useRef(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [bgType, setBgType] = useState('checkerboard');
  const [customBgColor, setCustomBgColor] = useState('#09090b');
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [hoveredElementId, setHoveredElementId] = useState(null);

  // Reset Pan and Zoom
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.4));
  const handleFitToCanvas = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Pan interaction
  const handleMouseDown = (e) => {
    // Only pan if clicking canvas background (not on an SVG element)
    if (e.target.closest('svg') && !e.altKey && !e.spaceKey) {
      return;
    }
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Wheel zoom
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => Math.min(Math.max(prev + delta, 0.3), 3));
    }
  };

  // Handle direct click on SVG element
  const handleSvgClick = useCallback(
    (e) => {
      e.stopPropagation();
      const target = e.target;
      if (!target) return;

      // Find closest element with ID inside the SVG
      const elementWithId = target.closest('[id]');
      if (elementWithId && elementWithId.id && elementWithId.tagName.toLowerCase() !== 'svg') {
        onSelectElement(elementWithId.id);
      } else {
        onSelectElement(null);
      }
    },
    [onSelectElement]
  );

  // Handle hover over elements
  const handleSvgMouseMove = useCallback((e) => {
    const target = e.target;
    if (!target) return;
    const elementWithId = target.closest('[id]');
    if (elementWithId && elementWithId.id && elementWithId.tagName.toLowerCase() !== 'svg') {
      setHoveredElementId(elementWithId.id);
    } else {
      setHoveredElementId(null);
    }
  }, []);

  const handleSvgMouseLeave = useCallback(() => {
    setHoveredElementId(null);
  }, []);

  // Compute CSS styles for animations
  const generatedCSS = generateStylesCSS(animations, {
    scopeSelector: '.canvas-svg-mount',
    speed: playbackSpeed,
    isScrubbing,
    scrubTime,
    includeReducedMotion: false
  });

  // Generate highlight and hidden styles
  let interactionCSS = '';
  if (selectedElementId) {
    interactionCSS += `
      .canvas-svg-mount #${selectedElementId} {
        outline: 2px dashed #6366f1 !important;
        outline-offset: 4px !important;
        filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.6)) !important;
      }
    `;
  }
  if (hoveredElementId && hoveredElementId !== selectedElementId) {
    interactionCSS += `
      .canvas-svg-mount #${hoveredElementId} {
        outline: 1.5px dashed rgba(129, 140, 248, 0.6) !important;
        outline-offset: 2px !important;
        cursor: pointer;
      }
    `;
  }
  hiddenLayers.forEach((hiddenId) => {
    interactionCSS += `
      .canvas-svg-mount #${hiddenId} {
        display: none !important;
      }
    `;
  });

  const getBackgroundStyle = () => {
    if (bgType === 'checkerboard') {
      return {};
    }
    return {
      backgroundColor: bgType === 'custom' ? customBgColor : bgType,
      backgroundImage: 'none'
    };
  };

  return (
    <div
      className={`svg-canvas-viewport ${isPanning ? 'panning' : ''}`}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onClick={() => onSelectElement(null)}
    >
      {/* Dynamic CSS Injection */}
      <style>{`
        ${generatedCSS}
        ${interactionCSS}
      `}</style>

      {/* Floating Canvas Controls Toolbar */}
      <div className="canvas-controls-overlay" onClick={(e) => e.stopPropagation()}>
        <div className="canvas-btn-group">
          <button className="canvas-control-btn" onClick={handleZoomOut} title="Zoom Out (Ctrl+Minus)">
            <ZoomOut size={16} />
          </button>
          <span className="canvas-zoom-text">{Math.round(zoom * 100)}%</span>
          <button className="canvas-control-btn" onClick={handleZoomIn} title="Zoom In (Ctrl+Plus)">
            <ZoomIn size={16} />
          </button>
          <button className="canvas-control-btn" onClick={handleFitToCanvas} title="Fit to Canvas">
            <Maximize2 size={15} />
          </button>
          <button className="canvas-control-btn" onClick={handleResetView} title="Reset View">
            <RotateCcw size={15} />
          </button>
        </div>

        <div className="canvas-divider" />

        {/* Background Selector */}
        <div className="canvas-bg-picker-wrap">
          <button
            className={`canvas-control-btn ${showBgPicker ? 'active' : ''}`}
            onClick={() => setShowBgPicker(!showBgPicker)}
            title="Canvas Background"
          >
            <Palette size={16} />
          </button>

          {showBgPicker && (
            <div className="canvas-bg-dropdown">
              <div className="bg-dropdown-title">Canvas Background</div>
              <div className="bg-presets-list">
                {BG_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    className={`bg-preset-btn ${bgType === p.value ? 'selected' : ''}`}
                    onClick={() => {
                      setBgType(p.value);
                      setShowBgPicker(false);
                    }}
                  >
                    <span
                      className={`bg-swatch ${p.value === 'checkerboard' ? 'swatch-checker' : ''}`}
                      style={p.value !== 'checkerboard' ? { backgroundColor: p.value } : {}}
                    />
                    <span>{p.label}</span>
                    {bgType === p.value && <Check size={14} className="swatch-check" />}
                  </button>
                ))}
              </div>
              <div className="bg-custom-color-row">
                <span>Custom:</span>
                <input
                  type="color"
                  value={customBgColor}
                  onChange={(e) => {
                    setCustomBgColor(e.target.value);
                    setBgType('custom');
                  }}
                  className="bg-color-picker-input"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Element Floating Badge */}
      {selectedElementId && (
        <div className="canvas-selection-badge" onClick={(e) => e.stopPropagation()}>
          <span className="selection-badge-indicator" />
          <span className="selection-badge-label">Selected: #{selectedElementId}</span>
          <button
            className="selection-badge-clear"
            onClick={() => onSelectElement(null)}
            title="Deselect (Escape)"
          >
            &times;
          </button>
        </div>
      )}

      {/* Center Artboard Container */}
      <div
        className="canvas-artboard-container"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
        }}
      >
        <div
          className={`canvas-artboard ${bgType === 'checkerboard' ? 'checkerboard-pattern' : ''}`}
          style={getBackgroundStyle()}
        >
          <div
            ref={svgWrapperRef}
            className="canvas-svg-mount"
            onClick={handleSvgClick}
            onMouseMove={handleSvgMouseMove}
            onMouseLeave={handleSvgMouseLeave}
            dangerouslySetInnerHTML={{ __html: svgString }}
          />
        </div>
      </div>
    </div>
  );
}
