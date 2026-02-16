// Question editor component for creating/editing test questions

import { Plus, Trash2 } from 'lucide-react';
import type { TestQuestion, QuestionType, DifficultyLevel } from '../../../types/classroom';
import { DEFAULT_QUESTION_POINTS } from '../../../types/classroom';
import { DIFFICULTY_OPTIONS } from './test-bank-types';

interface QuestionEditorProps {
  questions: TestQuestion[];
  onChange: (questions: TestQuestion[]) => void;
}

export function QuestionEditor({ questions, onChange }: QuestionEditorProps) {
  const addQuestion = () => {
    const newQuestion: TestQuestion = {
      id: `q_${Date.now()}`,
      questionType: 'multiple_choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: DEFAULT_QUESTION_POINTS,
      difficulty: 'medium',
    };
    onChange([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updates: Partial<TestQuestion>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeQuestion = (index: number) => {
    onChange(questions.filter((_, i) => i !== index));
  };

  return (
    <div className="question-editor">
      <div className="question-list">
        {questions.map((q, idx) => (
          <div key={q.id} className="question-item">
            <div className="question-header">
              <span className="question-number">Câu {idx + 1}</span>
              <select
                value={q.questionType}
                onChange={(e) => updateQuestion(idx, { questionType: e.target.value as QuestionType })}
                className="question-type-select"
              >
                <option value="multiple_choice">Trắc nghiệm</option>
                <option value="text">Tự luận</option>
                <option value="true_false">Đúng/Sai</option>
              </select>
              <select
                value={q.difficulty || 'medium'}
                onChange={(e) => updateQuestion(idx, { difficulty: e.target.value as DifficultyLevel })}
                className="question-difficulty-select"
                style={{
                  backgroundColor: DIFFICULTY_OPTIONS.find(d => d.value === (q.difficulty || 'medium'))?.color + '20',
                  borderColor: DIFFICULTY_OPTIONS.find(d => d.value === (q.difficulty || 'medium'))?.color
                }}
              >
                {DIFFICULTY_OPTIONS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
              <input
                type="number"
                value={q.points}
                onChange={(e) => updateQuestion(idx, { points: parseInt(e.target.value) || DEFAULT_QUESTION_POINTS })}
                className="question-points"
                min={1}
                title="Điểm"
              />
              <span className="points-label">đ</span>
              <button
                type="button"
                className="btn btn-sm btn-icon danger"
                onClick={() => removeQuestion(idx)}
              >
                <Trash2 size={14} />
              </button>
            </div>

            <textarea
              value={q.question}
              onChange={(e) => updateQuestion(idx, { question: e.target.value })}
              placeholder="Nội dung câu hỏi..."
              className="question-text"
              rows={2}
            />

            {q.questionType === 'multiple_choice' && q.options && (
              <div className="question-options">
                {q.options.map((opt, optIdx) => (
                  <div key={optIdx} className="option-row">
                    <input
                      type="radio"
                      name={`correct_${q.id}`}
                      checked={q.correctAnswer === optIdx}
                      onChange={() => updateQuestion(idx, { correctAnswer: optIdx })}
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...(q.options || [])];
                        newOptions[optIdx] = e.target.value;
                        updateQuestion(idx, { options: newOptions });
                      }}
                      placeholder={`Đáp án ${String.fromCharCode(65 + optIdx)}`}
                      className="option-input"
                    />
                  </div>
                ))}
              </div>
            )}

            {q.questionType === 'true_false' && (
              <div className="true-false-options">
                <label>
                  <input
                    type="radio"
                    name={`tf_${q.id}`}
                    checked={q.correctAnswer === 'true'}
                    onChange={() => updateQuestion(idx, { correctAnswer: 'true' })}
                  />
                  Đúng
                </label>
                <label>
                  <input
                    type="radio"
                    name={`tf_${q.id}`}
                    checked={q.correctAnswer === 'false'}
                    onChange={() => updateQuestion(idx, { correctAnswer: 'false' })}
                  />
                  Sai
                </label>
              </div>
            )}
          </div>
        ))}
      </div>

      <button type="button" className="btn btn-secondary add-question-btn" onClick={addQuestion}>
        <Plus size={16} />
        Thêm câu hỏi
      </button>
    </div>
  );
}
