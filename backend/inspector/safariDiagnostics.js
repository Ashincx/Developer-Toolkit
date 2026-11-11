async function runSafariDiagnostics(page) {
  if (!page || page.isClosed()) return [];

  try {
    const findings = await page.evaluate(() => {
      const results = [];

      // Category constants
      const CATEGORIES = {
        CONFIRMED_ERROR: 'Confirmed Error',
        OBSERVED_LAYOUT_ISSUE: 'Observed Layout Problem',
        POTENTIAL_COMPATIBILITY: 'Potential Compatibility Issue',
        REQUIRES_DEVICE_VERIFY: 'Requires Real iPhone Verification'
      };

      // 1. Check Horizontal Overflow (Confirmed Error)
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = window.innerWidth || document.documentElement.clientWidth;
      if (scrollWidth > clientWidth + 3) {
        results.push({
          id: 'horiz-overflow',
          category: CATEGORIES.CONFIRMED_ERROR,
          severity: 'error',
          title: 'Unintended Horizontal Overflow Detected',
          description: `Page content width (${scrollWidth}px) exceeds the viewport width (${clientWidth}px) by ${scrollWidth - clientWidth}px. On iOS Safari, this causes accidental side-swiping and breaks the mobile viewport container.`,
          recommendation: 'Check elements with fixed widths or negative margins. Consider adding overflow-x: clip or overflow-x: hidden on container sections.'
        });
      }

      // 2. Viewport Meta Tag (Confirmed / High Priority)
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (!viewportMeta) {
        results.push({
          id: 'missing-viewport-meta',
          category: CATEGORIES.CONFIRMED_ERROR,
          severity: 'error',
          title: 'Missing <meta name="viewport"> tag',
          description: 'No responsive viewport tag detected. Safari on iOS will default to a 980px desktop rendering scale.',
          recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> inside <head>.'
        });
      }

      // 3. Inspect DOM elements for WebKit CSS quirks
      const allElements = Array.from(document.querySelectorAll('*'));
      let stickyCount = 0;
      let vhCount = 0;
      let flexShrinkCount = 0;
      let missingBackdropPrefix = 0;
      let smallInputs = 0;
      let clickableNonPointers = 0;

      // Sample elements if page is very large (limit to first 1200 elements)
      const sampled = allElements.slice(0, 1200);

      for (const el of sampled) {
        const cs = window.getComputedStyle(el);

        // A. Sticky inside hidden/scroll parent (Observed Layout Problem)
        if (cs.position === 'sticky' && stickyCount < 3) {
          let parent = el.parentElement;
          let brokenSticky = false;
          while (parent && parent !== document.documentElement) {
            const pcs = window.getComputedStyle(parent);
            if (['hidden', 'auto', 'scroll'].includes(pcs.overflow) ||
                ['hidden', 'auto', 'scroll'].includes(pcs.overflowX) ||
                ['hidden', 'auto', 'scroll'].includes(pcs.overflowY)) {
              brokenSticky = true;
              break;
            }
            parent = parent.parentElement;
          }
          if (brokenSticky) {
            stickyCount++;
            results.push({
              id: `sticky-overflow-${stickyCount}`,
              category: CATEGORIES.OBSERVED_LAYOUT_ISSUE,
              severity: 'warning',
              title: 'Sticky Positioning Blocked by Parent Overflow',
              target: `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''}`,
              description: 'An element with position: sticky has an ancestor with overflow: hidden/auto/scroll. In Safari, any overflow on a parent context breaks position: sticky completely.',
              recommendation: 'Remove overflow: hidden/auto from the ancestor container, or move the sticky element outside of the overflowing wrapper.'
            });
          }
        }

        // B. Backdrop-filter without -webkit-backdrop-filter
        if (cs.backdropFilter && cs.backdropFilter !== 'none') {
          // Check inline or computed webkit prefix
          const webkitVal = cs.webkitBackdropFilter || cs['-webkit-backdrop-filter'];
          if (!webkitVal || webkitVal === 'none') {
            missingBackdropPrefix++;
            if (missingBackdropPrefix === 1) {
              results.push({
                id: 'missing-webkit-backdrop',
                category: CATEGORIES.OBSERVED_LAYOUT_ISSUE,
                severity: 'warning',
                title: 'Missing -webkit-backdrop-filter Prefix',
                target: `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}`,
                description: 'Safari and iOS WebKit require the -webkit-backdrop-filter prefix for frosted glass and backdrop blur effects to render.',
                recommendation: 'Add -webkit-backdrop-filter alongside backdrop-filter in your CSS rules.'
              });
            }
          }
        }

        // C. Form inputs with font-size < 16px (Mobile Typography / iOS Auto-Zoom)
        if (['input', 'select', 'textarea'].includes(el.tagName.toLowerCase())) {
          const fontSize = parseFloat(cs.fontSize);
          if (fontSize && fontSize < 16 && smallInputs < 2) {
            smallInputs++;
            results.push({
              id: `font-size-zoom-${smallInputs}`,
              category: CATEGORIES.POTENTIAL_COMPATIBILITY,
              severity: 'info',
              title: 'Form Input Font Size < 16px (iOS Auto-Zoom Trigger)',
              target: `${el.tagName.toLowerCase()}[type="${el.getAttribute('type') || 'text'}"]`,
              description: `Input font-size is ${fontSize}px. iOS Safari automatically zooms in on focused inputs when the font size is less than 16px, causing awkward viewport shifting.`,
              recommendation: 'Set font-size: 16px (or 1rem) on inputs for mobile viewports, or scale via transform if visual size must remain small.'
            });
          }
        }

        // D. Flexbox item min-width: 0 (Flex Sizing Issue)
        if (cs.display === 'flex' || cs.display === 'inline-flex') {
          for (const child of Array.from(el.children)) {
            const ccs = window.getComputedStyle(child);
            if (ccs.minWidth === 'auto' && (ccs.overflow === 'hidden' || ccs.textOverflow === 'ellipsis') && flexShrinkCount < 2) {
              flexShrinkCount++;
              results.push({
                id: `flex-shrink-${flexShrinkCount}`,
                category: CATEGORIES.OBSERVED_LAYOUT_ISSUE,
                severity: 'warning',
                title: 'Flex Child Missing min-width: 0',
                target: `${child.tagName.toLowerCase()}${child.className && typeof child.className === 'string' ? '.' + child.className.split(' ')[0] : ''}`,
                description: 'Flex items default to min-width: auto in CSS specification. On WebKit, flex items with truncating text or images may refuse to shrink, causing layout blowouts.',
                recommendation: 'Add min-width: 0 to the flex child element to allow proper shrinking in Safari.'
              });
            }
          }
        }

        // E. 100vh usage (Potential Compatibility Issue)
        if ((cs.height && cs.height.includes('100vh')) || (cs.minHeight && cs.minHeight.includes('100vh'))) {
          vhCount++;
          if (vhCount === 1) {
            results.push({
              id: 'vh-viewport-issue',
              category: CATEGORIES.POTENTIAL_COMPATIBILITY,
              severity: 'info',
              title: 'Use of 100vh Instead of Dynamic Viewport Units (dvh)',
              description: '100vh does not account for the collapsible navigation bars in mobile Safari, frequently pushing bottom action buttons off-screen.',
              recommendation: 'Use min-height: 100dvh; or fallback: min-height: 100vh; min-height: 100dvh;'
            });
          }
        }
      }

      // 4. Safe Area Insets (Requires Real Device Verification)
      const hasFixed = allElements.some(el => {
        const p = window.getComputedStyle(el).position;
        return p === 'fixed' || p === 'sticky';
      });

      if (hasFixed) {
        results.push({
          id: 'safe-area-notch',
          category: CATEGORIES.REQUIRES_DEVICE_VERIFY,
          severity: 'info',
          title: 'Fixed Elements & iOS Safe Area Insets',
          description: 'Fixed headers, navbars, or bottom bars may overlap the iPhone notch, home bar indicator, or Dynamic Island on real iOS hardware.',
          recommendation: 'Ensure your containers use env(safe-area-inset-top) and env(safe-area-inset-bottom), and viewport-fit=cover in your viewport meta tag.'
        });
      }

      // 5. Touch Action / Gesture Verification (Requires Real Device Verification)
      results.push({
        id: 'ios-gestures',
        category: CATEGORIES.REQUIRES_DEVICE_VERIFY,
        severity: 'info',
        title: 'iOS Rubber-Banding and Edge Swipe Navigation',
        description: 'Real iOS Safari features native horizontal edge gestures (back/forward navigation) and rubber-band overscroll that cannot be fully replicated in synthetic headless browsers.',
        recommendation: 'Verify swipeable carousels and edge drawers on actual iPhone hardware or via the Real iPhone Testing tab.'
      });

      return results;
    });

    return findings;
  } catch (err) {
    console.error('[SafariInspector] Error evaluating diagnostics:', err);
    return [];
  }
}

module.exports = {
  runSafariDiagnostics
};
