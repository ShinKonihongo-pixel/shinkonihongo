// Test/Assignment create modal — premium dark glassmorphism UI
import { useState, useEffect } from 'react';
import {
  X, Plus, Trash2, GripVertical, ListChecks, ToggleLeft,
  AlignLeft, Clock, CalendarClock, Award, FileQuestion, Save, Sparkles,
} from 'lucide-react';
import type { TestFormData, TestQuestion, TestType, QuestionType } from '../../types/classroom';
import './test-create-modal.css';

interface TestCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TestFormData) => Promise<boolean>;
  /** Determines whether to show a time-limit field (test) or a deadline field (assignment). */
  testType: TestType;
}

// Available question types with display metadata — drives both the "add" buttons
// and the type-chip selector inside each expanded question card.
const QUESTION_TYPES: { value: QuestionType; label: string; icon: typeof ListChecks; desc: string }[] = [
  { value: 'multiple_choice', label: 'Trắc nghiệm', icon: ListChecks, desc: 'Nhiều lựa chọn' },
  { value: 'true_false', label: 'Đúng/Sai', icon: ToggleLeft, desc: '2 lựa chọn' },
  { value: 'text', label: 'Tự luận', icon: AlignLeft, desc: 'Trả lời tự do' },
];

// Option letters A–F map answer indices to human-readable labels.
// Index 0 → 'A', index 1 → 'B', etc. Capped at 6 options per question.
const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * TestCreateModal — full-screen overlay modal for building a test or assignment
 * from scratch.
 *
 * The modal is "draftable": it always saves as a draft so teachers can iterate
 * before publishing. The caller's `onSave` decides the actual persistence logic.
 *
 * Supported question types:
 *  - multiple_choice: 2–6 user-defined options; correct answer = option index.
 *  - true_false:       fixed "Đúng" / "Sai" options; correct answer = 0 or 1.
 *  - text:             open-ended; correctAnswer holds a sample answer string
 *                      used only as a grading reference (not auto-graded).
 */
