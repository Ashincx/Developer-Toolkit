async function inspectPoint(page, x, y) {
  if (!page) throw new Error('Page is not initialized');

  try {
    const elementData = await page.evaluate(({ px, py }) => {
      const el = document.elementFromPoint(px, py);
      if (!el) return null;

      // Helper to compute numeric px values for box model
      const cs = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      // Collect attributes
      const attributes = {};
      for (const attr of el.attributes) {
        attributes[attr.name] = attr.value;
      }

      // Build DOM path / selector
      const getSelector = (target) => {
        if (!target || target === document.documentElement) return 'html';
        if (target === document.body) return 'body';
        if (target.id) return `#${target.id}`;

        let path = target.tagName.toLowerCase();
        if (target.className && typeof target.className === 'string') {
          const classes = target.className.trim().split(/\s+/).filter(Boolean);
          if (classes.length > 0) {
            path += `.${classes.slice(0, 2).join('.')}`;
          }
        }

        const parent = target.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children);
          const index = siblings.indexOf(target) + 1;
          return `${getSelector(parent)} > ${path}:nth-child(${index})`;
        }
        return path;
      };

      // Build hierarchy breadcrumb
      const hierarchy = [];
      let current = el;
      while (current && current !== document.documentElement && hierarchy.length < 10) {
        hierarchy.unshift({
          tag: current.tagName.toLowerCase(),
          id: current.id || '',
          className: typeof current.className === 'string' ? current.className : '',
          selector: getSelector(current)
        });
        current = current.parentElement;
      }

      const parsePx = (val) => {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : Math.round(num);
      };

      const boxModel = {
        margin: {
          top: parsePx(cs.marginTop),
          right: parsePx(cs.marginRight),
          bottom: parsePx(cs.marginBottom),
          left: parsePx(cs.marginLeft)
        },
        border: {
          top: parsePx(cs.borderTopWidth),
          right: parsePx(cs.borderRightWidth),
          bottom: parsePx(cs.borderBottomWidth),
          left: parsePx(cs.borderLeftWidth)
        },
        padding: {
          top: parsePx(cs.paddingTop),
          right: parsePx(cs.paddingRight),
          bottom: parsePx(cs.paddingBottom),
          left: parsePx(cs.paddingLeft)
        },
        content: {
          width: Math.round(rect.width - parsePx(cs.paddingLeft) - parsePx(cs.paddingRight) - parsePx(cs.borderLeftWidth) - parsePx(cs.borderRightWidth)),
          height: Math.round(rect.height - parsePx(cs.paddingTop) - parsePx(cs.paddingBottom) - parsePx(cs.borderTopWidth) - parsePx(cs.borderBottomWidth))
        }
      };

      const computedStyles = {
        display: cs.display,
        position: cs.position,
        boxSizing: cs.boxSizing,
        overflow: cs.overflow,
        overflowX: cs.overflowX,
        overflowY: cs.overflowY,
        flexDirection: cs.flexDirection,
        justifyContent: cs.justifyContent,
        alignItems: cs.alignItems,
        gridTemplateColumns: cs.gridTemplateColumns,
        gap: cs.gap,
        zIndex: cs.zIndex,
        width: cs.width,
        height: cs.height,
        minWidth: cs.minWidth,
        maxWidth: cs.maxWidth,
        minHeight: cs.minHeight,
        maxHeight: cs.maxHeight,
        margin: `${cs.marginTop} ${cs.marginRight} ${cs.marginBottom} ${cs.marginLeft}`,
        padding: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing,
        textAlign: cs.textAlign,
        borderRadius: cs.borderRadius,
        border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
        boxShadow: cs.boxShadow,
        opacity: cs.opacity,
        transform: cs.transform,
        transition: cs.transition,
        webkitBackdropFilter: cs.webkitBackdropFilter || cs['-webkit-backdrop-filter'] || '',
        backdropFilter: cs.backdropFilter || ''
      };

      // Extract matched rules inside browser evaluate
      let inlineStyles = [];
      let matchedRules = [];
      try {
        if (el.style) {
          for (let i = 0; i < el.style.length; i++) {
            const prop = el.style[i];
            const val = el.style.getPropertyValue(prop);
            const priority = el.style.getPropertyPriority(prop);
            inlineStyles.push({
              property: prop,
              value: val,
              priority: priority ? '!important' : '',
              disabled: false
            });
          }
        }

        const sheets = Array.from(document.styleSheets);
        for (let sIdx = 0; sIdx < sheets.length; sIdx++) {
          const sheet = sheets[sIdx];
          let rules = null;
          try {
            rules = sheet.cssRules || sheet.rules;
          } catch (e) {
            continue;
          }
          if (!rules) continue;

          let source = 'inline';
          if (sheet.href) {
            try {
              const urlObj = new URL(sheet.href);
              source = urlObj.pathname.split('/').pop() || 'stylesheet.css';
            } catch (e) {
              source = (sheet.href.split('/').pop() || 'stylesheet.css').split('?')[0];
            }
          }

          function walkRules(ruleList, currentMedia) {
            if (!ruleList) return;
            for (let rIdx = 0; rIdx < ruleList.length; rIdx++) {
              const rule = ruleList[rIdx];
              if (!rule) continue;

              if (rule.type === 1 || rule.selectorText) {
                try {
                  if (el.matches(rule.selectorText)) {
                    const declarations = [];
                    const style = rule.style;
                    if (style) {
                      for (let d = 0; d < style.length; d++) {
                        const prop = style[d];
                        const val = style.getPropertyValue(prop);
                        const prio = style.getPropertyPriority(prop);
                        declarations.push({
                          property: prop,
                          value: val,
                          priority: prio ? '!important' : '',
                          disabled: false
                        });
                      }
                    }
                    if (declarations.length > 0) {
                      matchedRules.push({
                        selector: rule.selectorText,
                        media: currentMedia || '',
                        source: `${source}:${rIdx + 1}`,
                        declarations
                      });
                    }
                  }
                } catch (err) {}
              } else if (rule.type === 4 || rule.media) {
                try {
                  const mediaText = rule.conditionText || (rule.media && rule.media.mediaText) || '';
                  const matchesMedia = !mediaText || window.matchMedia(mediaText).matches;
                  if (matchesMedia && rule.cssRules) {
                    walkRules(rule.cssRules, mediaText);
                  }
                } catch (err) {}
              } else if (rule.type === 12 || rule.cssRules) {
                try {
                  walkRules(rule.cssRules, currentMedia);
                } catch (err) {}
              }
            }
          }

          walkRules(rules, '');
        }
      } catch (e) {
        console.error('Error walking styles:', e);
      }

      // Reverse so most specific/latest rules are on top
      matchedRules.reverse();

      return {
        tag: el.tagName.toLowerCase(),
        id: el.id || '',
        className: typeof el.className === 'string' ? el.className : '',
        attributes,
        rect: {
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        },
        selector: getSelector(el),
        hierarchy,
        boxModel,
        computedStyles,
        inlineStyles,
        matchedRules,
        innerHTMLSnippet: el.innerHTML ? el.innerHTML.slice(0, 150) : '',
        outerHTMLSnippet: el.outerHTML ? el.outerHTML.slice(0, 350) : ''
      };
    }, { px: x, py: y });

    return elementData;
  } catch (err) {
    console.error('[SafariInspector] Error inspecting element at point:', err);
    return null;
  }
}

