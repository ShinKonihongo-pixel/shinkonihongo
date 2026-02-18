// Level and lesson selection component for study pages
// Premium UI with Japanese-inspired design and glassmorphism effects

import { useState, type ReactNode } from 'react';
import { BookOpen, Layers } from 'lucide-react';
import type { LevelLessonSelectorProps, JLPTLevel, StudyMode, Flashcard } from './types';
import {
  useCardCountByLevel,
  useLevelLessons,
  useCardsPerLesson,
  useTotalSelectedCards,
} from './hooks';
import { JLPTLevelSelector } from '../../ui/jlpt-level-selector';
import { LessonSelector } from './lesson-selector';
import { NotebookPanel } from '../notebook';
import './level-lesson-selector.css';

const TITLES: Record<string, string> = {
  vocabulary: 'Học Từ Vựng',
  grammar: 'Học Ngữ Pháp',
  kanji: 'Học Hán Tự',
};

const ICONS: Record<string, ReactNode> = {
  vocabulary: <Layers size={32} />,
  grammar: <BookOpen size={32} />,
  kanji: <BookOpen size={32} />,
};

const COUNT_LABELS: Record<string, string | ((level: JLPTLevel) => string)> = {
  vocabulary: 'từ',
  grammar: 'mẫu',
  kanji: (level: JLPTLevel) => (level === 'BT' ? 'bộ' : 'chữ'),
};

export function LevelLessonSelector({
  type,
  cards,
  getLessonsByLevel,
  getChildLessons,
  onStart,
  levels,
  notebookHook,
  allCards,
  onNotebookStudy,
}: LevelLessonSelectorProps) {
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | null>(null);
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [showNotebookPanel, setShowNotebookPanel] = useState(false);

  const countByLevel = useCardCountByLevel(cards, type, levels);
  const levelLessons = useLevelLessons(selectedLevel, getLessonsByLevel);
  const cardsPerLesson = useCardsPerLesson(levelLessons, cards, getChildLessons, type);
  const totalSelectedCards = useTotalSelectedCards(selectedLessons, cardsPerLesson);

  const toggleLesson = (lessonId: string) => {
    setSelectedLessons(prev =>
      prev.includes(lessonId)
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  const selectAllLessons = () => {
    const availableLessons = levelLessons.filter(l => (cardsPerLesson[l.id] || 0) > 0);
    setSelectedLessons(availableLessons.map(l => l.id));
  };

  const deselectAllLessons = () => {
    setSelectedLessons([]);
  };

  const handleStart = (mode: StudyMode) => {
    if (selectedLevel && selectedLessons.length > 0) {
      onStart(selectedLessons, selectedLevel, mode);
    }
  };

  const backToLevelSelect = () => {
    setSelectedLevel(null);
    setSelectedLessons([]);
  };

  if (!selectedLevel) {
    return (
      <JLPTLevelSelector
        title={TITLES[type]}
        subtitle="Chọn cấp độ để bắt đầu"
        icon={ICONS[type]}
        countByLevel={countByLevel}
        countLabel={COUNT_LABELS[type]}
        onSelectLevel={setSelectedLevel}
        levels={levels}
      />
    );
  }

  return (
    <div className="premium-selector">
      <LessonSelector
        type={type}
        selectedLevel={selectedLevel}
        levelLessons={levelLessons}
        selectedLessons={selectedLessons}
        cardsPerLesson={cardsPerLesson}
        totalSelectedCards={totalSelectedCards}
        onBack={backToLevelSelect}
        onToggleLesson={toggleLesson}
        onSelectAll={selectAllLessons}
        onDeselectAll={deselectAllLessons}
        onStart={handleStart}
        notebookCount={notebookHook?.notebookCount}
        onNotebookClick={notebookHook ? () => setShowNotebookPanel(true) : undefined}
      />
      {showNotebookPanel && notebookHook && allCards && onNotebookStudy && (
        <NotebookPanel
          notebooks={notebookHook.notebooks}
          allCards={allCards as Flashcard[]}
          onClose={() => setShowNotebookPanel(false)}
          onCreateNotebook={notebookHook.createNotebook}
          onUpdateNotebook={notebookHook.updateNotebook}
          onDeleteNotebook={notebookHook.deleteNotebook}
          onRemoveCard={notebookHook.removeCardFromNotebook}
          getNotebookCards={notebookHook.getNotebookCards}
          onStudy={onNotebookStudy}
        />
      )}
    </div>
  );
}
