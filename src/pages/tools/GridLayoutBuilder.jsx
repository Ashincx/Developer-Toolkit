import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { Copy, RefreshCw, Check, Plus, Trash2, LayoutGrid, Layout } from 'lucide-react';
import { useToolHistory } from '../../hooks/useToolHistory';
import './GridLayoutBuilder.css';

const defaultState = {
  columns: 3,
  rows: 3,
  gap: 16,
  items: [
    { id: 1, colSpan: 1, rowSpan: 1 },
    { id: 2, colSpan: 2, rowSpan: 1 },
    { id: 3, colSpan: 1, rowSpan: 2 },
    { id: 4, colSpan: 2, rowSpan: 2 },
  ],
  selectedItem: null
};

const GridLayoutBuilder = () => {
  const { state, setState, undo, redo, canUndo, canRedo } = useToolHistory(defaultState);
  const [copiedCSS, setCopiedCSS] = useState(false);
  const [copiedHTML, setCopiedHTML] = useState(false);

  const handleReset = () => setState(defaultState);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setState({
      ...state,
      [name]: type === 'range' || type === 'number' ? Number(value) : value
    });
  };

  const handleItemChange = (e) => {
    if (!state.selectedItem) return;
    const { name, value } = e.target;
    const newItems = state.items.map(item => {
      if (item.id === state.selectedItem) {
        return { ...item, [name]: Number(value) };
      }
      return item;
    });
    setState({ ...state, items: newItems });
  };

  const addItem = () => {
    const newItem = { id: Date.now(), colSpan: 1, rowSpan: 1 };
    setState({
      ...state,
      items: [...state.items, newItem],
      selectedItem: newItem.id
    });
  };

  const removeItem = (id) => {
    const newItems = state.items.filter(item => item.id !== id);
    setState({
      ...state,
      items: newItems,
      selectedItem: state.selectedItem === id ? null : state.selectedItem
    });
  };

  const getCSS = () => {
    let css = `.grid-container {\n  display: grid;\n  grid-template-columns: repeat(${state.columns}, 1fr);\n  grid-template-rows: repeat(${state.rows}, 1fr);\n  gap: ${state.gap}px;\n}\n\n`;
    
    state.items.forEach((item, index) => {
      if (item.colSpan > 1 || item.rowSpan > 1) {
        css += `.item-${index + 1} {\n`;
        if (item.colSpan > 1) css += `  grid-column: span ${item.colSpan};\n`;
        if (item.rowSpan > 1) css += `  grid-row: span ${item.rowSpan};\n`;
        css += `}\n\n`;
      }
    });

    return css.trim();
  };

  const getHTML = () => {
    let html = `<div class="grid-container">\n`;
    state.items.forEach((item, index) => {
      const classes = [];
      if (item.colSpan > 1 || item.rowSpan > 1) classes.push(`item-${index + 1}`);
      const classAttr = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';
      html += `  <div${classAttr}>Item ${index + 1}</div>\n`;
    });
    html += `</div>`;
    return html;
  };

  const cssString = getCSS();
  const htmlString = getHTML();

  const copyToClipboard = (text, setCopied) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedItemData = state.items.find(i => i.id === state.selectedItem);

  return (
    <ToolLayout 
      id="grid-builder" 
      title="Grid Layout Builder" 
      description="Visually construct CSS Grid layouts and generate the required boilerplate code."
      onUndo={undo}
      onRedo={redo}
      canUndo={canUndo}
      canRedo={canRedo}
      onReset={handleReset}
    >
      <div className="grid-builder">
        
        <div className="generator-sidebar">
          
          <div className="controls-header">
            <h3>Container Properties</h3>
          </div>

          <div className="control-group">
            <div className="control-header">
              <label>Columns</label>
              <span>{state.columns}</span>
            </div>
            <input type="range" name="columns" min="1" max="12" value={state.columns} onChange={handleChange} />
          </div>

          <div className="control-group">
            <div className="control-header">
              <label>Rows</label>
              <span>{state.rows}</span>
            </div>
            <input type="range" name="rows" min="1" max="12" value={state.rows} onChange={handleChange} />
          </div>

          <div className="control-group">
            <div className="control-header">
              <label>Gap</label>
              <span>{state.gap}px</span>
            </div>
            <input type="range" name="gap" min="0" max="100" value={state.gap} onChange={handleChange} />
          </div>

          <div className="controls-header" style={{ marginTop: '2rem' }}>
            <h3>Item Properties</h3>
            <button onClick={addItem} className="btn btn-outline reset-btn">
              <Plus size={14} /> Add Item
            </button>
          </div>

          {!selectedItemData ? (
            <div className="empty-selection">
              <LayoutGrid size={32} />
              <p>Select an item in the grid to edit its properties.</p>
            </div>
          ) : (
            <div className="item-properties">
              <div className="item-properties-header">
                <span className="badge">Item {state.items.findIndex(i => i.id === state.selectedItem) + 1}</span>
                <button 
                  onClick={() => removeItem(state.selectedItem)}
                  className="delete-layer-btn"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="control-group">
                <div className="control-header">
                  <label>Column Span</label>
                  <span>{selectedItemData.colSpan}</span>
                </div>
                <input type="range" name="colSpan" min="1" max={state.columns} value={selectedItemData.colSpan} onChange={handleItemChange} />
              </div>

              <div className="control-group">
                <div className="control-header">
                  <label>Row Span</label>
                  <span>{selectedItemData.rowSpan}</span>
                </div>
                <input type="range" name="rowSpan" min="1" max={state.rows} value={selectedItemData.rowSpan} onChange={handleItemChange} />
              </div>
            </div>
          )}

        </div>

        <div className="generator-preview-area">
          <div className="preview-container grid-preview-container">
            <div 
              className="grid-stage"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${state.columns}, 1fr)`,
                gridTemplateRows: `repeat(${state.rows}, 1fr)`,
                gap: `${state.gap}px`,
              }}
            >
              {state.items.map((item, index) => (
                <div 
                  key={item.id}
                  className={`grid-item ${state.selectedItem === item.id ? 'selected' : ''}`}
                  onClick={() => setState({ ...state, selectedItem: item.id })}
                  style={{
                    gridColumn: `span ${item.colSpan}`,
                    gridRow: `span ${item.rowSpan}`,
                  }}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          </div>
          
          <div className="code-output-group">
            <div className="code-output">
              <div className="code-header">
                <span>CSS</span>
                <button onClick={() => copyToClipboard(cssString, setCopiedCSS)} className="copy-btn">
                  {copiedCSS ? <Check size={16} /> : <Copy size={16} />}
                  {copiedCSS ? 'Copied!' : 'Copy CSS'}
                </button>
              </div>
              <pre><code>{cssString}</code></pre>
            </div>

            <div className="code-output">
              <div className="code-header">
                <span>HTML</span>
                <button onClick={() => copyToClipboard(htmlString, setCopiedHTML)} className="copy-btn">
                  {copiedHTML ? <Check size={16} /> : <Copy size={16} />}
                  {copiedHTML ? 'Copied!' : 'Copy HTML'}
                </button>
              </div>
              <pre><code>{htmlString}</code></pre>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export default GridLayoutBuilder;
