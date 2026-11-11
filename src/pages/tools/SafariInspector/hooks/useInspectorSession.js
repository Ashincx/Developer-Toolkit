import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getInspectorConfig,
  checkBackendHealth,
  compareBrowsers as compareApi,
  interactSession
} from '../../../../services/safariInspector';

export function useInspectorSession(initialUrl = 'https://example.com', initialWidth, initialHeight) {
  // Backend & Connection State
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking' | 'connected' | 'disconnected'
  const [backendInfo, setBackendInfo] = useState(null);
  const [backendError, setBackendError] = useState(null);

  // Inspector Session State
  const [sessionId, setSessionId] = useState(null);
  const [url, setUrl] = useState(initialUrl);
  const [title, setTitle] = useState('');
  const [engine, setEngine] = useState('webkit');
  const [deviceId, setDeviceId] = useState('iphone-14');
  const [width, setWidth] = useState(initialWidth ? parseInt(initialWidth, 10) : 390);
  const [height, setHeight] = useState(initialHeight ? parseInt(initialHeight, 10) : 844);
  const [isLandscape, setIsLandscape] = useState(false);
  const [zoom, setZoom] = useState(100);

  // Live Preview State
  const [previewFrame, setPreviewFrame] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isInspectMode, setIsInspectMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const [hoveredRect, setHoveredRect] = useState(null);
  const [inspectedPoint, setInspectedPoint] = useState(null);
  const [domTree, setDomTree] = useState(null);

  // Events & Overrides
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [networkRequests, setNetworkRequests] = useState([]);
  const [styleOverrides, setStyleOverrides] = useState([]);
  const [cssExport, setCssExport] = useState('');
  const [diagnostics, setDiagnostics] = useState([]);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  // Comparison State
  const [comparisonData, setComparisonData] = useState(null);
  const [isComparing, setIsComparing] = useState(false);

  // Active WebSocket reference
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // 1. Check backend health
  const verifyBackend = useCallback(async () => {
    setBackendStatus('checking');
    setBackendError(null);
    try {
      const res = await checkBackendHealth();
      if (res.connected) {
        setBackendStatus('connected');
        setBackendInfo(res);
        return true;
      } else {
        setBackendStatus('disconnected');
        setBackendError(res);
        return false;
      }
    } catch (e) {
      setBackendStatus('disconnected');
      setBackendError({ error: e.message });
      return false;
    }
  }, []);

  // 2. Initialize WebSocket & Session
  const initSession = useCallback(async () => {
    const isUp = await verifyBackend();
    if (!isUp) return;

    setIsLoading(true);
    setStatusMessage('Connecting to WebKit browser engine...');

    const config = getInspectorConfig();

    try {
      // Connect WebSocket
      if (wsRef.current) {
        wsRef.current.close();
      }

      const ws = new WebSocket(config.wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatusMessage('Starting browser session...');
        ws.send(JSON.stringify({
          type: 'init',
          payload: {
            url,
            engine,
            device: deviceId,
            width,
            height,
            isLandscape
          }
        }));
      };

      ws.onmessage = (event) => {
        try {
          const { type, payload } = JSON.parse(event.data);

          switch (type) {
            case 'session_info':
              setSessionId(payload.sessionId);
              if (payload.viewport) {
                setWidth(payload.viewport.width);
                setHeight(payload.viewport.height);
              }
              setIsLoading(false);
              break;

            case 'status':
              if (payload.state === 'loading') {
                setIsLoading(true);
                setStatusMessage(payload.message || 'Loading...');
              } else if (payload.state === 'ready') {
                setIsLoading(false);
                setStatusMessage('');
              }
              break;

            case 'navigated':
              setUrl(payload.url);
              if (payload.title) setTitle(payload.title);
              break;

            case 'frame':
              setPreviewFrame(payload.frame);
              if (payload.viewport) {
                setWidth(payload.viewport.width);
                setHeight(payload.viewport.height);
              }
              break;

            case 'console':
              setConsoleLogs(prev => [payload, ...prev].slice(0, 300));
              break;

            case 'console_batch':
              setConsoleLogs(payload.slice().reverse());
              break;

            case 'network':
              setNetworkRequests(prev => [payload, ...prev].slice(0, 300));
              break;

            case 'network_update':
              setNetworkRequests(prev => prev.map(req => req.id === payload.id ? { ...req, ...payload } : req));
              break;

            case 'network_batch':
              setNetworkRequests(payload.slice().reverse());
              break;

            case 'element_inspected':
              setSelectedElement(payload);
              if (payload && payload.rect) {
                setHoveredRect(payload.rect);
                if (payload.point) {
                  setInspectedPoint(payload.point);
                } else {
                  setInspectedPoint(prev => prev || {
                    x: Math.round(payload.rect.x + payload.rect.width / 2),
                    y: Math.round(payload.rect.y + payload.rect.height / 2)
                  });
                }
              }
              break;

            case 'dom_tree':
              setDomTree(payload);
              break;

            case 'styles_updated':
              setStyleOverrides(payload || []);
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'get_css_export' }));
              }
              break;

            case 'css_export':
              setCssExport(payload || '');
              break;

            case 'diagnostics_result':
              setDiagnostics(payload || []);
              setIsDiagnosing(false);
              break;

            case 'comparison_result':
              setComparisonData(payload);
              setIsComparing(false);
              break;

            case 'error':
              console.error('[SafariInspector Hook] Server error:', payload);
              setStatusMessage(payload.message || 'Inspector error');
              setIsLoading(false);
              break;

            default:
              break;
          }
        } catch (err) {
          console.error('[SafariInspector Hook] WS parse error:', err);
        }
      };

      ws.onerror = (e) => {
        console.warn('[SafariInspector Hook] WebSocket error:', e);
        setIsLoading(false);
      };

      ws.onclose = () => {
        setIsLoading(false);
      };
    } catch (err) {
      console.error('[SafariInspector Hook] Init error:', err);
      setIsLoading(false);
    }
  }, [verifyBackend, url, engine, deviceId, width, height, isLandscape]);

  // Initial check on mount
  useEffect(() => {
    initSession();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Send WS message helper
  const sendWs = useCallback((type, payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  // Actions
  const handleNavigate = useCallback((targetUrl) => {
    const formatted = targetUrl.startsWith('http://') || targetUrl.startsWith('https://')
      ? targetUrl
      : `https://${targetUrl}`;
    setUrl(formatted);
    sendWs('navigate', { url: formatted });
  }, [sendWs]);

  const handleReload = useCallback(() => {
    sendWs('reload', {});
  }, [sendWs]);

  const handleDeviceChange = useCallback((newDeviceId, presetWidth, presetHeight) => {
    setDeviceId(newDeviceId);
    if (presetWidth && presetHeight) {
      setWidth(presetWidth);
      setHeight(presetHeight);
    }
    sendWs('set_device', {
      deviceId: newDeviceId,
      width: presetWidth,
      height: presetHeight,
      isLandscape
    });
  }, [sendWs, isLandscape]);

  const handleCustomDimensions = useCallback((w, h) => {
    setDeviceId('custom');
    setWidth(w);
    setHeight(h);
    sendWs('set_device', {
      deviceId: 'custom',
      width: w,
      height: h,
      isLandscape
    });
  }, [sendWs, isLandscape]);

  const handleToggleOrientation = useCallback(() => {
    const nextLandscape = !isLandscape;
    setIsLandscape(nextLandscape);
    const newW = height;
    const newH = width;
    setWidth(newW);
    setHeight(newH);
    sendWs('set_device', {
      deviceId,
      width: newW,
      height: newH,
      isLandscape: nextLandscape
    });
  }, [sendWs, isLandscape, width, height, deviceId]);

  const handleEngineChange = useCallback((newEngine) => {
    setEngine(newEngine);
    sendWs('init', {
      url,
      engine: newEngine,
      device: deviceId,
      width,
      height,
      isLandscape
    });
  }, [sendWs, url, deviceId, width, height, isLandscape]);

  const handleClick = useCallback(async (x, y) => {
    if (isInspectMode) {
      setInspectedPoint({ x, y });
      sendWs('inspect', { x, y });
      setIsInspectMode(false); // Lock inspected element so mouse moving/leaving keeps the selection!
    } else {
      sendWs('click', { x, y });
      if (sessionId) {
        try {
          const res = await interactSession(sessionId, { action: 'click', x, y });
          if (res && res.frame) {
            setPreviewFrame(res.frame);
          }
        } catch (err) {}
      }
    }
  }, [isInspectMode, sendWs, sessionId]);

  const handleHover = useCallback((x, y) => {
    if (isInspectMode) {
      sendWs('inspect', { x, y });
    } else {
      sendWs('hover', { x, y });
    }
  }, [isInspectMode, sendWs]);

  const handleScroll = useCallback(async (deltaX, deltaY, x, y) => {
    sendWs('scroll', { deltaX, deltaY, x, y });

    if (sessionId) {
      try {
        const res = await interactSession(sessionId, { action: 'scroll', deltaX, deltaY, x, y });
        if (res && res.frame) {
          setPreviewFrame(res.frame);
        }
      } catch (err) {}
    }
  }, [sendWs, sessionId]);

  const handleType = useCallback((text) => {
    sendWs('type', { text });
  }, [sendWs]);

  const handleKey = useCallback((key) => {
    sendWs('key', { key });
  }, [sendWs]);

  const handleInspectSelector = useCallback((selector) => {
    sendWs('inspect_selector', { selector });
  }, [sendWs]);

  const handleRequestDomTree = useCallback((depth = 10, selector = null) => {
    sendWs('get_dom_tree', { depth, selector });
  }, [sendWs]);

  const handleApplyStyle = useCallback((selector, property, value) => {
    sendWs('apply_style', { selector, property, value });
  }, [sendWs]);

  const handleResetStyles = useCallback(() => {
    sendWs('reset_styles', {});
  }, [sendWs]);

  const handleRunDiagnostics = useCallback(() => {
    setIsDiagnosing(true);
    sendWs('run_diagnostics', {});
  }, [sendWs]);

  const handleCompare = useCallback(async (targetUrl = url, threshold = 0.1) => {
    setIsComparing(true);
    try {
      const result = await compareApi({
        url: targetUrl,
        threshold,
        viewport: { width, height }
      });
      setComparisonData(result);
    } catch (err) {
      setComparisonData({ success: false, error: err.message });
    } finally {
      setIsComparing(false);
    }
  }, [url, width, height]);

  const clearConsole = useCallback(() => {
    setConsoleLogs([]);
  }, []);

  const clearNetwork = useCallback(() => {
    setNetworkRequests([]);
  }, []);

  return {
    // Backend Status
    backendStatus,
    backendInfo,
    backendError,
    retryBackend: initSession,

    // Session State
    sessionId,
    url,
    title,
    engine,
    deviceId,
    width,
    height,
    isLandscape,
    zoom,
    setZoom,
    isLoading,
    statusMessage,

    // Live Preview
    previewFrame,
    isInspectMode,
    setIsInspectMode,
    selectedElement,
    setSelectedElement,
    hoveredRect,
    inspectedPoint,
    setInspectedPoint,
    domTree,

    // Events & Overrides
    consoleLogs,
    clearConsole,
    networkRequests,
    clearNetwork,
    styleOverrides,
    cssExport,
    diagnostics,
    isDiagnosing,

    // Browser Comparison
    comparisonData,
    isComparing,

    // Handlers
    handleNavigate,
    handleReload,
    handleDeviceChange,
    handleCustomDimensions,
    handleToggleOrientation,
    handleEngineChange,
    handleClick,
    handleHover,
    handleScroll,
    handleType,
    handleKey,
    handleInspectSelector,
    handleRequestDomTree,
    handleApplyStyle,
    handleResetStyles,
    handleRunDiagnostics,
    handleCompare
  };
}
