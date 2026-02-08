// Display settings section for modal
import type { AppSettings } from '../../../hooks/use-settings';

const FLIP_STYLES: { value: AppSettings['cardFlipStyle']; label: string }[] = [
  { value: 'horizontal', label: 'Lật ngang' },
  { value: 'vertical', label: 'Lật dọc' },
  { value: 'fade', label: 'Chuyển mờ' },
  { value: 'slide', label: 'Trượt ngang' },
  { value: 'swing', label: 'Mở cửa' },
  { value: 'flip-up', label: 'Lật lên' },
  { value: 'airplane', label: 'Chuyển trang' },
  { value: 'crumple', label: 'Thu phóng' },
  { value: 'flyaway', label: 'Đảo bài' },
  { value: 'none', label: 'Tức thì' },
];

interface ModalDisplaySectionProps {
  settings: AppSettings;
  onSettingsChange?: (key: keyof AppSettings, value: any) => void;
}

export function ModalDisplaySection({
  settings,
  onSettingsChange,
}: ModalDisplaySectionProps) {
  return (
    <>
      <div className="modal-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="modal-section-title" style={{ margin: 0 }}>Hiệu ứng lật thẻ</div>
        <select
          className="modal-select"
          style={{ width: 'auto', minWidth: '8rem' }}
          value={settings.cardFlipStyle || 'horizontal'}
          onChange={(e) => onSettingsChange?.('cardFlipStyle', e.target.value as AppSettings['cardFlipStyle'])}
        >
          {FLIP_STYLES.map(style => (
            <option key={style.value} value={style.value}>{style.label}</option>
          ))}
        </select>
      </div>

      <div className="modal-section">
        <div className="modal-section-title">Kích thước thẻ</div>
        <div className="font-slider-container">
          <div className="font-slider-row">
            <input
              type="range"
              className="font-slider"
              min="60"
              max="150"
              step="5"
              value={settings.cardScale || 100}
              onChange={(e) => onSettingsChange?.('cardScale', Number(e.target.value))}
            />
            <span className="font-size-value">{settings.cardScale || 100}%</span>
          </div>
          <div className="card-scale-preview" style={{
            transform: `scale(${(settings.cardScale || 100) / 100})`,
            transformOrigin: 'center center',
          }}>
            <div className="card-scale-preview-inner">漢</div>
          </div>
        </div>
      </div>

      <div className="modal-section">
        <div className="modal-section-title">Hiển thị mặt sau</div>

        <div className="modal-toggle-group">
          <label className="modal-toggle-item">
            <input
              type="checkbox"
              checked={settings.showVocabulary}
              onChange={(e) => onSettingsChange?.('showVocabulary', e.target.checked)}
            />
            <span className="toggle-text">Từ vựng (読み方)</span>
          </label>

          <label className="modal-toggle-item">
            <input
              type="checkbox"
              checked={settings.showSinoVietnamese}
              onChange={(e) => onSettingsChange?.('showSinoVietnamese', e.target.checked)}
            />
            <span className="toggle-text">Hán Việt</span>
          </label>

          <label className="modal-toggle-item">
            <input
              type="checkbox"
              checked={settings.showMeaning}
              onChange={(e) => onSettingsChange?.('showMeaning', e.target.checked)}
            />
            <span className="toggle-text">Nghĩa</span>
          </label>

          <label className="modal-toggle-item">
            <input
              type="checkbox"
              checked={settings.showExample}
              onChange={(e) => onSettingsChange?.('showExample', e.target.checked)}
            />
            <span className="toggle-text">Ví dụ</span>
          </label>
        </div>
      </div>
    </>
  );
}
