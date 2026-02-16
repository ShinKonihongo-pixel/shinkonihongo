// Kaiwa page orchestrator - Routes between setup and session views
// Extracted from kaiwa-page.tsx monolith (1,751 lines -> ~100 lines)

import type { KaiwaPageProps } from './kaiwa-page-types';
import { useKaiwaState } from './use-kaiwa-state';
import { KaiwaSetupView } from './kaiwa-setup-view';
import { KaiwaSessionView } from './kaiwa-session-view';
import '../../kaiwa/kaiwa.css';

export function KaiwaPage(props: KaiwaPageProps) {
  const state = useKaiwaState(props);

  // Route to appropriate view based on session state
  if (!state.isStarted) {
    return (
      <KaiwaSetupView
        // State
        sessionMode={state.sessionMode}
        level={state.level}
        style={state.style}
        topic={state.topic}
        slowMode={state.slowMode}
        questionSelectorState={state.questionSelectorState}
        selectedDefaultQuestion={state.selectedDefaultQuestion}
        selectedAdvancedTopic={state.selectedAdvancedTopic}
        selectedAdvancedQuestion={state.selectedAdvancedQuestion}
        selectedCustomTopic={state.selectedCustomTopic}
        selectedScenario={state.selectedScenario}
        userRole={state.userRole}
        // Data
        defaultQuestions={props.defaultQuestions || []}
        advancedTopics={props.advancedTopics || []}
        customTopics={props.customTopics || []}
        settings={props.settings}
        // Setters
        setSessionMode={state.setSessionMode}
        setLevel={state.setLevel}
        setStyle={state.setStyle}
        setSlowMode={state.setSlowMode}
        setQuestionSelectorState={state.setQuestionSelectorState}
        setSelectedDefaultQuestion={state.setSelectedDefaultQuestion}
        setSelectedAdvancedTopic={state.setSelectedAdvancedTopic}
        setSelectedAdvancedQuestion={state.setSelectedAdvancedQuestion}
        setSelectedCustomTopic={state.setSelectedCustomTopic}
        setSelectedCustomQuestion={state.setSelectedCustomQuestion}
        setUserRole={state.setUserRole}
        // Handlers
        handleTopicChange={state.handleTopicChange}
        handleStart={state.handleStart}
        // Computed
        getQuestionsForSelector={state.getQuestionsForSelector}
        getFoldersForSelector={state.getFoldersForSelector}
        getAdvancedQuestionsForTopic={state.getAdvancedQuestionsForTopic}
        getCustomQuestionsForTopic={state.getCustomQuestionsForTopic}
        // Speech support
        recognitionSupported={state.speech.recognitionSupported}
      />
    );
  }

  // Active session view
  return (
    <KaiwaSessionView
      // State
      messages={state.messages}
      level={state.level}
      style={state.style}
      topic={state.topic}
      conversationStats={state.conversationStats}
      savedSentences={state.savedSentences}
      showSavedPanel={state.showSavedPanel}
      slowMode={state.slowMode}
      showFurigana={state.showFurigana}
      fontSize={state.fontSize}
      speakingMessageId={state.speakingMessageId}
      speakingMode={state.speakingMode}
      isAiLoading={state.isAiLoading}
      inputText={state.inputText}
      showSuggestionTabs={state.showSuggestionTabs}
      activeSuggestionTab={state.activeSuggestionTab}
      answerTemplate={state.answerTemplate}
      suggestedAnswers={state.suggestedAnswers}
      suggestedQuestions={state.suggestedQuestions}
      isPracticeMode={state.isPracticeMode}
      selectedSuggestion={state.selectedSuggestion}
      pronunciationResult={state.pronunciationResult}
      autoSendCountdown={state.autoSendCountdown}
      analysisText={state.analysisText}
      analysisResult={state.analysisResult}
      isAnalyzing={state.isAnalyzing}
      showEvaluationModal={state.showEvaluationModal}
      evaluation={state.evaluation}
      isEvaluating={state.isEvaluating}
      micMode={state.micMode}
      showReadingPracticeModal={state.showReadingPracticeModal}
      textToRead={state.textToRead}
      selectedAdvancedTopic={state.selectedAdvancedTopic}
      selectedCustomTopic={state.selectedCustomTopic}
      sessionMode={state.sessionMode}
      // Refs
      messagesEndRef={state.messagesEndRef as React.RefObject<HTMLDivElement>}
      inputRef={state.inputRef as React.RefObject<HTMLInputElement>}
      // Speech
      speech={state.speech}
      groq={state.groq}
      // Settings
      settings={props.settings}
      // Setters
      setInputText={state.setInputText}
      setSlowMode={state.setSlowMode}
      setShowFurigana={state.setShowFurigana}
      setFontSize={state.setFontSize}
      setShowSavedPanel={state.setShowSavedPanel}
      setSavedSentences={state.setSavedSentences}
      setShowSuggestionTabs={state.setShowSuggestionTabs}
      setActiveSuggestionTab={state.setActiveSuggestionTab}
      setAnalysisText={state.setAnalysisText}
      setAnalysisResult={state.setAnalysisResult}
      setMicMode={state.setMicMode}
      setShowReadingPracticeModal={state.setShowReadingPracticeModal}
      setTextToRead={state.setTextToRead}
      setPronunciationAttempts={state.setPronunciationAttempts}
      setTotalAccuracy={state.setTotalAccuracy}
      // Handlers
      handleStart={state.handleStart}
      handleEnd={state.handleEnd}
      handleSend={state.handleSend}
      handleSpeak={state.handleSpeak}
      handleAnalyze={state.handleAnalyze}
      handleQuickTranslate={state.handleQuickTranslate}
      handleSaveSentence={state.handleSaveSentence}
      handleSelectHint={state.handleSelectHint}
      handleSuggestedAnswer={state.handleSuggestedAnswer}
      handleSuggestedQuestion={state.handleSuggestedQuestion}
      handleMicClick={state.handleMicClick}
      handleCancelPractice={state.handleCancelPractice}
      handleRetryPractice={state.handleRetryPractice}
      handleAcceptPronunciation={state.handleAcceptPronunciation}
      handleEvaluationClose={state.handleEvaluationClose}
      // Computed
      getSpeechRate={state.getSpeechRate}
      getUserRoleInfo={state.getUserRoleInfo}
    />
  );
}
