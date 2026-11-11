class StyleEditor {
  constructor(page) {
    this.page = page;
    // Map of selector -> { property: value, ... }
    this.overrides = new Map();
  }

  setPage(page) {
    this.page = page;
  }

  async applyOverride(selector, property, value) {
    if (!selector || !property) return;

    if (!this.overrides.has(selector)) {
      this.overrides.set(selector, {});
    }

    const rules = this.overrides.get(selector);
    rules[property] = value;

    await this.syncToPage();
    return this.getOverridesList();
  }

  async removeOverride(selector, property) {
    if (!this.overrides.has(selector)) return;

    const rules = this.overrides.get(selector);
    delete rules[property];

    if (Object.keys(rules).length === 0) {
      this.overrides.delete(selector);
    }

    await this.syncToPage();
    return this.getOverridesList();
  }

  async resetOverrides() {
    this.overrides.clear();
    await this.syncToPage();
    return [];
  }

  getOverridesList() {
    const list = [];
    for (const [selector, rules] of this.overrides.entries()) {
      list.push({
        selector,
        rules: { ...rules }
      });
    }
    return list;
  }

  generateCssSnippet() {
    if (this.overrides.size === 0) return '/* No CSS overrides applied */';

    const blocks = ['/* Safari Inspector Studio - CSS Fixes */'];
    for (const [selector, rules] of this.overrides.entries()) {
      const decls = Object.entries(rules)
        .map(([prop, val]) => `  ${prop}: ${val} !important;`)
        .join('\n');
      blocks.push(`${selector} {\n${decls}\n}`);
    }

    return blocks.join('\n\n');
  }

  async syncToPage() {
    if (!this.page) return;

    const cssString = Array.from(this.overrides.entries())
      .map(([sel, rules]) => {
        const decls = Object.entries(rules)
          .map(([prop, val]) => `${prop}: ${val} !important;`)
          .join(' ');
        return `${sel} { ${decls} }`;
      })
      .join('\n');

    try {
      await this.page.evaluate((css) => {
        const styleId = '__safari_inspector_overrides__';
        let styleTag = document.getElementById(styleId);
        if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.id = styleId;
          document.head.appendChild(styleTag);
        }
        styleTag.textContent = css;
      }, cssString);
    } catch (err) {
      console.error('[SafariInspector] Error syncing style overrides to page:', err);
    }
  }
}

module.exports = StyleEditor;
