import { NavLink } from 'react-router-dom';
import { useTools } from '../context/ToolsContext';
import { Home, X } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { activeTools = [] } = useTools();

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
          </ul>
        </div>

        <div className="nav-section">
          <ul className="nav-list">
            {activeTools.map(tool => (
              <li key={tool.id}>
                <NavLink to={tool.path} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={handleClose}>
                  <span>{tool.name}</span>
                  {tool.status === 'testing' && (
                    <span style={{ fontSize: '9px', fontWeight: 700, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '1px 5px', borderRadius: '4px', marginLeft: 'auto', textTransform: 'uppercase' }}>
                      Test
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
