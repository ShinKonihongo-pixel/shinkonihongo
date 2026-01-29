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
import { useGrammarCards } from '../../hooks/use-grammar-cards';
import { useGrammarLessons } from '../../hooks/use-grammar-lessons';
import { TestBankPanel } from '../classroom/test-bank-panel';
import {
  importLesson,
  importFlashcard,
  importGrammarCard,
  importJLPTFolder,
  importJLPTQuestion,
} from '../../services/firestore';
import {
  VocabularyTab,
  GrammarTab,
  ReadingTab,
  LecturesTab,
  JLPTTab,
  KaiwaTab,
  GameTab,
  UsersTab,
  ExercisesTab,
  type ManagementTab,
} from '../cards-management';
import { useExercises } from '../../hooks/use-exercises';
import { useReading } from '../../hooks/use-reading';

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
  jlptFolders: JLPTFolder[];
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
  onReorderLessons: (reorderedLessons: { id: string; order: number }[]) => Promise<void>;
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
  lessons, getLessonsByLevel, getChildLessons, onAddLesson, onUpdateLesson, onDeleteLesson,
  currentUser,
  jlptQuestions, jlptFolders, onAddJLPTQuestion, onUpdateJLPTQuestion, onDeleteJLPTQuestion,
  onAddJLPTFolder, onUpdateJLPTFolder, onDeleteJLPTFolder,
  getFoldersByLevelAndCategory, getQuestionsByFolder,
  users, onUpdateUserRole, onDeleteUser, onUpdateVipExpiration, onRegister,
  onToggleLock, onToggleHide, onReorderLessons,
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
  const [activeTab, setActiveTab] = useState<ManagementTab>('vocabulary');

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

  // Grammar cards hook
  const {
    grammarCards,
    addGrammarCard,
    updateGrammarCard,
    deleteGrammarCard,
  } = useGrammarCards();

  // Grammar lessons hook (separate from vocabulary lessons)
  const {
    lessons: grammarLessons,
    getParentLessonsByLevel: getGrammarParentLessonsByLevel,
    getChildLessons: getGrammarChildLessons,
    hasChildren: grammarHasChildren,
    getLessonCountByLevel: getGrammarLessonCountByLevel,
    addLesson: addGrammarLesson,
    updateLesson: updateGrammarLesson,
    deleteLesson: deleteGrammarLesson,
    seedLessons: seedGrammarLessons,
    reorderLessons: reorderGrammarLessons,
  } = useGrammarLessons();

  // Reading passages hook
  const {
    passages: readingPassages,
    folders: readingFolders,
    addPassage: addReadingPassage,
    updatePassage: updateReadingPassage,
    deletePassage: deleteReadingPassage,
    addFolder: addReadingFolder,
    updateFolder: updateReadingFolder,
    deleteFolder: deleteReadingFolder,
    getFoldersByLevel: getReadingFoldersByLevel,
    getPassagesByFolder: getReadingPassagesByFolder,
  } = useReading();

  // Exercises hook
  const {
    exercises,
    addExercise,
    updateExercise,
    deleteExercise,
    togglePublish,
  } = useExercises();

  // Filter visible users based on role
  const visibleUsers = isSuperAdmin
    ? users
    : users.filter(u => u.role === 'user' || u.role === 'vip_user');

  return (
    <div className="cards-page">
      <div className="page-header">
        <h2>Quản Lí</h2>
        <div className="tab-buttons">
          <button className={`tab-btn ${activeTab === 'vocabulary' ? 'active' : ''}`} onClick={() => setActiveTab('vocabulary')}>Từ Vựng ({cards.length})</button>
          <button className={`tab-btn ${activeTab === 'grammar' ? 'active' : ''}`} onClick={() => setActiveTab('grammar')}>Ngữ Pháp ({grammarCards.length})</button>
          <button className={`tab-btn ${activeTab === 'reading' ? 'active' : ''}`} onClick={() => setActiveTab('reading')}>Đọc Hiểu ({readingPassages.length})</button>
          <button className={`tab-btn ${activeTab === 'lectures' ? 'active' : ''}`} onClick={() => setActiveTab('lectures')}>Bài giảng ({lectures.length})</button>
          <button className={`tab-btn ${activeTab === 'jlpt' ? 'active' : ''}`} onClick={() => setActiveTab('jlpt')}>JLPT</button>
          <button className={`tab-btn ${activeTab === 'kaiwa' ? 'active' : ''}`} onClick={() => setActiveTab('kaiwa')}>Kaiwa ({kaiwaQuestions.length})</button>
          <button className={`tab-btn ${activeTab === 'game' ? 'active' : ''}`} onClick={() => setActiveTab('game')}>Game</button>
          <button className={`tab-btn ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => setActiveTab('assignments')}>Bài tập ({exercises.length})</button>
          <button className={`tab-btn ${activeTab === 'tests' ? 'active' : ''}`} onClick={() => setActiveTab('tests')}>Bài kiểm tra ({testTemplates.length})</button>
          <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Tài khoản ({visibleUsers.length})</button>
        </div>
      </div>

      {/* Vocabulary Tab */}
      {activeTab === 'vocabulary' && (
        <VocabularyTab
          cards={cards}
          onAddCard={onAddCard}
          onUpdateCard={onUpdateCard}
          onDeleteCard={onDeleteCard}
          lessons={lessons}
          getLessonsByLevel={getLessonsByLevel}
          getChildLessons={getChildLessons}
          onAddLesson={onAddLesson}
          onUpdateLesson={onUpdateLesson}
          onDeleteLesson={onDeleteLesson}
          onToggleLock={onToggleLock}
          onToggleHide={onToggleHide}
          onReorderLessons={onReorderLessons}
          onImportLesson={importLesson}
          onImportFlashcard={importFlashcard}
          grammarCards={grammarCards}
          currentUser={currentUser}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {/* Grammar Tab */}
      {activeTab === 'grammar' && (
        <GrammarTab
          grammarCards={grammarCards}
          onAddGrammarCard={addGrammarCard}
          onUpdateGrammarCard={updateGrammarCard}
          onDeleteGrammarCard={deleteGrammarCard}
          grammarLessons={grammarLessons}
          getParentLessonsByLevel={getGrammarParentLessonsByLevel}
          getChildLessons={getGrammarChildLessons}
          hasChildren={grammarHasChildren}
          getLessonCountByLevel={getGrammarLessonCountByLevel}
          onAddLesson={addGrammarLesson}
          onUpdateLesson={updateGrammarLesson}
          onDeleteLesson={deleteGrammarLesson}
          onSeedLessons={seedGrammarLessons}
          onReorderLessons={reorderGrammarLessons}
          onImportGrammarCard={importGrammarCard}
          vocabularyCards={cards}
          currentUser={currentUser}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {/* Reading Tab */}
      {activeTab === 'reading' && (
        <ReadingTab
          passages={readingPassages}
          folders={readingFolders}
          onAddPassage={addReadingPassage}
          onUpdatePassage={updateReadingPassage}
          onDeletePassage={deleteReadingPassage}
          onAddFolder={addReadingFolder}
          onUpdateFolder={updateReadingFolder}
          onDeleteFolder={deleteReadingFolder}
          getFoldersByLevel={getReadingFoldersByLevel}
          getPassagesByFolder={getReadingPassagesByFolder}
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
          folders={jlptFolders}
          onAddQuestion={onAddJLPTQuestion}
          onUpdateQuestion={onUpdateJLPTQuestion}
          onDeleteQuestion={onDeleteJLPTQuestion}
          onAddFolder={onAddJLPTFolder}
          onUpdateFolder={onUpdateJLPTFolder}
          onDeleteFolder={onDeleteJLPTFolder}
          getFoldersByLevelAndCategory={getFoldersByLevelAndCategory}
          getQuestionsByFolder={getQuestionsByFolder}
          onImportFolder={importJLPTFolder}
          onImportQuestion={importJLPTQuestion}
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
          // Custom Topics (moved from separate tab)
          customTopics={customTopics}
          customTopicFolders={customTopicFolders}
          customTopicQuestions={customTopicQuestions}
          onAddCustomTopic={(data) => addCustomTopic(data, currentUser.id)}
          onUpdateCustomTopic={updateCustomTopic}
          onDeleteCustomTopic={deleteCustomTopic}
          onAddCustomTopicFolder={(topicId, name, level) => addCustomTopicFolder(topicId, name, currentUser.id, level)}
          onUpdateCustomTopicFolder={updateCustomTopicFolder}
          onDeleteCustomTopicFolder={deleteCustomTopicFolder}
          onAddCustomTopicQuestion={(data) => addCustomTopicQuestion(data, currentUser.id)}
          onUpdateCustomTopicQuestion={updateCustomTopicQuestion}
          onDeleteCustomTopicQuestion={deleteCustomTopicQuestion}
          // Flashcard lessons for custom topic linking
          lessons={lessons}
          getLessonsByLevel={getLessonsByLevel}
          currentUser={currentUser}
          isSuperAdmin={isSuperAdmin}
        />
      )}


      {/* Game Tab */}
      {activeTab === 'game' && (
        <GameTab />
      )}

      {/* Assignments/Exercises Tab */}
      {activeTab === 'assignments' && (
        <ExercisesTab
          exercises={exercises}
          flashcards={cards}
          getLessonsByLevel={getLessonsByLevel}
          getChildLessons={getChildLessons}
          onAddExercise={addExercise}
          onUpdateExercise={updateExercise}
          onDeleteExercise={deleteExercise}
          onTogglePublish={togglePublish}
          currentUser={currentUser}
          isSuperAdmin={isSuperAdmin}
        />
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
