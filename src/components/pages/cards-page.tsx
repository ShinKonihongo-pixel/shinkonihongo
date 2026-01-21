// Cards Management Page - Unified management interface
// Modular architecture with separate tab components

import { useState } from 'react';
import type { Flashcard, FlashcardFormData, Lesson, JLPTLevel } from '../../types/flashcard';
import type { CurrentUser, User, UserRole } from '../../types/user';
import type { JLPTQuestion, JLPTQuestionFormData, JLPTLevel as JLPTQuestionLevel, QuestionCategory, JLPTFolder } from '../../types/jlpt-question';
import type { KaiwaDefaultQuestion, KaiwaQuestionFormData, KaiwaFolder } from '../../types/kaiwa-question';
import type { JLPTLevel as KaiwaJLPTLevel, ConversationTopic } from '../../types/kaiwa';
import type { KaiwaAdvancedTopic, KaiwaAdvancedQuestion, KaiwaAdvancedTopicFormData, KaiwaAdvancedQuestionFormData } from '../../types/kaiwa-advanced';
import { useLectures } from '../../hooks/use-lectures';
import { useTestTemplates } from '../../hooks/use-classrooms';
import { useCustomTopics } from '../../hooks/use-custom-topics';
import { TestBankPanel } from '../classroom/test-bank-panel';
import {
  FlashcardsTab,
  LecturesTab,
  JLPTTab,
  KaiwaTab,
  GameTab,
  UsersTab,
  CustomTopicsTab,
  type ManagementTab,
} from '../cards-management';

interface CardsPageProps {
  cards: Flashcard[];
  onAddCard: (data: FlashcardFormData, createdBy?: string) => void;
  onUpdateCard: (id: string, data: Partial<Flashcard>) => void;
  onDeleteCard: (id: string) => void;
  lessons: Lesson[];
  getLessonsByLevel: (level: JLPTLevel) => Lesson[];
  getChildLessons: (parentId: string) => Lesson[];
  onAddLesson: (name: string, level: JLPTLevel, parentId?: string | null, createdBy?: string) => void;
  onUpdateLesson: (id: string, name: string) => void;
  onDeleteLesson: (id: string) => void;
  currentUser: CurrentUser;
  // JLPT props
  jlptQuestions: JLPTQuestion[];
  onAddJLPTQuestion: (data: JLPTQuestionFormData) => Promise<void>;
  onUpdateJLPTQuestion: (id: string, data: Partial<JLPTQuestion>) => Promise<void>;
  onDeleteJLPTQuestion: (id: string) => Promise<void>;
  onAddJLPTFolder: (name: string, level: JLPTQuestionLevel, category: QuestionCategory) => Promise<void>;
  onUpdateJLPTFolder: (id: string, data: Partial<JLPTFolder>) => Promise<void>;
  onDeleteJLPTFolder: (id: string) => Promise<void>;
  getFoldersByLevelAndCategory: (level: JLPTQuestionLevel, category: QuestionCategory) => JLPTFolder[];
  getQuestionsByFolder: (folderId: string) => JLPTQuestion[];
  // User props
  users: User[];
  onUpdateUserRole: (userId: string, role: UserRole) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateVipExpiration: (userId: string, expirationDate: string | undefined) => void;
  onRegister: (username: string, password: string, role: UserRole, createdBy?: string) => Promise<{ success: boolean; error?: string }>;
  // Lesson lock/hide props
  onToggleLock: (lessonId: string) => void;
  onToggleHide: (lessonId: string) => void;
  // Lecture props
  onNavigateToLectureEditor?: (lectureId?: string, folderId?: string, level?: JLPTLevel) => void;
  // Kaiwa props
  kaiwaQuestions?: KaiwaDefaultQuestion[];
  kaiwaFolders?: KaiwaFolder[];
  onAddKaiwaQuestion?: (data: KaiwaQuestionFormData, createdBy?: string) => Promise<KaiwaDefaultQuestion>;
  onUpdateKaiwaQuestion?: (id: string, data: Partial<KaiwaDefaultQuestion>) => Promise<void>;
  onDeleteKaiwaQuestion?: (id: string) => Promise<void>;
  onAddKaiwaFolder?: (name: string, level: KaiwaJLPTLevel, topic: ConversationTopic, createdBy?: string) => Promise<KaiwaFolder>;
  onUpdateKaiwaFolder?: (id: string, data: Partial<KaiwaFolder>) => Promise<void>;
  onDeleteKaiwaFolder?: (id: string) => Promise<void>;
  getFoldersByLevelAndTopic?: (level: KaiwaJLPTLevel, topic: ConversationTopic) => KaiwaFolder[];
  getQuestionsByKaiwaFolder?: (folderId: string) => KaiwaDefaultQuestion[];
  // Kaiwa Advanced Topics props
  advancedKaiwaTopics?: KaiwaAdvancedTopic[];
  advancedKaiwaQuestions?: KaiwaAdvancedQuestion[];
  onAddAdvancedKaiwaTopic?: (data: KaiwaAdvancedTopicFormData) => Promise<KaiwaAdvancedTopic | null>;
  onUpdateAdvancedKaiwaTopic?: (id: string, data: Partial<KaiwaAdvancedTopicFormData>) => Promise<boolean>;
  onDeleteAdvancedKaiwaTopic?: (id: string) => Promise<boolean>;
  onAddAdvancedKaiwaQuestion?: (data: KaiwaAdvancedQuestionFormData) => Promise<KaiwaAdvancedQuestion | null>;
  onUpdateAdvancedKaiwaQuestion?: (id: string, data: Partial<KaiwaAdvancedQuestionFormData>) => Promise<boolean>;
  onDeleteAdvancedKaiwaQuestion?: (id: string) => Promise<boolean>;
}

