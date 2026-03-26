// useGlobalTheme hook — CSS variable theme controlled by super_admin
// Consumers: import from 'hooks/settings' or 'hooks/use-settings'

import { useState, useCallback, useEffect } from 'react';
import type { GlobalTheme } from './settings-types';
import { THEME_PRESETS, DEFAULT_THEME, THEME_STORAGE_KEY } from './settings-presets';

export function useGlobalTheme() {
  const [theme, setTheme] = useState<GlobalTheme>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_THEME, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore parse errors
    }
    return DEFAULT_THEME;
  });

  // Apply theme to CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--primary', theme.primaryColor);
    document.documentElement.style.setProperty('--primary-dark', theme.primaryDark);
    document.body.style.background = theme.bodyGradient;
  }, [theme]);

  // Save to localStorage when theme changes
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  const updateTheme = useCallback((newTheme: Partial<GlobalTheme>) => {
    setTheme(prev => ({ ...prev, ...newTheme }));
  }, []);

  const applyPreset = useCallback((preset: typeof THEME_PRESETS[0]) => {
    setTheme({
      primaryColor: preset.primary,
      primaryDark: preset.dark,
      bodyGradient: preset.gradient,
    });
  }, []);

  const resetTheme = useCallback(() => {
    setTheme(DEFAULT_THEME);
  }, []);

  return {
    theme,
    updateTheme,
    applyPreset,
    resetTheme,
  };
}
