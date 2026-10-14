import React, { useState, useEffect, useRef, useCallback } from 'react';
import ToolLayout from '../../../components/ToolLayout';
import TopToolbar from './components/TopToolbar';
import SVGCanvas from './components/SVGCanvas';
import AnimationPresetPanel from './components/AnimationPresetPanel';
import SVGLayersPanel from './components/SVGLayersPanel';
import AnimationProperties from './components/AnimationProperties';
import AnimationTimeline from './components/AnimationTimeline';
import SVGUploadModal from './components/SVGUploadModal';
import SVGCodeEditorModal from './components/SVGCodeEditorModal';
import AnimationExportModal from './components/AnimationExportModal';
import SVGPalettePanel from './components/SVGPalettePanel';

import { sampleSvgs } from './utils/sampleSvgs';
import { sanitizeAndParseSvg, updateElementStyleInSvg, replaceGlobalColorInSvg } from './utils/svgSanitizer';
import { createDefaultAnimation } from './utils/animationPresets';

import './SVGAnimationCreator.css';

export default function SVGAnimationCreator() {
  // Initialize with the Rocket Launch sample
  const initialSample = sampleSvgs[0];
  const parsedInitial = sanitizeAndParseSvg(initialSample.svg);

  // Setup initial animation presets on sample elements for a stunning first impression
  const initialAnimations = {
    'flame-outer': createDefaultAnimation('flame-outer', 'bounce', 0),
    'flame-inner': createDefaultAnimation('flame-inner', 'pulse', 0.1),
    'smoke-1': createDefaultAnimation('smoke-1', 'float', 0.2),
    'smoke-2': createDefaultAnimation('smoke-2', 'float', 0.4),
    'smoke-3': createDefaultAnimation('smoke-3', 'pulse', 0.3),
    'star-1': createDefaultAnimation('star-1', 'pulse', 0.2),
    'star-2': createDefaultAnimation('star-2', 'pulse', 0.5),
    'star-3': createDefaultAnimation('star-3', 'opacityChange', 0.7),
    'star-4': createDefaultAnimation('star-4', 'opacityChange', 0.9),
    'rocket-ship': createDefaultAnimation('rocket-ship', 'float', 0)
  };

  const [projectName, setProjectName] = useState(initialSample.name);
  const [svgString, setSvgString] = useState(parsedInitial.sanitizedSvg);
  const [layers, setLayers] = useState(parsedInitial.layers);
  const [selectedElementId, setSelectedElementId] = useState('rocket-ship');
  const [animations, setAnimations] = useState(initialAnimations);
  const [hiddenLayers, setHiddenLayers] = useState(new Set());
  const [copiedAnimation, setCopiedAnimation] = useState(null);

  // Left Sidebar Tab ('presets' or 'layers')
  const [leftTab, setLeftTab] = useState('presets');

  // Playback state
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [totalDuration, setTotalDuration] = useState(3.5);

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCodeEditorModalOpen, setIsCodeEditorModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // History stack for Undo / Redo
  const [history, setHistory] = useState([
    {
      svgString: parsedInitial.sanitizedSvg,
      layers: parsedInitial.layers,
      animations: initialAnimations,
      projectName: initialSample.name
    }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pushHistory = useCallback(
    (newAnimations, newSvgString, newLayers, newProjectName) => {
      const snap = {
        animations: JSON.parse(JSON.stringify(newAnimations || animations)),
        svgString: newSvgString || svgString,
        layers: newLayers || layers,
        projectName: newProjectName || projectName
      };
      const trimmed = history.slice(0, historyIndex + 1);
      trimmed.push(snap);
      if (trimmed.length > 40) trimmed.shift();
      setHistory(trimmed);
      setHistoryIndex(trimmed.length - 1);
    },
    [history, historyIndex, animations, svgString, layers, projectName]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const target = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setAnimations(JSON.parse(JSON.stringify(target.animations)));
      setSvgString(target.svgString);
      setLayers(target.layers);
      setProjectName(target.projectName);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const target = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setAnimations(JSON.parse(JSON.stringify(target.animations)));
      setSvgString(target.svgString);
      setLayers(target.layers);
      setProjectName(target.projectName);
    }
  }, [historyIndex, history]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Animation Playback Engine (requestAnimationFrame loop)
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    const loop = (now) => {
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (isPlaying && !isScrubbing) {
        setCurrentTime((prev) => {
          const next = prev + delta * playbackSpeed;
          return next >= totalDuration ? 0 : next;
        });
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, isScrubbing, playbackSpeed, totalDuration]);

  const handleRemoveAnimation = useCallback(
    (elementId) => {
      setAnimations((prev) => {
        const updated = { ...prev };
        delete updated[elementId];
        pushHistory(updated);
        return updated;
      });
    },
    [pushHistory]
  );

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
        setIsScrubbing(false);
      } else if (e.key === 'Escape') {
        setSelectedElementId(null);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId && animations[selectedElementId]) {
          handleRemoveAnimation(selectedElementId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, animations, handleUndo, handleRedo, handleRemoveAnimation]);

  // Handlers for SVG Loading & Project Import
  const handleLoadSvg = (rawMarkup, name = 'Imported SVG') => {
    const parsed = sanitizeAndParseSvg(rawMarkup);
    setSvgString(parsed.sanitizedSvg);
    setLayers(parsed.layers);
    setProjectName(name);
    setSelectedElementId(parsed.layers[0]?.id || null);
    setAnimations({});
    setHiddenLayers(new Set());
    setCurrentTime(0);
    pushHistory({}, parsed.sanitizedSvg, parsed.layers, name);
  };

  const handleLoadProject = (projectData) => {
    setSvgString(projectData.svgString);
    setLayers(projectData.layers || []);
    setAnimations(projectData.animations || {});
    setProjectName(projectData.name || 'Imported Project');
    setSelectedElementId(projectData.layers?.[0]?.id || null);
    setCurrentTime(0);
    pushHistory(projectData.animations, projectData.svgString, projectData.layers, projectData.name);
  };

  // Handlers for Animation Mutations
  const handleUpdateAnimation = (elementId, newConfig) => {
    const updated = {
      ...animations,
      [elementId]: newConfig
    };
    setAnimations(updated);
    pushHistory(updated);
  };

  const handleApplyPreset = (presetId) => {
    let targetId = selectedElementId;
    if (!targetId && layers.length > 0) {
      targetId = layers[0].id;
      setSelectedElementId(targetId);
    }
    if (!targetId) return;

    const existing = animations[targetId];
    const newAnim = createDefaultAnimation(targetId, presetId, existing?.delay || 0);
    handleUpdateAnimation(targetId, newAnim);
  };

  const handleApplyToAll = (presetId) => {
    const updated = { ...animations };
    layers.forEach((layer) => {
      updated[layer.id] = createDefaultAnimation(layer.id, presetId, 0);
    });
    setAnimations(updated);
    pushHistory(updated);
  };

  const handleApplyStagger = (staggerStep = 0.15) => {
    const updated = { ...animations };
    layers.forEach((layer, idx) => {
      const existing = updated[layer.id] || createDefaultAnimation(layer.id, 'float', 0);
      updated[layer.id] = {
        ...existing,
        delay: parseFloat((idx * staggerStep).toFixed(2))
      };
    });
    setAnimations(updated);
    pushHistory(updated);
  };


  const handleClearAllAnimations = () => {
    setAnimations({});
    pushHistory({});
  };

  const handleCopyAnimation = (elementId) => {
    if (animations[elementId]) {
      setCopiedAnimation(JSON.parse(JSON.stringify(animations[elementId])));
    }
  };

  const handlePasteAnimation = (elementId) => {
    if (!copiedAnimation) return;
    const pasted = {
      ...copiedAnimation,
      elementId
    };
    handleUpdateAnimation(elementId, pasted);
  };

  const handleDuplicateToAll = (sourceElementId) => {
    const source = animations[sourceElementId];
    if (!source) return;
    const updated = { ...animations };
    layers.forEach((layer) => {
      if (layer.id !== sourceElementId) {
        updated[layer.id] = {
          ...JSON.parse(JSON.stringify(source)),
          elementId: layer.id
        };
      }
    });
    setAnimations(updated);
    pushHistory(updated);
  };

  const handleUpdateElementStyle = (elementId, styles, applyToChildren = false) => {
    const result = updateElementStyleInSvg(svgString, elementId, styles, applyToChildren);
    setSvgString(result.svgString);
    setLayers(result.layers);
    pushHistory(animations, result.svgString, result.layers);
  };

  const handleReplaceGlobalColor = (oldColor, newColor) => {
    const result = replaceGlobalColorInSvg(svgString, oldColor, newColor);
    setSvgString(result.svgString);
    setLayers(result.layers);
    pushHistory(animations, result.svgString, result.layers);
  };

  const handleToggleHideLayer = (layerId) => {
    setHiddenLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) next.delete(layerId);
      else next.add(layerId);
      return next;
    });
  };

  const handleScrub = (time) => {
    setIsPlaying(false);
    setIsScrubbing(true);
    setCurrentTime(time);
  };

  const handleRestart = () => {
    setCurrentTime(0);
    setIsPlaying(true);
    setIsScrubbing(false);
  };

  const handleReset = () => {
    handleLoadSvg(initialSample.svg, initialSample.name);
    setAnimations(initialAnimations);
  };

  const selectedLayer = layers.find((l) => l.id === selectedElementId);
  const selectedAnimation = selectedElementId ? animations[selectedElementId] : null;

  return (
    <ToolLayout
      id="svg-animation"
      title="SVG Animation Creator"
      description="Create, animate, timeline, and export production-ready animated SVGs without dependencies."
    >
      <div className="svg-creator-workspace">
        {/* Top Action Toolbar */}
        <TopToolbar
          projectName={projectName}
          setProjectName={setProjectName}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onReset={handleReset}
          isPlaying={isPlaying}
          onTogglePlay={() => {
            setIsPlaying((prev) => !prev);
            setIsScrubbing(false);
          }}
          onOpenUpload={() => setIsUploadModalOpen(true)}
          onOpenCodeEditor={() => setIsCodeEditorModalOpen(true)}
          onOpenExport={() => setIsExportModalOpen(true)}
          playbackSpeed={playbackSpeed}
          onChangeSpeed={setPlaybackSpeed}
        />

        {/* 3-Column Main Editor Stage */}
        <div className="svg-creator-main-stage">
          {/* Left Panel: Tabs for Presets & Layers */}
          <aside className="svg-creator-left-sidebar">
            <div className="left-sidebar-tabs">
              <button
                className={`left-sidebar-tab ${leftTab === 'presets' ? 'active' : ''}`}
                onClick={() => setLeftTab('presets')}
              >
                Presets
              </button>
              <button
                className={`left-sidebar-tab ${leftTab === 'layers' ? 'active' : ''}`}
                onClick={() => setLeftTab('layers')}
              >
                Layers ({layers.length})
              </button>
              <button
                className={`left-sidebar-tab ${leftTab === 'colors' ? 'active' : ''}`}
                onClick={() => setLeftTab('colors')}
              >
                Colors
              </button>
            </div>

            <div className="left-sidebar-content">
              {leftTab === 'presets' && (
                <AnimationPresetPanel
                  selectedElementId={selectedElementId}
                  selectedLayer={selectedLayer}
                  onApplyPreset={handleApplyPreset}
                  onApplyToAll={handleApplyToAll}
                  onApplyStagger={handleApplyStagger}
                />
              )}
              {leftTab === 'layers' && (
                <SVGLayersPanel
                  layers={layers}
                  animations={animations}
                  selectedElementId={selectedElementId}
                  onSelectElement={setSelectedElementId}
                  hiddenLayers={hiddenLayers}
                  onToggleHideLayer={handleToggleHideLayer}
                  onRemoveAnimation={handleRemoveAnimation}
                  onClearAllAnimations={handleClearAllAnimations}
                />
              )}
              {leftTab === 'colors' && (
                <SVGPalettePanel
                  layers={layers}
                  onReplaceGlobalColor={handleReplaceGlobalColor}
                />
              )}
            </div>
          </aside>

          {/* Center Canvas Area */}
          <main className="svg-creator-center-canvas">
            <SVGCanvas
              svgString={svgString}
              animations={animations}
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              playbackSpeed={playbackSpeed}
              isScrubbing={isScrubbing}
              scrubTime={currentTime}
              hiddenLayers={hiddenLayers}
            />
          </main>

          {/* Right Panel: Animation & Element Properties */}
          <aside className="svg-creator-right-sidebar">
            <AnimationProperties
              selectedElementId={selectedElementId}
              selectedLayer={selectedLayer}
              animation={selectedAnimation}
              onUpdateAnimation={handleUpdateAnimation}
              onRemoveAnimation={handleRemoveAnimation}
              onCopyAnimation={handleCopyAnimation}
              onPasteAnimation={handlePasteAnimation}
              copiedAnimation={copiedAnimation}
              onDuplicateToAll={handleDuplicateToAll}
              onUpdateElementStyle={handleUpdateElementStyle}
            />
          </aside>
        </div>

        {/* Bottom Timeline Panel */}
        <section className="svg-creator-bottom-timeline">
          <AnimationTimeline
            layers={layers}
            animations={animations}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            isPlaying={isPlaying}
            onTogglePlay={() => {
              setIsPlaying((prev) => !prev);
              setIsScrubbing(false);
            }}
            onRestart={handleRestart}
            currentTime={currentTime}
            onScrub={handleScrub}
            onUpdateAnimation={handleUpdateAnimation}
            playbackSpeed={playbackSpeed}
            totalDuration={totalDuration}
            setTotalDuration={setTotalDuration}
          />
        </section>

        {/* Modals */}
        <SVGUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onLoadSvg={handleLoadSvg}
          onLoadProject={handleLoadProject}
        />

        <SVGCodeEditorModal
          isOpen={isCodeEditorModalOpen}
          onClose={() => setIsCodeEditorModalOpen(false)}
          svgString={svgString}
          animations={animations}
          onUpdateSvg={(newSvg) => handleLoadSvg(newSvg, projectName)}
        />

        <AnimationExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          svgString={svgString}
          animations={animations}
          layers={layers}
          canvasSettings={{ totalDuration, playbackSpeed }}
          projectName={projectName}
        />
      </div>
    </ToolLayout>
  );
}
