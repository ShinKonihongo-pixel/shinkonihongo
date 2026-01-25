// Form for creating/editing grammar cards

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { GrammarCardFormData, GrammarCard, GrammarExample, JLPTLevel, Lesson } from '../../types/flashcard';

interface GrammarCardFormProps {
  onSubmit: (data: GrammarCardFormData) => void;
  onCancel: () => void;
  initialData?: GrammarCard;
  lessons: Lesson[];
  fixedLevel?: JLPTLevel | null;
  fixedLessonId?: string | null;
}

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

const emptyExample: GrammarExample = { japanese: '', vietnamese: '' };

export function GrammarCardForm({
  onSubmit,
  onCancel,
  initialData,
  lessons,
  fixedLevel,
  fixedLessonId,
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

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        formula: initialData.formula,
        meaning: initialData.meaning,
        explanation: initialData.explanation || '',
        examples: initialData.examples.length > 0 ? initialData.examples : [{ ...emptyExample }],
        jlptLevel: initialData.jlptLevel,
        lessonId: initialData.lessonId,
      });
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle example change at specific index
  const handleExampleChange = (index: number, field: keyof GrammarExample, value: string) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.map((ex, i) =>
        i === index ? { ...ex, [field]: value } : ex
      ),
    }));
  };

  // Add new example
  const addExample = () => {
    setFormData(prev => ({
      ...prev,
      examples: [...prev.examples, { ...emptyExample }],
    }));
  };

  // Remove example at index
  const removeExample = (index: number) => {
    if (formData.examples.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.formula.trim() || !formData.meaning.trim()) {
      alert('Vui lòng nhập tên ngữ pháp, công thức và nghĩa!');
      return;
    }
    if (!formData.lessonId) {
      alert('Vui lòng chọn bài học!');
      return;
    }
    // Filter out empty examples
    const cleanedData: GrammarCardFormData = {
      ...formData,
      examples: formData.examples.filter(ex => ex.japanese.trim() !== ''),
    };
    onSubmit(cleanedData);
  };

  return (
    <form className="flashcard-form grammar-card-form" onSubmit={handleSubmit}>
      <h3>{initialData ? 'Sửa thẻ ngữ pháp' : 'Tạo thẻ ngữ pháp'}</h3>

      <div className="form-group">
        <label htmlFor="title">Tên ngữ pháp *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="例: 〜てから / 〜ながら"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="formula">Công thức *</label>
        <input
          type="text"
          id="formula"
          name="formula"
          value={formData.formula}
          onChange={handleChange}
          placeholder="例: V-て + から / V-ます(stem) + ながら"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="meaning">Nghĩa *</label>
        <input
          type="text"
          id="meaning"
          name="meaning"
          value={formData.meaning}
          onChange={handleChange}
          placeholder="例: Sau khi ~ / Vừa ~ vừa ~"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="explanation">Giải thích chi tiết</label>
        <textarea
          id="explanation"
          name="explanation"
          value={formData.explanation}
          onChange={handleChange}
          placeholder="Giải thích cách sử dụng, lưu ý..."
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>
          Ví dụ
          <button
            type="button"
            className="btn-add-example"
            onClick={addExample}
            title="Thêm ví dụ"
          >
            <Plus size={14} />
          </button>
        </label>
        {formData.examples.map((example, index) => (
          <div key={index} className="grammar-example-row">
            <div className="example-inputs">
              <input
                type="text"
                value={example.japanese}
                onChange={(e) => handleExampleChange(index, 'japanese', e.target.value)}
                placeholder={`Ví dụ ${index + 1}: ごはんを食べてから、出かけます。`}
              />
              <input
                type="text"
                value={example.vietnamese}
                onChange={(e) => handleExampleChange(index, 'vietnamese', e.target.value)}
                placeholder="Nghĩa: Sau khi ăn cơm, tôi đi ra ngoài."
              />
            </div>
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
        ))}
      </div>

      {/* Show level/lesson selectors only if not fixed */}
      {!fixedLevel && (
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="jlptLevel">JLPT Level</label>
            <select
              id="jlptLevel"
              name="jlptLevel"
              value={formData.jlptLevel}
              onChange={handleChange}
            >
              {JLPT_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="lessonId">Bài học *</label>
            <select
              id="lessonId"
              name="lessonId"
              value={formData.lessonId}
              onChange={handleChange}
              required
            >
              <option value="">— Chọn bài học —</option>
              {lessons.map(lesson => (
                <option key={lesson.id} value={lesson.id}>{lesson.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Hủy
        </button>
        <button type="submit" className="btn btn-primary">
          {initialData ? 'Cập nhật' : 'Tạo thẻ'}
        </button>
      </div>
    </form>
  );
}
