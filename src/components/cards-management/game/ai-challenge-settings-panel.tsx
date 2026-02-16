// Game Tab - AI Challenge Settings Panel with Per-AI Lesson Selection

import { useState } from 'react';
import { Check } from 'lucide-react';
import { useSettings, type AIDifficultyId, type AICustomSettings, type FlashcardDifficulty, type JLPTLevelKey, DEFAULT_AI_CUSTOM_SETTINGS } from '../../../hooks/use-settings';
import { AI_OPPONENTS } from '../../../types/ai-challenge';
import { useLessons } from '../../../hooks/use-lessons';
import type { Lesson } from '../../../types/flashcard';
import { JLPT_LEVELS } from '../../../constants/jlpt';

interface AIChallengeSettingsPanelProps {
  onBack: () => void;
}

// AI Sessions configuration
const AI_SESSIONS = [
  { id: 1, name: 'Khởi Đầu', ais: ['gentle', 'friendly', 'curious', 'eager', 'clever', 'diligent', 'quick', 'smart', 'sharp'] as AIDifficultyId[] },
  { id: 2, name: 'Thử Thách', ais: ['skilled', 'excellent', 'talented', 'brilliant', 'genius', 'elite', 'master', 'grandmaster', 'sage'] as AIDifficultyId[] },
  { id: 3, name: 'Huyền Thoại', ais: ['superior', 'unbeatable', 'mythical', 'legendary', 'immortal', 'divine', 'celestial', 'supreme', 'champion'] as AIDifficultyId[] },
];

const DIFFICULTY_OPTIONS: { value: FlashcardDifficulty; label: string; emoji: string }[] = [
  { value: 'easy', label: 'Dễ', emoji: '🟢' },
  { value: 'medium', label: 'Trung bình', emoji: '🟡' },
  { value: 'hard', label: 'Khó', emoji: '🟠' },
  { value: 'super_hard', label: 'Siêu khó', emoji: '🔴' },
];

