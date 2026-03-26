// Sound configuration constants and type definitions
// All static data used by the game audio system lives here

// ─── Public Types ───────────────────────────────────────────────────────────

export type SoundEffectType =
  | 'correct'
  | 'wrong'
  | 'victory'
  | 'defeat'
  | 'countdown'
  | 'start'
  | 'powerup'
  | 'click';

export type MusicCategory = 'epic' | 'chill' | 'action' | 'fun' | 'japanese' | 'custom';

export interface MusicTrack {
  id: string;
  name: string;
  category: MusicCategory;
  emoji: string;
  url?: string;       // Optional URL for a real audio file
  duration?: string;  // e.g. "3:45"
  artist?: string;
}

export interface CustomSoundEffect {
  id: string;
  name: string;
  url: string;  // Data URL or external URL
}

export interface GameSoundSettings {
  soundEnabled: boolean;
  soundVolume: number;  // 0–100
  musicEnabled: boolean;
  musicVolume: number;  // 0–100
  musicTrack: string;
  customMusicTracks: MusicTrack[];
  customCorrectSound?: CustomSoundEffect;
  customWrongSound?: CustomSoundEffect;
  customVictorySound?: CustomSoundEffect;
  customDefeatSound?: CustomSoundEffect;
  [key: string]: unknown;
}

// ─── Category Labels ─────────────────────────────────────────────────────────

// Vietnamese display labels for each music category
export const MUSIC_CATEGORY_LABELS: Record<MusicCategory, string> = {
  epic:    '🔥 Hùng Tráng',
  chill:   '☕ Thư Giãn',
  action:  '⚡ Sôi Động',
  fun:     '🎮 Vui Nhộn',
  japanese:'🎌 Nhật Bản',
  custom:  '📁 Tuỳ Chỉnh',
};

// Built-in tracks list — empty by default; users add custom tracks at runtime
export const MUSIC_TRACKS: MusicTrack[] = [];

// ─── Sound Effect Configs ─────────────────────────────────────────────────────

// Web Audio API parameters for each procedural sound effect
export const SOUND_CONFIGS: Record<
  SoundEffectType,
  { frequencies: number[]; durations: number[]; type: OscillatorType; gain: number }
> = {
  correct:   { frequencies: [523.25, 659.25, 783.99],              durations: [0.1, 0.1, 0.2],         type: 'sine',     gain: 0.3  },
  wrong:     { frequencies: [200, 150],                             durations: [0.15, 0.25],             type: 'sawtooth', gain: 0.2  },
  victory:   { frequencies: [523.25, 587.33, 659.25, 783.99, 1046.50], durations: [0.15, 0.15, 0.15, 0.15, 0.4], type: 'sine', gain: 0.35 },
  defeat:    { frequencies: [392, 349.23, 311.13, 261.63],          durations: [0.2, 0.2, 0.2, 0.4],    type: 'triangle', gain: 0.25 },
  countdown: { frequencies: [440],                                  durations: [0.1],                   type: 'square',   gain: 0.2  },
  start:     { frequencies: [440, 554.37, 659.25],                  durations: [0.1, 0.1, 0.3],         type: 'sine',     gain: 0.3  },
  powerup:   { frequencies: [392, 493.88, 587.33, 783.99],          durations: [0.08, 0.08, 0.08, 0.2], type: 'sine',     gain: 0.25 },
  click:     { frequencies: [800],                                  durations: [0.05],                  type: 'sine',     gain: 0.15 },
};

// ─── Music Patterns ───────────────────────────────────────────────────────────

// Procedural BGM pattern configurations per track ID
export interface MusicPattern {
  frequencies: number[];
  waveform: OscillatorType;
  tempo: number;  // BPM-like multiplier
  style: 'ambient' | 'rhythmic' | 'melodic';
}

export const MUSIC_PATTERNS: Record<string, MusicPattern> = {
  // Epic
  'epic-battle':     { frequencies: [110, 138.59, 164.81, 220],           waveform: 'sawtooth', tempo: 1.5, style: 'rhythmic' },
  'victory-fanfare': { frequencies: [261.63, 329.63, 392, 523.25],        waveform: 'sine',     tempo: 1.2, style: 'melodic'  },
  'hero-theme':      { frequencies: [130.81, 164.81, 196, 261.63],        waveform: 'triangle', tempo: 1.0, style: 'melodic'  },
  'boss-fight':      { frequencies: [98, 123.47, 146.83, 196],            waveform: 'square',   tempo: 1.8, style: 'rhythmic' },

  // Chill
  'chill-study':     { frequencies: [261.63, 329.63, 392, 493.88],        waveform: 'sine',     tempo: 0.5, style: 'ambient'  },
  'lofi-beats':      { frequencies: [220, 277.18, 329.63, 440],           waveform: 'triangle', tempo: 0.7, style: 'rhythmic' },
  'peaceful-piano':  { frequencies: [261.63, 311.13, 392, 466.16],        waveform: 'sine',     tempo: 0.4, style: 'melodic'  },
  'night-cafe':      { frequencies: [196, 246.94, 293.66, 392],           waveform: 'sine',     tempo: 0.6, style: 'ambient'  },

  // Action
  'race-adrenaline': { frequencies: [196, 246.94, 293.66, 392],           waveform: 'sawtooth', tempo: 2.0, style: 'rhythmic' },
  'countdown-pulse': { frequencies: [220, 293.66, 349.23, 440],           waveform: 'square',   tempo: 1.5, style: 'rhythmic' },
  'chase-music':     { frequencies: [164.81, 207.65, 246.94, 329.63],     waveform: 'sawtooth', tempo: 1.8, style: 'rhythmic' },
  'time-attack':     { frequencies: [185, 233.08, 277.18, 370],           waveform: 'square',   tempo: 2.2, style: 'rhythmic' },

  // Fun
  'happy-game':      { frequencies: [293.66, 369.99, 440, 554.37],        waveform: 'sine',     tempo: 1.0, style: 'melodic'  },
  'party-time':      { frequencies: [329.63, 415.30, 493.88, 659.25],     waveform: 'triangle', tempo: 1.3, style: 'rhythmic' },
  'quirky-adventure':{ frequencies: [261.63, 329.63, 415.30, 523.25],     waveform: 'sine',     tempo: 0.9, style: 'melodic'  },
  'pixel-world':     { frequencies: [220, 277.18, 349.23, 440],           waveform: 'square',   tempo: 1.1, style: 'melodic'  },

  // Japanese
  'sakura-spring':   { frequencies: [293.66, 349.23, 440, 523.25],        waveform: 'sine',     tempo: 0.5, style: 'ambient'  },
  'zen-garden':      { frequencies: [196, 220, 293.66, 329.63],           waveform: 'sine',     tempo: 0.3, style: 'ambient'  },
  'tokyo-nights':    { frequencies: [233.08, 277.18, 349.23, 415.30],     waveform: 'triangle', tempo: 0.8, style: 'ambient'  },
  'anime-opening':   { frequencies: [329.63, 392, 493.88, 587.33],        waveform: 'sine',     tempo: 1.4, style: 'melodic'  },
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const STORAGE_KEY = 'game-sound-settings';

export const DEFAULT_SETTINGS: GameSoundSettings = {
  soundEnabled: true,
  soundVolume: 70,
  musicEnabled: false,
  musicVolume: 30,
  musicTrack: 'happy-game',
  customMusicTracks: [],
};
