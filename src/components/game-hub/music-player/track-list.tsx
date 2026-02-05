// Track list with category filter

import { Link, Trash2, Plus, FileAudio } from 'lucide-react';
import {
  MUSIC_CATEGORY_LABELS,
  type MusicTrack,
  type MusicCategory,
} from '../../../hooks/use-game-sounds';

interface TrackListProps {
  tracks: MusicTrack[];
  categories: { value: MusicCategory | 'all'; label: string; count: number }[];
  selectedCategory: MusicCategory | 'all';
  selectedTrackId: string;
  isPlaying: boolean;
  customTrackCount: number;
  onSelectCategory: (category: MusicCategory | 'all') => void;
  onSelectTrack: (track: MusicTrack) => void;
  onRemoveTrack: (trackId: string, e: React.MouseEvent) => void;
  onShowAddModal: () => void;
}

export function TrackList({
  tracks,
  categories,
  selectedCategory,
  selectedTrackId,
  isPlaying,
  customTrackCount,
  onSelectCategory,
  onSelectTrack,
  onRemoveTrack,
  onShowAddModal,
}: TrackListProps) {
  return (
    <div className="fp-track-list">
      {/* Category filter */}
      <div className="fp-category-filter">
        {categories.map(cat => (
          <button
            key={cat.value}
            className={`fp-cat-btn ${selectedCategory === cat.value ? 'active' : ''}`}
            onClick={() => onSelectCategory(cat.value)}
          >
            {cat.label}
            <span className="fp-cat-count">{cat.count}</span>
          </button>
        ))}
      </div>

      {/* Track items */}
      <div className="fp-tracks-scroll">
        {tracks.map((track, index) => (
          <button
            key={track.id}
            className={`fp-track-item ${track.id === selectedTrackId ? 'active' : ''} ${track.category === 'custom' ? 'custom' : ''}`}
            onClick={() => onSelectTrack(track)}
          >
            <span className="fp-track-num">{index + 1}</span>
            <span className="fp-track-item-emoji">{track.emoji}</span>
            <div className="fp-track-item-info">
              <span className="fp-track-item-name">{track.name}</span>
              <span className="fp-track-item-cat">
                {track.category === 'custom' && <Link size={10} className="fp-custom-icon" />}
                {MUSIC_CATEGORY_LABELS[track.category]}
              </span>
            </div>
            {track.id === selectedTrackId && isPlaying && (
              <div className="fp-track-playing-indicator">
                <span /><span /><span />
              </div>
            )}
            {track.category === 'custom' && (
              <button
                className="fp-track-delete"
                onClick={(e) => onRemoveTrack(track.id, e)}
                title="Xóa bài hát"
              >
                <Trash2 size={14} />
              </button>
            )}
          </button>
        ))}

        {/* Empty state for custom category */}
        {selectedCategory === 'custom' && customTrackCount === 0 && (
          <div className="fp-empty-custom">
            <FileAudio size={32} />
            <p>Chưa có nhạc tuỳ chỉnh</p>
            <button onClick={onShowAddModal}>
              <Plus size={14} />
              Thêm nhạc ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
