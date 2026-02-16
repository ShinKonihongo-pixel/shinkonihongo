// Auto-generate modal for creating tests with random questions from multiple sources

import { useState, useMemo } from 'react';
import { X, Zap, Shuffle, BookOpen, FileQuestion, ClipboardList } from 'lucide-react';
import { JLPT_LEVELS } from '../../../constants/jlpt';
import type { TestQuestion, DifficultyLevel, TestTemplate, TestType } from '../../../types/classroom';
import { DEFAULT_QUESTION_POINTS } from '../../../types/classroom';
import type { Flashcard } from '../../../types/flashcard';
import type { JLPTQuestion } from '../../../types/jlpt-question';
import {
  DIFFICULTY_OPTIONS,
  DIFFICULTY_PRESETS,
  SOURCE_MIX_PRESETS,
  flashcardToQuestion,
  jlptToQuestion,
  type SourcesEnabled,
  type SourceMixPct,
} from './test-bank-types';

interface AutoGenerateModalProps {
  show: boolean;
  activeTab: TestType;
  flashcards: Flashcard[];
  jlptQuestions: JLPTQuestion[];
  templates: TestTemplate[];
  onGenerate: (questions: TestQuestion[], sourceType: 'flashcard' | 'jlpt' | 'custom') => void;
  onClose: () => void;
}

