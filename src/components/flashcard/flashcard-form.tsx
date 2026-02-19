// Form for creating/editing flashcards with AI auto-fill

import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Trash2 } from 'lucide-react';
import type { FlashcardFormData, JLPTLevel, Flashcard, Lesson, DifficultyLevel, GrammarCard, LeveledExamples, StructuredExample } from '../../types/flashcard';
import { generateKanjiInfo, generateMeaningFromVocabulary, generateLeveledExample } from '../../services/kanji-ai-service';
import { JLPT_LEVELS } from '../../constants/jlpt';
import './flashcard-form.css';
interface FlashcardFormProps {
  onSubmit: (data: FlashcardFormData) => void;
  onCancel: () => void;
  initialData?: Flashcard;
  lessons: Lesson[];
  // Fixed values from navigation - when set, these fields are auto-filled
  fixedLevel?: JLPTLevel | null;
  fixedLessonId?: string | null;
  // Grammar cards for generating examples with grammar patterns
  grammarCards?: GrammarCard[];
  // Callback to notify parent of kanji text changes (for external kanji analysis)
  onKanjiTextChange?: (text: string) => void;
}

const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string; color: string }[] = [
  { value: 'easy', label: 'Dễ', color: '#22c55e' },
  { value: 'medium', label: 'Trung bình', color: '#f59e0b' },
  { value: 'hard', label: 'Khó', color: '#ef4444' },
  { value: 'super_hard', label: 'Siêu khó', color: '#7c3aed' },
];

