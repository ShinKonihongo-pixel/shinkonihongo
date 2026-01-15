// Test/Assignment create modal

import { useState, useEffect } from 'react';
import type { TestFormData, TestQuestion, TestType, QuestionType } from '../../types/classroom';

interface TestCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TestFormData) => Promise<boolean>;
  testType: TestType;
}

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'multiple_choice', label: 'Trắc nghiệm' },
  { value: 'true_false', label: 'Đúng/Sai' },
  { value: 'text', label: 'Tự luận' },
];

export function TestCreateModal({
  isOpen,
  onClose,
  onSave,
  testType,
}: TestCreateModalProps) {
  const [title, setTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState(30); // Minutes for tests
  const [deadline, setDeadline] = useState(''); // ISO date for assignments
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setTimeLimit(30);
      setDeadline('');
      setQuestions([]);
      setError('');
    }
  }, [isOpen]);

  const handleAddQuestion = () => {
    const newQuestion: TestQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question: '',
      questionType: 'multiple_choice',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 10,
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (
    index: number,
    field: keyof TestQuestion,
    value: string | number | string[]
  ) => {
    const updated = [...questions];
    if (field === 'questionType') {
      // Reset options when changing type
      const newType = value as QuestionType;
      updated[index] = {
        ...updated[index],
        questionType: newType,
        options: newType === 'multiple_choice' ? ['', '', '', ''] : newType === 'true_false' ? ['Đúng', 'Sai'] : undefined,
        correctAnswer: newType === 'text' ? '' : 0,
      };
    } else if (field === 'question') {
      updated[index] = { ...updated[index], question: value as string };
    } else if (field === 'points') {
      updated[index] = { ...updated[index], points: value as number };
    } else if (field === 'correctAnswer') {
      updated[index] = { ...updated[index], correctAnswer: value as string | number };
    }
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    if (updated[qIndex].options) {
      updated[qIndex].options![oIndex] = value;
    }
    setQuestions(updated);
  };

  const handleAddOption = (qIndex: number) => {
    const updated = [...questions];
    if (updated[qIndex].options && updated[qIndex].options!.length < 6) {
      updated[qIndex].options!.push('');
    }
    setQuestions(updated);
  };

  const handleRemoveOption = (qIndex: number, oIndex: number) => {
    const updated = [...questions];
    if (updated[qIndex].options && updated[qIndex].options!.length > 2) {
      updated[qIndex].options!.splice(oIndex, 1);
      // Adjust correct answer if needed
      if (typeof updated[qIndex].correctAnswer === 'number') {
        if (updated[qIndex].correctAnswer as number >= updated[qIndex].options!.length) {
          updated[qIndex].correctAnswer = 0;
        }
      }
    }
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề');
      return;
    }

    if (questions.length === 0) {
      setError('Vui lòng thêm ít nhất một câu hỏi');
      return;
    }

    // Validate all questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setError(`Câu hỏi ${i + 1} chưa có nội dung`);
        return;
      }
      if (q.questionType === 'multiple_choice' && q.options) {
        const filledOptions = q.options.filter(o => o.trim());
        if (filledOptions.length < 2) {
          setError(`Câu hỏi ${i + 1} cần ít nhất 2 đáp án`);
          return;
        }
      }
    }

    if (testType === 'assignment' && !deadline) {
      setError('Vui lòng chọn hạn nộp bài');
      return;
    }

    setSaving(true);
    setError('');

    const data: TestFormData = {
      title: title.trim(),
      type: testType,
      questions,
      timeLimit: testType === 'test' ? timeLimit : undefined,
      deadline: testType === 'assignment' ? deadline : undefined,
    };

    const success = await onSave(data);

    if (success) {
      onClose();
    } else {
      setError('Lỗi khi lưu');
    }

    setSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content test-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{testType === 'test' ? 'Tạo bài kiểm tra' : 'Tạo bài tập'}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body test-modal-body">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label>Tiêu đề *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={testType === 'test' ? 'VD: Kiểm tra từ vựng N5' : 'VD: Bài tập ngữ pháp tuần 3'}
                className="form-input"
                autoFocus
              />
            </div>

            {testType === 'test' && (
              <div className="form-group">
                <label>Thời gian làm bài (phút) *</label>
                <input
                  type="number"
                  value={timeLimit}
                  onChange={e => setTimeLimit(parseInt(e.target.value) || 30)}
                  min={5}
                  max={180}
                  className="form-input form-input-small"
                />
              </div>
            )}

            {testType === 'assignment' && (
              <div className="form-group">
                <label>Hạn nộp bài *</label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="form-input"
                />
              </div>
            )}

            <div className="questions-section">
              <div className="questions-header">
                <h3>Câu hỏi ({questions.length})</h3>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleAddQuestion}
                >
                  + Thêm câu hỏi
                </button>
              </div>

              {questions.length === 0 ? (
                <p className="empty-text">Chưa có câu hỏi nào. Nhấn "Thêm câu hỏi" để bắt đầu.</p>
              ) : (
                <div className="questions-list">
                  {questions.map((q, qIndex) => (
                    <div key={q.id} className="question-item">
                      <div className="question-header">
                        <span className="question-number">Câu {qIndex + 1}</span>
                        <button
                          type="button"
                          className="btn btn-icon btn-danger"
                          onClick={() => handleRemoveQuestion(qIndex)}
                        >
                          ×
                        </button>
                      </div>

                      <div className="question-row">
                        <select
                          value={q.questionType}
                          onChange={e => handleQuestionChange(qIndex, 'questionType', e.target.value)}
                          className="form-select question-type-select"
                        >
                          {QUESTION_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={q.points}
                          onChange={e => handleQuestionChange(qIndex, 'points', parseInt(e.target.value) || 10)}
                          min={1}
                          max={100}
                          className="form-input points-input"
                          title="Điểm"
                        />
                        <span className="points-label">điểm</span>
                      </div>

                      <textarea
                        value={q.question}
                        onChange={e => handleQuestionChange(qIndex, 'question', e.target.value)}
                        placeholder="Nhập nội dung câu hỏi..."
                        className="form-textarea question-text"
                        rows={2}
                      />

                      {/* Options for multiple choice */}
                      {q.questionType === 'multiple_choice' && q.options && (
                        <div className="options-list">
                          {q.options.map((opt, oIndex) => (
                            <div key={oIndex} className="option-item">
                              <input
                                type="radio"
                                name={`correct_${q.id}`}
                                checked={q.correctAnswer === oIndex}
                                onChange={() => handleQuestionChange(qIndex, 'correctAnswer', oIndex)}
                                className="option-radio"
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={e => handleOptionChange(qIndex, oIndex, e.target.value)}
                                placeholder={`Đáp án ${oIndex + 1}`}
                                className="form-input option-input"
                              />
                              {q.options!.length > 2 && (
                                <button
                                  type="button"
                                  className="btn btn-icon btn-sm"
                                  onClick={() => handleRemoveOption(qIndex, oIndex)}
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                          {q.options.length < 6 && (
                            <button
                              type="button"
                              className="btn btn-link btn-sm"
                              onClick={() => handleAddOption(qIndex)}
                            >
                              + Thêm đáp án
                            </button>
                          )}
                        </div>
                      )}

                      {/* Options for true/false */}
                      {q.questionType === 'true_false' && (
                        <div className="options-list true-false-options">
                          <label className="option-item">
                            <input
                              type="radio"
                              name={`correct_${q.id}`}
                              checked={q.correctAnswer === 0}
                              onChange={() => handleQuestionChange(qIndex, 'correctAnswer', 0)}
                            />
                            <span>Đúng</span>
                          </label>
                          <label className="option-item">
                            <input
                              type="radio"
                              name={`correct_${q.id}`}
                              checked={q.correctAnswer === 1}
                              onChange={() => handleQuestionChange(qIndex, 'correctAnswer', 1)}
                            />
                            <span>Sai</span>
                          </label>
                        </div>
                      )}

                      {/* Text answer hint */}
                      {q.questionType === 'text' && (
                        <div className="text-answer-hint">
                          <input
                            type="text"
                            value={q.correctAnswer as string || ''}
                            onChange={e => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                            placeholder="Đáp án mẫu (tùy chọn, dùng để tham khảo khi chấm điểm)"
                            className="form-input"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {questions.length > 0 && (
              <div className="total-points">
                Tổng điểm: <strong>{questions.reduce((sum, q) => sum + q.points, 0)}</strong>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu (Nháp)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
