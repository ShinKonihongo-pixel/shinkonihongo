/* eslint-disable react-hooks/purity */
// JLPT Page Orchestrator - Routes between setup, practice, and result views
// Manages state, question selection, and session tracking

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { JLPTQuestion, JLPTLevel, QuestionCategory } from '../../../types/jlpt-question';
import type { CustomTopicQuestion } from '../../../types/custom-topic';
import type {
  PracticeState,
  PracticeResult,
  SectionConfig,
  QuestionHistory,
  WeakAreaData,
} from './jlpt-types';
import { useJLPTData } from '../../../contexts/jlpt-data-context';
import { useUserData } from '../../../contexts/user-data-context';
import {
  JLPT_LEVELS,
  QUESTION_CATEGORIES,
} from './jlpt-constants';
import {
  loadQuestionHistory,
  saveQuestionHistory,
  loadWeakAreas,
  saveWeakAreas,
} from './jlpt-utils';
import { JLPTSetupView } from './jlpt-setup-view';
import { JLPTPracticeView } from './jlpt-practice-view';
import { JLPTResultView } from './jlpt-result-view';
import './jlpt-base.css';
import './jlpt-audio-upload.css';
import './jlpt-dictation.css';
import './jlpt-setup.css';
import './jlpt-kaiwa-questions.css';
import './jlpt-practice.css';
import './jlpt-results.css';
import './jlpt-management.css';
import './jlpt-responsive.css';