async function inspectSelector(page, selector) {
  if (!page || !selector) return null;

  try {
    const elementData = await page.evaluate((sel) => {
      let el = null;
      try {
        el = document.querySelector(sel);
      } catch (e) {
        return null;
      }
      if (!el) return null;

      const cs = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      const attributes = {};
      for (const attr of el.attributes) {
        attributes[attr.name] = attr.value;
      }

      const getSelector = (target) => {
        if (!target || target === document.documentElement) return 'html';
        if (target === document.body) return 'body';
        if (target.id) return `#${target.id}`;

        let path = target.tagName.toLowerCase();
        if (target.className && typeof target.className === 'string') {
          const classes = target.className.trim().split(/\s+/).filter(Boolean);
          if (classes.length > 0) {
            path += `.${classes.slice(0, 2).join('.')}`;
          }
        }

        const parent = target.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children);
          const index = siblings.indexOf(target) + 1;
          return `${getSelector(parent)} > ${path}:nth-child(${index})`;
        }
        return path;
      };

      const hierarchy = [];
      let current = el;
      while (current && current !== document.documentElement && hierarchy.length < 10) {
        hierarchy.unshift({
          tag: current.tagName.toLowerCase(),
          id: current.id || '',
          className: typeof current.className === 'string' ? current.className : '',
          selector: getSelector(current)
        });
        current = current.parentElement;
      }

      const parsePx = (val) => {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : Math.round(num);
      };

      const boxModel = {
        margin: {
          top: parsePx(cs.marginTop),
          right: parsePx(cs.marginRight),
          bottom: parsePx(cs.marginBottom),
          left: parsePx(cs.marginLeft)
        },
        border: {
          top: parsePx(cs.borderTopWidth),
          right: parsePx(cs.borderRightWidth),
          bottom: parsePx(cs.borderBottomWidth),
          left: parsePx(cs.borderLeftWidth)
        },
        padding: {
          top: parsePx(cs.paddingTop),
          right: parsePx(cs.paddingRight),
          bottom: parsePx(cs.paddingBottom),
          left: parsePx(cs.paddingLeft)
        },
        content: {
          width: Math.round(rect.width - parsePx(cs.paddingLeft) - parsePx(cs.paddingRight) - parsePx(cs.borderLeftWidth) - parsePx(cs.borderRightWidth)),
          height: Math.round(rect.height - parsePx(cs.paddingTop) - parsePx(cs.paddingBottom) - parsePx(cs.borderTopWidth) - parsePx(cs.borderBottomWidth))
        }
      };

      const computedStyles = {
        display: cs.display,
        position: cs.position,
        boxSizing: cs.boxSizing,
        overflow: cs.overflow,
        overflowX: cs.overflowX,
        overflowY: cs.overflowY,
        flexDirection: cs.flexDirection,
        justifyContent: cs.justifyContent,
        alignItems: cs.alignItems,
        gridTemplateColumns: cs.gridTemplateColumns,
        gap: cs.gap,
        zIndex: cs.zIndex,
        width: cs.width,
        height: cs.height,
        minWidth: cs.minWidth,
        maxWidth: cs.maxWidth,
        minHeight: cs.minHeight,
        maxHeight: cs.maxHeight,
        margin: `${cs.marginTop} ${cs.marginRight} ${cs.marginBottom} ${cs.marginLeft}`,
        padding: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing,
        textAlign: cs.textAlign,
        borderRadius: cs.borderRadius,
        border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
        boxShadow: cs.boxShadow,
        opacity: cs.opacity,
        transform: cs.transform,
        transition: cs.transition,
        webkitBackdropFilter: cs.webkitBackdropFilter || cs['-webkit-backdrop-filter'] || '',
        backdropFilter: cs.backdropFilter || ''
      };

      let inlineStyles = [];
      let matchedRules = [];
      try {
        if (el.style) {
          for (let i = 0; i < el.style.length; i++) {
            const prop = el.style[i];
            const val = el.style.getPropertyValue(prop);
            const priority = el.style.getPropertyPriority(prop);
            inlineStyles.push({
              property: prop,
              value: val,
              priority: priority ? '!important' : '',
              disabled: false
            });
          }
        }

        const sheets = Array.from(document.styleSheets);
        for (let sIdx = 0; sIdx < sheets.length; sIdx++) {
          const sheet = sheets[sIdx];
          let rules = null;
          try {
            rules = sheet.cssRules || sheet.rules;
          } catch (e) {
            continue;
          }
          if (!rules) continue;

          let source = 'inline';
          if (sheet.href) {
            try {
              const urlObj = new URL(sheet.href);
              source = urlObj.pathname.split('/').pop() || 'stylesheet.css';
            } catch (e) {
              source = (sheet.href.split('/').pop() || 'stylesheet.css').split('?')[0];
            }
          }

          function walkRules(ruleList, currentMedia) {
            if (!ruleList) return;
            for (let rIdx = 0; rIdx < ruleList.length; rIdx++) {
              const rule = ruleList[rIdx];
              if (!rule) continue;

              if (rule.type === 1 || rule.selectorText) {
                try {
                  if (el.matches(rule.selectorText)) {
                    const declarations = [];
                    const style = rule.style;
                    if (style) {
                      for (let d = 0; d < style.length; d++) {
                        const prop = style[d];
                        const val = style.getPropertyValue(prop);
                        const prio = style.getPropertyPriority(prop);
                        declarations.push({
                          property: prop,
                          value: val,
                          priority: prio ? '!important' : '',
                          disabled: false
                        });
                      }
                    }
                    if (declarations.length > 0) {
                      matchedRules.push({
                        selector: rule.selectorText,
                        media: currentMedia || '',
                        source: `${source}:${rIdx + 1}`,
                        declarations
                      });
                    }
                  }
                } catch (err) {}
              } else if (rule.type === 4 || rule.media) {
                try {
                  const mediaText = rule.conditionText || (rule.media && rule.media.mediaText) || '';
                  const matchesMedia = !mediaText || window.matchMedia(mediaText).matches;
                  if (matchesMedia && rule.cssRules) {
                    walkRules(rule.cssRules, mediaText);
                  }
                } catch (err) {}
              } else if (rule.type === 12 || rule.cssRules) {
                try {
                  walkRules(rule.cssRules, currentMedia);
                } catch (err) {}
              }
            }
          }

          walkRules(rules, '');
        }
      } catch (e) {}

      matchedRules.reverse();

      return {
        tag: el.tagName.toLowerCase(),
        id: el.id || '',
        className: typeof el.className === 'string' ? el.className : '',
        attributes,
        rect: {
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        },
        selector: sel,
        hierarchy,
        boxModel,
        computedStyles,
        inlineStyles,
        matchedRules,
        innerHTMLSnippet: el.innerHTML ? el.innerHTML.slice(0, 150) : '',
        outerHTMLSnippet: el.outerHTML ? el.outerHTML.slice(0, 350) : ''
      };
    }, selector);

    return elementData;
  } catch (err) {
    return null;
  }
}

