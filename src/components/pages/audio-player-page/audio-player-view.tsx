// Audio Player View - Main audio playback interface

import { useRef, useState } from 'react';
import { ChevronLeft, Music, Play, Pause, SkipBack, SkipForward, Repeat, Type, Volume2 } from 'lucide-react';
import { LEVEL_THEMES } from '../../../constants/themes';
import { LISTENING_LESSON_TYPES } from '../../../hooks/use-listening';
import { useKaiwaCharacters, createUtteranceForCharacter } from '../../../hooks/use-kaiwa-characters';
import { FuriganaText } from '../../common/furigana-text';
import { removeFurigana } from '../../../lib/furigana-utils';
import { TYPE_THEMES } from './audio-player-types';
import type { JLPTLevel } from '../../../types/flashcard';
import type { ListeningLessonType, ListeningAudio } from '../../../types/listening';

interface AudioPlayerViewProps {
  selectedLevel: JLPTLevel;
  selectedLesson: number;
  selectedType: ListeningLessonType;
  currentAudios: ListeningAudio[];
  getAudioUrl: (audio: ListeningAudio) => Promise<string | null>;
  onBack: () => void;
}

export function AudioPlayerView({
  selectedLevel,
  selectedLesson,
  selectedType,
  currentAudios,
  getAudioUrl,
  onBack,
}: AudioPlayerViewProps) {
  const { getCharacterByName } = useKaiwaCharacters();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const currentAudio = currentAudios[currentAudioIndex] || null;
  const theme = LEVEL_THEMES[selectedLevel];
  const typeLabel = LISTENING_LESSON_TYPES.find(t => t.value === selectedType)?.label || '';

  const stopAudio = () => {
    speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const playAudio = async (audio: ListeningAudio) => {
    if (audio.isTextToSpeech) {
      speechSynthesis.cancel();
      setIsPlaying(true);

      if (audio.ttsMode === 'kaiwa' && audio.kaiwaLines?.length) {
        let idx = 0;
        const speakNext = () => {
          if (idx >= audio.kaiwaLines!.length) { setIsPlaying(false); return; }
          const line = audio.kaiwaLines![idx++];
          const character = getCharacterByName(line.speaker);
          const utterance = createUtteranceForCharacter(removeFurigana(line.text), character, playbackSpeed * 0.9);
          utterance.onend = speakNext;
          utterance.onerror = () => setIsPlaying(false);
          speechSynthesis.speak(utterance);
        };
        speakNext();
      } else if (audio.textContent) {
        const utterance = new SpeechSynthesisUtterance(removeFurigana(audio.textContent));
        utterance.lang = 'ja-JP';
        utterance.rate = playbackSpeed * 0.9;
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        speechSynthesis.speak(utterance);
      }
      return;
    }
    const url = await getAudioUrl(audio);
    if (url && audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const togglePlay = async () => {
    if (!currentAudio) return;
    if (isPlaying) {
      if (currentAudio.isTextToSpeech) {
        speechSynthesis.cancel();
      } else {
        audioRef.current?.pause();
      }
      setIsPlaying(false);
    } else {
      if (currentAudio.isTextToSpeech) {
        await playAudio(currentAudio);
      } else if (audioRef.current?.src) {
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        await playAudio(currentAudio);
      }
    }
  };

  const goToNext = () => {
    if (currentAudioIndex < currentAudios.length - 1) {
      const nextIdx = currentAudioIndex + 1;
      setCurrentAudioIndex(nextIdx);
      setCurrentTime(0);
      playAudio(currentAudios[nextIdx]);
    } else if (isLooping && currentAudios.length > 0) {
      setCurrentAudioIndex(0);
      setCurrentTime(0);
      playAudio(currentAudios[0]);
    }
  };

  const goToPrevious = () => {
    if (currentAudioIndex > 0) {
      const prevIdx = currentAudioIndex - 1;
      setCurrentAudioIndex(prevIdx);
      setCurrentTime(0);
      playAudio(currentAudios[prevIdx]);
    } else if (isLooping && currentAudios.length > 0) {
      const lastIdx = currentAudios.length - 1;
      setCurrentAudioIndex(lastIdx);
      setCurrentTime(0);
      playAudio(currentAudios[lastIdx]);
    }
  };

  const selectAudioByIndex = (idx: number) => {
    setCurrentAudioIndex(idx);
    setCurrentTime(0);
    playAudio(currentAudios[idx]);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleEnded = () => {
    if (currentAudioIndex < currentAudios.length - 1) {
      goToNext();
    } else if (isLooping) {
      setCurrentAudioIndex(0);
      setCurrentTime(0);
      playAudio(currentAudios[0]);
    } else {
      setIsPlaying(false);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) audioRef.current.playbackRate = speed;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBackClick = () => {
    stopAudio();
    onBack();
  };

  return (
    <div className="practice-content audio-player-mode">
      <div className="practice-header">
        <button className="btn-back" onClick={handleBackClick}>
          <ChevronLeft size={20} />
        </button>
        <span className="current-level" style={{ background: theme.gradient }}>
          {selectedLevel} - Bài {selectedLesson}
        </span>
        <span className="current-type" style={{ background: TYPE_THEMES[selectedType].gradient }}>
          {typeLabel}
        </span>
      </div>

      {currentAudio ? (
        <div className="now-playing">
          <div className="now-playing-info">
            <h3>
              {currentAudio.isTextToSpeech && (
                <Volume2 size={18} style={{ marginRight: 6, verticalAlign: 'middle', opacity: 0.7 }} />
              )}
              {currentAudio.title}
            </h3>
            {currentAudio.description && <p>{currentAudio.description}</p>}
            <span className="track-counter">
              {currentAudioIndex + 1} / {currentAudios.length}
            </span>
          </div>

          {currentAudio.isTextToSpeech && currentAudio.ttsMode === 'kaiwa' && currentAudio.kaiwaLines?.length ? (
            <div className="tts-text-content kaiwa-display">
              {currentAudio.kaiwaLines.map((line, i) => (
                <div key={i} className="kaiwa-display-line">
                  <strong className="kaiwa-speaker">{line.speaker}</strong>
                  <span><FuriganaText text={line.text} showFurigana={true} /></span>
                </div>
              ))}
            </div>
          ) : currentAudio.isTextToSpeech && currentAudio.textContent ? (
            <div className="tts-text-content">
              <FuriganaText text={currentAudio.textContent} showFurigana={true} />
            </div>
          ) : null}

          {!currentAudio.isTextToSpeech && (
            <div className="audio-progress">
              <span className="time">{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="progress-slider"
              />
              <span className="time">{formatTime(duration)}</span>
            </div>
          )}

          <div className="playback-controls">
            <button
              className={`control-btn ${isLooping ? 'active' : ''}`}
              onClick={() => setIsLooping(l => !l)}
            >
              <Repeat size={20} />
            </button>
            <button className="control-btn" onClick={goToPrevious}>
              <SkipBack size={20} />
            </button>
            <button className="control-btn play-btn" onClick={togglePlay}>
              {isPlaying ? <Pause size={32} /> : <Play size={32} />}
            </button>
            <button className="control-btn" onClick={goToNext}>
              <SkipForward size={20} />
            </button>
            <div className="speed-indicator" onClick={() => handleSpeedChange(playbackSpeed >= 2 ? 0.5 : playbackSpeed + 0.25)}>
              {playbackSpeed}x
            </div>
          </div>

          <div className="speed-buttons">
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
              <button
                key={speed}
                className={`speed-btn ${playbackSpeed === speed ? 'active' : ''}`}
                onClick={() => handleSpeedChange(speed)}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <Music size={48} />
          <p>Chưa có file nghe nào</p>
          <p className="hint">Thêm file nghe ở mục Quản lí</p>
        </div>
      )}

      {currentAudios.length > 0 && (
        <div className="audio-track-list">
          <h4>Danh sách ({currentAudios.length})</h4>
          {currentAudios.map((audio, idx) => (
            <button
              key={audio.id}
              className={`track-item ${idx === currentAudioIndex ? 'active' : ''}`}
              onClick={() => selectAudioByIndex(idx)}
            >
              <span className="track-number">{idx + 1}</span>
              {idx === currentAudioIndex && isPlaying ? (
                <Pause size={16} className="track-play-icon" />
              ) : audio.isTextToSpeech ? (
                <Type size={16} className="track-play-icon" />
              ) : (
                <Play size={16} className="track-play-icon" />
              )}
              <div className="track-info">
                <span className="track-title">{audio.title}</span>
                {audio.description && <span className="track-desc">{audio.description}</span>}
              </div>
              {audio.isTextToSpeech ? (
                <span className="track-duration tts-badge">TTS</span>
              ) : audio.duration > 0 ? (
                <span className="track-duration">{formatTime(audio.duration)}</span>
              ) : null}
            </button>
          ))}
        </div>
      )}

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
    </div>
  );
}
