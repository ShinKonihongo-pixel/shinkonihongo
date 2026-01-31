// Reading Settings Context - Global settings for furigana, font sizes across the app

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface ReadingSettings {
  showFurigana: boolean;
  fontSize: number; // 0.8 - 1.5 (multiplier)
  furiganaSize: number; // 0.4 - 0.8 (multiplier relative to text)
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

  const updateSettings = (updates: Partial<ReadingSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const toggleFurigana = () => {
    setSettings(prev => ({ ...prev, showFurigana: !prev.showFurigana }));
  };

  const increaseFontSize = () => {
    setSettings(prev => ({
      ...prev,
      fontSize: Math.min(1.5, prev.fontSize + 0.1),
    }));
  };

  const decreaseFontSize = () => {
    setSettings(prev => ({
      ...prev,
      fontSize: Math.max(0.8, prev.fontSize - 0.1),
    }));
  };

  const increaseFuriganaSize = () => {
    setSettings(prev => ({
      ...prev,
      furiganaSize: Math.min(0.8, prev.furiganaSize + 0.05),
    }));
  };

  const decreaseFuriganaSize = () => {
    setSettings(prev => ({
      ...prev,
      furiganaSize: Math.max(0.3, prev.furiganaSize - 0.05),
    }));
  };

  return (
    <ReadingSettingsContext.Provider
      value={{
        settings,
        updateSettings,
        toggleFurigana,
        increaseFontSize,
        decreaseFontSize,
        increaseFuriganaSize,
        decreaseFuriganaSize,
      }}
    >
      {children}
    </ReadingSettingsContext.Provider>
  );
}

export function useReadingSettings() {
  const context = useContext(ReadingSettingsContext);
  if (!context) {
    throw new Error('useReadingSettings must be used within ReadingSettingsProvider');
  }
  return context;
}
