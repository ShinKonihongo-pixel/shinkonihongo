// Modal for adding custom tracks

import { Plus, X, Link, ExternalLink } from 'lucide-react';
import { MUSIC_SOURCES, EMOJI_OPTIONS } from './types';

interface AddTrackModalProps {
  show: boolean;
  trackName: string;
  trackUrl: string;
  trackEmoji: string;
  urlError: string;
  isValidating: boolean;
  onClose: () => void;
  onSetTrackName: (name: string) => void;
  onSetTrackUrl: (url: string) => void;
  onSetTrackEmoji: (emoji: string) => void;
  onSubmit: () => void;
}

export function AddTrackModal({
  show,
  trackName,
  trackUrl,
  trackEmoji,
  urlError,
  isValidating,
  onClose,
  onSetTrackName,
  onSetTrackUrl,
  onSetTrackEmoji,
  onSubmit,
}: AddTrackModalProps) {
  if (!show) return null;

  return (
    <div className="fp-modal-overlay" onClick={onClose}>
      <div className="fp-modal" onClick={e => e.stopPropagation()}>
        <div className="fp-modal-header">
          <h3>
            <Plus size={18} />
            Thêm nhạc tuỳ chỉnh
          </h3>
          <button className="fp-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="fp-modal-body">
          {/* Track name */}
          <div className="fp-form-group">
            <label>Tên bài hát</label>
            <input
              type="text"
              placeholder="Nhập tên bài hát..."
              value={trackName}
              onChange={e => onSetTrackName(e.target.value)}
              maxLength={50}
            />
          </div>

          {/* Track URL */}
          <div className="fp-form-group">
            <label>
              <Link size={14} />
              URL nhạc (MP3, WAV, OGG...)
            </label>
            <input
              type="url"
              placeholder="https://example.com/music.mp3"
              value={trackUrl}
              onChange={e => onSetTrackUrl(e.target.value)}
            />
            {urlError && <span className="fp-error">{urlError}</span>}
          </div>

          {/* Emoji picker */}
          <div className="fp-form-group">
            <label>Biểu tượng</label>
            <div className="fp-emoji-picker">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  className={`fp-emoji-btn ${trackEmoji === emoji ? 'active' : ''}`}
                  onClick={() => onSetTrackEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Music sources */}
          <div className="fp-music-sources">
            <label>Nguồn nhạc miễn phí:</label>
            <div className="fp-sources-list">
              {MUSIC_SOURCES.map(source => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fp-source-link"
                >
                  <span>{source.icon}</span>
                  <span>{source.name}</span>
                  <ExternalLink size={12} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="fp-modal-footer">
          <button className="fp-modal-cancel" onClick={onClose}>
            Huỷ
          </button>
          <button
            className="fp-modal-submit"
            onClick={onSubmit}
            disabled={!trackName.trim() || !trackUrl.trim() || isValidating}
          >
            {isValidating ? 'Đang kiểm tra...' : (
              <>
                <Plus size={16} />
                Thêm nhạc
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
