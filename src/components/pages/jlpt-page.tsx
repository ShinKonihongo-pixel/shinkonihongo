// JLPT Practice Page - Multi-select test builder with level assessment & smart question selection
// Features: Detailed assessment, category breakdown, personalized advice, anti-repetition
// Extended: Custom topic support for practicing beyond standard JLPT content

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Settings, Play, RotateCcw, ChevronDown, ChevronUp, TrendingUp, AlertTriangle, Star, Target, BookOpen, Award, Lightbulb, Sparkles } from 'lucide-react';
import type { JLPTQuestion, JLPTLevel, QuestionCategory } from '../../types/jlpt-question';
import type { JLPTSession } from '../../types/user';
import type { AppSettings } from '../../hooks/use-settings';
import type { CustomTopic, CustomTopicQuestion } from '../../types/custom-topic';

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
const QUESTION_CATEGORIES: { value: QuestionCategory; label: string; icon: string; description: string }[] = [
  { value: 'vocabulary', label: 'Từ vựng', icon: '文', description: 'Kiểm tra vốn từ vựng' },
  { value: 'grammar', label: 'Ngữ pháp', icon: '法', description: 'Cấu trúc ngữ pháp' },
  { value: 'reading', label: 'Đọc hiểu', icon: '読', description: 'Đọc và hiểu văn bản' },
  { value: 'listening', label: 'Nghe', icon: '聴', description: 'Nghe và hiểu' },
];

// Storage keys for persistence
const HISTORY_STORAGE_KEY = 'jlpt_question_history';
const WEAK_AREAS_STORAGE_KEY = 'jlpt_weak_areas';

// Weak area tracking interface
interface WeakAreaData {
  category: QuestionCategory;
  level: JLPTLevel;
  wrongCount: number;
  totalCount: number;
  lastUpdated: number;
}