export function AutoGenerateModal({
  show,
  activeTab,
  flashcards,
  jlptQuestions,
  templates,
  onGenerate,
  onClose,
}: AutoGenerateModalProps) {
  const [level, setLevel] = useState<string>('N5');
  const [questionCount, setQuestionCount] = useState(10);
  const [totalPoints, setTotalPoints] = useState(200);
  const [difficulty, setDifficulty] = useState<DifficultyLevel | 'mixed'>('mixed');

  const [sourcesEnabled, setSourcesEnabled] = useState<SourcesEnabled>({
    flashcard: true,
    jlpt: false,
    testbank: false,
  });

  const [sourceMixPct, setSourceMixPct] = useState<SourceMixPct>({
    flashcard: 100,
    jlpt: 0,
    testbank: 0,
  });

  const [mixedEasyPct, setMixedEasyPct] = useState(30);
  const [mixedMediumPct, setMixedMediumPct] = useState(50);
  const [mixedHardPct, setMixedHardPct] = useState(20);

  if (!show) return null;

  // Count per source
  const sourceQuestionCounts = useMemo(() => {
    const testBankQuestions = templates
      .filter(t => t.level === level)
      .flatMap(t => t.questions);

    return {
      flashcard: flashcards.filter(f => f.jlptLevel === level).length,
      jlpt: jlptQuestions.filter(j => j.level === level).length,
      testbank: testBankQuestions.length,
    };
  }, [flashcards, jlptQuestions, templates, level]);

  // Total available count
  const availableCount = useMemo(() => {
    return Object.entries(sourcesEnabled)
      .filter(([_, enabled]) => enabled)
      .reduce((sum, [source]) => sum + sourceQuestionCounts[source as keyof typeof sourceQuestionCounts], 0);
  }, [sourcesEnabled, sourceQuestionCounts]);

  // Toggle source and auto-adjust percentages
  const toggleSource = (source: keyof SourcesEnabled) => {
    const newEnabled = { ...sourcesEnabled, [source]: !sourcesEnabled[source] };
    setSourcesEnabled(newEnabled);

    const enabledSources = Object.entries(newEnabled).filter(([_, v]) => v).map(([k]) => k);
    if (enabledSources.length > 0) {
      const pctEach = Math.floor(100 / enabledSources.length);
      const remainder = 100 - (pctEach * enabledSources.length);
      const newPct: SourceMixPct = { flashcard: 0, jlpt: 0, testbank: 0 };
      enabledSources.forEach((s, idx) => {
        newPct[s as keyof SourceMixPct] = pctEach + (idx === 0 ? remainder : 0);
      });
      setSourceMixPct(newPct);
    }
  };

  // Update source percentage
  const updateSourcePct = (source: keyof SourceMixPct, value: number) => {
    const enabledSources = Object.entries(sourcesEnabled).filter(([_, v]) => v).map(([k]) => k);
    if (enabledSources.length <= 1) {
      setSourceMixPct({ ...sourceMixPct, [source]: 100 });
      return;
    }

    const remaining = 100 - value;
    const otherSources = enabledSources.filter(s => s !== source);
    const currentOthersTotal = otherSources.reduce((sum, s) => sum + sourceMixPct[s as keyof SourceMixPct], 0);

    const newPct = { ...sourceMixPct, [source]: value };
    otherSources.forEach(s => {
      const ratio = currentOthersTotal > 0 ? sourceMixPct[s as keyof SourceMixPct] / currentOthersTotal : 1 / otherSources.length;
      newPct[s as keyof SourceMixPct] = Math.round(remaining * ratio);
    });

    const total = Object.values(newPct).reduce((a, b) => a + b, 0);
    if (total !== 100 && otherSources.length > 0) {
      newPct[otherSources[0] as keyof SourceMixPct] += 100 - total;
    }

    setSourceMixPct(newPct);
  };

  const handleGenerate = () => {
    const pointsPerQuestion = Math.round(totalPoints / questionCount);

    const enabledSources = Object.entries(sourcesEnabled)
      .filter(([_, enabled]) => enabled)
      .map(([source]) => source as keyof SourcesEnabled);

    if (enabledSources.length === 0) {
      alert('Vui lòng chọn ít nhất một nguồn câu hỏi!');
      return;
    }

    // Calculate how many questions from each source
    const questionCountPerSource: Record<string, number> = {};
    let totalAllocated = 0;
    enabledSources.forEach((source, idx) => {
      if (idx === enabledSources.length - 1) {
        questionCountPerSource[source] = questionCount - totalAllocated;
      } else {
        const count = Math.round((sourceMixPct[source] / 100) * questionCount);
        questionCountPerSource[source] = count;
        totalAllocated += count;
      }
    });

    // Collect questions from each source
    const allQuestions: TestQuestion[] = [];
    const levelFlashcards = flashcards.filter(f => f.jlptLevel === level);
    const levelJlptQuestions = jlptQuestions.filter(j => j.level === level);
    const levelTestBankQuestions = templates
      .filter(t => t.level === level)
      .flatMap(t => t.questions);

    enabledSources.forEach(source => {
      const countNeeded = questionCountPerSource[source];
      let sourceItems: TestQuestion[] = [];

      if (source === 'flashcard') {
        const shuffled = [...levelFlashcards].sort(() => Math.random() - 0.5);
        sourceItems = shuffled.slice(0, countNeeded).map(card => {
          const diff = getDifficulty();
          return { ...flashcardToQuestion(card, diff, DEFAULT_QUESTION_POINTS), points: pointsPerQuestion };
        });
      } else if (source === 'jlpt') {
        const shuffled = [...levelJlptQuestions].sort(() => Math.random() - 0.5);
        sourceItems = shuffled.slice(0, countNeeded).map(q => {
          const diff = getDifficulty();
          return { ...jlptToQuestion(q, diff, DEFAULT_QUESTION_POINTS), points: pointsPerQuestion };
        });
      } else if (source === 'testbank') {
        const shuffled = [...levelTestBankQuestions].sort(() => Math.random() - 0.5);
        sourceItems = shuffled.slice(0, countNeeded).map(q => ({
          ...q,
          id: `tb_${q.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          difficulty: q.difficulty || getDifficulty(),
          points: pointsPerQuestion,
        }));
      }

      allQuestions.push(...sourceItems);
    });

    function getDifficulty(): DifficultyLevel {
      if (difficulty === 'mixed') {
        const rand = Math.random() * 100;
        if (rand < mixedEasyPct) return 'easy';
        if (rand < mixedEasyPct + mixedMediumPct) return 'medium';
        return 'hard';
      }
      return difficulty;
    }

    const shuffledAll = allQuestions.sort(() => Math.random() - 0.5);

    // Adjust last question to match total points exactly
    if (shuffledAll.length > 0) {
      const currentTotal = shuffledAll.slice(0, -1).reduce((sum, q) => sum + q.points, 0);
      shuffledAll[shuffledAll.length - 1].points = totalPoints - currentTotal;
    }

    // Determine primary source type
    const primarySource = enabledSources.reduce((max, source) =>
      sourceMixPct[source] > sourceMixPct[max] ? source : max
    , enabledSources[0]);

    const sourceType = primarySource === 'testbank' ? 'custom' : primarySource as 'flashcard' | 'jlpt';
    onGenerate(shuffledAll, sourceType);
  };

  return (
    <div className="modal-overlay">
      <div className="auto-generate-modal pro">
        <div className="modal-header">
          <h4><Zap size={20} /> Tự động tạo {activeTab === 'test' ? 'bài kiểm tra' : 'bài tập'}</h4>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Source & Level Section */}
          <div className="auto-gen-section">
            <h5 className="section-title">📚 Nguồn câu hỏi</h5>
            <div className="source-mode">
              <label className={`checkbox-card ${sourcesEnabled.flashcard ? 'checked' : ''}`} style={{ borderColor: sourcesEnabled.flashcard ? '#e74c3c' : undefined }}>
                <input
                  type="checkbox"
                  checked={sourcesEnabled.flashcard}
                  onChange={() => toggleSource('flashcard')}
                />
                <span className="checkbox-content">
                  <BookOpen size={18} />
                  <span>Flashcard</span>
                  <small>{sourceQuestionCounts.flashcard}</small>
                </span>
              </label>
              <label className={`checkbox-card ${sourcesEnabled.jlpt ? 'checked' : ''}`} style={{ borderColor: sourcesEnabled.jlpt ? '#9b59b6' : undefined }}>
                <input
                  type="checkbox"
                  checked={sourcesEnabled.jlpt}
                  onChange={() => toggleSource('jlpt')}
                />
                <span className="checkbox-content">
                  <FileQuestion size={18} />
                  <span>JLPT</span>
                  <small>{sourceQuestionCounts.jlpt}</small>
                </span>
              </label>
              <label className={`checkbox-card ${sourcesEnabled.testbank ? 'checked' : ''}`} style={{ borderColor: sourcesEnabled.testbank ? '#3498db' : undefined }}>
                <input
                  type="checkbox"
                  checked={sourcesEnabled.testbank}
                  onChange={() => toggleSource('testbank')}
                />
                <span className="checkbox-content">
                  <ClipboardList size={18} />
                  <span>Ngân hàng</span>
                  <small>{sourceQuestionCounts.testbank}</small>
                </span>
              </label>
            </div>

            {/* Source mix config */}
            {Object.values(sourcesEnabled).filter(Boolean).length > 1 && (
              <div className="mixed-config source-mix-config">
                <div className="preset-buttons">
                  {SOURCE_MIX_PRESETS.filter(p => {
                    const matchFlashcard = (p.flashcard > 0) === sourcesEnabled.flashcard || !sourcesEnabled.flashcard;
                    const matchJlpt = (p.jlpt > 0) === sourcesEnabled.jlpt || !sourcesEnabled.jlpt;
                    const matchTestbank = (p.testbank > 0) === sourcesEnabled.testbank || !sourcesEnabled.testbank;
                    return matchFlashcard && matchJlpt && matchTestbank;
                  }).slice(0, 4).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`preset-btn ${
                        sourceMixPct.flashcard === preset.flashcard &&
                        sourceMixPct.jlpt === preset.jlpt &&
                        sourceMixPct.testbank === preset.testbank ? 'active' : ''
                      }`}
                      onClick={() => setSourceMixPct(preset)}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>

                <div className="source-sliders">
                  {sourcesEnabled.flashcard && (
                    <div className="slider-row">
                      <span className="slider-label" style={{ color: '#e74c3c' }}>FC</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={sourceMixPct.flashcard}
                        onChange={(e) => updateSourcePct('flashcard', parseInt(e.target.value))}
                        className="slider source-flashcard"
                      />
                      <span className="slider-value">{sourceMixPct.flashcard}%</span>
                    </div>
                  )}
                  {sourcesEnabled.jlpt && (
                    <div className="slider-row">
                      <span className="slider-label" style={{ color: '#9b59b6' }}>JLPT</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={sourceMixPct.jlpt}
                        onChange={(e) => updateSourcePct('jlpt', parseInt(e.target.value))}
                        className="slider source-jlpt"
                      />
                      <span className="slider-value">{sourceMixPct.jlpt}%</span>
                    </div>
                  )}
                  {sourcesEnabled.testbank && (
                    <div className="slider-row">
                      <span className="slider-label" style={{ color: '#3498db' }}>NHĐ</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={sourceMixPct.testbank}
                        onChange={(e) => updateSourcePct('testbank', parseInt(e.target.value))}
                        className="slider source-testbank"
                      />
                      <span className="slider-value">{sourceMixPct.testbank}%</span>
                    </div>
                  )}
                </div>

                <div className="distribution-bar">
                  {sourcesEnabled.flashcard && <div className="bar-segment source-flashcard" style={{ width: `${sourceMixPct.flashcard}%` }} title={`Flashcard: ${sourceMixPct.flashcard}%`} />}
                  {sourcesEnabled.jlpt && <div className="bar-segment source-jlpt" style={{ width: `${sourceMixPct.jlpt}%` }} title={`JLPT: ${sourceMixPct.jlpt}%`} />}
                  {sourcesEnabled.testbank && <div className="bar-segment source-testbank" style={{ width: `${sourceMixPct.testbank}%` }} title={`Ngân hàng: ${sourceMixPct.testbank}%`} />}
                </div>
              </div>
            )}

            <div className="level-selector">
              <label>Cấp độ:</label>
              <div className="level-chips">
                {JLPT_LEVELS.map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    className={`level-chip ${level === lvl ? 'active' : ''}`}
                    onClick={() => setLevel(lvl)}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Difficulty Section */}
          <div className="auto-gen-section">
            <h5 className="section-title">🎯 Độ khó</h5>
            <div className="difficulty-mode">
              <label className="radio-card">
                <input
                  type="radio"
                  name="diffMode"
                  checked={difficulty === 'mixed'}
                  onChange={() => setDifficulty('mixed')}
                />
                <span className="radio-content">
                  <Shuffle size={18} />
                  <span>Hỗn hợp</span>
                </span>
              </label>
              {DIFFICULTY_OPTIONS.map(d => (
                <label key={d.value} className="radio-card" style={{ borderColor: difficulty === d.value ? d.color : undefined }}>
                  <input
                    type="radio"
                    name="diffMode"
                    checked={difficulty === d.value}
                    onChange={() => setDifficulty(d.value)}
                  />
                  <span className="radio-content" style={{ color: difficulty === d.value ? d.color : undefined }}>
                    <span>{d.label}</span>
                  </span>
                </label>
              ))}
            </div>

            {difficulty === 'mixed' && (
              <div className="mixed-config">
                <div className="preset-buttons">
                  {DIFFICULTY_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`preset-btn ${mixedEasyPct === preset.easy && mixedMediumPct === preset.medium ? 'active' : ''}`}
                      onClick={() => {
                        setMixedEasyPct(preset.easy);
                        setMixedMediumPct(preset.medium);
                        setMixedHardPct(preset.hard);
                      }}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>

                <div className="difficulty-sliders">
                  <div className="slider-row">
                    <span className="slider-label" style={{ color: '#27ae60' }}>Dễ</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={mixedEasyPct}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setMixedEasyPct(val);
                        const remaining = 100 - val;
                        const ratio = mixedMediumPct / (mixedMediumPct + mixedHardPct || 1);
                        setMixedMediumPct(Math.round(remaining * ratio));
                        setMixedHardPct(remaining - Math.round(remaining * ratio));
                      }}
                      className="slider easy"
                    />
                    <span className="slider-value">{mixedEasyPct}%</span>
                  </div>
                  <div className="slider-row">
                    <span className="slider-label" style={{ color: '#f39c12' }}>TB</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={mixedMediumPct}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setMixedMediumPct(val);
                        const remaining = 100 - val;
                        const ratio = mixedEasyPct / (mixedEasyPct + mixedHardPct || 1);
                        setMixedEasyPct(Math.round(remaining * ratio));
                        setMixedHardPct(remaining - Math.round(remaining * ratio));
                      }}
                      className="slider medium"
                    />
                    <span className="slider-value">{mixedMediumPct}%</span>
                  </div>
                  <div className="slider-row">
                    <span className="slider-label" style={{ color: '#e74c3c' }}>Khó</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={mixedHardPct}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setMixedHardPct(val);
                        const remaining = 100 - val;
                        const ratio = mixedEasyPct / (mixedEasyPct + mixedMediumPct || 1);
                        setMixedEasyPct(Math.round(remaining * ratio));
                        setMixedMediumPct(remaining - Math.round(remaining * ratio));
                      }}
                      className="slider hard"
                    />
                    <span className="slider-value">{mixedHardPct}%</span>
                  </div>
                </div>

                <div className="distribution-bar">
                  <div className="bar-segment easy" style={{ width: `${mixedEasyPct}%` }} title={`Dễ: ${mixedEasyPct}%`} />
                  <div className="bar-segment medium" style={{ width: `${mixedMediumPct}%` }} title={`TB: ${mixedMediumPct}%`} />
                  <div className="bar-segment hard" style={{ width: `${mixedHardPct}%` }} title={`Khó: ${mixedHardPct}%`} />
                </div>
              </div>
            )}
          </div>

          {/* Questions & Points Section */}
          <div className="auto-gen-section">
            <h5 className="section-title">📊 Cấu hình</h5>
            <div className="config-grid">
              <div className="config-item">
                <label>Số câu hỏi</label>
                <div className="stepper">
                  <button type="button" onClick={() => setQuestionCount(Math.max(1, questionCount - 5))}>−5</button>
                  <input
                    type="number"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Math.max(1, Math.min(availableCount, parseInt(e.target.value) || 10)))}
                    min={1}
                    max={availableCount}
                  />
                  <button type="button" onClick={() => setQuestionCount(Math.min(availableCount, questionCount + 5))}>+5</button>
                </div>
                <small>Tối đa: {availableCount}</small>
              </div>

              <div className="config-item">
                <label>Tổng điểm</label>
                <div className="stepper">
                  <button type="button" onClick={() => setTotalPoints(Math.max(10, totalPoints - 50))}>−50</button>
                  <input
                    type="number"
                    value={totalPoints}
                    onChange={(e) => setTotalPoints(Math.max(10, parseInt(e.target.value) || 200))}
                    min={10}
                    step={10}
                  />
                  <button type="button" onClick={() => setTotalPoints(totalPoints + 50)}>+50</button>
                </div>
                <small>~{Math.round(totalPoints / questionCount)} đ/câu</small>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="auto-gen-preview-section">
            <div className="preview-card">
              <div className="preview-header">
                <Zap size={18} />
                <span>Xem trước</span>
              </div>
              <div className="preview-stats">
                <div className="stat">
                  <span className="stat-value">{questionCount}</span>
                  <span className="stat-label">câu hỏi</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{totalPoints}</span>
                  <span className="stat-label">điểm</span>
                </div>
                <div className="stat">
                  <span className="stat-value">~{Math.round(totalPoints / questionCount)}</span>
                  <span className="stat-label">đ/câu</span>
                </div>
              </div>

              {Object.values(sourcesEnabled).filter(Boolean).length > 1 && (
                <div className="preview-source-mix">
                  <span className="mix-label">Nguồn:</span>
                  {sourcesEnabled.flashcard && (
                    <span className="source-chip flashcard">
                      ~{Math.round(questionCount * sourceMixPct.flashcard / 100)} FC
                    </span>
                  )}
                  {sourcesEnabled.jlpt && (
                    <span className="source-chip jlpt">
                      ~{Math.round(questionCount * sourceMixPct.jlpt / 100)} JLPT
                    </span>
                  )}
                  {sourcesEnabled.testbank && (
                    <span className="source-chip testbank">
                      ~{Math.round(questionCount * sourceMixPct.testbank / 100)} NHĐ
                    </span>
                  )}
                </div>
              )}

              {difficulty === 'mixed' && (
                <div className="preview-distribution">
                  <span style={{ color: '#27ae60' }}>~{Math.round(questionCount * mixedEasyPct / 100)} dễ</span>
                  <span style={{ color: '#f39c12' }}>~{Math.round(questionCount * mixedMediumPct / 100)} TB</span>
                  <span style={{ color: '#e74c3c' }}>~{Math.round(questionCount * mixedHardPct / 100)} khó</span>
                </div>
              )}
            </div>
          </div>

          {availableCount < questionCount && (
            <div className="auto-gen-warning">
              ⚠️ Không đủ câu hỏi! Cần {questionCount} câu nhưng chỉ có {availableCount} câu ở {level}.
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Hủy
          </button>
          <button
            className="btn btn-accent btn-generate"
            onClick={handleGenerate}
            disabled={availableCount < questionCount}
          >
            <Shuffle size={18} />
            Tạo {questionCount} câu ngẫu nhiên
          </button>
        </div>
      </div>
    </div>
  );
}
