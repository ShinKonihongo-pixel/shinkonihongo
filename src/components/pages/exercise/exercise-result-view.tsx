// Exercise Result View Component

import { Trophy, RotateCcw, BookOpen, Clock, CheckCircle2, XCircle } from 'lucide-react';
import type { Exercise, ExerciseSession } from '../../../types/exercise';
import { EXERCISE_TYPE_ICONS } from '../../../types/exercise';
import { LEVEL_THEMES } from '../../ui/jlpt-level-selector';
import { getExerciseLevels, getScoreGrade } from './exercise-utils';

interface ExerciseResultViewProps {
  session: ExerciseSession;
  currentExercise: Exercise;
  score: { correct: number; total: number; percentage: number };
  onRestart: () => void;
  onGoToList: () => void;
}

export function ExerciseResultView({
  session,
  currentExercise,
  score,
  onRestart,
  onGoToList,
}: ExerciseResultViewProps) {
  const grade = getScoreGrade(score.percentage);
  const levels = getExerciseLevels(currentExercise);
  const primaryLevel = levels[0] || 'N5';
  const theme = LEVEL_THEMES[primaryLevel];

  return (
    <div className="exercise-result-premium">
      <div className="result-card">
        <div className="result-glow" style={{ background: grade.color }} />

        <div className="result-header">
          <Trophy size={56} style={{ color: grade.color }} />
          <h2>Hoàn thành!</h2>
          <p className="result-name">{currentExercise.name}</p>
        </div>

        <div className="score-section">
          <div className="score-ring" style={{ '--score-color': grade.color, '--progress': `${score.percentage * 2.83}` } as React.CSSProperties}>
            <svg viewBox="0 0 100 100">
              <circle className="ring-bg" cx="50" cy="50" r="45" />
              <circle className="ring-fill" cx="50" cy="50" r="45" />
            </svg>
            <div className="score-content">
              <span className="grade" style={{ color: grade.color }}>{grade.grade}</span>
              <span className="percent">{score.percentage}%</span>
            </div>
          </div>
          <p className="grade-label" style={{ color: grade.color }}>{grade.label}</p>
          <p className="score-detail">{score.correct} / {score.total} câu đúng</p>
        </div>

        <div className="result-actions">
          <button className="action-btn primary" style={{ background: theme.gradient }} onClick={onRestart}>
            <RotateCcw size={18} /> Làm lại
          </button>
          <button className="action-btn secondary" onClick={onGoToList}>
            <BookOpen size={18} /> Bài khác
          </button>
        </div>

        <div className="review-section">
          <h4><Clock size={16} /> Xem lại đáp án</h4>
          <div className="review-list">
            {session.questions.map((q, idx) => {
              const userAnswer = session.answers[idx];
              let correct = false;
              if (q.type === 'listening_write') {
                correct = typeof userAnswer === 'string' &&
                  userAnswer.toLowerCase().trim() === q.correctAnswer?.toLowerCase().trim();
              } else {
                correct = userAnswer === q.correctIndex;
              }

              return (
                <div key={q.id} className={`review-item ${correct ? 'correct' : 'wrong'}`}>
                  <span className="num">{idx + 1}</span>
                  <span className="type">{EXERCISE_TYPE_ICONS[q.type]}</span>
                  <span className="word">{q.kanji ? `${q.vocabulary} (${q.kanji})` : q.vocabulary}</span>
                  <span className="meaning">{q.meaning}</span>
                  <span className="status">{correct ? <CheckCircle2 size={16} /> : <XCircle size={16} />}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
