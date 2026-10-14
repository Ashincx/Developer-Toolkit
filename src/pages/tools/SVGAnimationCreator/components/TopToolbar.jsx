import React from 'react';
import {
  Undo2,
  Redo2,
  RotateCcw,
  Upload,
  Code,
  Download,
  Play,
  Pause,
  Sparkles
} from 'lucide-react';

export default function TopToolbar({
  projectName,
  setProjectName,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
  isPlaying,
  onTogglePlay,
  onOpenUpload,
  onOpenCodeEditor,
  onOpenExport,
  playbackSpeed,
  onChangeSpeed
}) {
  return (
    <header className="svg-top-toolbar">
      <div className="toolbar-left">
        <div className="toolbar-title-wrap">
          <div className="toolbar-badge-icon">
            <Sparkles size={18} />
          </div>
          <div className="toolbar-title-content">
            <input
              type="text"
              className="project-name-input"
              value={projectName || ''}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project Name"
              title="Click to rename project"
            />
          </div>
        </div>

        <div className="toolbar-divider" />

        {/* History actions */}
        <div className="toolbar-btn-group">
          <button
            className="toolbar-icon-btn"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <Undo2 size={16} />
          </button>
          <button
            className="toolbar-icon-btn"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
          >
            <Redo2 size={16} />
          </button>
          <button
            className="toolbar-icon-btn"
            onClick={onReset}
            title="Reset to default"
            aria-label="Reset"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div className="toolbar-center">
        {/* Playback & Speed Controls */}
        <div className="playback-pill">
          <button
            className={`playback-toggle-btn ${isPlaying ? 'playing' : ''}`}
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <div className="speed-selector">
            {[0.5, 1, 1.5, 2].map((speed) => (
              <button
                key={speed}
                className={`speed-option ${playbackSpeed === speed ? 'active' : ''}`}
                onClick={() => onChangeSpeed(speed)}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="toolbar-right">
        {/* Quick Sample Selector Dropdown */}
        <div className="samples-quick-dropdown">
          <button className="toolbar-action-btn" onClick={onOpenUpload} title="Import or choose sample">
            <Upload size={15} />
            <span>Import / Samples</span>
          </button>
        </div>

        {/* Code Editor */}
        <button
          className="toolbar-action-btn"
          onClick={onOpenCodeEditor}
          title="Inspect SVG & CSS code"
        >
          <Code size={15} />
          <span>Code</span>
        </button>

        {/* Export Button */}
        <button
          className="btn btn-primary toolbar-export-btn"
          onClick={onOpenExport}
          title="Export Standalone SVG, HTML, React JSX, or JSON"
        >
          <Download size={15} />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
}
