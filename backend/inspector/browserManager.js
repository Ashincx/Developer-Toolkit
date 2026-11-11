const { webkit, chromium } = require('playwright');

class BrowserManager {
  constructor() {
    this.browsers = {
      webkit: null,
      chromium: null
    };
    this.launching = {
      webkit: null,
      chromium: null
    };
  }

  async getBrowser(engine = 'webkit') {
    const key = engine.toLowerCase() === 'chromium' ? 'chromium' : 'webkit';

    if (this.browsers[key] && this.browsers[key].isConnected()) {
      return this.browsers[key];
    }

    if (this.launching[key]) {
      return this.launching[key];
    }

    this.launching[key] = (async () => {
      try {
        const engineLauncher = key === 'chromium' ? chromium : webkit;
        console.log(`[SafariInspector] Launching ${key} browser engine...`);
        const browser = await engineLauncher.launch({
          headless: true,
          args: key === 'chromium' ? ['--no-sandbox', '--disable-setuid-sandbox'] : []
        });

        browser.on('disconnected', () => {
          console.warn(`[SafariInspector] ${key} browser disconnected`);
          this.browsers[key] = null;
        });

        this.browsers[key] = browser;
        return browser;
      } catch (err) {
        console.error(`[SafariInspector] Failed to launch ${key}:`, err);
        throw err;
      } finally {
        this.launching[key] = null;
      }
    })();

    return this.launching[key];
  }

  async createContext(engine = 'webkit', options = {}) {
    const browser = await this.getBrowser(engine);
    const context = await browser.newContext({
      viewport: options.viewport || { width: 390, height: 844 },
      deviceScaleFactor: options.deviceScaleFactor || 2,
      isMobile: options.isMobile ?? true,
      hasTouch: options.hasTouch ?? true,
      userAgent: options.userAgent,
      bypassCSP: true, // Allow inspection scripts and style overrides
      ignoreHTTPSErrors: true // Support local development HTTPS certs
    });

    return context;
  }

  async checkAvailability() {
    const status = {
      webkit: false,
      chromium: false,
      details: {}
    };

    try {
      const wk = await this.getBrowser('webkit');
      status.webkit = wk.isConnected();
    } catch (e) {
      status.details.webkitError = e.message;
    }

    try {
      const cr = await this.getBrowser('chromium');
      status.chromium = cr.isConnected();
    } catch (e) {
      status.details.chromiumError = e.message;
    }

    return status;
  }

  async closeAll() {
    for (const key of ['webkit', 'chromium']) {
      if (this.browsers[key]) {
        try {
          await this.browsers[key].close();
        } catch (e) {
          // ignore error on close
        }
        this.browsers[key] = null;
      }
    }
  }
}

const browserManager = new BrowserManager();

process.on('exit', () => {
  browserManager.closeAll();
});

module.exports = browserManager;
