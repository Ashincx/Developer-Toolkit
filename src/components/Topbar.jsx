import { Search, Moon, Sun, Command, Lightbulb, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';
import './Topbar.css';

const Topbar = () => {
  const { theme, toggleTheme } = useTheme();
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestion, setSuggestion] = useState('');

  const handleSendSuggestion = () => {
    if (!suggestion.trim()) return;
    const mailtoUrl = `mailto:ashincmanoj@gmail.com?subject=${encodeURIComponent('Frontend Toolkit Feature Suggestion')}&body=${encodeURIComponent(suggestion)}`;
    window.location.href = mailtoUrl;
    setShowSuggestModal(false);
    setSuggestion('');
  };

  return (
    <header className="topbar">
      <div className="search-container">
        <Search className="search-icon" size={18} />
        <input 
          type="text" 
          className="search-input" 
          placeholder="Search tools..." 
        />
        <div className="search-shortcut">
          <Command size={14} />
          <span>K</span>
        </div>
      </div>

      <div className="topbar-actions">
        <button onClick={() => setShowSuggestModal(true)} className="suggest-btn" aria-label="Suggest Feature">
          <Lightbulb size={16} />
          <span>Suggest Feature</span>
        </button>
        <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      {showSuggestModal && (
        <div className="modal-overlay" onClick={() => setShowSuggestModal(false)}>
          <div className="suggest-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Suggest a Feature</h3>
              <button className="close-btn" onClick={() => setShowSuggestModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p>Have an idea for a new tool or feature? Let us know!</p>
              <textarea 
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="I would love to see a tool that..."
                rows={5}
              ></textarea>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowSuggestModal(false)}>Cancel</button>
              <button className="send-btn" onClick={handleSendSuggestion} disabled={!suggestion.trim()}>Send Suggestion</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Topbar;
