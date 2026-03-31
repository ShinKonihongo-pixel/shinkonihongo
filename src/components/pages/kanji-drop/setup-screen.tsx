// Kanji Drop setup screen — JLPT level selector, lesson picker, start level, VIP badge

import { Home, Play, Target, Star, Crown, BookOpen } from 'lucide-react';
import type { JLPTLevel } from '../../../types/flashcard';
import { JLPT_LEVELS } from '../../../constants/jlpt';
import type { SetupConfig } from './kanji-drop-types';

interface LessonInfo {
  id: string;
  count: number;
  jlptLevel: JLPTLevel;
  name?: string;
}

interface SetupScreenProps {
  config: SetupConfig;
  availableKanjiCount: number;
  countByLevel: Record<string, number>;
  kanjiLessons: LessonInfo[];
  lessonNames?: Record<string, string>;
  isVip: boolean;
  onClose: () => void;
  onStart: () => void;
  onToggleLevel: (level: JLPTLevel) => void;
  onToggleLesson: (lessonId: string) => void;
  onSetStartLevel: (level: number) => void;
}

export function SetupScreen({
  config, availableKanjiCount, countByLevel, kanjiLessons, lessonNames,
  isVip, onClose, onStart, onToggleLevel, onToggleLesson, onSetStartLevel,
}: SetupScreenProps) {
  // Get display name for a lesson
  const getLessonName = (lesson: LessonInfo, index: number): string => {
    if (lessonNames && lessonNames[lesson.id]) return lessonNames[lesson.id];
    return `Bài ${index + 1}`;
  };

  return (
    <div className="kd-setup">
      <div className="kd-setup-card">
        <div className="kd-setup-header">
          <span className="kd-logo-icon">🀄</span>
          <h1>Kanji Drop</h1>
          <p className="kd-subtitle">Xếp kanji - Gom nhóm - Tiêu diệt</p>
          {isVip && <span className="kd-vip-badge"><Crown size={14} /> VIP</span>}
        </div>

        <div className="kd-setup-body">
          {/* JLPT Level Selection */}
          <div className="kd-section">
            <div className="kd-section-header">
              <Target size={20} />
              <h3>Chọn cấp độ JLPT</h3>
            </div>
            <div className="kd-levels">
              {JLPT_LEVELS.map(level => (
                <button
                  key={level}
                  className={`kd-level-chip ${config.selectedLevels.includes(level) ? 'selected' : ''}`}
                  onClick={() => onToggleLevel(level)}
                  disabled={countByLevel[level] === 0}
                >
                  <span>{level}</span>
                  <span className="kd-level-count">{countByLevel[level] || 0}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Lesson Selection */}
          {kanjiLessons.length > 0 && (
            <div className="kd-section">
              <div className="kd-section-header">
                <BookOpen size={20} />
                <h3>Chọn theo bài</h3>
                {config.selectedLessonIds.length > 0 && (
                  <span className="kd-selection-count">{config.selectedLessonIds.length} bài</span>
                )}
              </div>
              <div className="kd-lessons">
                {kanjiLessons.map((lesson, idx) => (
                  <button
                    key={lesson.id}
                    className={`kd-lesson-chip ${config.selectedLessonIds.includes(lesson.id) ? 'selected' : ''}`}
                    onClick={() => onToggleLesson(lesson.id)}
                  >
                    <span>{getLessonName(lesson, idx)}</span>
                    <span className="kd-lesson-count">{lesson.count}</span>
                  </button>
                ))}
              </div>
              {config.selectedLessonIds.length === 0 && (
                <p className="kd-lesson-hint">Không chọn = dùng tất cả bài</p>
              )}
            </div>
          )}

          {/* Start Level */}
          <div className="kd-section">
            <div className="kd-section-header">
              <Star size={20} />
              <h3>Bắt đầu từ màn</h3>
            </div>
            <div className="kd-level-select">
              {[1, 5, 10, 15, 20].filter(l => l <= config.startLevel || l === 1).map(level => (
                <button
                  key={level}
                  className={`kd-start-btn ${config.startLevel === level ? 'active' : ''}`}
                  onClick={() => onSetStartLevel(level)}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="kd-info-box">
            <p>Có <strong>{availableKanjiCount}</strong> kanji phù hợp</p>
            {isVip
              ? <p className="kd-vip-info">VIP: 10 ô mở khóa + 2 power-up/màn</p>
              : <p>8 ô mở khóa + 1 power-up/màn</p>
            }
          </div>
        </div>

        <div className="kd-setup-footer">
          <button className="kd-btn kd-btn-ghost" onClick={onClose}>
            <Home size={18} /> Thoát
          </button>
          <button
            className="kd-btn kd-btn-primary"
            onClick={onStart}
            disabled={availableKanjiCount < 4 || config.selectedLevels.length === 0}
          >
            <Play size={18} /> Bắt đầu
          </button>
        </div>
      </div>
    </div>
  );
}
