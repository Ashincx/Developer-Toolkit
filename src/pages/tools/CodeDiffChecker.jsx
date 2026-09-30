import { useMemo, useRef, useState } from 'react';
import { ArrowDownUp, Check, ChevronDown, Clipboard, Code2, Columns2, CornerDownRight, RotateCcw, Sparkles } from 'lucide-react';
import { compareLines, createPatch, splitLines } from '../../utils/codeDiff';
import './CodeDiffChecker.css';

const exampleOriginal = `function formatPrice(amount) {
  const currency = "USD";
  const rounded = amount.toFixed(2);
  return currency + " " + rounded;
}

export default formatPrice;`;

const exampleUpdated = `function formatPrice(amount, currency = "USD") {
  const rounded = Number(amount).toFixed(2);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(rounded);
}

export default formatPrice;`;

function highlightedText(text, other) {
  if (other === undefined || text === other) return text || ' ';
  let start = 0;
  let end = 0;
  while (start < text.length && start < other.length && text[start] === other[start]) start++;
  while (end < text.length - start && end < other.length - start && text[text.length - 1 - end] === other[other.length - 1 - end]) end++;
  const middle = text.slice(start, text.length - end || undefined);
  return <>{text.slice(0, start)}<mark>{middle || ' '}</mark>{end ? text.slice(-end) : ''}</>;
}

function DiffLine({ line, side }) {
  const sign = line.kind === 'add' || (line.kind === 'change' && side === 'right') ? '+' :
    line.kind === 'remove' || (line.kind === 'change' && side === 'left') ? '−' : '';
  return <div className={`cdc-diff-line cdc-${line.kind} cdc-${side}`}>
    <span className="cdc-diff-number" aria-hidden="true">{line.number ?? ''}</span>
    <span className="cdc-diff-sign" aria-hidden="true">{sign}</span>
    <code className="cdc-diff-code">{line.kind === 'change' ? highlightedText(line.text, line.other) : line.text || ' '}</code>
  </div>;
}

