import { ArrowLeft } from 'lucide-react';
import { ReadingSettingsButton } from '../../ui/reading-settings';
import type { JLPTLevel } from '../../../types/flashcard';
import type { ReadingPassage } from '../../../types/reading';

interface PracticeHeaderProps {
  selectedLevel: JLPTLevel;
  selectedPassage: ReadingPassage;
  selectedAnswers: Record<number, number>;
  theme: { gradient: string };
  onGoBack: () => void;
  onOpenSettings: () => void;
}

export function PracticeHeader({
  selectedLevel,
  selectedPassage,
  selectedAnswers,
  theme,
  onGoBack,
  onOpenSettings,
}: PracticeHeaderProps) {
  return (
    <header className="practice-header">
      <button className="btn-back-sm" onClick={onGoBack}>
        <ArrowLeft size={18} />
      </button>
      <div className="header-center">
        <span className="level-pill" style={{ background: theme.gradient }}>
          {selectedLevel}
        </span>
        <h1 className="header-title" style={{ textTransform: 'uppercase' }}>{selectedPassage.title}</h1>
        <span className="progress-badge">
          {Object.keys(selectedAnswers).length}/{selectedPassage.questions.length}
        </span>
      </div>
      <ReadingSettingsButton onClick={onOpenSettings} />
    </header>
  );
}
