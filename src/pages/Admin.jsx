import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTools } from '../context/ToolsContext';
import * as Icons from 'lucide-react';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  FlaskConical, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Search, 
  ExternalLink, 
  Check, 
  Sliders, 
  Layers, 
  Sparkles,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Lock,
  User,
  KeyRound,
  LogOut,
  AlertCircle,
  ArrowRight,
  Key
} from 'lucide-react';
import './Admin.css';

const CATEGORY_COLORS = {
  'CSS Tools': '#6366f1',
  'Color & Theme Tools': '#ec4899',
  'Responsive Tools': '#0ea5e9',
  'Code Converters': '#10b981',
  'Icon Tools': '#8b5cf6',
  'Utilities': '#f59e0b'
};

const Admin = () => {
  const {
    allTools = [],
    activeTools = [],
    testingTools = [],
    hiddenTools = [],
    showTestingInFrontend,
    setShowTestingInFrontend,
    updateToolStatus,
    moveTool,
    setToolOrder,
    addNewTool,
    deleteTool,
    resetToDefaults,
    categories = []
  } = useTools();

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('toolkit_admin_auth') === 'true' || 
           sessionStorage.getItem('toolkit_admin_auth') === 'true';
  });
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  // Tabs and filters state
  const [activeTab, setActiveTab] = useState('visibility'); // 'visibility' | 'sort' | 'testing'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All'); // 'All' | 'active' | 'testing' | 'hidden'
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // New tool form state
  const [newToolName, setNewToolName] = useState('');
  const [newToolPath, setNewToolPath] = useState('');
  const [newToolCategory, setNewToolCategory] = useState(categories[0] || 'Utilities');
  const [newToolIcon, setNewToolIcon] = useState('Wrench');
  const [newToolStatus, setNewToolStatus] = useState('testing');

  // Credentials retrieval
  const getStoredCreds = () => {
    const saved = localStorage.getItem('toolkit_admin_creds');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return { username: 'admin', password: 'admin' };
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');
    const creds = getStoredCreds();

    if (
      loginUsername.trim().toLowerCase() === creds.username.toLowerCase() && 
      loginPassword === creds.password
    ) {
      if (rememberMe) {
        localStorage.setItem('toolkit_admin_auth', 'true');
      } else {
        sessionStorage.setItem('toolkit_admin_auth', 'true');
      }
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid credentials. Check username or password.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('toolkit_admin_auth');
    sessionStorage.removeItem('toolkit_admin_auth');
    setIsAuthenticated(false);
    setLoginUsername('');
    setLoginPassword('');
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!newAdminPassword.trim()) return;
    const creds = getStoredCreds();
    const updated = { ...creds, password: newAdminPassword.trim() };
    localStorage.setItem('toolkit_admin_creds', JSON.stringify(updated));
    setPasswordChangeSuccess(true);
    setTimeout(() => {
      setPasswordChangeSuccess(false);
      setShowChangePasswordModal(false);
      setNewAdminPassword('');
      setShowNewPassword(false);
    }, 1500);
  };

  // Filtered tools for visibility tab
  const filteredTools = useMemo(() => {
    return allTools.filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        tool.path.toLowerCase().includes(searchQuery.toLowerCase().trim());
      if (!matchesSearch) return false;

      if (filterCategory !== 'All' && tool.category !== filterCategory) {
        return false;
      }

      if (filterStatus !== 'All' && tool.status !== filterStatus) {
        return false;
      }

      return true;
    });
  }, [allTools, searchQuery, filterCategory, filterStatus]);

  const handleCreateTool = (e) => {
    e.preventDefault();
    if (!newToolName.trim()) return;

    addNewTool({
      name: newToolName.trim(),
      path: newToolPath.trim() || `/${newToolName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      category: newToolCategory,
      icon: newToolIcon,
      status: newToolStatus
    });

    setNewToolName('');
    setNewToolPath('');
    setShowAddModal(false);
  };

  const handleSortBy = (type) => {
    if (type === 'alpha') {
      const sorted = [...allTools].sort((a, b) => a.name.localeCompare(b.name));
      sorted.forEach((tool, idx) => setToolOrder(tool.id, idx + 1));
    } else if (type === 'category') {
      const sorted = [...allTools].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
      sorted.forEach((tool, idx) => setToolOrder(tool.id, idx + 1));
    }
  };

  // =========================================================================
  // LOGIN SCREEN (Shown if user is not authenticated)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="admin-login-wrapper">
        <div className="admin-login-card">
          <div className="login-shield-badge">
            <Lock size={28} />
          </div>

          <div className="login-header-text">
            <h2>Admin Authentication</h2>
            <p>Protected area. Enter your administrator credentials to access the tool manager.</p>
          </div>

          {loginError && (
            <div className="login-error-banner">
              <AlertCircle size={16} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="admin-login-form">
            <div className="login-form-group">
              <label>Administrator Username</label>
              <div className="login-input-wrap">
                <User size={16} className="login-input-icon" />
                <input 
                  type="text" 
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="e.g. admin" 
                  className="login-input-field"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="login-form-group">
              <label>Administrator Password</label>
              <div className="login-input-wrap">
                <Lock size={16} className="login-input-icon" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter password" 
                  className="login-input-field"
                  autoComplete="current-password"
                  required
                />
                <button 
                  type="button" 
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="login-options-row">
              <label className="login-remember-me">
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)} 
                />
                <span>Remember session</span>
              </label>

              <button 
                type="button" 
                className="login-quick-fill"
                onClick={() => {
                  const creds = getStoredCreds();
                  setLoginUsername(creds.username);
                  setLoginPassword(creds.password);
                }}
                title="Auto-fill default credentials"
              >
                Auto-fill
              </button>
            </div>

            <button type="submit" className="login-submit-btn">
              <span>Unlock Admin Area</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="login-footer-info">
            <div className="login-default-hint">
              <KeyRound size={13} />
              <span>Default: <code>admin</code> / <code>admin</code></span>
            </div>
            <Link to="/" className="login-back-link">
              ← Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ADMIN DASHBOARD (Shown once authenticated)
  // =========================================================================
  return (
    <div className="admin-page">
      {/* Admin Header */}
      <div className="admin-header">
        <div className="admin-header-title-row">
          <div className="admin-icon-badge">
            <Shield size={24} />
          </div>
          <div>
            <h1>Tool Manager & Admin Control</h1>
            <p>Manage frontend visibility, sort display order, and stage new tools in the testing area.</p>
          </div>
        </div>

        <div className="admin-header-actions">
          <button 
            type="button" 
            className="btn btn-secondary admin-btn"
            onClick={() => setShowChangePasswordModal(true)}
            title="Change Admin Password"
          >
            <Key size={15} />
            <span>Change Key</span>
          </button>
          <button 
            type="button" 
            className="btn btn-secondary admin-btn"
            onClick={() => setShowResetConfirm(true)}
          >
            <RotateCcw size={15} />
            <span>Reset Defaults</span>
          </button>
          <button 
            type="button" 
            className="btn btn-primary admin-btn"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            <span>Add New Tool</span>
          </button>
          <button 
            type="button" 
            className="btn btn-secondary admin-btn logout-btn"
            onClick={handleLogout}
            title="Log out of Admin session"
          >
            <LogOut size={15} />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="admin-metrics-grid">
        <div className="metric-card active">
          <div className="metric-icon-wrap" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.12)' }}>
            <Eye size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{activeTools.length}</span>
            <span className="metric-label">Live in Frontend</span>
          </div>
        </div>

        <div className="metric-card testing">
          <div className="metric-icon-wrap" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)' }}>
            <FlaskConical size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{testingTools.length}</span>
            <span className="metric-label">Testing / Staging</span>
          </div>
        </div>

        <div className="metric-card hidden">
          <div className="metric-icon-wrap" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.12)' }}>
            <EyeOff size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{hiddenTools.length}</span>
            <span className="metric-label">Hidden Tools</span>
          </div>
        </div>

        <div className="metric-card total">
          <div className="metric-icon-wrap" style={{ color: '#6366f1', background: 'rgba(99, 102, 241, 0.12)' }}>
            <Layers size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{allTools.length}</span>
            <span className="metric-label">Total Registered</span>
          </div>
        </div>
      </div>

      {/* Global Settings Banner */}
      <div className="admin-banner">
        <div className="banner-left">
          <FlaskConical size={18} className="banner-icon" />
          <div>
            <strong>Frontend Testing Mode:</strong>{' '}
            <span>
              {showTestingInFrontend 
                ? 'Tools marked as "Testing" are visible on the dashboard with a "TEST" badge.' 
                : 'Tools marked as "Testing" are strictly isolated to the Admin Testing Area.'}
            </span>
          </div>
        </div>
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={showTestingInFrontend} 
            onChange={(e) => setShowTestingInFrontend(e.target.checked)} 
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-nav-tabs">
        <button 
          type="button" 
          className={`admin-nav-tab ${activeTab === 'visibility' ? 'active' : ''}`}
          onClick={() => setActiveTab('visibility')}
        >
          <Eye size={16} />
          <span>Tool Visibility & Status ({allTools.length})</span>
        </button>
        <button 
          type="button" 
          className={`admin-nav-tab ${activeTab === 'sort' ? 'active' : ''}`}
          onClick={() => setActiveTab('sort')}
        >
          <ArrowUpDown size={16} />
          <span>Sort & Order Ranking</span>
        </button>
        <button 
          type="button" 
          className={`admin-nav-tab ${activeTab === 'testing' ? 'active' : ''}`}
          onClick={() => setActiveTab('testing')}
        >
          <FlaskConical size={16} />
          <span>Testing Area Sandbox ({testingTools.length})</span>
        </button>
      </div>

      {/* TAB 1: TOOL VISIBILITY & CONTROLS */}
      {activeTab === 'visibility' && (
        <div className="admin-tab-content">
          <div className="admin-filters-row">
            <div className="admin-search-wrapper">
              <Search size={16} className="search-icon" />
              <input 
                type="text" 
                placeholder="Filter tools by name or route..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="admin-search-input"
              />
            </div>

            <div className="admin-filter-selects">
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                className="admin-select"
              >
                <option value="All">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="admin-select"
              >
                <option value="All">All Statuses</option>
                <option value="active">Live in Frontend</option>
                <option value="testing">Testing / Staging</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Rank</th>
                  <th>Tool Name & Route</th>
                  <th>Category</th>
                  <th style={{ width: '280px' }}>Frontend Status</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTools.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-table-cell">
                      No tools matched your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTools.map((tool) => {
                    const Icon = Icons[tool.icon] || Icons.Wrench;
                    const catColor = CATEGORY_COLORS[tool.category] || 'var(--accent-primary)';

                    return (
                      <tr key={tool.id} className={`status-row-${tool.status}`}>
                        <td>
                          <span className="order-pill">#{tool.order}</span>
                        </td>
                        <td>
                          <div className="tool-cell-content">
                            <div className="tool-cell-icon" style={{ color: catColor, background: `${catColor}15` }}>
                              <Icon size={18} />
                            </div>
                            <div className="tool-cell-text">
                              <span className="tool-cell-name">{tool.name}</span>
                              <span className="tool-cell-path">{tool.path}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="category-chip" style={{ color: catColor, borderColor: `${catColor}40` }}>
                            {tool.category}
                          </span>
                        </td>
                        <td>
                          <div className="status-button-group">
                            <button
                              type="button"
                              className={`status-btn active ${tool.status === 'active' ? 'selected' : ''}`}
                              onClick={() => updateToolStatus(tool.id, 'active')}
                              title="Live: Displayed in dashboard and sidebar"
                            >
                              <CheckCircle2 size={13} />
                              <span>Live</span>
                            </button>
                            <button
                              type="button"
                              className={`status-btn testing ${tool.status === 'testing' ? 'selected' : ''}`}
                              onClick={() => updateToolStatus(tool.id, 'testing')}
                              title="Testing: Visible with test badge or inside testing area"
                            >
                              <FlaskConical size={13} />
                              <span>Testing</span>
                            </button>
                            <button
                              type="button"
                              className={`status-btn hidden ${tool.status === 'hidden' ? 'selected' : ''}`}
                              onClick={() => updateToolStatus(tool.id, 'hidden')}
                              title="Hidden: Removed from frontend"
                            >
                              <EyeOff size={13} />
                              <span>Hidden</span>
                            </button>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="table-actions">
                            <Link 
                              to={tool.path} 
                              className="action-btn-link" 
                              title="Launch tool"
                            >
                              <ExternalLink size={15} />
                              <span>Open</span>
                            </Link>
                            {tool.isCustom && (
                              <button 
                                type="button" 
                                className="action-btn-delete"
                                onClick={() => deleteTool(tool.id)}
                                title="Delete custom tool"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SORT & REORDER SECTION */}
      {activeTab === 'sort' && (
        <div className="admin-tab-content">
          <div className="sort-section-header">
            <div>
              <h3>Tool Position & Display Sorting</h3>
              <p>Control exactly which tool stands in which place. The rank order below directly dictates the layout in the Dashboard and Sidebar.</p>
            </div>
            <div className="sort-presets-actions">
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => handleSortBy('alpha')}
              >
                Sort A–Z
              </button>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => handleSortBy('category')}
              >
                Group by Category
              </button>
            </div>
          </div>

          <div className="sort-items-list">
            {allTools.map((tool, idx) => {
              const Icon = Icons[tool.icon] || Icons.Wrench;
              const catColor = CATEGORY_COLORS[tool.category] || 'var(--accent-primary)';
              const isFirst = idx === 0;
              const isLast = idx === allTools.length - 1;

              return (
                <div key={tool.id} className="sort-item-card">
                  <div className="sort-position-badge">
                    <span>#{tool.order}</span>
                  </div>

                  <div className="sort-tool-icon" style={{ color: catColor, background: `${catColor}15` }}>
                    <Icon size={18} />
                  </div>

                  <div className="sort-tool-details">
                    <span className="sort-tool-name">{tool.name}</span>
                    <span className="sort-tool-meta">{tool.category} • {tool.path}</span>
                  </div>

                  <div className="sort-status-indicator">
                    <span className={`status-badge-mini ${tool.status}`}>
                      {tool.status === 'active' ? '● Live' : tool.status === 'testing' ? '🧪 Testing' : '○ Hidden'}
                    </span>
                  </div>

                  {/* Direct Position Input */}
                  <div className="position-input-wrap">
                    <label>Pos:</label>
                    <input 
                      type="number"
                      min="1"
                      max={allTools.length}
                      value={tool.order}
                      onChange={(e) => setToolOrder(tool.id, e.target.value)}
                      className="position-num-input"
                    />
                  </div>

                  {/* Up / Down Move Buttons */}
                  <div className="sort-controls">
                    <button
                      type="button"
                      className="sort-arrow-btn"
                      disabled={isFirst}
                      onClick={() => moveTool(tool.id, 'up')}
                      title="Move up"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      type="button"
                      className="sort-arrow-btn"
                      disabled={isLast}
                      onClick={() => moveTool(tool.id, 'down')}
                      title="Move down"
                    >
                      <ArrowDown size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: TESTING AREA SANDBOX */}
      {activeTab === 'testing' && (
        <div className="admin-tab-content">
          <div className="testing-area-banner">
            <div>
              <h3>🧪 Staging & Testing Area</h3>
              <p>Isolate, preview, and QA experimental tools before releasing them into the public toolkit.</p>
            </div>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={16} />
              <span>Register Tool for Testing</span>
            </button>
          </div>

          <div className="testing-grid">
            {testingTools.length === 0 ? (
              <div className="empty-testing-box">
                <FlaskConical size={40} className="empty-test-icon" />
                <h4>No tools currently in testing</h4>
                <p>You can mark any existing tool as "Testing" from the Visibility tab, or register a new tool prototype below.</p>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setActiveTab('visibility')}
                >
                  Manage Tool Statuses
                </button>
              </div>
            ) : (
              testingTools.map((tool) => {
                const Icon = Icons[tool.icon] || Icons.Wrench;
                const catColor = CATEGORY_COLORS[tool.category] || 'var(--accent-primary)';

                return (
                  <div key={tool.id} className="testing-card">
                    <div className="testing-card-header">
                      <div className="testing-icon-box" style={{ color: catColor, background: `${catColor}15` }}>
                        <Icon size={24} />
                      </div>
                      <span className="testing-badge-pill">BETA STAGING</span>
                    </div>

                    <h4 className="testing-card-title">{tool.name}</h4>
                    <p className="testing-card-path">Route: <code>{tool.path}</code></p>
                    <span className="testing-card-cat">{tool.category}</span>

                    <div className="testing-card-actions">
                      <Link to={tool.path} className="btn btn-primary btn-sm btn-full">
                        <ExternalLink size={14} />
                        <span>Launch & Test</span>
                      </Link>
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm"
                        onClick={() => updateToolStatus(tool.id, 'active')}
                        title="Publish this tool to live frontend"
                      >
                        Publish Live
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Add New Tool Modal */}
      {showAddModal && (
        <div className="admin-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Register New Tool</h3>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTool} className="admin-modal-form">
              <div className="form-group">
                <label>Tool Name</label>
                <input 
                  type="text" 
                  className="control-input"
                  placeholder="e.g. JSON Schema Validator"
                  value={newToolName}
                  onChange={(e) => setNewToolName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Route Path</label>
                <input 
                  type="text" 
                  className="control-input"
                  placeholder="e.g. /json-validator"
                  value={newToolPath}
                  onChange={(e) => setNewToolPath(e.target.value)}
                />
                <span className="form-hint">Path will auto-generate if left empty.</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select 
                    className="control-input"
                    value={newToolCategory}
                    onChange={(e) => setNewToolCategory(e.target.value)}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Initial Status</label>
                  <select 
                    className="control-input"
                    value={newToolStatus}
                    onChange={(e) => setNewToolStatus(e.target.value)}
                  >
                    <option value="testing">🧪 Testing Sandbox</option>
                    <option value="active">🟢 Live in Frontend</option>
                    <option value="hidden">🔴 Hidden / Draft</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Lucide Icon</label>
                <select 
                  className="control-input"
                  value={newToolIcon}
                  onChange={(e) => setNewToolIcon(e.target.value)}
                >
                  <option value="Wrench">Wrench (Default)</option>
                  <option value="Code">Code</option>
                  <option value="FileCode">FileCode</option>
                  <option value="Sparkles">Sparkles</option>
                  <option value="Palette">Palette</option>
                  <option value="Terminal">Terminal</option>
                  <option value="Database">Database</option>
                  <option value="Boxes">Boxes</option>
                  <option value="Sliders">Sliders</option>
                </select>
              </div>

              <div className="admin-modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Create Tool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="admin-modal-overlay" onClick={() => { setShowChangePasswordModal(false); setShowNewPassword(false); }}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Change Admin Password</h3>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => { setShowChangePasswordModal(false); setShowNewPassword(false); }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="admin-modal-form">
              <div className="form-group">
                <label>New Administrator Password</label>
                <div className="password-input-wrapper">
                  <input 
                    type={showNewPassword ? 'text' : 'password'} 
                    className="control-input password-input-field"
                    placeholder="Enter new password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    className="modal-password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                    title={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span className="form-hint">This key will be required on future admin logins.</span>
              </div>

              {passwordChangeSuccess && (
                <div className="password-success-badge">
                  <Check size={14} /> Password updated successfully!
                </div>
              )}

              <div className="admin-modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => { setShowChangePasswordModal(false); setShowNewPassword(false); }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="admin-modal-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="admin-modal-card confirm-card" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Reset Tool Settings?</h3>
            </div>
            <p className="confirm-text">
              This will restore all default tools to the "Live" state and revert the sort order back to its initial positions.
            </p>
            <div className="admin-modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowResetConfirm(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-danger"
                onClick={() => {
                  resetToDefaults();
                  setShowResetConfirm(false);
                }}
              >
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