function CodeEditor({ title, value, onChange }) {
  const gutterRef = useRef(null);
  const lineCount = Math.max(1, splitLines(value).length);
  function handleKeyDown(event) {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    const input = event.currentTarget;
    const position = input.selectionStart;
    onChange(value.slice(0, position) + '  ' + value.slice(input.selectionEnd));
    requestAnimationFrame(() => { input.selectionStart = input.selectionEnd = position + 2; });
  }
  return <section className="cdc-editor" aria-label={`${title} code editor`}>
    <div className="cdc-editor-head">
      <div className="cdc-editor-title">
        <span className={`cdc-version-icon ${title === 'Original' ? 'cdc-old' : 'cdc-new'}`}>{title === 'Original' ? 'A' : 'B'}</span>
        <strong>{title}</strong><span className="cdc-editor-subtitle">{title === 'Original' ? 'Before' : 'After'}</span>
      </div>
      <span className="cdc-line-count">{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
    </div>
    <div className="cdc-editor-body">
      <div className="cdc-gutter" ref={gutterRef} aria-hidden="true">
        {Array.from({ length: lineCount }, (_, index) => <div key={index}>{index + 1}</div>)}
      </div>
      <textarea
        aria-label={`${title} code`}
        spellCheck={false}
        value={value}
        placeholder={`Paste ${title.toLowerCase()} code here…`}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={(event) => { if (gutterRef.current) gutterRef.current.scrollTop = event.currentTarget.scrollTop; }}
      />
    </div>
  </section>;
}

export default function CodeDiffChecker() {
  const [original, setOriginal] = useState(exampleOriginal);
  const [updated, setUpdated] = useState(exampleUpdated);
  const [compared, setCompared] = useState({ original: exampleOriginal, updated: exampleUpdated });
  const [view, setView] = useState('split');
  const [copied, setCopied] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const diff = useMemo(() => compareLines(compared.original, compared.updated), [compared]);
  const dirty = original !== compared.original || updated !== compared.updated;
  const hasContent = Boolean(compared.original || compared.updated);
  const total = diff.additions + diff.removals + diff.changes;

  function compare() {
    setCompared({ original, updated });
    setCopied(false);
  }
  function reset() {
    setOriginal('');
    setUpdated('');
    setCompared({ original: '', updated: '' });
    setCopied(false);
  }
  function loadExample() {
    setOriginal(exampleOriginal);
    setUpdated(exampleUpdated);
    setCompared({ original: exampleOriginal, updated: exampleUpdated });
    setCopied(false);
  }
  async function copyResult() {
    try {
      const patch = createPatch(compared.original, compared.updated);
      await navigator.clipboard.writeText(patch);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return <div className="cdc" onKeyDown={(event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      compare();
    }
  }}>
    <div className="cdc-heading">
      <div>
        <p className="cdc-eyebrow">CODE TOOLS <span>/</span> COMPARISON</p>
        <h1>Code Difference Checker</h1>
        <p className="cdc-intro">Compare two versions of code and spot every change.</p>
      </div>
      <button className="cdc-help" onClick={() => setShowTips(!showTips)} aria-expanded={showTips}>
        How it works <ChevronDown size={16} className={showTips ? 'cdc-up' : ''} />
      </button>
    </div>
    {showTips && <div className="cdc-tip"><Sparkles size={18} /><span>Paste each version, then select <b>Compare code</b>. Your code stays in this browser tab. Use <b>Ctrl/⌘ + Enter</b> to compare quickly.</span></div>}

    <div className="cdc-section-label"><span className="cdc-section-index">01</span><span>YOUR CODE</span><span className="cdc-section-rule" /></div>
    <div className="cdc-editors">
      <CodeEditor title="Original" value={original} onChange={setOriginal} />
      <CodeEditor title="Updated" value={updated} onChange={setUpdated} />
    </div>
    <div className="cdc-action-row">
      <span className="cdc-privacy"><span>●</span> Compared locally in your browser</span>
      <div className="cdc-actions">
        <button className="cdc-button cdc-secondary" onClick={loadExample}><Code2 size={16} /> Example</button>
        <button className="cdc-button cdc-secondary" onClick={reset}><RotateCcw size={16} /> Reset</button>
        <button className="cdc-button cdc-primary" onClick={compare}><ArrowDownUp size={17} /> Compare code</button>
      </div>
    </div>

    <div className="cdc-section-label"><span className="cdc-section-index">02</span><span>DIFFERENCES</span><span className="cdc-section-rule" /></div>
    <section className="cdc-results" aria-label="Comparison results">
      <div className="cdc-results-toolbar">
        <div className="cdc-results-title"><h2>Comparison result</h2><span className={`cdc-state ${dirty ? 'cdc-pending' : ''}`}>{dirty ? 'Edits not compared' : hasContent ? 'Up to date' : 'Ready to compare'}</span></div>
        <div className="cdc-result-controls">
          <div className="cdc-view-switch" role="group" aria-label="Comparison view">
            <button aria-pressed={view === 'split'} className={view === 'split' ? 'cdc-active' : ''} onClick={() => setView('split')}><Columns2 size={16} /> Side by side</button>
            <button aria-pressed={view === 'inline'} className={view === 'inline' ? 'cdc-active' : ''} onClick={() => setView('inline')}><CornerDownRight size={16} /> Inline</button>
          </div>
          <span className="cdc-control-divider" />
          <button className="cdc-copy" disabled={!hasContent || dirty} onClick={copyResult}>{copied ? <Check size={16} /> : <Clipboard size={16} />}{copied ? 'Copied' : 'Copy diff'}</button>
        </div>
      </div>
      {hasContent ? <>
        <div className="cdc-stats" aria-live="polite">
          <span className="cdc-stat cdc-stat-added"><b>+{diff.additions}</b> added</span>
          <span className="cdc-stat cdc-stat-removed"><b>−{diff.removals}</b> removed</span>
          <span className="cdc-stat cdc-stat-changed"><b>~{diff.changes}</b> changed</span>
          <span className="cdc-stat-summary">{total === 0 ? 'Both versions are identical' : `${total} ${total === 1 ? 'change' : 'changes'} found`}</span>
        </div>
        <div className="cdc-diff-scroll">
          {view === 'split' ? <div className="cdc-split-view">
            <div className="cdc-column-head"><span>ORIGINAL</span><span>UPDATED</span></div>
            {diff.rows.map((row, index) => <div className="cdc-split-row" key={index}><DiffLine line={row.left} side="left" /><DiffLine line={row.right} side="right" /></div>)}
          </div> : <div className="cdc-inline-view">
            <div className="cdc-inline-head">ORIGINAL → UPDATED</div>
            {diff.rows.map((row, index) => <div key={index}>{row.left.kind === 'same' ? <DiffLine line={row.left} side="left" /> : <>
              {row.left.kind !== 'blank' && <DiffLine line={row.left} side="left" />}
              {row.right.kind !== 'blank' && <DiffLine line={row.right} side="right" />}
            </>}</div>)}
          </div>}
        </div>
      </> : <div className="cdc-empty"><div className="cdc-empty-icon"><Code2 size={24} /></div><h3>No comparison yet</h3><p>Paste code in both editors and select Compare code to see the differences.</p></div>}
    </section>
  </div>;
}
