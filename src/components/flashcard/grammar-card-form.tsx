// Form for creating/editing grammar cards - Synchronized with system design

import { useState, useEffect } from 'react';
import { Plus, Trash2, Sparkles, RefreshCw } from 'lucide-react';
import type { GrammarCardFormData, GrammarCard, GrammarExample, JLPTLevel, Lesson, Flashcard } from '../../types/flashcard';
import { generateGrammarExample, type VocabularyItem } from '../../services/kanji-ai-service';

interface GrammarCardFormProps {
  onSubmit: (data: GrammarCardFormData) => void;
  onCancel: () => void;
  initialData?: GrammarCard;
  lessons: Lesson[];
  fixedLevel?: JLPTLevel | null;
  fixedLessonId?: string | null;
  vocabularyCards?: Flashcard[];
}

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

const emptyExample: GrammarExample = { japanese: '', vietnamese: '' };

// JLPT Level colors - consistent with system
const LEVEL_COLORS: Record<JLPTLevel, string> = {
  N5: '#4CAF50',
  N4: '#2196F3',
  N3: '#FF9800',
  N2: '#9C27B0',
  N1: '#E34234',
};

export function GrammarCardForm({
  onSubmit,
  onCancel,
  initialData,
  lessons,
  fixedLevel,
  fixedLessonId,
  vocabularyCards = [],
}: GrammarCardFormProps) {
  const [formData, setFormData] = useState<GrammarCardFormData>({
    title: '',
    formula: '',
    meaning: '',
    explanation: '',
    examples: [{ ...emptyExample }],
    jlptLevel: fixedLevel || 'N5',
    lessonId: fixedLessonId || '',
  });
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);

  // Get vocabulary for current lesson
  const lessonVocabulary: VocabularyItem[] = vocabularyCards
    .filter(v => v.lessonId === (fixedLessonId || formData.lessonId))
    .map(v => ({
      vocabulary: v.vocabulary,
      kanji: v.kanji,
      meaning: v.meaning,
    }));

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        formula: initialData.formula,
        meaning: initialData.meaning || '',
        explanation: initialData.explanation || '',
        examples: initialData.examples.length > 0 ? initialData.examples : [{ ...emptyExample }],
        jlptLevel: initialData.jlptLevel,
        lessonId: initialData.lessonId,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleExampleChange = (index: number, field: keyof GrammarExample, value: string) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.map((ex, i) => i === index ? { ...ex, [field]: value } : ex),
    }));
  };

  const addExample = () => {
    setFormData(prev => ({ ...prev, examples: [...prev.examples, { ...emptyExample }] }));
  };

  const removeExample = (index: number) => {
    if (formData.examples.length <= 1) return;
    setFormData(prev => ({ ...prev, examples: prev.examples.filter((_, i) => i !== index) }));
  };

  // AI: Generate example based on grammar pattern + lesson vocabulary
  const handleGenerateExample = async (index: number) => {
    if (!formData.title.trim() || !formData.formula.trim()) {
      alert('Vui lòng nhập tên ngữ pháp và công thức trước!');
      return;
    }

    setGeneratingIndex(index);
    try {
      const existingExamples = formData.examples
        .filter(ex => ex.japanese.trim())
        .map(ex => ex.japanese);

      const result = await generateGrammarExample(
        formData.title,
        formData.formula,
        formData.meaning || formData.title,
        existingExamples,
        lessonVocabulary.length > 0 ? lessonVocabulary : undefined
      );

      if (result) {
        setFormData(prev => ({
          ...prev,
          examples: prev.examples.map((ex, i) =>
            i === index ? { japanese: result.japanese, vietnamese: result.vietnamese } : ex
          ),
        }));
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Lỗi khi tạo ví dụ');
    } finally {
      setGeneratingIndex(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.formula.trim()) {
      alert('Vui lòng nhập tên ngữ pháp và công thức!');
      return;
    }
    const cleanedData: GrammarCardFormData = {
      ...formData,
      meaning: formData.meaning || formData.title,
      lessonId: fixedLessonId || formData.lessonId,
      examples: formData.examples.filter(ex => ex.japanese.trim() !== ''),
    };
    onSubmit(cleanedData);
  };

  const isComplete = formData.title.trim() && formData.formula.trim();
  const levelColor = LEVEL_COLORS[formData.jlptLevel];

  return (
    <form className="grammar-form" onSubmit={handleSubmit}>
      {/* Header with level indicator */}
      <div className="grammar-form-header" style={{ '--level-color': levelColor } as React.CSSProperties}>
        <h3>{initialData ? 'Sửa ngữ pháp' : 'Tạo ngữ pháp mới'}</h3>
        <span className="grammar-level-badge" style={{ background: levelColor }}>
          {fixedLevel || formData.jlptLevel}
        </span>
      </div>

      {/* Title field */}
      <div className="form-group">
        <label htmlFor="grammar-title">Tên ngữ pháp *</label>
        <input
          type="text"
          id="grammar-title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="〜てから / 〜ながら / 〜たり〜たりする"
          required
        />
      </div>

      {/* Formula field - dark terminal style */}
      <div className="form-group">
        <label htmlFor="grammar-formula">Công thức *</label>
        <input
          type="text"
          id="grammar-formula"
          name="formula"
          value={formData.formula}
          onChange={handleChange}
          placeholder="V-て + から / V₁-ながら + V₂"
          className="grammar-formula-input"
          required
        />
      </div>

      {/* Explanation field */}
      <div className="form-group">
        <label htmlFor="grammar-explanation">Giải thích (tùy chọn)</label>
        <input
          type="text"
          id="grammar-explanation"
          name="explanation"
          value={formData.explanation}
          onChange={handleChange}
          placeholder="Cách sử dụng, lưu ý, so sánh với mẫu ngữ pháp khác..."
        />
      </div>

      {/* Examples section */}
      <div className="form-group">
        <label>
          Ví dụ ({formData.examples.length})
          <button type="button" className="btn-add-example" onClick={addExample} title="Thêm ví dụ">
            <Plus size={14} />
          </button>
        </label>

        <div className="grammar-examples-list">
          {formData.examples.map((example, index) => (
            <div key={index} className="grammar-example-item">
              <span className="grammar-example-num">{index + 1}</span>
              <div className="grammar-example-fields">
                <textarea
                  value={example.japanese}
                  onChange={(e) => handleExampleChange(index, 'japanese', e.target.value)}
                  placeholder="🇯🇵 Câu tiếng Nhật với furigana: 食(た)べてから、寝(ね)ます。"
                  className="grammar-input-jp"
                  rows={2}
                />
                <textarea
                  value={example.vietnamese}
                  onChange={(e) => handleExampleChange(index, 'vietnamese', e.target.value)}
                  placeholder="🇻🇳 Nghĩa tiếng Việt"
                  className="grammar-input-vi"
                  rows={1}
                />
              </div>
              <div className="example-actions">
                <button
                  type="button"
                  className="btn-ai-example"
                  onClick={() => handleGenerateExample(index)}
                  disabled={generatingIndex === index || !formData.title.trim()}
                  title={lessonVocabulary.length > 0
                    ? `Tạo ví dụ từ ${lessonVocabulary.length} từ vựng của bài`
                    : 'Tạo ví dụ tự động'}
                >
                  {generatingIndex === index ? <RefreshCw size={14} className="spin" /> : <Sparkles size={14} />}
                </button>
                {formData.examples.length > 1 && (
                  <button
                    type="button"
                    className="btn-remove-example"
                    onClick={() => removeExample(index)}
                    title="Xóa ví dụ"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Vocabulary hint */}
        {lessonVocabulary.length > 0 && (
          <div className="grammar-vocab-hint">
            💡 {lessonVocabulary.length} từ vựng của bài sẽ được sử dụng khi tạo ví dụ
          </div>
        )}
      </div>

      {/* Level/Lesson selectors (if not fixed) */}
      {!fixedLevel && (
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="grammar-level">Cấp độ</label>
            <select id="grammar-level" name="jlptLevel" value={formData.jlptLevel} onChange={handleChange}>
              {JLPT_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="grammar-lesson">Bài học</label>
            <select id="grammar-lesson" name="lessonId" value={formData.lessonId} onChange={handleChange} required>
              <option value="">— Chọn bài học —</option>
              {lessons.map(lesson => (
                <option key={lesson.id} value={lesson.id}>{lesson.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Hủy</button>
        <button type="submit" className="btn btn-primary" disabled={!isComplete}>
          {initialData ? 'Cập nhật' : 'Tạo ngữ pháp'}
        </button>
      </div>
    </form>
  );
}
