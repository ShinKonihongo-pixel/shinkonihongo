// Puzzle answer form component

import type { PuzzleFormData } from './types';

interface PuzzleFormProps {
  formData: PuzzleFormData;
  categories: string[];
  onFormChange: (data: PuzzleFormData) => void;
}

export function PuzzleForm({ formData, categories, onFormChange }: PuzzleFormProps) {
  const updateField = (field: keyof PuzzleFormData, value: string | 'easy' | 'medium' | 'hard') => {
    onFormChange({ ...formData, [field]: value });
  };

  return (
    <div className="pg-answer-section">
      <div className="pg-answer-header">
        <span>Đáp án & Thông tin</span>
      </div>
      <div className="pg-answer-grid">
        <div className="pg-form-group">
          <label>Đáp án (từ cần đoán) *</label>
          <input
            type="text"
            value={formData.word}
            onChange={e => updateField('word', e.target.value)}
            placeholder="VD: 桜 hoặc さくら"
          />
        </div>

        <div className="pg-form-group">
          <label>Cách đọc (Hiragana)</label>
          <input
            type="text"
            value={formData.reading}
            onChange={e => updateField('reading', e.target.value)}
            placeholder="VD: さくら"
          />
        </div>

        <div className="pg-form-group">
          <label>Nghĩa tiếng Việt *</label>
          <input
            type="text"
            value={formData.meaning}
            onChange={e => updateField('meaning', e.target.value)}
            placeholder="VD: Hoa anh đào"
          />
        </div>

        <div className="pg-form-group">
          <label>Hán Việt</label>
          <input
            type="text"
            value={formData.sinoVietnamese}
            onChange={e => updateField('sinoVietnamese', e.target.value)}
            placeholder="VD: Anh"
          />
        </div>

        <div className="pg-form-group">
          <label>Phân loại</label>
          <input
            type="text"
            value={formData.category}
            onChange={e => updateField('category', e.target.value)}
            placeholder="VD: Thiên nhiên"
            list="category-suggestions"
          />
          <datalist id="category-suggestions">
            {categories.filter(c => c !== 'all' && c !== 'uncategorized').map(cat => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>

        <div className="pg-form-group">
          <label>Độ khó</label>
          <div className="pg-difficulty-options">
            {(['easy', 'medium', 'hard'] as const).map(diff => (
              <button
                key={diff}
                className={`pg-difficulty-btn ${diff} ${formData.difficulty === diff ? 'active' : ''}`}
                onClick={() => updateField('difficulty', diff)}
              >
                {diff === 'easy' ? 'Dễ' : diff === 'medium' ? 'TB' : 'Khó'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
