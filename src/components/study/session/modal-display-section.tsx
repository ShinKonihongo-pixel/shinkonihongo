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
  onSettingsChange?: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

export function ModalDisplaySection({
  settings,
  onSettingsChange,
}: ModalDisplaySectionProps) {
  return (
    <>
      <div className="modal-section">
        <div className="modal-section-title" style={{ display: 'flex', alignItems: 'center', marginBottom: 0 }}>
          <span>Hiệu ứng lật thẻ</span>
          <div style={{ flex: 1 }} />
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
        <div className="modal-section-title" style={{ display: 'flex', alignItems: 'center', marginBottom: 0 }}>
          <span>Ngôn ngữ</span>
          <div style={{ flex: 1 }} />
          <select
            className="modal-select"
            style={{ width: 'auto', minWidth: '8rem' }}
            value={settings.exampleTranslationLang || 'vietnamese'}
            onChange={(e) => onSettingsChange?.('exampleTranslationLang', e.target.value as AppSettings['exampleTranslationLang'])}
          >
            <option value="vietnamese">Tiếng Việt</option>
            <option value="english">English</option>
            <option value="both">Cả hai</option>
          </select>
        </div>
      </div>
    </>
  );
}
