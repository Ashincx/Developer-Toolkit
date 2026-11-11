import { useState } from 'react';
import {
  Trash2,
  Search,
  AlertCircle,
  AlertTriangle,
  Info,
  Terminal,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

export default function ConsolePanel({ logs = [], onClear }) {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'error' | 'warn' | 'log'
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStacks, setExpandedStacks] = useState({});

  const toggleStack = (id) => {
    setExpandedStacks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredLogs = logs.filter((log) => {
    if (filterType === 'error' && log.type !== 'error') return false;
    if (filterType === 'warn' && log.type !== 'warn') return false;
    if (filterType === 'log' && !['log', 'info', 'debug'].includes(log.type)) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const inText = log.text && log.text.toLowerCase().includes(q);
      const inUrl = log.location && log.location.url && log.location.url.toLowerCase().includes(q);
      return inText || inUrl;
    }
    return true;
  });

  const getLogIcon = (type) => {
    switch (type) {
      case 'error':
        return <AlertCircle size={14} className="console-icon-error" />;
      case 'warn':
        return <AlertTriangle size={14} className="console-icon-warn" />;
      case 'info':
      case 'log':
      default:
        return <Info size={14} className="console-icon-info" />;
    }
  };

  return (
    <div className="console-panel">
      {/* Console Top Toolbar */}
      <div className="console-toolbar">
        <button
          type="button"
          onClick={onClear}
          className="btn-console-icon"
          title="Clear console"
        >
          <Trash2 size={13} />
        </button>

        <div className="console-filter-pills">
          <button
            type="button"
            className={`pill-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All ({logs.length})
          </button>
          <button
            type="button"
            className={`pill-btn pill-error ${filterType === 'error' ? 'active' : ''}`}
            onClick={() => setFilterType('error')}
          >
            Errors ({logs.filter(l => l.type === 'error').length})
          </button>
          <button
            type="button"
            className={`pill-btn pill-warn ${filterType === 'warn' ? 'active' : ''}`}
            onClick={() => setFilterType('warn')}
          >
            Warnings ({logs.filter(l => l.type === 'warn').length})
          </button>
          <button
            type="button"
            className={`pill-btn ${filterType === 'log' ? 'active' : ''}`}
            onClick={() => setFilterType('log')}
          >
            Logs
          </button>
        </div>

        <div className="console-search-wrapper">
          <Search size={13} className="search-icon" />
          <input
            type="text"
            placeholder="Filter logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="console-search-input"
          />
        </div>
      </div>

      {/* Logs Stream List */}
      <div className="console-logs-list">
        {filteredLogs.length === 0 ? (
          <div className="console-empty">
            <Terminal size={20} className="muted-icon" />
            <span>{logs.length === 0 ? 'No console messages recorded.' : 'No messages match filter.'}</span>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className={`console-entry entry-${log.type}`}>
              <div className="entry-main">
                <span className="entry-icon">{getLogIcon(log.type)}</span>
                <span className="entry-text">{log.text}</span>

                {log.location && log.location.url && (
                  <span className="entry-location" title={log.location.url}>
                    {log.location.url.split('/').pop() || 'script'}:{log.location.lineNumber}
                  </span>
                )}
              </div>

              {log.stack && (
                <div className="entry-stack-area">
                  <button
                    type="button"
                    className="btn-stack-toggle"
                    onClick={() => toggleStack(log.id)}
                  >
                    {expandedStacks[log.id] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    <span>Stack Trace</span>
                  </button>

                  {expandedStacks[log.id] && (
                    <pre className="stack-trace-code">{log.stack}</pre>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
