// Kaiwa Tab Orchestrator - Main component with state management and view routing
// Manages sub-tab navigation and delegates to specialized views

import { useState } from 'react';
import { MessageSquare, Upload, Settings, Star } from 'lucide-react';
import type { KaiwaTabProps } from '../cards-management-types';
import { QuestionsView } from './questions-view';
import { ImportView } from './import-view';
import { SettingsView } from './settings-view';
import { CustomTopicsTab } from '../custom-topics/index';
import { DEFAULT_SETTINGS, type KaiwaSubTab, type KaiwaPracticeSettings, type ImportResults } from './kaiwa-tab-types';
import './kaiwa-tab-layout.css';
import './kaiwa-tab-start-screen.css';
import './kaiwa-tab-controls.css';
import './kaiwa-tab-mode-cards.css';
import './kaiwa-tab-topics.css';
import './kaiwa-tab-conversation.css';
import './kaiwa-tab-messages.css';
import './kaiwa-tab-input.css';
import './kaiwa-tab-modals.css';
import './kaiwa-tab-responsive.css';
import './kaiwa-tab-responsive-global.css';

export function KaiwaTab({
  questions,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onAddFolder,
  onUpdateFolder,
  onDeleteFolder,
  getFoldersByLevelAndTopic,
  getQuestionsByFolder,
  // Custom Topics props
  customTopics = [],
  customTopicFolders = [],
  customTopicQuestions = [],
  onAddCustomTopic,
  onUpdateCustomTopic,
  onDeleteCustomTopic,
  onAddCustomTopicFolder,
  onUpdateCustomTopicFolder,
  onDeleteCustomTopicFolder,
  onAddCustomTopicQuestion,
  onUpdateCustomTopicQuestion,
  onDeleteCustomTopicQuestion,
  // Flashcard lessons
  lessons = [],
  getLessonsByLevel,
  // Grammar lessons
  grammarLessons = [],
  getGrammarLessonsByLevel,
  currentUser,
  isSuperAdmin,
}: KaiwaTabProps) {
  // Main tab state
  const [activeSubTab, setActiveSubTab] = useState<KaiwaSubTab>('questions');

  // Import states
  const [importText, setImportText] = useState('');
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);

  // Settings state
  const [practiceSettings, setPracticeSettings] = useState<KaiwaPracticeSettings>(DEFAULT_SETTINGS);

  // Import handlers
  const processImportText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const parsedQuestions: ImportResults['questions'] = [];
    const errors: string[] = [];

    // Simple format: each line is "Japanese|Vietnamese|context"
    lines.forEach((line, idx) => {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 1 && parts[0]) {
        parsedQuestions.push({
          level: 'N5',
          topic: 'greetings',
          questionJa: parts[0],
          questionVi: parts[1] || '',
          situationContext: parts[2] || '',
          suggestedAnswers: parts.slice(3).filter(Boolean),
          style: 'polite'
        });
      } else {
        errors.push(`Dòng ${idx + 1}: Không có nội dung câu hỏi`);
      }
    });

    setImportResults({ questions: parsedQuestions, errors });
  };

  const handleImportConfirm = async () => {
    if (!importResults?.questions.length || !onAddQuestion) return;

    setIsProcessingImport(true);
    try {
      for (const q of importResults.questions) {
        await onAddQuestion(q, currentUser.id);
      }
      setImportResults(null);
      setImportText('');
      setActiveSubTab('questions');
    } catch (error) {
      setImportResults({
        ...importResults,
        errors: [...importResults.errors, 'Lỗi import: ' + (error instanceof Error ? error.message : 'Unknown')]
      });
    } finally {
      setIsProcessingImport(false);
    }
  };

  // Settings handler
  const handleSettingChange = <K extends keyof KaiwaPracticeSettings>(key: K, value: KaiwaPracticeSettings[K]) => {
    setPracticeSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="kaiwa-management">
      {/* Sub-tab Navigation */}
      <div className="kaiwa-subtabs">
        <button
          className={`subtab ${activeSubTab === 'questions' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('questions')}
        >
          <MessageSquare size={18} />
          <span>Câu hỏi</span>
        </button>
        <button
          className={`subtab ${activeSubTab === 'custom_topics' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('custom_topics')}
        >
          <Star size={18} />
          <span>Chủ đề ({customTopics.length})</span>
        </button>
        <button
          className={`subtab ${activeSubTab === 'import' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('import')}
        >
          <Upload size={18} />
          <span>Import</span>
        </button>
        <button
          className={`subtab ${activeSubTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('settings')}
        >
          <Settings size={18} />
          <span>Cài đặt</span>
        </button>
      </div>

      {/* Custom Topics Tab */}
      {activeSubTab === 'custom_topics' && onAddCustomTopic && onUpdateCustomTopic && onDeleteCustomTopic && (
        <CustomTopicsTab
          topics={customTopics}
          folders={customTopicFolders}
          questions={customTopicQuestions}
          currentUser={currentUser}
          isSuperAdmin={isSuperAdmin}
          lessons={lessons}
          getLessonsByLevel={getLessonsByLevel}
          grammarLessons={grammarLessons}
          getGrammarLessonsByLevel={getGrammarLessonsByLevel}
          onAddTopic={onAddCustomTopic}
          onUpdateTopic={onUpdateCustomTopic}
          onDeleteTopic={onDeleteCustomTopic}
          onAddFolder={onAddCustomTopicFolder!}
          onUpdateFolder={onUpdateCustomTopicFolder!}
          onDeleteFolder={onDeleteCustomTopicFolder!}
          onAddQuestion={onAddCustomTopicQuestion!}
          onUpdateQuestion={onUpdateCustomTopicQuestion!}
          onDeleteQuestion={onDeleteCustomTopicQuestion!}
        />
      )}

      {/* Questions Tab */}
      {activeSubTab === 'questions' && (
        <QuestionsView
          questions={questions}
          onAddQuestion={onAddQuestion}
          onUpdateQuestion={onUpdateQuestion}
          onDeleteQuestion={onDeleteQuestion}
          onAddFolder={onAddFolder}
          onUpdateFolder={onUpdateFolder}
          onDeleteFolder={onDeleteFolder}
          getFoldersByLevelAndTopic={getFoldersByLevelAndTopic}
          getQuestionsByFolder={getQuestionsByFolder}
          currentUser={currentUser}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {/* Import Tab */}
      {activeSubTab === 'import' && (
        <ImportView
          importText={importText}
          setImportText={setImportText}
          importResults={importResults}
          setImportResults={setImportResults}
          isProcessingImport={isProcessingImport}
          setIsProcessingImport={setIsProcessingImport}
          onImportConfirm={handleImportConfirm}
          onProcessText={processImportText}
        />
      )}

      {/* Settings Tab */}
      {activeSubTab === 'settings' && (
        <SettingsView
          settings={practiceSettings}
          onSettingChange={handleSettingChange}
        />
      )}
    </div>
  );
}
