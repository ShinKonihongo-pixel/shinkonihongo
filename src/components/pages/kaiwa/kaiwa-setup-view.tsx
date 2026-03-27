// Kaiwa setup/configuration UI component
// Extracted from kaiwa-page.tsx - handles mode selection, topic selection, and start button

import type { KaiwaSetupViewProps } from './kaiwa-setup-view-props';
import { SpeakingPracticeMode } from '../../kaiwa';
import { KaiwaSetupModeCards } from './kaiwa-setup-mode-cards';
import { KaiwaSetupAdvancedSection } from './kaiwa-setup-advanced-section';
import { KaiwaSetupCustomSection } from './kaiwa-setup-custom-section';
import { KaiwaSetupQuestionSelector } from './kaiwa-setup-question-selector';
import { KaiwaSetupSettingsPanel } from './kaiwa-setup-settings-panel';
import { KaiwaSetupLaunchSection } from './kaiwa-setup-launch-section';

export type { KaiwaSetupViewProps };

export function KaiwaSetupView(props: KaiwaSetupViewProps) {
  const {
    sessionMode,
    level,
    style,
    topic,
    slowMode,
    questionSelectorState,
    selectedDefaultQuestion,
    selectedAdvancedTopic,
    selectedAdvancedQuestion,
    selectedCustomTopic,
    selectedScenario,
    userRole,
    defaultQuestions,
    advancedTopics,
    customTopics,
    settings,
    setSessionMode,
    setLevel,
    setStyle,
    setSlowMode,
    setQuestionSelectorState,
    setSelectedDefaultQuestion,
    setSelectedAdvancedTopic,
    setSelectedAdvancedQuestion,
    setSelectedCustomTopic,
    setSelectedCustomQuestion,
    setUserRole,
    handleTopicChange,
    handleStart,
    getQuestionsForSelector,
    getFoldersForSelector,
    getAdvancedQuestionsForTopic,
    getCustomQuestionsForTopic,
    recognitionSupported,
  } = props;

  const hasDefaultQuestions = defaultQuestions.length > 0;

  return (
    <div className="kaiwa-page kaiwa-page-start">
      <div className="kaiwa-container">
        <div className="kaiwa-start-screen">
          {/* Hero section */}
          <div className="kaiwa-hero">
            <div className="kaiwa-hero-icon-wrap">
              <div className="kaiwa-hero-ring" />
              <div className="kaiwa-hero-ring ring-2" />
              <div className="kaiwa-hero-icon">💬</div>
            </div>
            <h2>会話練習</h2>
            <span className="kaiwa-hero-subtitle">Luyện Hội Thoại</span>
            <p className="kaiwa-description">
              Luyện tập hội thoại tiếng Nhật với trợ lý AI
            </p>
          </div>

          {/* Mode selection */}
          <KaiwaSetupModeCards
            sessionMode={sessionMode}
            advancedTopicsCount={advancedTopics.length}
            customTopicsCount={customTopics.length}
            setSessionMode={setSessionMode}
            setSelectedDefaultQuestion={setSelectedDefaultQuestion}
            setQuestionSelectorState={setQuestionSelectorState}
            setSelectedAdvancedTopic={setSelectedAdvancedTopic}
            setSelectedAdvancedQuestion={setSelectedAdvancedQuestion}
            setSelectedCustomTopic={setSelectedCustomTopic}
            setSelectedCustomQuestion={setSelectedCustomQuestion}
          />

          {/* Speaking Practice Mode */}
          {sessionMode === 'speaking' && (
            <SpeakingPracticeMode
              defaultLevel={settings.kaiwaDefaultLevel}
              voiceGender={settings.kaiwaVoiceGender}
              voiceRate={settings.kaiwaVoiceRate}
              showFurigana={settings.kaiwaShowFurigana}
              onClose={() => setSessionMode('default')}
            />
          )}

          {/* Advanced session topic selector */}
          {sessionMode === 'advanced' && (
            <KaiwaSetupAdvancedSection
              advancedTopics={advancedTopics}
              selectedAdvancedTopic={selectedAdvancedTopic}
              selectedAdvancedQuestion={selectedAdvancedQuestion}
              setSelectedAdvancedTopic={setSelectedAdvancedTopic}
              setSelectedAdvancedQuestion={setSelectedAdvancedQuestion}
              getAdvancedQuestionsForTopic={getAdvancedQuestionsForTopic}
            />
          )}

          {/* Custom topics session selector */}
          {sessionMode === 'custom' && (
            <KaiwaSetupCustomSection
              customTopics={customTopics}
              selectedCustomTopic={selectedCustomTopic}
              setSelectedCustomTopic={setSelectedCustomTopic}
              setSelectedCustomQuestion={setSelectedCustomQuestion}
              getCustomQuestionsForTopic={getCustomQuestionsForTopic}
              handleStart={handleStart}
            />
          )}

          {/* Default question selector */}
          {sessionMode === 'default' && hasDefaultQuestions && (
            <KaiwaSetupQuestionSelector
              questionSelectorState={questionSelectorState}
              selectedDefaultQuestion={selectedDefaultQuestion}
              setQuestionSelectorState={setQuestionSelectorState}
              setSelectedDefaultQuestion={setSelectedDefaultQuestion}
              setLevel={setLevel}
              setStyle={setStyle}
              handleTopicChange={handleTopicChange}
              getQuestionsForSelector={getQuestionsForSelector}
              getFoldersForSelector={getFoldersForSelector}
            />
          )}

          {/* Free conversation settings (level/style/topic/role) */}
          {!selectedDefaultQuestion && sessionMode !== 'advanced' && sessionMode !== 'custom' && sessionMode !== 'speaking' && (
            <KaiwaSetupSettingsPanel
              level={level}
              style={style}
              topic={topic}
              selectedScenario={selectedScenario}
              userRole={userRole}
              setLevel={setLevel}
              setStyle={setStyle}
              setUserRole={setUserRole}
              handleTopicChange={handleTopicChange}
            />
          )}

          {/* Launch section (slow mode + start button) */}
          {sessionMode !== 'custom' && sessionMode !== 'speaking' && (
            <KaiwaSetupLaunchSection
              slowMode={slowMode}
              sessionMode={sessionMode}
              selectedAdvancedTopic={selectedAdvancedTopic}
              selectedDefaultQuestion={selectedDefaultQuestion}
              settings={settings}
              recognitionSupported={recognitionSupported}
              setSlowMode={setSlowMode}
              handleStart={handleStart}
            />
          )}
        </div>
      </div>
    </div>
  );
}