export function CardsPage({
  cards, onAddCard, onUpdateCard, onDeleteCard,
  getLessonsByLevel, getChildLessons, onAddLesson, onUpdateLesson, onDeleteLesson,
  currentUser,
  jlptQuestions, onAddJLPTQuestion, onUpdateJLPTQuestion, onDeleteJLPTQuestion,
  onAddJLPTFolder, onUpdateJLPTFolder, onDeleteJLPTFolder,
  getFoldersByLevelAndCategory, getQuestionsByFolder,
  users, onUpdateUserRole, onDeleteUser, onUpdateVipExpiration, onRegister,
  onToggleLock, onToggleHide,
  onNavigateToLectureEditor,
  kaiwaQuestions = [], kaiwaFolders = [],
  onAddKaiwaQuestion, onUpdateKaiwaQuestion, onDeleteKaiwaQuestion,
  onAddKaiwaFolder, onUpdateKaiwaFolder, onDeleteKaiwaFolder,
  getFoldersByLevelAndTopic, getQuestionsByKaiwaFolder,
  // Advanced Kaiwa Topics
  advancedKaiwaTopics = [], advancedKaiwaQuestions = [],
  onAddAdvancedKaiwaTopic, onUpdateAdvancedKaiwaTopic, onDeleteAdvancedKaiwaTopic,
  onAddAdvancedKaiwaQuestion, onUpdateAdvancedKaiwaQuestion, onDeleteAdvancedKaiwaQuestion,
}: CardsPageProps) {
  const isSuperAdmin = currentUser.role === 'super_admin';
  const [activeTab, setActiveTab] = useState<ManagementTab>('flashcards');

  // Lectures hook
  const {
    lectures, loading: lecturesLoading,
    deleteLecture, toggleHide: toggleLectureHide,
    addFolder: addLectureFolder, updateFolder: updateLectureFolder,
    deleteFolder: deleteLectureFolder,
    getFoldersByLevel: getLectureFoldersByLevel, getLecturesByFolder,
  } = useLectures(true);

  // Test templates hook
  const {
    templates: testTemplates, folders: testFolders, loading: testTemplatesLoading,
    createFolder: createTestFolder, updateFolder: updateTestFolder, deleteFolder: deleteTestFolder,
    createTemplate, updateTemplate, deleteTemplate,
    getFoldersByLevelAndType, getTemplatesByFolder,
  } = useTestTemplates();

  // Custom topics hook
  const {
    topics: customTopics, folders: customTopicFolders, questions: customTopicQuestions,
    addCustomTopic, updateCustomTopic, deleteCustomTopic,
    addCustomTopicFolder, updateCustomTopicFolder, deleteCustomTopicFolder,
    addCustomTopicQuestion, updateCustomTopicQuestion, deleteCustomTopicQuestion,
  } = useCustomTopics();

  // Filter visible users based on role
  const visibleUsers = isSuperAdmin
    ? users
    : users.filter(u => u.role === 'user' || u.role === 'vip_user');

  return (
    <div className="cards-page">
      <div className="page-header">
        <h2>Quản Lí</h2>
        <div className="tab-buttons">
          <button className={`tab-btn ${activeTab === 'flashcards' ? 'active' : ''}`} onClick={() => setActiveTab('flashcards')}>Flash Card</button>
          <button className={`tab-btn ${activeTab === 'lectures' ? 'active' : ''}`} onClick={() => setActiveTab('lectures')}>Bài giảng ({lectures.length})</button>
          <button className={`tab-btn ${activeTab === 'jlpt' ? 'active' : ''}`} onClick={() => setActiveTab('jlpt')}>JLPT</button>
          <button className={`tab-btn ${activeTab === 'kaiwa' ? 'active' : ''}`} onClick={() => setActiveTab('kaiwa')}>Kaiwa ({kaiwaQuestions.length})</button>
          <button className={`tab-btn ${activeTab === 'custom_topics' ? 'active' : ''}`} onClick={() => setActiveTab('custom_topics')}>Chủ đề ({customTopics.length})</button>
          <button className={`tab-btn ${activeTab === 'game' ? 'active' : ''}`} onClick={() => setActiveTab('game')}>Game</button>
          <button className={`tab-btn ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => setActiveTab('assignments')}>Bài tập</button>
          <button className={`tab-btn ${activeTab === 'tests' ? 'active' : ''}`} onClick={() => setActiveTab('tests')}>Bài kiểm tra ({testTemplates.length})</button>
          <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Tài khoản ({visibleUsers.length})</button>
        </div>
      </div>

      {/* Flashcards Tab */}
      {activeTab === 'flashcards' && (
        <FlashcardsTab
          cards={cards}
          onAddCard={onAddCard}
          onUpdateCard={onUpdateCard}
          onDeleteCard={onDeleteCard}
          getLessonsByLevel={getLessonsByLevel}
          getChildLessons={getChildLessons}
          onAddLesson={onAddLesson}
          onUpdateLesson={onUpdateLesson}
          onDeleteLesson={onDeleteLesson}
          onToggleLock={onToggleLock}
          onToggleHide={onToggleHide}
          currentUser={currentUser}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {/* Lectures Tab */}
      {activeTab === 'lectures' && (
        <LecturesTab
          lectures={lectures}
          loading={lecturesLoading}
          onDeleteLecture={deleteLecture}
          onToggleHide={toggleLectureHide}
          onAddFolder={addLectureFolder}
          onUpdateFolder={updateLectureFolder}
          onDeleteFolder={deleteLectureFolder}
          getFoldersByLevel={getLectureFoldersByLevel}
          getLecturesByFolder={getLecturesByFolder}
          onNavigateToEditor={onNavigateToLectureEditor}
          currentUser={currentUser}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {/* JLPT Tab */}
      {activeTab === 'jlpt' && (
        <JLPTTab
          questions={jlptQuestions}
          onAddQuestion={onAddJLPTQuestion}
          onUpdateQuestion={onUpdateJLPTQuestion}
          onDeleteQuestion={onDeleteJLPTQuestion}
          onAddFolder={onAddJLPTFolder}
          onUpdateFolder={onUpdateJLPTFolder}
          onDeleteFolder={onDeleteJLPTFolder}
          getFoldersByLevelAndCategory={getFoldersByLevelAndCategory}
          getQuestionsByFolder={getQuestionsByFolder}
          currentUser={currentUser}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {/* Kaiwa Tab */}
      {activeTab === 'kaiwa' && (
        <KaiwaTab
          questions={kaiwaQuestions}
          folders={kaiwaFolders}
          onAddQuestion={onAddKaiwaQuestion}
          onUpdateQuestion={onUpdateKaiwaQuestion}
          onDeleteQuestion={onDeleteKaiwaQuestion}
          onAddFolder={onAddKaiwaFolder}
          onUpdateFolder={onUpdateKaiwaFolder}
          onDeleteFolder={onDeleteKaiwaFolder}
          getFoldersByLevelAndTopic={getFoldersByLevelAndTopic}
          getQuestionsByFolder={getQuestionsByKaiwaFolder}
          // Advanced Topics
          advancedTopics={advancedKaiwaTopics}
          advancedQuestions={advancedKaiwaQuestions}
          onAddAdvancedTopic={onAddAdvancedKaiwaTopic}
          onUpdateAdvancedTopic={onUpdateAdvancedKaiwaTopic}
          onDeleteAdvancedTopic={onDeleteAdvancedKaiwaTopic}
          onAddAdvancedQuestion={onAddAdvancedKaiwaQuestion}
          onUpdateAdvancedQuestion={onUpdateAdvancedKaiwaQuestion}
          onDeleteAdvancedQuestion={onDeleteAdvancedKaiwaQuestion}
          currentUser={currentUser}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {/* Custom Topics Tab */}
      {activeTab === 'custom_topics' && (
        <CustomTopicsTab
          topics={customTopics}
          folders={customTopicFolders}
          questions={customTopicQuestions}
          currentUser={currentUser}
          isSuperAdmin={isSuperAdmin}
          onAddTopic={(data) => addCustomTopic(data, currentUser.id)}
          onUpdateTopic={updateCustomTopic}
          onDeleteTopic={deleteCustomTopic}
          onAddFolder={(topicId, name) => addCustomTopicFolder(topicId, name, currentUser.id)}
          onUpdateFolder={updateCustomTopicFolder}
          onDeleteFolder={deleteCustomTopicFolder}
          onAddQuestion={(data) => addCustomTopicQuestion(data, currentUser.id)}
          onUpdateQuestion={updateCustomTopicQuestion}
          onDeleteQuestion={deleteCustomTopicQuestion}
        />
      )}

      {/* Game Tab */}
      {activeTab === 'game' && (
        <GameTab />
      )}

      {/* Assignments Tab (placeholder) */}
      {activeTab === 'assignments' && (
        <div className="assignments-tab-content">
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <h3>Quản lý bài tập</h3>
            <p>Tính năng đang được phát triển</p>
          </div>
        </div>
      )}

      {/* Tests Tab */}
      {activeTab === 'tests' && (
        <TestBankPanel
          templates={testTemplates}
          folders={testFolders}
          loading={testTemplatesLoading}
          onCreate={(data) => createTemplate(data, currentUser.id)}
          onUpdate={updateTemplate}
          onDelete={deleteTemplate}
          onCreateFolder={(name, level, type) => createTestFolder(name, level, type, currentUser.id)}
          onUpdateFolder={updateTestFolder}
          onDeleteFolder={deleteTestFolder}
          getFoldersByLevelAndType={getFoldersByLevelAndType}
          getTemplatesByFolder={getTemplatesByFolder}
          flashcards={cards}
          jlptQuestions={jlptQuestions}
          currentUserId={currentUser.id}
        />
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <UsersTab
          users={users}
          currentUser={currentUser}
          isSuperAdmin={isSuperAdmin}
          onUpdateRole={onUpdateUserRole}
          onDeleteUser={onDeleteUser}
          onUpdateVipExpiration={onUpdateVipExpiration}
          onRegister={onRegister}
        />
      )}
    </div>
  );
}
