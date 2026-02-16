// Kaiwa Topics Management - Orchestrator
// Professional UI for creating and managing custom conversation topics

import { useState, useMemo } from 'react';
import {
  DEFAULT_KAIWA_TOPIC_FORM,
  DEFAULT_KAIWA_QUESTION_FORM,
} from '../../../types/kaiwa-advanced';
import type {
  KaiwaAdvancedTopic,
  KaiwaAdvancedQuestion,
  KaiwaAdvancedTopicFormData,
  KaiwaAdvancedQuestionFormData,
} from '../../../types/kaiwa-advanced';
import type {
  KaiwaTopicsManagementProps,
  NavState,
  ViewMode,
  CanModifyTopicFn,
  CanModifyQuestionFn,
} from './topics-management-types';
import { TopicsListView } from './topics-list-view';
import { TopicFormModal } from './topic-form-modal';
import { TopicDetailView } from './topic-detail-view';
import { QuestionFormModal } from './question-form-modal';
import { QuestionCard } from './question-card';

export function KaiwaTopicsManagement({
  topics,
  questions,
  currentUserId,
  isSuperAdmin,
  onAddTopic,
  onUpdateTopic,
  onDeleteTopic,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
}: KaiwaTopicsManagementProps) {
  // Navigation & view state
  const [navState, setNavState] = useState<NavState>({ type: 'topics' });
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<KaiwaAdvancedTopic | null>(null);
  const [topicForm, setTopicForm] = useState<KaiwaAdvancedTopicFormData>(DEFAULT_KAIWA_TOPIC_FORM);

  // Question states
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<KaiwaAdvancedQuestion | null>(null);
  const [questionForm, setQuestionForm] = useState<KaiwaAdvancedQuestionFormData>(DEFAULT_KAIWA_QUESTION_FORM);

  // Delete confirmation
  const [deleteTopicTarget, setDeleteTopicTarget] = useState<KaiwaAdvancedTopic | null>(null);
  const [deleteQuestionTarget, setDeleteQuestionTarget] = useState<KaiwaAdvancedQuestion | null>(null);

  // Permissions
  const canModifyTopic: CanModifyTopicFn = (t) => isSuperAdmin || t.createdBy === currentUserId;
  const canModifyQuestion: CanModifyQuestionFn = (q) => {
    const topic = topics.find(t => t.id === q.topicId);
    return !!(isSuperAdmin || (topic && topic.createdBy === currentUserId));
  };

  // Get current topic
  const currentTopic = useMemo(() => {
    if (navState.topicId) return topics.find(t => t.id === navState.topicId);
    return null;
  }, [navState.topicId, topics]);

  // Get questions for current topic
  const currentQuestions = useMemo(() => {
    if (!navState.topicId) return [];
    return questions
      .filter(q => q.topicId === navState.topicId)
      .sort((a, b) => a.order - b.order);
  }, [navState.topicId, questions]);

  // ==================== HANDLERS ====================

  // Topic handlers
  const handleOpenTopicModal = (topic?: KaiwaAdvancedTopic) => {
    if (topic) {
      setEditingTopic(topic);
      setTopicForm({
        name: topic.name,
        description: topic.description,
        icon: topic.icon,
        color: topic.color,
        level: topic.level,
        style: topic.style,
        vocabulary: topic.vocabulary || [],
        questionBank: topic.questionBank || [],
        answerBank: topic.answerBank || [],
        isPublic: topic.isPublic,
      });
    } else {
      setEditingTopic(null);
      setTopicForm(DEFAULT_KAIWA_TOPIC_FORM);
    }
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
    setTopicForm(DEFAULT_KAIWA_TOPIC_FORM);
  };

  const handleUpdateTopicForm = (updates: Partial<KaiwaAdvancedTopicFormData>) => {
    setTopicForm({ ...topicForm, ...updates });
  };

  // Question handlers
  const handleOpenQuestionModal = (question?: KaiwaAdvancedQuestion) => {
    if (question) {
      setEditingQuestion(question);
      setQuestionForm({
        topicId: question.topicId,
        questionJa: question.questionJa,
        questionVi: question.questionVi || '',
        situationContext: question.situationContext || '',
        suggestedAnswers: question.suggestedAnswers || [],
        vocabulary: question.vocabulary || [],
      });
    } else {
      setEditingQuestion(null);
      setQuestionForm({
        ...DEFAULT_KAIWA_QUESTION_FORM,
        topicId: navState.topicId || '',
      });
    }
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.questionJa.trim()) return;
    if (editingQuestion) {
      await onUpdateQuestion(editingQuestion.id, questionForm);
    } else {
      await onAddQuestion(questionForm);
    }
    setShowQuestionModal(false);
    setEditingQuestion(null);
    setQuestionForm(DEFAULT_KAIWA_QUESTION_FORM);
  };

  const handleUpdateQuestionForm = (updates: Partial<KaiwaAdvancedQuestionFormData>) => {
    setQuestionForm({ ...questionForm, ...updates });
  };

  // Navigation
  const goBack = () => {
    setNavState({ type: 'topics' });
    setShowQuestionModal(false);
  };

  // Question Card renderer
  const renderQuestionCard = (question: KaiwaAdvancedQuestion, index: number) => (
    <QuestionCard
      key={question.id}
      question={question}
      index={index}
      deleteQuestionTarget={deleteQuestionTarget}
      canModifyQuestion={canModifyQuestion}
      onOpenQuestionModal={handleOpenQuestionModal}
      onSetDeleteQuestionTarget={setDeleteQuestionTarget}
      onDeleteQuestion={onDeleteQuestion}
    />
  );

  // ==================== RENDER ====================

  // Topics List View
  if (navState.type === 'topics') {
    return (
      <>
        <TopicsListView
          topics={topics}
          viewMode={viewMode}
          searchQuery={searchQuery}
          deleteTopicTarget={deleteTopicTarget}
          canModifyTopic={canModifyTopic}
          onSetViewMode={setViewMode}
          onSetSearchQuery={setSearchQuery}
          onTopicClick={(topicId) => setNavState({ type: 'topic-detail', topicId })}
          onOpenTopicModal={handleOpenTopicModal}
          onSetDeleteTopicTarget={setDeleteTopicTarget}
          onDeleteTopic={onDeleteTopic}
        />

        {/* Topic Modal */}
        <TopicFormModal
          isOpen={showTopicModal}
          editingTopic={editingTopic}
          topicForm={topicForm}
          onClose={() => setShowTopicModal(false)}
          onSave={handleSaveTopic}
          onUpdateForm={handleUpdateTopicForm}
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
          canModifyTopic={canModifyTopic}
          onGoBack={goBack}
          onOpenTopicModal={handleOpenTopicModal}
          onOpenQuestionModal={handleOpenQuestionModal}
          renderQuestionCard={renderQuestionCard}
        />

        {/* Question Modal */}
        <QuestionFormModal
          isOpen={showQuestionModal}
          editingQuestion={editingQuestion}
          questionForm={questionForm}
          onClose={() => setShowQuestionModal(false)}
          onSave={handleSaveQuestion}
          onUpdateForm={handleUpdateQuestionForm}
        />

        {/* Topic Modal (for editing from detail view) */}
        <TopicFormModal
          isOpen={showTopicModal}
          editingTopic={editingTopic}
          topicForm={topicForm}
          onClose={() => setShowTopicModal(false)}
          onSave={handleSaveTopic}
          onUpdateForm={handleUpdateTopicForm}
        />
      </>
    );
  }

  return null;
}
