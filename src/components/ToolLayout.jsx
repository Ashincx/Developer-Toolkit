import { Heart, Undo2, Redo2, Save, Download, RotateCcw } from 'lucide-react';
import { useTools } from '../context/ToolsContext';
import './ToolLayout.css';

const ToolLayout = ({ 
  id, 
  title, 
  description, 
  children,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onReset
}) => {
  const { favorites, toggleFavorite, addRecent } = useTools();
  const isFavorite = favorites.includes(id);

  import('react').then(({ useEffect }) => {
    useEffect(() => {
      addRecent(id);
    }, [id, addRecent]);
  });

  return (
    <div className="tool-layout">
      <div className="tool-header">
        <div className="tool-info">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="tool-actions-top">
          {onUndo && (
            <button 
              className="action-icon-btn" 
              onClick={onUndo} 
              disabled={!canUndo}
              aria-label="Undo"
              title="Undo"
            >
              <Undo2 size={18} />
            </button>
          )}
          {onRedo && (
            <button 
              className="action-icon-btn" 
              onClick={onRedo} 
              disabled={!canRedo}
              aria-label="Redo"
              title="Redo"
            >
              <Redo2 size={18} />
            </button>
          )}
          {onReset && (
            <button 
              className="action-icon-btn" 
              onClick={onReset}
              aria-label="Reset"
              title="Reset"
            >
              <RotateCcw size={18} />
            </button>
          )}
          <div className="action-divider"></div>
          <button 
            className={`favorite-btn ${isFavorite ? 'active' : ''}`}
            onClick={() => toggleFavorite(id)}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            title="Favorite"
          >
            <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
      <div className="tool-content">
        {children}
      </div>
    </div>
  );
};

export default ToolLayout;