async function getDomTree(page, maxDepth = 10, targetSelector = null) {
  if (!page) return null;

  try {
    const tree = await page.evaluate(({ depthLimit, targetSel }) => {
      let targetEl = null;
      if (targetSel) {
        try { targetEl = document.querySelector(targetSel); } catch (e) {}
      }

      function getSelector(target) {
        if (!target || target === document.documentElement) return 'html';
        if (target === document.body) return 'body';
        if (target.id) return `#${target.id}`;

        let path = target.tagName.toLowerCase();
        if (target.className && typeof target.className === 'string') {
          const classes = target.className.trim().split(/\s+/).filter(Boolean);
          if (classes.length > 0) {
            path += `.${classes.slice(0, 2).join('.')}`;
          }
        }

        const parent = target.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children);
          const index = siblings.indexOf(target) + 1;
          return `${getSelector(parent)} > ${path}:nth-child(${index})`;
        }
        return path;
      }

      function serialize(node, currentDepth) {
        if (!node || node.nodeType !== 1) return null; // Element nodes only

        const tag = node.tagName.toLowerCase();
        // Skip non-visual script, noscript, style
        if (['script', 'style', 'noscript'].includes(tag)) {
          return null;
        }

        const rect = node.getBoundingClientRect();
        const cs = window.getComputedStyle(node);
        const isFlex = cs.display === 'flex' || cs.display === 'inline-flex';
        const isGrid = cs.display === 'grid' || cs.display === 'inline-grid';

        // Extract key attributes
        const attributes = {};
        for (const attr of node.attributes) {
          attributes[attr.name] = attr.value;
        }

        const sel = getSelector(node);
        const isTargetBranch = targetEl && (node === targetEl || node.contains(targetEl));

        const children = [];
        if ((currentDepth < depthLimit || isTargetBranch) && !['svg'].includes(tag)) {
          const childElements = Array.from(node.children);
          for (let i = 0; i < childElements.length; i++) {
            const child = childElements[i];
            const serializedChild = serialize(child, currentDepth + 1);
            if (serializedChild) {
              children.push(serializedChild);
            }
          }
        }

        // Get text snippet if leaf node
        let textContent = '';
        if (node.children.length === 0) {
          textContent = (node.textContent || '').trim().slice(0, 50);
        }

        return {
          tag,
          id: node.id || '',
          className: typeof node.className === 'string' ? node.className : '',
          attributes,
          selector: sel,
          rect: {
            x: Math.round(rect.left),
            y: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          },
          displayType: isFlex ? 'flex' : (isGrid ? 'grid' : ''),
          textContent,
          hasChildren: node.children.length > 0,
          children
        };
      }

      return serialize(document.body || document.documentElement, 1);
    }, { depthLimit: maxDepth, targetSel: targetSelector });

    return tree;
  } catch (err) {
    console.error('[SafariInspector] Error generating DOM tree:', err);
    return null;
  }
}

module.exports = {
  inspectPoint,
  inspectSelector,
  getDomTree
};
