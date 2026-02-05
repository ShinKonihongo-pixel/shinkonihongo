// Hook for managing custom audio playback
import { useState, useRef, useCallback } from 'react';

export function useCustomAudio() {
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customAudioName, setCustomAudioName] = useState('');
  const [abRepeatStart, setAbRepeatStart] = useState<number | null>(null);
  const [abRepeatEnd, setAbRepeatEnd] = useState<number | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const audioRef = useRef<HTMLAudioElement>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('audio/')) {
      alert('Vui lòng chọn file âm thanh');
      return;
    }
    setCustomAudioUrl(URL.createObjectURL(file));
    setCustomAudioName(file.name);
    setAbRepeatStart(null);
    setAbRepeatEnd(null);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setAudioCurrentTime(audioRef.current.currentTime);
      if (abRepeatEnd !== null && audioRef.current.currentTime >= abRepeatEnd) {
        audioRef.current.currentTime = abRepeatStart || 0;
      }
    }
  }, [abRepeatStart, abRepeatEnd]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) setAudioDuration(audioRef.current.duration);
  }, []);

  const handleEnded = useCallback(() => {
    if (isLooping && audioRef.current) {
      audioRef.current.currentTime = abRepeatStart || 0;
      audioRef.current.play();
    } else {
      setIsPlaying(false);
    }
  }, [isLooping, abRepeatStart]);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time;
  }, []);

  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, []);

  const setAbStart = useCallback(() => {
    setAbRepeatStart(audioCurrentTime);
  }, [audioCurrentTime]);

  const setAbEnd = useCallback(() => {
    setAbRepeatEnd(audioCurrentTime);
  }, [audioCurrentTime]);

  const clearAb = useCallback(() => {
    setAbRepeatStart(null);
    setAbRepeatEnd(null);
  }, []);

  return {
    audioRef,
    customAudioUrl,
    customAudioName,
    abRepeatStart,
    abRepeatEnd,
    audioDuration,
    audioCurrentTime,
    isPlaying,
    isLooping,
    playbackSpeed,
    setIsLooping,
    handleFileUpload,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleEnded,
    seekTo,
    togglePlay,
    handleSpeedChange,
    setAbStart,
    setAbEnd,
    clearAb,
  };
}
