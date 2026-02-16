// Custom Topics Tab - Orchestrator Component
// Manages state, navigation, and delegates rendering to sub-views

import { useState, useMemo } from 'react';
import { ConfirmModal } from '../../ui/confirm-modal';
import { DEFAULT_TOPIC_FORM, DEFAULT_QUESTION_FORM } from '../../../types/custom-topic';
import { TopicsListView } from './topics-list-view';
import { TopicDetailView } from './topic-detail-view';
import { FolderDetailView } from './folder-detail-view';
import { TopicModal } from './topic-modal';
import { QuestionModal } from './question-modal';
import type {
  CustomTopicsTabProps,
  NavState,
  ViewMode,
  DetailSessionTab,
  CustomTopic,
  CustomTopicFolder,
  CustomTopicQuestion,
  CustomTopicFormData,
  CustomTopicQuestionFormData,
} from './custom-topics-types';
import type { JLPTLevel } from '../../../types/kaiwa';

export function CustomTopicsTab({
  topics,
  folders,
  questions,
  currentUser,
  isSuperAdmin,
  lessons = [],
  getLessonsByLevel,
  grammarLessons = [],
  getGrammarLessonsByLevel,
  onAddTopic,
  onUpdateTopic,
  onDeleteTopic,
  onDeleteFolder: _onDeleteFolder,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onExportTopic,
  onImportTopic,
}: CustomTopicsTabProps) {
  // Navigation & view state
  const [navState, setNavState] = useState<NavState>({ type: 'topics' });
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<CustomTopic | null>(null);
  const [topicForm, setTopicForm] = useState<CustomTopicFormData>(DEFAULT_TOPIC_FORM);

  // Detail session tab
  const [detailSessionTab, setDetailSessionTab] = useState<DetailSessionTab>('sources');
  const [selectedSourceLevel, setSelectedSourceLevel] = useState<JLPTLevel>('N5');
  const [selectedSourceType, setSelectedSourceType] = useState<'vocabulary' | 'grammar'>('vocabulary');

  // Question states
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<CustomTopicQuestion | null>(null);
  const [questionForm, setQuestionForm] = useState<CustomTopicQuestionFormData>(DEFAULT_QUESTION_FORM);

  // Delete confirmation
  const [deleteTopicTarget, setDeleteTopicTarget] = useState<CustomTopic | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<CustomTopicFolder | null>(null);
  const [deleteQuestionTarget, setDeleteQuestionTarget] = useState<CustomTopicQuestion | null>(null);

  // Permissions
  const canModifyTopic = (t: CustomTopic) => isSuperAdmin || t.createdBy === currentUser.id;
  const canModifyQuestion = (q: CustomTopicQuestion) => isSuperAdmin || q.createdBy === currentUser.id;

  // Get current topic
  const currentTopic = useMemo(() => {
    if (navState.topicId) return topics.find(t => t.id === navState.topicId);
    return null;
  }, [navState.topicId, topics]);

  // Get folders for current topic
  const currentFolders = useMemo(() => {
    if (!navState.topicId) return [];
    return folders.filter(f => f.topicId === navState.topicId).sort((a, b) => a.order - b.order);
  }, [navState.topicId, folders]);

  // Get questions for current view
  const currentQuestions = useMemo(() => {
    if (navState.type === 'folder-detail' && navState.folderId) {
      return questions.filter(q => q.folderId === navState.folderId);
    }
    if (navState.type === 'topic-detail' && navState.topicId) {
      // Show questions without folder if topic has no folders
      if (currentFolders.length === 0) {
        return questions.filter(q => q.topicId === navState.topicId && !q.folderId);
      }
    }
    return [];
  }, [navState, questions, currentFolders]);

  // Filter topics by search
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return topics;
    const query = searchQuery.toLowerCase();
    return topics.filter(t =>
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query) ||
      t.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [topics, searchQuery]);

  // Get question count for topic
  const getTopicQuestionCount = (topicId: string) => questions.filter(q => q.topicId === topicId).length;

  // ==================== HANDLERS ====================

  // Topic handlers
  const handleOpenTopicModal = (topic?: CustomTopic) => {
    if (topic) {
      setEditingTopic(topic);
      setTopicForm({
        name: topic.name,
        description: topic.description,
        icon: topic.icon,
        color: topic.color,
        difficulty: topic.difficulty,
        tags: topic.tags,
        isPublic: topic.isPublic,
        linkedLessonIds: topic.linkedLessonIds || [],
      });
    } else {
      setEditingTopic(null);
      setTopicForm(DEFAULT_TOPIC_FORM);
    }
    setSelectedSourceLevel('N5');
    setShowTopicModal(true);
  };

  const handleSaveTopic = async () => {
    if (!topicForm.name.trim()) return;
    if (editingTopic) {
      await onUpdateTopic(editingTopic.id, topicForm);
    } else {
      await onAddTopic(topicForm);
    }
    setShowTopicModal(false);
    setEditingTopic(null);
    setTopicForm(DEFAULT_TOPIC_FORM);
  };

  // Question handlers
  const handleOpenQuestionForm = (question?: CustomTopicQuestion) => {
    if (question) {
      setEditingQuestion(question);
      setQuestionForm({
        topicId: question.topicId,
        folderId: question.folderId,
        questionJa: question.questionJa,
        questionVi: question.questionVi || '',
        situationContext: question.situationContext || '',
        suggestedAnswers: question.suggestedAnswers || [],
        difficulty: question.difficulty,
        tags: question.tags || [],
      });
    } else {
      setEditingQuestion(null);
      setQuestionForm({
        ...DEFAULT_QUESTION_FORM,
        topicId: navState.topicId || '',
        folderId: navState.folderId,
      });
    }
    setShowQuestionForm(true);
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.questionJa.trim()) return;
    if (editingQuestion) {
      await onUpdateQuestion(editingQuestion.id, questionForm);
    } else {
      await onAddQuestion(questionForm);
    }
    setShowQuestionForm(false);
    setEditingQuestion(null);
    setQuestionForm(DEFAULT_QUESTION_FORM);
  };

  // Suggested answers handlers
  const handleAddSuggestedAnswer = () => {
    setQuestionForm({
      ...questionForm,
      suggestedAnswers: [...(questionForm.suggestedAnswers || []), ''],
    });
  };

  const handleUpdateSuggestedAnswer = (index: number, value: string) => {
    const newAnswers = [...(questionForm.suggestedAnswers || [])];
    newAnswers[index] = value;
    setQuestionForm({ ...questionForm, suggestedAnswers: newAnswers });
  };

  const handleRemoveSuggestedAnswer = (index: number) => {
    const newAnswers = (questionForm.suggestedAnswers || []).filter((_, i) => i !== index);
    setQuestionForm({ ...questionForm, suggestedAnswers: newAnswers });
  };

  // Navigation
  const goBack = () => {
    if (navState.type === 'folder-detail') {
      setNavState({ type: 'topic-detail', topicId: navState.topicId });
    } else if (navState.type === 'topic-detail') {
      setNavState({ type: 'topics' });
    }
    setShowQuestionForm(false);
  };

  // Lesson toggle handler for topic detail
  const handleToggleLesson = (lessonId: string) => {
    if (!currentTopic) return;
    const currentLinked = currentTopic.linkedLessonIds || [];
    const isLinked = currentLinked.includes(lessonId);
    const newLinked = isLinked
      ? currentLinked.filter(id => id !== lessonId)
      : [...currentLinked, lessonId];
    onUpdateTopic(currentTopic.id, { linkedLessonIds: newLinked });
  };

  // ==================== RENDER ====================

  // Topics List View
  if (navState.type === 'topics') {
    return (
      <>
        <TopicsListView
          topics={filteredTopics}
          viewMode={viewMode}
          searchQuery={searchQuery}
          canModifyTopic={canModifyTopic}
          getTopicQuestionCount={getTopicQuestionCount}
          onSearchChange={setSearchQuery}
          onViewModeChange={setViewMode}
          onTopicClick={(id) => setNavState({ type: 'topic-detail', topicId: id })}
          onAddTopic={() => handleOpenTopicModal()}
          onEditTopic={handleOpenTopicModal}
          onDeleteTopic={setDeleteTopicTarget}
          onExportTopic={onExportTopic}
          onImportTopic={onImportTopic}
        />

        {/* Topic Modal */}
        <TopicModal
          isOpen={showTopicModal}
          editingTopic={editingTopic}
          formData={topicForm}
          selectedSourceLevel={selectedSourceLevel}
          selectedSourceType={selectedSourceType}
          lessons={lessons}
          grammarLessons={grammarLessons}
          getLessonsByLevel={getLessonsByLevel}
          getGrammarLessonsByLevel={getGrammarLessonsByLevel}
          onClose={() => setShowTopicModal(false)}
          onSave={handleSaveTopic}
          onFormChange={setTopicForm}
          onSourceLevelChange={setSelectedSourceLevel}
          onSourceTypeChange={setSelectedSourceType}
        />

        {/* Delete Confirmation */}
        <ConfirmModal
          isOpen={deleteTopicTarget !== null}
          title="Xác nhận xóa chủ đề"
          message={`Xóa chủ đề "${deleteTopicTarget?.name}"? Tất cả câu hỏi bên trong cũng sẽ bị xóa vĩnh viễn.`}
          confirmText="Xóa"
          onConfirm={async () => {
            if (deleteTopicTarget) {
              await onDeleteTopic(deleteTopicTarget.id);
              setDeleteTopicTarget(null);
            }
          }}
          onCancel={() => setDeleteTopicTarget(null)}
        />
      </>
    );
  }

  // Topic Detail View
  if (navState.type === 'topic-detail' && currentTopic) {
    return (
      <>
        <TopicDetailView
          topic={currentTopic}
          questions={currentQuestions}
          lessons={lessons}
          detailSessionTab={detailSessionTab}
          selectedSourceLevel={selectedSourceLevel}
          canModify={canModifyTopic(currentTopic)}
          canModifyQuestion={canModifyQuestion}
          getQuestionCount={getTopicQuestionCount}
          getLessonsByLevel={getLessonsByLevel}
          onBack={goBack}
          onSettings={() => handleOpenTopicModal(currentTopic)}
          onTabChange={setDetailSessionTab}
          onSourceLevelChange={setSelectedSourceLevel}
          onAddQuestion={() => handleOpenQuestionForm()}
          onEditQuestion={handleOpenQuestionForm}
          onDeleteQuestion={setDeleteQuestionTarget}
          onToggleLesson={handleToggleLesson}
        />

        {/* Question Form Modal */}
        <QuestionModal
          isOpen={showQuestionForm}
          editingQuestion={editingQuestion}
          formData={questionForm}
          onClose={() => setShowQuestionForm(false)}
          onSave={handleSaveQuestion}
          onFormChange={setQuestionForm}
          onAddSuggestedAnswer={handleAddSuggestedAnswer}
          onUpdateSuggestedAnswer={handleUpdateSuggestedAnswer}
          onRemoveSuggestedAnswer={handleRemoveSuggestedAnswer}
        />

        {/* Delete Confirmations */}
        <ConfirmModal
          isOpen={deleteFolderTarget !== null}
          title="Xác nhận xóa thư mục"
          message={`Xóa thư mục "${deleteFolderTarget?.name}"? Tất cả câu hỏi bên trong cũng sẽ bị xóa.`}
          confirmText="Xóa"
          onConfirm={async () => {
            if (deleteFolderTarget) {
              await _onDeleteFolder(deleteFolderTarget.id);
              setDeleteFolderTarget(null);
            }
          }}
          onCancel={() => setDeleteFolderTarget(null)}
        />

        <ConfirmModal
          isOpen={deleteQuestionTarget !== null}
          title="Xác nhận xóa câu hỏi"
          message={`Xóa câu hỏi này?`}
          confirmText="Xóa"
          onConfirm={async () => {
            if (deleteQuestionTarget) {
              await onDeleteQuestion(deleteQuestionTarget.id);
              setDeleteQuestionTarget(null);
            }
          }}
          onCancel={() => setDeleteQuestionTarget(null)}
        />
      </>
    );
  }

  // Folder Detail View
  if (navState.type === 'folder-detail' && navState.folderId) {
    const currentFolder = currentFolders.find(f => f.id === navState.folderId);
    if (!currentFolder || !currentTopic) return null;

    return (
      <>
        <FolderDetailView
          folder={currentFolder}
          topic={currentTopic}
          questions={currentQuestions}
          canModifyQuestion={canModifyQuestion}
          onBack={goBack}
          onAddQuestion={() => handleOpenQuestionForm()}
          onEditQuestion={handleOpenQuestionForm}
          onDeleteQuestion={setDeleteQuestionTarget}
        />

        {/* Question Form Modal */}
        <QuestionModal
          isOpen={showQuestionForm}
          editingQuestion={editingQuestion}
          formData={questionForm}
          onClose={() => setShowQuestionForm(false)}
          onSave={handleSaveQuestion}
          onFormChange={setQuestionForm}
          onAddSuggestedAnswer={handleAddSuggestedAnswer}
          onUpdateSuggestedAnswer={handleUpdateSuggestedAnswer}
          onRemoveSuggestedAnswer={handleRemoveSuggestedAnswer}
        />

        {/* Delete Confirmation */}
        <ConfirmModal
          isOpen={deleteQuestionTarget !== null}
          title="Xác nhận xóa câu hỏi"
          message={`Xóa câu hỏi này?`}
          confirmText="Xóa"
          onConfirm={async () => {
            if (deleteQuestionTarget) {
              await onDeleteQuestion(deleteQuestionTarget.id);
              setDeleteQuestionTarget(null);
            }
          }}
          onCancel={() => setDeleteQuestionTarget(null)}
        />
      </>
    );
  }

  return null;
}
