/**
 * Safe SVG Sanitizer & Layer Extractor
 * Uses DOMParser to sanitize raw SVG markup, strip scripts/handlers,
 * ensure unique IDs for animatable elements, and generate layer tree.
 */

const DANGEROUS_TAGS = new Set([
  'script',
  'foreignobject',
  'iframe',
  'object',
  'embed',
  'link',
  'meta',
  'base'
]);

const ANIMATABLE_TAGS = new Set([
  'path',
  'rect',
  'circle',
  'ellipse',
  'polygon',
  'polyline',
  'line',
  'g',
  'text'
]);

/**
 * Sanitizes element ID into a valid CSS selector identifier
 */
export function sanitizeId(id, fallbackIndex = 1) {
  if (!id || typeof id !== 'string') {
    return `el-${fallbackIndex}`;
  }
  let safe = id.trim().replace(/[^a-zA-Z0-9_-]/g, '-');
  if (/^[0-9]/.test(safe)) {
    safe = `el-${safe}`;
  }
  return safe || `el-${fallbackIndex}`;
}

/**
 * Sanitizes raw SVG text and extracts animatable layers
 */
export function sanitizeAndParseSvg(rawSvg) {
  if (!rawSvg || typeof rawSvg !== 'string') {
    throw new Error('SVG content is empty or invalid.');
  }

  // Initial string cleanup: remove DOCTYPE and XML prolog if present
  let cleanInput = rawSvg
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .trim();

  const parser = new DOMParser();
  let doc = parser.parseFromString(cleanInput, 'image/svg+xml');

  // Check for parser errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    // Attempt parsing with text/html fallback
    const htmlDoc = parser.parseFromString(cleanInput, 'text/html');
    const svgEl = htmlDoc.querySelector('svg');
    if (!svgEl) {
      throw new Error('Invalid SVG: Could not parse XML or find <svg> element.');
    }
    doc = parser.parseFromString(svgEl.outerHTML, 'image/svg+xml');
  }

  const svgElement = doc.querySelector('svg');
  if (!svgElement) {
    throw new Error('No <svg> tag found in the provided markup.');
  }

  // Remove dangerous tags
  const allElements = svgElement.querySelectorAll('*');
  allElements.forEach((el) => {
    const tagName = el.tagName.toLowerCase();
    if (DANGEROUS_TAGS.has(tagName)) {
      el.remove();
      return;
    }

    // Strip inline event listeners (onclick, onload, etc.)
    const attrs = Array.from(el.attributes);
    for (const attr of attrs) {
      const name = attr.name.toLowerCase();
      const val = attr.value.trim().toLowerCase();

      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
      } else if (
        (name === 'href' || name === 'xlink:href' || name === 'src') &&
        (val.startsWith('javascript:') || val.startsWith('data:text/html'))
      ) {
        el.removeAttribute(attr.name);
      }
    }
  });

  // Ensure viewBox exists
  let viewBox = svgElement.getAttribute('viewBox');
  let width = svgElement.getAttribute('width');
  let height = svgElement.getAttribute('height');

  if (!viewBox) {
    const wNum = parseFloat(width) || 200;
    const hNum = parseFloat(height) || 200;
    viewBox = `0 0 ${wNum} ${hNum}`;
    svgElement.setAttribute('viewBox', viewBox);
  }

  // Keep responsive sizing attributes
  svgElement.setAttribute('width', '100%');
  svgElement.setAttribute('height', '100%');

  // Catalog animatable elements and ensure safe IDs
  const layers = [];
  const usedIds = new Set();
  let idCounter = 1;

  const candidates = svgElement.querySelectorAll('*');

  candidates.forEach((el) => {
    const tagName = el.tagName.toLowerCase();
    if (!ANIMATABLE_TAGS.has(tagName)) return;

    // Skip root svg or defs children
    if (el.closest('defs')) return;

    let id = el.getAttribute('id');
    if (!id || usedIds.has(id)) {
      do {
        id = `el-${tagName}-${idCounter++}`;
      } while (usedIds.has(id));
      el.setAttribute('id', id);
    } else {
      id = sanitizeId(id, idCounter++);
      el.setAttribute('id', id);
    }
    usedIds.add(id);

    // Human readable label
    const explicitTitle = el.querySelector('title')?.textContent;
    let label = explicitTitle || id;
    if (label.startsWith('el-')) {
      label = `${tagName.toUpperCase()} #${idCounter - 1}`;
    }

    const styleAttr = el.getAttribute('style') || '';
    const fill = el.getAttribute('fill') || extractCssProp(styleAttr, 'fill') || el.style?.fill || '';
    const stroke = el.getAttribute('stroke') || extractCssProp(styleAttr, 'stroke') || el.style?.stroke || '';
    const strokeWidth = el.getAttribute('stroke-width') || extractCssProp(styleAttr, 'stroke-width') || el.style?.strokeWidth || '';
    const opacity = el.getAttribute('opacity') || extractCssProp(styleAttr, 'opacity') || el.style?.opacity || '1';

    // Parent group if any
    const parent = el.parentElement;
    const parentId = parent && parent.tagName.toLowerCase() === 'g' ? parent.getAttribute('id') : null;

    layers.push({
      id,
      tagName,
      label,
      fill,
      stroke,
      strokeWidth,
      opacity,
      parentId,
      hasChildren: tagName === 'g' && el.children.length > 0
    });
  });

  const serializer = new XMLSerializer();
  const sanitizedSvg = serializer.serializeToString(svgElement);

  return {
    sanitizedSvg,
    layers,
    viewBox,
    width,
    height
  };
}

