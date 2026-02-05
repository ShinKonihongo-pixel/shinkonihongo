import { useRef } from 'react';
import { PracticeHeader } from './practice-header';
import { PinnedQuestion } from './pinned-question';
import { ContentPanel } from './content-panel';
import { QuestionPanel } from './question-panel';
import type { JLPTLevel } from '../../../types/flashcard';
import type { ReadingPassage } from '../../../types/reading';
import type { AudioState, ContentTab } from './types';

interface PracticeViewProps {
  selectedLevel: JLPTLevel;
  selectedPassage: ReadingPassage;
  currentQuestionIndex: number;
  selectedAnswers: Record<number, number>;
  showResults: boolean;
  isPinned: boolean;
  isQuestionCollapsed: boolean;
  isMobile: boolean;
  contentTab: ContentTab;
  audioState: AudioState;
  theme: { gradient: string; glow: string };
  settings: { fontSize: number; textColor?: string };
  onGoBack: () => void;
  onOpenSettings: () => void;
  onSetPinned: (pinned: boolean) => void;
  onSetQuestionCollapsed: (collapsed: boolean) => void;
  onSetCurrentQuestion: (index: number) => void;
  onSetShowResults: (show: boolean) => void;
  onSetContentTab: (tab: ContentTab) => void;
  onSelectAnswer: (index: number) => void;
  onShowResult: () => void;
  onNext: () => void;
  onAudioToggle: (text: string) => void;
  onPauseSpeaking: () => void;
  onResumeSpeaking: () => void;
}

export function PracticeView({
  selectedLevel,
  selectedPassage,
  currentQuestionIndex,
  selectedAnswers,
  showResults,
  isPinned,
  isQuestionCollapsed,
  isMobile,
  contentTab,
  audioState,
  theme,
  settings,
  onGoBack,
  onOpenSettings,
  onSetPinned,
  onSetQuestionCollapsed,
  onSetCurrentQuestion,
  onSetShowResults,
  onSetContentTab,
  onSelectAnswer,
  onShowResult,
  onNext,
  onAudioToggle,
  onPauseSpeaking,
  onResumeSpeaking,
}: PracticeViewProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const currentQuestion = selectedPassage.questions[currentQuestionIndex];
  const selectedAnswer = selectedAnswers[currentQuestionIndex];

  return (
    <div className="practice-mode">
      <PracticeHeader
        selectedLevel={selectedLevel}
        selectedPassage={selectedPassage}
        selectedAnswers={selectedAnswers}
        theme={theme}
        onGoBack={onGoBack}
        onOpenSettings={onOpenSettings}
      />

      {isMobile && isPinned && (
        <PinnedQuestion
          currentQuestion={currentQuestion}
          currentQuestionIndex={currentQuestionIndex}
          selectedAnswer={selectedAnswer}
          showResults={showResults}
          isCollapsed={isQuestionCollapsed}
          onToggleCollapse={() => onSetQuestionCollapsed(!isQuestionCollapsed)}
          onUnpin={() => onSetPinned(false)}
          onSelectAnswer={onSelectAnswer}
          onShowResult={onShowResult}
          onNext={onNext}
          isLastQuestion={currentQuestionIndex >= selectedPassage.questions.length - 1}
        />
      )}

      <div className={`split-layout ${isMobile && isPinned ? 'with-pinned' : ''}`}>
        <ContentPanel
          ref={contentRef}
          selectedPassage={selectedPassage}
          contentTab={contentTab}
          audioState={audioState}
          settings={settings}
          onTabChange={onSetContentTab}
          onAudioToggle={onAudioToggle}
          onPauseSpeaking={onPauseSpeaking}
          onResumeSpeaking={onResumeSpeaking}
        />

        <QuestionPanel
          selectedPassage={selectedPassage}
          currentQuestion={currentQuestion}
          currentQuestionIndex={currentQuestionIndex}
          selectedAnswer={selectedAnswer}
          selectedAnswers={selectedAnswers}
          showResults={showResults}
          isMobile={isMobile}
          isPinned={isPinned}
          theme={theme}
          settings={settings}
          onSetCurrentQuestion={onSetCurrentQuestion}
          onSetShowResults={onSetShowResults}
          onSetPinned={onSetPinned}
          onSelectAnswer={onSelectAnswer}
          onShowResult={onShowResult}
          onNext={onNext}
        />
      </div>
    </div>
  );
}
