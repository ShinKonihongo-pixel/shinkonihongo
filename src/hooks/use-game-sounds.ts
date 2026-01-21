// Hook for managing game sound effects and background music
// Professional game audio system with volume control and track selection

import { useRef, useCallback, useEffect, useState } from 'react';

// Sound effect types
export type SoundEffectType = 'correct' | 'wrong' | 'victory' | 'defeat' | 'countdown' | 'start' | 'powerup' | 'click';

// Music track categories
export type MusicCategory = 'epic' | 'chill' | 'action' | 'fun' | 'japanese' | 'custom';

// Background music tracks
export interface MusicTrack {
  id: string;
  name: string;
  category: MusicCategory;
  emoji: string;
  url?: string;  // Optional URL for real audio file
  duration?: string;  // e.g., "3:45"
  artist?: string;
}

// Category labels in Vietnamese
export const MUSIC_CATEGORY_LABELS: Record<MusicCategory, string> = {
  epic: '🔥 Hùng Tráng',
  chill: '☕ Thư Giãn',
  action: '⚡ Sôi Động',
  fun: '🎮 Vui Nhộn',
  japanese: '🎌 Nhật Bản',
  custom: '📁 Tuỳ Chỉnh',
};

// Built-in music tracks (procedural + optional URLs)
export const MUSIC_TRACKS: MusicTrack[] = [
  // Epic/Dramatic - Procedural (no URL)
  { id: 'epic-battle', name: 'Epic Battle', category: 'epic', emoji: '⚔️', duration: '∞' },
  { id: 'victory-fanfare', name: 'Victory Fanfare', category: 'epic', emoji: '🏆', duration: '∞' },
  { id: 'hero-theme', name: 'Hero Theme', category: 'epic', emoji: '🦸', duration: '∞' },
  { id: 'boss-fight', name: 'Boss Fight', category: 'epic', emoji: '👹', duration: '∞' },

  // Chill/Relaxed - Procedural
  { id: 'chill-study', name: 'Chill Study', category: 'chill', emoji: '📚', duration: '∞' },
  { id: 'lofi-beats', name: 'Lo-Fi Beats', category: 'chill', emoji: '🎧', duration: '∞' },
  { id: 'peaceful-piano', name: 'Peaceful Piano', category: 'chill', emoji: '🎹', duration: '∞' },
  { id: 'night-cafe', name: 'Night Café', category: 'chill', emoji: '🌙', duration: '∞' },

  // Action/Intense - Procedural
  { id: 'race-adrenaline', name: 'Race Adrenaline', category: 'action', emoji: '🏎️', duration: '∞' },
  { id: 'countdown-pulse', name: 'Countdown Pulse', category: 'action', emoji: '⏱️', duration: '∞' },
  { id: 'chase-music', name: 'Chase Music', category: 'action', emoji: '🚀', duration: '∞' },
  { id: 'time-attack', name: 'Time Attack', category: 'action', emoji: '⚡', duration: '∞' },

  // Fun/Playful - Procedural
  { id: 'happy-game', name: 'Happy Game', category: 'fun', emoji: '🎮', duration: '∞' },
  { id: 'party-time', name: 'Party Time', category: 'fun', emoji: '🎉', duration: '∞' },
  { id: 'quirky-adventure', name: 'Quirky Adventure', category: 'fun', emoji: '🌟', duration: '∞' },
  { id: 'pixel-world', name: 'Pixel World', category: 'fun', emoji: '👾', duration: '∞' },

  // Japanese Theme - Procedural
  { id: 'sakura-spring', name: 'Sakura Spring', category: 'japanese', emoji: '🌸', duration: '∞' },
  { id: 'zen-garden', name: 'Zen Garden', category: 'japanese', emoji: '🏯', duration: '∞' },
  { id: 'tokyo-nights', name: 'Tokyo Nights', category: 'japanese', emoji: '🗼', duration: '∞' },
  { id: 'anime-opening', name: 'Anime Opening', category: 'japanese', emoji: '✨', duration: '∞' },
];

