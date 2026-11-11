import { useState, useEffect, useRef } from 'react';
import {
  ChevronRight,
  ChevronDown,
  RefreshCw,
  MousePointer,
  Search,
  X,
  Crosshair,
  Code2
} from 'lucide-react';

// Recursively find all ancestor selectors for a given target element in the DOM tree
function findAncestorsInTree(root, targetSel, targetEl, path = []) {
  if (!root) return [];
  const currentPath = [...path, root.selector];
  const isMatch = (targetSel && root.selector === targetSel) ||
    (targetEl &&
     root.tag === targetEl.tag &&
     root.id === targetEl.id &&
     root.className === targetEl.className &&
     root.rect && targetEl.rect &&
     Math.abs(root.rect.x - targetEl.rect.x) <= 2 &&
     Math.abs(root.rect.y - targetEl.rect.y) <= 2);

  if (isMatch) {
    return currentPath;
  }

  if (root.children && root.children.length > 0) {
    for (const child of root.children) {
      const res = findAncestorsInTree(child, targetSel, targetEl, currentPath);
      if (res.length > 0) return res;
    }
  }
  return [];
}

function DomTreeNode({
  node,
  selectedSelector,
  selectedElement,
  onSelect,
  expandedMap,
  toggleExpand,
  depth = 0,
  searchQuery = ''
}) {
  const lineRef = useRef(null);
  if (!node) return null;

  const isSelected = Boolean(
    (selectedSelector && node.selector === selectedSelector) ||
    (selectedElement && (
      node.selector === selectedElement.selector ||
      (
        node.tag === selectedElement.tag &&
        node.id === selectedElement.id &&
        node.className === selectedElement.className &&
        node.rect && selectedElement.rect &&
        Math.abs(node.rect.x - selectedElement.rect.x) <= 2 &&
        Math.abs(node.rect.y - selectedElement.rect.y) <= 2
      )
    ))
  );

  const isExpanded = Boolean(expandedMap[node.selector]);
  const hasChildren = node.hasChildren && node.children && node.children.length > 0;

  // Auto-scroll this line into view when selected
  useEffect(() => {
    if (isSelected && lineRef.current) {
      lineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  }, [isSelected]);

  // Filter match check
  const matchesSearch = searchQuery
    ? (node.tag.includes(searchQuery) ||
       (node.className && node.className.toLowerCase().includes(searchQuery.toLowerCase())) ||
       (node.id && node.id.toLowerCase().includes(searchQuery.toLowerCase())))
    : true;

  // Render attributes like Chrome DevTools: class, id, onclick, href, src, etc.
  const renderAttributes = () => {
    if (!node.attributes) {
      return (
        <>
          {node.id && (
            <span className="devtools-attr">
              {' '}<span className="attr-name">id</span>=<span className="attr-quote">"</span><span className="attr-val">{node.id}</span><span className="attr-quote">"</span>
            </span>
          )}
          {node.className && (
            <span className="devtools-attr">
              {' '}<span className="attr-name">class</span>=<span className="attr-quote">"</span><span className="attr-val">{node.className}</span><span className="attr-quote">"</span>
            </span>
          )}
        </>
      );
    }

    // Sort so class and id are first, like real DevTools
    const entries = Object.entries(node.attributes);
    const sorted = entries.sort(([a], [b]) => {
      if (a === 'id') return -1;
      if (b === 'id') return 1;
      if (a === 'class') return -1;
      if (b === 'class') return 1;
      return 0;
    });

    return sorted.map(([k, v]) => {
      const valSnippet = v.length > 50 ? v.slice(0, 48) + '...' : v;
      return (
        <span key={k} className="devtools-attr">
          {' '}<span className="attr-name">{k}</span>=<span className="attr-quote">"</span><span className="attr-val">{valSnippet}</span><span className="attr-quote">"</span>
        </span>
      );
    });
  };

  return (
    <div className={`dom-tree-row-wrapper ${matchesSearch ? '' : 'faded'}`} style={{ paddingLeft: `${depth * 14}px` }}>
      <div
        ref={isSelected ? lineRef : null}
        className={`dom-tree-line ${isSelected ? 'selected' : ''}`}
        onClick={() => onSelect(node.selector)}
      >
        {/* Expand / Collapse triangle */}
        {hasChildren ? (
          <button
            type="button"
            className="btn-tree-toggle"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(node.selector);
            }}
          >
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <span className="tree-leaf-spacer" />
        )}

        {/* Opening Tag */}
        <span className="tag-bracket">&lt;</span>
        <span className="tag-name">{node.tag}</span>

        {/* Tag Attributes */}
        {renderAttributes()}

        {/* Flex / Grid badge */}
        {node.displayType && (
          <span className={`devtools-badge ${node.displayType}-badge`}>
            {node.displayType}
          </span>
        )}

        {/* Closing Tag or Collapsed preview */}
        {hasChildren ? (
          isExpanded ? (
            <span className="tag-bracket">&gt;</span>
          ) : (
            <>
              <span className="tag-bracket">&gt;</span>
              <span className="tree-ellipsis">...</span>
              <span className="tag-bracket">&lt;/</span>
              <span className="tag-name">{node.tag}</span>
              <span className="tag-bracket">&gt;</span>
            </>
          )
        ) : node.textContent ? (
          <>
            <span className="tag-bracket">&gt;</span>
            <span className="tree-text-content">{node.textContent}</span>
            <span className="tag-bracket">&lt;/</span>
            <span className="tag-name">{node.tag}</span>
            <span className="tag-bracket">&gt;</span>
          </>
        ) : (
          <>
            <span className="tag-bracket">&gt;&lt;/</span>
            <span className="tag-name">{node.tag}</span>
            <span className="tag-bracket">&gt;</span>
          </>
        )}

        {/* DevTools $0 indicator on selected element */}
        {isSelected && (
          <span className="devtools-selected-marker"> == $0</span>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="dom-tree-children">
          {node.children.map((child, idx) => (
            <DomTreeNode
              key={`${child.selector || child.tag}-${idx}`}
              node={child}
              selectedSelector={selectedSelector}
              selectedElement={selectedElement}
              onSelect={onSelect}
              expandedMap={expandedMap}
              toggleExpand={toggleExpand}
              depth={depth + 1}
              searchQuery={searchQuery}
            />
          ))}

          {/* Explicit closing tag row for expanded parents */}
          <div className="dom-tree-line closing-line">
            <span className="tree-leaf-spacer" />
            <span className="tag-bracket">&lt;/</span>
            <span className="tag-name">{node.tag}</span>
            <span className="tag-bracket">&gt;</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ElementsPanel({
  selectedElement,
  domTree,
  onSelectSelector,
  onRequestDomTree,
  isInspectMode,
  onToggleInspect
}) {
  const [expandedMap, setExpandedMap] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const treeContainerRef = useRef(null);

  // Initialize root nodes as expanded
  useEffect(() => {
    if (domTree) {
      setExpandedMap(prev => {
        const next = { ...prev };
        next[domTree.selector || 'body'] = true;
        if (domTree.children) {
          domTree.children.forEach(c => {
            next[c.selector] = true;
          });
        }
        return next;
      });
    }
  }, [domTree]);

  // When selectedElement changes, expand all ancestors in the hierarchy and in the DOM tree!
  useEffect(() => {
    if (selectedElement) {
      setExpandedMap(prev => {
        const next = { ...prev };
        // 1. Hierarchy chain
        if (selectedElement.hierarchy) {
          selectedElement.hierarchy.forEach(item => {
            if (item.selector) {
              next[item.selector] = true;
            }
          });
        }
        if (selectedElement.selector) {
          next[selectedElement.selector] = true;
        }

        // 2. Tree path traversal
        if (domTree) {
          const treeAncestors = findAncestorsInTree(domTree, selectedElement.selector, selectedElement);
          treeAncestors.forEach(sel => {
            if (sel) next[sel] = true;
          });
        }

        return next;
      });
    }
  }, [selectedElement, domTree]);

  // Smooth scroll container to center the selected element
  useEffect(() => {
    if (selectedElement && treeContainerRef.current) {
      const timer = setTimeout(() => {
        if (!treeContainerRef.current) return;
        const selectedRow = treeContainerRef.current.querySelector('.dom-tree-line.selected');
        if (selectedRow) {
          selectedRow.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedElement, domTree, expandedMap]);

  const toggleExpand = (selector) => {
    setExpandedMap(prev => ({
      ...prev,
      [selector]: !prev[selector]
    }));
  };

  const handleLocateSelected = () => {
    if (!treeContainerRef.current) return;
    const selectedRow = treeContainerRef.current.querySelector('.dom-tree-line.selected');
    if (selectedRow) {
      selectedRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      onRequestDomTree(12, selectedElement?.selector);
    }
  };

  return (
    <div className="devtools-elements-panel">
      {/* Top Toolbar: Pick Element, Search Filter, Refresh */}
      <div className="devtools-panel-toolbar">
        <button
          type="button"
          onClick={onToggleInspect}
          className={`btn-toolbar-tool ${isInspectMode ? 'active' : ''}`}
          title="Pick an element on the screen to inspect (Ctrl+Shift+C)"
        >
          <MousePointer size={13} />
          <span>{isInspectMode ? 'Inspecting...' : 'Pick'}</span>
        </button>

        <div className="tree-search-bar">
          <Search size={12} className="search-icon" />
          <input
            type="text"
            placeholder="Search tags, classes, IDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-tree-search"
          />
          {searchQuery && (
            <button
              type="button"
              className="btn-clear-search"
              onClick={() => setSearchQuery('')}
            >
              <X size={11} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => onRequestDomTree(10, selectedElement?.selector)}
          className="btn-toolbar-tool"
          title="Reload DOM Tree (depth: 10)"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {/* Prominent Active Inspected Element Structure Strip */}
      {selectedElement && (
        <div className="inspected-html-badge-strip">
          <div className="html-badge-left">
            <span className="html-badge-pill">
              <Code2 size={11} />
              <span>HTML</span>
            </span>
            <div className="html-code-preview" title={selectedElement.outerHTMLSnippet || selectedElement.selector}>
              <span className="tag-bracket">&lt;</span>
              <span className="tag-name">{selectedElement.tag}</span>
              {selectedElement.id && (
                <span className="devtools-attr">
                  {' '}<span className="attr-name">id</span>="<span className="attr-val">{selectedElement.id}</span>"
                </span>
              )}
              {selectedElement.className && (
                <span className="devtools-attr">
                  {' '}<span className="attr-name">class</span>="<span className="attr-val">{selectedElement.className}</span>"
                </span>
              )}
              <span className="tag-bracket">&gt;</span>
              <span className="devtools-selected-marker"> == $0</span>
            </div>
          </div>

          <button
            type="button"
            className="btn-reveal-tree"
            onClick={handleLocateSelected}
            title="Center element in DOM structure tree below"
          >
            <Crosshair size={11} />
            <span>Locate</span>
          </button>
        </div>
      )}

      {/* DOM Structure Tree */}
      <div className="devtools-tree-scroll" ref={treeContainerRef}>
        {domTree ? (
          <div className="devtools-tree-content">
            <DomTreeNode
              node={domTree}
              selectedSelector={selectedElement ? selectedElement.selector : null}
              selectedElement={selectedElement}
              onSelect={onSelectSelector}
              expandedMap={expandedMap}
              toggleExpand={toggleExpand}
              searchQuery={searchQuery}
            />
          </div>
        ) : selectedElement ? (
          <div className="devtools-tree-fallback">
            <div className="selected-element-preview">
              <span className="tag-bracket">&lt;</span>
              <span className="tag-name">{selectedElement.tag}</span>
              {selectedElement.id && (
                <span className="devtools-attr">
                  {' '}<span className="attr-name">id</span>="<span className="attr-val">{selectedElement.id}</span>"
                </span>
              )}
              {selectedElement.className && (
                <span className="devtools-attr">
                  {' '}<span className="attr-name">class</span>="<span className="attr-val">{selectedElement.className}</span>"
                </span>
              )}
              <span className="tag-bracket">&gt;</span>
              {selectedElement.outerHTMLSnippet && (
                <div className="outerhtml-block">
                  <code>{selectedElement.outerHTMLSnippet}</code>
                </div>
              )}
              <span className="devtools-selected-marker"> == $0</span>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-mini"
              style={{ marginTop: '0.75rem' }}
              onClick={() => onRequestDomTree(10, selectedElement.selector)}
            >
              <RefreshCw size={12} />
              <span>Load Full HTML Tree</span>
            </button>
          </div>
        ) : (
          <div className="devtools-tree-empty">
            <MousePointer size={20} className="muted-icon" />
            <p>Click "Pick" or click an element on the live preview to inspect its HTML structure.</p>
          </div>
        )}
      </div>

      {/* DevTools DOM Breadcrumbs Footer Bar */}
      <div className="devtools-breadcrumbs-footer">
        {selectedElement && selectedElement.hierarchy && selectedElement.hierarchy.length > 0 ? (
          <div className="breadcrumbs-list">
            {selectedElement.hierarchy.map((crumb, idx) => (
              <span
                key={idx}
                className={`breadcrumb-item ${crumb.selector === selectedElement.selector ? 'current' : ''}`}
                onClick={() => onSelectSelector(crumb.selector)}
                title={crumb.selector}
              >
                <span className="crumb-tag">{crumb.tag}</span>
                {crumb.id && <span className="crumb-id">#{crumb.id}</span>}
                {crumb.className && (
                  <span className="crumb-class">.{crumb.className.split(/\s+/)[0]}</span>
                )}
                {idx < selectedElement.hierarchy.length - 1 && (
                  <span className="crumb-separator">&gt;</span>
                )}
              </span>
            ))}
          </div>
        ) : (
          <div className="breadcrumbs-empty">No element selected</div>
        )}
      </div>
    </div>
  );
}
