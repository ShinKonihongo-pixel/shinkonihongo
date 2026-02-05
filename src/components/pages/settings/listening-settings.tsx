import { useListeningSettings } from '../../../contexts/listening-settings-context';
import type { JLPTLevel } from '../../../types/flashcard';

export function ListeningSettings() {
  const { settings, updateSettings } = useListeningSettings();

  return (
    <>
      <section className="settings-section">
        <h3>Cài đặt phát</h3>
        <p className="settings-description">Tùy chỉnh tốc độ và chế độ phát âm thanh</p>

        <div className="setting-item">
          <label>Tốc độ phát: {settings.defaultPlaybackSpeed}x</label>
          <div className="setting-control">
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.25"
              value={settings.defaultPlaybackSpeed}
              onChange={(e) => updateSettings({ defaultPlaybackSpeed: parseFloat(e.target.value) })}
            />
            <span className="setting-value">{settings.defaultPlaybackSpeed}x</span>
          </div>
        </div>

        <div className="setting-item">
          <label>Số lần lặp mỗi từ: {settings.defaultRepeatCount}</label>
          <div className="setting-control">
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={settings.defaultRepeatCount}
              onChange={(e) => updateSettings({ defaultRepeatCount: parseInt(e.target.value) })}
            />
            <span className="setting-value">{settings.defaultRepeatCount} lần</span>
          </div>
        </div>

        <div className="setting-item">
          <label>Khoảng cách giữa các từ: {settings.delayBetweenWords}s</label>
          <div className="setting-control">
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={settings.delayBetweenWords}
              onChange={(e) => updateSettings({ delayBetweenWords: parseFloat(e.target.value) })}
            />
            <span className="setting-value">{settings.delayBetweenWords}s</span>
          </div>
        </div>

        <div className="setting-item">
          <label className="setting-label-with-toggle">
            <span>Tự động phát từ tiếp theo</span>
            <input
              type="checkbox"
              checked={settings.autoPlayNext}
              onChange={(e) => updateSettings({ autoPlayNext: e.target.checked })}
            />
          </label>
        </div>
      </section>

      <section className="settings-section">
        <h3>Hiển thị</h3>
        <p className="settings-description">Chọn nội dung hiển thị khi luyện nghe</p>

        <div className="setting-item">
          <label className="setting-label-with-toggle">
            <span>Hiển thị từ vựng (Hiragana)</span>
            <input
              type="checkbox"
              checked={settings.showVocabulary}
              onChange={(e) => updateSettings({ showVocabulary: e.target.checked })}
            />
          </label>
        </div>

        <div className="setting-item">
          <label className="setting-label-with-toggle">
            <span>Hiển thị Kanji</span>
            <input
              type="checkbox"
              checked={settings.showKanji}
              onChange={(e) => updateSettings({ showKanji: e.target.checked })}
            />
          </label>
        </div>

        <div className="setting-item">
          <label className="setting-label-with-toggle">
            <span>Hiển thị nghĩa</span>
            <input
              type="checkbox"
              checked={settings.showMeaning}
              onChange={(e) => updateSettings({ showMeaning: e.target.checked })}
            />
          </label>
        </div>
      </section>

      <section className="settings-section">
        <h3>Giọng đọc</h3>
        <p className="settings-description">Tùy chỉnh tốc độ giọng đọc</p>

        <div className="setting-item">
          <label>Tốc độ giọng đọc: {settings.voiceRate}x</label>
          <div className="setting-control">
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.25"
              value={settings.voiceRate}
              onChange={(e) => updateSettings({ voiceRate: parseFloat(e.target.value) })}
            />
            <span className="setting-value">{settings.voiceRate}x</span>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h3>Nguồn từ vựng</h3>
        <p className="settings-description">Chọn cấp độ từ vựng mặc định</p>

        <div className="setting-item">
          <label>Cấp độ mặc định</label>
          <div className="setting-control">
            <select
              value={settings.defaultLevel}
              onChange={(e) => updateSettings({ defaultLevel: e.target.value as JLPTLevel })}
              className="setting-select"
            >
              <option value="N5">N5 - Sơ cấp</option>
              <option value="N4">N4 - Sơ cấp +</option>
              <option value="N3">N3 - Trung cấp</option>
              <option value="N2">N2 - Trung cao</option>
              <option value="N1">N1 - Cao cấp</option>
            </select>
          </div>
        </div>
      </section>
    </>
  );
}
