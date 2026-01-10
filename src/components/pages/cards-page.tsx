// Cards management page with Level → Parent Lesson → Child Lesson → Flashcard structure
// Also includes JLPT question management

import { useState } from 'react';
import type { Flashcard, FlashcardFormData, Lesson, JLPTLevel } from '../../types/flashcard';
import type { CurrentUser } from '../../types/user';
import type { JLPTQuestion, JLPTQuestionFormData, JLPTLevel as JLPTQuestionLevel, QuestionCategory, JLPTAnswer, JLPTFolder } from '../../types/jlpt-question';
import { FlashcardForm } from '../flashcard/flashcard-form';
import { FlashcardList } from '../flashcard/flashcard-list';
import { ConfirmModal } from '../ui/confirm-modal';

type ManagementTab = 'flashcards' | 'jlpt';

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

const JLPT_QUESTION_LEVELS: JLPTQuestionLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
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
}: CardsPageProps) {
  const isSuperAdmin = currentUser.role === 'super_admin';
  const [activeTab, setActiveTab] = useState<ManagementTab>('flashcards');

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
            Cấp Độ
          </button>
          <button
            className={`tab-btn ${activeTab === 'jlpt' ? 'active' : ''}`}
            onClick={() => setActiveTab('jlpt')}
          >
            JLPT
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
                                    onClick={() => onDeleteJLPTQuestion(question.id)}
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
                                  onClick={() => onDeleteJLPTQuestion(question.id)}
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
    </div>
  );
}
