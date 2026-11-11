import { useRef, useState, useCallback, useEffect } from 'react';
import {
  Loader2,
  Smartphone,
  Tablet,
  ArrowDown,
  ArrowUp,
  ChevronsDown,
  ChevronsUp
} from 'lucide-react';

export default function BrowserPreview({
  previewFrame,
  width,
  height,
  zoom,
  isLoading,
  statusMessage,
  isInspectMode,
  selectedElement,
  hoveredRect,
  inspectedPoint,
  onClick,
  onHover,
  onScroll,
  onType,
  onKey,
  deviceId,
  isLandscape
}) {
  const containerRef = useRef(null);
  const viewportRef = useRef(null);
  const [deviceFrameEnabled, setDeviceFrameEnabled] = useState(true);

  // Inertia / momentum animation reference
  const momentumRafRef = useRef(null);
  const smoothIntervalRef = useRef(null);

  // Wheel accumulator for smooth 60fps wheel scrolling
  const wheelAccRef = useRef({ dx: 0, dy: 0, x: 0, y: 0, rafId: null });

  // Drag-to-scroll & Touch velocity tracking
  const dragRef = useRef({
    isDown: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    vx: 0,
    vy: 0,
    hasMoved: false,
    startCoords: null
  });

  // Cleanup any active momentum or smooth scroll intervals on unmount
  useEffect(() => {
    return () => {
      const curMomentum = momentumRafRef.current;
      const curWheelRaf = wheelAccRef.current.rafId;
      const curSmooth = smoothIntervalRef.current;
      if (curMomentum) cancelAnimationFrame(curMomentum);
      if (curWheelRaf) cancelAnimationFrame(curWheelRaf);
      if (curSmooth) clearInterval(curSmooth);
    };
  }, []);

  // Map pointer coordinates on preview image to real browser viewport pixels
  const getCoordinates = useCallback((e) => {
    if (!viewportRef.current) return null;
    const rect = viewportRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    const scaleX = width / rect.width;
    const scaleY = height / rect.height;

    const x = Math.max(0, Math.min(width, Math.round((e.clientX - rect.left) * scaleX)));
    const y = Math.max(0, Math.min(height, Math.round((e.clientY - rect.top) * scaleY)));

    return { x, y };
  }, [width, height]);

  const handlePointerDown = (e) => {
    // Touching screen immediately halts any active momentum
    if (momentumRafRef.current) {
      cancelAnimationFrame(momentumRafRef.current);
      momentumRafRef.current = null;
    }
    if (smoothIntervalRef.current) {
      clearInterval(smoothIntervalRef.current);
      smoothIntervalRef.current = null;
    }

    const coords = getCoordinates(e);
    if (!coords) return;

    dragRef.current = {
      isDown: true,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      lastTime: performance.now(),
      vx: 0,
      vy: 0,
      hasMoved: false,
      startCoords: coords
    };

    if (e.target.setPointerCapture) {
      try { e.target.setPointerCapture(e.pointerId); } catch (err) {}
    }
  };

  const handlePointerMove = (e) => {
    const coords = getCoordinates(e);
    if (!coords) return;

    if (isInspectMode) {
      onHover(coords.x, coords.y);
      return;
    }

    if (dragRef.current.isDown) {
      const totalDx = Math.abs(e.clientX - dragRef.current.startX);
      const totalDy = Math.abs(e.clientY - dragRef.current.startY);

      if (totalDx > 4 || totalDy > 4) {
        dragRef.current.hasMoved = true;

        const now = performance.now();
        const dt = Math.max(1, now - (dragRef.current.lastTime || now));

        // Natural touch swipe: moving finger up scrolls page DOWN
        const stepX = (dragRef.current.lastX - e.clientX) * 1.25;
        const stepY = (dragRef.current.lastY - e.clientY) * 1.25;

        // Calculate velocity (pixels per ms)
        dragRef.current.vx = stepX / dt;
        dragRef.current.vy = stepY / dt;

        dragRef.current.lastX = e.clientX;
        dragRef.current.lastY = e.clientY;
        dragRef.current.lastTime = now;

        onScroll(stepX, stepY, coords.x, coords.y);
      }
    }
  };

  const handlePointerUp = (e) => {
    if (!dragRef.current.isDown) return;

    const coords = getCoordinates(e) || dragRef.current.startCoords;
    const wasDragging = dragRef.current.hasMoved;

    const vy = dragRef.current.vy;
    const vx = dragRef.current.vx;

    dragRef.current.isDown = false;
    dragRef.current.hasMoved = false;

    if (e.target.releasePointerCapture) {
      try { e.target.releasePointerCapture(e.pointerId); } catch (err) {}
    }

    // Only fire click if the user didn't drag/swipe
    if (!wasDragging && coords) {
      onClick(coords.x, coords.y);
      return;
    }

    // If released with velocity, trigger smooth iOS-like inertia momentum
    if (wasDragging && (Math.abs(vy) > 0.08 || Math.abs(vx) > 0.08) && coords) {
      let currentVy = vy * 16; // per-frame initial delta
      let currentVx = vx * 16;
      const friction = 0.93; // iOS momentum decay rate

      const stepMomentum = () => {
        if (Math.abs(currentVy) < 0.4 && Math.abs(currentVx) < 0.4) {
          momentumRafRef.current = null;
          return;
        }

        onScroll(currentVx, currentVy, coords.x, coords.y);
        currentVy *= friction;
        currentVx *= friction;

        momentumRafRef.current = requestAnimationFrame(stepMomentum);
      };

      momentumRafRef.current = requestAnimationFrame(stepMomentum);
    }
  };

  // Smooth wheel scrolling with requestAnimationFrame throttling
  const handleWheel = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Cancel any active momentum on wheel roll
    if (momentumRafRef.current) {
      cancelAnimationFrame(momentumRafRef.current);
      momentumRafRef.current = null;
    }
    if (smoothIntervalRef.current) {
      clearInterval(smoothIntervalRef.current);
      smoothIntervalRef.current = null;
    }

    const coords = getCoordinates(e);
    wheelAccRef.current.dx += e.deltaX;
    wheelAccRef.current.dy += e.deltaY;
    wheelAccRef.current.x = coords ? coords.x : width / 2;
    wheelAccRef.current.y = coords ? coords.y : height / 2;

    if (!wheelAccRef.current.rafId) {
      wheelAccRef.current.rafId = requestAnimationFrame(() => {
        const { dx, dy, x, y } = wheelAccRef.current;
        wheelAccRef.current.dx = 0;
        wheelAccRef.current.dy = 0;
        wheelAccRef.current.rafId = null;
        onScroll(dx, dy, x, y);
      });
    }
  };

  // Smooth multi-step scroll for Up and Down buttons
  const smoothStep = (targetDy) => {
    if (momentumRafRef.current) {
      cancelAnimationFrame(momentumRafRef.current);
      momentumRafRef.current = null;
    }
    if (smoothIntervalRef.current) {
      clearInterval(smoothIntervalRef.current);
    }

    const steps = 4;
    const slice = targetDy / steps;
    let count = 0;

    smoothIntervalRef.current = setInterval(() => {
      onScroll(0, slice, width / 2, height / 2);
      count++;
      if (count >= steps) {
        clearInterval(smoothIntervalRef.current);
        smoothIntervalRef.current = null;
      }
    }, 25);
  };

  const handleKeyDown = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      smoothStep(180);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      smoothStep(-180);
    } else if (e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
      e.preventDefault();
      smoothStep(height * 0.7);
    } else if (e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) {
      e.preventDefault();
      smoothStep(-height * 0.7);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onScroll(0, -999999, width / 2, height / 2);
    } else if (e.key === 'End') {
      e.preventDefault();
      onScroll(0, 999999, width / 2, height / 2);
    } else if (e.key === 'Backspace' || e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();
      onKey(e.key);
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      onType(e.key);
    }
  };

  const isMobilePreset = deviceId.startsWith('iphone') || deviceId.startsWith('ipad');
  const isTablet = deviceId.startsWith('ipad');

  return (
    <div
      className="inspector-preview-workspace"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      ref={containerRef}
    >
      {/* Top Preview Controls Bar */}
      <div className="preview-meta-bar">
        <div className="preview-dimensions-badge">
          {width} × {height} px <span className="meta-sub">({zoom}%)</span>
        </div>

        {isMobilePreset && (
          <button
            type="button"
            className={`btn-device-frame-toggle ${deviceFrameEnabled ? 'active' : ''}`}
            onClick={() => setDeviceFrameEnabled(!deviceFrameEnabled)}
          >
            {isTablet ? <Tablet size={13} /> : <Smartphone size={13} />}
            <span>Device Bezel</span>
          </button>
        )}

        {/* Quick Page Scroll Controls */}
        <div className="preview-quick-scroll-actions">
          <button
            type="button"
            className="btn-scroll-action-pill"
            onClick={() => onScroll(0, -999999, width / 2, height / 2)}
            title="Scroll directly to top of page (Home key)"
          >
            <ChevronsUp size={12} />
            <span>Top</span>
          </button>
          <button
            type="button"
            className="btn-scroll-action-pill"
            onClick={() => smoothStep(-300)}
            title="Smooth scroll up (ArrowUp key)"
          >
            <ArrowUp size={12} />
            <span>Up</span>
          </button>
          <button
            type="button"
            className="btn-scroll-action-pill"
            onClick={() => smoothStep(300)}
            title="Smooth scroll down (ArrowDown key)"
          >
            <ArrowDown size={12} />
            <span>Down</span>
          </button>
          <button
            type="button"
            className="btn-scroll-action-pill"
            onClick={() => onScroll(0, 999999, width / 2, height / 2)}
            title="Scroll directly to bottom of mobile page (End key)"
          >
            <ChevronsDown size={12} />
            <span>Bottom</span>
          </button>
        </div>

        <div className="disclaimer-badge">
          WebKit Emulation (Windows)
        </div>
      </div>

      {/* Viewport Frame with Zoom */}
      <div className="preview-stage-centering">
        <div
          className={`preview-device-chassis ${deviceFrameEnabled && isMobilePreset ? (isTablet ? 'tablet-chassis' : 'phone-chassis') : 'frameless'} ${isLandscape ? 'landscape' : ''}`}
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center'
          }}
        >
          {deviceFrameEnabled && isMobilePreset && (
            <div className="chassis-notch-bar">
              <div className="dynamic-island">
                <div className="island-camera" />
              </div>
            </div>
          )}

          {/* Interactive Screen Surface */}
          <div
            ref={viewportRef}
            className={`preview-screen-viewport ${isInspectMode ? 'inspect-cursor' : 'interactive-cursor'}`}
            style={{
              width: `${width}px`,
              height: `${height}px`
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onWheel={handleWheel}
          >
            {previewFrame ? (
              <img
                src={previewFrame}
                alt="WebKit Render"
                className="preview-render-img"
                draggable={false}
              />
            ) : (
              <div className="preview-placeholder">
                <Loader2 className="spin-icon" size={32} />
                <p>Initializing WebKit viewport...</p>
              </div>
            )}

            {/* Element Selection Highlight Overlay */}
            {selectedElement && selectedElement.rect && (
              <div
                className="element-highlight-box"
                style={{
                  left: `${selectedElement.rect.x}px`,
                  top: `${selectedElement.rect.y}px`,
                  width: `${selectedElement.rect.width}px`,
                  height: `${selectedElement.rect.height}px`
                }}
              >
                <div className="highlight-pill">
                  <span className="tag-name">{selectedElement.tag}</span>
                  {selectedElement.id && <span className="el-id">#{selectedElement.id}</span>}
                  {selectedElement.className && (
                    <span className="el-class">.{selectedElement.className.split(' ')[0]}</span>
                  )}
                  <span className="el-size">
                    {selectedElement.rect.width} × {selectedElement.rect.height}
                  </span>
                </div>
              </div>
            )}

            {/* Anchored Inspection Pointer Marker - Stays where element was clicked */}
            {inspectedPoint && (
              <div
                className="inspected-pointer-marker"
                style={{
                  left: `${inspectedPoint.x}px`,
                  top: `${inspectedPoint.y}px`
                }}
                title={`Inspected target at (${inspectedPoint.x}, ${inspectedPoint.y})`}
              >
                <div className="pointer-target-ring" />
                <div className="pointer-pulse-dot" />
                <div className="pointer-center-pin" />
              </div>
            )}

            {/* Loading Overlay */}
            {isLoading && (
              <div className="preview-loading-overlay">
                <Loader2 className="spin-icon" size={28} />
                <span>{statusMessage || 'Rendering...'}</span>
              </div>
            )}
          </div>

          {deviceFrameEnabled && isMobilePreset && (
            <div className="chassis-home-bar-area">
              <div className="home-indicator" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
