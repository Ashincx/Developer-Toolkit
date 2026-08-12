import { Search, Moon, Sun, Command } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './Topbar.css';

const Topbar = () => {
  const { theme, toggleTheme } = useTheme();

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
        <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </header>
  );
};

export default Topbar;
