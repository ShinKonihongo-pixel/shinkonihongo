// Audio Player Page - Orchestrator
// Firebase audio-based listening practice with navigation flow

import { useState } from 'react';
import { useListening, LISTENING_LESSONS, LISTENING_LESSON_TYPES } from '../../../hooks/use-listening';
import { LevelSelectView } from './level-select-view';
import { LessonSelectView } from './lesson-select-view';
import { TypeSelectView } from './type-select-view';
import { AudioPlayerView } from './audio-player-view';
import type { ViewMode } from './audio-player-types';
import type { JLPTLevel } from '../../../types/flashcard';
import type { ListeningLessonType, ListeningAudio } from '../../../types/listening';
import './audio-player-page.css';

export function ListeningPracticePage() {
  const {
    audios, folders, loading,
    getFoldersByLevelLessonAndType, getAudiosByFolder, getAudioUrl, getCountByLevel,
  } = useListening();

  const [viewMode, setViewMode] = useState<ViewMode>('level-select');
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<ListeningLessonType | null>(null);

  // Suppress unused vars from hook
  void audios; void folders; void loading;

  // Get audios for current selection
  const getCurrentAudios = (): ListeningAudio[] => {
    if (!selectedLevel || selectedLesson === null || !selectedType) return [];
    const typeFolders = getFoldersByLevelLessonAndType(selectedLevel, selectedLesson, selectedType);
    return typeFolders.flatMap(f => getAudiosByFolder(f.id));
  };

  // Get audio count for a lesson type
  const getCountByLessonType = (level: JLPTLevel, lessonNumber: number, lessonType: ListeningLessonType) => {
    const typeFolders = getFoldersByLevelLessonAndType(level, lessonNumber, lessonType);
    return typeFolders.reduce((sum, f) => sum + getAudiosByFolder(f.id).length, 0);
  };

  // Get total audio count for a lesson
  const getCountByLesson = (level: JLPTLevel, lessonNumber: number) => {
    return LISTENING_LESSON_TYPES.reduce((sum, lt) => {
      return sum + getCountByLessonType(level, lessonNumber, lt.value);
    }, 0);
  };

  // Get lesson numbers for level
  const getLessonNumbers = (level: JLPTLevel): number[] => {
    const config = LISTENING_LESSONS[level];
    if (!config) return [];
    const numbers: number[] = [];
    for (let i = config.start; i <= config.end; i++) numbers.push(i);
    return numbers;
  };

  // Count by level for level selector
  const countByLevel: Record<JLPTLevel, number> = {
    BT: 0,
    N5: getCountByLevel('N5'),
    N4: getCountByLevel('N4'),
    N3: getCountByLevel('N3'),
    N2: getCountByLevel('N2'),
    N1: getCountByLevel('N1'),
  };

  // Navigation handlers
  const selectLevel = (level: JLPTLevel) => {
    setSelectedLevel(level);
    setViewMode('lesson-select');
  };

  const selectLesson = (lessonNumber: number) => {
    setSelectedLesson(lessonNumber);
    setViewMode('type-select');
  };

  const selectType = (lessonType: ListeningLessonType) => {
    setSelectedType(lessonType);
    setViewMode('audio-player');
  };

  const goBack = () => {
    if (viewMode === 'audio-player') {
      setViewMode('type-select');
    } else if (viewMode === 'type-select') {
      setViewMode('lesson-select');
    } else if (viewMode === 'lesson-select') {
      setViewMode('level-select');
      setSelectedLevel(null);
    }
  };

  return (
    <div className="listening-practice-page">
      {viewMode === 'level-select' && (
        <LevelSelectView
          countByLevel={countByLevel}
          onSelectLevel={selectLevel}
        />
      )}

      {viewMode === 'lesson-select' && selectedLevel && (
        <LessonSelectView
          selectedLevel={selectedLevel}
          lessonNumbers={getLessonNumbers(selectedLevel)}
          getCountByLesson={getCountByLesson}
          onSelectLesson={selectLesson}
          onBack={goBack}
        />
      )}

      {viewMode === 'type-select' && selectedLevel && selectedLesson !== null && (
        <TypeSelectView
          selectedLevel={selectedLevel}
          selectedLesson={selectedLesson}
          getCountByLessonType={getCountByLessonType}
          onSelectType={selectType}
          onBack={goBack}
        />
      )}

      {viewMode === 'audio-player' && selectedLevel && selectedLesson !== null && selectedType && (
        <AudioPlayerView
          selectedLevel={selectedLevel}
          selectedLesson={selectedLesson}
          selectedType={selectedType}
          currentAudios={getCurrentAudios()}
          getAudioUrl={getAudioUrl}
          onBack={goBack}
        />
      )}
    </div>
  );
}
