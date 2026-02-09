// Font settings section for modal
import type { AppSettings } from '../../../hooks/use-settings';
import { FONT_OPTIONS } from './constants';

interface ModalFontSectionProps {
  settings: AppSettings;
  frontFontSize?: number;
  onFrontFontSizeChange?: (size: number) => void;
  onSettingsChange?: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

export function ModalFontSection({
  settings,
  frontFontSize = 250,
  onFrontFontSizeChange,
  onSettingsChange,
}: ModalFontSectionProps) {
  return (
    <>
      <div className="modal-section">
        <div className="modal-section-title">Kiểu chữ</div>

        <div className="modal-setting-row">
          <span className="modal-setting-label">Font chữ</span>
          <select
            value={settings.kanjiFont}
            onChange={(e) => onSettingsChange?.('kanjiFont', e.target.value)}
            className="modal-select"
          >
            {FONT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="modal-setting-row">
          <span className="modal-setting-label">Chữ đậm</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.kanjiBold}
              onChange={(e) => onSettingsChange?.('kanjiBold', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {onFrontFontSizeChange && (
        <div className="modal-section">
          <div className="modal-section-title">Cỡ chữ mặt trước</div>
          <div className="font-slider-container">
            <div className="font-slider-row">
              <input
                type="range"
                className="font-slider"
                min="80"
                max="400"
                step="10"
                value={frontFontSize}
                onChange={(e) => onFrontFontSizeChange(Number(e.target.value))}
              />
              <span className="font-size-value">{frontFontSize}px</span>
            </div>
            <div className="font-preview" style={{
              fontSize: `${Math.min(frontFontSize / 3, 50)}px`,
              fontFamily: `"${settings.kanjiFont}", serif`,
              fontWeight: settings.kanjiBold ? 900 : 400
            }}>
              漢字
            </div>
          </div>
        </div>
      )}

      <div className="modal-section">
        <div className="modal-section-title">Cỡ chữ mặt sau</div>
        <div className="font-slider-container">
          <div className="font-slider-row">
            <input
              type="range"
              className="font-slider"
              min="50"
              max="200"
              step="5"
              value={settings.backFontSize || 100}
              onChange={(e) => onSettingsChange?.('backFontSize', Number(e.target.value))}
            />
            <span className="font-size-value">{settings.backFontSize || 100}%</span>
          </div>
          <div className="font-preview-back" style={{
            fontSize: `${Math.max(16 * ((settings.backFontSize || 100) / 100), 12)}px`
          }}>
            読み方 · Nghĩa
          </div>
        </div>
      </div>
    </>
  );
}
