// Study header component
import { ArrowLeft, Settings, Shuffle, RotateCcw } from 'lucide-react';
import type { JLPTLevel } from '../../../types/flashcard';
import type { MemorizationFilter } from './types';
import { LEVEL_THEMES } from './constants';

interface StudyHeaderProps {
  selectedLevel: JLPTLevel;
  memorizationFilter: MemorizationFilter;
  isShuffled: boolean;
  onFilterChange: (filter: MemorizationFilter) => void;
  onShuffle: () => void;
  onRestart: () => void;
  onBack: () => void;
  onOpenSettings: () => void;
}

export function StudyHeader({
  selectedLevel,
  memorizationFilter,
  isShuffled,
  onFilterChange,
  onShuffle,
  onRestart,
  onBack,
  onOpenSettings,
}: StudyHeaderProps) {
  const levelTheme = LEVEL_THEMES[selectedLevel];

  return (
    <div className="study-header-compact">
      <div className="header-left-group">
        <button className="btn-back" onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <span className="level-badge" style={{ background: levelTheme.gradient }}>
          {selectedLevel}
        </span>
        <div className="filter-chips">
          <button
            className={`filter-chip ${memorizationFilter === 'all' ? 'active' : ''}`}
            onClick={() => onFilterChange('all')}
          >
            Tất cả
          </button>
          <button
            className={`filter-chip learned ${memorizationFilter === 'memorized' ? 'active' : ''}`}
            onClick={() => onFilterChange('memorized')}
          >
            ✓ Thuộc
          </button>
          <button
            className={`filter-chip learning ${memorizationFilter === 'learning' ? 'active' : ''}`}
            onClick={() => onFilterChange('learning')}
          >
            ○ Chưa
          </button>
        </div>
      </div>

      <div className="header-actions">
        <button
          className={`action-btn shuffle-btn ${isShuffled ? 'active' : ''}`}
          onClick={onShuffle}
          title={isShuffled ? 'Bỏ trộn' : 'Trộn thẻ'}
        >
          <Shuffle size={14} />
          <span className="btn-text">Trộn</span>
        </button>
        <button
          className="action-btn restart-btn"
          onClick={onRestart}
          title="Học lại từ đầu"
        >
          <RotateCcw size={14} />
          <span className="btn-text">Reset</span>
        </button>
        <button
          className="header-btn settings-btn"
          onClick={onOpenSettings}
          title="Cài đặt"
        >
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
}