export function FlashcardForm({
  onSubmit,
  onCancel,
  initialData,
  lessons,
  fixedLevel,
  fixedLessonId,
  grammarCards: _grammarCards = [],
  onKanjiTextChange,
}: FlashcardFormProps) {
  void _grammarCards; // Keep prop for backward compat
  const EXAMPLE_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;

  const emptyLeveledExamples = (): LeveledExamples => ({
    N5: [], N4: [], N3: [], N2: [], N1: [],
  });

  const [formData, setFormData] = useState<FlashcardFormData>({
    vocabulary: '',
    kanji: '',
    sinoVietnamese: '',
    meaning: '',
    english: '',
    examples: [''],
    leveledExamples: emptyLeveledExamples(),
    jlptLevel: fixedLevel || 'N5',
    lessonId: fixedLessonId || '',
    difficultyLevel: 'medium',
  });

  // Active example level tab
  const [activeExampleLevel, setActiveExampleLevel] = useState<typeof EXAMPLE_LEVELS[number]>('N5');

  // AI loading states
  const [isGeneratingInfo, setIsGeneratingInfo] = useState(false);
  const [isGeneratingMeaning, setIsGeneratingMeaning] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        vocabulary: initialData.vocabulary,
        kanji: initialData.kanji,
        sinoVietnamese: initialData.sinoVietnamese,
        meaning: initialData.meaning,
        english: initialData.english || '',
        examples: initialData.examples.length > 0 ? initialData.examples : [''],
        leveledExamples: initialData.leveledExamples || emptyLeveledExamples(),
        jlptLevel: initialData.jlptLevel,
        lessonId: initialData.lessonId,
        difficultyLevel: (initialData.originalDifficultyLevel || initialData.difficultyLevel) === 'unset' ? 'medium' : (initialData.originalDifficultyLevel || initialData.difficultyLevel),
      });
    }
  }, [initialData]);

  // Notify parent of kanji text changes
  useEffect(() => {
    onKanjiTextChange?.(formData.kanji || formData.vocabulary);
  }, [formData.kanji, formData.vocabulary]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // AI: Auto-fill meaning from vocabulary
  const handleAutoFillFromVocabulary = async () => {
    const word = formData.vocabulary.trim() || formData.kanji.trim();
    if (!word) {
      alert('Vui lòng nhập từ vựng trước!');
      return;
    }

    setIsGeneratingMeaning(true);
    try {
      const info = await generateMeaningFromVocabulary(word);
      if (info) {
        setFormData(prev => ({
          ...prev,
          meaning: info.meaning || prev.meaning,
          sinoVietnamese: info.sinoVietnamese || prev.sinoVietnamese,
          english: info.english || prev.english,
        }));
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Lỗi khi tạo nghĩa');
    } finally {
      setIsGeneratingMeaning(false);
    }
  };

  // AI: Auto-fill from kanji
  const handleAutoFillFromKanji = async () => {
    if (!formData.kanji.trim()) {
      alert('Vui lòng nhập Kanji trước!');
      return;
    }

    setIsGeneratingInfo(true);
    try {
      const info = await generateKanjiInfo(formData.kanji);
      if (info) {
        setFormData(prev => ({
          ...prev,
          vocabulary: info.vocabulary || prev.vocabulary,
          sinoVietnamese: info.sinoVietnamese || prev.sinoVietnamese,
          meaning: info.meaning || prev.meaning,
          english: info.english || prev.english,
        }));
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Lỗi khi tạo thông tin');
    } finally {
      setIsGeneratingInfo(false);
    }
  };

  // --- Legacy flat example helpers ---
  const handleExampleChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.map((ex, i) => (i === index ? value : ex)),
    }));
  };

  const addExample = () => {
    setFormData(prev => ({ ...prev, examples: [...prev.examples, ''] }));
  };

  const removeExample = (index: number) => {
    if (formData.examples.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index),
    }));
  };

  // --- Leveled example helpers ---
  const currentLevelExamples = formData.leveledExamples?.[activeExampleLevel] || [];

  const updateLeveledExamples = (level: typeof EXAMPLE_LEVELS[number], examples: StructuredExample[]) => {
    setFormData(prev => ({
      ...prev,
      leveledExamples: {
        ...(prev.leveledExamples || emptyLeveledExamples()),
        [level]: examples,
      },
    }));
  };

  const handleLeveledExampleChange = (index: number, field: keyof StructuredExample, value: string) => {
    const updated = [...currentLevelExamples];
    updated[index] = { ...updated[index], [field]: value };
    updateLeveledExamples(activeExampleLevel, updated);
  };

  const addLeveledExample = () => {
    if (currentLevelExamples.length >= 3) return;
    updateLeveledExamples(activeExampleLevel, [
      ...currentLevelExamples,
      { japanese: '', vietnamese: '', english: '' },
    ]);
  };

  const removeLeveledExample = (index: number) => {
    updateLeveledExamples(
      activeExampleLevel,
      currentLevelExamples.filter((_, i) => i !== index)
    );
  };

  // AI: Generate 2 examples for ALL levels at once
  const [isGeneratingAllLevels, setIsGeneratingAllLevels] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState('');

  const handleGenerateAllLevels = async () => {
    const word = formData.kanji || formData.vocabulary;
    if (!word.trim()) {
      alert('Vui lòng nhập từ vựng hoặc kanji trước!');
      return;
    }

    setIsGeneratingAllLevels(true);
    const newLeveled = { ...(formData.leveledExamples || emptyLeveledExamples()) };

    for (const level of EXAMPLE_LEVELS) {
      setGeneratingProgress(`${level}...`);
      const existing = (newLeveled[level] || []).filter(e => e.japanese.trim());
      const results: StructuredExample[] = [...existing];

      // Generate up to 2 examples per level
      for (let i = results.length; i < 2; i++) {
        try {
          const result = await generateLeveledExample(
            formData.vocabulary,
            formData.kanji || undefined,
            formData.meaning,
            level,
            undefined,
            results.filter(e => e.japanese.trim())
          );
          if (result) {
            results.push({ japanese: result.japanese, vietnamese: result.vietnamese, english: result.english });
          }
        } catch {
          // Skip failed generation, continue with next
        }
      }
      newLeveled[level] = results;
    }

    setFormData(prev => ({ ...prev, leveledExamples: newLeveled }));
    setIsGeneratingAllLevels(false);
    setGeneratingProgress('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vocabulary.trim() || !formData.meaning.trim()) {
      alert('Vui lòng nhập từ vựng và nghĩa!');
      return;
    }
    if (!formData.lessonId) {
      alert('Vui lòng chọn bài học!');
      return;
    }
    // Clean leveled examples: remove empty entries
    const cleanedLeveled = formData.leveledExamples ? { ...formData.leveledExamples } : undefined;
    if (cleanedLeveled) {
      for (const lvl of EXAMPLE_LEVELS) {
        cleanedLeveled[lvl] = (cleanedLeveled[lvl] || []).filter(e => e.japanese.trim());
      }
    }
    // Check if any leveled examples exist
    const hasLeveledExamples = cleanedLeveled && EXAMPLE_LEVELS.some(l => cleanedLeveled[l].length > 0);

    const cleanedData: FlashcardFormData = {
      ...formData,
      examples: formData.examples.filter(ex => ex.trim() !== ''),
      leveledExamples: hasLeveledExamples ? cleanedLeveled : undefined,
    };
    onSubmit(cleanedData);
  };

  return (
    <form className="flashcard-form" onSubmit={handleSubmit}>
      <h3>{initialData ? 'Sửa thẻ' : 'Tạo thẻ mới'}</h3>

      {/* Kanji field with auto-fill button */}
      <div className="form-group">
        <label htmlFor="kanji">
          Kanji
          <button
            type="button"
            className="btn-ai"
            onClick={handleAutoFillFromKanji}
            disabled={isGeneratingInfo || !formData.kanji.trim()}
            title="Tự động điền từ vựng, âm hán việt, nghĩa"
          >
            {isGeneratingInfo ? (
              <RefreshCw size={14} className="spin" />
            ) : (
              <Sparkles size={14} />
            )}
            Auto
          </button>
        </label>
        <input
          type="text"
          id="kanji"
          name="kanji"
          value={formData.kanji}
          onChange={handleChange}
          placeholder="例: 食べる"
        />
      </div>

      <div className="form-group">
        <label htmlFor="vocabulary">
          Từ vựng (Hiragana) *
          <button
            type="button"
            className="btn-ai"
            onClick={handleAutoFillFromVocabulary}
            disabled={isGeneratingMeaning || (!formData.vocabulary.trim() && !formData.kanji.trim())}
            title="Tự động điền nghĩa tiếng Việt"
          >
            {isGeneratingMeaning ? (
              <RefreshCw size={14} className="spin" />
            ) : (
              <Sparkles size={14} />
            )}
            Nghĩa
          </button>
        </label>
        <input
          type="text"
          id="vocabulary"
          name="vocabulary"
          value={formData.vocabulary}
          onChange={handleChange}
          placeholder="例: たべる"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="sinoVietnamese">Âm Hán Việt</label>
        <input
          type="text"
          id="sinoVietnamese"
          name="sinoVietnamese"
          value={formData.sinoVietnamese}
          onChange={handleChange}
          placeholder="例: THỰC"
        />
      </div>

      <div className="form-group">
        <label htmlFor="meaning">Nghĩa tiếng Việt *</label>
        <input
          type="text"
          id="meaning"
          name="meaning"
          value={formData.meaning}
          onChange={handleChange}
          placeholder="例: Ăn"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="english">English</label>
        <input
          type="text"
          id="english"
          name="english"
          value={formData.english || ''}
          onChange={handleChange}
          placeholder="例: To eat"
        />
      </div>

      {/* Leveled Examples - tabbed by JLPT level */}
      <div className="form-group">
        <label>
          Câu ví dụ theo level
          <button
            type="button"
            className="btn-ai btn-generate-all"
            onClick={handleGenerateAllLevels}
            disabled={isGeneratingAllLevels || (!formData.vocabulary.trim() && !formData.kanji.trim())}
            title="Tự động tạo 2 ví dụ cho mỗi level (N5→N1)"
          >
            {isGeneratingAllLevels ? (
              <>
                <RefreshCw size={14} className="spin" />
                {generatingProgress || 'Đang tạo...'}
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Auto tạo tất cả
              </>
            )}
          </button>
        </label>
        <div className="level-tabs">
          {EXAMPLE_LEVELS.map(level => {
            const count = (formData.leveledExamples?.[level] || []).filter(e => e.japanese.trim()).length;
            return (
              <button
                key={level}
                type="button"
                className={`level-tab ${activeExampleLevel === level ? 'active' : ''}`}
                onClick={() => setActiveExampleLevel(level)}
              >
                {level}
                {count > 0 && <span className="level-tab-badge">{count}</span>}
              </button>
            );
          })}
        </div>

        <div className="level-examples-content">
          {currentLevelExamples.map((ex, index) => (
            <div key={index} className="leveled-example-row">
              <div className="leveled-example-header">
                <span className="leveled-example-num">#{index + 1}</span>
                <button
                  type="button"
                  className="btn-remove-example"
                  onClick={() => removeLeveledExample(index)}
                  title="Xóa ví dụ"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <input
                type="text"
                value={ex.japanese}
                onChange={(e) => handleLeveledExampleChange(index, 'japanese', e.target.value)}
                placeholder="日本語の文 (furigana: 漢字(かんじ))"
                className="leveled-input leveled-input-jp"
              />
              <input
                type="text"
                value={ex.vietnamese}
                onChange={(e) => handleLeveledExampleChange(index, 'vietnamese', e.target.value)}
                placeholder="Nghĩa tiếng Việt"
                className="leveled-input leveled-input-vi"
              />
              <input
                type="text"
                value={ex.english}
                onChange={(e) => handleLeveledExampleChange(index, 'english', e.target.value)}
                placeholder="English translation"
                className="leveled-input leveled-input-en"
              />
            </div>
          ))}

          {currentLevelExamples.length < 3 && (
            <button type="button" className="btn-add-leveled" onClick={addLeveledExample}>
              + Thêm ví dụ {activeExampleLevel}
            </button>
          )}

          {currentLevelExamples.length === 0 && !isGeneratingAllLevels && (
            <div className="leveled-empty">
              Chưa có ví dụ cho {activeExampleLevel}.
              <button type="button" className="btn-add-leveled" onClick={addLeveledExample}>
                + Thêm ví dụ
              </button>
            </div>
          )}

          {isGeneratingAllLevels && currentLevelExamples.length === 0 && (
            <div className="leveled-empty">
              <RefreshCw size={16} className="spin" /> Đang tạo ví dụ {generatingProgress}
            </div>
          )}
        </div>
      </div>

      {/* Legacy flat examples */}
      <div className="form-group">
        <label>
          Câu ví dụ (thường)
          <button type="button" className="btn-add-example" onClick={addExample} title="Thêm ví dụ">+</button>
        </label>
        {formData.examples.map((example, index) => (
          <div key={index} className="example-input-row">
            <textarea
              value={example}
              onChange={(e) => handleExampleChange(index, e.target.value)}
              placeholder={`Ví dụ ${index + 1}: 食(た)べます。\n(Ăn)`}
              rows={2}
            />
            <div className="example-actions">
              {formData.examples.length > 1 && (
                <button
                  type="button"
                  className="btn-remove-example"
                  onClick={() => removeExample(index)}
                  title="Xóa ví dụ"
                >
                  −
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Difficulty level selector */}
      <div className="form-group">
        <label>Độ khó</label>
        <div className="difficulty-selector">
          {DIFFICULTY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`difficulty-btn ${formData.difficultyLevel === opt.value ? 'active' : ''}`}
              style={{
                '--diff-color': opt.color,
                borderColor: formData.difficultyLevel === opt.value ? opt.color : undefined,
                background: formData.difficultyLevel === opt.value ? `${opt.color}15` : undefined,
              } as React.CSSProperties}
              onClick={() => setFormData(prev => ({ ...prev, difficultyLevel: opt.value }))}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Level/lesson selectors */}
      {!fixedLevel && (
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="jlptLevel">JLPT Level</label>
            <select id="jlptLevel" name="jlptLevel" value={formData.jlptLevel} onChange={handleChange}>
              {JLPT_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="lessonId">Bài học *</label>
            <select id="lessonId" name="lessonId" value={formData.lessonId} onChange={handleChange} required>
              <option value="">— Chọn bài học —</option>
              {lessons.map(lesson => (
                <option key={lesson.id} value={lesson.id}>{lesson.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Hủy</button>
        <button type="submit" className="btn btn-primary">{initialData ? 'Cập nhật' : 'Tạo thẻ'}</button>
      </div>
    </form>
  );
}
