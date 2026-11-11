const { WebSocketServer } = require('ws');
const url = require('url');
const sessionManager = require('./sessionManager');
const { compareBrowsers } = require('./comparisonEngine');

function setupWebSocketServer(httpServer) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    const { pathname } = url.parse(request.url);

    if (pathname === '/ws/inspector') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws, request) => {
    let currentSession = null;
    const { query } = url.parse(request.url, true);
    
    // Heartbeat setup
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    if (query && query.sessionId) {
      const session = sessionManager.getSession(query.sessionId);
      if (session) {
        currentSession = session;
        session.registerWsClient(ws);
      }
    }

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const { type, payload } = message;

        // 1. Session initialization / creation
        if (type === 'init') {
          if (payload && payload.sessionId) {
            const existing = sessionManager.getSession(payload.sessionId);
            if (existing) {
              if (currentSession && currentSession !== existing) {
                currentSession.unregisterWsClient(ws);
              }
              currentSession = existing;
              currentSession.registerWsClient(ws);
              return;
            }
          }

          // Create new session
          const session = await sessionManager.createSession({
            url: payload ? payload.url : 'https://example.com',
            engine: payload ? payload.engine : 'webkit',
            device: payload ? payload.device : 'iphone-14',
            width: payload ? payload.width : undefined,
            height: payload ? payload.height : undefined,
            isLandscape: payload ? payload.isLandscape : false
          });

          if (currentSession) {
            currentSession.unregisterWsClient(ws);
          }
          currentSession = session;
          session.registerWsClient(ws);
          return;
        }

        // 2. Browser Comparison (can run independently of a single session)
        if (type === 'compare') {
          const compResult = await compareBrowsers(payload.url, {
            viewport: payload.viewport,
            threshold: payload.threshold
          });
          ws.send(JSON.stringify({
            type: 'comparison_result',
            payload: compResult
          }));
          return;
        }

        // The following require an active session
        if (!currentSession) {
          ws.send(JSON.stringify({
            type: 'error',
            payload: { message: 'No active session. Please initialize first.' }
          }));
          return;
        }

        switch (type) {
          case 'navigate':
            await currentSession.navigate(payload.url);
            break;

          case 'reload':
            await currentSession.reload();
            break;

          case 'set_device':
            await currentSession.setDevice(payload.deviceId, payload.width, payload.height, payload.isLandscape);
            break;

          case 'click':
            await currentSession.click(payload.x, payload.y);
            break;

          case 'hover':
            await currentSession.hover(payload.x, payload.y);
            break;

          case 'scroll':
            await currentSession.scroll(payload.deltaX, payload.deltaY, payload.x, payload.y);
            break;

          case 'type':
            await currentSession.type(payload.text);
            break;

          case 'key':
            await currentSession.pressKey(payload.key);
            break;

          case 'inspect':
            await currentSession.inspectPoint(payload.x, payload.y);
            break;

          case 'inspect_selector':
            await currentSession.inspectSelector(payload.selector);
            break;

          case 'get_dom_tree': {
            const tree = await currentSession.getDomTree(payload?.depth || 10, payload?.selector || null);
            ws.send(JSON.stringify({ type: 'dom_tree', payload: tree }));
            break;
          }

          case 'apply_style': {
            const overrides = await currentSession.applyStyleOverride(payload.selector, payload.property, payload.value);
            ws.send(JSON.stringify({ type: 'styles_updated', payload: overrides }));
            break;
          }

          case 'reset_styles': {
            const overrides = await currentSession.resetStyleOverrides();
            ws.send(JSON.stringify({ type: 'styles_updated', payload: overrides }));
            break;
          }

          case 'get_css_export': {
            const css = currentSession.getCssExport();
            ws.send(JSON.stringify({ type: 'css_export', payload: css }));
            break;
          }

          case 'run_diagnostics': {
            const issues = await currentSession.runDiagnostics();
            ws.send(JSON.stringify({ type: 'diagnostics_result', payload: issues }));
            break;
          }

          case 'request_frame':
            await currentSession.sendFreshFrame();
            break;

          case 'capture_screenshot': {
            const screenshot = await currentSession.getScreenshot({ format: 'png' });
            ws.send(JSON.stringify({ type: 'screenshot_ready', payload: screenshot }));
            break;
          }

          default:
            console.warn(`[SafariInspector] Unknown WS message type: ${type}`);
        }
      } catch (err) {
        console.error('[SafariInspector] WS message handler error:', err);
        ws.send(JSON.stringify({
          type: 'error',
          payload: { message: err.message }
        }));
      }
    });

    ws.on('close', () => {
      if (currentSession) {
        currentSession.unregisterWsClient(ws);
      }
    });
  });

  // Keep-alive heartbeat interval every 30 seconds
  const pingInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  return wss;
}

module.exports = {
  setupWebSocketServer
};
