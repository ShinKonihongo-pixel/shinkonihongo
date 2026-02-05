import type { AppSettings, GameQuestionContent, GameAnswerContent } from '../../../hooks/use-settings';

interface GameSettingsBasicProps {
  settings: AppSettings;
  onUpdateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

export function GameSettingsBasic({ settings, onUpdateSetting }: GameSettingsBasicProps) {
  return (
    <section className="settings-section">
      <h3>Cài đặt trò chơi</h3>
      <p className="settings-description">Cài đặt nội dung hiển thị trong trò chơi Quiz Game</p>

      <div className="setting-item">
        <label>Nội dung câu hỏi</label>
        <div className="setting-control">
          <select
            value={settings.gameQuestionContent}
            onChange={(e) => onUpdateSetting('gameQuestionContent', e.target.value as GameQuestionContent)}
            className="font-select"
          >
            <option value="kanji">Kanji</option>
            <option value="vocabulary">Từ vựng (Hiragana)</option>
            <option value="meaning">Nghĩa</option>
          </select>
        </div>
      </div>

      <div className="setting-item">
        <label>Nội dung câu trả lời</label>
        <div className="setting-control">
          <select
            value={settings.gameAnswerContent}
            onChange={(e) => onUpdateSetting('gameAnswerContent', e.target.value as GameAnswerContent)}
            className="font-select"
          >
            <option value="vocabulary_meaning">Từ vựng + Nghĩa (Mặc định)</option>
            <option value="kanji">Kanji</option>
            <option value="vocabulary">Từ vựng (Hiragana)</option>
            <option value="meaning">Nghĩa</option>
          </select>
        </div>
      </div>

      <div className="setting-item">
        <label>Cỡ chữ câu hỏi (rem)</label>
        <div className="setting-control">
          <input
            type="range"
            min="2"
            max="15"
            step="0.5"
            value={settings.gameQuestionFontSize}
            onChange={(e) => onUpdateSetting('gameQuestionFontSize', Number(e.target.value))}
          />
          <span className="setting-value">{settings.gameQuestionFontSize}rem</span>
        </div>
      </div>

      <div className="setting-item">
        <label>Cỡ chữ đáp án (rem)</label>
        <div className="setting-control">
          <input
            type="range"
            min="0.8"
            max="3"
            step="0.1"
            value={settings.gameAnswerFontSize}
            onChange={(e) => onUpdateSetting('gameAnswerFontSize', Number(e.target.value))}
          />
          <span className="setting-value">{settings.gameAnswerFontSize}rem</span>
        </div>
      </div>

      <div className="game-settings-preview">
        <div className="preview-label">Xem trước:</div>
        <div className="preview-content">
          <div className="preview-question">
            <span className="preview-badge">Câu hỏi</span>
            <span className="preview-text">
              {settings.gameQuestionContent === 'kanji' && '漢字'}
              {settings.gameQuestionContent === 'vocabulary' && 'かんじ'}
              {settings.gameQuestionContent === 'meaning' && 'Chữ Hán'}
            </span>
          </div>
          <div className="preview-arrow">→</div>
          <div className="preview-answer">
            <span className="preview-badge">Đáp án</span>
            <span className="preview-text">
              {settings.gameAnswerContent === 'kanji' && '漢字'}
              {settings.gameAnswerContent === 'vocabulary' && 'かんじ'}
              {settings.gameAnswerContent === 'meaning' && 'Chữ Hán'}
              {settings.gameAnswerContent === 'vocabulary_meaning' && 'かんじ - Chữ Hán'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
