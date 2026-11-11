const { devices } = require('playwright');

const PRESET_PROFILES = {
  'iphone-14-pro': {
    name: 'iPhone 14 Pro',
    category: 'Mobile',
    playwrightPreset: 'iPhone 14 Pro',
    width: 393,
    height: 852,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: devices['iPhone 14 Pro'] ? devices['iPhone 14 Pro'].userAgent : 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
  },
  'iphone-14': {
    name: 'iPhone 14',
    category: 'Mobile',
    playwrightPreset: 'iPhone 14',
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: devices['iPhone 14'] ? devices['iPhone 14'].userAgent : 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
  },
  'iphone-se': {
    name: 'iPhone SE (3rd gen)',
    category: 'Mobile',
    playwrightPreset: 'iPhone SE',
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: devices['iPhone SE'] ? devices['iPhone SE'].userAgent : 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  },
  'ipad-pro-11': {
    name: 'iPad Pro 11"',
    category: 'Tablet',
    playwrightPreset: 'iPad Pro 11',
    width: 834,
    height: 1194,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: devices['iPad Pro 11'] ? devices['iPad Pro 11'].userAgent : 'Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
  },
  'ipad-air': {
    name: 'iPad Air / Gen 7',
    category: 'Tablet',
    playwrightPreset: 'iPad (gen 7)',
    width: 810,
    height: 1080,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: devices['iPad (gen 7)'] ? devices['iPad (gen 7)'].userAgent : 'Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
  },
  'desktop-safari': {
    name: 'Desktop Safari (Mac)',
    category: 'Desktop',
    playwrightPreset: null,
    width: 1280,
    height: 800,
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: false,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'
  },
  'desktop-hd': {
    name: 'Desktop HD (1920x1080)',
    category: 'Desktop',
    playwrightPreset: null,
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
};

function getDeviceProfile(deviceId = 'iphone-14', customWidth, customHeight, isLandscape = false) {
  if (deviceId === 'custom' || !PRESET_PROFILES[deviceId]) {
    const w = parseInt(customWidth, 10) || 390;
    const h = parseInt(customHeight, 10) || 844;
    return {
      id: 'custom',
      name: 'Custom Viewport',
      viewport: {
        width: isLandscape ? Math.max(w, h) : Math.min(w, h),
        height: isLandscape ? Math.min(w, h) : Math.max(w, h)
      },
      deviceScaleFactor: 2,
      isMobile: w <= 768,
      hasTouch: w <= 768,
      userAgent: w <= 768
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
        : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'
    };
  }

  const base = PRESET_PROFILES[deviceId];
  let finalWidth = base.width;
  let finalHeight = base.height;

  if (isLandscape && base.isMobile) {
    finalWidth = Math.max(base.width, base.height);
    finalHeight = Math.min(base.width, base.height);
  } else if (!isLandscape && base.isMobile) {
    finalWidth = Math.min(base.width, base.height);
    finalHeight = Math.max(base.width, base.height);
  }

  // Use Playwright preset options if available
  let contextOptions = {};
  if (base.playwrightPreset && devices[base.playwrightPreset]) {
    contextOptions = { ...devices[base.playwrightPreset] };
  }

  return {
    id: deviceId,
    name: base.name,
    category: base.category,
    ...contextOptions,
    viewport: {
      width: finalWidth,
      height: finalHeight
    },
    deviceScaleFactor: base.deviceScaleFactor || 2,
    isMobile: base.isMobile,
    hasTouch: base.hasTouch,
    userAgent: base.userAgent
  };
}

module.exports = {
  PRESET_PROFILES,
  getDeviceProfile
};
