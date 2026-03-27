// Topic Detail View Component
import { ArrowLeft, Settings, BookOpen, FileQuestion, Plus, Circle, CheckCircle } from 'lucide-react';
import { EmptyState } from '../../ui/empty-state';
import { JLPT_LEVELS } from '../../../constants/jlpt';
import { QuestionCard } from './question-card';
import { renderTopicIcon } from './custom-topics-types';
import type { CustomTopic, CustomTopicQuestion, DetailSessionTab } from './custom-topics-types';
import type { JLPTLevel } from '../../../types/kaiwa';
import type { Lesson } from '../../../types/flashcard';

interface TopicDetailViewProps {
  topic: CustomTopic;
  questions: CustomTopicQuestion[];
  lessons: Lesson[];
  detailSessionTab: DetailSessionTab;
  selectedSourceLevel: JLPTLevel;
  canModify: boolean;
  canModifyQuestion: (q: CustomTopicQuestion) => boolean;
  getQuestionCount: (topicId: string) => number;
  getLessonsByLevel?: (level: JLPTLevel) => Lesson[];
  onBack: () => void;
  onSettings: () => void;
  onTabChange: (tab: DetailSessionTab) => void;
  onSourceLevelChange: (level: JLPTLevel) => void;
  onAddQuestion: () => void;
  onEditQuestion: (question: CustomTopicQuestion) => void;
  onDeleteQuestion: (question: CustomTopicQuestion) => void;
  onToggleLesson: (lessonId: string) => void;
}

export function TopicDetailView({
  topic,
  questions,
  lessons,
  detailSessionTab,
  selectedSourceLevel,
  canModify,
  canModifyQuestion,
  getQuestionCount,
  getLessonsByLevel,
  onBack,
  onSettings,
  onTabChange,
  onSourceLevelChange,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onToggleLesson,
}: TopicDetailViewProps) {
  const levelLessons = getLessonsByLevel
    ? getLessonsByLevel(selectedSourceLevel)
    : lessons.filter(l => l.jlptLevel === selectedSourceLevel && !l.parentId);

  return (
    <div className="custom-topics-management">
      {/* Header */}
      <div className="detail-header">
        <button className="btn btn-back" onClick={onBack}>
          <ArrowLeft size={18} /> Quay lại
        </button>
        <div className="detail-title">
          <span className="detail-icon" style={{ backgroundColor: `${topic.color}20`, color: topic.color }}>
            {renderTopicIcon(topic.icon, 28)}
          </span>
          <div>
            <h2>{topic.name}</h2>
            <p>{topic.description}</p>
          </div>
        </div>
        <div className="detail-actions">
          {canModify && (
            <button className="btn btn-secondary" onClick={onSettings}>
              <Settings size={16} /> Cài đặt
            </button>
          )}
        </div>
      </div>

      {/* Session Tabs */}
      <div className="detail-session-tabs">
        <button
          className={`session-tab-btn ${detailSessionTab === 'sources' ? 'active' : ''}`}
          onClick={() => onTabChange('sources')}
        >
          <BookOpen size={16} /> Nguồn từ vựng / Ngữ pháp
        </button>
        <button
          className={`session-tab-btn ${detailSessionTab === 'questions' ? 'active' : ''}`}
          onClick={() => onTabChange('questions')}
        >
          <FileQuestion size={16} /> Câu hỏi ({getQuestionCount(topic.id)})
        </button>
      </div>

      {/* Sources Session */}
      {detailSessionTab === 'sources' && (
        <div className="sources-session">
          <div className="sources-header">
            <p className="sources-description">
              Chọn các bài học từ vựng, ngữ pháp để AI sử dụng khi hội thoại với bạn.
            </p>
            <div className="level-filter">
              <label>Cấp độ:</label>
              <select
                value={selectedSourceLevel}
                onChange={e => onSourceLevelChange(e.target.value as JLPTLevel)}
              >
                {JLPT_LEVELS.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Lessons Grid */}
          <div className="lessons-source-grid">
            {levelLessons.map(lesson => {
              const isLinked = topic.linkedLessonIds?.includes(lesson.id);
              return (
                <div
                  key={lesson.id}
                  className={`lesson-source-item ${isLinked ? 'linked' : ''}`}
                  onClick={() => onToggleLesson(lesson.id)}
                >
                  <div className="lesson-checkbox">
                    {isLinked ? <CheckCircle size={20} /> : <Circle size={20} />}
                  </div>
                  <div className="lesson-info">
                    <span className="lesson-name">{lesson.name}</span>
                    <span className="lesson-level">{lesson.jlptLevel}</span>
                  </div>
                </div>
              );
            })}
            {levelLessons.length === 0 && (
              <EmptyState compact title={`Chưa có bài học nào ở cấp độ ${selectedSourceLevel}`} />
            )}
          </div>

          {/* Linked Summary */}
          {(topic.linkedLessonIds?.length || 0) > 0 && (
            <div className="linked-summary">
              <span className="linked-count">
                Đã liên kết: {topic.linkedLessonIds?.length} bài học
              </span>
            </div>
          )}
        </div>
      )}

      {/* Questions Session */}
      {detailSessionTab === 'questions' && (
        <div className="questions-session">
          <div className="questions-header">
            <p className="questions-description">
              Tạo câu hỏi để AI sử dụng khi bắt đầu hội thoại với bạn.
            </p>
            <button className="btn btn-primary" onClick={onAddQuestion}>
              <Plus size={16} /> Thêm câu hỏi
            </button>
          </div>

          <div className="questions-list">
            {questions.length === 0 ? (
              <EmptyState compact title="Chưa có câu hỏi" description='Bấm "Thêm câu hỏi" để tạo' />
            ) : (
              questions.map((q, i) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  index={i}
                  canModify={canModifyQuestion(q)}
                  onEdit={() => onEditQuestion(q)}
                  onDelete={() => onDeleteQuestion(q)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
