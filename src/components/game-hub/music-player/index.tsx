// Floating Music Player - Premium game background music controller
// Professional Spotify-like interface with visualizer and advanced controls

import { useEffect, useCallback } from 'react';
import { useGameSounds } from '../../../hooks/use-game-sounds';
import { MiniPlayer } from './mini-player';
import { NowPlaying } from './now-playing';
import { PlayerControls } from './player-controls';
import { VolumeControl } from './volume-control';
import { TrackList } from './track-list';
import { AddTrackModal } from './add-track-modal';
import { PlayerHeader, TrackListToggle, KeyboardShortcutsHint } from './player-header';
import { usePlayerKeyboard } from './use-player-keyboard';
import { usePlayerState } from './use-player-state';
import { usePlaybackControl } from './use-playback-control';
import { useTrackManagement } from './use-track-management';
import type { FloatingMusicPlayerProps } from './types';

export function FloatingMusicPlayer({ onClose }: FloatingMusicPlayerProps) {
  const {
    settings,
    updateSettings,
    startMusic,
    stopMusic,
    isMusicPlaying,
    allTracks,
    addCustomTrack,
    removeCustomTrack,
  } = useGameSounds();

  const {
    isExpanded,
    setIsExpanded,
    showTrackList,
    setShowTrackList,
    isShuffling,
    setIsShuffling,
    repeatMode,
    setRepeatMode,
    selectedCategory,
    setSelectedCategory,
    isHovering,
    setIsHovering,
    autoHideTimerRef,
    selectedTrack,
    filteredTracks,
    currentTrackIndex,
    categories,
    customTrackCount,
  } = usePlayerState(allTracks, settings);

  const {
    handlePlayPause,
    handleNextTrack,
    handlePrevTrack,
    handleSelectTrack,
    handleToggleMute,
    handleVolumeChange,
    handleSetVolume,
  } = usePlaybackControl({
    isMusicPlaying,
    settings,
    updateSettings,
    startMusic,
    stopMusic,
    filteredTracks,
    currentTrackIndex,
    isShuffling,
    setShowTrackList,
  });

  const {
    showAddModal,
    setShowAddModal,
    newTrackUrl,
    setNewTrackUrl,
    newTrackName,
    setNewTrackName,
    newTrackEmoji,
    setNewTrackEmoji,
    urlError,
    setUrlError,
    isValidating,
    handleAddCustomTrack,
    handleRemoveTrack,
  } = useTrackManagement({
    addCustomTrack,
    removeCustomTrack,
    setSelectedCategory,
  });

  // Auto-hide when not hovering (mini mode only)
  useEffect(() => {
    if (!isExpanded && !isHovering && isMusicPlaying) {
      autoHideTimerRef.current = setTimeout(() => {
        // Could add auto-hide logic here
      }, 5000);
    }
    return () => {
      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
    };
  }, [isExpanded, isHovering, isMusicPlaying, autoHideTimerRef]);

  const handleToggleRepeat = useCallback(() => {
    setRepeatMode(prev =>
      prev === 'none' ? 'all' : prev === 'all' ? 'one' : 'none'
    );
  }, [setRepeatMode]);

  // Keyboard shortcuts
  usePlayerKeyboard({
    isExpanded,
    musicVolume: settings.musicVolume,
    onPlayPause: handlePlayPause,
    onNextTrack: handleNextTrack,
    onPrevTrack: handlePrevTrack,
    onVolumeUp: () => updateSettings({ musicVolume: Math.min(100, settings.musicVolume + 10) }),
    onVolumeDown: () => updateSettings({ musicVolume: Math.max(0, settings.musicVolume - 10) }),
    onToggleMute: handleToggleMute,
    onCollapse: () => setIsExpanded(false),
  });

  // Minimized view - compact floating button with visualizer
  if (!isExpanded) {
    return (
      <MiniPlayer
        isMusicPlaying={isMusicPlaying}
        isHovering={isHovering}
        onExpand={() => setIsExpanded(true)}
        onPlayPause={handlePlayPause}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      />
    );
  }

  return (
    <div
      className={`floating-player fp-pro ${showTrackList ? 'fp-expanded' : ''}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <PlayerHeader onClose={onClose} onMinimize={() => setIsExpanded(false)} />

      <NowPlaying track={selectedTrack} isPlaying={isMusicPlaying} />

      <PlayerControls
        isPlaying={isMusicPlaying}
        isShuffling={isShuffling}
        repeatMode={repeatMode}
        onPlayPause={handlePlayPause}
        onPrevTrack={handlePrevTrack}
        onNextTrack={handleNextTrack}
        onToggleShuffle={() => setIsShuffling(!isShuffling)}
        onToggleRepeat={handleToggleRepeat}
      />

      <VolumeControl
        volume={settings.musicVolume}
        enabled={settings.musicEnabled}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onSetVolume={handleSetVolume}
      />

      <TrackListToggle
        showTrackList={showTrackList}
        onToggleTrackList={() => setShowTrackList(!showTrackList)}
        onShowAddModal={() => setShowAddModal(true)}
      />

      {showTrackList && (
        <TrackList
          tracks={filteredTracks}
          categories={categories}
          selectedCategory={selectedCategory}
          selectedTrackId={settings.musicTrack}
          isPlaying={isMusicPlaying}
          customTrackCount={customTrackCount}
          onSelectCategory={setSelectedCategory}
          onSelectTrack={handleSelectTrack}
          onRemoveTrack={handleRemoveTrack}
          onShowAddModal={() => setShowAddModal(true)}
        />
      )}

      <KeyboardShortcutsHint />

      <AddTrackModal
        show={showAddModal}
        trackName={newTrackName}
        trackUrl={newTrackUrl}
        trackEmoji={newTrackEmoji}
        urlError={urlError}
        isValidating={isValidating}
        onClose={() => setShowAddModal(false)}
        onSetTrackName={setNewTrackName}
        onSetTrackUrl={(url) => {
          setNewTrackUrl(url);
          setUrlError('');
        }}
        onSetTrackEmoji={setNewTrackEmoji}
        onSubmit={handleAddCustomTrack}
      />
    </div>
  );
}

export { type FloatingMusicPlayerProps };
