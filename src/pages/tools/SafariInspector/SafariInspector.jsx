import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ToolLayout from '../../../components/ToolLayout';
import { useInspectorSession } from './hooks/useInspectorSession';
import InspectorToolbar from './components/InspectorToolbar';
import BrowserPreview from './components/BrowserPreview';
import ElementsPanel from './components/ElementsPanel';
import StylesPanel from './components/StylesPanel';
import SafariIssuesPanel from './components/SafariIssuesPanel';
import ConsolePanel from './components/ConsolePanel';
import NetworkPanel from './components/NetworkPanel';
import ComparisonPanel from './components/ComparisonPanel';
import CloudTestingPanel from './components/CloudTestingPanel';
import DisconnectedState from './components/DisconnectedState';
import { captureScreenshot } from '../../../services/safariInspector';

import {
  Code2,
  AlertTriangle,
  Terminal,
  Activity,
  GitCompare,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Layers
} from 'lucide-react';
import './SafariInspector.css';

export default function SafariInspector() {
  const [searchParams] = useSearchParams();
  const queryUrl = searchParams.get('url') || 'https://example.com';
  const queryWidth = searchParams.get('width');
  const queryHeight = searchParams.get('height');

  // Main navigation view: 'inspector' | 'compare' | 'cloud'
  const [activeMainView, setActiveMainView] = useState('inspector');

  // Inspector panel tabs: 'elements' | 'issues'
  const [activeSideTab, setActiveSideTab] = useState('elements');
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);

  // Bottom drawer tabs: 'console' | 'network' | null (collapsed)
  const [activeBottomTab, setActiveBottomTab] = useState('console');
  const [isBottomOpen, setIsBottomOpen] = useState(false);

  const session = useInspectorSession(queryUrl, queryWidth, queryHeight);

  // Auto-switch to elements view when an element is inspected
  useEffect(() => {
    if (session.selectedElement) {
      setIsSidePanelOpen(true);
      setActiveSideTab('elements');
    }
  }, [session.selectedElement]);

  const handleCaptureScreenshot = async () => {
    if (!session.sessionId) return;
    try {
      const data = await captureScreenshot(session.sessionId);
      if (data && data.screenshot) {
        const a = document.createElement('a');
        a.href = data.screenshot;
        a.download = `safari-inspector-${Date.now()}.png`;
        a.click();
      }
    } catch (e) {
      console.error('Screenshot download failed:', e);
    }
  };

  const errorCount = session.consoleLogs.filter(l => l.type === 'error').length;
  const issuesCount = session.diagnostics.length;

  return (
    <ToolLayout
      id="safari-inspector"
      title="Safari Inspector Studio"
      description="Inspect WebKit rendering, debug mobile layouts and compare Safari-like behavior with Chrome."
      onReset={session.handleReload}
    >
      <div className="safari-inspector-tool-container">
        {/* Top Main View Switcher Tabs */}
        <div className="main-view-switcher">
          <button
            type="button"
            className={`main-tab-btn ${activeMainView === 'inspector' ? 'active' : ''}`}
            onClick={() => setActiveMainView('inspector')}
          >
            <Layers size={15} />
            <span>WebKit Inspector</span>
          </button>

          <button
            type="button"
            className={`main-tab-btn ${activeMainView === 'compare' ? 'active' : ''}`}
            onClick={() => setActiveMainView('compare')}
          >
            <GitCompare size={15} />
            <span>Chrome vs WebKit Comparison</span>
          </button>

          <button
            type="button"
            className={`main-tab-btn ${activeMainView === 'cloud' ? 'active' : ''}`}
            onClick={() => setActiveMainView('cloud')}
          >
            <Smartphone size={15} />
            <span>Real iPhone Testing</span>
          </button>
        </div>

        {/* View 1: WebKit Inspector Workspace */}
        {activeMainView === 'inspector' && (
          <>
            <InspectorToolbar
              url={session.url}
              onNavigate={session.handleNavigate}
              onReload={session.handleReload}
              engine={session.engine}
              onEngineChange={session.handleEngineChange}
              deviceId={session.deviceId}
              onDeviceChange={session.handleDeviceChange}
              width={session.width}
              height={session.height}
              onCustomDimensions={session.handleCustomDimensions}
              isLandscape={session.isLandscape}
              onToggleOrientation={session.handleToggleOrientation}
              zoom={session.zoom}
              onZoomChange={session.setZoom}
              isInspectMode={session.isInspectMode}
              onToggleInspect={() => session.setIsInspectMode(!session.isInspectMode)}
              onCaptureScreenshot={handleCaptureScreenshot}
              showComparison={false}
              onToggleComparison={() => setActiveMainView('compare')}
              backendStatus={session.backendStatus}
              isLoading={session.isLoading}
            />

            {session.backendStatus === 'disconnected' ? (
              <DisconnectedState
                onRetry={session.retryBackend}
                backendError={session.backendError}
                onOpenCloudTab={() => setActiveMainView('cloud')}
              />
            ) : (
              <div className="inspector-three-pane-layout">
                {/* Center Workspace: Browser Preview */}
                <div className="workspace-center">
                  <BrowserPreview
                    previewFrame={session.previewFrame}
                    width={session.width}
                    height={session.height}
                    zoom={session.zoom}
                    isLoading={session.isLoading}
                    statusMessage={session.statusMessage}
                    isInspectMode={session.isInspectMode}
                    selectedElement={session.selectedElement}
                    hoveredRect={session.hoveredRect}
                    inspectedPoint={session.inspectedPoint}
                    onClick={session.handleClick}
                    onHover={session.handleHover}
                    onScroll={session.handleScroll}
                    onType={session.handleType}
                    onKey={session.handleKey}
                    deviceId={session.deviceId}
                    isLandscape={session.isLandscape}
                  />

                  {/* Bottom Workspace: Console & Network Bar */}
                  <div className={`workspace-bottom ${isBottomOpen ? 'open' : 'collapsed'}`}>
                    <div className="bottom-bar-header">
                      <div className="bottom-tabs">
                        <button
                          type="button"
                          className={`bottom-tab-btn ${activeBottomTab === 'console' && isBottomOpen ? 'active' : ''}`}
                          onClick={() => {
                            if (activeBottomTab === 'console' && isBottomOpen) {
                              setIsBottomOpen(false);
                            } else {
                              setActiveBottomTab('console');
                              setIsBottomOpen(true);
                            }
                          }}
                        >
                          <Terminal size={13} />
                          <span>Console</span>
                          {errorCount > 0 && <span className="tab-badge error-badge">{errorCount}</span>}
                        </button>

                        <button
                          type="button"
                          className={`bottom-tab-btn ${activeBottomTab === 'network' && isBottomOpen ? 'active' : ''}`}
                          onClick={() => {
                            if (activeBottomTab === 'network' && isBottomOpen) {
                              setIsBottomOpen(false);
                            } else {
                              setActiveBottomTab('network');
                              setIsBottomOpen(true);
                            }
                          }}
                        >
                          <Activity size={13} />
                          <span>Network</span>
                          <span className="tab-badge">{session.networkRequests.length}</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        className="btn-toggle-drawer"
                        onClick={() => setIsBottomOpen(!isBottomOpen)}
                        title={isBottomOpen ? 'Collapse drawer' : 'Expand drawer'}
                      >
                        {isBottomOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                      </button>
                    </div>

                    {isBottomOpen && (
                      <div className="bottom-drawer-content">
                        {activeBottomTab === 'console' && (
                          <ConsolePanel
                            logs={session.consoleLogs}
                            onClear={session.clearConsole}
                          />
                        )}
                        {activeBottomTab === 'network' && (
                          <NetworkPanel
                            requests={session.networkRequests}
                            onClear={session.clearNetwork}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Sidebar: DevTools Inspector (HTML & CSS Split) */}
                <div className={`workspace-sidebar ${isSidePanelOpen ? 'open' : 'collapsed'}`}>
                  <div className="sidebar-tab-strip">
                    <button
                      type="button"
                      className={`side-tab-btn ${activeSideTab === 'elements' ? 'active' : ''}`}
                      onClick={() => {
                        setActiveSideTab('elements');
                        setIsSidePanelOpen(true);
                        if (!session.domTree) {
                          session.handleRequestDomTree(5);
                        }
                      }}
                      title="Elements: Live HTML Structure & Matched CSS Rules"
                    >
                      <Code2 size={14} />
                      <span>Elements</span>
                    </button>

                    <button
                      type="button"
                      className={`side-tab-btn ${activeSideTab === 'issues' ? 'active' : ''}`}
                      onClick={() => {
                        setActiveSideTab('issues');
                        setIsSidePanelOpen(true);
                        if (session.diagnostics.length === 0) {
                          session.handleRunDiagnostics();
                        }
                      }}
                      title="Safari & WebKit Compatibility Issues"
                    >
                      <AlertTriangle size={14} />
                      <span>Safari Issues</span>
                      {issuesCount > 0 && <span className="tab-badge warning-badge">{issuesCount}</span>}
                    </button>
                  </div>

                  <div className="sidebar-tab-content devtools-sidebar-content">
                    {activeSideTab === 'elements' && (
                      <div className="devtools-split-container">
                        {/* Upper Half: HTML DOM Structure */}
                        <div className="devtools-tree-pane">
                          <ElementsPanel
                            selectedElement={session.selectedElement}
                            domTree={session.domTree}
                            onSelectSelector={session.handleInspectSelector}
                            onRequestDomTree={session.handleRequestDomTree}
                            isInspectMode={session.isInspectMode}
                            onToggleInspect={() => session.setIsInspectMode(!session.isInspectMode)}
                          />
                        </div>

                        {/* Splitter Divider */}
                        <div className="devtools-split-divider">
                          <span className="split-handle" />
                        </div>

                        {/* Lower Half: CSS Styles, Overrides & Box Model */}
                        <div className="devtools-styles-pane">
                          <StylesPanel
                            selectedElement={session.selectedElement}
                            styleOverrides={session.styleOverrides}
                            onApplyStyle={session.handleApplyStyle}
                            onResetStyles={session.handleResetStyles}
                            cssExport={session.cssExport}
                          />
                        </div>
                      </div>
                    )}

                    {activeSideTab === 'issues' && (
                      <SafariIssuesPanel
                        diagnostics={session.diagnostics}
                        isDiagnosing={session.isDiagnosing}
                        onRunDiagnostics={session.handleRunDiagnostics}
                        onApplyFix={session.handleApplyStyle}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* View 2: Chrome vs WebKit Comparison */}
        {activeMainView === 'compare' && (
          <ComparisonPanel
            comparisonData={session.comparisonData}
            isComparing={session.isComparing}
            onRunComparison={session.handleCompare}
            currentUrl={session.url}
          />
        )}

        {/* View 3: Real iPhone Testing */}
        {activeMainView === 'cloud' && (
          <CloudTestingPanel currentUrl={session.url} />
        )}
      </div>
    </ToolLayout>
  );
}
