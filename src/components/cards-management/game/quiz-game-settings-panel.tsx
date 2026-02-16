// Game Tab - Quiz Game Settings Panel
// Manages difficulty mix % and JLPT time per question category

import { useState } from 'react';
import { Zap, Clock, Settings, ChevronRight, Check } from 'lucide-react';
import { useSettings } from '../../../hooks/use-settings';
import { QUIZ_DIFFICULTY_LABELS, JLPT_CATEGORY_LABELS, type DiffKey, type DiffRow } from './game-tab-types';

interface QuizGameSettingsPanelProps {
  onBack: () => void;
}

export function QuizGameSettingsPanel({ onBack }: QuizGameSettingsPanelProps) {
  const { settings, updateSetting } = useSettings();
  const [saved, setSaved] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState<DiffKey | null>(null);

  const mix = settings.quizDifficultyMix;
  const jlptTime = settings.quizJlptTimePerCategory;

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  // Row total for a level
  const rowTotal = (row: DiffRow) => row.super_hard + row.hard + row.medium + row.easy;

  // Max value a slider can reach (remaining budget)
  const maxForCell = (level: DiffKey, cardDiff: DiffKey) => {
    const row = mix[level];
    const othersTotal = rowTotal(row) - row[cardDiff];
    return 100 - othersTotal;
  };

  // Update one cell, clamped so row total <= 100
  const updateMixCell = (level: DiffKey, cardDiff: DiffKey, value: number) => {
    const clamped = Math.min(value, maxForCell(level, cardDiff));
    const row = { ...mix[level], [cardDiff]: clamped };
    updateSetting('quizDifficultyMix', { ...mix, [level]: row });
    showSaved();
  };

  // Update JLPT time for a category
  const updateJlptTime = (key: keyof typeof jlptTime, value: number) => {
    updateSetting('quizJlptTimePerCategory', { ...jlptTime, [key]: value });
    showSaved();
  };

  // Reset to defaults
  const resetDefaults = () => {
    updateSetting('quizDifficultyMix', {
      super_hard: { super_hard: 60, hard: 25, medium: 10, easy: 5 },
      hard:       { super_hard: 20, hard: 45, medium: 25, easy: 10 },
      medium:     { super_hard: 5,  hard: 20, medium: 50, easy: 25 },
      easy:       { super_hard: 0,  hard: 10, medium: 30, easy: 60 },
    });
    updateSetting('quizJlptTimePerCategory', { vocabulary: 15, grammar: 20, reading: 30, listening: 25 });
    showSaved();
  };

  return (
    <div className="gm-quiz-settings">
      <div className="gm-header">
        <button className="gm-back-btn" onClick={onBack}>
          ← Quay lại Dashboard
        </button>
        <div className="gm-header-text">
          <h2>🎯 Đại Chiến Tiếng Nhật</h2>
          <p>Quản lý phần trăm trộn mức độ và thời gian JLPT</p>
        </div>
      </div>

      {saved && (
        <div className="gm-toast">
          <Check size={16} />
          Đã lưu cài đặt!
        </div>
      )}

      {/* Section 1: Per-level difficulty mix matrix */}
      <div className="gm-settings-card" style={{ marginBottom: '1.5rem' }}>
        <div className="settings-card-header">
          <Zap size={20} />
          <h4>Phần Trăm Trộn Mức Độ</h4>
        </div>
        <div className="settings-card-body">
          <p className="gm-section-hint" style={{ marginBottom: '1rem' }}>
            Mỗi mức độ khi người chơi chọn sẽ trộn câu hỏi từ các thẻ có độ khó khác nhau. Tổng tối đa 100%.
          </p>

          {/* One expandable card per game difficulty level */}
          {QUIZ_DIFFICULTY_LABELS.map(level => {
            const row = mix[level.key];
            const total = rowTotal(row);
            const isExpanded = expandedLevel === level.key;

            return (
              <div key={level.key} className="quiz-mix-level" style={{ marginBottom: '0.75rem' }}>
                {/* Level header — click to expand */}
                <div
                  className="quiz-mix-level-header"
                  onClick={() => setExpandedLevel(isExpanded ? null : level.key)}
                  style={{ borderLeftColor: level.color }}
                >
                  <div className="quiz-mix-level-title">
                    <ChevronRight size={16} className={isExpanded ? 'rotated' : ''} />
                    <span style={{ color: level.color, fontWeight: 700 }}>{level.label}</span>
                  </div>

                  {/* Mini visual bar preview */}
                  <div className="quiz-mix-bar mini">
                    {total > 0 ? QUIZ_DIFFICULTY_LABELS.map(d => {
                      const pct = Math.round((row[d.key] / total) * 100);
                      if (pct === 0) return null;
                      return (
                        <div
                          key={d.key}
                          className="quiz-mix-segment"
                          style={{ width: `${pct}%`, background: d.color }}
                          title={`${d.label}: ${row[d.key]}%`}
                        >
                          {pct >= 12 && <span>{row[d.key]}%</span>}
                        </div>
                      );
                    }) : (
                      <div className="quiz-mix-segment" style={{ width: '100%', background: '#e5e7eb' }}>
                        <span style={{ color: '#9ca3af' }}>0%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded sliders */}
                {isExpanded && (
                  <div className="quiz-mix-level-body">
                    {QUIZ_DIFFICULTY_LABELS.map(cardDiff => (
                      <div key={cardDiff.key} className="setting-row" style={{ alignItems: 'center', padding: '0.25rem 0' }}>
                        <div className="setting-info" style={{ minWidth: '80px' }}>
                          <span className="setting-label" style={{ color: cardDiff.color, fontWeight: 600, fontSize: '0.85rem' }}>
                            {cardDiff.label}
                          </span>
                        </div>
                        <div className="setting-control" style={{ flex: 1 }}>
                          <input
                            type="range"
                            min={0}
                            max={maxForCell(level.key, cardDiff.key)}
                            step={5}
                            value={row[cardDiff.key]}
                            onChange={(e) => updateMixCell(level.key, cardDiff.key, Number(e.target.value))}
                            style={{ accentColor: cardDiff.color }}
                          />
                          <span className="value" style={{ minWidth: '45px', textAlign: 'right' }}>{row[cardDiff.key]}%</span>
                        </div>
                      </div>
                    ))}
                    <div className="gm-hint-text" style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: total === 100 ? '#10B981' : undefined }}>
                      Tổng: {total}% / 100%{total < 100 && ` — còn ${100 - total}%`}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: JLPT Time Per Category */}
      <div className="gm-settings-card" style={{ marginBottom: '1.5rem' }}>
        <div className="settings-card-header">
          <Clock size={20} />
          <h4>Thời Gian JLPT Mỗi Loại Câu Hỏi</h4>
        </div>
        <div className="settings-card-body">
          <p className="gm-section-hint" style={{ marginBottom: '1rem' }}>
            Thời gian trả lời (giây) cho từng loại câu hỏi JLPT khi chơi Đại Chiến.
          </p>

          {JLPT_CATEGORY_LABELS.map(cat => (
            <div key={cat.key} className="setting-row" style={{ alignItems: 'center' }}>
              <div className="setting-info" style={{ minWidth: '100px' }}>
                <span className="setting-label">
                  {cat.icon} {cat.label}
                </span>
              </div>
              <div className="setting-control" style={{ flex: 1 }}>
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={5}
                  value={jlptTime[cat.key]}
                  onChange={(e) => updateJlptTime(cat.key, Number(e.target.value))}
                />
                <span className="value" style={{ minWidth: '40px', textAlign: 'right' }}>{jlptTime[cat.key]}s</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Question/Answer content */}
      <div className="gm-settings-card" style={{ marginBottom: '1.5rem' }}>
        <div className="settings-card-header">
          <Settings size={20} />
          <h4>Nội Dung Câu Hỏi & Đáp Án</h4>
        </div>
        <div className="settings-card-body">
          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-label">Câu hỏi hiển thị</span>
              <span className="setting-desc">Nội dung hiện trên màn hình câu hỏi</span>
            </div>
            <div className="setting-select">
              <select
                value={settings.gameQuestionContent}
                onChange={(e) => { updateSetting('gameQuestionContent', e.target.value as 'kanji' | 'vocabulary' | 'meaning'); showSaved(); }}
              >
                <option value="kanji">Kanji</option>
                <option value="vocabulary">Từ vựng (Hiragana)</option>
                <option value="meaning">Nghĩa</option>
              </select>
            </div>
          </div>
          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-label">Đáp án hiển thị</span>
              <span className="setting-desc">Nội dung các lựa chọn đáp án</span>
            </div>
            <div className="setting-select">
              <select
                value={settings.gameAnswerContent}
                onChange={(e) => { updateSetting('gameAnswerContent', e.target.value as 'kanji' | 'vocabulary' | 'meaning' | 'vocabulary_meaning'); showSaved(); }}
              >
                <option value="vocabulary_meaning">Từ vựng + Nghĩa</option>
                <option value="kanji">Kanji</option>
                <option value="vocabulary">Từ vựng</option>
                <option value="meaning">Nghĩa</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="gm-settings-actions">
        <button className="gm-btn-secondary" onClick={resetDefaults}>
          🔄 Khôi Phục Mặc Định
        </button>
      </div>
    </div>
  );
}