export function AIChallengeSettingsPanel({ onBack }: AIChallengeSettingsPanelProps) {
  const { settings, updateSetting } = useSettings();
  const { lessons, loading: lessonsLoading, getLessonsByLevel, getChildLessons } = useLessons();
  const [currentSession, setCurrentSession] = useState(1);
  const [selectedAI, setSelectedAI] = useState<AIDifficultyId | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevelKey>('N5');
  const [saved, setSaved] = useState(false);

  // Default lesson IDs structure to prevent undefined errors
  const DEFAULT_LESSON_IDS: Record<JLPTLevelKey, string[]> = { N5: [], N4: [], N3: [], N2: [], N1: [] };

  // Get current AI's settings with safe defaults
  const getAISettings = (aiId: AIDifficultyId): AICustomSettings => {
    const aiSettings = settings.aiChallengePerAISettings?.[aiId] || DEFAULT_AI_CUSTOM_SETTINGS;
    return {
      ...aiSettings,
      selectedLessonIds: { ...DEFAULT_LESSON_IDS, ...aiSettings.selectedLessonIds },
    };
  };

  // Update single AI's settings
  const updateAISettings = (aiId: AIDifficultyId, newSettings: Partial<AICustomSettings>) => {
    const currentPerAISettings = settings.aiChallengePerAISettings || {};
    const currentAISettings = currentPerAISettings[aiId] || DEFAULT_AI_CUSTOM_SETTINGS;
    updateSetting('aiChallengePerAISettings', {
      ...currentPerAISettings,
      [aiId]: { ...currentAISettings, ...newSettings },
    });
    showSaved();
  };

  // Toggle lesson selection for an AI at a specific level
  const toggleLesson = (aiId: AIDifficultyId, level: JLPTLevelKey, lessonId: string) => {
    const aiSettings = getAISettings(aiId);
    const currentLessons = aiSettings.selectedLessonIds[level] || [];
    const newLessons = currentLessons.includes(lessonId)
      ? currentLessons.filter(id => id !== lessonId)
      : [...currentLessons, lessonId];
    updateAISettings(aiId, {
      selectedLessonIds: {
        ...DEFAULT_LESSON_IDS,
        ...aiSettings.selectedLessonIds,
        [level]: newLessons,
      },
    });
  };

  // Select all lessons for an AI at a level
  const selectAllLessons = (aiId: AIDifficultyId, level: JLPTLevelKey) => {
    const aiSettings = getAISettings(aiId);
    updateAISettings(aiId, {
      selectedLessonIds: {
        ...DEFAULT_LESSON_IDS,
        ...aiSettings.selectedLessonIds,
        [level]: [], // Empty = all
      },
    });
  };

  // Get all lessons for a level (including children)
  const getAllLessonsForLevel = (level: JLPTLevelKey): Lesson[] => {
    return lessons.filter(l => l.jlptLevel === level);
  };

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  // Get current session's AIs
  const session = AI_SESSIONS.find(s => s.id === currentSession)!;

  // Get lessons for selected level
  const levelLessons = getLessonsByLevel(selectedLevel);

  // Helper to get selected lessons count for display
  const getSelectedLessonsInfo = (aiId: AIDifficultyId, level: JLPTLevelKey) => {
    const aiSettings = getAISettings(aiId);
    const selected = aiSettings.selectedLessonIds[level] || [];
    const totalInLevel = getAllLessonsForLevel(level).length;
    if (lessonsLoading) return '...';
    if (selected.length === 0) return totalInLevel > 0 ? `Tất cả (${totalInLevel})` : 'Trống';
    return `${selected.length}/${totalInLevel}`;
  };

  return (
    <div className="gm-ai-challenge-settings">
      <div className="gm-header">
        <button className="gm-back-btn" onClick={onBack}>
          ← Quay lại Dashboard
        </button>
        <div className="gm-header-text">
          <h2>🤖 Cài Đặt Thách Đấu AI</h2>
          <p>Chọn bài học nguồn câu hỏi cho từng AI theo cấp độ JLPT</p>
        </div>
      </div>

      {saved && (
        <div className="gm-toast">
          <Check size={16} />
          Đã lưu cài đặt!
        </div>
      )}

      {/* JLPT Level Tabs */}
      <div className="gm-level-tabs">
        {(JLPT_LEVELS as readonly JLPTLevelKey[]).map(level => (
          <button
            key={level}
            className={`gm-level-tab ${selectedLevel === level ? 'active' : ''}`}
            onClick={() => setSelectedLevel(level)}
          >
            {level}
          </button>
        ))}
      </div>

      {/* Session Tabs */}
      <div className="gm-session-tabs">
        {AI_SESSIONS.map(s => (
          <button
            key={s.id}
            className={`gm-session-tab ${currentSession === s.id ? 'active' : ''}`}
            onClick={() => { setCurrentSession(s.id); setSelectedAI(null); }}
          >
            <span className="tab-num">{s.id}</span>
            <span className="tab-name">{s.name}</span>
          </button>
        ))}
      </div>

      {/* AI Grid */}
      <div className="gm-ai-grid">
        {session.ais.map((aiId, idx) => {
          const ai = AI_OPPONENTS[aiId];
          const aiSettings = getAISettings(aiId);
          const isSelected = selectedAI === aiId;
          const globalIdx = (currentSession - 1) * 9 + idx + 1;
          const selectedLessonIds = aiSettings.selectedLessonIds?.[selectedLevel] || [];

          return (
            <div
              key={aiId}
              className={`gm-ai-card ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedAI(isSelected ? null : aiId)}
            >
              <div className="ai-card-header">
                <span className="ai-rank">#{globalIdx}</span>
                <span className="ai-emoji">{ai.emoji}</span>
                <span className="ai-name">{ai.name}</span>
              </div>
              <div className="ai-card-stats">
                <span className="stat" title="Độ chính xác">
                  🎯 {aiSettings.accuracyModifier > 0 ? '+' : ''}{aiSettings.accuracyModifier}%
                </span>
                <span className="stat" title="Tốc độ">
                  ⚡ {aiSettings.speedMultiplier.toFixed(1)}x
                </span>
                <span className="stat lessons" title={`Bài học ${selectedLevel}`}>
                  📚 {getSelectedLessonsInfo(aiId, selectedLevel)}
                </span>
              </div>

              {/* Expanded Settings */}
              {isSelected && (
                <div className="ai-card-settings" onClick={e => e.stopPropagation()}>
                  {/* Basic Settings */}
                  <div className="setting-row">
                    <label>🎯 Độ chính xác</label>
                    <div className="setting-control">
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        step="1"
                        value={aiSettings.accuracyModifier}
                        onChange={(e) => updateAISettings(aiId, { accuracyModifier: Number(e.target.value) })}
                      />
                      <span className="value">{aiSettings.accuracyModifier > 0 ? '+' : ''}{aiSettings.accuracyModifier}%</span>
                    </div>
                  </div>
                  <div className="setting-row">
                    <label>⚡ Tốc độ</label>
                    <div className="setting-control">
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={aiSettings.speedMultiplier}
                        onChange={(e) => updateAISettings(aiId, { speedMultiplier: Number(e.target.value) })}
                      />
                      <span className="value">{aiSettings.speedMultiplier.toFixed(1)}x</span>
                    </div>
                  </div>
                  <div className="setting-row">
                    <label>📊 Độ khó tối thiểu</label>
                    <div className="difficulty-buttons">
                      {DIFFICULTY_OPTIONS.map(d => (
                        <button
                          key={d.value}
                          className={`diff-btn ${aiSettings.minDifficulty === d.value ? 'active' : ''}`}
                          onClick={() => updateAISettings(aiId, { minDifficulty: d.value })}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lesson Selection for current JLPT level */}
                  <div className="lesson-selection">
                    <div className="lesson-header">
                      <label>📚 Bài học nguồn ({selectedLevel})</label>
                      <button
                        className="select-all-btn"
                        onClick={() => selectAllLessons(aiId, selectedLevel)}
                        disabled={lessonsLoading}
                      >
                        {selectedLessonIds.length === 0 ? '✓ Tất cả' : 'Chọn tất cả'}
                      </button>
                    </div>

                    {lessonsLoading ? (
                      <p className="no-lessons">Đang tải bài học...</p>
                    ) : levelLessons.length === 0 ? (
                      <p className="no-lessons">Chưa có bài học nào trong {selectedLevel}</p>
                    ) : (
                      <div className="lesson-tree">
                        {levelLessons.map(parentLesson => {
                          const childLessons = getChildLessons(parentLesson.id);
                          const isParentSelected = selectedLessonIds.length === 0 || selectedLessonIds.includes(parentLesson.id);

                          return (
                            <div key={parentLesson.id} className="lesson-group">
                              <button
                                className={`lesson-item parent ${isParentSelected ? 'selected' : ''}`}
                                onClick={() => toggleLesson(aiId, selectedLevel, parentLesson.id)}
                              >
                                <span className="lesson-check">{isParentSelected ? '☑' : '☐'}</span>
                                <span className="lesson-name">{parentLesson.name}</span>
                              </button>

                              {childLessons.length > 0 && (
                                <div className="lesson-children">
                                  {childLessons.map(child => {
                                    const isChildSelected = selectedLessonIds.length === 0 || selectedLessonIds.includes(child.id);
                                    return (
                                      <button
                                        key={child.id}
                                        className={`lesson-item child ${isChildSelected ? 'selected' : ''}`}
                                        onClick={() => toggleLesson(aiId, selectedLevel, child.id)}
                                      >
                                        <span className="lesson-check">{isChildSelected ? '☑' : '☐'}</span>
                                        <span className="lesson-name">{child.name}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <p className="setting-note">
                      * Rỗng = lấy từ tất cả bài học. Nếu không đủ câu hỏi, sẽ lấy thêm từ độ khó thấp hơn.
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Global Settings */}
      <div className="gm-global-settings">
        <h4>⚙️ Cài đặt chung</h4>
        <div className="global-settings-row">
          <div className="global-setting">
            <label>📝 Số câu hỏi</label>
            <div className="setting-control">
              <input
                type="range"
                min="5"
                max="20"
                value={settings.aiChallengeQuestionCount}
                onChange={(e) => updateSetting('aiChallengeQuestionCount', Number(e.target.value))}
              />
              <span className="value">{settings.aiChallengeQuestionCount} câu</span>
            </div>
          </div>
          <div className="global-setting">
            <label>⏱️ Thời gian/câu</label>
            <div className="setting-control">
              <input
                type="range"
                min="5"
                max="30"
                value={settings.aiChallengeTimePerQuestion}
                onChange={(e) => updateSetting('aiChallengeTimePerQuestion', Number(e.target.value))}
              />
              <span className="value">{settings.aiChallengeTimePerQuestion}s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
