import { Search, Moon, Sun, Command, Lightbulb, X, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';
import './Topbar.css';

const Topbar = () => {
  const { theme, toggleTheme } = useTheme();
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSendSuggestion = async () => {
    if (!suggestion.trim()) return;
    setIsSending(true);
    
    try {
      const response = await fetch('https://formspree.io/f/xoevqdyo', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ suggestion })
      });
      
      if (response.ok) {
        setIsSent(true);
        setTimeout(() => {
          setShowSuggestModal(false);
          setSuggestion('');
          setIsSent(false);
        }, 2000);
      } else {
        alert('Failed to send suggestion. Please try again.');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred. Please check your connection and try again.');
    } finally {
      setIsSending(false);
    }
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
          <span>Suggest a feature</span>
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
              <button 
                className="send-btn" 
                onClick={handleSendSuggestion} 
                disabled={!suggestion.trim() || isSending || isSent}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
              >
                {isSent ? <><Check size={16} /> Sent!</> : isSending ? 'Sending...' : 'Send Suggestion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Topbar;
