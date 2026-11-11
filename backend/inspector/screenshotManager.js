class ScreenshotManager {
  constructor() {
    this.inFlight = false;
    this.pending = false;
  }

  async captureViewport(page, options = {}) {
    if (!page || page.isClosed()) return null;

    if (this.inFlight) {
      return null;
    }

    this.inFlight = true;
    const format = options.format || 'jpeg'; // jpeg is 5x faster and lighter for live streaming
    const quality = format === 'jpeg' ? (options.quality || 75) : undefined;

    try {
      const buffer = await page.screenshot({
        type: format,
        quality,
        fullPage: false
      });

      const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      return `data:${mimeType};base64,${buffer.toString('base64')}`;
    } catch (err) {
      if (!page.isClosed()) {
        console.error('[SafariInspector] Error capturing screenshot:', err.message);
      }
      return null;
    } finally {
      this.inFlight = false;
    }
  }

  async captureBuffer(page, format = 'png') {
    if (!page || page.isClosed()) return null;
    return await page.screenshot({
      type: format,
      fullPage: false
    });
  }
}

module.exports = new ScreenshotManager();
