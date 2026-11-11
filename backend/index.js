const http = require('http');
const express = require('express');
const cors = require('cors');
const youtubedl = require('youtube-dl-exec');
const ffmpeg = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const os = require('os');

const sessionManager = require('./inspector/sessionManager');
const browserManager = require('./inspector/browserManager');
const { PRESET_PROFILES } = require('./inspector/deviceProfiles');
const { compareBrowsers } = require('./inspector/comparisonEngine');
const { setupWebSocketServer } = require('./inspector/websocketServer');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '127.0.0.1'; // Loopback bind by default

app.use(cors());
app.use(express.json());

app.post('/api/video/info', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ message: 'URL is required' });
  }

  try {
    const info = await youtubedl(url, {
      dumpJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: [
        'referer:youtube.com',
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      ]
    });
    
    // Process formats (all video formats, even without native audio, since we will merge)
    const formats = info.formats.filter(f => f.vcodec !== 'none');
    
    const mappedFormats = formats.map(f => {
      let quality = f.format_note || (f.height ? `${f.height}p` : 'Unknown');
      
      return {
        id: f.format_id,
        quality: quality,
        format: f.ext,
        size: f.filesize || f.filesize_approx || null,
        // Point download URL to our new backend endpoint instead of direct YouTube url
        downloadUrl: `http://localhost:3001/api/video/download?url=${encodeURIComponent(url)}&formatId=${f.format_id}&ext=${f.ext}`
      };
    }).filter(f => ['mp4', 'webm'].includes(f.format));
    
    // Deduplicate qualities
    const uniqueFormats = [];
    const seen = new Set();
    for (const format of mappedFormats) {
        const key = `${format.quality}-${format.format}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueFormats.push(format);
        }
    }

    // Sort formats by resolution (highest first)
    uniqueFormats.sort((a, b) => {
      const getRes = (q) => parseInt(q) || 0;
      return getRes(b.quality) - getRes(a.quality);
    });

    res.json({
      title: info.title,
      thumbnail: info.thumbnail || '',
      duration: parseInt(info.duration, 10),
      source: info.extractor_key || 'youtube.com',
      formats: uniqueFormats
    });

  } catch (error) {
    console.error('Error fetching video info:', error);
    res.status(500).json({ message: 'Failed to fetch video information. The video might be private, DRM protected, or geo-restricted.' });
  }
});

app.get('/api/video/download', async (req, res) => {
  const { url, formatId } = req.query;

  if (!url || !formatId) {
    return res.status(400).send('URL and formatId are required');
  }

  try {
    const info = await youtubedl(url, {
      dumpJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      addHeader: [
        'referer:youtube.com',
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      ]
    });

    const videoFormat = info.formats.find(f => f.format_id === formatId);
    if (!videoFormat) {
      return res.status(404).send('Format not found');
    }

    // If the selected format already has both video and audio, just redirect!
    if (videoFormat.acodec !== 'none' && videoFormat.vcodec !== 'none') {
      return res.redirect(videoFormat.url);
    }

    // Otherwise, we need to merge video and audio on the fly
    const audioFormats = info.formats.filter(f => f.vcodec === 'none' && f.acodec !== 'none');
    audioFormats.sort((a, b) => (b.abr || 0) - (a.abr || 0));
    const bestAudio = audioFormats[0];

    if (!bestAudio) {
      // No audio found, just redirect to the silent video
      return res.redirect(videoFormat.url);
    }

    const ext = videoFormat.ext === 'webm' ? 'webm' : 'mp4';
    const isMp4 = ext === 'mp4';
    
    res.header('Content-Disposition', `attachment; filename="video.${ext}"`);
    res.header('Content-Type', `video/${ext}`);

    const cp = require('child_process');
    
    const ffmpegArgs = [
      '-user_agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      '-i', videoFormat.url,
      '-user_agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      '-i', bestAudio.url,
      '-c', 'copy'
    ];

    if (isMp4) {
      ffmpegArgs.push('-movflags', 'frag_keyframe+empty_moov', '-f', 'mp4');
    } else {
      ffmpegArgs.push('-f', 'webm');
    }
    
    ffmpegArgs.push('pipe:1');

    const ffmpegProcess = cp.spawn(ffmpeg, ffmpegArgs);

    ffmpegProcess.stdout.pipe(res);

    ffmpegProcess.stderr.on('data', (data) => {
      // Optional: console.log(data.toString());
    });

    req.on('close', () => {
      ffmpegProcess.kill('SIGKILL');
    });

  } catch (error) {
    console.error('Error downloading/merging video:', error);
    if (!res.headersSent) {
      res.status(500).send('Failed to stream video.');
    }
  }
});

// ==========================================
// Safari Inspector Studio API Endpoints
// ==========================================

// 1. Health check & browser availability
app.get('/api/inspector/health', async (req, res) => {
  try {
    const availability = await browserManager.checkAvailability();
    res.json({
      status: 'ok',
      service: 'Safari Inspector Studio Engine',
      timestamp: new Date().toISOString(),
      engines: availability
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 2. List supported device profiles
app.get('/api/inspector/devices', (req, res) => {
  res.json({
    presets: PRESET_PROFILES
  });
});

// 3. Create inspector session
app.post('/api/inspector/sessions', async (req, res) => {
  try {
    const { url, engine, device, width, height, isLandscape } = req.body;
    const session = await sessionManager.createSession({
      url,
      engine,
      device,
      width,
      height,
      isLandscape
    });

    res.status(201).json({
      sessionId: session.id,
      url: session.url,
      engine: session.engine,
      deviceId: session.deviceId,
      viewport: session.deviceConfig ? session.deviceConfig.viewport : { width: 390, height: 844 },
      wsUrl: `ws://${req.headers.host || 'localhost:3001'}/ws/inspector?sessionId=${session.id}`
    });
  } catch (err) {
    console.error('[SafariInspector] Error creating session:', err);
    res.status(500).json({ error: 'Failed to create inspector session', message: err.message });
  }
});

