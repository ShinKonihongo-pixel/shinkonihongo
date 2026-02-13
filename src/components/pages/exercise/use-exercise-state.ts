// Exercise State Management Hook

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Exercise, ExerciseSession } from '../../../types/exercise';
import type { Flashcard, JLPTLevel } from '../../../types/flashcard';
import type { ViewState, ExerciseStateReturn } from './exercise-types';
import { generateQuestions, getExerciseLevels } from './exercise-utils';

export function useExerciseState(
  exercises: Exercise[],
  flashcards: Flashcard[]
): ExerciseStateReturn {
  const [view, setView] = useState<ViewState>('level-select');
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | null>(null);
  const [session, setSession] = useState<ExerciseSession | null>(null);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [listenCount, setListenCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const speakTimeoutRef = useRef<NodeJS.Timeout[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Filter published exercises
  const publishedExercises = exercises.filter(e => e.isPublished);
  const filteredExercises = !selectedLevel
    ? publishedExercises
    : publishedExercises.filter(e => {
        const levels = getExerciseLevels(e);
        return levels.includes(selectedLevel);
      });

  // Exercise counts by level
  const countByLevel = useMemo(() => {
    const counts: Record<JLPTLevel, number> = { BT: 0, N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };
    publishedExercises.forEach(e => {
      const levels = getExerciseLevels(e);
      levels.forEach(level => {
        counts[level]++;
      });
    });
    return counts;
  }, [publishedExercises]);

  // Speak text
  const speakQuestion = useCallback((text: string) => {
    speakTimeoutRef.current.forEach(t => clearTimeout(t));
    speakTimeoutRef.current = [];
    window.speechSynthesis.cancel();

    setIsListening(true);
    setListenCount(0);

    const speak = (count: number) => {
      setListenCount(count + 1);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.8;

      const voices = window.speechSynthesis.getVoices();
      const jpVoice = voices.find(v => v.lang.startsWith('ja'));
      if (jpVoice) utterance.voice = jpVoice;

      utterance.onend = () => {
        if (count < 2) {
          const timeout = setTimeout(() => speak(count + 1), 2000);
          speakTimeoutRef.current.push(timeout);
        } else {
          setIsListening(false);
          setTimeout(() => textInputRef.current?.focus(), 100);
        }
      };

      window.speechSynthesis.speak(utterance);
    };

    speak(0);
  }, []);

  // Handle answer - must be defined before timer effect
  const handleAnswer = useCallback((answer: number | string) => {
    if (!session || showResult) return;

    if (timerRef.current) clearInterval(timerRef.current);

    if (typeof answer === 'number') {
      setSelectedAnswer(answer);
    }

    setShowResult(true);
    setIsAnimating(true);

    const newAnswers = [...session.answers];
    newAnswers[session.currentIndex] = answer;
    setSession({ ...session, answers: newAnswers });

    setTimeout(() => setIsAnimating(false), 600);
  }, [session, showResult]);

  // Start exercise
  const startExercise = useCallback((exercise: Exercise) => {
    const questions = generateQuestions(exercise, flashcards);
    if (questions.length === 0) {
      alert('Không đủ từ vựng để tạo bài tập. Cần ít nhất 4 từ vựng.');
      return;
    }

    setCurrentExercise(exercise);
    setSession({
      exerciseId: exercise.id,
      questions,
      currentIndex: 0,
      answers: new Array(questions.length).fill(null),
      startedAt: new Date().toISOString(),
    });
    setView('session');
    setSelectedAnswer(null);
    setTextAnswer('');
    setShowResult(false);
    setIsAnimating(false);

    if (questions[0].type === 'listening_write') {
      setTimeout(() => speakQuestion(questions[0].vocabulary), 500);
    }
  }, [flashcards, speakQuestion]);

  // Submit text answer for listening
  const handleTextSubmit = useCallback(() => {
    if (!textAnswer.trim()) return;
    handleAnswer(textAnswer.trim());
  }, [textAnswer, handleAnswer]);

  // Next question
  const nextQuestion = useCallback(() => {
    if (!session || !currentExercise) return;

    const nextIndex = session.currentIndex + 1;
    if (nextIndex >= session.questions.length) {
      setSession({ ...session, completedAt: new Date().toISOString() });
      setView('result');
    } else {
      setSession({ ...session, currentIndex: nextIndex });
      setSelectedAnswer(null);
      setTextAnswer('');
      setShowResult(false);

      const nextQ = session.questions[nextIndex];
      if (nextQ.type === 'listening_write') {
        setTimeout(() => speakQuestion(nextQ.vocabulary), 300);
      }
    }
  }, [session, currentExercise, speakQuestion]);

  // Calculate score
  const calculateScore = useCallback(() => {
    if (!session) return { correct: 0, total: 0, percentage: 0 };
    const correct = session.questions.reduce((sum, q, idx) => {
      const userAnswer = session.answers[idx];
      if (q.type === 'listening_write') {
        const isCorrect = typeof userAnswer === 'string' &&
          userAnswer.toLowerCase().trim() === q.correctAnswer?.toLowerCase().trim();
        return sum + (isCorrect ? 1 : 0);
      }
      return sum + (userAnswer === q.correctIndex ? 1 : 0);
    }, 0);
    return {
      correct,
      total: session.questions.length,
      percentage: Math.round((correct / session.questions.length) * 100),
    };
  }, [session]);

  // Select level handler
  const selectLevel = (level: JLPTLevel) => {
    setSelectedLevel(level);
    setView('list');
  };

  // Go back to level select
  const goBackToLevelSelect = () => {
    setSelectedLevel(null);
    setView('level-select');
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      speakTimeoutRef.current.forEach(t => clearTimeout(t));
      if (timerRef.current) clearInterval(timerRef.current);
      window.speechSynthesis.cancel();
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (!currentExercise?.timePerQuestion || !session || showResult || view !== 'session') {
      setTimeLeft(null);
      return;
    }

    setTimeLeft(currentExercise.timePerQuestion);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAnswer(-1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session?.currentIndex, currentExercise, view, showResult, handleAnswer, session]);

  return {
    view,
    selectedLevel,
    session,
    currentExercise,
    selectedAnswer,
    textAnswer,
    showResult,
    isListening,
    listenCount,
    isAnimating,
    timeLeft,
    publishedExercises,
    filteredExercises,
    countByLevel,
    setView,
    setSelectedLevel,
    setSession,
    setCurrentExercise,
    setSelectedAnswer,
    setTextAnswer,
    setShowResult,
    setIsListening,
    setListenCount,
    setIsAnimating,
    setTimeLeft,
    selectLevel,
    goBackToLevelSelect,
    startExercise,
    handleAnswer,
    handleTextSubmit,
    nextQuestion,
    calculateScore,
    speakQuestion,
  };
}