export function JLPTPage() {
  const { jlptQuestions: questions, customTopics = [], customTopicQuestions = [] } = useJLPTData();
  const { addJLPTSession: onSaveJLPTSession } = useUserData();
  const [practiceState, setPracticeState] = useState<PracticeState>('setup');

  // Multi-select states
  const [selectedLevels, setSelectedLevels] = useState<Set<JLPTLevel>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<QuestionCategory>>(new Set());
  const [selectedCustomTopics, setSelectedCustomTopics] = useState<Set<string>>(new Set());

  // Section configurations
  const [sectionConfigs, setSectionConfigs] = useState<SectionConfig[]>([]);
  const [showAdvancedSetup, setShowAdvancedSetup] = useState(false);

  // Simple mode - uses default of 20
  const [simpleQuestionCount, setSimpleQuestionCount] = useState(20);

  // Practice state
  const [practiceQuestions, setPracticeQuestions] = useState<JLPTQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [results, setResults] = useState<PracticeResult[]>([]);

  // Question history for anti-repetition
  const [questionHistory, setQuestionHistory] = useState<QuestionHistory[]>(loadQuestionHistory);

  // Weak areas tracking
  const [weakAreas, setWeakAreas] = useState<WeakAreaData[]>(loadWeakAreas);

  // Timing
  const sessionStartTime = useRef<number>(Date.now());
  const questionStartTime = useRef<number>(Date.now());
  const sessionSaved = useRef<boolean>(false);

  // Settings with defaults
  const showExplanation = true;
  const autoNextDelay = 0;
  const preventRepetition = true;
  const repetitionCooldown = 3;
  const coverageMode: string = 'balanced';
  const showLevelAssessment = true;
  const trackWeakAreas = true;

  // Toggle level selection
  const toggleLevel = (level: JLPTLevel) => {
    setSelectedLevels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(level)) newSet.delete(level);
      else newSet.add(level);
      return newSet;
    });
  };

  // Toggle category selection
  const toggleCategory = (category: QuestionCategory) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) newSet.delete(category);
      else newSet.add(category);
      return newSet;
    });
  };

  // Select all levels/categories
  const selectAllLevels = () => {
    setSelectedLevels(prev =>
      prev.size === JLPT_LEVELS.length ? new Set() : new Set(JLPT_LEVELS)
    );
  };

  const selectAllCategories = () => {
    setSelectedCategories(prev =>
      prev.size === QUESTION_CATEGORIES.length ? new Set() : new Set(QUESTION_CATEGORIES.map(c => c.value))
    );
  };

  // Toggle custom topic selection
  const toggleCustomTopic = (topicId: string) => {
    setSelectedCustomTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) newSet.delete(topicId);
      else newSet.add(topicId);
      return newSet;
    });
  };

  const selectAllCustomTopics = () => {
    setSelectedCustomTopics(prev =>
      prev.size === customTopics.length ? new Set() : new Set(customTopics.map(t => t.id))
    );
  };

  // Get custom questions for selected topics
  const filteredCustomQuestions = useMemo(() => {
    if (selectedCustomTopics.size === 0) return [];
    return customTopicQuestions.filter(q => selectedCustomTopics.has(q.topicId));
  }, [customTopicQuestions, selectedCustomTopics]);

  // Filter questions based on selections
  const filteredQuestions = useMemo(() => {
    if (selectedLevels.size === 0 && selectedCategories.size === 0) return questions;
    return questions.filter(q => {
      const levelMatch = selectedLevels.size === 0 || selectedLevels.has(q.level);
      const categoryMatch = selectedCategories.size === 0 || selectedCategories.has(q.category);
      return levelMatch && categoryMatch;
    });
  }, [questions, selectedLevels, selectedCategories]);

  // Questions by category
  const questionsByCategory = useMemo(() => {
    const result: Record<QuestionCategory, JLPTQuestion[]> = {
      vocabulary: [], grammar: [], reading: [], listening: [],
    };
    filteredQuestions.forEach(q => result[q.category].push(q));
    return result;
  }, [filteredQuestions]);

  // Update section configs when selections change (using ref to avoid dependency loop)
  const sectionConfigsRef = useRef(sectionConfigs);
  sectionConfigsRef.current = sectionConfigs;

  useEffect(() => {
    const newConfigs: SectionConfig[] = [];
    QUESTION_CATEGORIES.forEach(cat => {
      if (selectedCategories.size === 0 || selectedCategories.has(cat.value)) {
        const available = questionsByCategory[cat.value].length;
        const existing = sectionConfigsRef.current.find(c => c.category === cat.value);
        newConfigs.push({
          category: cat.value,
          questionCount: existing?.questionCount ?? Math.min(5, available),
          available,
        });
      }
    });
    setSectionConfigs(newConfigs);
  }, [selectedCategories, questionsByCategory]);

  // Update section count
  const updateSectionCount = (category: QuestionCategory, count: number) => {
    setSectionConfigs(prev => prev.map(c =>
      c.category === category ? { ...c, questionCount: count } : c
    ));
  };

  const getCategoryLabel = (category: QuestionCategory) =>
    QUESTION_CATEGORIES.find(c => c.value === category)?.label || category;

  // Calculate weak score for a question (higher = weaker area, prioritize)
  const getWeakScore = useCallback((q: JLPTQuestion): number => {
    const area = weakAreas.find(a => a.category === q.category && a.level === q.level);
    if (!area || area.totalCount === 0) return 0.5; // Unknown = medium priority
    const errorRate = area.wrongCount / area.totalCount;
    return errorRate; // Higher error rate = higher priority
  }, [weakAreas]);

  // Smart question selection with anti-repetition and coverage
  const selectQuestions = useCallback((pool: JLPTQuestion[], count: number): JLPTQuestion[] => {
    if (pool.length === 0) return [];

    // Apply anti-repetition filter
    let availablePool = pool;
    if (preventRepetition) {
      const recentIds = new Set(
        questionHistory
          .filter(h => h.sessionCount < repetitionCooldown)
          .map(h => h.questionId)
      );
      const notRecent = pool.filter(q => !recentIds.has(q.id));
      // If we filter out too many, fall back to full pool
      if (notRecent.length >= count * 0.5) {
        availablePool = notRecent;
      }
    }

    // Apply coverage mode
    let selected: JLPTQuestion[] = [];

    if (coverageMode === 'weak_first' && trackWeakAreas && weakAreas.length > 0) {
      // Sort by weak score (highest first), then take top questions
      const scored = availablePool.map(q => ({
        question: q,
        score: getWeakScore(q) + Math.random() * 0.1, // Add small random factor
      }));
      scored.sort((a, b) => b.score - a.score);

      // Take 70% from weak areas, 30% random for variety
      const weakCount = Math.ceil(count * 0.7);
      const randomCount = count - weakCount;

      // Get weak questions
      const weakQuestions = scored.slice(0, Math.min(weakCount, scored.length));
      selected.push(...weakQuestions.map(s => s.question));

      // Get random from remaining
      const remaining = scored.slice(weakCount);
      const shuffledRemaining = remaining.sort(() => Math.random() - 0.5);
      selected.push(...shuffledRemaining.slice(0, randomCount).map(s => s.question));
    } else if (coverageMode === 'balanced') {
      // Try to balance across levels and categories
      const byLevel: Record<string, JLPTQuestion[]> = {};
      availablePool.forEach(q => {
        const key = `${q.level}-${q.category}`;
        if (!byLevel[key]) byLevel[key] = [];
        byLevel[key].push(q);
      });

      const keys = Object.keys(byLevel);
      let idx = 0;
      while (selected.length < count && selected.length < availablePool.length) {
        const key = keys[idx % keys.length];
        const bucket = byLevel[key];
        if (bucket.length > 0) {
          const randomIdx = Math.floor(Math.random() * bucket.length);
          selected.push(bucket[randomIdx]);
          bucket.splice(randomIdx, 1);
        }
        idx++;
        // Prevent infinite loop
        if (idx > count * keys.length) break;
      }
    } else {
      // Random mode
      const shuffled = [...availablePool].sort(() => Math.random() - 0.5);
      selected = shuffled.slice(0, count);
    }

    // Final shuffle
    return selected.sort(() => Math.random() - 0.5);
  }, [preventRepetition, questionHistory, repetitionCooldown, coverageMode, trackWeakAreas, weakAreas, getWeakScore]);

  // Convert custom topic question to JLPT-compatible format for practice
  const convertCustomToJLPT = (q: CustomTopicQuestion): JLPTQuestion => {
    return {
      id: q.id,
      level: 'N5', // Default level for custom questions
      category: 'vocabulary', // Default category
      question: q.questionJa, // Use Japanese question
      answers: (q.suggestedAnswers && q.suggestedAnswers.length > 0)
        ? q.suggestedAnswers.slice(0, 4).map((text, i) => ({ text, isCorrect: i === 0 }))
        : [{ text: '---', isCorrect: true }, { text: '---', isCorrect: false }],
      explanation: q.questionVi || q.situationContext || '',
      // Store custom topic info in question for display
      folderId: q.topicId, // Reuse folderId to store topicId
      createdBy: q.createdBy,
      createdAt: q.createdAt,
    };
  };

  // Start practice
  const startPractice = () => {
    let selectedQuestions: JLPTQuestion[] = [];

    if (showAdvancedSetup) {
      // Advanced mode: use section configs for JLPT questions
      sectionConfigs.forEach(config => {
        const categoryQuestions = questionsByCategory[config.category];
        const selected = selectQuestions(categoryQuestions, config.questionCount);
        selectedQuestions.push(...selected);
      });
    } else {
      // Simple mode: combine JLPT and custom questions
      const jlptCount = filteredQuestions.length;
      const customCount = filteredCustomQuestions.length;
      const totalAvailable = jlptCount + customCount;

      if (totalAvailable === 0) return;

      // Proportionally distribute question count between JLPT and custom
      const jlptRatio = jlptCount / totalAvailable;
      const jlptToSelect = Math.round(simpleQuestionCount * jlptRatio);
      const customToSelect = simpleQuestionCount - jlptToSelect;

      // Select JLPT questions
      if (jlptToSelect > 0 && jlptCount > 0) {
        selectedQuestions.push(...selectQuestions(filteredQuestions, Math.min(jlptToSelect, jlptCount)));
      }

      // Select and convert custom topic questions
      if (customToSelect > 0 && customCount > 0) {
        const shuffledCustom = [...filteredCustomQuestions].sort(() => Math.random() - 0.5);
        const selectedCustom = shuffledCustom.slice(0, Math.min(customToSelect, customCount));
        selectedQuestions.push(...selectedCustom.map(convertCustomToJLPT));
      }
    }

    // Final shuffle
    selectedQuestions = selectedQuestions.sort(() => Math.random() - 0.5);

    setPracticeQuestions(selectedQuestions);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setResults([]);
    sessionStartTime.current = Date.now();
    questionStartTime.current = Date.now();
    sessionSaved.current = false;
    setPracticeState('practicing');
  };

  // Save session, update history, and track weak areas
  useEffect(() => {
    if (practiceState === 'result' && !sessionSaved.current && results.length > 0) {
      sessionSaved.current = true;

      // Update question history (optimized with Map for better performance)
      const historyMap = new Map(questionHistory.map(h => [h.questionId, h]));
      // Increment session count for all existing items
      historyMap.forEach(h => h.sessionCount++);
      // Update/add new questions
      results.forEach(r => {
        historyMap.set(r.questionId, {
          questionId: r.questionId,
          answeredAt: Date.now(),
          sessionCount: 0,
        });
      });
      // Convert back to array and keep only last 500 entries
      const trimmedHistory = Array.from(historyMap.values()).slice(-500);
      setQuestionHistory(trimmedHistory);
      saveQuestionHistory(trimmedHistory);

      // Update weak areas tracking if enabled
      if (trackWeakAreas) {
        const updatedAreas = new Map(weakAreas.map(a => [`${a.level}-${a.category}`, a]));

        results.forEach(r => {
          const key = `${r.level}-${r.category}`;
          const existing = updatedAreas.get(key);
          if (existing) {
            existing.totalCount++;
            if (!r.isCorrect) existing.wrongCount++;
            existing.lastUpdated = Date.now();
          } else {
            updatedAreas.set(key, {
              category: r.category,
              level: r.level,
              wrongCount: r.isCorrect ? 0 : 1,
              totalCount: 1,
              lastUpdated: Date.now(),
            });
          }
        });

        const newWeakAreas = Array.from(updatedAreas.values());
        setWeakAreas(newWeakAreas);
        saveWeakAreas(newWeakAreas);
      }

      // Save JLPT session
      if (onSaveJLPTSession) {
        const duration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
        const correctCount = results.filter(r => r.isCorrect).length;
        const levelStr = selectedLevels.size === 0 || selectedLevels.size === JLPT_LEVELS.length
          ? 'Mixed' : Array.from(selectedLevels).join(', ');
        const categoryStr = selectedCategories.size === 0 || selectedCategories.size === QUESTION_CATEGORIES.length
          ? 'Mixed' : Array.from(selectedCategories).map(getCategoryLabel).join(', ');

        onSaveJLPTSession({
          date: new Date().toISOString().split('T')[0],
          level: levelStr,
          category: categoryStr,
          correctCount,
          totalQuestions: results.length,
          duration,
        });
      }
    }
  }, [practiceState, onSaveJLPTSession, results, selectedLevels, selectedCategories, questionHistory, trackWeakAreas, weakAreas]);

  // Handle answer selection
  const handleSelectAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  // Submit answer
  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    const currentQuestion = practiceQuestions[currentIndex];
    const isCorrect = currentQuestion.answers[selectedAnswer].isCorrect;
    const timeSpent = Date.now() - questionStartTime.current;

    setResults(prev => [...prev, {
      questionId: currentQuestion.id,
      selectedAnswer,
      isCorrect,
      category: currentQuestion.category,
      level: currentQuestion.level,
      timeSpent,
    }]);
    setShowResult(true);

    // Auto-advance if configured
    if (autoNextDelay > 0) {
      setTimeout(() => {
        handleNext();
      }, autoNextDelay * 1000);
    }
  };

  // Next question
  const handleNext = () => {
    if (currentIndex < practiceQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      questionStartTime.current = Date.now();
    } else {
      setPracticeState('result');
    }
  };

  // Reset practice
  const resetPractice = () => {
    setPracticeState('setup');
    setPracticeQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setResults([]);
  };

  // Route to appropriate view based on state
  if (practiceState === 'setup') {
    return (
      <JLPTSetupView
        questions={questions}
        customTopics={customTopics}
        customTopicQuestions={customTopicQuestions}
        selectedLevels={selectedLevels}
        selectedCategories={selectedCategories}
        selectedCustomTopics={selectedCustomTopics}
        showAdvancedSetup={showAdvancedSetup}
        simpleQuestionCount={simpleQuestionCount}
        sectionConfigs={sectionConfigs}
        filteredQuestions={filteredQuestions}
        filteredCustomQuestions={filteredCustomQuestions}
        questionsByCategory={questionsByCategory}
        preventRepetition={preventRepetition}
        toggleLevel={toggleLevel}
        toggleCategory={toggleCategory}
        toggleCustomTopic={toggleCustomTopic}
        selectAllLevels={selectAllLevels}
        selectAllCategories={selectAllCategories}
        selectAllCustomTopics={selectAllCustomTopics}
        setShowAdvancedSetup={setShowAdvancedSetup}
        setSimpleQuestionCount={setSimpleQuestionCount}
        updateSectionCount={updateSectionCount}
        onStartPractice={startPractice}
      />
    );
  }

  if (practiceState === 'result') {
    return (
      <JLPTResultView
        practiceQuestions={practiceQuestions}
        results={results}
        weakAreas={weakAreas}
        trackWeakAreas={trackWeakAreas}
        showExplanation={showExplanation}
        showLevelAssessment={showLevelAssessment}
        onRestartPractice={startPractice}
        onResetPractice={resetPractice}
      />
    );
  }

  // practiceState === 'practicing'
  const correctCount = results.filter(r => r.isCorrect).length;

  return (
    <JLPTPracticeView
      practiceQuestions={practiceQuestions}
      currentIndex={currentIndex}
      selectedAnswer={selectedAnswer}
      showResult={showResult}
      correctCount={correctCount}
      totalAnswered={results.length}
      showExplanation={showExplanation}
      onSelectAnswer={handleSelectAnswer}
      onSubmit={handleSubmit}
      onNext={handleNext}
      onReset={resetPractice}
    />
  );
}
