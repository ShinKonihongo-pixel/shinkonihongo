// Game creation form component with unified Room Modal design system

import { useState, useMemo, useCallback } from 'react';
import {
  X,
  Gamepad2,
  BookOpen,
  Layers,
  Clock,
  HelpCircle,
  Users,
  Play,
  ChevronRight,
  Check,
  Eye,
} from 'lucide-react';
import type { Flashcard, JLPTLevel, Lesson } from '../../types/flashcard';
import type { JLPTQuestion, JLPTLevel as JLPTQuestionLevel } from '../../types/jlpt-question';
import type { CreateGameData, GameQuestionSource, GameDifficultyLevel, HostMode } from '../../types/quiz-game';
import type { AppSettings } from '../../hooks/use-settings';
import type { UserRole } from '../../types/user';
import { useBodyScrollLock } from '../../hooks/use-body-scroll-lock';
import { JLPT_LEVELS } from '../../constants/jlpt';

interface GameCreateProps {
  flashcards: Flashcard[];
  jlptQuestions: JLPTQuestion[];
  getLessonsByLevel: (level: JLPTLevel) => Lesson[];
  getChildLessons: (parentId: string) => Lesson[];
  onCreateGame: (data: CreateGameData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
  gameSettings: AppSettings;
  userRole?: UserRole;
}

const JLPT_QUESTION_LEVELS: JLPTQuestionLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

// Difficulty options for flashcard source
const DIFFICULTY_OPTIONS: { value: GameDifficultyLevel; label: string; color: string }[] = [
  { value: 'super_hard', label: 'Siêu khó', color: '#DC2626' },
  { value: 'hard', label: 'Khó', color: '#F59E0B' },
  { value: 'medium', label: 'Vừa', color: '#3B82F6' },
  { value: 'easy', label: 'Dễ', color: '#10B981' },
];

// Role-based limits
function getMaxRounds(role?: UserRole): number {
  if (role === 'super_admin' || role === 'vip_user') return 50;
  return 20;
}

function getMaxPlayers(role?: UserRole): number {
  if (role === 'super_admin' || role === 'vip_user') return 50;
  if (role === 'admin' || role === 'branch_admin' || role === 'director') return 20;
  return 10;
}

export function GameCreate({
  flashcards,
  jlptQuestions,
  getLessonsByLevel,
  getChildLessons,
  onCreateGame,
  onCancel,
  loading,
  error,
  gameSettings,
  userRole,
}: GameCreateProps) {
  useBodyScrollLock();
  const [title, setTitle] = useState('');
  const [source, setSource] = useState<GameQuestionSource>('flashcards');
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [selectedJLPTLevels, setSelectedJLPTLevels] = useState<string[]>([]);
  const [totalRounds, setTotalRounds] = useState(20);
  const [timePerQuestion, setTimePerQuestion] = useState(15);
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficultyLevel | null>(null);
  const [expandedLevel, setExpandedLevel] = useState<JLPTLevel | null>(null);
  const [upgradeHint, setUpgradeHint] = useState<string | null>(null);
  const [lessonSearch, setLessonSearch] = useState('');
  const [hostMode, setHostMode] = useState<HostMode>('play');
  const isSuperAdmin = userRole === 'super_admin';

  const maxRoundsLimit = getMaxRounds(userRole);
  const maxPlayersLimit = getMaxPlayers(userRole);
  // VIP/Super Admin max — always shown on slider
  const VIP_MAX_ROUNDS = 50;
  const VIP_MAX_PLAYERS = 50;
  const isVipOrAdmin = userRole === 'super_admin' || userRole === 'vip_user';

  // Show upgrade hint briefly
  const showUpgradeHint = (field: string) => {
    setUpgradeHint(field);
    setTimeout(() => setUpgradeHint(prev => prev === field ? null : prev), 3000);
  };

  // Cards in selected lessons
  const lessonCards = useMemo(
    () => flashcards.filter(c => selectedLessons.includes(c.lessonId)),
    [flashcards, selectedLessons],
  );

  // Count cards per card-difficulty from selected lessons
  const difficultyCount = useMemo(() => {
    const counts: Record<GameDifficultyLevel, number> = { super_hard: 0, hard: 0, medium: 0, easy: 0 };
    for (const c of lessonCards) {
      if (c.difficultyLevel && c.difficultyLevel !== 'unset') {
        counts[c.difficultyLevel]++;
      }
    }
    return counts;
  }, [lessonCards]);

  // Check if a game difficulty level can be fulfilled based on mix config + totalRounds
  const mixConfig = gameSettings.quizDifficultyMix;
  const canFulfillDifficulty = useMemo(() => {
    const result: Record<GameDifficultyLevel, boolean> = { super_hard: false, hard: false, medium: false, easy: false };
    const levels: GameDifficultyLevel[] = ['super_hard', 'hard', 'medium', 'easy'];

    for (const level of levels) {
      const row = mixConfig[level];
      const rowTotal = row.super_hard + row.hard + row.medium + row.easy;
      if (rowTotal === 0) {
        // No mix configured — need at least 4 cards total
        result[level] = lessonCards.length >= 4;
        continue;
      }
      // For each card difficulty in the mix, check if enough cards exist
      let canFulfill = true;
      for (const cardDiff of levels) {
        const pct = row[cardDiff] / rowTotal;
        const needed = Math.ceil(pct * totalRounds);
        if (needed > 0 && difficultyCount[cardDiff] < needed) {
          canFulfill = false;
          break;
        }
      }
      result[level] = canFulfill;
    }
    return result;
  }, [mixConfig, totalRounds, difficultyCount, lessonCards.length]);

  // Auto-deselect if selected difficulty can no longer be fulfilled
  if (selectedDifficulty && !canFulfillDifficulty[selectedDifficulty]) {
    setTimeout(() => setSelectedDifficulty(null), 0);
  }

  // Available cards after difficulty filter
  const availableCards = useMemo(() => {
    if (!selectedDifficulty) return lessonCards.length;
    // When a difficulty is selected, count cards that match the mix ratios
    const row = mixConfig[selectedDifficulty];
    const rowTotal = row.super_hard + row.hard + row.medium + row.easy;
    if (rowTotal === 0) return lessonCards.length;
    // Sum available cards weighted by mix (cards that will actually be used)
    const levels: GameDifficultyLevel[] = ['super_hard', 'hard', 'medium', 'easy'];
    return levels.reduce((sum, d) => sum + Math.min(difficultyCount[d], Math.ceil((row[d] / rowTotal) * 999)), 0);
  }, [lessonCards.length, selectedDifficulty, mixConfig, difficultyCount]);

  // Get all lessons for lookup
  const allLessonsMap = useMemo(() => {
    const map = new Map<string, string>();
    JLPT_LEVELS.forEach(level => {
      const lessons = getLessonsByLevel(level);
      lessons.forEach(lesson => {
        map.set(lesson.id, lesson.name);
        const children = getChildLessons(lesson.id);
        children.forEach(child => map.set(child.id, child.name));
      });
    });
    return map;
  }, [getLessonsByLevel, getChildLessons]);

  // Lesson search: flat list when query active, null = grouped view
  const filteredLessons = useMemo<Lesson[] | null>(() => {
    if (!lessonSearch.trim()) return null;
    const q = lessonSearch.toLowerCase();
    const allLessons: Lesson[] = [];
    JLPT_LEVELS.forEach(level => {
      getLessonsByLevel(level).forEach(l => {
        if (l.name.toLowerCase().includes(q)) allLessons.push(l);
        getChildLessons(l.id).forEach(child => {
          if (child.name.toLowerCase().includes(q)) allLessons.push(child);
        });
      });
    });
    return allLessons;
  }, [lessonSearch, getLessonsByLevel, getChildLessons]);

  // Card counts per JLPT level (for level headers)
  const levelCardCount = useMemo(() => {
    const counts: Record<string, number> = {};
    JLPT_LEVELS.forEach(level => {
      const lessonIds = new Set<string>();
      getLessonsByLevel(level).forEach(l => {
        lessonIds.add(l.id);
        getChildLessons(l.id).forEach(child => lessonIds.add(child.id));
      });
      counts[level] = flashcards.filter(c => lessonIds.has(c.lessonId)).length;
    });
    return counts;
  }, [flashcards, getLessonsByLevel, getChildLessons]);

  // Get selected lesson names
  const selectedLessonNames = useMemo(() => {
    return selectedLessons.map(id => allLessonsMap.get(id) || id).slice(0, 5);
  }, [selectedLessons, allLessonsMap]);

  // Count available JLPT questions based on filters
  const availableJLPTQuestions = useMemo(() => {
    let filtered = jlptQuestions;
    if (selectedJLPTLevels.length > 0) {
      filtered = filtered.filter(q => selectedJLPTLevels.includes(q.level));
    }
    return filtered.length;
  }, [jlptQuestions, selectedJLPTLevels]);

  // Select/deselect a single difficulty level
  const handleToggleDifficulty = (diff: GameDifficultyLevel) => {
    setSelectedDifficulty(prev => prev === diff ? null : diff);
  };

  // Toggle JLPT level selection
  const handleToggleJLPTLevel = (level: string) => {
    setSelectedJLPTLevels(prev =>
      prev.includes(level)
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
  };

  // Toggle a parent lesson + all its children together
  const handleToggleLesson = (lessonId: string) => {
    const children = getChildLessons(lessonId);
    const allIds = [lessonId, ...children.map(c => c.id)];

    setSelectedLessons(prev => {
      const isSelected = prev.includes(lessonId);
      if (isSelected) {
        return prev.filter(id => !allIds.includes(id));
      }
      return [...new Set([...prev, ...allIds])];
    });
  };

  const handleSelectAllInLevel = (level: JLPTLevel) => {
    const levelLessons = getLessonsByLevel(level);
    const allLessonIds: string[] = [];

    levelLessons.forEach(lesson => {
      allLessonIds.push(lesson.id);
      const children = getChildLessons(lesson.id);
      children.forEach(child => allLessonIds.push(child.id));
    });

    const allSelected = allLessonIds.every(id => selectedLessons.includes(id));

    if (allSelected) {
      setSelectedLessons(prev => prev.filter(id => !allLessonIds.includes(id)));
    } else {
      setSelectedLessons(prev => [...new Set([...prev, ...allLessonIds])]);
    }
  };

  const handleSelectAllLevels = useCallback(() => {
    JLPT_LEVELS.forEach(level => {
      const levelLessons = getLessonsByLevel(level);
      const allLessonIds: string[] = [];
      levelLessons.forEach(lesson => {
        allLessonIds.push(lesson.id);
        getChildLessons(lesson.id).forEach(child => allLessonIds.push(child.id));
      });
      setSelectedLessons(prev => [...new Set([...prev, ...allLessonIds])]);
    });
  }, [getLessonsByLevel, getChildLessons]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (source === 'flashcards') {
      if (selectedLessons.length === 0) return;
      if (availableCards < 4) return;
      const actualRounds = Math.min(totalRounds, availableCards);
      await onCreateGame({
        title: title || 'Đại Chiến Tiếng Nhật',
        source: 'flashcards',
        hostMode: isSuperAdmin ? hostMode : undefined,
        lessonIds: selectedLessons,
        lessonNames: selectedLessonNames,
        difficultyLevels: selectedDifficulty ? [selectedDifficulty] : undefined,
        difficultyMix: gameSettings.quizDifficultyMix,
        totalRounds: actualRounds,
        timePerQuestion,
        maxPlayers,
        questionContent: gameSettings.gameQuestionContent,
        answerContent: gameSettings.gameAnswerContent,
        settings: { specialRoundEvery: 5 },
      });
    } else {
      if (availableJLPTQuestions < 4) return;
      const actualRounds = Math.min(totalRounds, availableJLPTQuestions);
      await onCreateGame({
        title: title || 'Đại Chiến JLPT',
        source: 'jlpt',
        hostMode: isSuperAdmin ? hostMode : undefined,
        lessonIds: [],
        jlptLevels: selectedJLPTLevels.length > 0 ? selectedJLPTLevels : undefined,
        totalRounds: actualRounds,
        timePerQuestion,
        maxPlayers,
        settings: { specialRoundEvery: 5 },
      });
    }
  };

  const canSubmit = source === 'flashcards'
    ? selectedLessons.length > 0 && availableCards >= 4
    : availableJLPTQuestions >= 4;

  // Calculate slider progress percentages (against full VIP range)
  const roundsPercent = ((totalRounds - 10) / (VIP_MAX_ROUNDS - 10)) * 100;
  const timePercent = ((timePerQuestion - 5) / (30 - 5)) * 100;
  const playersPercent = ((maxPlayers - 2) / (VIP_MAX_PLAYERS - 2)) * 100;

  return (
    <div className="rm-overlay" onClick={onCancel}>
      <div className="rm-modal large" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <header className="rm-header">
          <div
            className="rm-header-gradient"
            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)' }}
          />
          <div className="rm-header-icon">
            <Gamepad2 size={24} color="white" />
          </div>
          <div className="rm-header-content">
            <h1 className="rm-title">Tạo Phòng Chơi</h1>
            <span className="rm-subtitle">Đại Chiến Tiếng Nhật</span>
          </div>
          <button className="rm-close-btn" onClick={onCancel} type="button">
            <X size={20} />
          </button>
        </header>

        {/* Body */}
        <div className="rm-body">
          {error && (
            <div className="rm-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Room Title */}
          <div className="rm-field">
            <label className="rm-label">
              <Gamepad2 size={16} />
              <span>Tên phòng</span>
            </label>
            <input
              type="text"
              className="rm-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={source === 'flashcards' ? 'Đại Chiến Tiếng Nhật' : 'Đại Chiến JLPT'}
            />
          </div>

          {/* Source Selection */}
          <div className="rm-field">
            <label className="rm-label">
              <BookOpen size={16} />
              <span>Đại chiến</span>
            </label>
            <div className="rm-pills">
              <button
                type="button"
                className={`rm-pill lg ${source === 'flashcards' ? 'active' : ''}`}
                onClick={() => setSource('flashcards')}
              >
                Từ vựng
              </button>
              <button
                type="button"
                className={`rm-pill lg ${source === 'jlpt' ? 'active' : ''}`}
                onClick={() => setSource('jlpt')}
              >
                JLPT
              </button>
            </div>
            {source === 'flashcards' && (
              <div className="rm-quick-select">
                <span className="rm-quick-label">Chọn nhanh:</span>
                <button type="button" className="rm-quick-btn" onClick={() => handleSelectAllInLevel('N5')}>
                  Tất cả N5
                </button>
                <button type="button" className="rm-quick-btn" onClick={() => handleSelectAllInLevel('N4')}>
                  Tất cả N4
                </button>
                <button type="button" className="rm-quick-btn" onClick={() => handleSelectAllInLevel('N3')}>
                  Tất cả N3
                </button>
                <button type="button" className="rm-quick-btn" onClick={handleSelectAllLevels}>
                  Tất cả
                </button>
                <button type="button" className="rm-quick-btn" onClick={() => setSelectedLessons([])}>
                  Bỏ chọn
                </button>
              </div>
            )}
          </div>

          {source === 'flashcards' ? (
            <div className="rm-field">
              <label className="rm-label">
                <Layers size={16} />
                <span>Chọn phạm vi câu hỏi</span>
              </label>

              <input
                type="text"
                className="rm-input rm-lesson-search"
                value={lessonSearch}
                onChange={e => setLessonSearch(e.target.value)}
                placeholder="🔍 Tìm bài học..."
              />

              <div className="rm-lesson-selector">
                {filteredLessons !== null ? (
                  /* Flat search results */
                  filteredLessons.length === 0 ? (
                    <div style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', textAlign: 'center' }}>
                      Không tìm thấy bài học nào
                    </div>
                  ) : (
                    <div className="rm-lesson-grid">
                      {filteredLessons.map(lesson => (
                        <label key={lesson.id} className="rm-checkbox-label">
                          <input
                            type="checkbox"
                            checked={selectedLessons.includes(lesson.id)}
                            onChange={() => handleToggleLesson(lesson.id)}
                          />
                          <span>{lesson.name}</span>
                        </label>
                      ))}
                    </div>
                  )
                ) : (
                  /* Normal grouped view */
                  JLPT_LEVELS.map(level => {
                    const levelLessons = getLessonsByLevel(level);
                    const isExpanded = expandedLevel === level;

                    if (levelLessons.length === 0) return null;

                    // Check if all parent lessons in this level are selected
                    const allSelected = levelLessons.length > 0 &&
                      levelLessons.every(l => selectedLessons.includes(l.id));

                    return (
                      <div key={level} className={`rm-lesson-level ${isExpanded ? 'expanded' : ''}`}>
                        <div
                          className="rm-lesson-level-header"
                          onClick={() => setExpandedLevel(isExpanded ? null : level)}
                        >
                          <ChevronRight size={16} className="rm-expand-icon" />
                          <span className="rm-level-name">{level}</span>
                          <span className="rm-level-count">({levelCardCount[level] ?? 0} thẻ)</span>
                          <button
                            type="button"
                            className={`rm-btn ${allSelected ? 'rm-btn-primary' : ''}`}
                            style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAllInLevel(level);
                            }}
                          >
                            {allSelected ? (
                              <>
                                <Check size={14} />
                                Đã chọn
                              </>
                            ) : 'Chọn tất cả'}
                          </button>
                        </div>

                        {/* Only show parent lessons — selecting auto-includes children */}
                        {isExpanded && (
                          <div className="rm-lesson-grid">
                            {levelLessons.map(lesson => (
                              <label key={lesson.id} className="rm-checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={selectedLessons.includes(lesson.id)}
                                  onChange={() => handleToggleLesson(lesson.id)}
                                />
                                <span>{lesson.name}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Selected summary strip */}
              {selectedLessons.length > 0 && (
                <div className="rm-selected-summary">
                  <span className="rm-selected-count">{selectedLessons.length} bài học đã chọn</span>
                  <span className="rm-selected-cards">{availableCards} thẻ</span>
                  {selectedDifficulty && (
                    <span
                      className="rm-selected-diff"
                      style={{ color: DIFFICULTY_OPTIONS.find(d => d.value === selectedDifficulty)?.color }}
                    >
                      {DIFFICULTY_OPTIONS.find(d => d.value === selectedDifficulty)?.label}
                    </span>
                  )}
                </div>
              )}

              {selectedLessons.length > 0 && availableCards < 4 && (
                <div className="rm-error" style={{ marginTop: 'var(--rm-space-sm)' }}>
                  <span>⚠️</span>
                  <span>Cần ít nhất 4 thẻ để tạo game</span>
                </div>
              )}
            </div>
          ) : (
            <div className="rm-field">
              <label className="rm-label">
                <Layers size={16} />
                <span>Chọn phạm vi câu hỏi</span>
              </label>
              <div className="rm-pills">
                {JLPT_QUESTION_LEVELS.map(level => {
                  const count = jlptQuestions.filter(q => q.level === level).length;
                  return (
                    <button
                      key={level}
                      type="button"
                      className={`rm-pill ${selectedJLPTLevels.includes(level) ? 'active' : ''}`}
                      onClick={() => handleToggleJLPTLevel(level)}
                      data-level={level}
                    >
                      {level}
                      <span className="rm-pill-count">{count}</span>
                    </button>
                  );
                })}
              </div>
              <span className="rm-filter-hint">Không chọn = tất cả cấp độ</span>

              {availableJLPTQuestions < 4 && (
                <div className="rm-error" style={{ marginTop: 'var(--rm-space-sm)' }}>
                  <span>⚠️</span>
                  <span>Cần ít nhất 4 câu hỏi JLPT để tạo game</span>
                </div>
              )}
            </div>
          )}

          {/* Difficulty level — flashcards source only */}
          {source === 'flashcards' && (
            <div className="rm-field">
              <label className="rm-label">
                <Layers size={16} />
                <span>Mức độ</span>
              </label>
              <div className="rm-pills">
                {DIFFICULTY_OPTIONS.map(opt => {
                  const canFulfill = canFulfillDifficulty[opt.value];
                  const isSelected = selectedDifficulty === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={`rm-pill ${isSelected ? 'active' : ''}`}
                      disabled={!canFulfill}
                      onClick={() => canFulfill && handleToggleDifficulty(opt.value)}
                      style={isSelected ? { background: opt.color, borderColor: opt.color } : undefined}
                      title={canFulfill ? 'Đủ câu hỏi' : 'Chưa đủ câu hỏi cho mức độ này'}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <span className="rm-filter-hint">Không chọn = tất cả mức độ</span>
            </div>
          )}

          {/* Rounds */}
          <div className="rm-field">
            <label className="rm-label">
              <HelpCircle size={16} />
              <span>Số câu hỏi</span>
              <span className="rm-label-hint">
                <span className="rm-label-value">{totalRounds} câu</span>
              </span>
            </label>
            <div className="rm-slider-wrap">
              <input
                type="range"
                className="rm-slider"
                min={10}
                max={VIP_MAX_ROUNDS}
                step={5}
                value={totalRounds}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val > maxRoundsLimit) {
                    setTotalRounds(maxRoundsLimit);
                    showUpgradeHint('rounds');
                  } else {
                    setTotalRounds(val);
                  }
                }}
                style={{ '--progress': `${roundsPercent}%` } as React.CSSProperties}
              />
              <div className="rm-slider-labels">
                <span>10</span>
                {!isVipOrAdmin && <span style={{ color: 'var(--rm-primary, #7C3AED)' }}>{maxRoundsLimit}</span>}
                <span>{VIP_MAX_ROUNDS}</span>
              </div>
            </div>
            {upgradeHint === 'rounds' && (
              <div className="rm-upgrade-hint">🌟 Nâng cấp VIP để tạo tới {VIP_MAX_ROUNDS} câu hỏi</div>
            )}
          </div>

          {/* Time per question - only for flashcards source (JLPT uses per-category settings) */}
          {source === 'flashcards' && (
            <div className="rm-field">
              <label className="rm-label">
                <Clock size={16} />
                <span>Thời gian mỗi câu</span>
                <span className="rm-label-hint">
                  <span className="rm-label-value">{timePerQuestion}s</span>
                </span>
              </label>
              <div className="rm-slider-wrap">
                <input
                  type="range"
                  className="rm-slider"
                  min={5}
                  max={30}
                  step={5}
                  value={timePerQuestion}
                  onChange={(e) => setTimePerQuestion(parseInt(e.target.value))}
                  style={{ '--progress': `${timePercent}%` } as React.CSSProperties}
                />
                <div className="rm-slider-labels">
                  <span>5s</span>
                  <span>15s</span>
                  <span>30s</span>
                </div>
              </div>
            </div>
          )}

          {/* Max Players */}
          <div className="rm-field">
            <label className="rm-label">
              <Users size={16} />
              <span>Số người chơi tối đa</span>
              <span className="rm-label-hint">
                <span className="rm-label-value">{maxPlayers} người</span>
              </span>
            </label>
            <div className="rm-slider-wrap">
              <input
                type="range"
                className="rm-slider"
                min={2}
                max={VIP_MAX_PLAYERS}
                step={1}
                value={maxPlayers}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val > maxPlayersLimit) {
                    setMaxPlayers(maxPlayersLimit);
                    showUpgradeHint('players');
                  } else {
                    setMaxPlayers(val);
                  }
                }}
                style={{ '--progress': `${playersPercent}%` } as React.CSSProperties}
              />
              <div className="rm-slider-labels">
                <span>2</span>
                {!isVipOrAdmin && <span style={{ color: 'var(--rm-primary, #7C3AED)' }}>{maxPlayersLimit}</span>}
                <span>{VIP_MAX_PLAYERS}</span>
              </div>
            </div>
            {upgradeHint === 'players' && (
              <div className="rm-upgrade-hint">🌟 Nâng cấp VIP để mời tới {VIP_MAX_PLAYERS} người chơi</div>
            )}
          </div>

          {/* Host Mode — super_admin only */}
          {isSuperAdmin && (
            <div className="rm-field">
              <label className="rm-label">
                <Eye size={16} />
                <span>Chế độ</span>
              </label>
              <div className="rm-pills">
                <button
                  type="button"
                  className={`rm-pill lg ${hostMode === 'play' ? 'active' : ''}`}
                  onClick={() => setHostMode('play')}
                >
                  🎮 Chơi cùng
                </button>
                <button
                  type="button"
                  className={`rm-pill lg ${hostMode === 'spectate' ? 'active' : ''}`}
                  onClick={() => setHostMode('spectate')}
                >
                  👁️ Theo dõi
                </button>
              </div>
              {hostMode === 'spectate' && (
                <span className="rm-filter-hint">Bạn sẽ theo dõi tiến trình chơi mà không tham gia trả lời</span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="rm-footer">
          {/* Question pool indicator */}
          {(() => {
            const available = source === 'flashcards' ? availableCards : availableJLPTQuestions;
            const ratio = totalRounds > 0 ? available / totalRounds : 0;
            const fillClass = ratio >= 1.5 ? 'sufficient' : ratio >= 1 ? 'tight' : 'insufficient';
            return (
              <div className="rm-question-pool">
                <div className="rm-pool-bar">
                  <div
                    className={`rm-pool-fill ${fillClass}`}
                    style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                  />
                </div>
                <div className="rm-pool-info">
                  <span className="rm-pool-count">{available} câu hỏi có sẵn</span>
                  <span className="rm-pool-need">/ cần {totalRounds} câu</span>
                </div>
              </div>
            );
          })()}
          <button type="button" className="rm-btn rm-btn-ghost" onClick={onCancel}>
            Hủy
          </button>
          <button
            type="submit"
            className="rm-btn rm-btn-primary rm-btn-lg"
            disabled={loading || !canSubmit}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <span className="rm-spinner" />
                <span>Đang tạo...</span>
              </>
            ) : (
              <>
                <Play size={20} fill="white" />
                <span>Tạo phòng</span>
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