// Sound effect frequencies and durations for Web Audio API
const SOUND_CONFIGS: Record<SoundEffectType, { frequencies: number[]; durations: number[]; type: OscillatorType; gain: number }> = {
  correct: {
    frequencies: [523.25, 659.25, 783.99], // C5, E5, G5 (happy chord)
    durations: [0.1, 0.1, 0.2],
    type: 'sine',
    gain: 0.3,
  },
  wrong: {
    frequencies: [200, 150], // Low descending (sad)
    durations: [0.15, 0.25],
    type: 'sawtooth',
    gain: 0.2,
  },
  victory: {
    frequencies: [523.25, 587.33, 659.25, 783.99, 1046.50], // C5, D5, E5, G5, C6 (victory fanfare)
    durations: [0.15, 0.15, 0.15, 0.15, 0.4],
    type: 'sine',
    gain: 0.35,
  },
  defeat: {
    frequencies: [392, 349.23, 311.13, 261.63], // G4, F4, Eb4, C4 (sad descend)
    durations: [0.2, 0.2, 0.2, 0.4],
    type: 'triangle',
    gain: 0.25,
  },
  countdown: {
    frequencies: [440], // A4 (beep)
    durations: [0.1],
    type: 'square',
    gain: 0.2,
  },
  start: {
    frequencies: [440, 554.37, 659.25], // A4, C#5, E5 (start fanfare)
    durations: [0.1, 0.1, 0.3],
    type: 'sine',
    gain: 0.3,
  },
  powerup: {
    frequencies: [392, 493.88, 587.33, 783.99], // G4, B4, D5, G5 (power up)
    durations: [0.08, 0.08, 0.08, 0.2],
    type: 'sine',
    gain: 0.25,
  },
  click: {
    frequencies: [800],
    durations: [0.05],
    type: 'sine',
    gain: 0.15,
  },
};

// Music pattern configurations for procedural generation
interface MusicPattern {
  frequencies: number[];
  waveform: OscillatorType;
  tempo: number;  // BPM-like multiplier
  style: 'ambient' | 'rhythmic' | 'melodic';
}

// Extended music patterns for each track
const MUSIC_PATTERNS: Record<string, MusicPattern> = {
  // Epic
  'epic-battle': { frequencies: [110, 138.59, 164.81, 220], waveform: 'sawtooth', tempo: 1.5, style: 'rhythmic' },
  'victory-fanfare': { frequencies: [261.63, 329.63, 392, 523.25], waveform: 'sine', tempo: 1.2, style: 'melodic' },
  'hero-theme': { frequencies: [130.81, 164.81, 196, 261.63], waveform: 'triangle', tempo: 1.0, style: 'melodic' },
  'boss-fight': { frequencies: [98, 123.47, 146.83, 196], waveform: 'square', tempo: 1.8, style: 'rhythmic' },

  // Chill
  'chill-study': { frequencies: [261.63, 329.63, 392, 493.88], waveform: 'sine', tempo: 0.5, style: 'ambient' },
  'lofi-beats': { frequencies: [220, 277.18, 329.63, 440], waveform: 'triangle', tempo: 0.7, style: 'rhythmic' },
  'peaceful-piano': { frequencies: [261.63, 311.13, 392, 466.16], waveform: 'sine', tempo: 0.4, style: 'melodic' },
  'night-cafe': { frequencies: [196, 246.94, 293.66, 392], waveform: 'sine', tempo: 0.6, style: 'ambient' },

  // Action
  'race-adrenaline': { frequencies: [196, 246.94, 293.66, 392], waveform: 'sawtooth', tempo: 2.0, style: 'rhythmic' },
  'countdown-pulse': { frequencies: [220, 293.66, 349.23, 440], waveform: 'square', tempo: 1.5, style: 'rhythmic' },
  'chase-music': { frequencies: [164.81, 207.65, 246.94, 329.63], waveform: 'sawtooth', tempo: 1.8, style: 'rhythmic' },
  'time-attack': { frequencies: [185, 233.08, 277.18, 370], waveform: 'square', tempo: 2.2, style: 'rhythmic' },

  // Fun
  'happy-game': { frequencies: [293.66, 369.99, 440, 554.37], waveform: 'sine', tempo: 1.0, style: 'melodic' },
  'party-time': { frequencies: [329.63, 415.30, 493.88, 659.25], waveform: 'triangle', tempo: 1.3, style: 'rhythmic' },
  'quirky-adventure': { frequencies: [261.63, 329.63, 415.30, 523.25], waveform: 'sine', tempo: 0.9, style: 'melodic' },
  'pixel-world': { frequencies: [220, 277.18, 349.23, 440], waveform: 'square', tempo: 1.1, style: 'melodic' },

  // Japanese
  'sakura-spring': { frequencies: [293.66, 349.23, 440, 523.25], waveform: 'sine', tempo: 0.5, style: 'ambient' },  // D pentatonic
  'zen-garden': { frequencies: [196, 220, 293.66, 329.63], waveform: 'sine', tempo: 0.3, style: 'ambient' },  // Japanese scale
  'tokyo-nights': { frequencies: [233.08, 277.18, 349.23, 415.30], waveform: 'triangle', tempo: 0.8, style: 'ambient' },
  'anime-opening': { frequencies: [329.63, 392, 493.88, 587.33], waveform: 'sine', tempo: 1.4, style: 'melodic' },
};

