import { useState, useCallback, useRef, useEffect } from 'react';

export function useToolHistory(initialState, debounceMs = 500) {
  const [state, setState] = useState(initialState);
  const [history, setHistory] = useState([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const timeoutRef = useRef(null);
  const isUndoRedoRef = useRef(false);

  // When state changes, we might want to save it to history
  useEffect(() => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setHistory(prev => {
        // Don't add to history if it's the same as current
        if (JSON.stringify(prev[currentIndex]) === JSON.stringify(state)) {
          return prev;
        }
        
        // Remove future states if we branched off an undo
        const newHistory = prev.slice(0, currentIndex + 1);
        newHistory.push(state);
        
        // Limit history to 50 items
        if (newHistory.length > 50) {
          newHistory.shift();
          setCurrentIndex(newHistory.length - 1);
        } else {
          setCurrentIndex(newHistory.length - 1);
        }
        
        return newHistory;
      });
    }, debounceMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [state, currentIndex, debounceMs]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      isUndoRedoRef.current = true;
      setCurrentIndex(prev => prev - 1);
      setState(history[currentIndex - 1]);
    }
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      isUndoRedoRef.current = true;
      setCurrentIndex(prev => prev + 1);
      setState(history[currentIndex + 1]);
    }
  }, [currentIndex, history]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  // Custom setter that updates current state immediately
  const setWithHistory = useCallback((newState) => {
    setState(newState);
  }, []);

  return {
    state,
    setState: setWithHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    history
  };
}
