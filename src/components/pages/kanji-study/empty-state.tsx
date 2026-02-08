// Empty state when no kanji cards available for study
import { BookOpen } from 'lucide-react';
import type { JLPTLevel } from '../../../types/flashcard';
import type { MemorizationFilter } from './types';
import { StudyHeaderCompact } from '../../ui/study-header-compact';

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
      <StudyHeaderCompact
        selectedLevel={selectedLevel}
        levelLabel={selectedLevel === 'BT' ? 'Bộ thủ' : undefined}
        memorizationFilter={memorizationFilter}
        isShuffled={isShuffled}
        onFilterChange={onFilterChange}
        onShuffle={onShuffle}
        onRestart={onRestart}
        onBack={onBack}
        onOpenSettings={onOpenSettings}
      />
      <div className="empty-state">
        <BookOpen size={64} />
        <h3>Không có thẻ kanji</h3>
        <p>{memorizationFilter === 'memorized' ? 'Chưa có thẻ nào được đánh dấu đã thuộc' : memorizationFilter === 'learning' ? 'Tất cả thẻ đã được thuộc!' : 'Chưa có thẻ kanji nào trong bài này'}</p>
      </div>
    </>
  );
}
