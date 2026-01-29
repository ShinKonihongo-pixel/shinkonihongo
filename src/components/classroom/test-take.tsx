// Test taking component with timer

import { useState, useEffect, useCallback } from 'react';
import type { ClassroomTest, ClassroomSubmission, SubmissionAnswer } from '../../types/classroom';
import { ANSWER_OPTIONS } from '../../constants/answer-options';

interface TestTakeProps {
  test: ClassroomTest;
  submission: ClassroomSubmission;
  onSubmit: (answers: SubmissionAnswer[], timeSpent: number) => Promise<boolean>;
  onCancel: () => void;
}

export function TestTake({ test, submission, onSubmit, onCancel }: TestTakeProps) {
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(
    test.timeLimit ? test.timeLimit * 60 : 0 // Convert to seconds
  );
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Calculate time spent from when submission started
  const startTime = new Date(submission.startedAt).getTime();

  // Timer effect for tests
  useEffect(() => {
    if (!test.timeLimit || test.type !== 'test') return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Auto-submit when time runs out
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [test.timeLimit, test.type]);

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle answer change
  const handleAnswerChange = (questionId: string, answer: string | number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  // Handle submit
  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (submitting) return;

    if (!autoSubmit && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    setSubmitting(true);
    setShowConfirm(false);

    const timeSpent = Math.floor((Date.now() - startTime) / 1000); // In seconds

    // Build submission answers
    const submissionAnswers: SubmissionAnswer[] = test.questions.map(q => {
      const userAnswer = answers[q.id];
      let isCorrect: boolean | undefined;
      let pointsEarned = 0;

      // Auto-grade for multiple choice and true/false
      if (q.questionType === 'multiple_choice' || q.questionType === 'true_false') {
        isCorrect = userAnswer === q.correctAnswer;
        pointsEarned = isCorrect ? q.points : 0;
      }
      // Text questions need manual grading
      // Leave isCorrect and pointsEarned undefined

      return {
        questionId: q.id,
        answer: userAnswer ?? '',
        isCorrect,
        pointsEarned,
      };
    });

    await onSubmit(submissionAnswers, timeSpent);
    setSubmitting(false);
  }, [answers, submitting, showConfirm, startTime, test.questions, onSubmit]);

  // Count answered questions
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = test.questions.length;

  // Get current question
  const question = test.questions[currentQuestion];

  // Calculate progress percentage
  const progress = (answeredCount / totalQuestions) * 100;

  // Time warning (under 5 minutes)
  const timeWarning = test.type === 'test' && timeLeft < 300;
  const timeCritical = test.type === 'test' && timeLeft < 60;

  return (
    <div className="test-take">
      {/* Header with timer */}
      <div className="test-take-header">
        <div className="test-title">{test.title}</div>
        {test.type === 'test' && test.timeLimit && (
          <div className={`test-timer ${timeWarning ? 'warning' : ''} ${timeCritical ? 'critical' : ''}`}>
            ⏱️ {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="test-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="progress-text">{answeredCount}/{totalQuestions} câu</span>
      </div>

      {/* Question navigation */}
      <div className="question-nav">
        {test.questions.map((q, idx) => (
          <button
            key={q.id}
            className={`question-nav-btn ${idx === currentQuestion ? 'current' : ''} ${answers[q.id] !== undefined ? 'answered' : ''}`}
            onClick={() => setCurrentQuestion(idx)}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      {/* Question content */}
      {question && (
        <div className="question-content">
          <div className="question-header">
            <span className="question-number">Câu {currentQuestion + 1}</span>
            <span className="question-points">{question.points} điểm</span>
          </div>

          <div className="question-text">{question.question}</div>

          {/* Multiple choice options */}
          {question.questionType === 'multiple_choice' && question.options && (
            <div className="answer-options">
              {question.options.map((opt, idx) => (
                <label
                  key={idx}
                  className={`answer-option ${answers[question.id] === idx ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name={question.id}
                    checked={answers[question.id] === idx}
                    onChange={() => handleAnswerChange(question.id, idx)}
                  />
                  <img src={ANSWER_OPTIONS[idx].icon} alt={ANSWER_OPTIONS[idx].label} className="option-icon-img" />
                  <span className="option-text">{opt}</span>
                </label>
              ))}
            </div>
          )}

          {/* True/False options */}
          {question.questionType === 'true_false' && (
            <div className="answer-options true-false">
              <label className={`answer-option ${answers[question.id] === 0 ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name={question.id}
                  checked={answers[question.id] === 0}
                  onChange={() => handleAnswerChange(question.id, 0)}
                />
                <span className="option-text">Đúng</span>
              </label>
              <label className={`answer-option ${answers[question.id] === 1 ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name={question.id}
                  checked={answers[question.id] === 1}
                  onChange={() => handleAnswerChange(question.id, 1)}
                />
                <span className="option-text">Sai</span>
              </label>
            </div>
          )}

          {/* Text answer */}
          {question.questionType === 'text' && (
            <div className="answer-text">
              <textarea
                value={(answers[question.id] as string) || ''}
                onChange={e => handleAnswerChange(question.id, e.target.value)}
                placeholder="Nhập câu trả lời của bạn..."
                className="form-textarea"
                rows={4}
              />
            </div>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="test-take-footer">
        <div className="nav-buttons">
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
          >
            ← Câu trước
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentQuestion(prev => Math.min(totalQuestions - 1, prev + 1))}
            disabled={currentQuestion === totalQuestions - 1}
          >
            Câu sau →
          </button>
        </div>

        <div className="action-buttons">
          <button
            className="btn btn-danger"
            onClick={onCancel}
          >
            Hủy bỏ
          </button>
          <button
            className="btn btn-primary"
            onClick={() => handleSubmit()}
            disabled={submitting}
          >
            {submitting ? 'Đang nộp...' : 'Nộp bài'}
          </button>
        </div>
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal-content confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>Xác nhận nộp bài</h3>
            <p>
              Bạn đã trả lời {answeredCount}/{totalQuestions} câu hỏi.
              {answeredCount < totalQuestions && (
                <span className="warning-text"> Còn {totalQuestions - answeredCount} câu chưa trả lời!</span>
              )}
            </p>
            <p>Bạn có chắc muốn nộp bài?</p>
            <div className="confirm-buttons">
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>
                Tiếp tục làm
              </button>
              <button className="btn btn-primary" onClick={() => handleSubmit(true)}>
                Nộp bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
