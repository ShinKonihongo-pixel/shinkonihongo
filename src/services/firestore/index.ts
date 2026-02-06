// Firestore services - modular re-exports
// Each service handles a specific domain for maintainability

// Shared constants and utilities
export { COLLECTIONS, getTodayISO, mapDoc } from './collections';

// Flashcard operations
export {
  getAllFlashcards,
  subscribeToFlashcards,
  addFlashcard,
  updateFlashcard,
  deleteFlashcard,
  deleteAllFlashcards,
  deleteFlashcardsByLevel,
  deleteFlashcardsByLesson,
  importFlashcard,
} from './flashcard-service';

// Grammar card operations
export {
  subscribeToGrammarCards,
  addGrammarCard,
  updateGrammarCard,
  deleteGrammarCard,
  deleteGrammarCardsByLesson,
  importGrammarCard,
} from './grammar-card-service';

// Grammar lesson operations
export {
  getAllGrammarLessons,
  subscribeToGrammarLessons,
  addGrammarLesson,
  updateGrammarLesson,
  deleteGrammarLesson,
  getGrammarLessonChildren,
} from './grammar-lesson-service';

// Lesson operations
export {
  getAllLessons,
  subscribeToLessons,
  addLesson,
  updateLesson,
  deleteLesson,
  importLesson,
} from './lesson-service';

// User & settings operations
export {
  getAllUsers,
  subscribeToUsers,
  getUserByUsername,
  addUser,
  updateUser,
  deleteUser,
  getUserSettings,
  saveUserSettings,
} from './user-service';

// JLPT question operations
export {
  getAllJLPTQuestions,
  subscribeToJLPTQuestions,
  addJLPTQuestion,
  updateJLPTQuestion,
  deleteJLPTQuestion,
  importJLPTQuestion,
} from './jlpt-question-service';

// JLPT folder operations
export {
  subscribeToJLPTFolders,
  addJLPTFolder,
  updateJLPTFolder,
  deleteJLPTFolder,
  importJLPTFolder,
} from './jlpt-folder-service';

// Session operations (study, game, JLPT)
export {
  addStudySession,
  getStudySessionsByUser,
  addGameSession,
  getGameSessionsByUser,
  addJLPTSession,
  getJLPTSessionsByUser,
} from './session-service';

// Kaiwa question operations
export {
  subscribeToKaiwaQuestions,
  addKaiwaQuestion,
  updateKaiwaQuestion,
  deleteKaiwaQuestion,
} from './kaiwa-question-service';

// Kaiwa folder operations
export {
  subscribeToKaiwaFolders,
  addKaiwaFolder,
  updateKaiwaFolder,
  deleteKaiwaFolder,
} from './kaiwa-folder-service';

// Custom topic operations
export {
  subscribeToCustomTopics,
  addCustomTopic,
  updateCustomTopic,
  deleteCustomTopic,
  subscribeToCustomTopicFolders,
  addCustomTopicFolder,
  updateCustomTopicFolder,
  deleteCustomTopicFolder,
  subscribeToCustomTopicQuestions,
  addCustomTopicQuestion,
  updateCustomTopicQuestion,
  deleteCustomTopicQuestion,
} from './custom-topic-service';

// Kanji analysis operations
export {
  getKanjiAnalysis,
  getMultipleKanjiAnalysis,
  saveKanjiAnalysis,
  saveMultipleKanjiAnalysis,
} from './kanji-analysis-service';

// Vocabulary notes operations
export {
  getVocabularyNote,
  saveVocabularyNote,
  deleteVocabularyNote,
} from './vocabulary-notes-service';

// Kanji card operations
export {
  subscribeToKanjiCards,
  addKanjiCard,
  updateKanjiCard,
  deleteKanjiCard,
  deleteKanjiCardsByLesson,
  importKanjiCard,
} from './kanji-card-service';

// Kanji lesson operations
export {
  getAllKanjiLessons,
  subscribeToKanjiLessons,
  addKanjiLesson,
  updateKanjiLesson,
  deleteKanjiLesson,
  getKanjiLessonChildren,
} from './kanji-lesson-service';
