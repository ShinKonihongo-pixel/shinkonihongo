import type { AppSettings, JLPTLevelOption, MemorizationFilter } from '../../../hooks/use-settings';
import type { Lesson, Flashcard } from '../../../types/flashcard';

interface GameSettingsSourcesProps {
  settings: AppSettings;
  onUpdateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  lessons: Lesson[];
  flashcards: Flashcard[];
}

export function GameSettingsSources({ settings, onUpdateSetting, lessons, flashcards }: GameSettingsSourcesProps) {
  return (
    <section className="settings-section">
      <h3>
        <span className="section-icon">📚</span>
        Nguồn câu hỏi
      </h3>
      <p className="settings-description">Chọn nguồn thẻ để tạo câu hỏi cho các trò chơi</p>

      <div className="question-source-options">
        <label className="source-option">
          <input
            type="checkbox"
            checked={settings.gameQuestionSources.includes('all')}
            onChange={(e) => {
              if (e.target.checked) {
                onUpdateSetting('gameQuestionSources', ['all']);
              } else {
                const filtered = settings.gameQuestionSources.filter(s => s !== 'all');
                onUpdateSetting('gameQuestionSources', filtered.length > 0 ? filtered : ['all']);
              }
            }}
          />
          <span className="source-label">Tất cả thẻ</span>
        </label>

        <label className="source-option">
          <input
            type="checkbox"
            checked={settings.gameQuestionSources.includes('jlpt_level')}
            onChange={(e) => {
              if (e.target.checked) {
                const newSources = settings.gameQuestionSources.filter(s => s !== 'all');
                onUpdateSetting('gameQuestionSources', [...newSources, 'jlpt_level']);
              } else {
                const filtered = settings.gameQuestionSources.filter(s => s !== 'jlpt_level');
                onUpdateSetting('gameQuestionSources', filtered.length > 0 ? filtered : ['all']);
              }
            }}
          />
          <span className="source-label">Theo cấp độ JLPT</span>
        </label>

        {settings.gameQuestionSources.includes('jlpt_level') && (
          <div className="jlpt-level-buttons">
            {(['N5', 'N4', 'N3', 'N2', 'N1'] as JLPTLevelOption[]).map(level => (
              <button
                key={level}
                className={`jlpt-btn ${settings.gameSelectedJLPTLevels.includes(level) ? 'active' : ''}`}
                onClick={() => {
                  const newLevels = settings.gameSelectedJLPTLevels.includes(level)
                    ? settings.gameSelectedJLPTLevels.filter(l => l !== level)
                    : [...settings.gameSelectedJLPTLevels, level];
                  onUpdateSetting('gameSelectedJLPTLevels', newLevels);
                }}
              >
                {level}
              </button>
            ))}
          </div>
        )}

        <label className="source-option">
          <input
            type="checkbox"
            checked={settings.gameQuestionSources.includes('lesson')}
            onChange={(e) => {
              if (e.target.checked) {
                const newSources = settings.gameQuestionSources.filter(s => s !== 'all');
                onUpdateSetting('gameQuestionSources', [...newSources, 'lesson']);
              } else {
                const filtered = settings.gameQuestionSources.filter(s => s !== 'lesson');
                onUpdateSetting('gameQuestionSources', filtered.length > 0 ? filtered : ['all']);
              }
            }}
          />
          <span className="source-label">Theo bài học</span>
        </label>

        {settings.gameQuestionSources.includes('lesson') && lessons.length > 0 && (
          <div className="lesson-select-wrapper">
            <select
              multiple
              className="lesson-multiselect"
              value={settings.gameSelectedLessons}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                onUpdateSetting('gameSelectedLessons', selected);
              }}
            >
              {lessons.map(lesson => (
                <option key={lesson.id} value={lesson.id}>{lesson.name}</option>
              ))}
            </select>
            <span className="lesson-hint">Giữ Ctrl để chọn nhiều bài</span>
          </div>
        )}

        <label className="source-option">
          <input
            type="checkbox"
            checked={settings.gameQuestionSources.includes('memorization')}
            onChange={(e) => {
              if (e.target.checked) {
                const newSources = settings.gameQuestionSources.filter(s => s !== 'all');
                onUpdateSetting('gameQuestionSources', [...newSources, 'memorization']);
              } else {
                const filtered = settings.gameQuestionSources.filter(s => s !== 'memorization');
                onUpdateSetting('gameQuestionSources', filtered.length > 0 ? filtered : ['all']);
              }
            }}
          />
          <span className="source-label">Theo trạng thái</span>
        </label>

        {settings.gameQuestionSources.includes('memorization') && (
          <div className="memorization-buttons">
            {([
              { value: 'all', label: 'Tất cả' },
              { value: 'memorized', label: 'Đã thuộc' },
              { value: 'not_memorized', label: 'Chưa thuộc' },
            ] as { value: MemorizationFilter; label: string }[]).map(opt => (
              <button
                key={opt.value}
                className={`mem-btn ${settings.gameMemorizationFilter === opt.value ? 'active' : ''}`}
                onClick={() => onUpdateSetting('gameMemorizationFilter', opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="source-summary">
        <span className="summary-icon">📊</span>
        <span className="summary-text">
          Số thẻ phù hợp: <strong>{flashcards.length}</strong>
        </span>
      </div>
    </section>
  );
}
