import { useState } from 'react';
import {
  Trash2,
  Search,
  Activity,
  ArrowDownUp,
  X,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function NetworkPanel({ requests = [], onClear }) {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'fetch' | 'js' | 'css' | 'img' | 'failed'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const filteredRequests = requests.filter((req) => {
    if (filterType === 'failed' && req.status !== 'failed' && (req.statusCode || 0) < 400) return false;
    if (filterType === 'fetch' && !['xhr', 'fetch'].includes(req.resourceType)) return false;
    if (filterType === 'js' && req.resourceType !== 'script') return false;
    if (filterType === 'css' && req.resourceType !== 'stylesheet') return false;
    if (filterType === 'img' && req.resourceType !== 'image') return false;

    if (searchTerm.trim()) {
      return req.url && req.url.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const getFileName = (fullUrl) => {
    try {
      const parsed = new URL(fullUrl);
      const parts = parsed.pathname.split('/');
      return parts.pop() || parsed.hostname;
    } catch (e) {
      return fullUrl;
    }
  };

  const getStatusClass = (req) => {
    if (req.status === 'failed') return 'status-failed';
    const code = req.statusCode;
    if (!code) return 'status-pending';
    if (code >= 200 && code < 300) return 'status-2xx';
    if (code >= 300 && code < 400) return 'status-3xx';
    if (code >= 400) return 'status-4xx';
    return '';
  };

  return (
    <div className="network-panel">
      {/* Network Toolbar */}
      <div className="network-toolbar">
        <button
          type="button"
          onClick={onClear}
          className="btn-network-icon"
          title="Clear network log"
        >
          <Trash2 size={13} />
        </button>

        <div className="network-filter-pills">
          <button
            type="button"
            className={`pill-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All ({requests.length})
          </button>
          <button
            type="button"
            className={`pill-btn ${filterType === 'fetch' ? 'active' : ''}`}
            onClick={() => setFilterType('fetch')}
          >
            Fetch/XHR
          </button>
          <button
            type="button"
            className={`pill-btn ${filterType === 'js' ? 'active' : ''}`}
            onClick={() => setFilterType('js')}
          >
            JS
          </button>
          <button
            type="button"
            className={`pill-btn ${filterType === 'css' ? 'active' : ''}`}
            onClick={() => setFilterType('css')}
          >
            CSS
          </button>
          <button
            type="button"
            className={`pill-btn ${filterType === 'img' ? 'active' : ''}`}
            onClick={() => setFilterType('img')}
          >
            Img
          </button>
          <button
            type="button"
            className={`pill-btn pill-error ${filterType === 'failed' ? 'active' : ''}`}
            onClick={() => setFilterType('failed')}
          >
            Failed ({requests.filter(r => r.status === 'failed' || (r.statusCode || 0) >= 400).length})
          </button>
        </div>

        <div className="network-search-wrapper">
          <Search size={13} className="search-icon" />
          <input
            type="text"
            placeholder="Filter URLs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="network-search-input"
          />
        </div>
      </div>

      {/* Network Content: Table + Inspector Details */}
      <div className="network-body-layout">
        <div className="network-table-scroll">
          <table className="network-table">
            <thead>
              <tr>
                <th className="col-name">Name</th>
                <th className="col-status">Status</th>
                <th className="col-method">Method</th>
                <th className="col-type">Type</th>
                <th className="col-time">Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-empty">
                    {requests.length === 0 ? 'No network requests recorded yet.' : 'No requests match filter.'}
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    className={`network-row ${selectedRequest?.id === req.id ? 'row-selected' : ''}`}
                    onClick={() => setSelectedRequest(req)}
                  >
                    <td className="col-name" title={req.url}>
                      <span className="file-name">{getFileName(req.url)}</span>
                      <span className="file-url-sub">{req.url}</span>
                    </td>
                    <td className={`col-status ${getStatusClass(req)}`}>
                      {req.status === 'failed' ? 'Failed' : req.statusCode || 'Pending'}
                    </td>
                    <td className="col-method">{req.method}</td>
                    <td className="col-type">{req.resourceType || '-'}</td>
                    <td className="col-time">
                      {req.duration !== undefined ? `${req.duration} ms` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Selected Request Detail Drawer */}
        {selectedRequest && (
          <div className="request-detail-drawer">
            <div className="drawer-header">
              <span className="drawer-title">Request Details</span>
              <button
                type="button"
                className="btn-drawer-close"
                onClick={() => setSelectedRequest(null)}
              >
                <X size={14} />
              </button>
            </div>

            <div className="drawer-body">
              <div className="detail-section">
                <span className="sec-heading">General</span>
                <div className="info-line">
                  <span className="lbl">Request URL:</span>
                  <span className="val url-break">{selectedRequest.url}</span>
                </div>
                <div className="info-line">
                  <span className="lbl">Request Method:</span>
                  <span className="val">{selectedRequest.method}</span>
                </div>
                <div className="info-line">
                  <span className="lbl">Status Code:</span>
                  <span className={`val ${getStatusClass(selectedRequest)}`}>
                    {selectedRequest.status === 'failed'
                      ? `Failed (${selectedRequest.failureText || 'Network Error'})`
                      : `${selectedRequest.statusCode || ''} ${selectedRequest.statusText || ''}`}
                  </span>
                </div>
                {selectedRequest.duration !== undefined && (
                  <div className="info-line">
                    <span className="lbl">Duration:</span>
                    <span className="val">{selectedRequest.duration} ms</span>
                  </div>
                )}
              </div>

              {selectedRequest.responseHeaders && Object.keys(selectedRequest.responseHeaders).length > 0 && (
                <div className="detail-section">
                  <span className="sec-heading">Response Headers</span>
                  {Object.entries(selectedRequest.responseHeaders).map(([k, v]) => (
                    <div key={k} className="header-entry">
                      <span className="hdr-key">{k}:</span>
                      <span className="hdr-val">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedRequest.headers && Object.keys(selectedRequest.headers).length > 0 && (
                <div className="detail-section">
                  <span className="sec-heading">Request Headers (Sanitized)</span>
                  {Object.entries(selectedRequest.headers).map(([k, v]) => (
                    <div key={k} className="header-entry">
                      <span className="hdr-key">{k}:</span>
                      <span className="hdr-val">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
