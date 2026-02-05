import { useState } from 'react';
import type { JLPTLevel } from '../../../types/flashcard';
import type { ReadingPassage, ReadingFolder } from '../../../types/reading';
import type { ViewMode, ContentTab } from './types';

export function usePracticeState() {
  const [viewMode, setViewMode] = useState<ViewMode>('level-select');
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<ReadingFolder | null>(null);
  const [selectedPassage, setSelectedPassage] = useState<ReadingPassage | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isQuestionCollapsed, setIsQuestionCollapsed] = useState(false);
  const [contentTab, setContentTab] = useState<ContentTab>('passage');

  const selectLevel = (level: JLPTLevel) => {
    setSelectedLevel(level);
    setViewMode('folder-list');
  };

  const selectFolder = (folder: ReadingFolder) => {
    setSelectedFolder(folder);
    setViewMode('passage-list');
  };

  const startPractice = (passage: ReadingPassage) => {
    setSelectedPassage(passage);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setContentTab('passage');
    setViewMode('practice');
  };

  const goBack = () => {
    speechSynthesis.cancel();

    if (viewMode === 'practice') {
      setViewMode('passage-list');
      setSelectedPassage(null);
    } else if (viewMode === 'completed') {
      setViewMode('passage-list');
      setSelectedPassage(null);
    } else if (viewMode === 'passage-list') {
      setViewMode('folder-list');
      setSelectedFolder(null);
    } else if (viewMode === 'folder-list') {
      setViewMode('level-select');
      setSelectedLevel(null);
    }
  };

  const handleSelectAnswer = (answerIndex: number) => {
    if (showResults) return;
    setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: answerIndex }));
  };

  const handleShowResult = () => {
    setShowResults(true);
  };

  const handleNextQuestion = () => {
    if (!selectedPassage) return;
    if (currentQuestionIndex < selectedPassage.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowResults(false);
    } else {
      setViewMode('completed');
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setViewMode('practice');
  };

  const calculateScore = () => {
    if (!selectedPassage) return { correct: 0, total: 0, percent: 0 };
    let correct = 0;
    selectedPassage.questions.forEach((q, idx) => {
      const selectedIdx = selectedAnswers[idx];
      if (selectedIdx !== undefined && q.answers[selectedIdx]?.isCorrect) {
        correct++;
      }
    });
    return {
      correct,
      total: selectedPassage.questions.length,
      percent: Math.round((correct / selectedPassage.questions.length) * 100),
    };
  };

  return {
    viewMode,
    selectedLevel,
    selectedFolder,
    selectedPassage,
    currentQuestionIndex,
    selectedAnswers,
    showResults,
    isPinned,
    isQuestionCollapsed,
    contentTab,
    setViewMode,
    setIsPinned,
    setIsQuestionCollapsed,
    setContentTab,
    setCurrentQuestionIndex,
    setShowResults,
    selectLevel,
    selectFolder,
    startPractice,
    goBack,
    handleSelectAnswer,
    handleShowResult,
    handleNextQuestion,
    handleRestart,
    calculateScore,
  };
}