// Background music generator using Web Audio API
function createBackgroundMusic(
  audioContext: AudioContext,
  trackId: string,
  _customTracks: MusicTrack[]
): { oscillators: OscillatorNode[]; gainNode: GainNode; lfoNodes: OscillatorNode[] } {
  void _customTracks; // Reserved for future custom track support
  const gainNode = audioContext.createGain();
  gainNode.connect(audioContext.destination);
  gainNode.gain.value = 0.1;

  const oscillators: OscillatorNode[] = [];
  const lfoNodes: OscillatorNode[] = [];

  // Get pattern for this track
  const pattern = MUSIC_PATTERNS[trackId] || MUSIC_PATTERNS['happy-game'];
  const { frequencies, waveform, tempo, style } = pattern;

  // Create LFO for vibrato/tremolo effect
  const lfo = audioContext.createOscillator();
  const lfoGain = audioContext.createGain();
  lfo.frequency.value = tempo * 0.5;  // Slow modulation
  lfoGain.gain.value = style === 'ambient' ? 3 : 1;  // More movement for ambient
  lfo.connect(lfoGain);
  lfoNodes.push(lfo);

  frequencies.forEach((freq, i) => {
    const osc = audioContext.createOscillator();
    osc.type = waveform;
    osc.frequency.value = freq;

    // Add subtle vibrato from LFO
    if (style === 'melodic' || style === 'ambient') {
      lfoGain.connect(osc.frequency);
    }

    const oscGain = audioContext.createGain();
    // Different volume curves based on style
    const baseGain = style === 'rhythmic' ? 0.04 : 0.06;
    oscGain.gain.value = baseGain / (i + 1);

    osc.connect(oscGain);
    oscGain.connect(gainNode);

    oscillators.push(osc);
  });

  // Add sub-bass for epic/action tracks
  if (pattern.waveform === 'sawtooth' || pattern.waveform === 'square') {
    const subBass = audioContext.createOscillator();
    subBass.type = 'sine';
    subBass.frequency.value = frequencies[0] / 2;

    const subGain = audioContext.createGain();
    subGain.gain.value = 0.03;

    subBass.connect(subGain);
    subGain.connect(gainNode);
    oscillators.push(subBass);
  }

  return { oscillators, gainNode, lfoNodes };
}

export interface GameSoundSettings {
  soundEnabled: boolean;
  soundVolume: number; // 0-100
  musicEnabled: boolean;
  musicVolume: number; // 0-100
  musicTrack: string;
  customMusicTracks: MusicTrack[];  // User-added custom tracks
}

export interface UseGameSoundsReturn {
  // Sound effects
  playSound: (type: SoundEffectType) => void;
  playCorrect: () => void;
  playWrong: () => void;
  playVictory: () => void;
  playDefeat: () => void;
  playCountdown: () => void;
  playStart: () => void;
  playPowerUp: () => void;
  playClick: () => void;

  // Background music
  startMusic: () => void;
  stopMusic: () => void;
  toggleMusic: () => void;
  isMusicPlaying: boolean;
  currentTrack: MusicTrack | null;

