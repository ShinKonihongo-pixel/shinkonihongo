// Submission review component - for viewing results and grading

import { useState } from 'react';
import type { ClassroomTest, ClassroomSubmission, SubmissionAnswer } from '../../types/classroom';
import { ANSWER_OPTIONS } from '../../constants/answer-options';

interface SubmissionReviewProps {
  test: ClassroomTest;
  submission: ClassroomSubmission;
  isAdmin: boolean;
  onGrade?: (answers: SubmissionAnswer[], feedback: string) => Promise<boolean>;
  onClose: () => void;
}

export function SubmissionReview({
  test,
  submission,
  isAdmin,
  onGrade,
  onClose,
}: SubmissionReviewProps) {
  const [gradedAnswers, setGradedAnswers] = useState<SubmissionAnswer[]>(submission.answers);
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [saving, setSaving] = useState(false);

  // Check if there are text questions that need grading
  const hasTextQuestions = test.questions.some(q => q.questionType === 'text');
  const needsGrading = hasTextQuestions && submission.submittedAt && !submission.gradedBy;

  // Handle point change for text questions
  const handlePointsChange = (questionId: string, points: number) => {
    setGradedAnswers(prev =>
      prev.map(a =>
        a.questionId === questionId
          ? { ...a, pointsEarned: points, isCorrect: points > 0 }
          : a
      )
    );
  };

  // Handle grade submission
  const handleGrade = async () => {
    if (!onGrade) return;
    setSaving(true);
    await onGrade(gradedAnswers, feedback);
    setSaving(false);
  };

  // Calculate score
  const totalScore = gradedAnswers.reduce((sum, a) => sum + (a.pointsEarned || 0), 0);
  const percentage = test.totalPoints > 0 ? (totalScore / test.totalPoints) * 100 : 0;

  // Format time spent
  const formatTimeSpent = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} phút ${secs} giây`;
  };

  return (
    <div className="submission-review">
      <div className="review-header">
        <h2>{test.title}</h2>
        <button className="btn-close" onClick={onClose}>×</button>
      </div>

      {/* Summary */}
      <div className="review-summary">
        <div className="summary-item">
          <span className="summary-label">Điểm:</span>
          <span className={`summary-value ${percentage >= 50 ? 'pass' : 'fail'}`}>
            {totalScore}/{test.totalPoints} ({percentage.toFixed(1)}%)
          </span>
        </div>
        {submission.submittedAt && (
          <>
            <div className="summary-item">
              <span className="summary-label">Thời gian làm:</span>
              <span className="summary-value">{formatTimeSpent(submission.timeSpent)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Nộp lúc:</span>
              <span className="summary-value">
                {new Date(submission.submittedAt).toLocaleString('vi-VN')}
              </span>
            </div>
          </>
        )}
        {submission.gradedBy && (
          <div className="summary-item">
            <span className="summary-label">Đã chấm điểm</span>
          </div>
        )}
      </div>

      {/* Questions and answers */}
      <div className="review-questions">
        {test.questions.map((question, idx) => {
          const answer = gradedAnswers.find(a => a.questionId === question.id);
          const isCorrect = answer?.isCorrect;
          const isGraded = answer?.isCorrect !== undefined;

          return (
            <div key={question.id} className={`review-question ${isGraded ? (isCorrect ? 'correct' : 'incorrect') : 'ungraded'}`}>
              <div className="question-header">
                <span className="question-number">Câu {idx + 1}</span>
                <span className="question-points">
                  {answer?.pointsEarned ?? 0}/{question.points} điểm
                </span>
              </div>

              <div className="question-text">{question.question}</div>

              {/* Show options for multiple choice */}
              {question.questionType === 'multiple_choice' && question.options && (
                <div className="answer-display">
                  {question.options.map((opt, oIdx) => {
                    const isSelected = answer?.answer === oIdx;
                    const isCorrectOption = question.correctAnswer === oIdx;
                    return (
                      <div
                        key={oIdx}
                        className={`option-display ${isSelected ? 'selected' : ''} ${isCorrectOption ? 'correct' : ''}`}
                      >
                        <img src={ANSWER_OPTIONS[oIdx].icon} alt={ANSWER_OPTIONS[oIdx].label} className="option-icon-img" />
                        <span className="option-text">{opt}</span>
                        {isCorrectOption && <span className="correct-badge">✓</span>}
                        {isSelected && !isCorrectOption && <span className="wrong-badge">✗</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Show for true/false */}
              {question.questionType === 'true_false' && (
                <div className="answer-display true-false">
                  <div className={`option-display ${answer?.answer === 0 ? 'selected' : ''} ${question.correctAnswer === 0 ? 'correct' : ''}`}>
                    <span>Đúng</span>
                    {question.correctAnswer === 0 && <span className="correct-badge">✓</span>}
                    {answer?.answer === 0 && question.correctAnswer !== 0 && <span className="wrong-badge">✗</span>}
                  </div>
                  <div className={`option-display ${answer?.answer === 1 ? 'selected' : ''} ${question.correctAnswer === 1 ? 'correct' : ''}`}>
                    <span>Sai</span>
                    {question.correctAnswer === 1 && <span className="correct-badge">✓</span>}
                    {answer?.answer === 1 && question.correctAnswer !== 1 && <span className="wrong-badge">✗</span>}
                  </div>
                </div>
              )}

              {/* Show text answer */}
              {question.questionType === 'text' && (
                <div className="text-answer-display">
                  <div className="student-answer">
                    <label>Câu trả lời:</label>
                    <p>{answer?.answer || '(Không trả lời)'}</p>
                  </div>
                  {question.correctAnswer && (
                    <div className="sample-answer">
                      <label>Đáp án mẫu:</label>
                      <p>{question.correctAnswer}</p>
                    </div>
                  )}
                  {/* Grading input for admin */}
                  {isAdmin && needsGrading && (
                    <div className="grading-input">
                      <label>Chấm điểm:</label>
                      <input
                        type="number"
                        min={0}
                        max={question.points}
                        value={answer?.pointsEarned ?? 0}
                        onChange={e => handlePointsChange(question.id, parseInt(e.target.value) || 0)}
                        className="form-input points-input"
                      />
                      <span>/ {question.points} điểm</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Feedback section */}
      {(isAdmin || submission.feedback) && (
        <div className="feedback-section">
          <label>Nhận xét:</label>
          {isAdmin && needsGrading ? (
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Nhập nhận xét cho học viên..."
              className="form-textarea"
              rows={3}
            />
          ) : (
            <p className="feedback-display">{submission.feedback || 'Chưa có nhận xét'}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="review-footer">
        {isAdmin && needsGrading && onGrade ? (
          <>
            <button className="btn btn-secondary" onClick={onClose}>
              Đóng
            </button>
            <button
              className="btn btn-primary"
              onClick={handleGrade}
              disabled={saving}
            >
              {saving ? 'Đang lưu...' : 'Hoàn tất chấm điểm'}
            </button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={onClose}>
            Đóng
          </button>
        )}
      </div>
    </div>
  );
}
