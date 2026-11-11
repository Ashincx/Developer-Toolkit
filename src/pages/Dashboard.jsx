import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTools } from '../context/ToolsContext';
import * as Icons from 'lucide-react';
import { 
  Search, 
  Star, 
  ArrowUpRight, 
  X 
} from 'lucide-react';
import './Dashboard.css';

const CATEGORY_STYLES = {
  'CSS Tools': {
    bg: 'rgba(99, 102, 241, 0.12)',
    gradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
    color: '#6366f1',
    badge: 'CSS'
  },
  'Color & Theme Tools': {
    bg: 'rgba(236, 72, 153, 0.12)',
    gradient: 'linear-gradient(135deg, #ec4899, #f472b6)',
    color: '#ec4899',
    badge: 'Theme'
  },
  'Responsive Tools': {
    bg: 'rgba(14, 165, 233, 0.12)',
    gradient: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
    color: '#0ea5e9',
    badge: 'Responsive'
  },
  'Code Converters': {
    bg: 'rgba(16, 185, 129, 0.12)',
    gradient: 'linear-gradient(135deg, #10b981, #34d399)',
    color: '#10b981',
    badge: 'Code'
  },
  'Icon Tools': {
    bg: 'rgba(139, 92, 246, 0.12)',
    gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
    color: '#8b5cf6',
    badge: 'Icon'
  },
  'Utilities': {
    bg: 'rgba(245, 158, 11, 0.12)',
    gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    color: '#f59e0b',
    badge: 'Utility'
  }
};

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { 
    favorites = [], 
    toggleFavorite, 
    activeTools = [] 
  } = useTools();

  const allCategories = useMemo(() => {
    const cats = Array.from(new Set(activeTools.map(t => t.category)));
    const list = ['All', ...cats];
    if (favorites.length > 0) {
      list.push('Favorites');
    }
    return list;
  }, [activeTools, favorites]);

  const filteredTools = useMemo(() => {
    return activeTools.filter((tool) => {
      const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      if (!matchesSearch) return false;

      if (selectedCategory === 'Favorites') {
        return favorites.includes(tool.id);
      }
      if (selectedCategory === 'All') {
        return true;
      }
      return tool.category === selectedCategory;
    });
  }, [activeTools, searchQuery, selectedCategory, favorites]);

  return (
    <div className="cosmic-dashboard-wrapper">
      {/* Background Cosmic Canvas Orbs & Decorative Elements */}
      <div className="cosmic-bg" aria-hidden="true">
        <div className="cosmic-orb orb-1"></div>
        <div className="cosmic-orb orb-2"></div>
        <div className="cosmic-orb orb-3"></div>
        <div className="cosmic-orb orb-4"></div>
        <div className="cosmic-orb orb-5"></div>
        
        {/* Origami Flying Plane */}
        <div className="cosmic-origami-plane">
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M58 8L6 32L28 36L58 8Z" fill="rgba(255, 255, 255, 0.95)" />
            <path d="M58 8L36 56L28 36L58 8Z" fill="rgba(235, 238, 255, 0.85)" />
            <path d="M28 36L34 46L36 37L28 36Z" fill="rgba(200, 210, 255, 0.7)" />
          </svg>
        </div>

        {/* Ambient Starlight Twinkles */}
        <div className="cosmic-star star-1"></div>
        <div className="cosmic-star star-2"></div>
        <div className="cosmic-star star-3"></div>
        <div className="cosmic-star star-4"></div>
      </div>

      <div className="cosmic-dashboard-inner">
        {/* TOP BAR: Welcome Back Header Card */}
        <header className="cosmic-top-card">
          <div className="top-card-left">
            <div className="top-avatar-wrap">
              <div className="top-avatar">
                <span className="avatar-initials">DEV</span>
              </div>
              <span className="online-indicator" title="All systems operational"></span>
            </div>
            <div className="top-greeting">
              <h2>Welcome Back, Developer!</h2>
              <p>Visual engineering suite • {activeTools.length} visual tools ready</p>
            </div>
          </div>

          <div className="top-card-search-wrap">
            <Search size={16} className="top-search-icon" />
            <input 
              type="text" 
              placeholder="Search tools, converters, generators..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="top-search-input"
            />
            {searchQuery && (
              <button 
                type="button" 
                className="top-search-clear"
                onClick={() => setSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="top-card-actions">
            <div className="top-action-pill" title={`${favorites.length} Pinned Favorites`}>
              <Star size={15} className="star-icon-glow" fill={favorites.length > 0 ? '#f59e0b' : 'none'} color="#f59e0b" />
              <span>{favorites.length}</span>
            </div>
          </div>
        </header>

        {/* MAIN TOOLKIT SECTION */}
        <section className="cosmic-toolkit-section">
          {/* Section Header with Category Tabs */}
          <div className="toolkit-section-header">
            <div className="toolkit-section-title">
              <h3>All Developer Tools</h3>
              <span className="toolkit-count-badge">{filteredTools.length} Available</span>
            </div>

            {/* Filter Tabs */}
            <div className="cosmic-category-tabs">
              {allCategories.map((cat) => {
                const count = cat === 'All' 
                  ? activeTools.length 
                  : cat === 'Favorites' 
                    ? favorites.length 
                    : activeTools.filter(t => t.category === cat).length;

                return (
                  <button
                    key={cat}
                    type="button"
                    className={`cosmic-tab-btn ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat === 'Favorites' && <Star size={13} fill="currentColor" style={{ marginRight: 4 }} />}
                    <span>{cat}</span>
                    <span className="tab-bubble">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tools Grid */}
          {filteredTools.length === 0 ? (
            <div className="cosmic-empty-state">
              <Search size={38} className="empty-search-icon" />
              <h4>No tools matched your search</h4>
              <p>Try searching for a different keyword or reset the category filters.</p>
              <button 
                type="button" 
                className="btn-cosmic-reset"
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="cosmic-tools-grid">
              {filteredTools.map((tool) => {
                const Icon = Icons[tool.icon] || Icons.Wrench;
                const style = CATEGORY_STYLES[tool.category] || {
                  bg: 'rgba(99, 102, 241, 0.1)',
                  color: 'var(--accent-primary)',
                  badge: 'Tool'
                };
                const isFav = favorites.includes(tool.id);

                return (
                  <div key={tool.id} className="cosmic-tool-card-wrap">
                    <Link to={tool.path} className="cosmic-tool-card">
                      <div 
                        className="cosmic-tool-icon" 
                        style={{ background: style.bg, color: style.color }}
                      >
                        <Icon size={22} />
                      </div>

                      <div className="cosmic-tool-content">
                        <h4 className="cosmic-tool-title">{tool.name}</h4>
                        <div className="cosmic-tool-badges">
                          <span 
                            className="cosmic-category-badge"
                            style={{ color: style.color, background: style.bg }}
                          >
                            {style.badge}
                          </span>
                          {tool.status === 'testing' && (
                            <span className="cosmic-testing-badge">
                              🧪 TEST
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="cosmic-tool-action">
                        <ArrowUpRight size={16} />
                      </div>
                    </Link>

                    {/* Star Favorite Button */}
                    <button
                      type="button"
                      className={`cosmic-fav-btn ${isFav ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(tool.id);
                      }}
                      title={isFav ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Star size={14} fill={isFav ? "currentColor" : "none"} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
