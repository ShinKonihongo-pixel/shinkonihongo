// JLPT Setup View - Level and category selection, question count configuration
import { CheckCircle, Settings, Play, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import type { JLPTQuestion, JLPTLevel, QuestionCategory } from '../../../types/jlpt-question';
import type { CustomTopic, CustomTopicQuestion } from '../../../types/custom-topic';
import type { SectionConfig } from './jlpt-types';
import { JLPT_LEVELS, QUESTION_CATEGORIES } from './jlpt-constants';

export interface JLPTSetupViewProps {
  // Data
  questions: JLPTQuestion[];
  customTopics: CustomTopic[];
  customTopicQuestions: CustomTopicQuestion[];

  // Selections
  selectedLevels: Set<JLPTLevel>;
  selectedCategories: Set<QuestionCategory>;
  selectedCustomTopics: Set<string>;

  // Configuration
  showAdvancedSetup: boolean;
  simpleQuestionCount: number;
  sectionConfigs: SectionConfig[];

  // Computed
  filteredQuestions: JLPTQuestion[];
  filteredCustomQuestions: CustomTopicQuestion[];
  questionsByCategory: Record<QuestionCategory, JLPTQuestion[]>;

  // Settings
  preventRepetition: boolean;

  // Actions
  toggleLevel: (level: JLPTLevel) => void;
  toggleCategory: (category: QuestionCategory) => void;
  toggleCustomTopic: (topicId: string) => void;
  selectAllLevels: () => void;
  selectAllCategories: () => void;
  selectAllCustomTopics: () => void;
  setShowAdvancedSetup: (show: boolean) => void;
  setSimpleQuestionCount: (count: number) => void;
  updateSectionCount: (category: QuestionCategory, count: number) => void;
  onStartPractice: () => void;
}

export function JLPTSetupView({
  questions,
  customTopics,
  customTopicQuestions,
  selectedLevels,
  selectedCategories,
  selectedCustomTopics,
  showAdvancedSetup,
  simpleQuestionCount,
  sectionConfigs,
  filteredQuestions,
  filteredCustomQuestions,
  preventRepetition,
  toggleLevel,
  toggleCategory,
  toggleCustomTopic,
  selectAllLevels,
  selectAllCategories,
  selectAllCustomTopics,
  setShowAdvancedSetup,
  setSimpleQuestionCount,
  updateSectionCount,
  onStartPractice,
}: JLPTSetupViewProps) {
  const getCategoryLabel = (category: QuestionCategory) =>
    QUESTION_CATEGORIES.find(c => c.value === category)?.label || category;

  const getCategoryIcon = (category: QuestionCategory) =>
    QUESTION_CATEGORIES.find(c => c.value === category)?.icon || '?';

  const getTotalAvailableQuestions = () => {
    return filteredQuestions.length + filteredCustomQuestions.length;
  };

  const getTotalQuestions = () => {
    if (showAdvancedSetup) {
      return sectionConfigs.reduce((sum, c) => sum + c.questionCount, 0);
    }
    return Math.min(simpleQuestionCount, getTotalAvailableQuestions());
  };

  return (
    <div className="jlpt-page">
      <div className="jlpt-setup-container">
        <div className="jlpt-setup-header">
          <h1>
            <span className="jlpt-title-jp">日本語能力試験</span>
            <span className="jlpt-title-vi">Luyện thi JLPT</span>
          </h1>
          <p className="jlpt-subtitle">Tùy chỉnh bài thi theo nhu cầu của bạn</p>
        </div>

        {/* Level Selection */}
        <div className="jlpt-section">
          <div className="jlpt-section-header">
            <h3>Cấp độ JLPT</h3>
            <button className="btn-link-sm" onClick={selectAllLevels}>
              {selectedLevels.size === JLPT_LEVELS.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          </div>
          <div className="jlpt-level-grid">
            {JLPT_LEVELS.map(level => {
              const levelQuestions = questions.filter(q =>
                q.level === level &&
                (selectedCategories.size === 0 || selectedCategories.has(q.category))
              );
              const isSelected = selectedLevels.has(level);
              return (
                <button
                  key={level}
                  className={`jlpt-level-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleLevel(level)}
                >
                  <span className="level-badge">{level}</span>
                  <span className="level-count">{levelQuestions.length} câu</span>
                  {isSelected && <CheckCircle size={18} className="check-icon" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Selection */}
        <div className="jlpt-section">
          <div className="jlpt-section-header">
            <h3>Phần thi</h3>
            <button className="btn-link-sm" onClick={selectAllCategories}>
              {selectedCategories.size === QUESTION_CATEGORIES.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          </div>
          <div className="jlpt-category-grid">
            {QUESTION_CATEGORIES.map(cat => {
              const catQuestions = questions.filter(q =>
                q.category === cat.value &&
                (selectedLevels.size === 0 || selectedLevels.has(q.level))
              );
              const isSelected = selectedCategories.has(cat.value);
              return (
                <button
                  key={cat.value}
                  className={`jlpt-category-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleCategory(cat.value)}
                >
                  <span className="category-icon">{cat.icon}</span>
                  <span className="category-name">{cat.label}</span>
                  <span className="category-count">{catQuestions.length} câu</span>
                  {isSelected && <CheckCircle size={18} className="check-icon" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Topics Selection (if available) */}
        {customTopics.length > 0 && (
          <div className="jlpt-section custom-topics-section">
            <div className="jlpt-section-header">
              <h3>
                <Sparkles size={18} />
                Chủ đề mở rộng
              </h3>
              <button className="btn-link-sm" onClick={selectAllCustomTopics}>
                {selectedCustomTopics.size === customTopics.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>
            <div className="custom-topics-grid">
              {customTopics.map(topic => {
                const topicQuestionCount = customTopicQuestions.filter(q => q.topicId === topic.id).length;
                const isSelected = selectedCustomTopics.has(topic.id);
                return (
                  <button
                    key={topic.id}
                    className={`custom-topic-select-card ${isSelected ? 'selected' : ''}`}
                    style={{ '--topic-color': topic.color } as React.CSSProperties}
                    onClick={() => toggleCustomTopic(topic.id)}
                  >
                    <span className="topic-select-icon" style={{ backgroundColor: `${topic.color}20` }}>
                      {topic.icon}
                    </span>
                    <div className="topic-select-info">
                      <span className="topic-select-name">{topic.name}</span>
                      <span className="topic-select-count">{topicQuestionCount} câu</span>
                    </div>
                    {isSelected && <CheckCircle size={18} className="check-icon" />}
                  </button>
                );
              })}
            </div>
            {selectedCustomTopics.size > 0 && (
              <p className="custom-topics-hint">
                Đã chọn {selectedCustomTopics.size} chủ đề ({filteredCustomQuestions.length} câu hỏi)
              </p>
            )}
          </div>
        )}

        {/* Question Count Configuration */}
        <div className="jlpt-section">
          <div className="jlpt-section-header">
            <h3>Số lượng câu hỏi</h3>
            <button
              className="btn-toggle-advanced"
              onClick={() => setShowAdvancedSetup(!showAdvancedSetup)}
            >
              <Settings size={16} />
              {showAdvancedSetup ? 'Chế độ đơn giản' : 'Tùy chỉnh từng phần'}
              {showAdvancedSetup ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {!showAdvancedSetup ? (
            <div className="jlpt-simple-count">
              <div className="count-options">
                {[10, 20, 30, 50, 100].map(count => (
                  <button
                    key={count}
                    className={`count-option ${simpleQuestionCount === count ? 'selected' : ''}`}
                    onClick={() => setSimpleQuestionCount(count)}
                  >
                    {count} câu
                  </button>
                ))}
              </div>
              <p className="count-note">
                Có <strong>{filteredQuestions.length}</strong> câu hỏi phù hợp
                {preventRepetition && (
                  <span className="coverage-hint"> • Ưu tiên câu chưa làm gần đây</span>
                )}
              </p>
            </div>
          ) : (
            <div className="jlpt-advanced-setup">
              {sectionConfigs.length === 0 ? (
                <p className="no-sections">Vui lòng chọn ít nhất một phần thi</p>
              ) : (
                <div className="section-config-list">
                  {sectionConfigs.map(config => (
                    <div key={config.category} className="section-config-item">
                      <div className="section-info">
                        <span className="section-icon">{getCategoryIcon(config.category)}</span>
                        <span className="section-name">{getCategoryLabel(config.category)}</span>
                        <span className="section-available">({config.available} câu)</span>
                      </div>
                      <div className="section-count-control">
                        <button
                          className="count-btn"
                          onClick={() => updateSectionCount(config.category, Math.max(0, config.questionCount - 5))}
                          disabled={config.questionCount === 0}
                        >
                          -5
                        </button>
                        <input
                          type="number"
                          min="0"
                          max={config.available}
                          value={config.questionCount}
                          onChange={(e) => updateSectionCount(config.category, Math.min(config.available, Math.max(0, parseInt(e.target.value) || 0)))}
                          className="count-input"
                        />
                        <button
                          className="count-btn"
                          onClick={() => updateSectionCount(config.category, Math.min(config.available, config.questionCount + 5))}
                          disabled={config.questionCount >= config.available}
                        >
                          +5
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Summary & Start */}
        <div className="jlpt-summary">
          <div className="summary-stats">
            <div className="summary-item">
              <span className="summary-value">{getTotalQuestions()}</span>
              <span className="summary-label">Tổng câu hỏi</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">
                {selectedLevels.size === 0 ? 'Tất cả' : selectedLevels.size}
              </span>
              <span className="summary-label">Cấp độ</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">
                {selectedCategories.size === 0 ? 'Tất cả' : selectedCategories.size}
              </span>
              <span className="summary-label">Phần thi</span>
            </div>
          </div>

          <button
            className="btn btn-primary btn-start"
            onClick={onStartPractice}
            disabled={getTotalQuestions() === 0}
          >
            <Play size={20} />
            Bắt đầu luyện tập
          </button>
        </div>
      </div>
    </div>
  );
}
