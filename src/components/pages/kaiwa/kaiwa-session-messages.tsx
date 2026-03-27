// Message list area with modals for kaiwa-session-view

import type { RefObject } from 'react';
import type { KaiwaMessage, JLPTLevel, PronunciationResult, SuggestedAnswer, KaiwaEvaluation } from '../../../types/kaiwa';
import type { AppSettings } from '../../../hooks/use-settings';
import { useSpeech } from '../../../hooks/use-speech';
import {
  KaiwaMessageItem,
  KaiwaPracticeModal,
  KaiwaReadingPracticeModal,
  KaiwaAnalysisModal,
  KaiwaEvaluationModal,
} from '../../kaiwa';
import { Zap } from 'lucide-react';

interface KaiwaSessionMessagesProps {
  messages: KaiwaMessage[];
  showFurigana: boolean;
  fontSize: number;
  speakingMessageId: string | null;
  speakingMode: 'normal' | 'slow' | null;
  isAiLoading: boolean;
  isPracticeMode: boolean;
  selectedSuggestion: SuggestedAnswer | null;
  pronunciationResult: PronunciationResult | null;
  autoSendCountdown: number | null;
  analysisText: string | null;
  analysisResult: string | null;
  isAnalyzing: boolean;
  showEvaluationModal: boolean;
  evaluation: KaiwaEvaluation | null;
  isEvaluating: boolean;
  showReadingPracticeModal: boolean;
  textToRead: string;
  level: JLPTLevel;
  messagesEndRef: RefObject<HTMLDivElement>;
  speech: ReturnType<typeof useSpeech>;
  settings: AppSettings;
  handleSpeak: (messageId: string, text: string, mode: 'normal' | 'slow') => void;
  handleAnalyze: (text: string) => void;
  handleQuickTranslate: (text: string) => Promise<string>;
  handleSaveSentence: (text: string) => void;
  handleMicClick: () => void;
  handleRetryPractice: () => void;
  handleAcceptPronunciation: () => void;
  handleCancelPractice: () => void;
  handleEvaluationClose: () => void;
  setAnalysisText: (text: string | null) => void;
  setAnalysisResult: (result: string | null) => void;
  setShowReadingPracticeModal: (show: boolean) => void;
  setPronunciationAttempts: React.Dispatch<React.SetStateAction<number>>;
  setTotalAccuracy: React.Dispatch<React.SetStateAction<number>>;
}

export function KaiwaSessionMessages({
  messages,
  showFurigana,
  fontSize,
  speakingMessageId,
  speakingMode,
  isAiLoading,
  isPracticeMode,
  selectedSuggestion,
  pronunciationResult,
  autoSendCountdown,
  analysisText,
  analysisResult,
  isAnalyzing,
  showEvaluationModal,
  evaluation,
  isEvaluating,
  showReadingPracticeModal,
  textToRead,
  level,
  messagesEndRef,
  speech,
  settings,
  handleSpeak,
  handleAnalyze,
  handleQuickTranslate,
  handleSaveSentence,
  handleMicClick,
  handleRetryPractice,
  handleAcceptPronunciation,
  handleCancelPractice,
  handleEvaluationClose,
  setAnalysisText,
  setAnalysisResult,
  setShowReadingPracticeModal,
  setPronunciationAttempts,
  setTotalAccuracy,
}: KaiwaSessionMessagesProps) {
  return (
    <>
      <div className="kaiwa-messages">
        {messages.map(msg => (
          <KaiwaMessageItem
            key={msg.id}
            message={msg}
            speakingMessageId={speakingMessageId}
            speakingMode={speakingMode}
            showFurigana={showFurigana}
            fontSize={fontSize}
            onSpeak={handleSpeak}
            onAnalyze={handleAnalyze}
            onTranslate={handleQuickTranslate}
            onSaveSentence={handleSaveSentence}
          />
        ))}

        {isAiLoading && (
          <div className="kaiwa-message assistant">
            <div className="kaiwa-message-avatar">🤖</div>
            <div className="kaiwa-message-content">
              <div className="kaiwa-typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pronunciation Practice Modal */}
      {isPracticeMode && selectedSuggestion && (
        <>
          <KaiwaPracticeModal
            suggestion={selectedSuggestion}
            result={pronunciationResult}
            isListening={speech.isListening}
            isSpeaking={speech.isSpeaking}
            interimTranscript={speech.interimTranscript}
            onMicClick={handleMicClick}
            onListen={() => speech.speak(selectedSuggestion.text, { rate: settings.kaiwaVoiceRate })}
            onRetry={handleRetryPractice}
            onAccept={handleAcceptPronunciation}
            onClose={handleCancelPractice}
          />
          {autoSendCountdown !== null && autoSendCountdown > 0 && (
            <div className="kaiwa-auto-send-countdown">
              <Zap size={18} />
              <span>Tự động gửi trong</span>
              <span className="countdown-number">{autoSendCountdown}</span>
              <span>giây</span>
            </div>
          )}
        </>
      )}

      {/* Analysis Modal */}
      {analysisText && (
        <KaiwaAnalysisModal
          text={analysisText}
          result={analysisResult}
          isLoading={isAnalyzing}
          onClose={() => { setAnalysisText(null); setAnalysisResult(null); }}
        />
      )}

      {/* Evaluation Modal */}
      {showEvaluationModal && (
        <KaiwaEvaluationModal
          evaluation={evaluation}
          isLoading={isEvaluating}
          onClose={handleEvaluationClose}
        />
      )}

      {/* Reading Practice Modal */}
      <KaiwaReadingPracticeModal
        isOpen={showReadingPracticeModal}
        onClose={() => setShowReadingPracticeModal(false)}
        textToRead={textToRead}
        level={level}
        onComplete={(result) => {
          setPronunciationAttempts(prev => prev + 1);
          setTotalAccuracy(prev => prev + result.accuracy);
        }}
      />
    </>
  );
}
