const express = require('express');
const cors = require('cors');
const youtubedl = require('youtube-dl-exec');
const ffmpeg = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 3001;

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

app.listen(PORT, () => {
  console.log(`Video Downloader API running on http://localhost:${PORT}`);
});
