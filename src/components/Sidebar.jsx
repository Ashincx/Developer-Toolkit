import { NavLink } from 'react-router-dom';
import { tools, categories } from '../data/tools';
import { Settings, Home, Star, Clock } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <h2>Frontend Toolkit</h2>
        </div>
      </div>
      
      <div className="sidebar-content">
        <div className="nav-section">
          <ul className="nav-list">
            <li>
              <NavLink to="/" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
                <Home size={18} />
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/favorites" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
                <Star size={18} />
                <span>Favorites</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/recent" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
                <Clock size={18} />
                <span>Recent</span>
              </NavLink>
            </li>
          </ul>
        </div>

        {categories.map(category => {
          const categoryTools = tools.filter(t => t.category === category);
          if (categoryTools.length === 0) return null;

          return (
            <div key={category} className="nav-section">
              <h3 className="nav-section-title">{category}</h3>
              <ul className="nav-list">
                {categoryTools.map(tool => (
                  <li key={tool.id}>
                    <NavLink to={tool.path} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
                      <span>{tool.name}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      
      <div className="sidebar-footer">
        <NavLink to="/settings" className="nav-item">
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