  // Settings
  settings: GameSoundSettings;
  updateSettings: (newSettings: Partial<GameSoundSettings>) => void;
  toggleSound: () => void;
  toggleMusicEnabled: () => void;

  // Custom tracks management
  addCustomTrack: (track: Omit<MusicTrack, 'category'>) => void;
  removeCustomTrack: (trackId: string) => void;
  allTracks: MusicTrack[];  // Built-in + custom tracks
}

const STORAGE_KEY = 'game-sound-settings';

const DEFAULT_SETTINGS: GameSoundSettings = {
  soundEnabled: true,
  soundVolume: 70,
  musicEnabled: false,
  musicVolume: 30,
  musicTrack: 'happy-game',
  customMusicTracks: [],
};

export function useGameSounds(): UseGameSoundsReturn {
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicOscillatorsRef = useRef<OscillatorNode[]>([]);
  const musicLfoRef = useRef<OscillatorNode[]>([]);
  const musicGainRef = useRef<GainNode | null>(null);
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);

  // Settings state
  const [settings, setSettings] = useState<GameSoundSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore
    }
    return DEFAULT_SETTINGS;
  });

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }, [settings]);

  // Initialize AudioContext on first user interaction
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    // Resume if suspended (browsers require user interaction)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // Play sound effect using Web Audio API
  const playSound = useCallback((type: SoundEffectType) => {
    if (!settings.soundEnabled) return;

    try {
      const audioContext = getAudioContext();
      const config = SOUND_CONFIGS[type];
      const volume = (settings.soundVolume / 100) * config.gain;

      let startTime = audioContext.currentTime;

      config.frequencies.forEach((freq, i) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = config.type;
        oscillator.frequency.value = freq;

        gainNode.gain.setValueAtTime(volume, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + config.durations[i]);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + config.durations[i]);

        startTime += config.durations[i] * 0.8; // Slight overlap for smoother sound
      });
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }, [settings.soundEnabled, settings.soundVolume, getAudioContext]);

  // Convenience methods
  const playCorrect = useCallback(() => playSound('correct'), [playSound]);
  const playWrong = useCallback(() => playSound('wrong'), [playSound]);
  const playVictory = useCallback(() => playSound('victory'), [playSound]);
  const playDefeat = useCallback(() => playSound('defeat'), [playSound]);
  const playCountdown = useCallback(() => playSound('countdown'), [playSound]);
  const playStart = useCallback(() => playSound('start'), [playSound]);
  const playPowerUp = useCallback(() => playSound('powerup'), [playSound]);
  const playClick = useCallback(() => playSound('click'), [playSound]);

  // Get all available tracks (built-in + custom)
  const allTracks = [...MUSIC_TRACKS, ...settings.customMusicTracks];

  // Find track by ID
  const findTrack = useCallback((trackId: string): MusicTrack | null => {
    return allTracks.find(t => t.id === trackId) || null;
  }, [allTracks]);

  // Start background music
  const startMusic = useCallback(() => {
    if (!settings.musicEnabled || isMusicPlaying) return;

    try {
      const track = findTrack(settings.musicTrack);
      if (!track) return;

      setCurrentTrack(track);

      // Check if track has a URL (real audio file)
      if (track.url) {
        // Use HTML5 Audio for real audio files
        if (htmlAudioRef.current) {
          htmlAudioRef.current.pause();
        }

        const audio = new Audio(track.url);
        audio.loop = true;
        audio.volume = settings.musicVolume / 100;
        audio.play().catch(err => console.warn('Audio playback failed:', err));

        htmlAudioRef.current = audio;
        setIsMusicPlaying(true);
      } else {
        // Use Web Audio API for procedural music
        const audioContext = getAudioContext();

        // Stop any existing music
        musicOscillatorsRef.current.forEach(osc => {
          try { osc.stop(); } catch { /* ignore */ }
        });
        musicLfoRef.current.forEach(lfo => {
          try { lfo.stop(); } catch { /* ignore */ }
        });

        const { oscillators, gainNode, lfoNodes } = createBackgroundMusic(
          audioContext,
          settings.musicTrack,
          settings.customMusicTracks
        );

        gainNode.gain.value = (settings.musicVolume / 100) * 0.15;

        // Start all oscillators
        oscillators.forEach(osc => osc.start());
        lfoNodes.forEach(lfo => lfo.start());

        musicOscillatorsRef.current = oscillators;
        musicLfoRef.current = lfoNodes;
        musicGainRef.current = gainNode;
        setIsMusicPlaying(true);
      }
    } catch (error) {
      console.warn('Failed to start music:', error);
    }
  }, [settings.musicEnabled, settings.musicTrack, settings.musicVolume, settings.customMusicTracks, isMusicPlaying, getAudioContext, findTrack]);

  // Stop background music
  const stopMusic = useCallback(() => {
    // Stop HTML5 Audio
    if (htmlAudioRef.current) {
      htmlAudioRef.current.pause();
      htmlAudioRef.current = null;
    }

    // Stop Web Audio oscillators
    musicOscillatorsRef.current.forEach(osc => {
      try { osc.stop(); } catch { /* ignore */ }
    });
    musicLfoRef.current.forEach(lfo => {
      try { lfo.stop(); } catch { /* ignore */ }
    });

    musicOscillatorsRef.current = [];
    musicLfoRef.current = [];
    musicGainRef.current = null;
    setIsMusicPlaying(false);
    setCurrentTrack(null);
  }, []);

  // Toggle music
  const toggleMusic = useCallback(() => {
    if (isMusicPlaying) {
      stopMusic();
    } else {
      startMusic();
    }
  }, [isMusicPlaying, startMusic, stopMusic]);

  // Update music volume in real-time
  useEffect(() => {
    // Web Audio
    if (musicGainRef.current) {
      musicGainRef.current.gain.value = (settings.musicVolume / 100) * 0.15;
    }
    // HTML5 Audio
    if (htmlAudioRef.current) {
      htmlAudioRef.current.volume = settings.musicVolume / 100;
    }
  }, [settings.musicVolume]);

  // Stop music when disabled
  useEffect(() => {
    if (!settings.musicEnabled && isMusicPlaying) {
      stopMusic();
    }
  }, [settings.musicEnabled, isMusicPlaying, stopMusic]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMusic();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopMusic]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<GameSoundSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const toggleSound = useCallback(() => {
    setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  const toggleMusicEnabled = useCallback(() => {
    setSettings(prev => ({ ...prev, musicEnabled: !prev.musicEnabled }));
  }, []);

  // Add custom track
  const addCustomTrack = useCallback((track: Omit<MusicTrack, 'category'>) => {
    const newTrack: MusicTrack = { ...track, category: 'custom' };
    setSettings(prev => ({
      ...prev,
      customMusicTracks: [...prev.customMusicTracks, newTrack],
    }));
  }, []);

  // Remove custom track
  const removeCustomTrack = useCallback((trackId: string) => {
    setSettings(prev => ({
      ...prev,
      customMusicTracks: prev.customMusicTracks.filter(t => t.id !== trackId),
      // If removed track was selected, switch to default
      musicTrack: prev.musicTrack === trackId ? 'happy-game' : prev.musicTrack,
    }));
  }, []);

  return {
    playSound,
    playCorrect,
    playWrong,
    playVictory,
    playDefeat,
    playCountdown,
    playStart,
    playPowerUp,
    playClick,
    startMusic,
    stopMusic,
    toggleMusic,
    isMusicPlaying,
    currentTrack,
    settings,
    updateSettings,
    toggleSound,
    toggleMusicEnabled,
    addCustomTrack,
    removeCustomTrack,
    allTracks,
  };
}

// Export a singleton context for sharing across components
import { createContext, useContext, createElement, type ReactNode } from 'react';

const GameSoundsContext = createContext<UseGameSoundsReturn | null>(null);

export function GameSoundsProvider({ children }: { children: ReactNode }) {
  const gameSounds = useGameSounds();

  return createElement(GameSoundsContext.Provider, { value: gameSounds }, children);
}

export function useGameSoundsContext(): UseGameSoundsReturn {
  const context = useContext(GameSoundsContext);
  if (!context) {
    throw new Error('useGameSoundsContext must be used within GameSoundsProvider');
  }
  return context;
}
