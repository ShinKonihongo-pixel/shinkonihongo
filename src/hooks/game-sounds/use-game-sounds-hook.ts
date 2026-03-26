// Main game sounds hook — manages sound effects and background music
// Uses Web Audio API for procedural sounds, HTML5 Audio for file-based tracks

import { useRef, useCallback, useEffect, useState, useMemo, createContext, useContext, createElement, type ReactNode } from 'react';
import type { SoundEffectType, MusicTrack, CustomSoundEffect, GameSoundSettings } from './sound-configs';
import { SOUND_CONFIGS, MUSIC_TRACKS, STORAGE_KEY, DEFAULT_SETTINGS } from './sound-configs';
import { createBackgroundMusic } from './music-generator';

export interface UseGameSoundsReturn {
  playSound: (type: SoundEffectType) => void;
  playCorrect: () => void;
  playWrong: () => void;
  playVictory: () => void;
  playDefeat: () => void;
  playCountdown: () => void;
  playStart: () => void;
  playPowerUp: () => void;
  playClick: () => void;
  startMusic: () => void;
  stopMusic: () => void;
  toggleMusic: () => void;
  isMusicPlaying: boolean;
  currentTrack: MusicTrack | null;
  settings: GameSoundSettings;
  updateSettings: (newSettings: Partial<GameSoundSettings>) => void;
  toggleSound: () => void;
  toggleMusicEnabled: () => void;
  addCustomTrack: (track: Omit<MusicTrack, 'category'>) => void;
  removeCustomTrack: (trackId: string) => void;
  allTracks: MusicTrack[];
  setCustomSound: (type: 'correct' | 'wrong' | 'victory' | 'defeat', sound: CustomSoundEffect | null) => void;
  getCustomSound: (type: 'correct' | 'wrong' | 'victory' | 'defeat') => CustomSoundEffect | undefined;
}

