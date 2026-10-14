import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Repeat,
  Plus,
  Clock,
  Layers
} from 'lucide-react';

export default function AnimationTimeline({
  layers = [],
  animations = {},
  selectedElementId,
  onSelectElement,
  isPlaying,
  onTogglePlay,
  onRestart,
  currentTime,
  onScrub,
  onUpdateAnimation,
  totalDuration = 4,
  setTotalDuration
}) {
  const rulerRef = useRef(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [isLooping, setIsLooping] = useState(true);

  // Calculate maximum duration among all active animations
  const maxActiveDuration = Math.max(
    totalDuration,
    ...Object.values(animations)
      .filter((a) => a && a.enabled)
      .map((a) => (a.delay || 0) + (a.duration || 1))
  );

  // Time ticks for ruler (every 0.5s or 1s)
  const ticks = [];
  const tickStep = maxActiveDuration <= 4 ? 0.5 : 1;
  for (let t = 0; t <= maxActiveDuration; t += tickStep) {
    ticks.push(t);
  }

  // Handle click or drag on ruler/timeline
  const handleSeek = useCallback(
    (e) => {
      if (!rulerRef.current) return;
      const rect = rulerRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const ratio = clickX / rect.width;
      const newTime = Math.max(0, Math.min(ratio * maxActiveDuration, maxActiveDuration));
      onScrub(parseFloat(newTime.toFixed(2)));
    },
    [maxActiveDuration, onScrub]
  );

  const handleMouseDownPlayhead = (e) => {
    e.stopPropagation();
    setIsDraggingPlayhead(true);
    handleSeek(e);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingPlayhead) {
        handleSeek(e);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingPlayhead) {
        setIsDraggingPlayhead(false);
      }
    };

    if (isDraggingPlayhead) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPlayhead, handleSeek]);

  // Add keyframe at current scrub time
  const handleAddKeyframe = (elementId) => {
    const anim = animations[elementId];
    if (!anim) return;

    const currentKeyframes = anim.keyframes ? [...anim.keyframes] : [];
    const relTime = Math.max(0, currentTime - (anim.delay || 0));
    const progress = Math.min(100, Math.max(0, Math.round((relTime / (anim.duration || 1)) * 100)));

    // Check if keyframe at this progress already exists
    const exists = currentKeyframes.some((kf) => Math.abs(kf.progress - progress) < 3);
    if (!exists) {
      currentKeyframes.push({
        id: `kf-${Date.now()}`,
        progress,
        properties: { transform: 'scale(1)', opacity: 1 }
      });
      currentKeyframes.sort((a, b) => a.progress - b.progress);

      onUpdateAnimation(elementId, {
        ...anim,
        keyframes: currentKeyframes
      });
    }
  };

  // Remove keyframe
  const handleRemoveKeyframe = (elementId, kfIndex) => {
    const anim = animations[elementId];
    if (!anim || !anim.keyframes) return;

    const newKeyframes = anim.keyframes.filter((_, idx) => idx !== kfIndex);
    onUpdateAnimation(elementId, {
      ...anim,
      keyframes: newKeyframes
    });
  };

  const playheadPercent = Math.min(100, Math.max(0, (currentTime / maxActiveDuration) * 100));

  return (
    <div className="svg-timeline-panel">
      {/* Timeline Transport Header */}
      <div className="timeline-header">
        <div className="transport-controls">
          <button
            className="transport-btn"
            onClick={onRestart}
            title="Restart from beginning (0:00)"
          >
            <RotateCcw size={15} />
          </button>
          <button
            className={`transport-btn play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            className={`transport-btn ${isLooping ? 'active' : ''}`}
            onClick={() => setIsLooping(!isLooping)}
            title={isLooping ? 'Looping enabled' : 'Looping disabled'}
          >
            <Repeat size={14} />
          </button>
          <div className="timeline-time-display">
            <span className="current-time">{currentTime.toFixed(2)}s</span>
            <span className="time-divider">/</span>
            <span className="total-time">{maxActiveDuration.toFixed(1)}s</span>
          </div>
        </div>

        <div className="timeline-right-settings">
          <div className="total-duration-picker">
            <Clock size={13} />
            <span>Duration:</span>
            <select
              value={totalDuration}
              onChange={(e) => setTotalDuration(parseFloat(e.target.value))}
              className="timeline-duration-select"
            >
              <option value="2">2s</option>
              <option value="3">3s</option>
              <option value="4">4s</option>
              <option value="6">6s</option>
              <option value="8">8s</option>
              <option value="10">10s</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline Body: Track headers on left, Ruler & Track bars on right */}
      <div className="timeline-body">
        {/* Left Track Names Column */}
        <div className="timeline-tracks-header-col">
          <div className="tracks-header-cell">
            <Layers size={13} />
            <span>Layers & Tracks</span>
          </div>

          <div className="tracks-header-list">
            {layers.map((layer) => {
              const anim = animations[layer.id];
              const isSelected = selectedElementId === layer.id;
              const hasAnim = anim && anim.enabled;

              return (
                <div
                  key={layer.id}
                  className={`track-header-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectElement(layer.id)}
                >
                  <span className="track-row-label" title={layer.id}>
                    {layer.label}
                  </span>
                  {hasAnim ? (
                    <span className="track-preset-chip" title={anim.preset}>
                      {anim.preset}
                    </span>
                  ) : (
                    <span className="track-no-anim">static</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Track Bars & Ruler Column */}
        <div className="timeline-ruler-tracks-col">
          {/* Time Ruler */}
          <div
            className="timeline-ruler"
            ref={rulerRef}
            onClick={handleSeek}
            onMouseDown={handleMouseDownPlayhead}
          >
            {ticks.map((t) => {
              const leftPercent = (t / maxActiveDuration) * 100;
              return (
                <div
                  key={t}
                  className="ruler-tick"
                  style={{ left: `${leftPercent}%` }}
                >
                  <div className="ruler-tick-mark" />
                  <span className="ruler-tick-label">{t}s</span>
                </div>
              );
            })}

            {/* Red Playhead Line and Handle */}
            <div
              className="timeline-playhead"
              style={{ left: `${playheadPercent}%` }}
            >
              <div className="playhead-handle" />
              <div className="playhead-line" />
            </div>
          </div>

          {/* Tracks Lanes */}
          <div className="tracks-lanes-container" onClick={handleSeek}>
            {/* Global playhead line across tracks */}
            <div
              className="tracks-playhead-line"
              style={{ left: `${playheadPercent}%` }}
            />

            {layers.map((layer) => {
              const anim = animations[layer.id];
              const isSelected = selectedElementId === layer.id;
              const hasAnim = anim && anim.enabled;

              if (!hasAnim) {
                return (
                  <div
                    key={layer.id}
                    className={`track-lane-row empty ${isSelected ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectElement(layer.id);
                    }}
                  >
                    <span className="lane-placeholder-text">Click to animate</span>
                  </div>
                );
              }

              const delay = anim.delay || 0;
              const duration = anim.duration || 1;
              const blockLeft = (delay / maxActiveDuration) * 100;
              const blockWidth = (duration / maxActiveDuration) * 100;
              const keyframes = anim.keyframes || [];

              return (
                <div
                  key={layer.id}
                  className={`track-lane-row ${isSelected ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectElement(layer.id);
                  }}
                >
                  {/* Animation Span Block */}
                  <div
                    className="track-anim-block"
                    style={{
                      left: `${blockLeft}%`,
                      width: `${Math.min(blockWidth, 100 - blockLeft)}%`
                    }}
                  >
                    <span className="anim-block-title">{anim.preset} ({duration}s)</span>

                    {/* Keyframe Points along the block */}
                    {keyframes.map((kf, kfIdx) => {
                      const kfPercent = kf.progress;
                      return (
                        <div
                          key={kf.id || kfIdx}
                          className="keyframe-diamond"
                          style={{ left: `${kfPercent}%` }}
                          title={`Keyframe at ${kfPercent}% - Left click to select, Right click to delete`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectElement(layer.id);
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveKeyframe(layer.id, kfIdx);
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Add keyframe quick button */}
                  {isSelected && (
                    <button
                      className="lane-add-kf-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddKeyframe(layer.id);
                      }}
                      title="Add keyframe at current playhead"
                    >
                      <Plus size={11} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
