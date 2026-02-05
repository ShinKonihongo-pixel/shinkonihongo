// Custom Audio View - Upload and practice with custom audio files
import { useRef } from 'react';
import { ChevronLeft, Upload, RotateCcw, Play, Pause, Repeat, Volume2 } from 'lucide-react';

interface CustomAudioViewProps {
  audioUrl: string | null;
  audioName: string;
  isPlaying: boolean;
  isLooping: boolean;
  playbackSpeed: number;
  currentTime: number;
  duration: number;
  abRepeatStart: number | null;
  abRepeatEnd: number | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onBack: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePlay: () => void;
  onToggleLoop: () => void;
  onSeek: (time: number) => void;
  onSpeedChange: (speed: number) => void;
  onSetAbStart: () => void;
  onSetAbEnd: () => void;
  onClearAb: () => void;
  onTimeUpdate: () => void;
  onLoadedMetadata: () => void;
  onEnded: () => void;
}

export function CustomAudioView({
  audioUrl,
  audioName,
  isPlaying,
  isLooping,
  playbackSpeed,
  currentTime,
  duration,
  abRepeatStart,
  abRepeatEnd,
  audioRef,
  onBack,
  onFileUpload,
  onTogglePlay,
  onToggleLoop,
  onSeek,
  onSpeedChange,
  onSetAbStart,
  onSetAbEnd,
  onClearAb,
  onTimeUpdate,
  onLoadedMetadata,
  onEnded,
}: CustomAudioViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="custom-audio-mode">
      <div className="vocab-header">
        <button className="btn-back" onClick={onBack}>
          <ChevronLeft size={20} />
        </button>
        <span className="current-level audio-mode">
          <Upload size={18} /> File Audio
        </span>
      </div>

      <div className="upload-section">
        <input
          type="file"
          ref={fileInputRef}
          accept="audio/*"
          onChange={onFileUpload}
          style={{ display: 'none' }}
        />
        <button
          className="btn btn-primary upload-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={18} /> Chọn file
        </button>
        {audioName && <span className="file-name">{audioName}</span>}
      </div>

      {audioUrl && (
        <>
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
            onEnded={onEnded}
          />

          <div className="audio-progress">
            <span className="time">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="progress-slider"
            />
            <span className="time">{formatTime(duration)}</span>
          </div>

          {(abRepeatStart !== null || abRepeatEnd !== null) && (
            <div className="ab-markers">
              <span>A: {abRepeatStart !== null ? formatTime(abRepeatStart) : '--:--'}</span>
              <span>B: {abRepeatEnd !== null ? formatTime(abRepeatEnd) : '--:--'}</span>
            </div>
          )}

          <div className="playback-controls">
            <button className="control-btn" onClick={() => onSeek(currentTime - 5)}>
              <RotateCcw size={20} />
            </button>
            <button className="control-btn play-btn" onClick={onTogglePlay}>
              {isPlaying ? <Pause size={32} /> : <Play size={32} />}
            </button>
            <button className="control-btn" onClick={() => onSeek(currentTime + 5)}>
              <RotateCcw size={20} style={{ transform: 'scaleX(-1)' }} />
            </button>
            <button
              className={`control-btn ${isLooping ? 'active' : ''}`}
              onClick={onToggleLoop}
            >
              <Repeat size={20} />
            </button>
          </div>

          <div className="ab-controls">
            <button className="btn btn-glass" onClick={onSetAbStart}>
              Đặt A
            </button>
            <button className="btn btn-glass" onClick={onSetAbEnd}>
              Đặt B
            </button>
            <button
              className="btn btn-glass"
              onClick={onClearAb}
              disabled={abRepeatStart === null && abRepeatEnd === null}
            >
              Xoá A-B
            </button>
          </div>

          <div className="speed-section">
            <label>Tốc độ:</label>
            <div className="speed-buttons">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                <button
                  key={speed}
                  className={`speed-btn ${playbackSpeed === speed ? 'active' : ''}`}
                  onClick={() => onSpeedChange(speed)}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {!audioUrl && (
        <div className="empty-state">
          <Volume2 size={48} />
          <p>Chọn file âm thanh để luyện nghe</p>
          <p className="hint">Hỗ trợ: MP3, WAV, OGG, M4A</p>
        </div>
      )}
    </div>
  );
}
