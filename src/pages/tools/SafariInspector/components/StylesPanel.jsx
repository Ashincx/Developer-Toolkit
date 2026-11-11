import { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  RotateCcw,
  Plus,
  Search,
  CheckSquare,
  Square,
  Sparkles
} from 'lucide-react';

export default function StylesPanel({
  selectedElement,
  styleOverrides = [],
  onApplyStyle,
  onResetStyles,
  cssExport
}) {
  const [activeTab, setActiveTab] = useState('styles'); // 'styles' | 'computed' | 'boxmodel'
  const [stylesFilter, setStylesFilter] = useState('');
  const [computedSearch, setComputedSearch] = useState('');
  const [showHov, setShowHov] = useState(false);
  const [showCls, setShowCls] = useState(false);
  const [newClass, setNewClass] = useState('');
  const [copied, setCopied] = useState(false);

  // New property inputs for element.style
  const [newProp, setNewProp] = useState('');
  const [newVal, setNewVal] = useState('');

  // Disabled properties map: { [key: `${selector}-${prop}`]: boolean }
  const [disabledProps, setDisabledProps] = useState({});

  const targetSelector = selectedElement ? selectedElement.selector : 'body';

  const handleAddInlineRule = (e) => {
    e.preventDefault();
    if (!newProp.trim() || !newVal.trim()) return;
    onApplyStyle(targetSelector, newProp.trim(), newVal.trim());
    setNewProp('');
    setNewVal('');
  };

  const handleToggleProp = (selector, property, originalValue) => {
    const key = `${selector}-${property}`;
    const isCurrentlyDisabled = Boolean(disabledProps[key]);

    if (isCurrentlyDisabled) {
      // Re-enable
      setDisabledProps(prev => ({ ...prev, [key]: false }));
      onApplyStyle(selector, property, originalValue);
    } else {
      // Disable by overriding with unset or initial
      setDisabledProps(prev => ({ ...prev, [key]: true }));
      onApplyStyle(selector, property, 'unset');
    }
  };

  const handleCopyCss = () => {
    const textToCopy = cssExport || '/* No overrides */';
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const boxModel = selectedElement ? selectedElement.boxModel : {
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    border: { top: 0, right: 0, bottom: 0, left: 0 },
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    content: { width: 0, height: 0 }
  };

  const computedStyles = selectedElement ? selectedElement.computedStyles || {} : {};

  // Filtered computed styles
  const filteredComputed = useMemo(() => {
    return Object.entries(computedStyles).filter(([k]) =>
      k.toLowerCase().includes(computedSearch.toLowerCase())
    );
  }, [computedStyles, computedSearch]);

  // Extract or synthesize matched rules
  const matchedRules = useMemo(() => {
    if (selectedElement && selectedElement.matchedRules && selectedElement.matchedRules.length > 0) {
      if (!stylesFilter) return selectedElement.matchedRules;
      const q = stylesFilter.toLowerCase();
      return selectedElement.matchedRules.filter(r =>
        r.selector.toLowerCase().includes(q) ||
        (r.media && r.media.toLowerCase().includes(q)) ||
        r.declarations.some(d => d.property.toLowerCase().includes(q) || d.value.toLowerCase().includes(q))
      );
    }

    // Fallback: Group computed styles into simulated rule groups if no external stylesheet rules are loaded
    if (!selectedElement) return [];

    const cs = selectedElement.computedStyles || {};
    const fallbackRules = [];

    // Layout rule
    if (cs.display || cs.position) {
      fallbackRules.push({
        selector: selectedElement.selector || selectedElement.tag,
        media: '',
        source: 'user agent',
        declarations: [
          { property: 'display', value: cs.display || 'block', disabled: false },
          { property: 'position', value: cs.position || 'static', disabled: false },
          cs.flexDirection ? { property: 'flex-direction', value: cs.flexDirection, disabled: false } : null,
          cs.justifyContent ? { property: 'justify-content', value: cs.justifyContent, disabled: false } : null,
          cs.alignItems ? { property: 'align-items', value: cs.alignItems, disabled: false } : null
        ].filter(Boolean)
      });
    }

    // Dimensions & Box rule
    if (cs.width || cs.height || cs.minWidth) {
      fallbackRules.push({
        selector: selectedElement.selector || selectedElement.tag,
        media: '',
        source: 'computed styles',
        declarations: [
          { property: 'width', value: cs.width || 'auto', disabled: false },
          { property: 'height', value: cs.height || 'auto', disabled: false },
          { property: 'min-width', value: cs.minWidth || '0px', disabled: false },
          { property: 'max-width', value: cs.maxWidth || 'none', disabled: false }
        ]
      });
    }

    // Typography & Colors
    if (cs.color || cs.fontSize) {
      fallbackRules.push({
        selector: selectedElement.selector || selectedElement.tag,
        media: '',
        source: 'stylesheet',
        declarations: [
          { property: 'color', value: cs.color || '#000', disabled: false },
          { property: 'font-size', value: cs.fontSize || '14px', disabled: false },
          { property: 'font-weight', value: cs.fontWeight || '400', disabled: false },
          { property: 'line-height', value: cs.lineHeight || 'normal', disabled: false },
          { property: 'text-align', value: cs.textAlign || 'left', disabled: false }
        ]
      });
    }

    return fallbackRules;
  }, [selectedElement, stylesFilter]);

  return (
    <div className="devtools-styles-panel">
      {/* DevTools Sub-tabs: Styles | Computed | Box Model */}
      <div className="devtools-subtab-strip">
        <button
          type="button"
          className={`subtab-item ${activeTab === 'styles' ? 'active' : ''}`}
          onClick={() => setActiveTab('styles')}
        >
          Styles
        </button>
        <button
          type="button"
          className={`subtab-item ${activeTab === 'computed' ? 'active' : ''}`}
          onClick={() => setActiveTab('computed')}
        >
          Computed
        </button>
        <button
          type="button"
          className={`subtab-item ${activeTab === 'boxmodel' ? 'active' : ''}`}
          onClick={() => setActiveTab('boxmodel')}
        >
          Box Model
        </button>
      </div>

      {/* TAB 1: STYLES RULES VIEW */}
      {activeTab === 'styles' && (
        <div className="devtools-styles-scroll">
          {/* Filter Bar: Filter input, :hov, .cls, + */}
          <div className="devtools-filter-bar">
            <div className="filter-input-wrap">
              <input
                type="text"
                placeholder="Filter"
                value={stylesFilter}
                onChange={(e) => setStylesFilter(e.target.value)}
                className="input-filter-rules"
              />
            </div>

            <button
              type="button"
              className={`btn-filter-toggle ${showHov ? 'active' : ''}`}
              onClick={() => setShowHov(!showHov)}
              title="Toggle pseudo-class states (:hover, :active)"
            >
              :hov
            </button>

            <button
              type="button"
              className={`btn-filter-toggle ${showCls ? 'active' : ''}`}
              onClick={() => setShowCls(!showCls)}
              title="Toggle element classes"
            >
              .cls
            </button>
          </div>

          {/* Forced State Toggles Bar (:hov) */}
          {showHov && (
            <div className="pseudo-states-drawer">
              <span className="pseudo-title">Force element state:</span>
              <div className="pseudo-checkboxes">
                <label className="pseudo-chk">
                  <input type="checkbox" onChange={(e) => onApplyStyle(targetSelector, ':hover', e.target.checked)} />
                  <span>:hover</span>
                </label>
                <label className="pseudo-chk">
                  <input type="checkbox" onChange={(e) => onApplyStyle(targetSelector, ':active', e.target.checked)} />
                  <span>:active</span>
                </label>
                <label className="pseudo-chk">
                  <input type="checkbox" onChange={(e) => onApplyStyle(targetSelector, ':focus', e.target.checked)} />
                  <span>:focus</span>
                </label>
              </div>
            </div>
          )}

          {/* Element Class Toggles Bar (.cls) */}
          {showCls && selectedElement && (
            <div className="classes-drawer">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newClass.trim()) return;
                  const currentClasses = selectedElement.className || '';
                  const updated = `${currentClasses} ${newClass.trim()}`.trim();
                  onApplyStyle(targetSelector, 'class', updated);
                  setNewClass('');
                }}
                className="add-class-form"
              >
                <input
                  type="text"
                  placeholder="Add new class (e.g. active)"
                  value={newClass}
                  onChange={(e) => setNewClass(e.target.value)}
                  className="input input-mini"
                />
                <button type="submit" className="btn btn-mini btn-primary">Add</button>
              </form>
            </div>
          )}

          {/* RULE 1: element.style { ... } */}
          <div className="devtools-rule-card element-style-card">
            <div className="rule-header">
              <span className="rule-selector">element.style {'{'}</span>
            </div>

            <div className="rule-body">
              {/* Active overrides on element */}
              {styleOverrides
                .filter(o => o.selector === targetSelector)
                .map((override, oIdx) => (
                  Object.entries(override.rules).map(([p, v]) => (
                    <div key={`${oIdx}-${p}`} className="declaration-line is-override">
                      <span className="decl-check-spacer">
                        <CheckSquare size={11} className="chk-active" />
                      </span>
                      <span className="decl-prop">{p}</span>
                      <span className="decl-sep">:</span>
                      <span className="decl-val">{v}</span>
                      <span className="decl-semi">;</span>
                    </div>
                  ))
                ))}

              {/* Add property inline inputs */}
              <form onSubmit={handleAddInlineRule} className="inline-add-decl-row">
                <span className="decl-check-spacer">
                  <Plus size={11} className="muted-icon" />
                </span>
                <input
                  type="text"
                  placeholder="property"
                  value={newProp}
                  onChange={(e) => setNewProp(e.target.value)}
                  className="input-inline-prop"
                />
                <span className="decl-sep">:</span>
                <input
                  type="text"
                  placeholder="value"
                  value={newVal}
                  onChange={(e) => setNewVal(e.target.value)}
                  className="input-inline-val"
                />
                <span className="decl-semi">;</span>
                <button type="submit" className="btn-add-decl" title="Apply property">
                  <Plus size={12} />
                </button>
              </form>
            </div>

            <div className="rule-footer">
              <span className="rule-selector">{'}'}</span>
            </div>
          </div>

          {/* RULE CARDS: Matched CSS Rules from Stylesheets with @media */}
          {matchedRules.map((rule, rIdx) => {
            const hasMedia = Boolean(rule.media);

            return (
              <div key={rIdx} className="devtools-rule-card">
                {/* Media query header if present */}
                {hasMedia && (
                  <div className="media-query-header">
                    <span className="media-keyword">@media </span>
                    <span className="media-query-text">{rule.media}</span>
                    <span className="media-bracket"> {'{'}</span>
                  </div>
                )}

                {/* Rule selector & source link */}
                <div className="rule-header" style={{ paddingLeft: hasMedia ? '12px' : '0' }}>
                  <span className="rule-selector">{rule.selector} {'{'}</span>
                  {rule.source && (
                    <span className="rule-source" title={rule.source}>
                      {rule.source}
                    </span>
                  )}
                </div>

                {/* Declarations */}
                <div className="rule-body" style={{ paddingLeft: hasMedia ? '20px' : '8px' }}>
                  {rule.declarations.map((decl, dIdx) => {
                    const isDisabled = Boolean(disabledProps[`${rule.selector}-${decl.property}`]);

                    return (
                      <div
                        key={dIdx}
                        className={`declaration-line ${isDisabled ? 'disabled' : ''}`}
                      >
                        <button
                          type="button"
                          className="btn-decl-checkbox"
                          onClick={() => handleToggleProp(rule.selector, decl.property, decl.value)}
                          title={isDisabled ? 'Enable property' : 'Disable property'}
                        >
                          {isDisabled ? (
                            <Square size={12} className="chk-disabled" />
                          ) : (
                            <CheckSquare size={12} className="chk-active" />
                          )}
                        </button>

                        <span className="decl-prop">{decl.property}</span>
                        <span className="decl-sep">: </span>
                        <span className="decl-val">{decl.value}</span>
                        {decl.priority && (
                          <span className="decl-priority"> {decl.priority}</span>
                        )}
                        <span className="decl-semi">;</span>
                      </div>
                    );
                  })}
                </div>

                {/* Closing braces */}
                <div className="rule-footer" style={{ paddingLeft: hasMedia ? '12px' : '0' }}>
                  <span className="rule-selector">{'}'}</span>
                </div>
                {hasMedia && (
                  <div className="media-query-footer">
                    <span className="media-bracket">{'}'}</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Quick Presets for Mobile / WebKit Fixes */}
          <div className="mobile-fix-presets">
            <span className="presets-title">
              <Sparkles size={12} />
              <span>Mobile Presets:</span>
            </span>
            <div className="presets-chips">
              <button
                type="button"
                className="chip-btn"
                onClick={() => onApplyStyle(targetSelector, 'min-width', '0')}
                title="Fix flexbox blowout in WebKit"
              >
                min-width: 0
              </button>
              <button
                type="button"
                className="chip-btn"
                onClick={() => onApplyStyle(targetSelector, 'overflow-wrap', 'anywhere')}
                title="Prevent text overflow in mobile Safari"
              >
                overflow-wrap
              </button>
              <button
                type="button"
                className="chip-btn"
                onClick={() => onApplyStyle(targetSelector, '-webkit-backdrop-filter', 'blur(10px)')}
                title="Add iOS blur backdrop support"
              >
                -webkit-backdrop
              </button>
              <button
                type="button"
                className="chip-btn"
                onClick={() => onApplyStyle(targetSelector, 'width', 'fit-content')}
                title="Fit content"
              >
                width: fit-content
              </button>
            </div>
          </div>

          {/* Footer: Copy CSS / Reset */}
          <div className="devtools-styles-footer">
            <button
              type="button"
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={handleCopyCss}
              disabled={styleOverrides.length === 0}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied CSS!' : 'Copy CSS Changes'}</span>
            </button>

            {styleOverrides.length > 0 && (
              <button
                type="button"
                onClick={onResetStyles}
                className="btn btn-outline"
                title="Reset session style overrides"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: COMPUTED STYLES VIEW */}
      {activeTab === 'computed' && (
        <div className="devtools-computed-scroll">
          <div className="computed-search-bar">
            <Search size={12} className="search-icon" />
            <input
              type="text"
              placeholder="Filter computed properties..."
              value={computedSearch}
              onChange={(e) => setComputedSearch(e.target.value)}
              className="input-computed-search"
            />
          </div>

          <div className="computed-list">
            {filteredComputed.length === 0 ? (
              <div className="computed-empty">No properties match "{computedSearch}"</div>
            ) : (
              filteredComputed.map(([prop, val]) => (
                <div key={prop} className="computed-row">
                  <span className="computed-prop">{prop}</span>
                  <span className="computed-sep">:</span>
                  <span className="computed-val">{val || 'initial'}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BOX MODEL VIEW */}
      {activeTab === 'boxmodel' && (
        <div className="devtools-boxmodel-scroll">
          <div className="box-model-diagram">
            {/* Margin Box */}
            <div className="box-layer margin-layer">
              <span className="layer-tag">margin</span>
              <span className="val-top">{boxModel.margin.top}</span>
              <span className="val-right">{boxModel.margin.right}</span>
              <span className="val-bottom">{boxModel.margin.bottom}</span>
              <span className="val-left">{boxModel.margin.left}</span>

              {/* Border Box */}
              <div className="box-layer border-layer">
                <span className="layer-tag">border</span>
                <span className="val-top">{boxModel.border.top}</span>
                <span className="val-right">{boxModel.border.right}</span>
                <span className="val-bottom">{boxModel.border.bottom}</span>
                <span className="val-left">{boxModel.border.left}</span>

                {/* Padding Box */}
                <div className="box-layer padding-layer">
                  <span className="layer-tag">padding</span>
                  <span className="val-top">{boxModel.padding.top}</span>
                  <span className="val-right">{boxModel.padding.right}</span>
                  <span className="val-bottom">{boxModel.padding.bottom}</span>
                  <span className="val-left">{boxModel.padding.left}</span>

                  {/* Content Box */}
                  <div className="box-layer content-layer">
                    <span className="content-dimensions">
                      {boxModel.content.width} × {boxModel.content.height}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
