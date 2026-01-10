// Form for creating/editing flashcards

import { useState, useEffect } from 'react';
import type { FlashcardFormData, JLPTLevel, Flashcard, Lesson } from '../../types/flashcard';

interface FlashcardFormProps {
  onSubmit: (data: FlashcardFormData) => void;
  onCancel: () => void;
  initialData?: Flashcard;
  lessons: Lesson[];
  // Fixed values from navigation - when set, these fields are auto-filled
  fixedLevel?: JLPTLevel | null;
  fixedLessonId?: string | null;
}

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

export function FlashcardForm({
  onSubmit,
  onCancel,
  initialData,
  lessons,
  fixedLevel,
  fixedLessonId,
}: FlashcardFormProps) {
  const [formData, setFormData] = useState<FlashcardFormData>({
    vocabulary: '',
    kanji: '',
    sinoVietnamese: '',
    meaning: '',
    examples: [''],
    jlptLevel: fixedLevel || 'N5',
    lessonId: fixedLessonId || '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        vocabulary: initialData.vocabulary,
        kanji: initialData.kanji,
        sinoVietnamese: initialData.sinoVietnamese,
        meaning: initialData.meaning,
        examples: initialData.examples.length > 0 ? initialData.examples : [''],
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
  const handleExampleChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.map((ex, i) => (i === index ? value : ex)),
    }));
  };

  // Add new example field
  const addExample = () => {
    setFormData(prev => ({
      ...prev,
      examples: [...prev.examples, ''],
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
    if (!formData.vocabulary.trim() || !formData.meaning.trim()) {
      alert('Vui lòng nhập từ vựng và nghĩa!');
      return;
    }
    if (!formData.lessonId) {
      alert('Vui lòng chọn bài học!');
      return;
    }
    // Filter out empty examples before submit
    const cleanedData = {
      ...formData,
      examples: formData.examples.filter(ex => ex.trim() !== ''),
    };
    onSubmit(cleanedData);
  };

  return (
    <form className="flashcard-form" onSubmit={handleSubmit}>
      <h3>{initialData ? 'Sửa thẻ' : 'Tạo thẻ mới'}</h3>

      <div className="form-group">
        <label htmlFor="vocabulary">Từ vựng *</label>
        <input
          type="text"
          id="vocabulary"
          name="vocabulary"
          value={formData.vocabulary}
          onChange={handleChange}
          placeholder="例: たべる / 食べる"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="kanji">Kanji</label>
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
        <label>
          Câu ví dụ
          <button
            type="button"
            className="btn-add-example"
            onClick={addExample}
            title="Thêm ví dụ"
          >
            +
          </button>
        </label>
        {formData.examples.map((example, index) => (
          <div key={index} className="example-input-row">
            <textarea
              value={example}
              onChange={(e) => handleExampleChange(index, e.target.value)}
              placeholder={`Ví dụ ${index + 1}: ごはんを食べます。`}
              rows={2}
            />
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
