import type { GrammarSettingsProps } from './settings-types';

export function GrammarSettings({ settings, onUpdateSetting }: GrammarSettingsProps) {
  return (
    <>
      <section className="settings-section">
        <h3>Cài đặt thẻ Ngữ pháp</h3>
        <p className="settings-description">Tùy chỉnh thông tin hiển thị trên thẻ ngữ pháp khi học</p>

        <div className="grammar-display-section">
          <h4>📋 Mặt trước (Câu hỏi)</h4>
          <div className="grammar-toggles-grid">
            {[
              { key: 'grammarFrontShowTitle', label: 'Tiêu đề ngữ pháp' },
              { key: 'grammarFrontShowFormula', label: 'Công thức' },
              { key: 'grammarFrontShowMeaning', label: 'Nghĩa' },
              { key: 'grammarFrontShowExplanation', label: 'Giải thích' },
              { key: 'grammarFrontShowExamples', label: 'Ví dụ' },
              { key: 'grammarFrontShowLevel', label: 'Badge JLPT' },
              { key: 'grammarFrontShowLesson', label: 'Badge bài học' },
            ].map(({ key, label }) => (
              <div key={key} className="setting-item compact">
                <label>{label}</label>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings[key as keyof typeof settings] as boolean}
                    onChange={(e) => onUpdateSetting(key as keyof typeof settings, e.target.checked as any)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="grammar-display-section">
          <h4>📝 Mặt sau (Đáp án)</h4>
          <div className="grammar-toggles-grid">
            {[
              { key: 'grammarBackShowTitle', label: 'Tiêu đề ngữ pháp' },
              { key: 'grammarBackShowFormula', label: 'Công thức' },
              { key: 'grammarBackShowMeaning', label: 'Nghĩa' },
              { key: 'grammarBackShowExplanation', label: 'Giải thích' },
              { key: 'grammarBackShowExamples', label: 'Ví dụ' },
            ].map(({ key, label }) => (
              <div key={key} className="setting-item compact">
                <label>{label}</label>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings[key as keyof typeof settings] as boolean}
                    onChange={(e) => onUpdateSetting(key as keyof typeof settings, e.target.checked as any)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="grammar-presets">
          <h4>⚡ Cài đặt nhanh</h4>
          <div className="preset-buttons">
            <button
              className="preset-btn"
              onClick={() => {
                onUpdateSetting('grammarFrontShowTitle', true);
                onUpdateSetting('grammarFrontShowFormula', true);
                onUpdateSetting('grammarFrontShowMeaning', false);
                onUpdateSetting('grammarFrontShowExplanation', false);
                onUpdateSetting('grammarFrontShowExamples', false);
                onUpdateSetting('grammarBackShowTitle', false);
                onUpdateSetting('grammarBackShowFormula', false);
                onUpdateSetting('grammarBackShowMeaning', true);
                onUpdateSetting('grammarBackShowExplanation', true);
                onUpdateSetting('grammarBackShowExamples', true);
              }}
            >
              🎯 Mặc định
            </button>
            <button
              className="preset-btn"
              onClick={() => {
                onUpdateSetting('grammarFrontShowTitle', true);
                onUpdateSetting('grammarFrontShowFormula', false);
                onUpdateSetting('grammarFrontShowMeaning', false);
                onUpdateSetting('grammarFrontShowExplanation', false);
                onUpdateSetting('grammarFrontShowExamples', false);
                onUpdateSetting('grammarBackShowTitle', false);
                onUpdateSetting('grammarBackShowFormula', true);
                onUpdateSetting('grammarBackShowMeaning', true);
                onUpdateSetting('grammarBackShowExplanation', true);
                onUpdateSetting('grammarBackShowExamples', true);
              }}
            >
              📚 Chỉ tiêu đề
            </button>
            <button
              className="preset-btn"
              onClick={() => {
                onUpdateSetting('grammarFrontShowTitle', true);
                onUpdateSetting('grammarFrontShowFormula', true);
                onUpdateSetting('grammarFrontShowMeaning', true);
                onUpdateSetting('grammarFrontShowExplanation', false);
                onUpdateSetting('grammarFrontShowExamples', false);
                onUpdateSetting('grammarBackShowTitle', false);
                onUpdateSetting('grammarBackShowFormula', false);
                onUpdateSetting('grammarBackShowMeaning', false);
                onUpdateSetting('grammarBackShowExplanation', true);
                onUpdateSetting('grammarBackShowExamples', true);
              }}
            >
              🔄 Đảo nghĩa
            </button>
            <button
              className="preset-btn"
              onClick={() => {
                onUpdateSetting('grammarFrontShowTitle', true);
                onUpdateSetting('grammarFrontShowFormula', true);
                onUpdateSetting('grammarFrontShowMeaning', true);
                onUpdateSetting('grammarFrontShowExplanation', true);
                onUpdateSetting('grammarFrontShowExamples', true);
                onUpdateSetting('grammarBackShowTitle', true);
                onUpdateSetting('grammarBackShowFormula', true);
                onUpdateSetting('grammarBackShowMeaning', true);
                onUpdateSetting('grammarBackShowExplanation', true);
                onUpdateSetting('grammarBackShowExamples', true);
              }}
            >
              📖 Hiện tất cả
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
