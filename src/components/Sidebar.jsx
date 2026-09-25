import { NavLink } from 'react-router-dom';
import { tools, categories } from '../data/tools';
import { Settings, Home, Star, Clock, X } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const handleClose = () => {
    if (setIsOpen) setIsOpen(false);
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={handleClose}></div>}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <h2>Frontend Toolkit</h2>
        </div>
        <button className="sidebar-close-btn" onClick={handleClose}>
          <X size={20} />
        </button>
      </div>
      
      <div className="sidebar-content">
        <div className="nav-section">
          <ul className="nav-list">
            <li>
              <NavLink to="/" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={handleClose}>
                <Home size={18} />
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/favorites" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={handleClose}>
                <Star size={18} />
                <span>Favorites</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/recent" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={handleClose}>
                <Clock size={18} />
                <span>Recent</span>
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="nav-section">
          <ul className="nav-list">
            {tools.map(tool => (
              <li key={tool.id}>
                <NavLink to={tool.path} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={handleClose}>
                  <span>{tool.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="sidebar-footer">
        <NavLink to="/settings" className="nav-item" onClick={handleClose}>
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
