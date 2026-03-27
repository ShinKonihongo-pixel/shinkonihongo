// Mode selection cards for kaiwa setup view

import { MessagesSquare, Mic, Sparkles, BookOpen } from 'lucide-react';
import type { SessionMode } from './kaiwa-types';

interface KaiwaSetupModeCardsProps {
  sessionMode: SessionMode;
  advancedTopicsCount: number;
  customTopicsCount: number;
  setSessionMode: (mode: SessionMode) => void;
  setSelectedDefaultQuestion: (q: any) => void;
  setQuestionSelectorState: (state: any) => void;
  setSelectedAdvancedTopic: (t: any) => void;
  setSelectedAdvancedQuestion: (q: any) => void;
  setSelectedCustomTopic: (t: any) => void;
  setSelectedCustomQuestion: (q: any) => void;
}

export function KaiwaSetupModeCards({
  sessionMode,
  advancedTopicsCount,
  customTopicsCount,
  setSessionMode,
  setSelectedDefaultQuestion,
  setQuestionSelectorState,
  setSelectedAdvancedTopic,
  setSelectedAdvancedQuestion,
  setSelectedCustomTopic,
  setSelectedCustomQuestion,
}: KaiwaSetupModeCardsProps) {
  return (
    <div className="kaiwa-section">
      <div className="kaiwa-section-header">
        <div className="kaiwa-section-line" />
        <span className="kaiwa-section-label">
          <span className="kaiwa-step-badge">1</span>
          Chọn chế độ
        </span>
        <div className="kaiwa-section-line" />
      </div>

      <div className="kaiwa-mode-cards">
        <button
          className={`kaiwa-mode-card ${sessionMode === 'default' ? 'active' : ''}`}
          onClick={() => {
            setSessionMode('default');
            setSelectedAdvancedTopic(null);
            setSelectedAdvancedQuestion(null);
            setSelectedCustomTopic(null);
            setSelectedCustomQuestion(null);
          }}
        >
          <div className="mode-card-icon"><MessagesSquare size={22} /></div>
          <span className="mode-card-title">Hội thoại</span>
          <span className="mode-card-desc">Luyện giao tiếp tự nhiên</span>
        </button>
        <button
          className={`kaiwa-mode-card ${sessionMode === 'speaking' ? 'active' : ''}`}
          onClick={() => {
            setSessionMode('speaking');
            setSelectedDefaultQuestion(null);
            setQuestionSelectorState({ type: 'hidden' });
            setSelectedAdvancedTopic(null);
            setSelectedAdvancedQuestion(null);
            setSelectedCustomTopic(null);
            setSelectedCustomQuestion(null);
          }}
        >
          <div className="mode-card-icon"><Mic size={22} /></div>
          <span className="mode-card-title">Luyện nói</span>
          <span className="mode-card-desc">Luyện phát âm theo mẫu</span>
        </button>
        {advancedTopicsCount > 0 && (
          <button
            className={`kaiwa-mode-card ${sessionMode === 'advanced' ? 'active' : ''}`}
            onClick={() => {
              setSessionMode('advanced');
              setSelectedDefaultQuestion(null);
              setQuestionSelectorState({ type: 'hidden' });
              setSelectedCustomTopic(null);
              setSelectedCustomQuestion(null);
            }}
          >
            <div className="mode-card-icon"><Sparkles size={22} /></div>
            <span className="mode-card-title">Nâng cao</span>
            <span className="mode-card-desc">Chủ đề chuyên sâu</span>
          </button>
        )}
        {customTopicsCount > 0 && (
          <button
            className={`kaiwa-mode-card ${sessionMode === 'custom' ? 'active' : ''}`}
            onClick={() => {
              setSessionMode('custom');
              setSelectedDefaultQuestion(null);
              setQuestionSelectorState({ type: 'hidden' });
              setSelectedAdvancedTopic(null);
              setSelectedAdvancedQuestion(null);
            }}
          >
            <div className="mode-card-icon"><BookOpen size={22} /></div>
            <span className="mode-card-title">Mở rộng</span>
            <span className="mode-card-desc">Chủ đề tùy chỉnh</span>
          </button>
        )}
      </div>
    </div>
  );
}
