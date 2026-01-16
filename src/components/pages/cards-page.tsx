// Cards management page with Level → Parent Lesson → Child Lesson → Flashcard structure
// Also includes JLPT question management, user management, lesson locking, and lectures

import { useState } from 'react';
import type { Flashcard, FlashcardFormData, Lesson, JLPTLevel } from '../../types/flashcard';
import type { CurrentUser, User, UserRole } from '../../types/user';
import type { JLPTQuestion, JLPTQuestionFormData, JLPTLevel as JLPTQuestionLevel, QuestionCategory, JLPTAnswer, JLPTFolder } from '../../types/jlpt-question';
import type { Lecture, LectureFolder } from '../../types/lecture';
import type { KaiwaDefaultQuestion, KaiwaQuestionFormData, KaiwaFolder } from '../../types/kaiwa-question';
import type { JLPTLevel as KaiwaJLPTLevel, ConversationTopic, ConversationStyle } from '../../types/kaiwa';
import { CONVERSATION_TOPICS, CONVERSATION_STYLES } from '../../constants/kaiwa';
import { FlashcardForm } from '../flashcard/flashcard-form';
import { FlashcardList } from '../flashcard/flashcard-list';
import { ConfirmModal } from '../ui/confirm-modal';
import { useLectures } from '../../hooks/use-lectures';
import { useTestTemplates } from '../../hooks/use-classrooms';
import { LectureCard } from '../lecture/lecture-card';
import { TestBankPanel } from '../classroom/test-bank-panel';

type ManagementTab = 'flashcards' | 'lectures' | 'jlpt' | 'kaiwa' | 'assignments' | 'tests' | 'users';

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
  // JLPT question management props
  jlptQuestions: JLPTQuestion[];
  onAddJLPTQuestion: (data: JLPTQuestionFormData) => Promise<void>;
  onUpdateJLPTQuestion: (id: string, data: Partial<JLPTQuestion>) => Promise<void>;
  onDeleteJLPTQuestion: (id: string) => Promise<void>;
  onAddJLPTFolder: (name: string, level: JLPTQuestionLevel, category: QuestionCategory) => Promise<void>;
  onUpdateJLPTFolder: (id: string, data: Partial<JLPTFolder>) => Promise<void>;
  onDeleteJLPTFolder: (id: string) => Promise<void>;
  getFoldersByLevelAndCategory: (level: JLPTQuestionLevel, category: QuestionCategory) => JLPTFolder[];
  getQuestionsByFolder: (folderId: string) => JLPTQuestion[];
  // User management props
  users: User[];
  onUpdateUserRole: (userId: string, role: UserRole) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateVipExpiration: (userId: string, expirationDate: string | undefined) => void;
  onRegister: (username: string, password: string, role: UserRole, createdBy?: string) => Promise<{ success: boolean; error?: string }>;
  // Lesson locking/hiding props
  onToggleLock: (lessonId: string) => void;
  onToggleHide: (lessonId: string) => void;
  // Lecture management props
  onNavigateToLectureEditor?: (lectureId?: string, folderId?: string, level?: JLPTLevel) => void;
  // Kaiwa default questions management props
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
}

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

// Navigation state: root → level → parentLesson → childLesson
type NavigationState =
  | { type: 'root' }
  | { type: 'level'; level: JLPTLevel }
  | { type: 'parentLesson'; level: JLPTLevel; lessonId: string; lessonName: string }
  | { type: 'childLesson'; level: JLPTLevel; parentId: string; parentName: string; lessonId: string; lessonName: string };

// JLPT Navigation state: root → level → category → folder → questions
type JLPTNavState =
  | { type: 'root' }
  | { type: 'level'; level: JLPTQuestionLevel }
  | { type: 'category'; level: JLPTQuestionLevel; category: QuestionCategory; categoryLabel: string }
  | { type: 'folder'; level: JLPTQuestionLevel; category: QuestionCategory; categoryLabel: string; folderId: string; folderName: string };

// Kaiwa Navigation state: root → level → topic → folder → questions
type KaiwaNavState =
  | { type: 'root' }
  | { type: 'level'; level: KaiwaJLPTLevel }
  | { type: 'topic'; level: KaiwaJLPTLevel; topic: ConversationTopic; topicLabel: string }
  | { type: 'folder'; level: KaiwaJLPTLevel; topic: ConversationTopic; topicLabel: string; folderId: string; folderName: string };

const JLPT_QUESTION_LEVELS: JLPTQuestionLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
const KAIWA_LEVELS: KaiwaJLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
const QUESTION_CATEGORIES: { value: QuestionCategory; label: string }[] = [
  { value: 'vocabulary', label: 'Từ vựng' },
  { value: 'grammar', label: 'Ngữ pháp' },
  { value: 'reading', label: 'Đọc hiểu' },
  { value: 'listening', label: 'Nghe' },
];

const defaultAnswers: JLPTAnswer[] = [
  { text: '', isCorrect: true },
  { text: '', isCorrect: false },
  { text: '', isCorrect: false },
  { text: '', isCorrect: false },
];

