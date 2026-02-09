// Listening Settings Context - Global settings for listening practice across the app

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { JLPTLevel } from '../types/flashcard';

export interface ListeningSettings {
  // Playback
  defaultPlaybackSpeed: number;    // 0.5 - 2.0 (default: 1)
  defaultRepeatCount: number;      // 1 - 10 (default: 1)
  delayBetweenWords: number;       // 0.5 - 10 seconds (default: 2)
  autoPlayNext: boolean;           // default: true

  // Display
  showVocabulary: boolean;         // default: true
  showMeaning: boolean;            // default: false
  showKanji: boolean;              // default: true

  // Source
  vocabularySourceLevel: JLPTLevel | 'match_selected';  // default: 'match_selected'
  defaultLevel: JLPTLevel;         // default: 'N5'

  // Voice
  voiceRate: number;               // 0.5 - 2.0 (default: 1)
}

interface ListeningSettingsContextType {
  settings: ListeningSettings;
  updateSettings: (updates: Partial<ListeningSettings>) => void;
  // Playback helpers
  increasePlaybackSpeed: () => void;
  decreasePlaybackSpeed: () => void;
  increaseRepeatCount: () => void;
  decreaseRepeatCount: () => void;
  increaseDelay: () => void;
  decreaseDelay: () => void;
  toggleAutoPlayNext: () => void;
  // Display helpers
  toggleShowVocabulary: () => void;
  toggleShowMeaning: () => void;
  toggleShowKanji: () => void;
  // Voice helpers
  increaseVoiceRate: () => void;
  decreaseVoiceRate: () => void;
}

const DEFAULT_SETTINGS: ListeningSettings = {
  // Playback
  defaultPlaybackSpeed: 1,
  defaultRepeatCount: 1,
  delayBetweenWords: 1.5,
  autoPlayNext: true,
  // Display
  showVocabulary: true,
  showMeaning: false,
  showKanji: true,
  // Source
  vocabularySourceLevel: 'match_selected',
  defaultLevel: 'N5',
  // Voice
  voiceRate: 1,
};

const STORAGE_KEY = 'shinko-listening-settings';

const ListeningSettingsContext = createContext<ListeningSettingsContextType | null>(null);

export function ListeningSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ListeningSettings>(() => {
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

  const updateSettings = (updates: Partial<ListeningSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  // Playback helpers
  const increasePlaybackSpeed = () => {
    setSettings(prev => ({
      ...prev,
      defaultPlaybackSpeed: Math.min(2, prev.defaultPlaybackSpeed + 0.25),
    }));
  };

  const decreasePlaybackSpeed = () => {
    setSettings(prev => ({
      ...prev,
      defaultPlaybackSpeed: Math.max(0.5, prev.defaultPlaybackSpeed - 0.25),
    }));
  };

  const increaseRepeatCount = () => {
    setSettings(prev => ({
      ...prev,
      defaultRepeatCount: Math.min(10, prev.defaultRepeatCount + 1),
    }));
  };

  const decreaseRepeatCount = () => {
    setSettings(prev => ({
      ...prev,
      defaultRepeatCount: Math.max(1, prev.defaultRepeatCount - 1),
    }));
  };

  const increaseDelay = () => {
    setSettings(prev => ({
      ...prev,
      delayBetweenWords: Math.min(10, prev.delayBetweenWords + 0.5),
    }));
  };

  const decreaseDelay = () => {
    setSettings(prev => ({
      ...prev,
      delayBetweenWords: Math.max(0.5, prev.delayBetweenWords - 0.5),
    }));
  };

  const toggleAutoPlayNext = () => {
    setSettings(prev => ({ ...prev, autoPlayNext: !prev.autoPlayNext }));
  };

  // Display helpers
  const toggleShowVocabulary = () => {
    setSettings(prev => ({ ...prev, showVocabulary: !prev.showVocabulary }));
  };

  const toggleShowMeaning = () => {
    setSettings(prev => ({ ...prev, showMeaning: !prev.showMeaning }));
  };

  const toggleShowKanji = () => {
    setSettings(prev => ({ ...prev, showKanji: !prev.showKanji }));
  };

  // Voice helpers
  const increaseVoiceRate = () => {
    setSettings(prev => ({
      ...prev,
      voiceRate: Math.min(2, prev.voiceRate + 0.25),
    }));
  };

  const decreaseVoiceRate = () => {
    setSettings(prev => ({
      ...prev,
      voiceRate: Math.max(0.5, prev.voiceRate - 0.25),
    }));
  };

  return (
    <ListeningSettingsContext.Provider
      value={{
        settings,
        updateSettings,
        increasePlaybackSpeed,
        decreasePlaybackSpeed,
        increaseRepeatCount,
        decreaseRepeatCount,
        increaseDelay,
        decreaseDelay,
        toggleAutoPlayNext,
        toggleShowVocabulary,
        toggleShowMeaning,
        toggleShowKanji,
        increaseVoiceRate,
        decreaseVoiceRate,
      }}
    >
      {children}
    </ListeningSettingsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useListeningSettings() {
  const context = useContext(ListeningSettingsContext);
  if (!context) {
    throw new Error('useListeningSettings must be used within ListeningSettingsProvider');
  }
  return context;
}
