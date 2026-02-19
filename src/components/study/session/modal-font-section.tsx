// Font and color settings section for study modal
import { useRef } from 'react';
import type { AppSettings } from '../../../hooks/use-settings';
import { FONT_OPTIONS } from './constants';
import './modal-font-section.css';

const AUTO_COLOR = 'auto';

const PRESET_COLORS = [
  { value: '#FFFFFF', label: 'Trắng' },
  { value: '#000000', label: 'Đen' },
  { value: '#ef4444', label: 'Đỏ' },
  { value: '#fca5a5', label: 'Đỏ nhạt' },
  { value: '#fb923c', label: 'Cam' },
  { value: '#fdba74', label: 'Cam nhạt' },
  { value: '#fbbf24', label: 'Vàng' },
  { value: '#fde047', label: 'Vàng nhạt' },
  { value: '#34d399', label: 'Xanh lá' },
  { value: '#86efac', label: 'Xanh lá nhạt' },
  { value: '#22d3ee', label: 'Cyan' },
  { value: '#60a5fa', label: 'Xanh dương' },
  { value: '#a78bfa', label: 'Tím' },
  { value: '#f472b6', label: 'Hồng' },
  { value: '#94a3b8', label: 'Xám' },
  { value: '#e2e8f0', label: 'Xám nhạt' },
];

const PRESET_VALUES = new Set(PRESET_COLORS.map(c => c.value));

// Reusable color swatch picker with Auto option + custom color input
function ColorPicker({ value, onChange, label }: {
  value: string;
  onChange: (color: string) => void;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isCustom = value !== AUTO_COLOR && !PRESET_VALUES.has(value);

  return (
    <div className="modal-setting-row color-picker-row">
      <span className="modal-setting-label">{label}</span>
      <div className="color-swatch-list">
        {/* Auto swatch */}
        <button
          className={`color-swatch ${value === AUTO_COLOR ? 'active' : ''} color-swatch-auto`}
          onClick={() => onChange(AUTO_COLOR)}
          title="Tự động"
        >
          <span className="auto-label">A</span>
        </button>
        {/* Preset swatches */}
        {PRESET_COLORS.map(opt => (
          <button
            key={opt.value}
            className={`color-swatch ${value === opt.value ? 'active' : ''}`}
            style={{ background: opt.value }}
            onClick={() => onChange(opt.value)}
            title={opt.label}
          />
        ))}
        {/* Custom color picker swatch */}
        <button
          className={`color-swatch color-swatch-custom ${isCustom ? 'active' : ''}`}
          style={isCustom ? { background: value } : {}}
          onClick={() => inputRef.current?.click()}
          title="Chọn màu tùy chỉnh"
        >
          {!isCustom && <span className="custom-label">+</span>}
        </button>
        <input
          ref={inputRef}
          type="color"
          className="color-input-hidden"
          value={isCustom ? value : '#8b5cf6'}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

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
          <div className="modal-section-title">Chữ mặt trước</div>
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
              fontWeight: settings.kanjiBold ? 900 : 400,
              color: settings.frontTextColor === AUTO_COLOR ? '#FFFFFF' : (settings.frontTextColor || '#FFFFFF'),
            }}>
              漢字
            </div>
          </div>

          <ColorPicker
            label="Màu chữ"
            value={settings.frontTextColor || '#FFFFFF'}
            onChange={(c) => onSettingsChange?.('frontTextColor', c)}
          />
        </div>
      )}

      <div className="modal-section">
        <div className="modal-section-title">Chữ mặt sau</div>

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

        <div className="font-slider-container" style={{ marginTop: '0.75rem' }}>
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

        <ColorPicker
          label="Màu furigana"
          value={settings.furiganaTextColor || '#fdba74'}
          onChange={(c) => onSettingsChange?.('furiganaTextColor', c)}
        />

        <ColorPicker
          label="Màu ví dụ"
          value={settings.exampleTextColor || '#94a3b8'}
          onChange={(c) => onSettingsChange?.('exampleTextColor', c)}
        />
      </div>
    </>
  );
}
