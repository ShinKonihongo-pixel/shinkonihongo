// Settings modal for kanji study
import { Eye, Type, Settings, Sparkles } from 'lucide-react';
import { ModalShell } from '../../ui/modal-shell';
import type { KanjiStudySettings, FontSettings, CardFlipStyle } from './types';

const FLIP_STYLES: { value: CardFlipStyle; label: string }[] = [
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

interface SettingsModalProps {
  settings: KanjiStudySettings;
  onClose: () => void;
  onUpdateSettings: (settings: KanjiStudySettings) => void;
}

const PRESET_COLORS = ['#e9d5ff', '#ffffff', '#fbbf24', '#86efac', '#f9a8d4', '#93c5fd', '#fca5a5'];

export function SettingsModal({ settings, onClose, onUpdateSettings }: SettingsModalProps) {
  const toggleFront = (key: keyof KanjiStudySettings['frontShow']) => {
    onUpdateSettings({ ...settings, frontShow: { ...settings.frontShow, [key]: !settings.frontShow[key] } });
  };
  const toggleBack = (key: keyof KanjiStudySettings['backShow']) => {
    onUpdateSettings({ ...settings, backShow: { ...settings.backShow, [key]: !settings.backShow[key] } });
  };
  const updateFrontFont = (patch: Partial<FontSettings>) => {
    onUpdateSettings({ ...settings, frontFont: { ...settings.frontFont, ...patch } });
  };
  const updateBackFont = (patch: Partial<FontSettings>) => {
    onUpdateSettings({ ...settings, backFont: { ...settings.backFont, ...patch } });
  };

  const renderToggle = (label: string, active: boolean, onClick: () => void) => (
    <label className={`setting-toggle ${active ? 'active' : ''}`} onClick={onClick}>
      <div className="toggle-switch" />
      <span className="toggle-label">{label}</span>
      <input type="checkbox" checked={active} readOnly />
    </label>
  );

  const renderFontSection = (font: FontSettings, onUpdate: (patch: Partial<FontSettings>) => void, minSize: number, maxSize: number) => (
    <div className="font-inline-section">
      <div className="font-inline-row">
        <span className="font-inline-label">Cỡ chữ</span>
        <input type="range" min={minSize} max={maxSize} value={font.fontSize} onChange={e => onUpdate({ fontSize: Number(e.target.value) })} className="font-range-slider" />
        <span className="font-size-value">{font.fontSize}px</span>
      </div>
      <div className="font-inline-row">
        <span className="font-inline-label">Màu chữ</span>
        <div className="color-preset-row">
          {PRESET_COLORS.map(color => (
            <button key={color} className={`color-preset-btn ${font.fontColor === color ? 'active' : ''}`} style={{ background: color }} onClick={() => onUpdate({ fontColor: color })} />
          ))}
          <input type="color" value={font.fontColor} onChange={e => onUpdate({ fontColor: e.target.value })} className="color-custom-input" title="Tuỳ chỉnh" />
        </div>
      </div>
    </div>
  );

  return (
    <ModalShell isOpen={true} onClose={onClose} title="Cài đặt hiển thị" maxWidth={480}>
        <div className="settings-modal-content">
          {/* Mặt trước */}
          <div className="settings-section">
            <div className="section-header"><Eye size={18} /><h4>Mặt trước</h4></div>
            <div className="settings-grid">
              {renderToggle('Chữ Kanji', settings.frontShow.character, () => toggleFront('character'))}
              {renderToggle('Nét viết', settings.frontShow.strokeOrder, () => toggleFront('strokeOrder'))}
              {renderToggle('Âm On', settings.frontShow.onYomi, () => toggleFront('onYomi'))}
              {renderToggle('Âm Kun', settings.frontShow.kunYomi, () => toggleFront('kunYomi'))}
              {renderToggle('Hán Việt', settings.frontShow.sinoVietnamese, () => toggleFront('sinoVietnamese'))}
              {renderToggle('Nghĩa', settings.frontShow.meaning, () => toggleFront('meaning'))}
              {renderToggle('Level', settings.frontShow.level, () => toggleFront('level'))}
              {renderToggle('Bài học', settings.frontShow.lesson, () => toggleFront('lesson'))}
            </div>
            <div className="section-gradient-divider" />
            {renderFontSection(settings.frontFont, updateFrontFont, 40, 360)}
          </div>

          <div className="section-gradient-divider" />

          {/* Mặt sau */}
          <div className="settings-section">
            <div className="section-header"><Eye size={18} /><h4>Mặt sau</h4></div>
            <div className="settings-grid">
              {renderToggle('Chữ Kanji', settings.backShow.character, () => toggleBack('character'))}
              {renderToggle('Âm On', settings.backShow.onYomi, () => toggleBack('onYomi'))}
              {renderToggle('Âm Kun', settings.backShow.kunYomi, () => toggleBack('kunYomi'))}
              {renderToggle('Hán Việt', settings.backShow.sinoVietnamese, () => toggleBack('sinoVietnamese'))}
              {renderToggle('Nghĩa', settings.backShow.meaning, () => toggleBack('meaning'))}
              {renderToggle('Mẹo nhớ', settings.backShow.mnemonic, () => toggleBack('mnemonic'))}
              {renderToggle('Bộ thủ', settings.backShow.radicals, () => toggleBack('radicals'))}
              {renderToggle('Từ mẫu', settings.backShow.sampleWords, () => toggleBack('sampleWords'))}
            </div>
            <div className="section-gradient-divider" />
            {renderFontSection(settings.backFont, updateBackFont, 30, 120)}
            <div className="section-gradient-divider" />
            <div className="font-inline-section">
              <div className="font-inline-row">
                <span className="font-inline-label">Nội dung</span>
                <input type="range" min={10} max={48} value={settings.backTextSize} onChange={e => onUpdateSettings({ ...settings, backTextSize: Number(e.target.value) })} className="font-range-slider" />
                <span className="font-size-value">{settings.backTextSize}px</span>
              </div>
            </div>
          </div>

          <div className="section-gradient-divider" />

          {/* Nét viết */}
          <div className="settings-section">
            <div className="section-header"><Type size={18} /><h4>Nét viết</h4></div>
            <div className="settings-grid">
              {renderToggle('Tự động phát', settings.autoPlayStroke, () => onUpdateSettings({ ...settings, autoPlayStroke: !settings.autoPlayStroke }))}
            </div>
          </div>

          <div className="section-gradient-divider" />

          {/* Hiệu ứng lật thẻ */}
          <div className="settings-section">
            <div className="section-header"><Sparkles size={18} /><h4>Hiệu ứng lật thẻ</h4></div>
            <select
              className="flip-style-select"
              value={settings.cardFlipStyle || 'horizontal'}
              onChange={e => onUpdateSettings({ ...settings, cardFlipStyle: e.target.value as CardFlipStyle })}
            >
              {FLIP_STYLES.map(style => (
                <option key={style.value} value={style.value}>{style.label}</option>
              ))}
            </select>
          </div>

          <div className="section-gradient-divider" />

          {/* Kích thước thẻ */}
          <div className="settings-section">
            <div className="section-header"><Settings size={18} /><h4>Kích thước thẻ</h4></div>
            <div className="font-size-control">
              <div className="font-size-label"><span>Tỉ lệ</span></div>
              <div className="font-size-slider">
                <button className="font-btn" onClick={() => onUpdateSettings({ ...settings, cardScale: Math.max(60, (settings.cardScale ?? 100) - 5) })}>−</button>
                <div className="font-value">{settings.cardScale ?? 100}%</div>
                <button className="font-btn" onClick={() => onUpdateSettings({ ...settings, cardScale: Math.min(150, (settings.cardScale ?? 100) + 5) })}>+</button>
              </div>
            </div>
          </div>
        </div>
    </ModalShell>
  );
}
