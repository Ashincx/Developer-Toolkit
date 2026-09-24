import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import './CodeDiffChecker.css';

const CodeDiffChecker = () => {
  const [originalCode, setOriginalCode] = useState('');
  const [modifiedCode, setModifiedCode] = useState('');
  const [diffResult, setDiffResult] = useState([]);
  const [isComparing, setIsComparing] = useState(false);
  const [viewMode, setViewMode] = useState('split'); // 'split' or 'unified'

  const computeDiff = () => {
    if (!originalCode && !modifiedCode) {
      setDiffResult([]);
      setIsComparing(true);
      return;
    }

    const lines1 = originalCode.split('\n');
    const lines2 = modifiedCode.split('\n');
    
    // Create DP matrix for LCS (Longest Common Subsequence)
    const dp = Array(lines1.length + 1).fill(null).map(() => Array(lines2.length + 1).fill(0));
    for (let i = 1; i <= lines1.length; i++) {
      for (let j = 1; j <= lines2.length; j++) {
        if (lines1[i - 1] === lines2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    const result = [];
    let i = lines1.length;
    let j = lines2.length;
    let origLineNum = lines1.length;
    let modLineNum = lines2.length;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && lines1[i - 1] === lines2[j - 1]) {
        result.unshift({
          left: { type: 'unchanged', value: lines1[i - 1], lineNum: origLineNum },
          right: { type: 'unchanged', value: lines2[j - 1], lineNum: modLineNum }
        });
        i--;
        j--;
        origLineNum--;
        modLineNum--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        result.unshift({
          left: { type: 'empty', value: ' ', lineNum: null },
          right: { type: 'added', value: lines2[j - 1], lineNum: modLineNum }
        });
        j--;
        modLineNum--;
      } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
        result.unshift({
          left: { type: 'removed', value: lines1[i - 1], lineNum: origLineNum },
          right: { type: 'empty', value: ' ', lineNum: null }
        });
        i--;
        origLineNum--;
      }
    }

    setDiffResult(result);
    setIsComparing(true);
  };

  const insertExample = () => {
    setOriginalCode(`function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}`);
    setModifiedCode(`function calculateTotal(items) {
  // Use reduce for cleaner code
  return items.reduce((total, item) => {
    return total + item.price;
  }, 0);
}`);
    setIsComparing(false);
  };

  const clearFields = () => {
    setOriginalCode('');
    setModifiedCode('');
    setIsComparing(false);
  };

  return (
    <div className="diff-checker-container">
      <div className="diff-checker-header">
        <div className="diff-checker-header-content">
          <h2>Code Difference Checker</h2>
          <p>Compare two text blocks side-by-side, exactly like diffchecker.com.</p>
        </div>
        
        <div className="diff-checker-controls">
          <button className="btn btn-outline" onClick={clearFields}>
            <Icons.Trash2 size={16} />
            Clear
          </button>
          {!isComparing && (
            <button className="btn btn-outline" onClick={insertExample}>
              <Icons.Wand2 size={16} />
              Example
            </button>
          )}
          
          {isComparing ? (
            <button className="btn btn-primary" onClick={() => setIsComparing(false)}>
              <Icons.Edit2 size={16} />
              Edit Text
            </button>
          ) : (
            <button className="btn btn-primary" onClick={computeDiff}>
              <Icons.GitCompare size={16} />
              Find Difference
            </button>
          )}
        </div>
      </div>

      {isComparing && (
        <div className="view-mode-toggles diff-view-tabs">
          <button 
            className={`view-toggle ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => setViewMode('split')}
          >
            Split View
          </button>
          <button 
            className={`view-toggle ${viewMode === 'unified' ? 'active' : ''}`}
            onClick={() => setViewMode('unified')}
          >
            Unified View
          </button>
        </div>
      )}

      {!isComparing ? (
        <div className="diff-checker-workspace">
          <div className="editor-pane input-pane">
            <div className="pane-header">
              <h3>Original Text</h3>
            </div>
            <textarea
              className="code-editor input"
              value={originalCode}
              onChange={(e) => setOriginalCode(e.target.value)}
              placeholder="Paste original text here..."
              spellCheck="false"
            />
          </div>

          <div className="editor-pane input-pane">
            <div className="pane-header">
              <h3>Modified Text</h3>
            </div>
            <textarea
              className="code-editor input"
              value={modifiedCode}
              onChange={(e) => setModifiedCode(e.target.value)}
              placeholder="Paste modified text here..."
              spellCheck="false"
            />
          </div>
        </div>
      ) : (
        <div className="diff-result-section">
           <div className="diff-output-container">
              {diffResult.length === 0 ? (
                <p className="empty-state">No differences found. The texts are identical.</p>
              ) : viewMode === 'split' ? (
                <div className="diff-split-view">
                  <div className="diff-split-header">
                    <div className="split-half">Original Text</div>
                    <div className="split-half">Modified Text</div>
                  </div>
                  {diffResult.map((row, idx) => (
                    <div className="diff-row" key={idx}>
                      <div className={`diff-cell left ${row.left.type}`}>
                         <div className="line-num">{row.left.lineNum || ''}</div>
                         <div className="line-code">
                           <span className="line-marker">
                             {row.left.type === 'removed' ? '-' : row.left.type === 'added' ? '+' : ' '}
                           </span>
                           {row.left.value || ' '}
                         </div>
                      </div>
                      <div className={`diff-cell right ${row.right.type}`}>
                         <div className="line-num">{row.right.lineNum || ''}</div>
                         <div className="line-code">
                           <span className="line-marker">
                             {row.right.type === 'removed' ? '-' : row.right.type === 'added' ? '+' : ' '}
                           </span>
                           {row.right.value || ' '}
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="diff-unified-view">
                  {diffResult.map((row, idx) => {
                    const elements = [];
                    if (row.left.type === 'removed') {
                       elements.push(
                         <div className="diff-unified-row removed" key={`del-${idx}`}>
                           <div className="line-nums">
                              <span className="line-num">{row.left.lineNum}</span>
                              <span className="line-num"></span>
                           </div>
                           <div className="line-code">
                             <span className="line-marker">-</span>
                             {row.left.value || ' '}
                           </div>
                         </div>
                       );
                    }
                    if (row.right.type === 'added') {
                       elements.push(
                         <div className="diff-unified-row added" key={`add-${idx}`}>
                           <div className="line-nums">
                              <span className="line-num"></span>
                              <span className="line-num">{row.right.lineNum}</span>
                           </div>
                           <div className="line-code">
                             <span className="line-marker">+</span>
                             {row.right.value || ' '}
                           </div>
                         </div>
                       );
                    }
                    if (row.left.type === 'unchanged' && row.right.type === 'unchanged') {
                       elements.push(
                         <div className="diff-unified-row unchanged" key={`unchanged-${idx}`}>
                           <div className="line-nums">
                              <span className="line-num">{row.left.lineNum}</span>
                              <span className="line-num">{row.right.lineNum}</span>
                           </div>
                           <div className="line-code">
                             <span className="line-marker"> </span>
                             {row.left.value || ' '}
                           </div>
                         </div>
                       );
                    }
                    return elements;
                  })}
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default CodeDiffChecker;
