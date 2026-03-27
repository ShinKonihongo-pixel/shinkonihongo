// Kaiwa active session view - Conversation interface during active session
// Extracted from kaiwa-page.tsx (lines 1339-1751)

import type { KaiwaSessionViewProps } from './kaiwa-session-view-props';
import { KaiwaSessionHeader } from './kaiwa-session-header';
import { KaiwaSessionMessages } from './kaiwa-session-messages';
import { KaiwaSessionSavedPanel } from './kaiwa-session-saved-panel';
import { KaiwaSessionSuggestionTabs } from './kaiwa-session-suggestion-tabs';
import { KaiwaSessionInputArea } from './kaiwa-session-input-area';

export type { KaiwaSessionViewProps };

export function KaiwaSessionView(p: KaiwaSessionViewProps) {
  const { isPracticeMode, showSuggestionTabs, answerTemplate, suggestedAnswers, suggestedQuestions, showSavedPanel } = p;

  return (
    <div className="kaiwa-page">
      <div className="kaiwa-container">
        <KaiwaSessionHeader
          messages={p.messages} level={p.level} style={p.style} topic={p.topic}
          conversationStats={p.conversationStats} savedSentences={p.savedSentences}
          showSavedPanel={showSavedPanel} slowMode={p.slowMode} showFurigana={p.showFurigana}
          fontSize={p.fontSize} isAiLoading={p.isAiLoading} isEvaluating={p.isEvaluating}
          selectedAdvancedTopic={p.selectedAdvancedTopic} selectedCustomTopic={p.selectedCustomTopic}
          sessionMode={p.sessionMode} settings={p.settings} getUserRoleInfo={p.getUserRoleInfo}
          setShowSavedPanel={p.setShowSavedPanel} setSlowMode={p.setSlowMode}
          setShowFurigana={p.setShowFurigana} setFontSize={p.setFontSize}
          handleStart={p.handleStart} handleEnd={p.handleEnd}
        />

        <KaiwaSessionMessages
          messages={p.messages} showFurigana={p.showFurigana} fontSize={p.fontSize}
          speakingMessageId={p.speakingMessageId} speakingMode={p.speakingMode}
          isAiLoading={p.isAiLoading} isPracticeMode={p.isPracticeMode}
          selectedSuggestion={p.selectedSuggestion} pronunciationResult={p.pronunciationResult}
          autoSendCountdown={p.autoSendCountdown} analysisText={p.analysisText}
          analysisResult={p.analysisResult} isAnalyzing={p.isAnalyzing}
          showEvaluationModal={p.showEvaluationModal} evaluation={p.evaluation}
          isEvaluating={p.isEvaluating} showReadingPracticeModal={p.showReadingPracticeModal}
          textToRead={p.textToRead} level={p.level} messagesEndRef={p.messagesEndRef}
          speech={p.speech} settings={p.settings}
          handleSpeak={p.handleSpeak} handleAnalyze={p.handleAnalyze}
          handleQuickTranslate={p.handleQuickTranslate} handleSaveSentence={p.handleSaveSentence}
          handleMicClick={p.handleMicClick} handleRetryPractice={p.handleRetryPractice}
          handleAcceptPronunciation={p.handleAcceptPronunciation} handleCancelPractice={p.handleCancelPractice}
          handleEvaluationClose={p.handleEvaluationClose} setAnalysisText={p.setAnalysisText}
          setAnalysisResult={p.setAnalysisResult} setShowReadingPracticeModal={p.setShowReadingPracticeModal}
          setPronunciationAttempts={p.setPronunciationAttempts} setTotalAccuracy={p.setTotalAccuracy}
        />

        {showSavedPanel && (
          <KaiwaSessionSavedPanel
            savedSentences={p.savedSentences} showFurigana={p.showFurigana} fontSize={p.fontSize}
            speech={p.speech} getSpeechRate={p.getSpeechRate}
            setShowSavedPanel={p.setShowSavedPanel} setSavedSentences={p.setSavedSentences}
          />
        )}

        <div className="kaiwa-bottom-section">
          {!isPracticeMode && showSuggestionTabs && (answerTemplate || suggestedAnswers.length > 0 || suggestedQuestions.length > 0) && (
            <KaiwaSessionSuggestionTabs
              showFurigana={p.showFurigana} isAiLoading={p.isAiLoading} inputText={p.inputText}
              activeSuggestionTab={p.activeSuggestionTab} answerTemplate={answerTemplate}
              suggestedAnswers={suggestedAnswers} suggestedQuestions={suggestedQuestions}
              setActiveSuggestionTab={p.setActiveSuggestionTab}
              handleSelectHint={p.handleSelectHint} handleSuggestedAnswer={p.handleSuggestedAnswer}
              handleSuggestedQuestion={p.handleSuggestedQuestion}
            />
          )}

          <KaiwaSessionInputArea
            messages={p.messages} inputText={p.inputText} isAiLoading={p.isAiLoading}
            showSuggestionTabs={showSuggestionTabs} answerTemplate={answerTemplate}
            suggestedAnswers={suggestedAnswers} suggestedQuestions={suggestedQuestions}
            micMode={p.micMode} inputRef={p.inputRef} speech={p.speech} groq={p.groq}
            setInputText={p.setInputText} setShowSuggestionTabs={p.setShowSuggestionTabs}
            setMicMode={p.setMicMode} setTextToRead={p.setTextToRead}
            setShowReadingPracticeModal={p.setShowReadingPracticeModal}
            handleSend={p.handleSend} handleMicClick={p.handleMicClick}
          />
        </div>
      </div>
    </div>
  );
}
