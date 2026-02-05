// Player header with controls

import { Sparkles, ChevronDown, X, ListMusic, ChevronUp, Plus } from 'lucide-react';

interface PlayerHeaderProps {
  onClose?: () => void;
  onMinimize: () => void;
}

export function PlayerHeader({ onClose, onMinimize }: PlayerHeaderProps) {
  return (
    <div className="fp-header">
      <div className="fp-title">
        <Sparkles size={14} className="fp-title-icon" />
        <span>Music Player</span>
      </div>
      <div className="fp-header-actions">
        <button
          className="fp-btn fp-btn-mini"
          onClick={onMinimize}
          title="Thu nhỏ (Esc)"
        >
          <ChevronDown size={16} />
        </button>
        {onClose && (
          <button
            className="fp-btn fp-btn-mini fp-btn-close"
            onClick={onClose}
            title="Đóng"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

interface TrackListToggleProps {
  showTrackList: boolean;
  onToggleTrackList: () => void;
  onShowAddModal: () => void;
}

export function TrackListToggle({
  showTrackList,
  onToggleTrackList,
  onShowAddModal,
}: TrackListToggleProps) {
  return (
    <div className="fp-track-toggle">
      <button
        className={`fp-tracks-btn ${showTrackList ? 'active' : ''}`}
        onClick={onToggleTrackList}
      >
        <ListMusic size={16} />
        <span>Danh sách phát</span>
        <ChevronUp size={14} className={`fp-toggle-icon ${showTrackList ? 'rotated' : ''}`} />
      </button>
      <button
        className="fp-add-btn"
        onClick={onShowAddModal}
        title="Thêm nhạc tuỳ chỉnh"
      >
        <Plus size={16} />
        <span>Thêm nhạc</span>
      </button>
    </div>
  );
}

export function KeyboardShortcutsHint() {
  return (
    <div className="fp-shortcuts-hint">
      <span>Space: Play/Pause</span>
      <span>•</span>
      <span>Ctrl+←/→: Prev/Next</span>
    </div>
  );
}
