// Default question selector section for kaiwa setup view

import { X, ListChecks, ChevronRight, Folder, FileText, ArrowLeft } from 'lucide-react';
import type { JLPTLevel, ConversationStyle, ConversationTopic } from '../../../types/kaiwa';
import { JLPT_LEVELS, CONVERSATION_TOPICS, CONVERSATION_STYLES } from '../../../constants/kaiwa';

interface KaiwaSetupQuestionSelectorProps {
  questionSelectorState: any;
  selectedDefaultQuestion: any;
  setQuestionSelectorState: (state: any) => void;
  setSelectedDefaultQuestion: (q: any) => void;
  setLevel: (level: JLPTLevel) => void;
  setStyle: (style: ConversationStyle) => void;
  handleTopicChange: (topic: ConversationTopic) => void;
  getQuestionsForSelector: () => any[];
  getFoldersForSelector: () => any[];
}

export function KaiwaSetupQuestionSelector({
  questionSelectorState,
  selectedDefaultQuestion,
  setQuestionSelectorState,
  setSelectedDefaultQuestion,
  setLevel,
  setStyle,
  handleTopicChange,
  getQuestionsForSelector,
  getFoldersForSelector,
}: KaiwaSetupQuestionSelectorProps) {
  return (
    <div className="kaiwa-question-selector-section">
      <div className="kaiwa-selector-header">
        <button
          className={`kaiwa-mode-btn ${questionSelectorState.type !== 'hidden' ? 'active' : ''}`}
          onClick={() => setQuestionSelectorState(
            questionSelectorState.type === 'hidden' ? { type: 'level' } : { type: 'hidden' }
          )}
        >
          <ListChecks size={18} />
          {questionSelectorState.type === 'hidden' ? 'Chọn câu hỏi mặc định' : 'Ẩn danh sách'}
        </button>
        {selectedDefaultQuestion && (
          <button
            className="kaiwa-clear-selection-btn"
            onClick={() => {
              setSelectedDefaultQuestion(null);
              setQuestionSelectorState({ type: 'hidden' });
            }}
          >
            <X size={14} /> Bỏ chọn
          </button>
        )}
      </div>

      {/* Selected question preview */}
      {selectedDefaultQuestion && (
        <div className="kaiwa-selected-question-preview">
          <div className="selected-question-badges">
            <span className="badge">{selectedDefaultQuestion.level}</span>
            <span className="badge">{CONVERSATION_TOPICS.find(t => t.value === selectedDefaultQuestion.topic)?.label}</span>
            <span className="badge">{CONVERSATION_STYLES.find(s => s.value === selectedDefaultQuestion.style)?.label}</span>
          </div>
          <p className="selected-question-text">{selectedDefaultQuestion.questionJa}</p>
          {selectedDefaultQuestion.questionVi && (
            <p className="selected-question-vi">{selectedDefaultQuestion.questionVi}</p>
          )}
          {selectedDefaultQuestion.situationContext && (
            <p className="selected-question-context">📍 {selectedDefaultQuestion.situationContext}</p>
          )}
        </div>
      )}

      {/* Question selector navigation */}
      {questionSelectorState.type !== 'hidden' && (
        <div className="kaiwa-question-selector">
          {/* Breadcrumb */}
          <div className="selector-breadcrumb">
            {questionSelectorState.type === 'level' && (
              <span>Chọn cấp độ</span>
            )}
            {questionSelectorState.type === 'topic' && (
              <>
                <button onClick={() => setQuestionSelectorState({ type: 'level' })}>
                  <ArrowLeft size={14} />
                </button>
                <span>{questionSelectorState.level}</span>
                <ChevronRight size={14} />
                <span>Chọn chủ đề</span>
              </>
            )}
            {questionSelectorState.type === 'list' && (
              <>
                <button onClick={() => setQuestionSelectorState({ type: 'topic', level: questionSelectorState.level })}>
                  <ArrowLeft size={14} />
                </button>
                <span>{questionSelectorState.level}</span>
                <ChevronRight size={14} />
                <span>{CONVERSATION_TOPICS.find(t => t.value === questionSelectorState.topic)?.label}</span>
                {questionSelectorState.folderName && (
                  <>
                    <ChevronRight size={14} />
                    <span>{questionSelectorState.folderName}</span>
                  </>
                )}
              </>
            )}
          </div>

          {/* Level selection */}
          {questionSelectorState.type === 'level' && (
            <div className="selector-grid levels">
              {JLPT_LEVELS.map(l => (
                <button
                  key={l.value}
                  className="selector-item level"
                  onClick={() => setQuestionSelectorState({ type: 'topic', level: l.value })}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}

          {/* Topic selection */}
          {questionSelectorState.type === 'topic' && (
            <div className="selector-grid topics">
              {CONVERSATION_TOPICS.filter(t => t.value !== 'free').map(t => (
                <button
                  key={t.value}
                  className="selector-item topic"
                  onClick={() => setQuestionSelectorState({
                    type: 'list',
                    level: questionSelectorState.level,
                    topic: t.value,
                  })}
                >
                  <span className="topic-icon">{t.icon}</span>
                  <span className="topic-label">{t.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Question list */}
          {questionSelectorState.type === 'list' && (
            <div className="selector-question-list">
              {/* Show folders if not inside a folder */}
              {!questionSelectorState.folderId && getFoldersForSelector().length > 0 && (
                <div className="selector-folders">
                  {getFoldersForSelector().map((folder: any) => (
                    <button
                      key={folder.id}
                      className="selector-folder-btn"
                      onClick={() => setQuestionSelectorState({
                        ...questionSelectorState,
                        folderId: folder.id,
                        folderName: folder.name,
                      })}
                    >
                      <Folder size={16} />
                      <span>{folder.name}</span>
                      <ChevronRight size={14} />
                    </button>
                  ))}
                </div>
              )}

              {/* Show questions */}
              <div className="selector-questions">
                {getQuestionsForSelector().map((q: any) => (
                  <button
                    key={q.id}
                    className={`selector-question-btn ${selectedDefaultQuestion?.id === q.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedDefaultQuestion(q);
                      setLevel(q.level);
                      setStyle(q.style);
                      handleTopicChange(q.topic);
                      setQuestionSelectorState({ type: 'hidden' });
                    }}
                  >
                    <FileText size={14} />
                    <div className="question-content">
                      <span className="question-ja">{q.questionJa}</span>
                      {q.questionVi && <span className="question-vi">{q.questionVi}</span>}
                    </div>
                  </button>
                ))}
                {getQuestionsForSelector().length === 0 && (
                  <p className="no-questions">Chưa có câu hỏi nào trong mục này</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
