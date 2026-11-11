// Safari Inspector Studio - Frontend API Service

const DEFAULT_API_URL = import.meta.env.VITE_INSPECTOR_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function getInspectorConfig() {
  const savedApiUrl = localStorage.getItem('safari_inspector_api_url') || DEFAULT_API_URL;
  const savedToken = localStorage.getItem('safari_inspector_auth_token') || '';

  let wsUrl = import.meta.env.VITE_INSPECTOR_WS_URL || '';
  if (!wsUrl) {
    try {
      const parsed = new URL(savedApiUrl);
      const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${wsProtocol}//${parsed.host}/ws/inspector`;
    } catch (e) {
      wsUrl = 'ws://localhost:3001/ws/inspector';
    }
  }

  return {
    apiUrl: savedApiUrl,
    wsUrl,
    token: savedToken
  };
}

export function saveInspectorConfig({ apiUrl, token }) {
  if (apiUrl) localStorage.setItem('safari_inspector_api_url', apiUrl.trim());
  if (token !== undefined) localStorage.setItem('safari_inspector_auth_token', token.trim());
}

async function request(endpoint, options = {}) {
  const config = getInspectorConfig();
  const url = `${config.apiUrl.replace(/\/$/, '')}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}),
    ...(options.headers || {})
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new Error(`API Error ${res.status}: ${errorText || res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function checkBackendHealth() {
  try {
    const data = await request('/api/inspector/health', { method: 'GET', timeout: 4000 });
    return {
      connected: true,
      service: data.service,
      engines: data.engines || {}
    };
  } catch (err) {
    const isHttpsToHttp = typeof window !== 'undefined' && 
      window.location.protocol === 'https:' && 
      getInspectorConfig().apiUrl.startsWith('http://');

    return {
      connected: false,
      isMixedContent: isHttpsToHttp,
      error: err.message
    };
  }
}

export async function getDevicePresets() {
  return request('/api/inspector/devices', { method: 'GET' });
}

export async function createSession(options = {}) {
  return request('/api/inspector/sessions', {
    method: 'POST',
    body: JSON.stringify(options)
  });
}

export async function navigateSession(sessionId, url) {
  return request(`/api/inspector/sessions/${sessionId}/navigate`, {
    method: 'POST',
    body: JSON.stringify({ url })
  });
}

export async function interactSession(sessionId, actionData) {
  return request(`/api/inspector/sessions/${sessionId}/interact`, {
    method: 'POST',
    body: JSON.stringify(actionData)
  });
}

export async function inspectElement(sessionId, params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/inspector/sessions/${sessionId}/element?${query}`, {
    method: 'GET'
  });
}

export async function updateStyles(sessionId, styleData) {
  return request(`/api/inspector/sessions/${sessionId}/styles`, {
    method: 'POST',
    body: JSON.stringify(styleData)
  });
}

export async function captureScreenshot(sessionId) {
  return request(`/api/inspector/sessions/${sessionId}/screenshot`, {
    method: 'POST'
  });
}

export async function compareBrowsers(compareData) {
  return request('/api/inspector/compare', {
    method: 'POST',
    body: JSON.stringify(compareData),
    timeout: 45000 // Comparison needs enough time to render both browsers
  });
}

export async function closeSession(sessionId) {
  return request(`/api/inspector/sessions/${sessionId}`, {
    method: 'DELETE'
  });
}