// Load weak areas from localStorage
function loadWeakAreas(): WeakAreaData[] {
  try {
    const saved = localStorage.getItem(WEAK_AREAS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

// Save weak areas
function saveWeakAreas(areas: WeakAreaData[]) {
  localStorage.setItem(WEAK_AREAS_STORAGE_KEY, JSON.stringify(areas));
}

// Level assessment thresholds and messages
const ASSESSMENT_LEVELS = {
  excellent: { min: 90, label: '優秀', color: '#10b981', emoji: '🌟' },
  good: { min: 75, label: '良好', color: '#3b82f6', emoji: '👍' },
  pass: { min: 60, label: '合格', color: '#f59e0b', emoji: '✓' },
  needsWork: { min: 0, label: '頑張れ', color: '#ef4444', emoji: '📚' },
};

interface JLPTPageProps {
  questions: JLPTQuestion[];
  onSaveJLPTSession?: (data: Omit<JLPTSession, 'id' | 'userId'>) => void;
  settings?: AppSettings;
  // Custom topics support
  customTopics?: CustomTopic[];
  customTopicQuestions?: CustomTopicQuestion[];
}

type PracticeState = 'setup' | 'practicing' | 'result';

interface PracticeResult {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  category: QuestionCategory;
  level: JLPTLevel;
  timeSpent: number; // milliseconds
}

interface SectionConfig {
  category: QuestionCategory;
  questionCount: number;
  available: number;
}

// Category performance breakdown
interface CategoryPerformance {
  category: QuestionCategory;
  correct: number;
  total: number;
  percentage: number;
  avgTime: number;
}

// Question history for anti-repetition
interface QuestionHistory {
  questionId: string;
  answeredAt: number;
  sessionCount: number;
}

// Load question history from localStorage
function loadQuestionHistory(): QuestionHistory[] {
  try {
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

// Save question history
function saveQuestionHistory(history: QuestionHistory[]) {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
}

export function JLPTPage({
  questions,
  onSaveJLPTSession,
  settings,
  customTopics = [],
  customTopicQuestions = [],
}: JLPTPageProps) {
  const [practiceState, setPracticeState] = useState<PracticeState>('setup');

  // Multi-select states
  const [selectedLevels, setSelectedLevels] = useState<Set<JLPTLevel>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<QuestionCategory>>(new Set());
  const [selectedCustomTopics, setSelectedCustomTopics] = useState<Set<string>>(new Set());

  // Section configurations
  const [sectionConfigs, setSectionConfigs] = useState<SectionConfig[]>([]);
  const [showAdvancedSetup, setShowAdvancedSetup] = useState(false);

  // Simple mode - uses settings default or 20
  const [simpleQuestionCount, setSimpleQuestionCount] = useState(settings?.jlptDefaultQuestionCount ?? 20);

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
  const showExplanation = settings?.jlptShowExplanation ?? true;
  const autoNextDelay = settings?.jlptAutoNextDelay ?? 0;
  const preventRepetition = settings?.jlptPreventRepetition ?? true;
  const repetitionCooldown = settings?.jlptRepetitionCooldown ?? 3;
  const coverageMode = settings?.jlptCoverageMode ?? 'balanced';
  const showLevelAssessment = settings?.jlptShowLevelAssessment ?? true;
  const trackWeakAreas = settings?.jlptTrackWeakAreas ?? true;

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

  const getCategoryIcon = (category: QuestionCategory) =>
    QUESTION_CATEGORIES.find(c => c.value === category)?.icon || '?';

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

  // Calculate total available questions (JLPT + Custom)
  const getTotalAvailableQuestions = () => {
    return filteredQuestions.length + filteredCustomQuestions.length;
  };

  // Calculate total questions to practice
  const getTotalQuestions = () => {
    if (showAdvancedSetup) {
      return sectionConfigs.reduce((sum, c) => sum + c.questionCount, 0);
    }
    return Math.min(simpleQuestionCount, getTotalAvailableQuestions());
  };

  // Convert custom topic question to JLPT-compatible format for practice
  const convertCustomToJLPT = (q: CustomTopicQuestion): JLPTQuestion => {
    return {
      id: q.id,
      level: 'N5', // Default level for custom questions
      category: 'vocabulary', // Default category
      question: q.question,
      answers: q.answers,
      explanation: q.explanation,
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

  // Calculate category performance
  const categoryPerformance = useMemo((): CategoryPerformance[] => {
    const perfMap: Record<QuestionCategory, { correct: number; total: number; totalTime: number }> = {
      vocabulary: { correct: 0, total: 0, totalTime: 0 },
      grammar: { correct: 0, total: 0, totalTime: 0 },
      reading: { correct: 0, total: 0, totalTime: 0 },
      listening: { correct: 0, total: 0, totalTime: 0 },
    };

    results.forEach(r => {
      perfMap[r.category].total++;
      perfMap[r.category].totalTime += r.timeSpent;
      if (r.isCorrect) perfMap[r.category].correct++;
    });

    return Object.entries(perfMap)
      .filter(([_, data]) => data.total > 0)
      .map(([cat, data]) => ({
        category: cat as QuestionCategory,
        correct: data.correct,
        total: data.total,
        percentage: Math.round((data.correct / data.total) * 100),
        avgTime: Math.round(data.totalTime / data.total / 1000),
      }));
  }, [results]);

  // Get assessment level
  const getAssessmentLevel = (percentage: number) => {
    if (percentage >= ASSESSMENT_LEVELS.excellent.min) return ASSESSMENT_LEVELS.excellent;
    if (percentage >= ASSESSMENT_LEVELS.good.min) return ASSESSMENT_LEVELS.good;
    if (percentage >= ASSESSMENT_LEVELS.pass.min) return ASSESSMENT_LEVELS.pass;
    return ASSESSMENT_LEVELS.needsWork;
  };

  // Generate personalized advice
  const generateAdvice = useCallback((): { strengths: string[]; weaknesses: string[]; recommendations: string[] } => {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    const overallAccuracy = results.length > 0
      ? Math.round((results.filter(r => r.isCorrect).length / results.length) * 100)
      : 0;

    // Analyze category performance
    categoryPerformance.forEach(perf => {
      const catLabel = getCategoryLabel(perf.category);
      if (perf.percentage >= 80) {
        strengths.push(`${catLabel}: Nắm vững (${perf.percentage}%)`);
      } else if (perf.percentage < 50) {
        weaknesses.push(`${catLabel}: Cần cải thiện (${perf.percentage}%)`);
      }
    });

    // Generate recommendations based on weaknesses
    const weakCats = categoryPerformance.filter(p => p.percentage < 60);
    if (weakCats.length > 0) {
      weakCats.forEach(wc => {
        switch (wc.category) {
          case 'vocabulary':
            recommendations.push('📖 Ôn lại từ vựng qua flashcard mỗi ngày');
            recommendations.push('🎯 Học theo chủ đề để nhớ từ dễ hơn');
            break;
          case 'grammar':
            recommendations.push('📝 Luyện viết câu với mẫu ngữ pháp mới');
            recommendations.push('🔄 Làm bài tập ngữ pháp đa dạng hơn');
            break;
          case 'reading':
            recommendations.push('📰 Đọc văn bản ngắn tiếng Nhật mỗi ngày');
            recommendations.push('⏱️ Luyện đọc nhanh và tìm ý chính');
            break;
          case 'listening':
            recommendations.push('🎧 Nghe podcast/video tiếng Nhật hàng ngày');
            recommendations.push('🗣️ Shadowing - nghe và lặp lại theo');
            break;
        }
      });
    }

    // Overall recommendations
    if (overallAccuracy >= 80) {
      recommendations.push('🌟 Sẵn sàng thử thách cấp độ cao hơn!');
    } else if (overallAccuracy >= 60) {
      recommendations.push('💪 Tiếp tục luyện tập đều đặn, bạn đang tiến bộ!');
    } else {
      recommendations.push('📚 Nên ôn lại kiến thức cơ bản trước khi làm bài thi');
      recommendations.push('⏰ Dành thời gian học mỗi ngày, không nên học dồn');
    }

    // Deduplicate recommendations
    const uniqueRecs = [...new Set(recommendations)];

    return { strengths, weaknesses, recommendations: uniqueRecs.slice(0, 5) };
  }, [results, categoryPerformance]);

  // Stats calculation (memoized for performance)
  const { correctCount, totalCount, accuracy, avgTimePerQuestion } = useMemo(() => {
    const correct = results.filter(r => r.isCorrect).length;
    const total = results.length;
    const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
    const avgTime = total > 0
      ? Math.round(results.reduce((sum, r) => sum + r.timeSpent, 0) / total / 1000)
      : 0;
    return { correctCount: correct, totalCount: total, accuracy: acc, avgTimePerQuestion: avgTime };
  }, [results]);

  // Historical weak areas summary (from all sessions, not just current)
  const historicalWeakAreas = useMemo(() => {
    if (!trackWeakAreas || weakAreas.length === 0) return [];
    return weakAreas
      .filter(a => a.totalCount >= 3) // Only show areas with enough data
      .map(a => ({
        ...a,
        errorRate: Math.round((a.wrongCount / a.totalCount) * 100),
      }))
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 5); // Top 5 weak areas
  }, [weakAreas, trackWeakAreas]);

  // ===================== SETUP VIEW =====================
  if (practiceState === 'setup') {
    return (
      <div className="jlpt-page">
        <div className="jlpt-setup-container">
          <div className="jlpt-setup-header">
            <h1>
              <span className="jlpt-title-jp">日本語能力試験</span>
              <span className="jlpt-title-vi">Luyện thi JLPT</span>
            </h1>
            <p className="jlpt-subtitle">Tùy chỉnh bài thi theo nhu cầu của bạn</p>
          </div>

          {/* Level Selection */}
          <div className="jlpt-section">
            <div className="jlpt-section-header">
              <h3>Cấp độ JLPT</h3>
              <button className="btn-link-sm" onClick={selectAllLevels}>
                {selectedLevels.size === JLPT_LEVELS.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>
            <div className="jlpt-level-grid">
              {JLPT_LEVELS.map(level => {
                const levelQuestions = questions.filter(q =>
                  q.level === level &&
                  (selectedCategories.size === 0 || selectedCategories.has(q.category))
                );
                const isSelected = selectedLevels.has(level);
                return (
                  <button
                    key={level}
                    className={`jlpt-level-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleLevel(level)}
                  >
                    <span className="level-badge">{level}</span>
                    <span className="level-count">{levelQuestions.length} câu</span>
                    {isSelected && <CheckCircle size={18} className="check-icon" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Selection */}
          <div className="jlpt-section">
            <div className="jlpt-section-header">
              <h3>Phần thi</h3>
              <button className="btn-link-sm" onClick={selectAllCategories}>
                {selectedCategories.size === QUESTION_CATEGORIES.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>
            <div className="jlpt-category-grid">
              {QUESTION_CATEGORIES.map(cat => {
                const catQuestions = questions.filter(q =>
                  q.category === cat.value &&
                  (selectedLevels.size === 0 || selectedLevels.has(q.level))
                );
                const isSelected = selectedCategories.has(cat.value);
                return (
                  <button
                    key={cat.value}
                    className={`jlpt-category-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleCategory(cat.value)}
                  >
                    <span className="category-icon">{cat.icon}</span>
                    <span className="category-name">{cat.label}</span>
                    <span className="category-count">{catQuestions.length} câu</span>
                    {isSelected && <CheckCircle size={18} className="check-icon" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Topics Selection (if available) */}
          {customTopics.length > 0 && (
            <div className="jlpt-section custom-topics-section">
              <div className="jlpt-section-header">
                <h3>
                  <Sparkles size={18} />
                  Chủ đề mở rộng
                </h3>
                <button className="btn-link-sm" onClick={selectAllCustomTopics}>
                  {selectedCustomTopics.size === customTopics.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              </div>
              <div className="custom-topics-grid">
                {customTopics.map(topic => {
                  const topicQuestionCount = customTopicQuestions.filter(q => q.topicId === topic.id).length;
                  const isSelected = selectedCustomTopics.has(topic.id);
                  return (
                    <button
                      key={topic.id}
                      className={`custom-topic-select-card ${isSelected ? 'selected' : ''}`}
                      style={{ '--topic-color': topic.color } as React.CSSProperties}
                      onClick={() => toggleCustomTopic(topic.id)}
                    >
                      <span className="topic-select-icon" style={{ backgroundColor: `${topic.color}20` }}>
                        {topic.icon}
                      </span>
                      <div className="topic-select-info">
                        <span className="topic-select-name">{topic.name}</span>
                        <span className="topic-select-count">{topicQuestionCount} câu</span>
                      </div>
                      {isSelected && <CheckCircle size={18} className="check-icon" />}
                    </button>
                  );
                })}
              </div>
              {selectedCustomTopics.size > 0 && (
                <p className="custom-topics-hint">
                  Đã chọn {selectedCustomTopics.size} chủ đề ({filteredCustomQuestions.length} câu hỏi)
                </p>
              )}
            </div>
          )}

          {/* Question Count Configuration */}
          <div className="jlpt-section">
            <div className="jlpt-section-header">
              <h3>Số lượng câu hỏi</h3>
              <button
                className="btn-toggle-advanced"
                onClick={() => setShowAdvancedSetup(!showAdvancedSetup)}
              >
                <Settings size={16} />
                {showAdvancedSetup ? 'Chế độ đơn giản' : 'Tùy chỉnh từng phần'}
                {showAdvancedSetup ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {!showAdvancedSetup ? (
              <div className="jlpt-simple-count">
                <div className="count-options">
                  {[10, 20, 30, 50, 100].map(count => (
                    <button
                      key={count}
                      className={`count-option ${simpleQuestionCount === count ? 'selected' : ''}`}
                      onClick={() => setSimpleQuestionCount(count)}
                    >
                      {count} câu
                    </button>
                  ))}
                </div>
                <p className="count-note">
                  Có <strong>{filteredQuestions.length}</strong> câu hỏi phù hợp
                  {preventRepetition && (
                    <span className="coverage-hint"> • Ưu tiên câu chưa làm gần đây</span>
                  )}
                </p>
              </div>
            ) : (
              <div className="jlpt-advanced-setup">
                {sectionConfigs.length === 0 ? (
                  <p className="no-sections">Vui lòng chọn ít nhất một phần thi</p>
                ) : (
                  <div className="section-config-list">
                    {sectionConfigs.map(config => (
                      <div key={config.category} className="section-config-item">
                        <div className="section-info">
                          <span className="section-icon">{getCategoryIcon(config.category)}</span>
                          <span className="section-name">{getCategoryLabel(config.category)}</span>
                          <span className="section-available">({config.available} câu)</span>
                        </div>
                        <div className="section-count-control">
                          <button
                            className="count-btn"
                            onClick={() => updateSectionCount(config.category, Math.max(0, config.questionCount - 5))}
                            disabled={config.questionCount === 0}
                          >
                            -5
                          </button>
                          <input
                            type="number"
                            min="0"
                            max={config.available}
                            value={config.questionCount}
                            onChange={(e) => updateSectionCount(config.category, Math.min(config.available, Math.max(0, parseInt(e.target.value) || 0)))}
                            className="count-input"
                          />
                          <button
                            className="count-btn"
                            onClick={() => updateSectionCount(config.category, Math.min(config.available, config.questionCount + 5))}
                            disabled={config.questionCount >= config.available}
                          >
                            +5
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Summary & Start */}
          <div className="jlpt-summary">
            <div className="summary-stats">
              <div className="summary-item">
                <span className="summary-value">{getTotalQuestions()}</span>
                <span className="summary-label">Tổng câu hỏi</span>
              </div>
              <div className="summary-item">
                <span className="summary-value">
                  {selectedLevels.size === 0 ? 'Tất cả' : selectedLevels.size}
                </span>
                <span className="summary-label">Cấp độ</span>
              </div>
              <div className="summary-item">
                <span className="summary-value">
                  {selectedCategories.size === 0 ? 'Tất cả' : selectedCategories.size}
                </span>
                <span className="summary-label">Phần thi</span>
              </div>
            </div>

            <button
              className="btn btn-primary btn-start"
              onClick={startPractice}
              disabled={getTotalQuestions() === 0}
            >
              <Play size={20} />
              Bắt đầu luyện tập
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===================== RESULT VIEW WITH ASSESSMENT =====================
  if (practiceState === 'result') {
    const assessmentLevel = getAssessmentLevel(accuracy);
    const advice = generateAdvice();

    return (
      <div className="jlpt-page">
        <div className="jlpt-container">
          <div className="jlpt-practice-result">
            {/* Header with badge */}
            <div className="result-header">
              <h2>Kết quả luyện tập</h2>
              <span className="result-badge" style={{ backgroundColor: assessmentLevel.color }}>
                {assessmentLevel.emoji} {assessmentLevel.label}
              </span>
            </div>

            {/* Main Stats */}
            <div className="result-stats">
              <div className="stat-item correct">
                <CheckCircle size={24} />
                <span className="stat-value">{correctCount}</span>
                <span className="stat-label">Đúng</span>
              </div>
              <div className="stat-item wrong">
                <XCircle size={24} />
                <span className="stat-value">{totalCount - correctCount}</span>
                <span className="stat-label">Sai</span>
              </div>
              <div className="stat-item accuracy">
                <Target size={24} />
                <span className="stat-value">{accuracy}%</span>
                <span className="stat-label">Độ chính xác</span>
              </div>
              <div className="stat-item time">
                <TrendingUp size={24} />
                <span className="stat-value">{avgTimePerQuestion}s</span>
                <span className="stat-label">TB/câu</span>
              </div>
            </div>

            {/* Level Assessment Section */}
            {showLevelAssessment && (
              <div className="level-assessment">
                <h3><Award size={20} /> Đánh giá trình độ</h3>

                {/* Category Breakdown */}
                <div className="category-breakdown">
                  <h4>Phân tích theo từng phần</h4>
                  <div className="breakdown-grid">
                    {categoryPerformance.map(perf => {
                      const catLevel = getAssessmentLevel(perf.percentage);
                      return (
                        <div key={perf.category} className="breakdown-item">
                          <div className="breakdown-header">
                            <span className="breakdown-icon">{getCategoryIcon(perf.category)}</span>
                            <span className="breakdown-name">{getCategoryLabel(perf.category)}</span>
                          </div>
                          <div className="breakdown-bar">
                            <div
                              className="breakdown-fill"
                              style={{
                                width: `${perf.percentage}%`,
                                backgroundColor: catLevel.color,
                              }}
                            />
                          </div>
                          <div className="breakdown-stats">
                            <span>{perf.correct}/{perf.total}</span>
                            <span className="breakdown-percent">{perf.percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="assessment-feedback">
                  {advice.strengths.length > 0 && (
                    <div className="feedback-section strengths">
                      <h4><Star size={18} /> Điểm mạnh</h4>
                      <ul>
                        {advice.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}

                  {advice.weaknesses.length > 0 && (
                    <div className="feedback-section weaknesses">
                      <h4><AlertTriangle size={18} /> Cần cải thiện</h4>
                      <ul>
                        {advice.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                  )}

                  <div className="feedback-section recommendations">
                    <h4><Lightbulb size={18} /> Lời khuyên</h4>
                    <ul>
                      {advice.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                </div>

                {/* Historical Weak Areas */}
                {historicalWeakAreas.length > 0 && (
                  <div className="historical-weak-areas">
                    <h4><Target size={18} /> Các điểm yếu cần tập trung (tích lũy)</h4>
                    <div className="weak-areas-list">
                      {historicalWeakAreas.map((area, idx) => (
                        <div key={`${area.level}-${area.category}`} className="weak-area-item">
                          <span className="weak-rank">#{idx + 1}</span>
                          <span className="weak-info">
                            <span className="weak-level">{area.level}</span>
                            <span className="weak-category">{getCategoryLabel(area.category)}</span>
                          </span>
                          <span className="weak-stats">
                            {area.wrongCount}/{area.totalCount} sai ({area.errorRate}%)
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="weak-hint">Chế độ "Ưu tiên điểm yếu" sẽ tập trung vào các phần này</p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="result-actions">
              <button className="btn btn-primary" onClick={startPractice}>
                <RotateCcw size={18} />
                Luyện tập lại
              </button>
              <button className="btn btn-secondary" onClick={resetPractice}>
                <Settings size={18} />
                Thiết lập mới
              </button>
            </div>

            {/* Detailed Review */}
            <div className="result-review">
              <h3><BookOpen size={20} /> Chi tiết kết quả</h3>
              {practiceQuestions.map((question, idx) => {
                const result = results[idx];
                return (
                  <div key={question.id} className={`review-item ${result?.isCorrect ? 'correct' : 'wrong'}`}>
                    <div className="review-header">
                      <div className="review-meta">
                        <span className="review-number">Câu {idx + 1}</span>
                        <span className="review-level">{question.level}</span>
                        <span className="review-category">{getCategoryLabel(question.category)}</span>
                      </div>
                      <span className={`review-status ${result?.isCorrect ? 'correct' : 'wrong'}`}>
                        {result?.isCorrect ? '✓ Đúng' : '✗ Sai'}
                      </span>
                    </div>
                    <p className="review-question">{question.question}</p>
                    <div className="review-answers">
                      {question.answers.map((answer, aIdx) => (
                        <div
                          key={aIdx}
                          className={`review-answer ${answer.isCorrect ? 'correct' : ''} ${result?.selectedAnswer === aIdx && !answer.isCorrect ? 'selected-wrong' : ''}`}
                        >
                          <span className="answer-letter">{String.fromCharCode(65 + aIdx)}.</span>
                          <span>{answer.text}</span>
                          {answer.isCorrect && <span className="correct-mark">✓</span>}
                          {result?.selectedAnswer === aIdx && !answer.isCorrect && <span className="wrong-mark">✗</span>}
                        </div>
                      ))}
                    </div>
                    {showExplanation && question.explanation && (
                      <div className="review-explanation">
                        <strong>Giải thích:</strong> {question.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===================== PRACTICE VIEW =====================
  const currentQuestion = practiceQuestions[currentIndex];

  return (
    <div className="jlpt-page">
      <div className="jlpt-container">
        <div className="jlpt-practice">
          <div className="practice-header">
            <span className="practice-progress">
              Câu {currentIndex + 1} / {practiceQuestions.length}
            </span>
            <div className="practice-score">
              <span className="score-correct">✓ {correctCount}</span>
              <span className="score-wrong">✗ {results.length - correctCount}</span>
            </div>
          </div>

          <div className="practice-question-card">
            <div className="question-meta">
              <span className="question-level">{currentQuestion.level}</span>
              <span className="question-category">{getCategoryLabel(currentQuestion.category)}</span>
            </div>

            <p className="question-text">{currentQuestion.question}</p>

            <div className="practice-answers">
              {currentQuestion.answers.map((answer, index) => (
                <button
                  key={index}
                  className={`practice-answer-btn ${selectedAnswer === index ? 'selected' : ''} ${
                    showResult
                      ? answer.isCorrect
                        ? 'correct'
                        : selectedAnswer === index
                          ? 'wrong'
                          : ''
                      : ''
                  }`}
                  onClick={() => handleSelectAnswer(index)}
                  disabled={showResult}
                >
                  <span className="answer-letter">{String.fromCharCode(65 + index)}.</span>
                  <span className="answer-text">{answer.text}</span>
                  {showResult && answer.isCorrect && <CheckCircle size={20} className="correct-icon" />}
                  {showResult && selectedAnswer === index && !answer.isCorrect && <XCircle size={20} className="wrong-icon" />}
                </button>
              ))}
            </div>

            {showResult && showExplanation && currentQuestion.explanation && (
              <div className="practice-explanation">
                <strong>Giải thích:</strong> {currentQuestion.explanation}
              </div>
            )}
          </div>

          <div className="practice-actions">
            {!showResult ? (
              <button
                className="btn btn-primary btn-large"
                onClick={handleSubmit}
                disabled={selectedAnswer === null}
              >
                Xác nhận
              </button>
            ) : (
              <button className="btn btn-primary btn-large" onClick={handleNext}>
                {currentIndex < practiceQuestions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
              </button>
            )}
            <button className="btn btn-secondary" onClick={resetPractice}>
              Dừng lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