// 4. Navigate session
app.post('/api/inspector/sessions/:id/navigate', async (req, res) => {
  const session = sessionManager.getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    await session.navigate(url);
    res.json({ success: true, url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Interact with page (click, scroll, type)
app.post('/api/inspector/sessions/:id/interact', async (req, res) => {
  const session = sessionManager.getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const { action, x, y, deltaX, deltaY, text, key } = req.body;

  try {
    switch (action) {
      case 'click':
        await session.click(x, y);
        break;
      case 'hover':
        await session.hover(x, y);
        break;
      case 'scroll':
        await session.scroll(deltaX, deltaY, x, y);
        break;
      case 'type':
        await session.type(text);
        break;
      case 'key':
        await session.pressKey(key);
        break;
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    const freshFrame = await session.getScreenshot({ format: 'jpeg', quality: 80 });
    res.json({ success: true, frame: freshFrame });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Inspect element at coordinates or selector
app.get('/api/inspector/sessions/:id/element', async (req, res) => {
  const session = sessionManager.getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const { x, y, selector } = req.query;

  try {
    let data = null;
    if (selector) {
      data = await session.inspectSelector(selector);
    } else if (x !== undefined && y !== undefined) {
      data = await session.inspectPoint(parseFloat(x), parseFloat(y));
    } else {
      return res.status(400).json({ error: 'Provide coordinates (x, y) or selector' });
    }

    res.json({ element: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Live CSS styles override
app.post('/api/inspector/sessions/:id/styles', async (req, res) => {
  const session = sessionManager.getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const { selector, property, value, reset } = req.body;

  try {
    if (reset) {
      const overrides = await session.resetStyleOverrides();
      return res.json({ overrides });
    }

    if (!selector || !property) {
      return res.status(400).json({ error: 'selector and property are required' });
    }

    const overrides = await session.applyStyleOverride(selector, property, value);
    res.json({ overrides, exportSnippet: session.getCssExport() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Capture screenshot
app.post('/api/inspector/sessions/:id/screenshot', async (req, res) => {
  const session = sessionManager.getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  try {
    const screenshot = await session.getScreenshot({ format: 'png' });
    res.json({ screenshot });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Browser comparison (Chromium vs WebKit with pixel diff)
app.post('/api/inspector/compare', async (req, res) => {
  const { url, threshold, viewport } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Target URL is required' });
  }

  try {
    const result = await compareBrowsers(url, { threshold, viewport });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Close / delete session
app.delete('/api/inspector/sessions/:id', async (req, res) => {
  const closed = await sessionManager.closeSession(req.params.id);
  res.json({ success: closed });
});

// Create HTTP server and mount WebSocket handler
const server = http.createServer(app);
setupWebSocketServer(server);

server.listen(PORT, HOST, () => {
  console.log(`Developer Toolkit API running on http://${HOST}:${PORT}`);
  console.log(`Safari Inspector WebSocket available at ws://${HOST}:${PORT}/ws/inspector`);
});

