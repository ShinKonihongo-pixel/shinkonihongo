// Track management logic hook

import { useState, useCallback } from 'react';

interface UseTrackManagementProps {
  addCustomTrack: (track: any) => void;
  removeCustomTrack: (trackId: string) => void;
  setSelectedCategory: (category: any) => void;
}

export function useTrackManagement({
  addCustomTrack,
  removeCustomTrack,
  setSelectedCategory,
}: UseTrackManagementProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTrackUrl, setNewTrackUrl] = useState('');
  const [newTrackName, setNewTrackName] = useState('');
  const [newTrackEmoji, setNewTrackEmoji] = useState('🎵');
  const [urlError, setUrlError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  // Validate URL is audio
  const validateAudioUrl = useCallback(async (url: string): Promise<boolean> => {
    // Check basic URL format
    try {
      new URL(url);
    } catch {
      setUrlError('URL không hợp lệ');
      return false;
    }

    // Check common audio extensions
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.webm'];
    const hasAudioExt = audioExtensions.some(ext => url.toLowerCase().includes(ext));

    // Also accept common streaming/CDN patterns
    const isLikelyAudio = hasAudioExt ||
      url.includes('soundcloud.com') ||
      url.includes('pixabay.com/music') ||
      url.includes('mixkit.co') ||
      url.includes('freemusicarchive.org') ||
      url.includes('uppbeat.io');

    if (!isLikelyAudio) {
      setUrlError('URL phải là file âm thanh (.mp3, .wav, .ogg, .m4a)');
      return false;
    }

    setUrlError('');
    return true;
  }, []);

  // Handle add custom track
  const handleAddCustomTrack = useCallback(async () => {
    if (!newTrackUrl.trim() || !newTrackName.trim()) {
      setUrlError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setIsValidating(true);
    const isValid = await validateAudioUrl(newTrackUrl.trim());
    setIsValidating(false);

    if (!isValid) return;

    // Generate unique ID
    const trackId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    addCustomTrack({
      id: trackId,
      name: newTrackName.trim(),
      emoji: newTrackEmoji,
      url: newTrackUrl.trim(),
      duration: '?:??',
    });

    // Reset form
    setNewTrackUrl('');
    setNewTrackName('');
    setNewTrackEmoji('🎵');
    setShowAddModal(false);

    // Switch to custom category to show new track
    setSelectedCategory('custom');
  }, [newTrackUrl, newTrackName, newTrackEmoji, validateAudioUrl, addCustomTrack, setSelectedCategory]);

  // Handle remove custom track
  const handleRemoveTrack = useCallback((trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Xóa bài hát này?')) {
      removeCustomTrack(trackId);
    }
  }, [removeCustomTrack]);

  return {
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
  };
}
