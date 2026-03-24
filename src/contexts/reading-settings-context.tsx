// Reading Settings Context - Global settings for furigana, font sizes across the app

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';

export interface ReadingSettings {
  showFurigana: boolean;
  fontSize: number; // 0.8 - 2.5 (multiplier)
  furiganaSize: number; // 0.4 - 0.8 (multiplier relative to text)
  textColor: string; // Text color for question content
  furiganaColor: string; // Furigana text color
}

interface ReadingSettingsContextType {
  settings: ReadingSettings;
  updateSettings: (updates: Partial<ReadingSettings>) => void;
  toggleFurigana: () => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  increaseFuriganaSize: () => void;
  decreaseFuriganaSize: () => void;
}

const DEFAULT_SETTINGS: ReadingSettings = {
  showFurigana: true,
  fontSize: 1,
  furiganaSize: 0.5,
  textColor: '#ffffff',
  furiganaColor: '#a78bfa', // Default purple furigana
};

const STORAGE_KEY = 'shinko-reading-settings';

const ReadingSettingsContext = createContext<ReadingSettingsContextType | null>(null);

export function ReadingSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ReadingSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // Ignore parse errors
    }
    return DEFAULT_SETTINGS;
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage errors
    }
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<ReadingSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const toggleFurigana = useCallback(() => {
    setSettings(prev => ({ ...prev, showFurigana: !prev.showFurigana }));
  }, []);

  const increaseFontSize = useCallback(() => {
    setSettings(prev => ({ ...prev, fontSize: Math.min(2.5, prev.fontSize + 0.1) }));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setSettings(prev => ({ ...prev, fontSize: Math.max(0.8, prev.fontSize - 0.1) }));
  }, []);

  const increaseFuriganaSize = useCallback(() => {
    setSettings(prev => ({ ...prev, furiganaSize: Math.min(0.8, prev.furiganaSize + 0.05) }));
  }, []);

  const decreaseFuriganaSize = useCallback(() => {
    setSettings(prev => ({ ...prev, furiganaSize: Math.max(0.3, prev.furiganaSize - 0.05) }));
  }, []);

  const value = useMemo(() => ({
    settings, updateSettings, toggleFurigana,
    increaseFontSize, decreaseFontSize, increaseFuriganaSize, decreaseFuriganaSize,
  }), [settings, updateSettings, toggleFurigana, increaseFontSize, decreaseFontSize, increaseFuriganaSize, decreaseFuriganaSize]);

  return (
    <ReadingSettingsContext.Provider value={value}>
      {children}
    </ReadingSettingsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useReadingSettings() {
  const context = useContext(ReadingSettingsContext);
  if (!context) {
    throw new Error('useReadingSettings must be used within ReadingSettingsProvider');
  }
  return context;
}