export function useGameSounds(): UseGameSoundsReturn {
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicOscillatorsRef = useRef<OscillatorNode[]>([]);
  const musicLfoRef = useRef<OscillatorNode[]>([]);
  const musicGainRef = useRef<GainNode | null>(null);
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);

  // Settings state with localStorage persistence
  const [settings, setSettings] = useState<GameSoundSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch { /* ignore */ }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
  }, [settings]);

  // Initialize AudioContext on first user interaction
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // Play custom audio file
  const playCustomAudio = useCallback((url: string, volume: number) => {
    try {
      const audio = new Audio(url);
      audio.volume = volume;
      audio.play().catch(err => console.warn('Custom audio playback failed:', err));
    } catch (error) {
      console.warn('Failed to play custom audio:', error);
    }
  }, []);

  // Play sound effect using Web Audio API or custom audio
  const playSound = useCallback((type: SoundEffectType) => {
    if (!settings.soundEnabled) return;

    const customSoundMap: Record<string, CustomSoundEffect | undefined> = {
      correct: settings.customCorrectSound,
      wrong: settings.customWrongSound,
      victory: settings.customVictorySound,
      defeat: settings.customDefeatSound,
    };

    const customSound = customSoundMap[type];
    if (customSound?.url) {
      playCustomAudio(customSound.url, settings.soundVolume / 100);
      return;
    }

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
        startTime += config.durations[i] * 0.8;
      });
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }, [settings.soundEnabled, settings.soundVolume, settings.customCorrectSound, settings.customWrongSound, settings.customVictorySound, settings.customDefeatSound, getAudioContext, playCustomAudio]);

  // Convenience play methods
  const playCorrect = useCallback(() => playSound('correct'), [playSound]);
  const playWrong = useCallback(() => playSound('wrong'), [playSound]);
  const playVictory = useCallback(() => playSound('victory'), [playSound]);
  const playDefeat = useCallback(() => playSound('defeat'), [playSound]);
  const playCountdown = useCallback(() => playSound('countdown'), [playSound]);
  const playStart = useCallback(() => playSound('start'), [playSound]);
  const playPowerUp = useCallback(() => playSound('powerup'), [playSound]);
  const playClick = useCallback(() => playSound('click'), [playSound]);

  // All available tracks (built-in + custom)
  const allTracks = useMemo(
    () => [...MUSIC_TRACKS, ...settings.customMusicTracks],
    [settings.customMusicTracks]
  );

  const findTrack = useCallback((trackId: string): MusicTrack | null => {
    return allTracks.find(t => t.id === trackId) || null;
  }, [allTracks]);

  // Start background music — currently disabled (early return)
  const startMusic = useCallback(() => {
    return;
    // eslint-disable-next-line no-unreachable
    try {
      const track = findTrack(settings.musicTrack);
      if (!track) return;
      setCurrentTrack(track);

      if (track.url) {
        if (htmlAudioRef.current) htmlAudioRef.current.pause();
        const audio = new Audio(track.url);
        audio.loop = true;
        audio.volume = settings.musicVolume / 100;
        audio.play().catch(err => console.warn('Audio playback failed:', err));
        htmlAudioRef.current = audio;
        setIsMusicPlaying(true);
      } else {
        const audioContext = getAudioContext();
        musicOscillatorsRef.current.forEach(osc => { try { osc.stop(); } catch { /* ignore */ } });
        musicLfoRef.current.forEach(lfo => { try { lfo.stop(); } catch { /* ignore */ } });
        const { oscillators, gainNode, lfoNodes } = createBackgroundMusic(audioContext, settings.musicTrack, settings.customMusicTracks);
        gainNode.gain.value = (settings.musicVolume / 100) * 0.15;
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
    if (htmlAudioRef.current) { htmlAudioRef.current.pause(); htmlAudioRef.current = null; }
    musicOscillatorsRef.current.forEach(osc => { try { osc.stop(); } catch { /* ignore */ } });
    musicLfoRef.current.forEach(lfo => { try { lfo.stop(); } catch { /* ignore */ } });
    musicOscillatorsRef.current = [];
    musicLfoRef.current = [];
    musicGainRef.current = null;
    setIsMusicPlaying(false);
    setCurrentTrack(null);
  }, []);

  const toggleMusic = useCallback(() => {
    if (isMusicPlaying) stopMusic(); else startMusic();
  }, [isMusicPlaying, startMusic, stopMusic]);

  // Real-time music volume sync
  useEffect(() => {
    if (musicGainRef.current) musicGainRef.current.gain.value = (settings.musicVolume / 100) * 0.15;
    if (htmlAudioRef.current) htmlAudioRef.current.volume = settings.musicVolume / 100;
  }, [settings.musicVolume]);

  // Stop music when disabled
  useEffect(() => {
    if (!settings.musicEnabled && isMusicPlaying) stopMusic();
  }, [settings.musicEnabled, isMusicPlaying, stopMusic]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopMusic(); if (audioContextRef.current) audioContextRef.current.close(); };
  }, [stopMusic]);

  // Settings management
  const updateSettings = useCallback((newSettings: Partial<GameSoundSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);
  const toggleSound = useCallback(() => { setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled })); }, []);
  const toggleMusicEnabled = useCallback(() => { setSettings(prev => ({ ...prev, musicEnabled: !prev.musicEnabled })); }, []);

  // Custom tracks management
  const addCustomTrack = useCallback((track: Omit<MusicTrack, 'category'>) => {
    setSettings(prev => ({ ...prev, customMusicTracks: [...prev.customMusicTracks, { ...track, category: 'custom' }] }));
  }, []);
  const removeCustomTrack = useCallback((trackId: string) => {
    setSettings(prev => ({
      ...prev,
      customMusicTracks: prev.customMusicTracks.filter(t => t.id !== trackId),
      musicTrack: prev.musicTrack === trackId ? '' : prev.musicTrack,
    }));
  }, []);

  // Custom sound effects management
  const setCustomSound = useCallback((type: 'correct' | 'wrong' | 'victory' | 'defeat', sound: CustomSoundEffect | null) => {
    const keyMap: Record<string, keyof GameSoundSettings> = { correct: 'customCorrectSound', wrong: 'customWrongSound', victory: 'customVictorySound', defeat: 'customDefeatSound' };
    setSettings(prev => ({ ...prev, [keyMap[type]]: sound || undefined }));
  }, []);
  const getCustomSound = useCallback((type: 'correct' | 'wrong' | 'victory' | 'defeat'): CustomSoundEffect | undefined => {
    const m: Record<string, CustomSoundEffect | undefined> = { correct: settings.customCorrectSound, wrong: settings.customWrongSound, victory: settings.customVictorySound, defeat: settings.customDefeatSound };
    return m[type];
  }, [settings.customCorrectSound, settings.customWrongSound, settings.customVictorySound, settings.customDefeatSound]);

  return {
    playSound, playCorrect, playWrong, playVictory, playDefeat, playCountdown, playStart, playPowerUp, playClick,
    startMusic, stopMusic, toggleMusic, isMusicPlaying, currentTrack,
    settings, updateSettings, toggleSound, toggleMusicEnabled,
    addCustomTrack, removeCustomTrack, allTracks, setCustomSound, getCustomSound,
  };
}

// Singleton context for sharing game sounds across components
const GameSoundsContext = createContext<UseGameSoundsReturn | null>(null);

export function GameSoundsProvider({ children }: { children: ReactNode }) {
  const gameSounds = useGameSounds();
  return createElement(GameSoundsContext.Provider, { value: gameSounds }, children);
}

export function useGameSoundsContext(): UseGameSoundsReturn {
  const context = useContext(GameSoundsContext);
  if (!context) throw new Error('useGameSoundsContext must be used within GameSoundsProvider');
  return context;
}
