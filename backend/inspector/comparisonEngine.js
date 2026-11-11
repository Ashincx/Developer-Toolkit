const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const browserManager = require('./browserManager');

async function compareBrowsers(url, options = {}) {
  const viewport = options.viewport || { width: 390, height: 844 };
  const deviceScaleFactor = options.deviceScaleFactor || 2;
  const threshold = typeof options.threshold === 'number' ? options.threshold : 0.1; // 0 to 1

  let crContext = null;
  let wkContext = null;
  let crPage = null;
  let wkPage = null;

  try {
    // 1. Launch / create contexts in parallel
    const [crCtx, wkCtx] = await Promise.all([
      browserManager.createContext('chromium', { viewport, deviceScaleFactor, isMobile: true, hasTouch: true }),
      browserManager.createContext('webkit', { viewport, deviceScaleFactor, isMobile: true, hasTouch: true })
    ]);

    crContext = crCtx;
    wkContext = wkCtx;

    [crPage, wkPage] = await Promise.all([
      crContext.newPage(),
      wkContext.newPage()
    ]);

    // 2. Navigate both pages to the target URL
    const navOptions = { waitUntil: 'load', timeout: 25000 };
    await Promise.all([
      crPage.goto(url, navOptions).catch(e => console.warn('[Comparison] Chromium nav warning:', e.message)),
      wkPage.goto(url, navOptions).catch(e => console.warn('[Comparison] WebKit nav warning:', e.message))
    ]);

    // Small delay to allow fonts and layout to settle
    await new Promise(r => setTimeout(r, 600));

    // 3. Capture PNG screenshots
    const [crBuffer, wkBuffer] = await Promise.all([
      crPage.screenshot({ type: 'png', fullPage: false }),
      wkPage.screenshot({ type: 'png', fullPage: false })
    ]);

    // 4. Parse PNGs
    const crPng = PNG.sync.read(crBuffer);
    const wkPng = PNG.sync.read(wkBuffer);

    const width = Math.max(crPng.width, wkPng.width);
    const height = Math.max(crPng.height, wkPng.height);

    // Normalize buffers to same dimensions if slight difference
    const normalizedCr = normalizePngSize(crPng, width, height);
    const normalizedWk = normalizePngSize(wkPng, width, height);

    const diffPng = new PNG({ width, height });

    // 5. Run pixelmatch
    const diffPixelCount = pixelmatch(
      normalizedCr.data,
      normalizedWk.data,
      diffPng.data,
      width,
      height,
      {
        threshold,
        includeAA: false,
        diffColor: [255, 0, 85] // High-visibility vivid magenta-red for diff pixels
      }
    );

    const totalPixels = width * height;
    const diffPercentage = Number(((diffPixelCount / totalPixels) * 100).toFixed(2));

    const diffBuffer = PNG.sync.write(diffPng);

    return {
      success: true,
      url,
      viewport: { width, height },
      threshold,
      totalPixels,
      diffPixelCount,
      diffPercentage,
      chromiumImage: `data:image/png;base64,${crBuffer.toString('base64')}`,
      webkitImage: `data:image/png;base64,${wkBuffer.toString('base64')}`,
      diffImage: `data:image/png;base64,${diffBuffer.toString('base64')}`,
      notes: [
        'Differences may stem from font rasterization (DirectWrite on Windows vs WebKit text metrics).',
        'Subpixel layout rounding and antialiasing are normal causes of slight variance.',
        'Use diff highlights as investigation leads rather than definitive rendering bugs.'
      ]
    };
  } catch (err) {
    console.error('[SafariInspector] Browser comparison failed:', err);
    return {
      success: false,
      error: err.message
    };
  } finally {
    if (crContext) await crContext.close().catch(() => {});
    if (wkContext) await wkContext.close().catch(() => {});
  }
}

function normalizePngSize(png, targetWidth, targetHeight) {
  if (png.width === targetWidth && png.height === targetHeight) {
    return png;
  }

  const normalized = new PNG({ width: targetWidth, height: targetHeight, fill: true });
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const srcIdx = (y * png.width + x) * 4;
      const dstIdx = (y * targetWidth + x) * 4;
      normalized.data[dstIdx] = png.data[srcIdx];
      normalized.data[dstIdx + 1] = png.data[srcIdx + 1];
      normalized.data[dstIdx + 2] = png.data[srcIdx + 2];
      normalized.data[dstIdx + 3] = png.data[srcIdx + 3];
    }
  }
  return normalized;
}

module.exports = {
  compareBrowsers
};
