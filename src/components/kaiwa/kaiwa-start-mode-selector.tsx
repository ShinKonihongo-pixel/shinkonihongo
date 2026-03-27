// Session mode selector (default vs advanced) for kaiwa-start-screen

import { MessagesSquare, Star } from 'lucide-react';
import type { KaiwaDefaultQuestion } from '../../types/kaiwa-question';
import type { KaiwaAdvancedTopic, KaiwaAdvancedQuestion } from '../../types/kaiwa-advanced';
import type { SessionMode, QuestionSelectorState } from './kaiwa-start-screen-types';

interface KaiwaStartModeSelectorProps {
  sessionMode: SessionMode;
  onSessionModeChange: (mode: SessionMode) => void;
  onSelectAdvancedTopic: (topic: KaiwaAdvancedTopic | null) => void;
  onSelectAdvancedQuestion: (question: KaiwaAdvancedQuestion | null) => void;
  onSelectDefaultQuestion: (question: KaiwaDefaultQuestion | null) => void;
  onQuestionSelectorStateChange: (state: QuestionSelectorState) => void;
}

export function KaiwaStartModeSelector({
  sessionMode,
  onSessionModeChange,
  onSelectAdvancedTopic,
  onSelectAdvancedQuestion,
  onSelectDefaultQuestion,
  onQuestionSelectorStateChange,
}: KaiwaStartModeSelectorProps) {
  return (
    <div className="kaiwa-session-mode-selector">
      <button
        className={`session-mode-btn ${sessionMode === 'default' ? 'active' : ''}`}
        onClick={() => {
          onSessionModeChange('default');
          onSelectAdvancedTopic(null);
          onSelectAdvancedQuestion(null);
        }}
      >
        <MessagesSquare size={18} />
        <span>Hội thoại cơ bản</span>
      </button>
      <button
        className={`session-mode-btn ${sessionMode === 'advanced' ? 'active' : ''}`}
        onClick={() => {
          onSessionModeChange('advanced');
          onSelectDefaultQuestion(null);
          onQuestionSelectorStateChange({ type: 'hidden' });
        }}
      >
        <Star size={18} />
        <span>Session nâng cao</span>
      </button>
    </div>
  );
}
