import { useState, useEffect } from 'react';

export function usePresets(toolId, defaultPresets = []) {
  const [presets, setPresets] = useState(() => {
    const saved = localStorage.getItem(`presets_${toolId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultPresets;
      }
    }
    return defaultPresets;
  });

  useEffect(() => {
    localStorage.setItem(`presets_${toolId}`, JSON.stringify(presets));
  }, [presets, toolId]);

  const savePreset = (name, state) => {
    const newPreset = { id: Date.now().toString(), name, state };
    setPresets(prev => [...prev, newPreset]);
    return newPreset;
  };

  const removePreset = (id) => {
    setPresets(prev => prev.filter(p => p.id !== id));
  };

  return {
    presets,
    savePreset,
    removePreset
  };
}
