// Playback control logic hook

import { useCallback } from 'react';
import type { MusicTrack } from '../../../hooks/use-game-sounds';

interface GameSoundSettings {
  musicEnabled: boolean;
  musicVolume: number;
  musicTrack: string;
  [key: string]: unknown;
}

interface UsePlaybackControlProps {
  isMusicPlaying: boolean;
  settings: GameSoundSettings;
  updateSettings: (settings: Partial<GameSoundSettings>) => void;
  startMusic: () => void;
  stopMusic: () => void;
  filteredTracks: MusicTrack[];
  currentTrackIndex: number;
  isShuffling: boolean;
  setShowTrackList: (show: boolean) => void;
}

export function usePlaybackControl({
  isMusicPlaying,
  settings,
  updateSettings,
  startMusic,
  stopMusic,
  filteredTracks,
  currentTrackIndex,
  isShuffling,
  setShowTrackList,
}: UsePlaybackControlProps) {
  // Toggle play/pause
  const handlePlayPause = useCallback(() => {
    if (isMusicPlaying) {
      stopMusic();
    } else {
      // Enable music if disabled
      if (!settings.musicEnabled) {
        updateSettings({ musicEnabled: true });
      }
      startMusic();
    }
  }, [isMusicPlaying, settings.musicEnabled, startMusic, stopMusic, updateSettings]);

  // Get next track (considering shuffle)
  const getNextTrackIndex = useCallback(() => {
    if (isShuffling) {
      return Math.floor(Math.random() * filteredTracks.length);
    }
    return (currentTrackIndex + 1) % filteredTracks.length;
  }, [isShuffling, currentTrackIndex, filteredTracks.length]);

  // Next track
  const handleNextTrack = useCallback(() => {
    const nextIndex = getNextTrackIndex();
    const wasPlaying = isMusicPlaying;
    if (wasPlaying) stopMusic();
    updateSettings({ musicTrack: filteredTracks[nextIndex].id });
    setTimeout(() => {
      if (wasPlaying) startMusic();
    }, 100);
  }, [getNextTrackIndex, isMusicPlaying, filteredTracks, stopMusic, updateSettings, startMusic]);

  // Previous track
  const handlePrevTrack = useCallback(() => {
    const prevIndex = currentTrackIndex === 0 ? filteredTracks.length - 1 : currentTrackIndex - 1;
    const wasPlaying = isMusicPlaying;
    if (wasPlaying) stopMusic();
    updateSettings({ musicTrack: filteredTracks[prevIndex].id });
    setTimeout(() => {
      if (wasPlaying) startMusic();
    }, 100);
  }, [currentTrackIndex, filteredTracks, isMusicPlaying, stopMusic, updateSettings, startMusic]);

  // Select specific track
  const handleSelectTrack = useCallback((track: MusicTrack) => {
    const wasPlaying = isMusicPlaying;
    if (wasPlaying) stopMusic();
    updateSettings({ musicTrack: track.id });
    setShowTrackList(false);
    setTimeout(() => {
      if (wasPlaying || !isMusicPlaying) {
        if (!settings.musicEnabled) updateSettings({ musicEnabled: true });
        startMusic();
      }
    }, 100);
  }, [isMusicPlaying, settings.musicEnabled, stopMusic, updateSettings, startMusic, setShowTrackList]);

  // Toggle mute
  const handleToggleMute = useCallback(() => {
    updateSettings({ musicEnabled: !settings.musicEnabled });
    if (settings.musicEnabled && isMusicPlaying) {
      stopMusic();
    }
  }, [settings.musicEnabled, isMusicPlaying, updateSettings, stopMusic]);

  // Volume change
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseInt(e.target.value, 10);
    updateSettings({ musicVolume: vol });
    // Auto-enable if adjusting volume
    if (!settings.musicEnabled && vol > 0) {
      updateSettings({ musicEnabled: true });
    }
  }, [settings.musicEnabled, updateSettings]);

  const handleSetVolume = useCallback((volume: number) => {
    updateSettings({ musicVolume: volume, musicEnabled: true });
  }, [updateSettings]);

  return {
    handlePlayPause,
    handleNextTrack,
    handlePrevTrack,
    handleSelectTrack,
    handleToggleMute,
    handleVolumeChange,
    handleSetVolume,
  };
}
