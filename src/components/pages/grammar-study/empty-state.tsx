// Empty state view when no cards match filters
import { BookOpen } from 'lucide-react';
import type { JLPTLevel } from '../../../types/flashcard';
import type { MemorizationFilter } from './types';
import { StudyHeader } from './study-header';

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
  selectedLevel,
  memorizationFilter,
  isShuffled,
  onFilterChange,
  onShuffle,
  onRestart,
  onBack,
  onOpenSettings,
}: EmptyStateProps) {
  return (
    <>
      <StudyHeader
        selectedLevel={selectedLevel}
        memorizationFilter={memorizationFilter}
        isShuffled={isShuffled}
        onFilterChange={onFilterChange}
        onShuffle={onShuffle}
        onRestart={onRestart}
        onBack={onBack}
        onOpenSettings={onOpenSettings}
      />
      <div className="empty-state">
        <BookOpen size={48} />
        <h3>Không có ngữ pháp nào phù hợp</h3>
        <p>Hãy thử chọn bộ lọc khác</p>
      </div>
    </>
  );
}
