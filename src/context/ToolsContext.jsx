import { createContext, useContext, useEffect, useState } from 'react';

const ToolsContext = createContext();

export const ToolsProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [recent, setRecent] = useState(() => {
    const saved = localStorage.getItem('recent');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('recent', JSON.stringify(recent));
  }, [recent]);

  const toggleFavorite = (toolId) => {
    setFavorites(prev => 
      prev.includes(toolId) 
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  };

  const addRecent = (toolId) => {
    setRecent(prev => {
      const filtered = prev.filter(id => id !== toolId);
      return [toolId, ...filtered].slice(0, 10); // Keep max 10 recent
    });
  };

  return (
    <ToolsContext.Provider value={{ favorites, toggleFavorite, recent, addRecent }}>
      {children}
    </ToolsContext.Provider>
  );
};

export const useTools = () => useContext(ToolsContext);
