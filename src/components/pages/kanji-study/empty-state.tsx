// Empty state when no kanji cards available for study
import { BookOpen, ChevronLeft } from 'lucide-react';
import type { JLPTLevel } from '../../../types/flashcard';
import type { MemorizationFilter } from './types';

const LEVEL_COLORS: Record<JLPTLevel, string> = {
  N5: '#22c55e', N4: '#3b82f6', N3: '#f59e0b', N2: '#a855f7', N1: '#ef4444',
};

interface EmptyStateProps {
  selectedLevel: JLPTLevel;
  memorizationFilter: MemorizationFilter;
  isShuffled: boolean;
  onFilterChange: (filter: MemorizationFilter) => void;
  onShuffle: () => void;
  onRestart: () => void;
  onBack: () => void;
  onOpenSettings: () => void;
}

export function EmptyState({
  selectedLevel, memorizationFilter, isShuffled,
  onFilterChange, onShuffle, onRestart, onBack, onOpenSettings,
}: EmptyStateProps) {
  return (
    <>
      <div className="study-header-compact">
        <div className="header-left-group">
          <button className="btn-back" onClick={onBack}><ChevronLeft size={18} /></button>
          <span className="level-badge" style={{ background: LEVEL_COLORS[selectedLevel] }}>{selectedLevel}</span>
          <div className="filter-chips">
            <button className={`filter-chip ${memorizationFilter === 'all' ? 'active' : ''}`} onClick={() => onFilterChange('all')}>Tất cả</button>
            <button className={`filter-chip learned ${memorizationFilter === 'memorized' ? 'active' : ''}`} onClick={() => onFilterChange('memorized')}>Đã thuộc</button>
            <button className={`filter-chip learning ${memorizationFilter === 'learning' ? 'active' : ''}`} onClick={() => onFilterChange('learning')}>Đang học</button>
          </div>
        </div>
        <div className="header-actions">
          <button className={`action-btn shuffle-btn ${isShuffled ? 'active' : ''}`} onClick={onShuffle}>🔀</button>
          <button className="action-btn" onClick={onRestart}>↺</button>
          <button className="header-btn" onClick={onOpenSettings}>⚙</button>
        </div>
      </div>
      <div className="empty-state">
        <BookOpen size={64} />
        <h3>Không có thẻ kanji</h3>
        <p>{memorizationFilter === 'memorized' ? 'Chưa có thẻ nào được đánh dấu đã thuộc' : memorizationFilter === 'learning' ? 'Tất cả thẻ đã được thuộc!' : 'Chưa có thẻ kanji nào trong bài này'}</p>
      </div>
    </>
  );
}
