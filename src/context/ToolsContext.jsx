import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { tools as defaultTools, categories as defaultCategories } from '../data/tools';

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

  // Tools configuration (order, visibility status: 'active' | 'testing' | 'hidden')
  const [toolsList, setToolsList] = useState(() => {
    const saved = localStorage.getItem('toolkit_tools_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const savedIds = new Set(parsed.map(t => t.id));
        const missing = defaultTools.filter(t => !savedIds.has(t.id)).map((t, idx) => ({
          ...t,
          status: 'active',
          order: parsed.length + idx + 1
        }));
        return [...parsed, ...missing].sort((a, b) => a.order - b.order);
      } catch (e) {
        console.error('Failed to parse saved tools config', e);
      }
    }
    return defaultTools.map((t, idx) => ({
      ...t,
      status: 'active',
      order: idx + 1
    }));
  });

  // Whether tools marked as 'testing' are shown on the frontend toolkit
  const [showTestingInFrontend, setShowTestingInFrontend] = useState(() => {
    const saved = localStorage.getItem('toolkit_show_testing_frontend');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('recent', JSON.stringify(recent));
  }, [recent]);

  useEffect(() => {
    localStorage.setItem('toolkit_tools_config', JSON.stringify(toolsList));
  }, [toolsList]);

  useEffect(() => {
    localStorage.setItem('toolkit_show_testing_frontend', JSON.stringify(showTestingInFrontend));
  }, [showTestingInFrontend]);

  const toggleFavorite = useCallback((toolId) => {
    setFavorites(prev => 
      prev.includes(toolId) 
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  }, []);

  const addRecent = useCallback((toolId) => {
    setRecent(prev => {
      if (prev[0] === toolId) return prev;
      const filtered = prev.filter(id => id !== toolId);
      return [toolId, ...filtered].slice(0, 10);
    });
  }, []);

  // Admin Actions
  const updateToolStatus = useCallback((toolId, newStatus) => {
    setToolsList(prev => 
      prev.map(t => t.id === toolId ? { ...t, status: newStatus } : t)
    );
  }, []);

  const moveTool = useCallback((toolId, direction) => {
    setToolsList(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex(t => t.id === toolId);
      if (index === -1) return prev;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= sorted.length) return prev;

      const temp = sorted[index].order;
      sorted[index].order = sorted[targetIndex].order;
      sorted[targetIndex].order = temp;

      return [...sorted].sort((a, b) => a.order - b.order);
    });
  }, []);

  const setToolOrder = useCallback((toolId, targetOrder) => {
    const orderNum = parseInt(targetOrder, 10);
    if (isNaN(orderNum) || orderNum < 1) return;

    setToolsList(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const currentIdx = sorted.findIndex(t => t.id === toolId);
      if (currentIdx === -1) return prev;

      const [moved] = sorted.splice(currentIdx, 1);
      const insertIdx = Math.min(Math.max(0, orderNum - 1), sorted.length);
      sorted.splice(insertIdx, 0, moved);

      return sorted.map((t, idx) => ({ ...t, order: idx + 1 }));
    });
  }, []);

  const addNewTool = useCallback((toolData) => {
    setToolsList(prev => {
      const newTool = {
        id: toolData.id ? toolData.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-') : `custom-${Date.now()}`,
        name: toolData.name || 'Untitled Tool',
        description: toolData.description || '',
        category: toolData.category || 'Utilities',
        path: toolData.path ? (toolData.path.startsWith('/') ? toolData.path : `/${toolData.path}`) : `/tool-${Date.now()}`,
        icon: toolData.icon || 'Wrench',
        status: toolData.status || 'testing',
        order: prev.length + 1,
        isCustom: true
      };
      return [...prev, newTool];
    });
  }, []);

  const deleteTool = useCallback((toolId) => {
    setToolsList(prev => prev.filter(t => t.id !== toolId));
    setFavorites(prev => prev.filter(id => id !== toolId));
    setRecent(prev => prev.filter(id => id !== toolId));
  }, []);

  const resetToDefaults = useCallback(() => {
    const resetList = defaultTools.map((t, idx) => ({
      ...t,
      status: 'active',
      order: idx + 1
    }));
    setToolsList(resetList);
    setShowTestingInFrontend(true);
    localStorage.removeItem('toolkit_tools_config');
    localStorage.removeItem('toolkit_show_testing_frontend');
  }, []);

  // Sorted full list of tools
  const allTools = useMemo(() => {
    return [...toolsList].sort((a, b) => a.order - b.order);
  }, [toolsList]);

  // Active tools shown in frontend dashboard & sidebar (respects order & status)
  const activeTools = useMemo(() => {
    return allTools.filter(t => {
      if (t.status === 'hidden') return false;
      if (t.status === 'testing') return showTestingInFrontend;
      return true;
    });
  }, [allTools, showTestingInFrontend]);

  // Tools in testing mode
  const testingTools = useMemo(() => {
    return allTools.filter(t => t.status === 'testing');
  }, [allTools]);

  // Tools in hidden mode
  const hiddenTools = useMemo(() => {
    return allTools.filter(t => t.status === 'hidden');
  }, [allTools]);

  return (
    <ToolsContext.Provider 
      value={{ 
        favorites, 
        toggleFavorite, 
        recent, 
        addRecent,
        allTools,
        activeTools,
        testingTools,
        hiddenTools,
        showTestingInFrontend,
        setShowTestingInFrontend,
        updateToolStatus,
        moveTool,
        setToolOrder,
        addNewTool,
        deleteTool,
        resetToDefaults,
        categories: defaultCategories
      }}
    >
      {children}
    </ToolsContext.Provider>
  );
};

export const useTools = () => useContext(ToolsContext);
