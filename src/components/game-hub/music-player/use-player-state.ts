// Player state management hook

import { useState, useMemo, useRef } from 'react';
import {
  MUSIC_TRACKS,
  MUSIC_CATEGORY_LABELS,
  type MusicCategory,
  type MusicTrack,
} from '../../../hooks/use-game-sounds';
import type { RepeatMode } from './types';

interface PlayerSettings {
  musicTrack: string;
  customMusicTracks: MusicTrack[];
  [key: string]: unknown;
}

export function usePlayerState(allTracks: MusicTrack[], settings: PlayerSettings) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTrackList, setShowTrackList] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [selectedCategory, setSelectedCategory] = useState<MusicCategory | 'all'>('all');
  const [isHovering, setIsHovering] = useState(false);
  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Get current track info
  const selectedTrack = useMemo(() => {
    return allTracks.find(t => t.id === settings.musicTrack) || MUSIC_TRACKS[0];
  }, [allTracks, settings.musicTrack]);

  // Filter tracks by category
  const filteredTracks = useMemo(() => {
    if (selectedCategory === 'all') return allTracks;
    return allTracks.filter(t => t.category === selectedCategory);
  }, [allTracks, selectedCategory]);

  // Get track index for next/previous
  const currentTrackIndex = useMemo(() => {
    return filteredTracks.findIndex(t => t.id === settings.musicTrack);
  }, [filteredTracks, settings.musicTrack]);

  // Categories with counts
  const categories = useMemo(() => {
    const cats: { value: MusicCategory | 'all'; label: string; count: number }[] = [
      { value: 'all', label: '🎵 Tất cả', count: allTracks.length },
    ];
    const categoryKeys: MusicCategory[] = ['epic', 'chill', 'action', 'fun', 'japanese', 'custom'];
    categoryKeys.forEach(cat => {
      const count = allTracks.filter(t => t.category === cat).length;
      if (count > 0) {
        cats.push({ value: cat, label: MUSIC_CATEGORY_LABELS[cat], count });
      }
    });
    return cats;
  }, [allTracks]);

  // Count custom tracks
  const customTrackCount = settings.customMusicTracks.length;

  return {
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
  };
}
