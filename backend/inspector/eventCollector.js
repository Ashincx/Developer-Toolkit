const crypto = require('crypto');

class EventCollector {
  constructor(page, onEventCallback) {
    this.page = page;
    this.onEventCallback = onEventCallback || (() => {});
    this.consoleLogs = [];
    this.networkRequests = new Map();
    this.requestList = [];
    this.maxLogs = 300;
    this.maxRequests = 300;

    this.attach();
  }

  redactHeaders(headers = {}) {
    const redacted = {};
    const sensitiveKeys = ['authorization', 'cookie', 'set-cookie', 'x-api-key', 'proxy-authorization'];
    
    for (const [key, value] of Object.entries(headers)) {
      if (sensitiveKeys.includes(key.toLowerCase())) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = value;
      }
    }
    return redacted;
  }

  redactUrl(rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      const sensitiveParams = ['token', 'auth', 'key', 'secret', 'password', 'access_token', 'api_key'];
      for (const p of sensitiveParams) {
        if (parsed.searchParams.has(p)) {
          parsed.searchParams.set(p, '[REDACTED]');
        }
      }
      return parsed.toString();
    } catch (e) {
      return rawUrl;
    }
  }

  attach() {
    if (!this.page) return;

    // 1. Console listener
    this.page.on('console', msg => {
      try {
        const item = {
          id: crypto.randomUUID(),
          type: msg.type(), // 'log', 'warn', 'error', 'info', 'debug'
          text: msg.text(),
          location: msg.location(),
          timestamp: new Date().toISOString()
        };

        this.consoleLogs.push(item);
        if (this.consoleLogs.length > this.maxLogs) {
          this.consoleLogs.shift();
        }

        this.onEventCallback('console', item);
      } catch (err) {
        // Safe handling
      }
    });

    // 2. Page error listener (uncaught JS exceptions)
    this.page.on('pageerror', error => {
      try {
        const item = {
          id: crypto.randomUUID(),
          type: 'error',
          text: error.message || String(error),
          stack: error.stack,
          timestamp: new Date().toISOString()
        };

        this.consoleLogs.push(item);
        if (this.consoleLogs.length > this.maxLogs) {
          this.consoleLogs.shift();
        }

        this.onEventCallback('console', item);
      } catch (err) {
        // Safe handling
      }
    });

    // 3. Network request listener
    this.page.on('request', request => {
      try {
        const reqId = crypto.randomUUID();
        const startTime = Date.now();
        const url = this.redactUrl(request.url());

        const reqData = {
          id: reqId,
          url,
          method: request.method(),
          resourceType: request.resourceType(),
          headers: this.redactHeaders(request.headers()),
          postDataSize: request.postData() ? request.postData().length : 0,
          status: 'pending',
          statusCode: null,
          statusText: '',
          timing: null,
          startTime,
          timestamp: new Date().toISOString()
        };

        this.networkRequests.set(request, reqData);
        this.requestList.push(reqData);
        if (this.requestList.length > this.maxRequests) {
          this.requestList.shift();
        }

        this.onEventCallback('network', reqData);
      } catch (err) {
        // Safe handling
      }
    });

    // 4. Network response listener
    this.page.on('response', response => {
      try {
        const request = response.request();
        const reqData = this.networkRequests.get(request);
        if (!reqData) return;

        const duration = Date.now() - reqData.startTime;
        reqData.status = response.ok() ? 'finished' : 'error';
        reqData.statusCode = response.status();
        reqData.statusText = response.statusText();
        reqData.responseHeaders = this.redactHeaders(response.headers());
        reqData.mimeType = response.headers()['content-type'] || '';
        reqData.duration = duration;

        this.onEventCallback('network_update', reqData);
      } catch (err) {
        // Safe handling
      }
    });

    // 5. Network request failed
    this.page.on('requestfailed', request => {
      try {
        const reqData = this.networkRequests.get(request);
        if (!reqData) return;

        const failure = request.failure();
        reqData.status = 'failed';
        reqData.failureText = failure ? failure.errorText : 'Unknown network failure';
        reqData.duration = Date.now() - reqData.startTime;

        this.onEventCallback('network_update', reqData);
      } catch (err) {
        // Safe handling
      }
    });
  }

  getLogs() {
    return this.consoleLogs;
  }

  getRequests() {
    return this.requestList;
  }

  clear() {
    this.consoleLogs = [];
    this.networkRequests.clear();
    this.requestList = [];
  }
}

module.exports = EventCollector;
