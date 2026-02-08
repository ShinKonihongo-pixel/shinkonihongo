// Shared compact study header used by Grammar and Kanji study screens
import { ArrowLeft, Shuffle, RotateCcw, Settings } from 'lucide-react';
import type { JLPTLevel } from '../../types/flashcard';
import { LEVEL_THEMES } from '../pages/grammar-study/constants';

export type MemorizationFilter = 'all' | 'memorized' | 'learning';

export interface StudyHeaderCompactProps {
  selectedLevel: JLPTLevel;
  levelLabel?: string;
  memorizationFilter: MemorizationFilter;
  isShuffled: boolean;
  onFilterChange: (filter: MemorizationFilter) => void;
  onShuffle: () => void;
  onRestart: () => void;
  onBack: () => void;
  onOpenSettings: () => void;
}

export function StudyHeaderCompact({
  selectedLevel,
  levelLabel,
  memorizationFilter,
  isShuffled,
  onFilterChange,
  onShuffle,
  onRestart,
  onBack,
  onOpenSettings,
}: StudyHeaderCompactProps) {
  return (
    <div className="study-header-compact">
      <div className="header-left-group">
        <button className="btn-back" onClick={onBack}><ArrowLeft size={18} /></button>
        <span className="level-badge" style={{ background: LEVEL_THEMES[selectedLevel].gradient }}>
          {levelLabel ?? selectedLevel}
        </span>
        <div className="filter-chips">
          <button className={`filter-chip ${memorizationFilter === 'all' ? 'active' : ''}`} onClick={() => onFilterChange('all')}>Tất cả</button>
          <button className={`filter-chip learned ${memorizationFilter === 'memorized' ? 'active' : ''}`} onClick={() => onFilterChange('memorized')}>Đã thuộc</button>
          <button className={`filter-chip learning ${memorizationFilter === 'learning' ? 'active' : ''}`} onClick={() => onFilterChange('learning')}>Chưa thuộc</button>
        </div>
      </div>
      <div className="header-actions">
        <button className={`action-btn shuffle-btn ${isShuffled ? 'active' : ''}`} onClick={onShuffle} title={isShuffled ? 'Bỏ trộn' : 'Trộn thẻ'}>
          <span className="btn-text">Trộn</span> <Shuffle size={14} />
        </button>
        <button className="action-btn restart-btn" onClick={onRestart} title="Học lại từ đầu">
          <span className="btn-text">Reset</span> <RotateCcw size={14} />
        </button>
        <button className="header-btn settings-btn" onClick={onOpenSettings} title="Cài đặt">
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
}