export function CardsPage({
  cards,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  getLessonsByLevel,
  getChildLessons,
  onAddLesson,
  onUpdateLesson,
  onDeleteLesson,
  currentUser,
  jlptQuestions,
  onAddJLPTQuestion,
  onUpdateJLPTQuestion,
  onDeleteJLPTQuestion,
  onAddJLPTFolder,
  onUpdateJLPTFolder,
  onDeleteJLPTFolder,
  getFoldersByLevelAndCategory,
  getQuestionsByFolder,
  // New props for user, lesson locking/hiding, and lectures management
  users,
  onUpdateUserRole,
  onDeleteUser,
  onUpdateVipExpiration,
  onRegister,
  onToggleLock,
  onToggleHide,
  onNavigateToLectureEditor,
  // Kaiwa management props
  kaiwaQuestions = [],
  kaiwaFolders: _kaiwaFolders = [],
  onAddKaiwaQuestion,
  onUpdateKaiwaQuestion,
  onDeleteKaiwaQuestion,
  onAddKaiwaFolder,
  onUpdateKaiwaFolder,
  onDeleteKaiwaFolder,
  getFoldersByLevelAndTopic,
  getQuestionsByKaiwaFolder,
}: CardsPageProps) {
  const isSuperAdmin = currentUser.role === 'super_admin';
  const [activeTab, setActiveTab] = useState<ManagementTab>('flashcards');

  // User management state
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [userError, setUserError] = useState('');
  const [deleteUserTarget, setDeleteUserTarget] = useState<User | null>(null);

  // Lectures management state with folder navigation
  const {
    lectures,
    loading: lecturesLoading,
    deleteLecture,
    toggleHide: toggleLectureHide,
    addFolder: addLectureFolder,
    updateFolder: updateLectureFolder,
    deleteFolder: deleteLectureFolderAction,
    getFoldersByLevel: getLectureFoldersByLevel,
    getLecturesByFolder,
  } = useLectures(true);

  // Test templates (test bank) with folder management
  const {
    templates: testTemplates,
    folders: testFolders,
    loading: testTemplatesLoading,
    createFolder: createTestFolder,
    updateFolder: updateTestFolder,
    deleteFolder: deleteTestFolder,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getFoldersByLevelAndType,
    getTemplatesByFolder,
  } = useTestTemplates();

  const [deleteLectureTarget, setDeleteLectureTarget] = useState<Lecture | null>(null);
  const [deleteLectureFolderTarget, setDeleteLectureFolderTarget] = useState<LectureFolder | null>(null);

  // Lecture navigation state (similar to flashcards)
  type LectureNavState =
    | { type: 'root' }
    | { type: 'level'; level: JLPTLevel }
    | { type: 'folder'; level: JLPTLevel; folderId: string; folderName: string };
  const [lectureNavState, setLectureNavState] = useState<LectureNavState>({ type: 'root' });
  const [addingLectureFolder, setAddingLectureFolder] = useState(false);
  const [newLectureFolderName, setNewLectureFolderName] = useState('');
  const [editingLectureFolderId, setEditingLectureFolderId] = useState<string | null>(null);
  const [editingLectureFolderName, setEditingLectureFolderName] = useState('');

  // Lecture breadcrumb
  const lectureBreadcrumb = (() => {
    const crumbs = ['Bài giảng'];
    if (lectureNavState.type === 'level' || lectureNavState.type === 'folder') {
      crumbs.push(lectureNavState.level);
    }
    if (lectureNavState.type === 'folder') {
      crumbs.push(lectureNavState.folderName);
    }
    return crumbs;
  })();

  // Lecture folder handlers
  const handleAddLectureFolder = async () => {
    if (!newLectureFolderName.trim() || lectureNavState.type !== 'level') return;
    await addLectureFolder(newLectureFolderName.trim(), lectureNavState.level, currentUser.id);
    setNewLectureFolderName('');
    setAddingLectureFolder(false);
  };

  const handleUpdateLectureFolder = async (folderId: string) => {
    if (!editingLectureFolderName.trim()) return;
    await updateLectureFolder(folderId, { name: editingLectureFolderName.trim() });
    setEditingLectureFolderId(null);
    setEditingLectureFolderName('');
  };

  const goBackLecture = () => {
    if (lectureNavState.type === 'folder') {
      setLectureNavState({ type: 'level', level: lectureNavState.level });
    } else if (lectureNavState.type === 'level') {
      setLectureNavState({ type: 'root' });
    }
  };

  // Get lecture count by level
  const getLectureCountByLevel = (level: JLPTLevel) => {
    return lectures.filter(l => l.jlptLevel === level).length;
  };

  // Get lecture count by folder
  const getLectureCountByFolder = (folderId: string) => {
    return lectures.filter(l => l.folderId === folderId).length;
  };

  // Can modify lecture folder
  const canModifyLectureFolder = (folder: LectureFolder) => {
    if (isSuperAdmin) return true;
    return folder.createdBy === currentUser.id;
  };

  // Check if user can hide a lecture (super_admin or creator)
  const canHideLecture = (lecture: Lecture) => {
    if (isSuperAdmin) return true;
    return lecture.authorId === currentUser.id;
  };

  // Filter users (Super Admin sees all, Admin sees only users and VIP)
  const visibleUsers = isSuperAdmin
    ? users
    : users.filter(u => u.role === 'user' || u.role === 'vip_user');

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onRegister(newUsername, newPassword, newRole, currentUser.id);
    if (result.success) {
      setNewUsername('');
      setNewPassword('');
      setNewRole('user');
      setUserError('');
      setShowAddUser(false);
    } else {
      setUserError(result.error || 'Thêm user thất bại');
    }
  };

  // Check if user can edit/delete a lesson (super_admin can modify all, admin only own)
  const canModifyLesson = (lesson: Lesson) => {
    if (isSuperAdmin) return true;
    return lesson.createdBy === currentUser.id;
  };

  // Check if user can edit/delete a card (super_admin can edit/delete all, admin only own)
  const canModifyCard = (card: Flashcard) => {
    if (isSuperAdmin) return true;
    return card.createdBy === currentUser.id;
  };
  const [navState, setNavState] = useState<NavigationState>({ type: 'root' });
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);

  // Lesson editing
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editingLessonName, setEditingLessonName] = useState('');
  const [addingLesson, setAddingLesson] = useState(false);
  const [newLessonName, setNewLessonName] = useState('');
  const [deleteLessonTarget, setDeleteLessonTarget] = useState<Lesson | null>(null);

  // JLPT Question state
  const [jlptNavState, setJlptNavState] = useState<JLPTNavState>({ type: 'root' });
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionFormData, setQuestionFormData] = useState<JLPTQuestionFormData>({
    level: 'N5',
    category: 'vocabulary',
    question: '',
    answers: [...defaultAnswers],
    explanation: '',
  });
  // JLPT Folder state
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<JLPTFolder | null>(null);
  const [deleteJLPTQuestionTarget, setDeleteJLPTQuestionTarget] = useState<JLPTQuestion | null>(null);

  // Kaiwa Question state
  const [kaiwaNavState, setKaiwaNavState] = useState<KaiwaNavState>({ type: 'root' });
  const [isAddingKaiwaQuestion, setIsAddingKaiwaQuestion] = useState(false);
  const [editingKaiwaQuestionId, setEditingKaiwaQuestionId] = useState<string | null>(null);
  const [kaiwaQuestionFormData, setKaiwaQuestionFormData] = useState<KaiwaQuestionFormData>({
    level: 'N5',
    topic: 'greetings',
    questionJa: '',
    questionVi: '',
    situationContext: '',
    suggestedAnswers: ['', ''],
    style: 'polite',
  });
  // Kaiwa Folder state
  const [isAddingKaiwaFolder, setIsAddingKaiwaFolder] = useState(false);
  const [newKaiwaFolderName, setNewKaiwaFolderName] = useState('');
  const [editingKaiwaFolderId, setEditingKaiwaFolderId] = useState<string | null>(null);
  const [editingKaiwaFolderName, setEditingKaiwaFolderName] = useState('');
  const [deleteKaiwaFolderTarget, setDeleteKaiwaFolderTarget] = useState<KaiwaFolder | null>(null);
  const [deleteKaiwaQuestionTarget, setDeleteKaiwaQuestionTarget] = useState<KaiwaDefaultQuestion | null>(null);

  const getCurrentLevel = (): JLPTLevel | null => {
    if (navState.type === 'root') return null;
    return navState.level;
  };

  const getCurrentLessonId = (): string | null => {
    if (navState.type === 'childLesson') return navState.lessonId;
    // Allow adding cards to parent lesson if no children
    if (navState.type === 'parentLesson' && getChildLessons(navState.lessonId).length === 0) {
      return navState.lessonId;
    }
    return null;
  };

  const handleSubmit = (data: FlashcardFormData) => {
    if (editingCard) {
      onUpdateCard(editingCard.id, data);
    } else {
      onAddCard(data, currentUser.id);
    }
    setShowForm(false);
    setEditingCard(null);
  };

  const handleEdit = (card: Flashcard) => {
    setEditingCard(card);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCard(null);
  };

  const handleAddLesson = () => {
    if (!newLessonName.trim()) return;

    if (navState.type === 'level') {
      // Add parent lesson (parentId = null)
      onAddLesson(newLessonName.trim(), navState.level, null, currentUser.id);
    } else if (navState.type === 'parentLesson') {
      // Add child lesson (parentId = current lesson)
      onAddLesson(newLessonName.trim(), navState.level, navState.lessonId, currentUser.id);
    }
    setNewLessonName('');
    setAddingLesson(false);
  };

  const handleUpdateLesson = (id: string) => {
    if (editingLessonName.trim()) {
      onUpdateLesson(id, editingLessonName.trim());
      setEditingLessonId(null);
      setEditingLessonName('');
    }
  };

  // JLPT Question handlers
  const canModifyQuestion = (question: JLPTQuestion) => {
    if (isSuperAdmin) return true;
    return question.createdBy === currentUser.id;
  };

  // JLPT Folder handlers
  const canModifyFolder = (folder: JLPTFolder) => {
    if (isSuperAdmin) return true;
    return folder.createdBy === currentUser.id;
  };

  // Get questions for current JLPT view (only in folder view)
  const getQuestionsForCurrentView = (): JLPTQuestion[] => {
    if (jlptNavState.type === 'folder') {
      return getQuestionsByFolder(jlptNavState.folderId);
    }
    // In category view without folders, show questions without folderId
    if (jlptNavState.type === 'category') {
      const folders = getFoldersByLevelAndCategory(jlptNavState.level, jlptNavState.category);
      if (folders.length === 0) {
        return jlptQuestions.filter(
          q => q.level === jlptNavState.level && q.category === jlptNavState.category && !q.folderId
        );
      }
    }
    return [];
  };

  // Get folders for current category
  const getFoldersForCurrentView = (): JLPTFolder[] => {
    if (jlptNavState.type !== 'category') return [];
    return getFoldersByLevelAndCategory(jlptNavState.level, jlptNavState.category);
  };

  // Check if category has folders
  const categoryHasFolders = (): boolean => {
    if (jlptNavState.type !== 'category') return false;
    return getFoldersByLevelAndCategory(jlptNavState.level, jlptNavState.category).length > 0;
  };

  // Count questions by level
  const getQuestionCountByLevel = (level: JLPTQuestionLevel) =>
    jlptQuestions.filter(q => q.level === level).length;

  // Count questions by level and category
  const getQuestionCountByCategory = (level: JLPTQuestionLevel, category: QuestionCategory) =>
    jlptQuestions.filter(q => q.level === level && q.category === category).length;

  // Count questions by folder
  const getQuestionCountByFolder = (folderId: string) =>
    jlptQuestions.filter(q => q.folderId === folderId).length;

  // JLPT breadcrumb
  const getJLPTBreadcrumb = (): string[] => {
    const crumbs: string[] = ['Tất cả'];
    if (jlptNavState.type === 'level') crumbs.push(jlptNavState.level);
    if (jlptNavState.type === 'category') crumbs.push(jlptNavState.level, jlptNavState.categoryLabel);
    if (jlptNavState.type === 'folder') crumbs.push(jlptNavState.level, jlptNavState.categoryLabel, jlptNavState.folderName);
    return crumbs;
  };

  // JLPT go back
  const jlptGoBack = () => {
    if (jlptNavState.type === 'level') {
      setJlptNavState({ type: 'root' });
    } else if (jlptNavState.type === 'category') {
      setJlptNavState({ type: 'level', level: jlptNavState.level });
    } else if (jlptNavState.type === 'folder') {
      setJlptNavState({
        type: 'category',
        level: jlptNavState.level,
        category: jlptNavState.category,
        categoryLabel: jlptNavState.categoryLabel,
      });
    }
    setIsAddingQuestion(false);
    setEditingQuestionId(null);
    setIsAddingFolder(false);
  };

  // Folder handlers
  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return;
    if (jlptNavState.type !== 'category') return;
    await onAddJLPTFolder(newFolderName.trim(), jlptNavState.level, jlptNavState.category);
    setNewFolderName('');
    setIsAddingFolder(false);
  };

  const handleUpdateFolder = async (id: string) => {
    if (editingFolderName.trim()) {
      await onUpdateJLPTFolder(id, { name: editingFolderName.trim() });
      setEditingFolderId(null);
      setEditingFolderName('');
    }
  };

  const resetQuestionForm = () => {
    setQuestionFormData({
      level: 'N5',
      category: 'vocabulary',
      question: '',
      answers: [...defaultAnswers],
      explanation: '',
    });
  };

  const handleAddQuestion = async () => {
    if (!questionFormData.question.trim()) return;
    if (questionFormData.answers.some(a => !a.text.trim())) return;
    await onAddJLPTQuestion(questionFormData);
    resetQuestionForm();
    setIsAddingQuestion(false);
  };

  const handleEditQuestion = (question: JLPTQuestion) => {
    setEditingQuestionId(question.id);
    setQuestionFormData({
      level: question.level,
      category: question.category,
      question: question.question,
      answers: [...question.answers],
      explanation: question.explanation || '',
    });
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestionId) return;
    await onUpdateJLPTQuestion(editingQuestionId, questionFormData);
    resetQuestionForm();
    setEditingQuestionId(null);
  };

  const handleCancelQuestion = () => {
    resetQuestionForm();
    setIsAddingQuestion(false);
    setEditingQuestionId(null);
  };

  const handleAnswerChange = (index: number, text: string) => {
    const newAnswers = [...questionFormData.answers];
    newAnswers[index] = { ...newAnswers[index], text };
    setQuestionFormData({ ...questionFormData, answers: newAnswers });
  };

  const handleCorrectAnswerChange = (index: number) => {
    const newAnswers = questionFormData.answers.map((a, i) => ({
      ...a,
      isCorrect: i === index,
    }));
    setQuestionFormData({ ...questionFormData, answers: newAnswers });
  };

  // ============ KAIWA HANDLERS ============

  // Kaiwa permission check
  const canModifyKaiwaQuestion = (question: KaiwaDefaultQuestion) => {
    if (isSuperAdmin) return true;
    return question.createdBy === currentUser.id;
  };

  const canModifyKaiwaFolder = (folder: KaiwaFolder) => {
    if (isSuperAdmin) return true;
    return folder.createdBy === currentUser.id;
  };

  // Kaiwa question counts
  const getKaiwaQuestionCountByLevel = (level: KaiwaJLPTLevel) =>
    kaiwaQuestions.filter(q => q.level === level).length;

  const getKaiwaQuestionCountByTopic = (level: KaiwaJLPTLevel, topic: ConversationTopic) =>
    kaiwaQuestions.filter(q => q.level === level && q.topic === topic).length;

  const getKaiwaQuestionCountByFolder = (folderId: string) =>
    kaiwaQuestions.filter(q => q.folderId === folderId).length;

  // Get Kaiwa questions for current view
  const getKaiwaQuestionsForCurrentView = (): KaiwaDefaultQuestion[] => {
    if (kaiwaNavState.type === 'folder' && getQuestionsByKaiwaFolder) {
      return getQuestionsByKaiwaFolder(kaiwaNavState.folderId);
    }
    // In topic view without folders, show questions without folderId
    if (kaiwaNavState.type === 'topic' && getFoldersByLevelAndTopic) {
      const folders = getFoldersByLevelAndTopic(kaiwaNavState.level, kaiwaNavState.topic);
      if (folders.length === 0) {
        return kaiwaQuestions.filter(
          q => q.level === kaiwaNavState.level && q.topic === kaiwaNavState.topic && !q.folderId
        );
      }
    }
    return [];
  };

  // Get Kaiwa folders for current topic
  const getKaiwaFoldersForCurrentView = (): KaiwaFolder[] => {
    if (kaiwaNavState.type !== 'topic' || !getFoldersByLevelAndTopic) return [];
    return getFoldersByLevelAndTopic(kaiwaNavState.level, kaiwaNavState.topic);
  };

  // Check if topic has folders
  const kaiwaTopicHasFolders = (): boolean => {
    if (kaiwaNavState.type !== 'topic' || !getFoldersByLevelAndTopic) return false;
    return getFoldersByLevelAndTopic(kaiwaNavState.level, kaiwaNavState.topic).length > 0;
  };

  // Kaiwa breadcrumb
  const getKaiwaBreadcrumb = (): string[] => {
    const crumbs: string[] = ['Tất cả'];
    if (kaiwaNavState.type === 'level') crumbs.push(kaiwaNavState.level);
    if (kaiwaNavState.type === 'topic') crumbs.push(kaiwaNavState.level, kaiwaNavState.topicLabel);
    if (kaiwaNavState.type === 'folder') crumbs.push(kaiwaNavState.level, kaiwaNavState.topicLabel, kaiwaNavState.folderName);
    return crumbs;
  };

  // Kaiwa go back
  const kaiwaGoBack = () => {
    if (kaiwaNavState.type === 'level') {
      setKaiwaNavState({ type: 'root' });
    } else if (kaiwaNavState.type === 'topic') {
      setKaiwaNavState({ type: 'level', level: kaiwaNavState.level });
    } else if (kaiwaNavState.type === 'folder') {
      setKaiwaNavState({
        type: 'topic',
        level: kaiwaNavState.level,
        topic: kaiwaNavState.topic,
        topicLabel: kaiwaNavState.topicLabel,
      });
    }
    setIsAddingKaiwaQuestion(false);
    setEditingKaiwaQuestionId(null);
  };

  // Kaiwa folder handlers
  const handleAddKaiwaFolder = async () => {
    if (!newKaiwaFolderName.trim() || kaiwaNavState.type !== 'topic' || !onAddKaiwaFolder) return;
    await onAddKaiwaFolder(newKaiwaFolderName.trim(), kaiwaNavState.level, kaiwaNavState.topic, currentUser.id);
    setNewKaiwaFolderName('');
    setIsAddingKaiwaFolder(false);
  };

  const handleUpdateKaiwaFolder = async (id: string) => {
    if (editingKaiwaFolderName.trim() && onUpdateKaiwaFolder) {
      await onUpdateKaiwaFolder(id, { name: editingKaiwaFolderName.trim() });
      setEditingKaiwaFolderId(null);
      setEditingKaiwaFolderName('');
    }
  };

  // Kaiwa question handlers
  const resetKaiwaQuestionForm = () => {
    setKaiwaQuestionFormData({
      level: 'N5',
      topic: 'greetings',
      questionJa: '',
      questionVi: '',
      situationContext: '',
      suggestedAnswers: ['', ''],
      style: 'polite',
    });
  };

  const handleAddKaiwaQuestion = async () => {
    if (!kaiwaQuestionFormData.questionJa.trim() || !onAddKaiwaQuestion) return;
    // Set current context from navigation
    const formData = { ...kaiwaQuestionFormData };
    if (kaiwaNavState.type === 'topic') {
      formData.level = kaiwaNavState.level;
      formData.topic = kaiwaNavState.topic;
    } else if (kaiwaNavState.type === 'folder') {
      formData.level = kaiwaNavState.level;
      formData.topic = kaiwaNavState.topic;
      formData.folderId = kaiwaNavState.folderId;
    }
    // Filter empty suggested answers
    formData.suggestedAnswers = formData.suggestedAnswers?.filter(a => a.trim()) || [];
    await onAddKaiwaQuestion(formData, currentUser.id);
    resetKaiwaQuestionForm();
    setIsAddingKaiwaQuestion(false);
  };

  const handleEditKaiwaQuestion = (question: KaiwaDefaultQuestion) => {
    setEditingKaiwaQuestionId(question.id);
    setKaiwaQuestionFormData({
      level: question.level,
      topic: question.topic,
      folderId: question.folderId,
      questionJa: question.questionJa,
      questionVi: question.questionVi || '',
      situationContext: question.situationContext || '',
      suggestedAnswers: question.suggestedAnswers?.length ? [...question.suggestedAnswers] : ['', ''],
      style: question.style,
    });
  };

  const handleUpdateKaiwaQuestion = async () => {
    if (!editingKaiwaQuestionId || !onUpdateKaiwaQuestion) return;
    const formData = { ...kaiwaQuestionFormData };
    formData.suggestedAnswers = formData.suggestedAnswers?.filter(a => a.trim()) || [];
    await onUpdateKaiwaQuestion(editingKaiwaQuestionId, formData);
    resetKaiwaQuestionForm();
    setEditingKaiwaQuestionId(null);
  };

  const handleCancelKaiwaQuestion = () => {
    resetKaiwaQuestionForm();
    setIsAddingKaiwaQuestion(false);
    setEditingKaiwaQuestionId(null);
  };

  const handleKaiwaSuggestedAnswerChange = (index: number, value: string) => {
    const newAnswers = [...(kaiwaQuestionFormData.suggestedAnswers || ['', ''])];
    newAnswers[index] = value;
    setKaiwaQuestionFormData({ ...kaiwaQuestionFormData, suggestedAnswers: newAnswers });
  };

  const addKaiwaSuggestedAnswer = () => {
    const newAnswers = [...(kaiwaQuestionFormData.suggestedAnswers || []), ''];
    setKaiwaQuestionFormData({ ...kaiwaQuestionFormData, suggestedAnswers: newAnswers });
  };

  const removeKaiwaSuggestedAnswer = (index: number) => {
    const newAnswers = (kaiwaQuestionFormData.suggestedAnswers || []).filter((_, i) => i !== index);
    setKaiwaQuestionFormData({ ...kaiwaQuestionFormData, suggestedAnswers: newAnswers });
  };

  // Count cards
  const getCardCountByLevel = (level: JLPTLevel) => cards.filter(c => c.jlptLevel === level).length;
  const getCardCountByLesson = (lessonId: string) => cards.filter(c => c.lessonId === lessonId).length;

  // Count cards recursively (parent + all children)
  const getCardCountByLessonRecursive = (lessonId: string) => {
    const directCount = cards.filter(c => c.lessonId === lessonId).length;
    const children = getChildLessons(lessonId);
    const childrenCount = children.reduce((sum, child) => sum + getCardCountByLesson(child.id), 0);
    return directCount + childrenCount;
  };

  // Get cards for current view
  const getCardsForCurrentView = (): Flashcard[] => {
    if (navState.type === 'childLesson') return cards.filter(c => c.lessonId === navState.lessonId);
    // Show cards in parent lesson if no children
    if (navState.type === 'parentLesson' && getChildLessons(navState.lessonId).length === 0) {
      return cards.filter(c => c.lessonId === navState.lessonId);
    }
    return [];
  };

  // Breadcrumb
  const getBreadcrumb = (): string[] => {
    const crumbs: string[] = ['Tất cả'];
    if (navState.type === 'level') crumbs.push(navState.level);
    if (navState.type === 'parentLesson') crumbs.push(navState.level, navState.lessonName);
    if (navState.type === 'childLesson') crumbs.push(navState.level, navState.parentName, navState.lessonName);
    return crumbs;
  };

  // Go back
  const goBack = () => {
    if (navState.type === 'level') {
      setNavState({ type: 'root' });
    } else if (navState.type === 'parentLesson') {
      setNavState({ type: 'level', level: navState.level });
    } else if (navState.type === 'childLesson') {
      setNavState({
        type: 'parentLesson',
        level: navState.level,
        lessonId: navState.parentId,
        lessonName: navState.parentName,
      });
    }
    setShowForm(false);
    setAddingLesson(false);
  };

  const breadcrumb = getBreadcrumb();
  const currentCards = getCardsForCurrentView();
  const canAddParentLesson = navState.type === 'level';
  const canAddChildLesson = navState.type === 'parentLesson';
  // Can add card in child lesson OR in parent lesson with no children
  const parentHasNoChildren = navState.type === 'parentLesson' && getChildLessons(navState.lessonId).length === 0;
  const canAddCard = navState.type === 'childLesson' || parentHasNoChildren;

  // Get lessons for FlashcardForm
  const getLessonsForForm = (): Lesson[] => {
    if (navState.type === 'childLesson') {
      return getChildLessons(navState.parentId);
    }
    // Return empty - form will use fixedLessonId for parent lesson
    return [];
  };

  return (
    <div className="cards-page">
      <div className="page-header">
        <h2>Quản Lí</h2>
        <div className="tab-buttons">
          <button
            className={`tab-btn ${activeTab === 'flashcards' ? 'active' : ''}`}
            onClick={() => setActiveTab('flashcards')}
          >
            Flash Card
          </button>
          <button
            className={`tab-btn ${activeTab === 'lectures' ? 'active' : ''}`}
            onClick={() => setActiveTab('lectures')}
          >
            Bài giảng ({lectures.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'jlpt' ? 'active' : ''}`}
            onClick={() => setActiveTab('jlpt')}
          >
            JLPT
          </button>
          <button
            className={`tab-btn ${activeTab === 'kaiwa' ? 'active' : ''}`}
            onClick={() => setActiveTab('kaiwa')}
          >
            Kaiwa ({kaiwaQuestions.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'assignments' ? 'active' : ''}`}
            onClick={() => setActiveTab('assignments')}
          >
            Bài tập
          </button>
          <button
            className={`tab-btn ${activeTab === 'tests' ? 'active' : ''}`}
            onClick={() => setActiveTab('tests')}
          >
            Bài kiểm tra ({testTemplates.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Tài khoản ({visibleUsers.length})
          </button>
        </div>
      </div>

      {/* Flashcards Management Tab */}
      {activeTab === 'flashcards' && (
        <>
          <div className="breadcrumb">
            {breadcrumb.map((crumb, idx) => (
              <span key={idx}>
                {idx > 0 && ' / '}
                <span
                  className={idx === breadcrumb.length - 1 ? 'current' : 'clickable'}
                  onClick={() => idx === 0 && setNavState({ type: 'root' })}
                >
                  {crumb}
                </span>
              </span>
            ))}
          </div>

      {navState.type !== 'root' && (
        <button className="btn btn-back" onClick={goBack}>← Quay lại</button>
      )}

      {!showForm && !addingLesson && (
        <div className="folder-actions">
          {canAddCard && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Tạo thẻ</button>
          )}
          {canAddParentLesson && (
            <button className="btn btn-secondary" onClick={() => setAddingLesson(true)}>+ Tạo bài học</button>
          )}
          {canAddChildLesson && (
            <button className="btn btn-secondary" onClick={() => setAddingLesson(true)}>+ Tạo bài học con</button>
          )}
        </div>
      )}

      {addingLesson && (
        <div className="add-category-inline">
          <input
            type="text"
            className="category-input"
            placeholder={canAddChildLesson ? "Tên bài học con..." : "Tên bài học..."}
            value={newLessonName}
            onChange={(e) => setNewLessonName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddLesson();
              if (e.key === 'Escape') { setAddingLesson(false); setNewLessonName(''); }
            }}
            autoFocus
          />
          <button className="btn btn-primary" onClick={handleAddLesson}>Lưu</button>
          <button className="btn btn-cancel" onClick={() => { setAddingLesson(false); setNewLessonName(''); }}>Hủy</button>
        </div>
      )}

      {showForm && (
        <FlashcardForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          initialData={editingCard || undefined}
          lessons={getLessonsForForm()}
          fixedLevel={getCurrentLevel()}
          fixedLessonId={getCurrentLessonId()}
        />
      )}

      {!showForm && !addingLesson && (
        <div className="folder-content">
          {/* Root: show levels */}
          {navState.type === 'root' && (
            <div className="folder-list">
              {JLPT_LEVELS.map(level => (
                <div
                  key={level}
                  className="folder-item"
                  onClick={() => setNavState({ type: 'level', level })}
                >
                  <span className="folder-icon">📁</span>
                  <span className="folder-name">{level}</span>
                  <span className="folder-count">({getCardCountByLevel(level)} thẻ)</span>
                </div>
              ))}
            </div>
          )}

          {/* Level: show parent lessons */}
          {navState.type === 'level' && (
            <div className="folder-list">
              {getLessonsByLevel(navState.level).map(lesson => (
                <div
                  key={lesson.id}
                  className="folder-item"
                  onClick={() => setNavState({
                    type: 'parentLesson',
                    level: navState.level,
                    lessonId: lesson.id,
                    lessonName: lesson.name,
                  })}
                >
                  {canModifyLesson(lesson) && (
                    <>
                      <button
                        className={`lock-btn ${lesson.isLocked ? 'locked' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onToggleLock(lesson.id); }}
                        title={lesson.isLocked ? 'Mở khóa' : 'Khóa'}
                      >
                        {lesson.isLocked ? '🔒' : '🔓'}
                      </button>
                      <button
                        className={`hide-btn ${lesson.isHidden ? 'hidden' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onToggleHide(lesson.id); }}
                        title={lesson.isHidden ? 'Hiện' : 'Ẩn'}
                      >
                        {lesson.isHidden ? '👁️‍🗨️' : '👁️'}
                      </button>
                    </>
                  )}
                  <span className="folder-icon">📂</span>
                  {editingLessonId === lesson.id ? (
                    <input
                      type="text"
                      className="edit-input inline"
                      value={editingLessonName}
                      onChange={(e) => setEditingLessonName(e.target.value)}
                      onBlur={() => handleUpdateLesson(lesson.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateLesson(lesson.id);
                        if (e.key === 'Escape') { setEditingLessonId(null); setEditingLessonName(''); }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="folder-name"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingLessonId(lesson.id);
                        setEditingLessonName(lesson.name);
                      }}
                    >
                      {lesson.name}
                    </span>
                  )}
                  <span className="folder-count">({getCardCountByLessonRecursive(lesson.id)} thẻ)</span>
                  {lesson.isLocked && <span className="locked-badge">Đã khóa</span>}
                  {lesson.isHidden && <span className="hidden-badge">Đã ẩn</span>}
                  {canModifyLesson(lesson) && (
                    <>
                      <button
                        className="edit-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingLessonId(lesson.id);
                          setEditingLessonName(lesson.name);
                        }}
                        title="Sửa tên"
                      >✎</button>
                      <button
                        className="delete-btn"
                        onClick={(e) => { e.stopPropagation(); setDeleteLessonTarget(lesson); }}
                        title="Xóa"
                      >×</button>
                    </>
                  )}
                </div>
              ))}
              {getLessonsByLevel(navState.level).length === 0 && (
                <p className="empty-message">Chưa có bài học nào. Nhấn "+ Tạo bài học" để thêm.</p>
              )}
            </div>
          )}

          {/* Parent Lesson: show child lessons */}
          {navState.type === 'parentLesson' && (
            <div className="folder-list">
              {getChildLessons(navState.lessonId).map(lesson => (
                <div
                  key={lesson.id}
                  className="folder-item"
                  onClick={() => setNavState({
                    type: 'childLesson',
                    level: navState.level,
                    parentId: navState.lessonId,
                    parentName: navState.lessonName,
                    lessonId: lesson.id,
                    lessonName: lesson.name,
                  })}
                >
                  {canModifyLesson(lesson) && (
                    <>
                      <button
                        className={`lock-btn ${lesson.isLocked ? 'locked' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onToggleLock(lesson.id); }}
                        title={lesson.isLocked ? 'Mở khóa' : 'Khóa'}
                      >
                        {lesson.isLocked ? '🔒' : '🔓'}
                      </button>
                      <button
                        className={`hide-btn ${lesson.isHidden ? 'hidden' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onToggleHide(lesson.id); }}
                        title={lesson.isHidden ? 'Hiện' : 'Ẩn'}
                      >
                        {lesson.isHidden ? '👁️‍🗨️' : '👁️'}
                      </button>
                    </>
                  )}
                  <span className="folder-icon">📄</span>
                  {editingLessonId === lesson.id ? (
                    <input
                      type="text"
                      className="edit-input inline"
                      value={editingLessonName}
                      onChange={(e) => setEditingLessonName(e.target.value)}
                      onBlur={() => handleUpdateLesson(lesson.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateLesson(lesson.id);
                        if (e.key === 'Escape') { setEditingLessonId(null); setEditingLessonName(''); }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="folder-name"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingLessonId(lesson.id);
                        setEditingLessonName(lesson.name);
                      }}
                    >
                      {lesson.name}
                    </span>
                  )}
                  <span className="folder-count">({getCardCountByLesson(lesson.id)} thẻ)</span>
                  {lesson.isLocked && <span className="locked-badge">Đã khóa</span>}
                  {lesson.isHidden && <span className="hidden-badge">Đã ẩn</span>}
                  {canModifyLesson(lesson) && (
                    <>
                      <button
                        className="edit-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingLessonId(lesson.id);
                          setEditingLessonName(lesson.name);
                        }}
                        title="Sửa tên"
                      >✎</button>
                      <button
                        className="delete-btn"
                        onClick={(e) => { e.stopPropagation(); setDeleteLessonTarget(lesson); }}
                        title="Xóa"
                      >×</button>
                    </>
                  )}
                </div>
              ))}
              {getChildLessons(navState.lessonId).length === 0 && (
                <>
                  {/* Show flashcards directly in parent lesson if no children */}
                  {currentCards.length > 0 ? (
                    <FlashcardList cards={currentCards} onEdit={handleEdit} onDelete={onDeleteCard} canEdit={canModifyCard} canDelete={canModifyCard} />
                  ) : (
                    <p className="empty-message">Chưa có thẻ nào. Nhấn "+ Tạo thẻ" để thêm hoặc tạo bài học con.</p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Child Lesson: show flashcards */}
          {navState.type === 'childLesson' && (
            <>
              {currentCards.length > 0 ? (
                <FlashcardList cards={currentCards} onEdit={handleEdit} onDelete={onDeleteCard} canEdit={canModifyCard} canDelete={canModifyCard} />
              ) : (
                <p className="empty-message">Chưa có thẻ nào. Nhấn "+ Tạo thẻ" để thêm.</p>
              )}
            </>
          )}
        </div>
      )}
        </>
      )}

      {/* JLPT Question Management Tab */}
      {activeTab === 'jlpt' && (
        <div className="jlpt-management">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            {getJLPTBreadcrumb().map((crumb, idx) => (
              <span key={idx}>
                {idx > 0 && ' / '}
                <span
                  className={idx === getJLPTBreadcrumb().length - 1 ? 'current' : 'clickable'}
                  onClick={() => idx === 0 && setJlptNavState({ type: 'root' })}
                >
                  {crumb}
                </span>
              </span>
            ))}
          </div>

          {jlptNavState.type !== 'root' && (
            <button className="btn btn-back" onClick={jlptGoBack}>← Quay lại</button>
          )}

          {/* Add Folder Form */}
          {isAddingFolder && jlptNavState.type === 'category' && (
            <div className="add-category-inline">
              <input
                type="text"
                className="category-input"
                placeholder="Tên thư mục..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddFolder();
                  if (e.key === 'Escape') { setIsAddingFolder(false); setNewFolderName(''); }
                }}
                autoFocus
              />
              <button className="btn btn-primary" onClick={handleAddFolder}>Lưu</button>
              <button className="btn btn-cancel" onClick={() => { setIsAddingFolder(false); setNewFolderName(''); }}>Hủy</button>
            </div>
          )}

          {/* Add/Edit Question Form */}
          {(isAddingQuestion || editingQuestionId) && (jlptNavState.type === 'category' || jlptNavState.type === 'folder') && (
            <div className="jlpt-form">
              <h3>{editingQuestionId ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}</h3>

              <div className="form-group">
                <label>Câu hỏi</label>
                <textarea
                  value={questionFormData.question}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, question: e.target.value })}
                  placeholder="Nhập nội dung câu hỏi..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Đáp án (chọn đáp án đúng)</label>
                <div className="answers-grid">
                  {questionFormData.answers.map((answer, index) => (
                    <div key={index} className="answer-input-row">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={answer.isCorrect}
                        onChange={() => handleCorrectAnswerChange(index)}
                      />
                      <input
                        type="text"
                        value={answer.text}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        placeholder={`Đáp án ${index + 1}`}
                        className={answer.isCorrect ? 'correct-answer' : ''}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Giải thích (không bắt buộc)</label>
                <textarea
                  value={questionFormData.explanation}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, explanation: e.target.value })}
                  placeholder="Giải thích đáp án đúng..."
                  rows={2}
                />
              </div>

              <div className="form-actions">
                <button className="btn btn-secondary" onClick={handleCancelQuestion}>
                  Hủy
                </button>
                <button
                  className="btn btn-primary"
                  onClick={editingQuestionId ? handleUpdateQuestion : handleAddQuestion}
                >
                  {editingQuestionId ? 'Cập nhật' : 'Thêm'}
                </button>
              </div>
            </div>
          )}

          {!isAddingQuestion && !editingQuestionId && (
            <div className="folder-content">
              {/* Root: show JLPT levels */}
              {jlptNavState.type === 'root' && (
                <div className="folder-list">
                  {JLPT_QUESTION_LEVELS.map(level => (
                    <div
                      key={level}
                      className="folder-item"
                      onClick={() => setJlptNavState({ type: 'level', level })}
                    >
                      <span className="folder-icon">📁</span>
                      <span className="folder-name">{level}</span>
                      <span className="folder-count">({getQuestionCountByLevel(level)} câu hỏi)</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Level: show categories */}
              {jlptNavState.type === 'level' && (
                <div className="folder-list">
                  {QUESTION_CATEGORIES.map(cat => (
                    <div
                      key={cat.value}
                      className="folder-item"
                      onClick={() => setJlptNavState({
                        type: 'category',
                        level: jlptNavState.level,
                        category: cat.value,
                        categoryLabel: cat.label,
                      })}
                    >
                      <span className="folder-icon">📂</span>
                      <span className="folder-name">{cat.label}</span>
                      <span className="folder-count">({getQuestionCountByCategory(jlptNavState.level, cat.value)} câu hỏi)</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Category: show folders or questions */}
              {jlptNavState.type === 'category' && (
                <>
                  {!isAddingFolder && (
                    <div className="folder-actions">
                      <button className="btn btn-secondary" onClick={() => setIsAddingFolder(true)}>
                        + Thêm thư mục
                      </button>
                      {!categoryHasFolders() && (
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            setQuestionFormData({
                              ...questionFormData,
                              level: jlptNavState.level,
                              category: jlptNavState.category,
                              folderId: undefined,
                            });
                            setIsAddingQuestion(true);
                          }}
                        >
                          + Thêm câu hỏi
                        </button>
                      )}
                    </div>
                  )}

                  {/* Show folders if any */}
                  {getFoldersForCurrentView().length > 0 && (
                    <div className="folder-list">
                      {getFoldersForCurrentView().map(folder => (
                        <div
                          key={folder.id}
                          className="folder-item"
                          onClick={() => setJlptNavState({
                            type: 'folder',
                            level: jlptNavState.level,
                            category: jlptNavState.category,
                            categoryLabel: jlptNavState.categoryLabel,
                            folderId: folder.id,
                            folderName: folder.name,
                          })}
                        >
                          <span className="folder-icon">📄</span>
                          {editingFolderId === folder.id ? (
                            <input
                              type="text"
                              className="edit-input inline"
                              value={editingFolderName}
                              onChange={(e) => setEditingFolderName(e.target.value)}
                              onBlur={() => handleUpdateFolder(folder.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdateFolder(folder.id);
                                if (e.key === 'Escape') { setEditingFolderId(null); setEditingFolderName(''); }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                            />
                          ) : (
                            <span
                              className="folder-name"
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                setEditingFolderId(folder.id);
                                setEditingFolderName(folder.name);
                              }}
                            >
                              {folder.name}
                            </span>
                          )}
                          <span className="folder-count">({getQuestionCountByFolder(folder.id)} câu hỏi)</span>
                          {canModifyFolder(folder) && (
                            <>
                              <button
                                className="edit-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingFolderId(folder.id);
                                  setEditingFolderName(folder.name);
                                }}
                                title="Sửa tên"
                              >✎</button>
                              <button
                                className="delete-btn"
                                onClick={(e) => { e.stopPropagation(); setDeleteFolderTarget(folder); }}
                                title="Xóa"
                              >×</button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Show questions directly if no folders */}
                  {!categoryHasFolders() && (
                    <div className="questions-list">
                      {getQuestionsForCurrentView().length === 0 ? (
                        <div className="empty-message">
                          Chưa có câu hỏi nào. Tạo thư mục hoặc thêm câu hỏi trực tiếp.
                        </div>
                      ) : (
                        getQuestionsForCurrentView().map((question) => (
                          <div key={question.id} className="question-card">
                            <div className="question-header">
                              {canModifyQuestion(question) && (
                                <div className="question-actions">
                                  <button
                                    className="btn-icon"
                                    onClick={() => handleEditQuestion(question)}
                                    title="Sửa"
                                  >
                                    ✎
                                  </button>
                                  <button
                                    className="btn-icon danger"
                                    onClick={() => setDeleteJLPTQuestionTarget(question)}
                                    title="Xóa"
                                  >
                                    ×
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="question-content">
                              <p className="question-text">{question.question}</p>
                              <div className="question-answers">
                                {question.answers.map((answer, index) => (
                                  <div
                                    key={index}
                                    className={`answer-item ${answer.isCorrect ? 'correct' : ''}`}
                                  >
                                    <span className="answer-letter">{String.fromCharCode(65 + index)}.</span>
                                    <span className="answer-text">{answer.text}</span>
                                    {answer.isCorrect && <span className="correct-mark">✓</span>}
                                  </div>
                                ))}
                              </div>
                              {question.explanation && (
                                <div className="question-explanation">
                                  <strong>Giải thích:</strong> {question.explanation}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Folder: show questions */}
              {jlptNavState.type === 'folder' && (
                <>
                  <div className="folder-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setQuestionFormData({
                          ...questionFormData,
                          level: jlptNavState.level,
                          category: jlptNavState.category,
                          folderId: jlptNavState.folderId,
                        });
                        setIsAddingQuestion(true);
                      }}
                    >
                      + Thêm câu hỏi
                    </button>
                  </div>

                  <div className="questions-list">
                    {getQuestionsForCurrentView().length === 0 ? (
                      <div className="empty-message">
                        Chưa có câu hỏi nào. Nhấn "+ Thêm câu hỏi" để thêm.
                      </div>
                    ) : (
                      getQuestionsForCurrentView().map((question) => (
                        <div key={question.id} className="question-card">
                          <div className="question-header">
                            {canModifyQuestion(question) && (
                              <div className="question-actions">
                                <button
                                  className="btn-icon"
                                  onClick={() => handleEditQuestion(question)}
                                  title="Sửa"
                                >
                                  ✎
                                </button>
                                <button
                                  className="btn-icon danger"
                                  onClick={() => setDeleteJLPTQuestionTarget(question)}
                                  title="Xóa"
                                >
                                  ×
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="question-content">
                            <p className="question-text">{question.question}</p>
                            <div className="question-answers">
                              {question.answers.map((answer, index) => (
                                <div
                                  key={index}
                                  className={`answer-item ${answer.isCorrect ? 'correct' : ''}`}
                                >
                                  <span className="answer-letter">{String.fromCharCode(65 + index)}.</span>
                                  <span className="answer-text">{answer.text}</span>
                                  {answer.isCorrect && <span className="correct-mark">✓</span>}
                                </div>
                              ))}
                            </div>
                            {question.explanation && (
                              <div className="question-explanation">
                                <strong>Giải thích:</strong> {question.explanation}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Kaiwa Default Questions Management Tab */}
      {activeTab === 'kaiwa' && (
        <div className="jlpt-management">
          <div className="breadcrumb">
            {getKaiwaBreadcrumb().map((crumb, idx) => (
              <span key={idx}>
                {idx > 0 && ' / '}
                <span
                  className={idx === getKaiwaBreadcrumb().length - 1 ? 'current' : 'clickable'}
                  onClick={() => idx === 0 && setKaiwaNavState({ type: 'root' })}
                >
                  {crumb}
                </span>
              </span>
            ))}
          </div>

          {kaiwaNavState.type !== 'root' && (
            <button className="btn btn-back" onClick={kaiwaGoBack}>← Quay lại</button>
          )}

          {/* Root: Show levels */}
          {kaiwaNavState.type === 'root' && (
            <div className="level-grid">
              {KAIWA_LEVELS.map(level => (
                <div
                  key={level}
                  className="level-card"
                  onClick={() => setKaiwaNavState({ type: 'level', level })}
                >
                  <span className="level-name">{level}</span>
                  <span className="level-count">{getKaiwaQuestionCountByLevel(level)} câu</span>
                </div>
              ))}
            </div>
          )}

          {/* Level: Show topics */}
          {kaiwaNavState.type === 'level' && (
            <div className="category-grid">
              {CONVERSATION_TOPICS.filter(t => t.value !== 'free').map(topic => (
                <div
                  key={topic.value}
                  className="category-card"
                  onClick={() => setKaiwaNavState({
                    type: 'topic',
                    level: kaiwaNavState.level,
                    topic: topic.value,
                    topicLabel: topic.label,
                  })}
                >
                  <span className="category-icon">{topic.icon}</span>
                  <span className="category-name">{topic.label}</span>
                  <span className="category-count">
                    {getKaiwaQuestionCountByTopic(kaiwaNavState.level, topic.value)} câu
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Topic: Show folders and questions */}
          {kaiwaNavState.type === 'topic' && (
            <div className="folder-view">
              <div className="folder-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setIsAddingKaiwaFolder(true)}
                >
                  + Tạo thư mục
                </button>
                {!kaiwaTopicHasFolders() && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setIsAddingKaiwaQuestion(true)}
                  >
                    + Tạo câu hỏi
                  </button>
                )}
              </div>

              {isAddingKaiwaFolder && (
                <div className="add-category-inline">
                  <input
                    type="text"
                    className="category-input"
                    placeholder="Tên thư mục..."
                    value={newKaiwaFolderName}
                    onChange={(e) => setNewKaiwaFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddKaiwaFolder();
                      if (e.key === 'Escape') { setIsAddingKaiwaFolder(false); setNewKaiwaFolderName(''); }
                    }}
                    autoFocus
                  />
                  <button className="btn btn-primary btn-small" onClick={handleAddKaiwaFolder}>Thêm</button>
                  <button className="btn btn-secondary btn-small" onClick={() => { setIsAddingKaiwaFolder(false); setNewKaiwaFolderName(''); }}>Hủy</button>
                </div>
              )}

              {/* Folders list */}
              {getKaiwaFoldersForCurrentView().length > 0 && (
                <div className="folder-list">
                  {getKaiwaFoldersForCurrentView().map(folder => (
                    <div key={folder.id} className="folder-item">
                      {editingKaiwaFolderId === folder.id ? (
                        <div className="folder-edit">
                          <input
                            type="text"
                            value={editingKaiwaFolderName}
                            onChange={(e) => setEditingKaiwaFolderName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdateKaiwaFolder(folder.id);
                              if (e.key === 'Escape') { setEditingKaiwaFolderId(null); setEditingKaiwaFolderName(''); }
                            }}
                            autoFocus
                          />
                          <button className="btn btn-primary btn-small" onClick={() => handleUpdateKaiwaFolder(folder.id)}>Lưu</button>
                          <button className="btn btn-secondary btn-small" onClick={() => { setEditingKaiwaFolderId(null); setEditingKaiwaFolderName(''); }}>Hủy</button>
                        </div>
                      ) : (
                        <>
                          <div
                            className="folder-info"
                            onClick={() => setKaiwaNavState({
                              type: 'folder',
                              level: kaiwaNavState.level,
                              topic: kaiwaNavState.topic,
                              topicLabel: kaiwaNavState.topicLabel,
                              folderId: folder.id,
                              folderName: folder.name,
                            })}
                          >
                            <span className="folder-icon">📁</span>
                            <span className="folder-name">{folder.name}</span>
                            <span className="folder-count">{getKaiwaQuestionCountByFolder(folder.id)} câu</span>
                          </div>
                          {canModifyKaiwaFolder(folder) && (
                            <div className="folder-actions-inline">
                              <button
                                className="btn btn-small"
                                onClick={(e) => { e.stopPropagation(); setEditingKaiwaFolderId(folder.id); setEditingKaiwaFolderName(folder.name); }}
                              >
                                Sửa
                              </button>
                              <button
                                className="btn btn-danger btn-small"
                                onClick={(e) => { e.stopPropagation(); setDeleteKaiwaFolderTarget(folder); }}
                              >
                                Xóa
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Questions without folder */}
              {!kaiwaTopicHasFolders() && getKaiwaQuestionsForCurrentView().length > 0 && (
                <div className="kaiwa-questions-list">
                  {getKaiwaQuestionsForCurrentView().map(question => (
                    <div key={question.id} className="kaiwa-question-item">
                      <div className="kaiwa-question-content">
                        <div className="kaiwa-question-ja">{question.questionJa}</div>
                        {question.questionVi && <div className="kaiwa-question-vi">{question.questionVi}</div>}
                        <div className="kaiwa-question-meta">
                          <span className="meta-badge">{question.style === 'casual' ? 'タメ口' : question.style === 'polite' ? 'です/ます' : '敬語'}</span>
                          {question.situationContext && <span className="meta-context">{question.situationContext}</span>}
                        </div>
                      </div>
                      {canModifyKaiwaQuestion(question) && (
                        <div className="kaiwa-question-actions">
                          <button className="btn btn-small" onClick={() => handleEditKaiwaQuestion(question)}>Sửa</button>
                          <button className="btn btn-danger btn-small" onClick={() => setDeleteKaiwaQuestionTarget(question)}>Xóa</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Folder: Show questions in folder */}
          {kaiwaNavState.type === 'folder' && (
            <div className="folder-view">
              <div className="folder-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => setIsAddingKaiwaQuestion(true)}
                >
                  + Tạo câu hỏi
                </button>
              </div>

              <div className="kaiwa-questions-list">
                {getKaiwaQuestionsForCurrentView().map(question => (
                  <div key={question.id} className="kaiwa-question-item">
                    <div className="kaiwa-question-content">
                      <div className="kaiwa-question-ja">{question.questionJa}</div>
                      {question.questionVi && <div className="kaiwa-question-vi">{question.questionVi}</div>}
                      <div className="kaiwa-question-meta">
                        <span className="meta-badge">{question.style === 'casual' ? 'タメ口' : question.style === 'polite' ? 'です/ます' : '敬語'}</span>
                        {question.situationContext && <span className="meta-context">{question.situationContext}</span>}
                      </div>
                      {question.suggestedAnswers && question.suggestedAnswers.length > 0 && (
                        <div className="kaiwa-suggested-answers">
                          <span className="answers-label">Gợi ý trả lời:</span>
                          {question.suggestedAnswers.map((answer, idx) => (
                            <span key={idx} className="answer-item">{answer}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {canModifyKaiwaQuestion(question) && (
                      <div className="kaiwa-question-actions">
                        <button className="btn btn-small" onClick={() => handleEditKaiwaQuestion(question)}>Sửa</button>
                        <button className="btn btn-danger btn-small" onClick={() => setDeleteKaiwaQuestionTarget(question)}>Xóa</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add/Edit Question Form */}
          {(isAddingKaiwaQuestion || editingKaiwaQuestionId) && (
            <div className="kaiwa-question-form">
              <h3>{editingKaiwaQuestionId ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}</h3>

              <div className="form-group">
                <label>Câu hỏi (tiếng Nhật) *</label>
                <textarea
                  value={kaiwaQuestionFormData.questionJa}
                  onChange={(e) => setKaiwaQuestionFormData({ ...kaiwaQuestionFormData, questionJa: e.target.value })}
                  placeholder="Nhập câu hỏi tiếng Nhật..."
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label>Dịch nghĩa (tiếng Việt)</label>
                <input
                  type="text"
                  value={kaiwaQuestionFormData.questionVi}
                  onChange={(e) => setKaiwaQuestionFormData({ ...kaiwaQuestionFormData, questionVi: e.target.value })}
                  placeholder="Nhập dịch nghĩa..."
                />
              </div>

              <div className="form-group">
                <label>Ngữ cảnh tình huống</label>
                <input
                  type="text"
                  value={kaiwaQuestionFormData.situationContext}
                  onChange={(e) => setKaiwaQuestionFormData({ ...kaiwaQuestionFormData, situationContext: e.target.value })}
                  placeholder="Mô tả tình huống (ví dụ: Ở cửa hàng, hỏi giá sản phẩm)"
                />
              </div>

              <div className="form-group">
                <label>Phong cách nói</label>
                <select
                  value={kaiwaQuestionFormData.style}
                  onChange={(e) => setKaiwaQuestionFormData({ ...kaiwaQuestionFormData, style: e.target.value as ConversationStyle })}
                >
                  {CONVERSATION_STYLES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Gợi ý trả lời</label>
                {(kaiwaQuestionFormData.suggestedAnswers || []).map((answer, idx) => (
                  <div key={idx} className="suggested-answer-row">
                    <input
                      type="text"
                      value={answer}
                      onChange={(e) => handleKaiwaSuggestedAnswerChange(idx, e.target.value)}
                      placeholder={`Gợi ý ${idx + 1}...`}
                    />
                    <button
                      type="button"
                      className="btn btn-danger btn-small"
                      onClick={() => removeKaiwaSuggestedAnswer(idx)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={addKaiwaSuggestedAnswer}
                >
                  + Thêm gợi ý
                </button>
              </div>

              <div className="form-actions">
                <button
                  className="btn btn-primary"
                  onClick={editingKaiwaQuestionId ? handleUpdateKaiwaQuestion : handleAddKaiwaQuestion}
                >
                  {editingKaiwaQuestionId ? 'Cập nhật' : 'Thêm'}
                </button>
                <button className="btn btn-secondary" onClick={handleCancelKaiwaQuestion}>Hủy</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Users Management Tab */}
      {activeTab === 'users' && (
        <div className="admin-users">
          <div className="admin-actions">
            <button
              className="btn btn-primary"
              onClick={() => setShowAddUser(!showAddUser)}
            >
              {showAddUser ? 'Hủy' : '+ Thêm người dùng'}
            </button>
          </div>

          {showAddUser && (
            <div className="admin-add-user">
              <form className="add-user-form" onSubmit={handleAddUser}>
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Tên đăng nhập"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Mật khẩu"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                  >
                    <option value="user">User</option>
                    {isSuperAdmin && <option value="vip_user">VIP User</option>}
                    {isSuperAdmin && <option value="admin">Admin</option>}
                    {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                  </select>
                  <button type="submit" className="btn btn-primary">Thêm</button>
                </div>
                {userError && <p className="error-message">{userError}</p>}
              </form>
            </div>
          )}

          <table className="users-table">
            <thead>
              <tr>
                <th>Tên đăng nhập</th>
                <th>Quyền</th>
                <th>Ngày hữu hạn</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map(user => {
                const isCurrentUser = user.id === currentUser.id;
                const isProtectedSuperAdmin = user.id === 'superadmin';
                const canChangeRole = isSuperAdmin && !isCurrentUser && !isProtectedSuperAdmin;
                const canDelete = !isCurrentUser && !isProtectedSuperAdmin && (
                  isSuperAdmin || (currentUser.role === 'admin' && user.createdBy === currentUser.id)
                );
                const isVipExpired = user.role === 'vip_user' && user.vipExpirationDate &&
                  new Date(user.vipExpirationDate) < new Date();

                return (
                  <tr key={user.id} className={isVipExpired ? 'vip-expired' : ''}>
                    <td>{user.username}</td>
                    <td>
                      <span className={`role-badge role-${user.role}`}>
                        {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : user.role === 'vip_user' ? 'VIP' : 'User'}
                      </span>
                      {isVipExpired && <span className="expired-badge">Hết hạn</span>}
                    </td>
                    <td>
                      {(user.role === 'vip_user' || canChangeRole) ? (
                        <input
                          type="date"
                          value={user.vipExpirationDate || ''}
                          onChange={(e) => onUpdateVipExpiration(user.id, e.target.value || undefined)}
                          className="expiration-input"
                          disabled={!canChangeRole}
                        />
                      ) : (
                        <span className="no-expiration">-</span>
                      )}
                    </td>
                    <td>{user.createdAt}</td>
                    <td>
                      <div className="action-buttons-row">
                        {canChangeRole && (
                          <select
                            value={user.role}
                            onChange={(e) => onUpdateUserRole(user.id, e.target.value as UserRole)}
                            className="role-select"
                          >
                            <option value="user">User</option>
                            <option value="vip_user">VIP User</option>
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                        )}
                        {canDelete && (
                          <button
                            className="btn btn-danger btn-small"
                            onClick={() => setDeleteUserTarget(user)}
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Lectures Management Tab - Folder Navigation Structure */}
      {activeTab === 'lectures' && (
        <>
          <div className="breadcrumb">
            {lectureBreadcrumb.map((crumb, idx) => (
              <span key={idx}>
                {idx > 0 && ' / '}
                <span
                  className={idx === lectureBreadcrumb.length - 1 ? 'current' : 'clickable'}
                  onClick={() => idx === 0 && setLectureNavState({ type: 'root' })}
                >
                  {crumb}
                </span>
              </span>
            ))}
          </div>

          {lectureNavState.type !== 'root' && (
            <button className="btn btn-back" onClick={goBackLecture}>← Quay lại</button>
          )}

          {!addingLectureFolder && (
            <div className="folder-actions">
              {lectureNavState.type === 'folder' && (
                <button className="btn btn-primary" onClick={() => onNavigateToLectureEditor?.(undefined, lectureNavState.folderId, lectureNavState.level)}>
                  + Tạo bài giảng
                </button>
              )}
              {lectureNavState.type === 'level' && (
                <button className="btn btn-secondary" onClick={() => setAddingLectureFolder(true)}>
                  + Tạo thư mục
                </button>
              )}
            </div>
          )}

          {addingLectureFolder && (
            <div className="add-category-inline">
              <input
                type="text"
                className="category-input"
                placeholder="Tên thư mục..."
                value={newLectureFolderName}
                onChange={(e) => setNewLectureFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddLectureFolder();
                  if (e.key === 'Escape') { setAddingLectureFolder(false); setNewLectureFolderName(''); }
                }}
                autoFocus
              />
              <button className="btn btn-primary" onClick={handleAddLectureFolder}>Lưu</button>
              <button className="btn btn-cancel" onClick={() => { setAddingLectureFolder(false); setNewLectureFolderName(''); }}>Hủy</button>
            </div>
          )}

          {lecturesLoading ? (
            <div className="loading-state">Đang tải...</div>
          ) : (
            <div className="folder-content">
              {/* Root: show JLPT levels */}
              {lectureNavState.type === 'root' && (
                <div className="folder-list">
                  {JLPT_LEVELS.map(level => (
                    <div
                      key={level}
                      className="folder-item"
                      onClick={() => setLectureNavState({ type: 'level', level })}
                    >
                      <span className="folder-icon">📁</span>
                      <span className="folder-name">{level}</span>
                      <span className="folder-count">({getLectureCountByLevel(level)} bài giảng)</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Level: show folders */}
              {lectureNavState.type === 'level' && (
                <div className="folder-list">
                  {getLectureFoldersByLevel(lectureNavState.level).map(folder => (
                    <div
                      key={folder.id}
                      className="folder-item"
                      onClick={() => setLectureNavState({
                        type: 'folder',
                        level: lectureNavState.level,
                        folderId: folder.id,
                        folderName: folder.name,
                      })}
                    >
                      <span className="folder-icon">📂</span>
                      {editingLectureFolderId === folder.id ? (
                        <input
                          type="text"
                          className="edit-input inline"
                          value={editingLectureFolderName}
                          onChange={(e) => setEditingLectureFolderName(e.target.value)}
                          onBlur={() => handleUpdateLectureFolder(folder.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateLectureFolder(folder.id);
                            if (e.key === 'Escape') { setEditingLectureFolderId(null); setEditingLectureFolderName(''); }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      ) : (
                        <span
                          className="folder-name"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingLectureFolderId(folder.id);
                            setEditingLectureFolderName(folder.name);
                          }}
                        >
                          {folder.name}
                        </span>
                      )}
                      <span className="folder-count">({getLectureCountByFolder(folder.id)} bài giảng)</span>
                      {canModifyLectureFolder(folder) && (
                        <>
                          <button
                            className="edit-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingLectureFolderId(folder.id);
                              setEditingLectureFolderName(folder.name);
                            }}
                            title="Sửa tên"
                          >✎</button>
                          <button
                            className="delete-btn"
                            onClick={(e) => { e.stopPropagation(); setDeleteLectureFolderTarget(folder); }}
                            title="Xóa"
                          >×</button>
                        </>
                      )}
                    </div>
                  ))}
                  {getLectureFoldersByLevel(lectureNavState.level).length === 0 && (
                    <p className="empty-message">Chưa có thư mục nào. Nhấn "+ Tạo thư mục" để thêm.</p>
                  )}
                </div>
              )}

              {/* Folder: show lectures */}
              {lectureNavState.type === 'folder' && (
                <div className="lecture-grid" style={{ marginTop: '1rem' }}>
                  {getLecturesByFolder(lectureNavState.folderId).length === 0 ? (
                    <p className="empty-message">Chưa có bài giảng nào. Nhấn "+ Tạo bài giảng" để thêm.</p>
                  ) : (
                    getLecturesByFolder(lectureNavState.folderId).map((lecture) => (
                      <LectureCard
                        key={lecture.id}
                        lecture={lecture}
                        onClick={() => onNavigateToLectureEditor?.(lecture.id)}
                        onEdit={() => onNavigateToLectureEditor?.(lecture.id)}
                        onDelete={() => setDeleteLectureTarget(lecture)}
                        onHide={() => toggleLectureHide(lecture.id)}
                        showActions={true}
                        canHide={canHideLecture(lecture)}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Assignments Management Tab */}
      {activeTab === 'assignments' && (
        <div className="assignments-tab-content">
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <h3>Quản lý bài tập</h3>
            <p>Tính năng đang được phát triển</p>
          </div>
        </div>
      )}

      {/* Test Bank Management Tab */}
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

      <ConfirmModal
        isOpen={deleteUserTarget !== null}
        title="Xác nhận xóa người dùng"
        message={`Bạn có chắc muốn xóa người dùng "${deleteUserTarget?.username || ''}"?`}
        confirmText="Xóa"
        onConfirm={() => {
          if (deleteUserTarget) {
            onDeleteUser(deleteUserTarget.id);
            setDeleteUserTarget(null);
          }
        }}
        onCancel={() => setDeleteUserTarget(null)}
      />

      <ConfirmModal
        isOpen={deleteLectureTarget !== null}
        title="Xác nhận xóa bài giảng"
        message={`Bạn có chắc muốn xóa bài giảng "${deleteLectureTarget?.title || ''}"?`}
        confirmText="Xóa"
        onConfirm={async () => {
          if (deleteLectureTarget) {
            await deleteLecture(deleteLectureTarget.id);
            setDeleteLectureTarget(null);
          }
        }}
        onCancel={() => setDeleteLectureTarget(null)}
      />

      <ConfirmModal
        isOpen={deleteLessonTarget !== null}
        title="Xác nhận xóa bài học"
        message={`Bạn có chắc muốn xóa bài học "${deleteLessonTarget?.name || ''}"? Tất cả nội dung bên trong cũng sẽ bị xóa.`}
        confirmText="Xóa"
        onConfirm={() => {
          if (deleteLessonTarget) {
            onDeleteLesson(deleteLessonTarget.id);
            setDeleteLessonTarget(null);
          }
        }}
        onCancel={() => setDeleteLessonTarget(null)}
      />

      <ConfirmModal
        isOpen={deleteFolderTarget !== null}
        title="Xác nhận xóa thư mục"
        message={`Bạn có chắc muốn xóa thư mục "${deleteFolderTarget?.name || ''}"? Tất cả câu hỏi bên trong cũng sẽ bị xóa.`}
        confirmText="Xóa"
        onConfirm={() => {
          if (deleteFolderTarget) {
            onDeleteJLPTFolder(deleteFolderTarget.id);
            setDeleteFolderTarget(null);
          }
        }}
        onCancel={() => setDeleteFolderTarget(null)}
      />

      <ConfirmModal
        isOpen={deleteJLPTQuestionTarget !== null}
        title="Xác nhận xóa câu hỏi JLPT"
        message={`Bạn có chắc muốn xóa câu hỏi "${deleteJLPTQuestionTarget?.question?.slice(0, 50) || ''}..."?`}
        confirmText="Xóa"
        onConfirm={async () => {
          if (deleteJLPTQuestionTarget) {
            await onDeleteJLPTQuestion(deleteJLPTQuestionTarget.id);
            setDeleteJLPTQuestionTarget(null);
          }
        }}
        onCancel={() => setDeleteJLPTQuestionTarget(null)}
      />

      <ConfirmModal
        isOpen={deleteLectureFolderTarget !== null}
        title="Xác nhận xóa thư mục bài giảng"
        message={`Bạn có chắc muốn xóa thư mục "${deleteLectureFolderTarget?.name || ''}"? Các bài giảng bên trong sẽ không bị xóa.`}
        confirmText="Xóa"
        onConfirm={async () => {
          if (deleteLectureFolderTarget) {
            await deleteLectureFolderAction(deleteLectureFolderTarget.id);
            setDeleteLectureFolderTarget(null);
          }
        }}
        onCancel={() => setDeleteLectureFolderTarget(null)}
      />

      <ConfirmModal
        isOpen={deleteKaiwaFolderTarget !== null}
        title="Xác nhận xóa thư mục Kaiwa"
        message={`Bạn có chắc muốn xóa thư mục "${deleteKaiwaFolderTarget?.name || ''}"? Tất cả câu hỏi bên trong cũng sẽ bị xóa.`}
        confirmText="Xóa"
        onConfirm={async () => {
          if (deleteKaiwaFolderTarget && onDeleteKaiwaFolder) {
            await onDeleteKaiwaFolder(deleteKaiwaFolderTarget.id);
            setDeleteKaiwaFolderTarget(null);
          }
        }}
        onCancel={() => setDeleteKaiwaFolderTarget(null)}
      />

      <ConfirmModal
        isOpen={deleteKaiwaQuestionTarget !== null}
        title="Xác nhận xóa câu hỏi"
        message={`Bạn có chắc muốn xóa câu hỏi này?`}
        confirmText="Xóa"
        onConfirm={async () => {
          if (deleteKaiwaQuestionTarget && onDeleteKaiwaQuestion) {
            await onDeleteKaiwaQuestion(deleteKaiwaQuestionTarget.id);
            setDeleteKaiwaQuestionTarget(null);
          }
        }}
        onCancel={() => setDeleteKaiwaQuestionTarget(null)}
      />
    </div>
  );
}
