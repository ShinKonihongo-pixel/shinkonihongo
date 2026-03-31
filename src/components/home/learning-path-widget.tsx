// Learning path widget — shows next step in guided curriculum

import {
  BookOpen,
  FileText,
  BookOpenCheck,
  Headphones,
  ClipboardList,
  Gamepad2,
  Award,
  ChevronRight,
  SkipForward,
  Check,
  type LucideIcon,
} from 'lucide-react';
import type { PathStep } from '../../data/learning-path';
import { STEP_TYPE_INFO } from '../../data/learning-path';
import { LevelBadge } from '../ui/level-badge';
import './learning-path-widget.css';

const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  FileText,
  BookOpenCheck,
  Headphones,
  ClipboardList,
  Gamepad2,
  Award,
};

interface LearningPathWidgetProps {
  level: string;
  currentStep: PathStep | null;
  currentStepIndex: number;
  totalSteps: number;
  completedCount: number;
  progressPercent: number;
  onNavigate: (page: string) => void;
  onComplete: () => void;
  onSkip: () => void;
  isStepCompleted: (id: string) => boolean;
  steps: PathStep[];
}

export function LearningPathWidget({
  level,
  currentStep,
  currentStepIndex,
  totalSteps,
  completedCount,
  progressPercent,
  onNavigate,
  onComplete,
  onSkip,
  isStepCompleted,
  steps,
}: LearningPathWidgetProps) {
  if (!currentStep) return null;

  // Show current + next 2 steps
  const upcomingSteps = steps.slice(currentStepIndex, currentStepIndex + 3);

  return (
    <div className="lp-widget">
      <div className="lp-header">
        <div className="lp-header-left">
          <LevelBadge level={level} size="xs" />
          <span className="lp-title">Lộ Trình Học</span>
        </div>
        <span className="lp-progress-text">{completedCount}/{totalSteps}</span>
      </div>

      {/* Progress bar */}
      <div className="lp-progress-bar">
        <div className="lp-progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Step list */}
      <div className="lp-steps">
        {upcomingSteps.map((step, i) => {
          const info = STEP_TYPE_INFO[step.type];
          const StepIcon = ICON_MAP[info.icon] || BookOpen;
          const isCurrent = i === 0 && !isStepCompleted(step.id);
          const isDone = isStepCompleted(step.id);

          return (
            <button
              key={step.id}
              className={`lp-step ${isCurrent ? 'current' : ''} ${isDone ? 'done' : ''}`}
              onClick={() => {
                if (isCurrent) {
                  onNavigate(step.page);
                  onComplete();
                }
              }}
              disabled={!isCurrent}
            >
              <div className="lp-step-icon" style={{ backgroundColor: isDone ? '#22c55e' : info.color }}>
                {isDone ? <Check size={14} /> : <StepIcon size={14} />}
              </div>
              <div className="lp-step-info">
                <span className="lp-step-title">{step.title}</span>
                <span className="lp-step-desc">{step.description}</span>
              </div>
              {isCurrent && (
                <div className="lp-step-actions">
                  <span className="lp-step-time">{step.estimatedMinutes}p</span>
                  <ChevronRight size={16} className="lp-step-arrow" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Skip button */}
      <button className="lp-skip" onClick={onSkip}>
        <SkipForward size={12} />
        Bỏ qua bước này
      </button>

    </div>
  );
}
