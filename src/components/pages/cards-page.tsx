// Cards Management Page - Unified management interface
// Modular architecture with separate tab components

import { useState } from 'react';
import type { JLPTLevel } from '../../types/flashcard';
import { useUserData } from '../../contexts/user-data-context';
import { useFlashcardData } from '../../contexts/flashcard-data-context';
import { useJLPTData } from '../../contexts/jlpt-data-context';
import { useLessonFiltering } from '../../hooks/use-lesson-filtering';
import { useNavigation } from '../../contexts/navigation-context';
import { useLectures } from '../../hooks/use-lectures';
import { useTestTemplates } from '../../hooks/use-classrooms';
import { useCustomTopics } from '../../hooks/use-custom-topics';
import { useGrammarCards } from '../../hooks/use-grammar-cards';
import { useGrammarLessons } from '../../hooks/use-grammar-lessons';
import { useKanjiCards } from '../../hooks/use-kanji-cards';
import { useKanjiLessons } from '../../hooks/use-kanji-lessons';
import { TestBankPanel } from '../classroom/test-bank';
import {
  importLesson,
  importFlashcard,
  importGrammarCard,
  importKanjiCard,
  importJLPTFolder,
  importJLPTQuestion,
} from '../../services/firestore';
import {
  VocabularyTab,
  GrammarTab,
  KanjiTab,
  ReadingTab,
  ListeningTab,
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
import { useListening } from '../../hooks/use-listening';
import { RolePermissionsPage } from './role-permissions-page';
import '../cards-management/cards-management.css';

export function CardsPage() {
  const { currentUser, users, register, updateUserRole, deleteUser, updateVipExpiration } = useUserData();
  const { cards, addCard, updateCard, deleteCard, lessons, addLesson, updateLesson, deleteLesson, toggleLock, toggleLessonHide, reorderLessons } = useFlashcardData();
  const { filteredGetLessonsByLevel: getLessonsByLevel, filteredGetChildLessons: getChildLessons } = useLessonFiltering();
  const {
    jlptQuestions, jlptFolders,
    addJLPTQuestion, updateJLPTQuestion, deleteJLPTQuestion,
    addJLPTFolder, updateJLPTFolder, deleteJLPTFolder,
    getFoldersByLevelAndCategory, getQuestionsByFolder,
    kaiwaQuestions, kaiwaFolders,
    addKaiwaQuestion, updateKaiwaQuestion, deleteKaiwaQuestion,
    addKaiwaFolder, updateKaiwaFolder, deleteKaiwaFolder,
    getFoldersByLevelAndTopic, getQuestionsByKaiwaFolder,
    advancedKaiwaTopics, advancedKaiwaQuestions,
    addAdvancedKaiwaTopic, updateAdvancedKaiwaTopic, deleteAdvancedKaiwaTopic,
    addAdvancedKaiwaQuestion, updateAdvancedKaiwaQuestion, deleteAdvancedKaiwaQuestion,
  } = useJLPTData();
  const nav = useNavigation();
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

  // Kanji cards hook
  const {
    kanjiCards,
    addKanjiCard,
    updateKanjiCard,
    deleteKanjiCard,
    seedKanjiCards,
    refreshKanjiFromSeed,
    getKanjiSeedCount,
  } = useKanjiCards();

  // Kanji lessons hook
  const {
    lessons: kanjiLessons,
    getParentLessonsByLevel: getKanjiParentLessonsByLevel,
    getChildLessons: getKanjiChildLessons,
    hasChildren: kanjiHasChildren,
    addLesson: addKanjiLesson,
    updateLesson: updateKanjiLesson,
    deleteLesson: deleteKanjiLesson,
    seedLessons: seedKanjiLessons,
    reorderLessons: reorderKanjiLessons,
  } = useKanjiLessons();

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

  // Listening hook
  const {
    audios: listeningAudios,
    folders: listeningFolders,
    addAudio: addListeningAudio,
    addTextAudio: addListeningTextAudio,
    updateAudio: updateListeningAudio,
    deleteAudio: deleteListeningAudio,
    addFolder: addListeningFolder,
    updateFolder: updateListeningFolder,
    deleteFolder: deleteListeningFolder,
    getFoldersByLevel: getListeningFoldersByLevel,
    getFoldersByLevelAndType: getListeningFoldersByLevelAndType,
    getFoldersByLevelLessonAndType: getListeningFoldersByLevelLessonAndType,
    getAudiosByFolder: getListeningAudiosByFolder,
    getAudioUrl: getListeningAudioUrl,
  } = useListening();

  if (!currentUser) return null;

  const isSuperAdmin = currentUser.role === 'super_admin';

  // Wrapper callbacks — align prop names used in JSX with hook returns
  const onAddCard = addCard;
  const onUpdateCard = updateCard;
  const onDeleteCard = deleteCard;
  const onUpdateLesson = updateLesson;
  const onDeleteLesson = deleteLesson;
  const onToggleLock = toggleLock;
  const onToggleHide = toggleLessonHide;
  const onReorderLessons = reorderLessons;
  const onUpdateJLPTQuestion = updateJLPTQuestion;
  const onDeleteJLPTQuestion = deleteJLPTQuestion;
  const onUpdateJLPTFolder = updateJLPTFolder;
  const onDeleteJLPTFolder = deleteJLPTFolder;
  const onUpdateKaiwaQuestion = updateKaiwaQuestion;
  const onDeleteKaiwaQuestion = deleteKaiwaQuestion;
  const onUpdateKaiwaFolder = updateKaiwaFolder;
  const onDeleteKaiwaFolder = deleteKaiwaFolder;
  const onAddAdvancedKaiwaTopic = addAdvancedKaiwaTopic;
  const onUpdateAdvancedKaiwaTopic = updateAdvancedKaiwaTopic;
  const onDeleteAdvancedKaiwaTopic = deleteAdvancedKaiwaTopic;
  const onAddAdvancedKaiwaQuestion = addAdvancedKaiwaQuestion;
  const onUpdateAdvancedKaiwaQuestion = updateAdvancedKaiwaQuestion;
  const onDeleteAdvancedKaiwaQuestion = deleteAdvancedKaiwaQuestion;
  const onUpdateUserRole = updateUserRole;
  const onDeleteUser = deleteUser;
  const onUpdateVipExpiration = updateVipExpiration;
  const onRegister = register;

  const onAddLesson = async (name: string, level: JLPTLevel, parentId?: string | null) => {
    await addLesson(name, level, parentId ?? null, currentUser.id);
  };
  const onAddJLPTQuestion = async (data: Parameters<typeof addJLPTQuestion>[0]) => {
    await addJLPTQuestion(data, currentUser.id);
  };
  const onAddJLPTFolder = async (name: string, level: Parameters<typeof addJLPTFolder>[1], category: Parameters<typeof addJLPTFolder>[2]) => {
    await addJLPTFolder(name, level, category, currentUser.id);
  };
  const onAddKaiwaQuestion = async (data: Parameters<typeof addKaiwaQuestion>[0]) => {
    const r = await addKaiwaQuestion(data, currentUser.id);
    if (!r) throw new Error('Failed');
    return r;
  };
  const onAddKaiwaFolder = async (name: string, level: Parameters<typeof addKaiwaFolder>[1], topic: Parameters<typeof addKaiwaFolder>[2]) => {
    const r = await addKaiwaFolder(name, level as any, topic, currentUser.id);
    if (!r) throw new Error('Failed');
    return r;
  };
  const onNavigateToLectureEditor = (lectureId?: string, folderId?: string, level?: JLPTLevel) => {
    nav.setEditingLectureId(lectureId);
    nav.setEditingLectureFolderId(folderId);
    nav.setEditingLectureLevel(level);
    nav.setCurrentPage('lecture-editor');
  };

  return (
    <div className="cards-page">
      <div className="page-header">
        <h2>Quản Lí</h2>
        <div className="tab-buttons">
          <button className={`tab-btn ${activeTab === 'vocabulary' ? 'active' : ''}`} onClick={() => setActiveTab('vocabulary')}>Từ Vựng</button>
          <button className={`tab-btn ${activeTab === 'grammar' ? 'active' : ''}`} onClick={() => setActiveTab('grammar')}>Ngữ Pháp</button>
          <button className={`tab-btn ${activeTab === 'kanji' ? 'active' : ''}`} onClick={() => setActiveTab('kanji')}>Hán Tự</button>
          <button className={`tab-btn ${activeTab === 'reading' ? 'active' : ''}`} onClick={() => setActiveTab('reading')}>Đọc Hiểu</button>
          <button className={`tab-btn ${activeTab === 'listening' ? 'active' : ''}`} onClick={() => setActiveTab('listening')}>Nghe Hiểu</button>
          <button className={`tab-btn ${activeTab === 'lectures' ? 'active' : ''}`} onClick={() => setActiveTab('lectures')}>Bài giảng</button>
          <button className={`tab-btn ${activeTab === 'jlpt' ? 'active' : ''}`} onClick={() => setActiveTab('jlpt')}>JLPT</button>
          <button className={`tab-btn ${activeTab === 'kaiwa' ? 'active' : ''}`} onClick={() => setActiveTab('kaiwa')}>Kaiwa</button>
          <button className={`tab-btn ${activeTab === 'game' ? 'active' : ''}`} onClick={() => setActiveTab('game')}>Game</button>
          <button className={`tab-btn ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => setActiveTab('assignments')}>Bài tập</button>
          <button className={`tab-btn ${activeTab === 'tests' ? 'active' : ''}`} onClick={() => setActiveTab('tests')}>Bài kiểm tra</button>
          <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Tài khoản</button>
          {isSuperAdmin && (
            <button className={`tab-btn ${activeTab === 'permissions' ? 'active' : ''}`} onClick={() => setActiveTab('permissions')}>Phân quyền</button>
          )}
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

      {/* Kanji Tab */}
      {activeTab === 'kanji' && (
        <KanjiTab
          kanjiCards={kanjiCards}
          onAddKanjiCard={addKanjiCard}
          onUpdateKanjiCard={updateKanjiCard}
          onDeleteKanjiCard={deleteKanjiCard}
          kanjiLessons={kanjiLessons}
          getParentLessonsByLevel={getKanjiParentLessonsByLevel}
          getChildLessons={getKanjiChildLessons}
          hasChildren={kanjiHasChildren}
          onAddLesson={addKanjiLesson}
          onUpdateLesson={updateKanjiLesson}
          onDeleteLesson={deleteKanjiLesson}
          onSeedLessons={seedKanjiLessons}
          onReorderLessons={reorderKanjiLessons}
          onImportKanjiCard={importKanjiCard}
          onSeedKanjiCards={seedKanjiCards}
          onRefreshKanjiFromSeed={refreshKanjiFromSeed}
          getKanjiSeedCount={getKanjiSeedCount}
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

      {/* Listening Tab */}
      {activeTab === 'listening' && (
        <ListeningTab
          audios={listeningAudios}
          folders={listeningFolders}
          onAddAudio={async (data, file) => { await addListeningAudio(data, file, currentUser.id); }}
          onAddTextAudio={async (data) => { await addListeningTextAudio(data, currentUser.id); }}
          onUpdateAudio={updateListeningAudio}
          onDeleteAudio={deleteListeningAudio}
          onAddFolder={async (name, level, lessonType, lessonNumber) => { await addListeningFolder(name, level, lessonType, lessonNumber, currentUser.id); }}
          onUpdateFolder={updateListeningFolder}
          onDeleteFolder={deleteListeningFolder}
          getFoldersByLevel={getListeningFoldersByLevel}
          getFoldersByLevelAndType={getListeningFoldersByLevelAndType}
          getFoldersByLevelLessonAndType={getListeningFoldersByLevelLessonAndType}
          getAudiosByFolder={getListeningAudiosByFolder}
          getAudioUrl={getListeningAudioUrl}
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
          // Grammar lessons for custom topic linking
          grammarLessons={grammarLessons}
          getGrammarLessonsByLevel={getGrammarParentLessonsByLevel}
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

      {/* Permissions Tab — super_admin only */}
      {activeTab === 'permissions' && isSuperAdmin && (
        <RolePermissionsPage />
      )}
    </div>
  );
}