/**
 * Extracts a CSS property value from an inline style string
 */
function extractCssProp(styleStr, prop) {
  if (!styleStr) return '';
  const regex = new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, 'i');
  const match = styleStr.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Updates fill, stroke, strokeWidth, and opacity on an element in the SVG markup
 */
export function updateElementStyleInSvg(svgString, elementId, styles = {}, applyToChildren = false) {
  if (!svgString || !elementId) {
    return { svgString, layers: [] };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const targetEl = doc.getElementById(elementId);

  if (!targetEl) {
    return { svgString, layers: [] };
  }

  const elementsToUpdate = [targetEl];
  if (applyToChildren && targetEl.tagName.toLowerCase() === 'g') {
    const children = targetEl.querySelectorAll('*');
    children.forEach((c) => elementsToUpdate.push(c));
  }

  elementsToUpdate.forEach((el) => {
    // Fill
    if (styles.fill !== undefined) {
      if (styles.fill === 'none' || styles.fill === 'transparent') {
        el.setAttribute('fill', 'none');
        if (el.style) el.style.fill = 'none';
      } else if (styles.fill) {
        el.setAttribute('fill', styles.fill);
        if (el.style) el.style.fill = styles.fill;
      }
    }

    // Stroke
    if (styles.stroke !== undefined) {
      if (styles.stroke === 'none' || styles.stroke === 'transparent') {
        el.setAttribute('stroke', 'none');
        if (el.style) el.style.stroke = 'none';
      } else if (styles.stroke) {
        el.setAttribute('stroke', styles.stroke);
        if (el.style) el.style.stroke = styles.stroke;
      }
    }

    // Stroke Width
    if (styles.strokeWidth !== undefined) {
      const sw = parseFloat(styles.strokeWidth);
      if (!isNaN(sw) && sw >= 0) {
        el.setAttribute('stroke-width', String(sw));
        if (el.style) el.style.strokeWidth = `${sw}px`;
      }
    }

    // Opacity
    if (styles.opacity !== undefined) {
      const op = parseFloat(styles.opacity);
      if (!isNaN(op) && op >= 0 && op <= 1) {
        el.setAttribute('opacity', String(op));
        if (el.style) el.style.opacity = String(op);
      }
    }
  });

  const serializer = new XMLSerializer();
  const newSvg = serializer.serializeToString(doc.documentElement);
  const reParsed = sanitizeAndParseSvg(newSvg);

  return {
    svgString: reParsed.sanitizedSvg,
    layers: reParsed.layers
  };
}

/**
 * Replaces one color with another across all elements in the SVG
 */
export function replaceGlobalColorInSvg(svgString, oldColor, newColor) {
  if (!svgString || !oldColor || !newColor) {
    return { svgString, layers: [] };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const allElements = doc.querySelectorAll('*');

  const normalize = (c) => c?.toLowerCase().trim();
  const target = normalize(oldColor);

  allElements.forEach((el) => {
    const fillAttr = normalize(el.getAttribute('fill'));
    const strokeAttr = normalize(el.getAttribute('stroke'));
    const styleAttr = el.getAttribute('style') || '';
    const styleFill = normalize(extractCssProp(styleAttr, 'fill') || el.style?.fill);
    const styleStroke = normalize(extractCssProp(styleAttr, 'stroke') || el.style?.stroke);

    if (fillAttr === target || styleFill === target) {
      el.setAttribute('fill', newColor);
      if (el.style) el.style.fill = newColor;
    }

    if (strokeAttr === target || styleStroke === target) {
      el.setAttribute('stroke', newColor);
      if (el.style) el.style.stroke = newColor;
    }
  });

  const serializer = new XMLSerializer();
  const newSvg = serializer.serializeToString(doc.documentElement);
  const reParsed = sanitizeAndParseSvg(newSvg);

  return {
    svgString: reParsed.sanitizedSvg,
    layers: reParsed.layers
  };
}

/**
 * Extracts list of unique colors used in SVG layers
 */
export function extractUniqueColors(layers = []) {
  const map = new Map();

  layers.forEach((layer) => {
    const rawFill = layer.fill?.trim();
    if (rawFill && rawFill !== 'none' && rawFill !== 'transparent') {
      const c = rawFill.toLowerCase();
      map.set(c, (map.get(c) || 0) + 1);
    }

    const rawStroke = layer.stroke?.trim();
    if (rawStroke && rawStroke !== 'none' && rawStroke !== 'transparent') {
      const c = rawStroke.toLowerCase();
      map.set(c, (map.get(c) || 0) + 1);
    }
  });

  return Array.from(map.entries()).map(([color, count]) => ({
    color,
    count
  }));
}
