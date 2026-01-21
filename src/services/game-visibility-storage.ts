// Game Visibility Storage Service
// Manages which games are hidden/visible in the game hub

import type { GameType } from '../types/game-hub';

const STORAGE_KEY = 'game_visibility_settings';

export interface GameVisibilitySettings {
  hiddenGames: GameType[];
  updatedAt: number;
}

// Get visibility settings from localStorage
export function getGameVisibilitySettings(): GameVisibilitySettings {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load game visibility settings:', e);
  }
  return { hiddenGames: [], updatedAt: Date.now() };
}

// Save visibility settings to localStorage
export function saveGameVisibilitySettings(settings: GameVisibilitySettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...settings,
      updatedAt: Date.now(),
    }));
  } catch (e) {
    console.error('Failed to save game visibility settings:', e);
  }
}

// Toggle game visibility
export function toggleGameVisibility(gameId: GameType): boolean {
  const settings = getGameVisibilitySettings();
  const isHidden = settings.hiddenGames.includes(gameId);

  if (isHidden) {
    settings.hiddenGames = settings.hiddenGames.filter(id => id !== gameId);
  } else {
    settings.hiddenGames.push(gameId);
  }

  saveGameVisibilitySettings(settings);
  return !isHidden; // Returns new hidden state
}

// Check if a game is hidden
export function isGameHidden(gameId: GameType): boolean {
  const settings = getGameVisibilitySettings();
  return settings.hiddenGames.includes(gameId);
}

// Get list of hidden games
export function getHiddenGames(): GameType[] {
  return getGameVisibilitySettings().hiddenGames;
}

// Show all games (clear hidden list)
export function showAllGames(): void {
  saveGameVisibilitySettings({ hiddenGames: [], updatedAt: Date.now() });
}
