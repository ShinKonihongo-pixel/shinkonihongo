// Exercise List View Component

import { ArrowLeft, Play, Clock, BookOpen, Zap } from 'lucide-react';
import type { Exercise } from '../../../types/exercise';
import type { JLPTLevel } from '../../../types/flashcard';
import { EXERCISE_TYPE_LABELS, EXERCISE_TYPE_ICONS } from '../../../types/exercise';
import { LEVEL_THEMES, JLPT_LEVELS } from '../../ui/jlpt-level-selector';
import { getExerciseTypes, getExerciseLevels, getExerciseQuestionCount } from './exercise-utils';

interface ExerciseListViewProps {
  selectedLevel: JLPTLevel;
  filteredExercises: Exercise[];
  countByLevel: Record<JLPTLevel, number>;
  onStartExercise: (exercise: Exercise) => void;
  onGoBack: () => void;
}

export function ExerciseListView({
  selectedLevel,
  filteredExercises,
  countByLevel,
  onStartExercise,
  onGoBack,
}: ExerciseListViewProps) {
  const levelTheme = LEVEL_THEMES[selectedLevel];

  return (
    <div className="exercise-page-premium">
      {/* Premium Header with Back Button */}
      <div className="premium-header with-back">
        <div className="header-content">
          <button className="btn-back" onClick={onGoBack}>
            <ArrowLeft size={20} />
          </button>
          <span className="level-badge" style={{ background: levelTheme.gradient }}>
            {selectedLevel}
          </span>
          <div className="header-text">
            <h1>Bài Tập</h1>
            <p>{filteredExercises.length} bài tập</p>
          </div>
        </div>
      </div>

      {/* Removed level filters since we now select level first */}
      <div className="level-filters" style={{ display: 'none' }}>
        {JLPT_LEVELS.map(level => {
          const theme = LEVEL_THEMES[level];
          return (
            <button
              key={level}
              className={`filter-chip ${selectedLevel === level ? 'active' : ''}`}
              disabled={countByLevel[level] === 0}
              style={selectedLevel === level ? { background: theme.gradient } : undefined}
            >
              <span>{level}</span>
              <span className="chip-count">{countByLevel[level]}</span>
            </button>
          );
        })}
      </div>

      {/* Exercise Grid */}
      {filteredExercises.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><BookOpen size={56} strokeWidth={1} /></div>
          <h3>Chưa có bài tập</h3>
          <p>Các bài tập sẽ xuất hiện ở đây sau khi được tạo</p>
        </div>
      ) : (
        <div className="exercise-grid">
          {filteredExercises.map((exercise, idx) => {
            const types = getExerciseTypes(exercise);
            const levels = getExerciseLevels(exercise);
            const totalQ = getExerciseQuestionCount(exercise);
            const primaryLevel = levels[0] || 'N5';
            const theme = LEVEL_THEMES[primaryLevel];

            return (
              <article
                key={exercise.id}
                className="exercise-card"
                onClick={() => onStartExercise(exercise)}
                style={{ '--card-delay': `${idx * 0.05}s`, '--level-gradient': theme.gradient, '--level-glow': theme.glow } as React.CSSProperties}
              >
                <div className="card-top">
                  <div className="card-levels">
                    {levels.map(l => (
                      <span key={l} className="level-badge" style={{ background: LEVEL_THEMES[l].gradient }}>
                        {l}
                      </span>
                    ))}
                  </div>
                  <div className="card-types">
                    {types.slice(0, 3).map(t => (
                      <span key={t} className="type-icon" title={EXERCISE_TYPE_LABELS[t]}>
                        {EXERCISE_TYPE_ICONS[t]}
                      </span>
                    ))}
                    {types.length > 3 && <span className="type-more">+{types.length - 3}</span>}
                  </div>
                </div>

                <h3 className="card-title">{exercise.name}</h3>
                {exercise.description && <p className="card-desc">{exercise.description}</p>}

                <div className="card-meta">
                  <span className="meta-item"><Zap size={14} /> {totalQ} câu</span>
                  {exercise.timePerQuestion && (
                    <span className="meta-item"><Clock size={14} /> {exercise.timePerQuestion}s</span>
                  )}
                </div>

                <div className="card-type-tags">
                  {types.map(t => (
                    <span key={t} className="type-tag">{EXERCISE_TYPE_LABELS[t]}</span>
                  ))}
                </div>

                <button className="card-btn" style={{ background: theme.gradient }}>
                  <Play size={16} /> Bắt đầu
                </button>

                <div className="card-shine" />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
