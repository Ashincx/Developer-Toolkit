const crypto = require('crypto');
const browserManager = require('./browserManager');
const { getDeviceProfile } = require('./deviceProfiles');
const EventCollector = require('./eventCollector');
const StyleEditor = require('./styleEditor');
const elementInspector = require('./elementInspector');
const screenshotManager = require('./screenshotManager');
const { runSafariDiagnostics } = require('./safariDiagnostics');

class SessionInstance {
  constructor(id, options = {}) {
    this.id = id;
    this.engine = options.engine || 'webkit';
    this.deviceId = options.device || 'iphone-14';
    this.customWidth = options.width;
    this.customHeight = options.height;
    this.isLandscape = Boolean(options.isLandscape);
    this.url = options.url || 'https://example.com';
    
    this.context = null;
    this.page = null;
    this.eventCollector = null;
    this.styleEditor = null;
    this.wsClients = new Set();
    this.lastActivity = Date.now();
    this.isDestroyed = false;
    this.deviceConfig = null;
    this.isCapturingFrame = false;
    this.queuedFrameRequest = false;
  }

  touch() {
    this.lastActivity = Date.now();
  }

  formatUrl(input) {
    if (!input) return 'https://example.com';
    let trimmed = input.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = 'https://' + trimmed;
    }
    return trimmed;
  }

  async initialize() {
    this.deviceConfig = getDeviceProfile(this.deviceId, this.customWidth, this.customHeight, this.isLandscape);

    this.context = await browserManager.createContext(this.engine, {
      viewport: this.deviceConfig.viewport,
      deviceScaleFactor: this.deviceConfig.deviceScaleFactor,
      isMobile: this.deviceConfig.isMobile,
      hasTouch: this.deviceConfig.hasTouch,
      userAgent: this.deviceConfig.userAgent
    });

    this.page = await this.context.newPage();
    this.styleEditor = new StyleEditor(this.page);

    this.eventCollector = new EventCollector(this.page, (type, payload) => {
      this.broadcast(type, payload);
    });

    // Listen for automatic page navigations (e.g. clicking a link)
    this.page.on('load', async () => {
      this.url = this.page.url();
      this.broadcast('navigated', {
        url: this.url,
        title: await this.page.title().catch(() => '')
      });
      // Stream new frame on load
      this.sendFreshFrame();
    });

    // Navigate to initial URL
    await this.navigate(this.url);
  }

  async navigate(targetUrl) {
    this.touch();
    if (!this.page || this.isDestroyed) return;

    this.url = this.formatUrl(targetUrl);
    this.broadcast('status', { state: 'loading', message: `Navigating to ${this.url}...` });

    try {
      await this.page.goto(this.url, {
        waitUntil: 'domcontentloaded',
        timeout: 25000
      });
    } catch (err) {
      console.warn(`[SafariInspector] Navigation warning for ${this.url}:`, err.message);
    } finally {
      // Re-apply style overrides if any
      await this.styleEditor.syncToPage();

      this.broadcast('status', { state: 'ready' });
      this.broadcast('navigated', {
        url: this.page.url(),
        title: await this.page.title().catch(() => '')
      });

      await this.sendFreshFrame();

      try {
        const tree = await this.getDomTree(5);
        if (tree) this.broadcast('dom_tree', tree);
      } catch (e) {}
    }
  }

  async reload() {
    this.touch();
    if (!this.page || this.isDestroyed) return;

    this.broadcast('status', { state: 'loading', message: 'Reloading page...' });
    try {
      await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 20000 });
      await this.styleEditor.syncToPage();
    } catch (err) {
      console.warn('[SafariInspector] Reload warning:', err.message);
    } finally {
      this.broadcast('status', { state: 'ready' });
      await this.sendFreshFrame();

      try {
        const tree = await this.getDomTree(5);
        if (tree) this.broadcast('dom_tree', tree);
      } catch (e) {}
    }
  }

  async setDevice(deviceId, width, height, isLandscape) {
    this.touch();
    this.deviceId = deviceId;
    this.customWidth = width;
    this.customHeight = height;
    this.isLandscape = Boolean(isLandscape);
    this.deviceConfig = getDeviceProfile(this.deviceId, this.customWidth, this.customHeight, this.isLandscape);

    if (this.page && !this.isDestroyed) {
      await this.page.setViewportSize(this.deviceConfig.viewport);
      await this.sendFreshFrame();
    }
    return this.deviceConfig;
  }

  async click(x, y) {
    this.touch();
    if (!this.page || this.isDestroyed) return;

    try {
      await this.page.mouse.click(x, y);
      // Small wait to capture any visual update
      setTimeout(() => this.sendFreshFrame(), 80);
    } catch (e) {
      console.error('[SafariInspector] Click error:', e.message);
    }
  }

  async hover(x, y) {
    this.touch();
    if (!this.page || this.isDestroyed) return;

    try {
      await this.page.mouse.move(x, y);
    } catch (e) {
      // ignore mouse move errors
    }
  }

  async scroll(deltaX, deltaY, x, y) {
    this.touch();
    if (!this.page || this.isDestroyed) return;

    try {
      const scrollX = typeof x === 'number' ? Math.round(x) : 100;
      const scrollY = typeof y === 'number' ? Math.round(y) : 100;

      // 1. Dispatch native mouse wheel event in Playwright for authentic engine response
      if (Math.abs(deltaY) < 900000 && Math.abs(deltaX) < 900000) {
        try {
          await this.page.mouse.move(scrollX, scrollY);
          await this.page.mouse.wheel(deltaX, deltaY);
        } catch (err) {}
      }

      // 2. Comprehensive DOM scrolling for mobile wrappers & containers
      await this.page.evaluate(({ dx, dy, px, py }) => {
        // Jump to bottom
        if (dy >= 900000) {
          const maxY = Math.max(
            document.body ? document.body.scrollHeight : 0,
            document.documentElement ? document.documentElement.scrollHeight : 0,
            document.scrollingElement ? document.scrollingElement.scrollHeight : 0,
            50000
          );
          window.scrollTo({ left: 0, top: maxY, behavior: 'instant' });
          if (document.scrollingElement) document.scrollingElement.scrollTop = maxY;
          if (document.documentElement) document.documentElement.scrollTop = maxY;
          if (document.body) document.body.scrollTop = maxY;

          const wrappers = document.querySelectorAll('#wrapper, #container, #page, main, #content, .content, .main, [class*="wrapper"]');
          for (const w of wrappers) {
            if (w.scrollHeight > w.clientHeight) {
              w.scrollTop = w.scrollHeight;
            }
          }
          return;
        }

        // Jump to top
        if (dy <= -900000) {
          window.scrollTo({ left: 0, top: 0, behavior: 'instant' });
          if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
          if (document.documentElement) document.documentElement.scrollTop = 0;
          if (document.body) document.body.scrollTop = 0;

          const wrappers = document.querySelectorAll('#wrapper, #container, #page, main, #content, .content, .main, [class*="wrapper"]');
          for (const w of wrappers) {
            w.scrollTop = 0;
          }
          return;
        }

        // Helper: check if element can scroll in the requested direction
        function canScroll(el, delta) {
          if (!el || el === document || el === window) return false;
          const cs = window.getComputedStyle(el);
          const hasOverflow = ['auto', 'scroll'].includes(cs.overflowY) || ['auto', 'scroll'].includes(cs.overflow);
          if (!hasOverflow || el.scrollHeight <= el.clientHeight) return false;

          if (delta > 0) {
            // scrolling down: can scroll if not at bottom
            return el.scrollTop + el.clientHeight < el.scrollHeight - 1;
          } else if (delta < 0) {
            // scrolling up: can scroll if not at top
            return el.scrollTop > 1;
          }
          return true;
        }

        // 1. Check under pointer
        let scrolledTarget = false;
        if (typeof px === 'number' && typeof py === 'number') {
          let el = document.elementFromPoint(px, py);
          while (el && el !== document.documentElement && el !== document.body) {
            if (canScroll(el, dy)) {
              const prev = el.scrollTop;
              el.scrollBy({ left: dx, top: dy, behavior: 'instant' });
              if (Math.abs(el.scrollTop - prev) > 0.5) {
                scrolledTarget = true;
                break;
              }
            }
            el = el.parentElement;
          }
        }

        if (scrolledTarget) return;

        // 2. Standard document scroll
        const prevDocY = window.scrollY || (document.scrollingElement ? document.scrollingElement.scrollTop : 0);
        window.scrollBy({ left: dx, top: dy, behavior: 'instant' });

        if (document.scrollingElement) {
          document.scrollingElement.scrollBy({ left: dx, top: dy, behavior: 'instant' });
        }

        const newDocY = window.scrollY || (document.scrollingElement ? document.scrollingElement.scrollTop : 0);

        // 3. Fallback: If document didn't scroll (e.g. mobile fixed wrapper with 100vh), find and scroll container
        if (Math.abs(newDocY - prevDocY) < 0.5) {
          const wrappers = document.querySelectorAll('#wrapper, #container, #page, main, #content, .content, .main, [class*="wrapper"], [id*="wrapper"]');
          for (const w of wrappers) {
            if (canScroll(w, dy)) {
              w.scrollBy({ left: dx, top: dy, behavior: 'instant' });
              break;
            }
          }
        }
      }, { dx: deltaX, dy: deltaY, px: scrollX, py: scrollY });

      // Directly capture & broadcast fresh frame
      await this.sendFreshFrame();
    } catch (e) {
      console.error('[SafariInspector] Scroll error:', e.message);
    }
  }

  async type(text) {
    this.touch();
    if (!this.page || this.isDestroyed) return;

    try {
      await this.page.keyboard.type(text);
      setTimeout(() => this.sendFreshFrame(), 50);
    } catch (e) {
      console.error('[SafariInspector] Keyboard type error:', e.message);
    }
  }

  async pressKey(key) {
    this.touch();
    if (!this.page || this.isDestroyed) return;

    try {
      await this.page.keyboard.press(key);
      setTimeout(() => this.sendFreshFrame(), 50);
    } catch (e) {
      console.error('[SafariInspector] Key press error:', e.message);
    }
  }

  async inspectPoint(x, y) {
    this.touch();
    if (!this.page || this.isDestroyed) return null;

    const data = await elementInspector.inspectPoint(this.page, x, y);
    if (data) {
      data.point = { x, y };
      this.broadcast('element_inspected', data);

      // Auto-broadcast updated DOM tree containing the inspected element branch
      try {
        const tree = await elementInspector.getDomTree(this.page, 10, data.selector);
        if (tree) {
          this.broadcast('dom_tree', tree);
        }
      } catch (e) {}
    }
    return data;
  }

  async inspectSelector(selector) {
    this.touch();
    if (!this.page || this.isDestroyed) return null;

    const data = await elementInspector.inspectSelector(this.page, selector);
    if (data) {
      this.broadcast('element_inspected', data);
    }
    return data;
  }

  async getDomTree(maxDepth = 10, targetSelector = null) {
    this.touch();
    if (!this.page || this.isDestroyed) return null;
    return await elementInspector.getDomTree(this.page, maxDepth, targetSelector);
  }

  async applyStyleOverride(selector, property, value) {
    this.touch();
    if (!this.styleEditor) return [];
    const list = await this.styleEditor.applyOverride(selector, property, value);
    await this.sendFreshFrame();
    return list;
  }

  async resetStyleOverrides() {
    this.touch();
    if (!this.styleEditor) return [];
    const list = await this.styleEditor.resetOverrides();
    await this.sendFreshFrame();
    return list;
  }

  getCssExport() {
    return this.styleEditor ? this.styleEditor.generateCssSnippet() : '';
  }

  async runDiagnostics() {
    this.touch();
    if (!this.page || this.isDestroyed) return [];
    return await runSafariDiagnostics(this.page);
  }

  async getScreenshot(options = {}) {
    this.touch();
    if (!this.page || this.isDestroyed) return null;
    return await screenshotManager.captureViewport(this.page, options);
  }

  async sendFreshFrame() {
    if (!this.page || this.isDestroyed || this.wsClients.size === 0) return;
    if (this.isCapturingFrame) {
      this.queuedFrameRequest = true;
      return;
    }

    this.isCapturingFrame = true;
    try {
      const frame = await screenshotManager.captureViewport(this.page, { format: 'jpeg', quality: 75 });
      if (frame) {
        this.broadcast('frame', {
          frame,
          viewport: this.deviceConfig ? this.deviceConfig.viewport : { width: 390, height: 844 },
          timestamp: Date.now()
        });
      }
    } finally {
      this.isCapturingFrame = false;
      if (this.queuedFrameRequest) {
        this.queuedFrameRequest = false;
        setTimeout(() => this.sendFreshFrame(), 16);
      }
    }
  }

  registerWsClient(ws) {
    this.wsClients.add(ws);
    // Send immediate state
    ws.send(JSON.stringify({
      type: 'session_info',
      payload: {
        sessionId: this.id,
        engine: this.engine,
        deviceId: this.deviceId,
        viewport: this.deviceConfig ? this.deviceConfig.viewport : { width: 390, height: 844 },
        url: this.url
      }
    }));

    // Send latest frame
    this.sendFreshFrame();

    // Send existing logs & network entries
    if (this.eventCollector) {
      const logs = this.eventCollector.getLogs();
      if (logs.length > 0) {
        ws.send(JSON.stringify({ type: 'console_batch', payload: logs }));
      }
      const requests = this.eventCollector.getRequests();
      if (requests.length > 0) {
        ws.send(JSON.stringify({ type: 'network_batch', payload: requests }));
      }
    }
  }

  unregisterWsClient(ws) {
    this.wsClients.delete(ws);
  }

  broadcast(type, payload) {
    const msg = JSON.stringify({ type, payload });
    for (const client of this.wsClients) {
      if (client.readyState === 1) { // WebSocket.OPEN
        try {
          client.send(msg);
        } catch (e) {
          // ignore error sending to dead client
        }
      }
    }
  }

  async destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    for (const ws of this.wsClients) {
      try {
        ws.close(1000, 'Session ended');
      } catch (e) {}
    }
    this.wsClients.clear();

    if (this.context) {
      try {
        await this.context.close();
      } catch (e) {}
      this.context = null;
      this.page = null;
    }
  }
}

class SessionManager {
  constructor() {
    this.sessions = new Map();

    // Cleanup idle sessions every 2 minutes (idle threshold: 15 mins)
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const idleTimeout = 15 * 60 * 1000;
      for (const [id, session] of this.sessions.entries()) {
        if (now - session.lastActivity > idleTimeout) {
          console.log(`[SafariInspector] Reaping idle session ${id}`);
          session.destroy();
          this.sessions.delete(id);
        }
      }
    }, 2 * 60 * 1000);
  }

  async createSession(options = {}) {
    const id = crypto.randomUUID();
    const session = new SessionInstance(id, options);
    await session.initialize();
    this.sessions.set(id, session);
    return session;
  }

  getSession(id) {
    return this.sessions.get(id) || null;
  }

  async closeSession(id) {
    const session = this.sessions.get(id);
    if (session) {
      await session.destroy();
      this.sessions.delete(id);
      return true;
    }
    return false;
  }

  async closeAllSessions() {
    for (const [id, session] of this.sessions.entries()) {
      await session.destroy();
    }
    this.sessions.clear();
  }
}

const sessionManager = new SessionManager();

process.on('exit', () => {
  sessionManager.closeAllSessions();
});

module.exports = sessionManager;