export function TestCreateModal({
  isOpen,
  onClose,
  onSave,
  testType,
}: TestCreateModalProps) {
  const [title, setTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [deadline, setDeadline] = useState('');
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Only one question card is expanded at a time; tracks the id of the open card.
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  // Reset all fields when the modal re-opens so stale data from a previous session
  // is never shown to the teacher.
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setTimeLimit(30);
      setDeadline('');
      setQuestions([]);
      setError('');
      setExpandedQ(null);
    }
  }, [isOpen]);

  // Derived total displayed in the footer stats bar
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  // isTest controls which settings field is shown: time-limit vs deadline
  const isTest = testType === 'test';

  // ─── Question type handlers ────────────────────────────────────────────────

  /**
   * Handler 1: Add a new question.
   * Each question gets a collision-resistant id (timestamp + random suffix).
   * Initial state varies by type:
   *  - multiple_choice → 4 empty string options, correctAnswer = 0 (first option)
   *  - true_false      → 2 fixed labels, correctAnswer = 0 (Đúng)
   *  - text            → no options array, correctAnswer = '' (sample answer string)
   * The new card is immediately expanded so the teacher can fill it in.
   */
  const handleAddQuestion = (type: QuestionType = 'multiple_choice') => {
    const newQ: TestQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      question: '',
      questionType: type,
      options: type === 'multiple_choice' ? ['', '', '', ''] : type === 'true_false' ? ['Đúng', 'Sai'] : undefined,
      correctAnswer: type === 'text' ? '' : 0,
      points: 10,
    };
    setQuestions(prev => [...prev, newQ]);
    setExpandedQ(newQ.id);
  };

  /** Remove a question by its array index. */
  const handleRemoveQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Handler 2: Change a question field.
   * When the type changes, options and correctAnswer are reset to valid defaults
   * for the new type to prevent stale data (e.g., a numeric index carried into
   * a text question where correctAnswer must be a string).
   * Other fields (question text, points, correctAnswer) are updated directly.
   */
  const handleQuestionChange = (index: number, field: keyof TestQuestion, value: string | number | string[]) => {
    setQuestions(prev => {
      const updated = [...prev];
      if (field === 'questionType') {
        const newType = value as QuestionType;
        updated[index] = {
          ...updated[index],
          questionType: newType,
          // Re-initialize options and correctAnswer for the new type
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
      return updated;
    });
  };

  /**
   * Handler 3: Manage the options array for multiple_choice questions.
   * Three sub-operations keep options array consistent:
   *  - handleOptionChange : update a single option's text by index.
   *  - handleAddOption    : append a blank option (capped at 6 = OPTION_LETTERS.length).
   *  - handleRemoveOption : remove an option; if the correct answer pointed at or
   *                         beyond the removed index, reset correctAnswer to 0
   *                         to avoid an out-of-bounds index.
   */
  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    setQuestions(prev => {
      const updated = [...prev];
      if (updated[qIndex].options) {
        updated[qIndex] = { ...updated[qIndex], options: [...updated[qIndex].options!] };
        updated[qIndex].options![oIndex] = value;
      }
      return updated;
    });
  };

  const handleAddOption = (qIndex: number) => {
    setQuestions(prev => {
      const updated = [...prev];
      if (updated[qIndex].options && updated[qIndex].options!.length < 6) {
        updated[qIndex] = { ...updated[qIndex], options: [...updated[qIndex].options!, ''] };
      }
      return updated;
    });
  };

  const handleRemoveOption = (qIndex: number, oIndex: number) => {
    setQuestions(prev => {
      const updated = [...prev];
      if (updated[qIndex].options && updated[qIndex].options!.length > 2) {
        const newOpts = updated[qIndex].options!.filter((_, i) => i !== oIndex);
        let newCorrect = updated[qIndex].correctAnswer;
        // If the removed option was at or after the correct answer index, reset to 0
        if (typeof newCorrect === 'number' && newCorrect >= newOpts.length) {
          newCorrect = 0;
        }
        updated[qIndex] = { ...updated[qIndex], options: newOpts, correctAnswer: newCorrect };
      }
      return updated;
    });
  };

  // ─── Form submission ───────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Client-side validation before calling onSave
    if (!title.trim()) { setError('Vui lòng nhập tiêu đề'); return; }
    if (questions.length === 0) { setError('Vui lòng thêm ít nhất một câu hỏi'); return; }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) { setError(`Câu hỏi ${i + 1} chưa có nội dung`); return; }
      if (q.questionType === 'multiple_choice' && q.options) {
        if (q.options.filter(o => o.trim()).length < 2) { setError(`Câu hỏi ${i + 1} cần ít nhất 2 đáp án`); return; }
      }
    }
    // Assignments require a deadline; tests use a time limit instead
    if (!isTest && !deadline) { setError('Vui lòng chọn hạn nộp bài'); return; }

    setSaving(true);
    setError('');
    const data: TestFormData = {
      title: title.trim(),
      type: testType,
      questions,
      timeLimit: isTest ? timeLimit : undefined,
      deadline: !isTest ? deadline : undefined,
    };
    const success = await onSave(data);
    if (success) onClose(); else setError('Lỗi khi lưu');
    setSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className="tcm-overlay" onClick={onClose}>
      {/* Stop propagation so clicking inside the modal doesn't close it */}
      <div className="tcm-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="tcm-header">
          <div className="tcm-header-left">
            <div className={`tcm-header-icon ${isTest ? 'test' : 'assign'}`}>
              {isTest ? <FileQuestion size={20} /> : <CalendarClock size={20} />}
            </div>
            <div>
              <h2 className="tcm-title">{isTest ? 'Tạo bài kiểm tra' : 'Tạo bài tập'}</h2>
              <p className="tcm-subtitle">{isTest ? 'Kiểm tra kiến thức học viên' : 'Giao bài về nhà cho học viên'}</p>
            </div>
          </div>
          <button className="tcm-close" onClick={onClose} aria-label="Đóng"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="tcm-body">
            {error && <div className="tcm-error">{error}</div>}

            {/* Title + settings row — shows time-limit for tests, deadline for assignments */}
            <div className="tcm-settings-grid">
              <div className="tcm-field tcm-field-title">
                <label className="tcm-label">Tiêu đề</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={isTest ? 'VD: Kiểm tra từ vựng N5' : 'VD: Bài tập ngữ pháp tuần 3'}
                  className="tcm-input"
                  autoFocus
                />
              </div>
              {isTest ? (
                <div className="tcm-field tcm-field-small">
                  <label className="tcm-label"><Clock size={13} /> Thời gian (phút)</label>
                  <input
                    type="number"
                    value={timeLimit}
                    onChange={e => setTimeLimit(parseInt(e.target.value) || 30)}
                    min={5} max={180}
                    className="tcm-input"
                  />
                </div>
              ) : (
                <div className="tcm-field tcm-field-small">
                  <label className="tcm-label"><CalendarClock size={13} /> Hạn nộp</label>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className="tcm-input"
                    // Prevent selecting a past deadline
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              )}
            </div>

            {/* Questions section */}
            <div className="tcm-questions">
              <div className="tcm-questions-header">
                <div className="tcm-questions-title">
                  <FileQuestion size={16} />
                  <span>Câu hỏi</span>
                  <span className="tcm-badge">{questions.length}</span>
                </div>
              </div>

              {/* Question list — empty state or list of expandable cards */}
              {questions.length === 0 ? (
                <div className="tcm-empty">
                  <Sparkles size={32} />
                  <p>Chưa có câu hỏi nào</p>
                  <span>Chọn loại câu hỏi bên dưới để bắt đầu</span>
                </div>
              ) : (
                <div className="tcm-q-list">
                  {questions.map((q, qIdx) => {
                    const isExpanded = expandedQ === q.id;
                    const qType = QUESTION_TYPES.find(t => t.value === q.questionType)!;
                    const QIcon = qType.icon;

                    return (
                      /*
                       * Expandable question card pattern:
                       * - Collapsed view: shows question number, type pill, preview text,
                       *   points and a delete button. Clicking the header toggles expansion.
                       * - Expanded view: full editor with type chips, points input, question
                       *   textarea, and the answer section specific to the question type.
                       * Only one card is open at a time (controlled by expandedQ state).
                       */
                      <div key={q.id} className={`tcm-q-card ${isExpanded ? 'expanded' : ''}`}>
                        {/* Question card header — click or keyboard to expand/collapse */}
                        <div className="tcm-q-head" onClick={() => setExpandedQ(isExpanded ? null : q.id)} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setExpandedQ(isExpanded ? null : q.id)} role="button" tabIndex={0} aria-expanded={isExpanded}>
                          <GripVertical size={14} className="tcm-q-grip" />
                          <span className="tcm-q-num">{qIdx + 1}</span>
                          <div className="tcm-q-type-pill">
                            <QIcon size={12} />
                            <span>{qType.label}</span>
                          </div>
                          {/* Preview of the question text in collapsed mode */}
                          <span className="tcm-q-preview">
                            {q.question || <em>Chưa nhập nội dung...</em>}
                          </span>
                          <span className="tcm-q-points">{q.points}đ</span>
                          {/* stopPropagation prevents the delete click from toggling expand */}
                          <button type="button" className="tcm-q-del" onClick={e => { e.stopPropagation(); handleRemoveQuestion(qIdx); }} aria-label={`Xóa câu ${qIdx + 1}`}>
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Expanded editor — conditionally rendered */}
                        {isExpanded && (
                          <div className="tcm-q-editor">
                            {/* Type selector + points row */}
                            <div className="tcm-q-row">
                              {/* Type chips — switching type resets options and correctAnswer */}
                              <div className="tcm-q-type-chips">
                                {QUESTION_TYPES.map(t => {
                                  const TIcon = t.icon;
                                  return (
                                    <button
                                      key={t.value}
                                      type="button"
                                      className={`tcm-chip ${q.questionType === t.value ? 'active' : ''}`}
                                      onClick={() => handleQuestionChange(qIdx, 'questionType', t.value)}
                                    >
                                      <TIcon size={13} />
                                      {t.label}
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="tcm-q-points-edit">
                                <Award size={13} />
                                <input
                                  type="number"
                                  value={q.points}
                                  onChange={e => handleQuestionChange(qIdx, 'points', parseInt(e.target.value) || 10)}
                                  min={1} max={100}
                                  className="tcm-input tcm-input-mini"
                                />
                                <span>điểm</span>
                              </div>
                            </div>

                            {/* Question text input */}
                            <textarea
                              value={q.question}
                              onChange={e => handleQuestionChange(qIdx, 'question', e.target.value)}
                              placeholder="Nhập nội dung câu hỏi..."
                              className="tcm-textarea"
                              rows={2}
                            />

                            {/* ─── Multiple choice options ───────────────────────────
                                Each option row contains:
                                  - A letter button (A/B/C…) that, when clicked, marks
                                    this option as the correct answer (index stored as number).
                                  - A text input for the option label.
                                  - A remove button (hidden when only 2 options remain).
                                The add-option button appears when fewer than 6 options exist. */}
                            {q.questionType === 'multiple_choice' && q.options && (
                              <div className="tcm-options">
                                {q.options.map((opt, oIdx) => (
                                  <div key={oIdx} className={`tcm-opt ${q.correctAnswer === oIdx ? 'correct' : ''}`}>
                                    {/* Clicking the letter button selects this as the correct answer */}
                                    <button
                                      type="button"
                                      className={`tcm-opt-radio ${q.correctAnswer === oIdx ? 'selected' : ''}`}
                                      onClick={() => handleQuestionChange(qIdx, 'correctAnswer', oIdx)}
                                      aria-label={`Chọn ${OPTION_LETTERS[oIdx]} là đáp án đúng`}
                                    >
                                      {OPTION_LETTERS[oIdx]}
                                    </button>
                                    <input
                                      type="text"
                                      value={opt}
                                      onChange={e => handleOptionChange(qIdx, oIdx, e.target.value)}
                                      placeholder={`Đáp án ${OPTION_LETTERS[oIdx]}`}
                                      className="tcm-input tcm-opt-input"
                                    />
                                    {/* Remove button only shown when > 2 options (minimum required) */}
                                    {q.options!.length > 2 && (
                                      <button type="button" className="tcm-opt-del" onClick={() => handleRemoveOption(qIdx, oIdx)}>
                                        <X size={14} />
                                      </button>
                                    )}
                                  </div>
                                ))}
                                {q.options.length < 6 && (
                                  <button type="button" className="tcm-add-opt" onClick={() => handleAddOption(qIdx)}>
                                    <Plus size={13} /> Thêm đáp án
                                  </button>
                                )}
                              </div>
                            )}

                            {/* ─── True/False answer selector ───────────────────────
                                Fixed two-button toggle; correctAnswer stores 0 (Đúng) or 1 (Sai). */}
                            {q.questionType === 'true_false' && (
                              <div className="tcm-tf">
                                {['Đúng', 'Sai'].map((label, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    className={`tcm-tf-btn ${q.correctAnswer === idx ? 'selected' : ''} ${idx === 0 ? 'true' : 'false'}`}
                                    onClick={() => handleQuestionChange(qIdx, 'correctAnswer', idx)}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* ─── Text answer hint ─────────────────────────────────
                                Open-ended questions store a sample answer string.
                                This is optional — used as a grading reference only,
                                not shown to students and not auto-graded. */}
                            {q.questionType === 'text' && (
                              <input
                                type="text"
                                value={q.correctAnswer as string || ''}
                                onChange={e => handleQuestionChange(qIdx, 'correctAnswer', e.target.value)}
                                placeholder="Đáp án mẫu (tùy chọn — tham khảo khi chấm)"
                                className="tcm-input tcm-text-hint"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add question buttons — one per question type */}
              <div className="tcm-add-row">
                {QUESTION_TYPES.map(t => {
                  const TIcon = t.icon;
                  return (
                    <button key={t.value} type="button" className="tcm-add-btn" onClick={() => handleAddQuestion(t.value)}>
                      <TIcon size={16} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer — question count + total points stats, plus cancel/save actions */}
          <div className="tcm-footer">
            {questions.length > 0 && (
              <div className="tcm-stats">
                <span className="tcm-stat"><FileQuestion size={13} /> {questions.length} câu</span>
                <span className="tcm-stat"><Award size={13} /> {totalPoints} điểm</span>
              </div>
            )}
            <div className="tcm-actions">
              <button type="button" className="tcm-btn-cancel" onClick={onClose}>Hủy</button>
              {/* Always saves as draft — publishing is done from the classroom view */}
              <button type="submit" className="tcm-btn-save" disabled={saving}>
                <Save size={15} />
                {saving ? 'Đang lưu...' : 'Lưu (Nháp)'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
