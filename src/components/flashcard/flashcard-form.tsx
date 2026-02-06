// Form for creating/editing flashcards with AI auto-fill

import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, BookOpen } from 'lucide-react';
import type { FlashcardFormData, JLPTLevel, Flashcard, Lesson, DifficultyLevel, GrammarCard } from '../../types/flashcard';
import { generateKanjiInfo, generateExample, generateMeaningFromVocabulary, generateExampleWithGrammar, type GrammarPattern } from '../../services/kanji-ai-service';
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

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

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
  grammarCards = [],
  onKanjiTextChange,
}: FlashcardFormProps) {
  const [formData, setFormData] = useState<FlashcardFormData>({
    vocabulary: '',
    kanji: '',
    sinoVietnamese: '',
    meaning: '',
    english: '',
    examples: [''],
    jlptLevel: fixedLevel || 'N5',
    lessonId: fixedLessonId || '',
    difficultyLevel: 'medium',
  });

  // AI loading states
  const [isGeneratingInfo, setIsGeneratingInfo] = useState(false);
  const [isGeneratingMeaning, setIsGeneratingMeaning] = useState(false);
  const [generatingExampleIndex, setGeneratingExampleIndex] = useState<number | null>(null);
  const [generatingGrammarIndex, setGeneratingGrammarIndex] = useState<number | null>(null);

  // Get grammar patterns for the current lesson
  const lessonGrammarPatterns: GrammarPattern[] = grammarCards
    .filter(g => g.lessonId === (fixedLessonId || formData.lessonId))
    .map(g => ({
      title: g.title,
      formula: g.formula,
      meaning: g.meaning,
    }));

  useEffect(() => {
    if (initialData) {
      setFormData({
        vocabulary: initialData.vocabulary,
        kanji: initialData.kanji,
        sinoVietnamese: initialData.sinoVietnamese,
        meaning: initialData.meaning,
        english: initialData.english || '',
        examples: initialData.examples.length > 0 ? initialData.examples : [''],
        jlptLevel: initialData.jlptLevel,
        lessonId: initialData.lessonId,
        difficultyLevel: initialData.difficultyLevel === 'unset' ? 'medium' : initialData.difficultyLevel,
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

  const handleExampleChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.map((ex, i) => (i === index ? value : ex)),
    }));
  };

  const addExample = () => {
    setFormData(prev => ({
      ...prev,
      examples: [...prev.examples, ''],
    }));
  };

  const removeExample = (index: number) => {
    if (formData.examples.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index),
    }));
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

  // AI: Generate example sentence
  const handleGenerateExample = async (index: number) => {
    const word = formData.kanji || formData.vocabulary;
    if (!word.trim()) {
      alert('Vui lòng nhập từ vựng hoặc kanji trước!');
      return;
    }

    setGeneratingExampleIndex(index);
    try {
      // Pass existing examples to avoid duplicates
      const existingExamples = formData.examples.filter(e => e.trim());
      const example = await generateExample(
        formData.vocabulary,
        formData.kanji,
        formData.meaning,
        existingExamples
      );

      if (example) {
        const newExample = `${example.japanese}\n(${example.vietnamese})`;
        setFormData(prev => ({
          ...prev,
          examples: prev.examples.map((ex, i) => (i === index ? newExample : ex)),
        }));
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Lỗi khi tạo ví dụ');
    } finally {
      setGeneratingExampleIndex(null);
    }
  };

  // AI: Generate example using grammar patterns from the lesson
  const handleGenerateWithGrammar = async (index: number) => {
    const word = formData.kanji || formData.vocabulary;
    if (!word.trim()) {
      alert('Vui lòng nhập từ vựng hoặc kanji trước!');
      return;
    }

    if (lessonGrammarPatterns.length === 0) {
      alert('Không có ngữ pháp nào trong bài này!');
      return;
    }

    setGeneratingGrammarIndex(index);
    try {
      const existingExamples = formData.examples.filter(e => e.trim());
      const example = await generateExampleWithGrammar(
        formData.vocabulary,
        formData.kanji,
        formData.meaning,
        lessonGrammarPatterns,
        existingExamples
      );

      if (example) {
        const newExample = `${example.japanese}\n(${example.vietnamese})`;
        setFormData(prev => ({
          ...prev,
          examples: prev.examples.map((ex, i) => (i === index ? newExample : ex)),
        }));
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Lỗi khi tạo ví dụ');
    } finally {
      setGeneratingGrammarIndex(null);
    }
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
    const cleanedData = {
      ...formData,
      examples: formData.examples.filter(ex => ex.trim() !== ''),
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

      {/* Examples with AI generate button */}
      <div className="form-group">
        <label>
          Câu ví dụ
          <button type="button" className="btn-add-example" onClick={addExample} title="Thêm ví dụ">+</button>
        </label>
        {formData.examples.map((example, index) => (
          <div key={index} className="example-input-row">
            <textarea
              value={example}
              onChange={(e) => handleExampleChange(index, e.target.value)}
              placeholder={`Ví dụ ${index + 1}: ごはんを食べます。`}
              rows={2}
            />
            <div className="example-actions">
              <button
                type="button"
                className="btn-ai-example"
                onClick={() => handleGenerateExample(index)}
                disabled={generatingExampleIndex === index || generatingGrammarIndex === index}
                title="Tạo ví dụ tự động"
              >
                {generatingExampleIndex === index ? (
                  <RefreshCw size={14} className="spin" />
                ) : (
                  <Sparkles size={14} />
                )}
              </button>
              {lessonGrammarPatterns.length > 0 && (
                <button
                  type="button"
                  className="btn-grammar-example"
                  onClick={() => handleGenerateWithGrammar(index)}
                  disabled={generatingGrammarIndex === index || generatingExampleIndex === index}
                  title={`Tạo ví dụ theo ngữ pháp bài (${lessonGrammarPatterns.length} mẫu)`}
                >
                  {generatingGrammarIndex === index ? (
                    <RefreshCw size={14} className="spin" />
                  ) : (
                    <BookOpen size={14} />
                  )}
                </button>
              )}
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

      <style>{`
        .btn-ai {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-left: 8px;
          padding: 2px 8px;
          font-size: 0.75rem;
          border: 1px solid var(--primary-color, #4a90d9);
          background: white;
          color: var(--primary-color, #4a90d9);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-ai:hover:not(:disabled) {
          background: var(--primary-color, #4a90d9);
          color: white;
        }
        .btn-ai:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .example-input-row {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }
        .example-input-row textarea {
          flex: 1;
        }
        .example-actions {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .btn-ai-example {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--primary-color, #4a90d9);
          background: white;
          color: var(--primary-color, #4a90d9);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-ai-example:hover:not(:disabled) {
          background: var(--primary-color, #4a90d9);
          color: white;
        }
        .btn-ai-example:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-grammar-example {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #0d9488;
          background: white;
          color: #0d9488;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-grammar-example:hover:not(:disabled) {
          background: #0d9488;
          color: white;
        }
        .btn-grammar-example:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-remove-example {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #ef4444;
          background: white;
          color: #ef4444;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1.25rem;
          line-height: 1;
        }
        .btn-remove-example:hover {
          background: #ef4444;
          color: white;
        }

        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .difficulty-selector {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .difficulty-btn {
          padding: 0.375rem 0.75rem;
          border: 2px solid var(--border-color, #ddd);
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        .difficulty-btn.active {
          font-weight: 600;
        }
      `}</style>
    </form>
  );
}
