// Hook for managing game sound effects and background music
// Professional game audio system with volume control and track selection

import { useRef, useCallback, useEffect, useState } from 'react';

// Sound effect types
export type SoundEffectType = 'correct' | 'wrong' | 'victory' | 'defeat' | 'countdown' | 'start' | 'powerup' | 'click';

// Background music tracks - Free game music URLs (royalty-free)
export interface MusicTrack {
  id: string;
  name: string;
  category: 'epic' | 'chill' | 'action' | 'fun';
  emoji: string;
}

export const MUSIC_TRACKS: MusicTrack[] = [
  // Epic/Dramatic
  { id: 'epic-battle', name: 'Epic Battle', category: 'epic', emoji: '🔥' },
  { id: 'victory-fanfare', name: 'Victory Fanfare', category: 'epic', emoji: '🏆' },
  { id: 'hero-theme', name: 'Hero Theme', category: 'epic', emoji: '⚔️' },

  // Chill/Relaxed
  { id: 'chill-study', name: 'Chill Study', category: 'chill', emoji: '🎵' },
  { id: 'lofi-beats', name: 'Lo-Fi Beats', category: 'chill', emoji: '☕' },
  { id: 'peaceful-piano', name: 'Peaceful Piano', category: 'chill', emoji: '🎹' },

  // Action/Intense
  { id: 'race-adrenaline', name: 'Race Adrenaline', category: 'action', emoji: '🏎️' },
  { id: 'countdown-pulse', name: 'Countdown Pulse', category: 'action', emoji: '⏱️' },
  { id: 'chase-music', name: 'Chase Music', category: 'action', emoji: '🚀' },

  // Fun/Playful
  { id: 'happy-game', name: 'Happy Game', category: 'fun', emoji: '🎮' },
  { id: 'party-time', name: 'Party Time', category: 'fun', emoji: '🎉' },
  { id: 'quirky-adventure', name: 'Quirky Adventure', category: 'fun', emoji: '🌟' },
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

// Background music generator using Web Audio API
function createBackgroundMusic(audioContext: AudioContext, trackId: string): { oscillators: OscillatorNode[]; gainNode: GainNode } {
  const gainNode = audioContext.createGain();
  gainNode.connect(audioContext.destination);
  gainNode.gain.value = 0.1;

  const oscillators: OscillatorNode[] = [];

  // Different music patterns based on track category
  const track = MUSIC_TRACKS.find(t => t.id === trackId);
  const category = track?.category || 'chill';

  // Base frequencies for different moods
  const patterns: Record<string, number[]> = {
    epic: [130.81, 164.81, 196, 261.63], // C3, E3, G3, C4
    chill: [261.63, 329.63, 392, 493.88], // C4, E4, G4, B4
    action: [196, 246.94, 293.66, 392], // G3, B3, D4, G4
    fun: [293.66, 369.99, 440, 554.37], // D4, F#4, A4, C#5
  };

  const freqs = patterns[category];

  freqs.forEach((freq, i) => {
    const osc = audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const oscGain = audioContext.createGain();
    oscGain.gain.value = 0.05 / (i + 1); // Quieter harmonics

    osc.connect(oscGain);
    oscGain.connect(gainNode);

    oscillators.push(osc);
  });

  return { oscillators, gainNode };
}

export interface GameSoundSettings {
  soundEnabled: boolean;
  soundVolume: number; // 0-100
  musicEnabled: boolean;
  musicVolume: number; // 0-100
  musicTrack: string;
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

  // Settings
  settings: GameSoundSettings;
  updateSettings: (newSettings: Partial<GameSoundSettings>) => void;
  toggleSound: () => void;
  toggleMusicEnabled: () => void;
}

const STORAGE_KEY = 'game-sound-settings';

const DEFAULT_SETTINGS: GameSoundSettings = {
  soundEnabled: true,
  soundVolume: 70,
  musicEnabled: false,
  musicVolume: 30,
  musicTrack: 'happy-game',
};

export function useGameSounds(): UseGameSoundsReturn {
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicOscillatorsRef = useRef<OscillatorNode[]>([]);
  const musicGainRef = useRef<GainNode | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

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

  // Start background music
  const startMusic = useCallback(() => {
    if (!settings.musicEnabled || isMusicPlaying) return;

    try {
      const audioContext = getAudioContext();

      // Stop any existing music
      musicOscillatorsRef.current.forEach(osc => {
        try { osc.stop(); } catch {}
      });

      const { oscillators, gainNode } = createBackgroundMusic(audioContext, settings.musicTrack);

      gainNode.gain.value = (settings.musicVolume / 100) * 0.15;

      oscillators.forEach(osc => osc.start());

      musicOscillatorsRef.current = oscillators;
      musicGainRef.current = gainNode;
      setIsMusicPlaying(true);
    } catch (error) {
      console.warn('Failed to start music:', error);
    }
  }, [settings.musicEnabled, settings.musicTrack, settings.musicVolume, isMusicPlaying, getAudioContext]);

  // Stop background music
  const stopMusic = useCallback(() => {
    musicOscillatorsRef.current.forEach(osc => {
      try { osc.stop(); } catch {}
    });
    musicOscillatorsRef.current = [];
    musicGainRef.current = null;
    setIsMusicPlaying(false);
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
    if (musicGainRef.current) {
      musicGainRef.current.gain.value = (settings.musicVolume / 100) * 0.15;
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
    settings,
    updateSettings,
    toggleSound,
    toggleMusicEnabled,
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
