import { Link } from 'react-router-dom';
import { tools, categories } from '../data/tools';
import * as Icons from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome to Frontend Toolkit</h1>
        <p>Your all-in-one suite of developer tools.</p>
      </div>

      <div className="dashboard-content">
        <div className="tool-category">
          <h2 className="category-title">All Tools</h2>
          <div className="tools-grid">
            {tools.map(tool => {
              const Icon = Icons[tool.icon] || Icons.Wrench;
              return (
                <Link to={tool.path} key={tool.id} className="tool-card">
                  <div className="tool-card-icon">
                    <Icon size={24} />
                  </div>
                  <div className="tool-card-content">
                    <h3>{tool.name}</h3>
                    <p>{tool.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
