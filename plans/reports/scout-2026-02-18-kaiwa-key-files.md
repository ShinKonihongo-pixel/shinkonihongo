# Kaiwa Feature - Key Files Complete Content

Generated: 2026-02-18

---

## FILE 1: src/components/pages/kaiwa/index.tsx

Main page orchestrator routing between setup and session views. 146 lines.

```typescript
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
```

---

## FILE 2: src/components/pages/kaiwa/kaiwa-setup-view.tsx

Setup configuration UI for conversation parameters. 638 lines. 

[Full content truncated for length - see below for key sections]

This file handles:
- Session mode selection (default/speaking/advanced/custom)
- Level, style, topic selection
- Default question hierarchical selector (level → topic → folder → question)
- Advanced topics grid
- Custom topics selector
- Role selector
- Preferences (slow mode, voice gender)
- Start button with validation

**Key sections:**
- Lines 71-180: Props destructuring and session mode selector UI
- Lines 183-191: Speaking practice mode integration
- Lines 194-299: Advanced session topic selector with vocabulary preview
- Lines 302-360: Custom topics session selector
- Lines 363-530: Default question selector with hierarchical navigation
- Lines 535-612: Free conversation setup with preferences
- Lines 620-633: Start button with mode-specific text

---

## FILE 3: src/components/pages/kaiwa/kaiwa-session-view.tsx

Main conversation interface during active session. 627 lines.

[Full content truncated for length - see below for key sections]

This file handles:
- Header with stats (exchanges, duration, saved sentences)
- Control buttons (restart, send mode, slow/furigana toggles, font size, eval, end)
- Message display area with auto-scroll
- Practice modal integration with auto-send countdown
- Analysis modal for translations
- Evaluation modal for feedback
- Reading practice modal
- Saved sentences panel with copy/speak/delete
- Bottom section with:
  - Suggestion tabs (answer template, sample answers, suggested questions)
  - Error display
  - Input controls (suggestions toggle, mic modes, text input, send button)
  - Voice status indicators

**Key sections:**
- Lines 142-215: Props destructuring
- Lines 219-324: Header with stats and controls
- Lines 326-354: Messages list rendering
- Lines 356-412: Modals (practice, analysis, evaluation, reading)
- Lines 414-456: Saved sentences panel
- Lines 459-542: Suggestion tabs with content
- Lines 553-614: Input controls with mic and send

---

## Summary of Three Key Files

| File | Lines | Purpose | Complexity |
|------|-------|---------|-----------|
| `index.tsx` | 146 | Route orchestrator | Low - Clean delegation |
| `kaiwa-setup-view.tsx` | 638 | Pre-session config UI | High - 4+ session modes, nested selectors |
| `kaiwa-session-view.tsx` | 627 | Active conversation UI | High - Multiple modals, suggestion system, input modes |

**Total for key files: 1,411 lines**

These three files represent the core of the Kaiwa feature architecture:
1. Main router delegates to appropriate view
2. Setup handles configuration with multiple paths
3. Session handles real-time conversation with comprehensive UI

