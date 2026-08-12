export const hexToRgb = (hex) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  return { r, g, b };
};

export const rgbToHex = (r, g, b) => {
  return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
};

const luminance = (r, g, b) => {
  const a = [r, g, b].map(function (v) {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

export const getContrastRatio = (hex1, hex2) => {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const lum1 = luminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = luminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
};

export const getAccessibleTextColor = (hexBg) => {
  const ratioWithWhite = getContrastRatio(hexBg, '#FFFFFF');
  return ratioWithWhite > 4.5 ? '#FFFFFF' : '#1F2937';
};

export const adjustBrightness = (hex, percent) => {
  const { r, g, b } = hexToRgb(hex);
  
  const adjust = (c) => Math.max(0, Math.min(255, Math.round(c + (c * percent / 100))));
  
  return rgbToHex(adjust(r), adjust(g), adjust(b));
};

export const tint = (hex, percent) => {
  const { r, g, b } = hexToRgb(hex);
  const adjust = (c) => Math.max(0, Math.min(255, Math.round(c + ((255 - c) * percent / 100))));
  return rgbToHex(adjust(r), adjust(g), adjust(b));
};

export const shade = (hex, percent) => {
  const { r, g, b } = hexToRgb(hex);
  const adjust = (c) => Math.max(0, Math.min(255, Math.round(c * (1 - percent / 100))));
  return rgbToHex(adjust(r), adjust(g), adjust(b));
};

export const getDistance = (color1, color2) => {
  const r1 = color1[0], g1 = color1[1], b1 = color1[2];
  const r2 = color2[0], g2 = color2[1], b2 = color2[2];
  return Math.sqrt(Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2));
};

export const rgbArrayToHex = (arr) => {
  return rgbToHex(arr[0], arr[1], arr[2]);
};

// Simple clustering to merge visually similar colors
export const clusterColors = (colors, threshold = 30) => {
  const clusters = [];
  
  colors.forEach(color => {
    let matched = false;
    for (let cluster of clusters) {
      if (getDistance(cluster.center, color) < threshold) {
        cluster.points.push(color);
        matched = true;
        break;
      }
    }
    if (!matched) {
      clusters.push({ center: color, points: [color] });
    }
  });

  return clusters.map(c => c.center);
};

export const extractColorsFromImage = (imgElement, maxColors = 8) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Resize image for faster processing
  const maxDim = 200;
  let width = imgElement.naturalWidth || imgElement.width;
  let height = imgElement.naturalHeight || imgElement.height;
  
  if (width > maxDim || height > maxDim) {
    if (width > height) {
      height = Math.round(height * (maxDim / width));
      width = maxDim;
    } else {
      width = Math.round(width * (maxDim / height));
      height = maxDim;
    }
  }
  
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(imgElement, 0, 0, width, height);
  
  const imageData = ctx.getImageData(0, 0, width, height).data;
  const colorCounts = {};
  
  for (let i = 0; i < imageData.length; i += 4) {
    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];
    const a = imageData[i + 3];
    
    // Ignore transparent and nearly white/black pixels
    if (a < 128 || (r > 240 && g > 240 && b > 240) || (r < 20 && g < 20 && b < 20)) continue;
    
    // Round to nearest 10 to group similar colors slightly before full clustering
    const rR = Math.round(r / 10) * 10;
    const gR = Math.round(g / 10) * 10;
    const bR = Math.round(b / 10) * 10;
    const key = `${rR},${gR},${bR}`;
    
    colorCounts[key] = (colorCounts[key] || 0) + 1;
  }
  
  const sortedColors = Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0].split(',').map(Number));
  
  // Cluster to get distinct colors
  const clustered = clusterColors(sortedColors, 40);
  return clustered.slice(0, maxColors);
};
