// Kaiwa Start Screen - Setup UI for starting a conversation session
// Handles level/style/topic selection, default questions, and advanced topics

import { useMemo } from 'react';
import type { KaiwaStartScreenProps } from './kaiwa-start-screen-types';
import { KaiwaStartModeSelector } from './kaiwa-start-mode-selector';
import { KaiwaStartAdvancedSection } from './kaiwa-start-advanced-section';
import { KaiwaStartQuestionSelector } from './kaiwa-start-question-selector';
import { KaiwaStartSettings } from './kaiwa-start-settings';

// Re-export types consumed by other modules
export type { SessionMode, QuestionSelectorState } from './kaiwa-start-screen-types';

export function KaiwaStartScreen({
  level,
  style,
  topic,
  slowMode,
  voiceGender,
  recognitionSupported,
  sessionMode,
  onSessionModeChange,
  onLevelChange,
  onStyleChange,
  onTopicChange,
  onSlowModeChange,
  defaultQuestions,
  questionSelectorState,
  selectedDefaultQuestion,
  onQuestionSelectorStateChange,
  onSelectDefaultQuestion,
  getFoldersByLevelAndTopic,
  getQuestionsByFolder,
  getQuestionsByLevelAndTopic,
  advancedTopics,
  advancedQuestions,
  selectedAdvancedTopic,
  selectedAdvancedQuestion,
  onSelectAdvancedTopic,
  onSelectAdvancedQuestion,
  getAdvancedQuestionsByTopic,
  selectedScenario,
  userRole,
  onUserRoleChange,
  onStart,
}: KaiwaStartScreenProps) {
  const hasDefaultQuestions = defaultQuestions.length > 0;

  const questionsForSelector = useMemo(() => {
    if (questionSelectorState.type !== 'list') return [];
    if (questionSelectorState.folderId && getQuestionsByFolder) {
      return getQuestionsByFolder(questionSelectorState.folderId);
    }
    if (getQuestionsByLevelAndTopic) {
      return getQuestionsByLevelAndTopic(questionSelectorState.level, questionSelectorState.topic);
    }
    return [];
  }, [questionSelectorState, getQuestionsByFolder, getQuestionsByLevelAndTopic]);

  const foldersForSelector = useMemo(() => {
    if (questionSelectorState.type !== 'list') return [];
    if (getFoldersByLevelAndTopic) {
      return getFoldersByLevelAndTopic(questionSelectorState.level, questionSelectorState.topic);
    }
    return [];
  }, [questionSelectorState, getFoldersByLevelAndTopic]);

  const advancedQuestionsForTopic = useMemo(() => {
    if (!selectedAdvancedTopic) return [];
    if (getAdvancedQuestionsByTopic) {
      return getAdvancedQuestionsByTopic(selectedAdvancedTopic.id);
    }
    return advancedQuestions.filter(q => q.topicId === selectedAdvancedTopic.id);
  }, [selectedAdvancedTopic, advancedQuestions, getAdvancedQuestionsByTopic]);

  const isStartDisabled = sessionMode === 'advanced' && !selectedAdvancedTopic;

  const getStartButtonText = () => {
    if (sessionMode === 'advanced' && selectedAdvancedTopic) {
      return `Bắt đầu: ${selectedAdvancedTopic.name}`;
    }
    if (selectedDefaultQuestion) return 'Bắt đầu với câu hỏi đã chọn';
    return 'Bắt đầu hội thoại';
  };

  return (
    <div className="kaiwa-page kaiwa-page-start">
      <div className="kaiwa-container">
        <div className="kaiwa-start-screen">
          <h2>会話練習 - Luyện Hội Thoại</h2>
          <p className="kaiwa-description">
            Luyện tập hội thoại tiếng Nhật với trợ lý AI. Bạn có thể nói hoặc gõ để trả lời.
          </p>

          {advancedTopics.length > 0 && (
            <KaiwaStartModeSelector
              sessionMode={sessionMode}
              onSessionModeChange={onSessionModeChange}
              onSelectAdvancedTopic={onSelectAdvancedTopic}
              onSelectAdvancedQuestion={onSelectAdvancedQuestion}
              onSelectDefaultQuestion={onSelectDefaultQuestion}
              onQuestionSelectorStateChange={onQuestionSelectorStateChange}
            />
          )}

          {sessionMode === 'advanced' && advancedTopics.length > 0 && (
            <KaiwaStartAdvancedSection
              advancedTopics={advancedTopics}
              selectedAdvancedTopic={selectedAdvancedTopic}
              selectedAdvancedQuestion={selectedAdvancedQuestion}
              advancedQuestionsForTopic={advancedQuestionsForTopic}
              onSelectAdvancedTopic={onSelectAdvancedTopic}
              onSelectAdvancedQuestion={onSelectAdvancedQuestion}
            />
          )}

          {sessionMode === 'default' && hasDefaultQuestions && (
            <KaiwaStartQuestionSelector
              questionSelectorState={questionSelectorState}
              selectedDefaultQuestion={selectedDefaultQuestion}
              questionsForSelector={questionsForSelector}
              foldersForSelector={foldersForSelector}
              onQuestionSelectorStateChange={onQuestionSelectorStateChange}
              onSelectDefaultQuestion={onSelectDefaultQuestion}
              onLevelChange={onLevelChange}
              onStyleChange={onStyleChange}
              onTopicChange={onTopicChange}
            />
          )}

          {!selectedDefaultQuestion && !(sessionMode === 'advanced' && selectedAdvancedTopic) && (
            <KaiwaStartSettings
              level={level}
              style={style}
              topic={topic}
              onLevelChange={onLevelChange}
              onStyleChange={onStyleChange}
              onTopicChange={onTopicChange}
              selectedScenario={selectedScenario}
              userRole={userRole}
              onUserRoleChange={onUserRoleChange}
              slowMode={slowMode}
              voiceGender={voiceGender}
              recognitionSupported={recognitionSupported}
              onSlowModeChange={onSlowModeChange}
              isStartDisabled={isStartDisabled}
              startButtonText={getStartButtonText()}
              onStart={onStart}
            />
          )}

          {(selectedDefaultQuestion || (sessionMode === 'advanced' && selectedAdvancedTopic)) && (
            <button
              className="btn btn-primary btn-large"
              onClick={onStart}
              disabled={isStartDisabled}
            >
              {getStartButtonText()}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
