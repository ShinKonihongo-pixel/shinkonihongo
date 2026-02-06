// Settings modal for kanji study
import { X, Eye, Type } from 'lucide-react';
import type { KanjiStudySettings } from './types';

interface SettingsModalProps {
  settings: KanjiStudySettings;
  onClose: () => void;
  onUpdateSettings: (settings: KanjiStudySettings) => void;
}

export function SettingsModal({ settings, onClose, onUpdateSettings }: SettingsModalProps) {
  const toggleFront = (key: keyof KanjiStudySettings['frontShow']) => {
    onUpdateSettings({ ...settings, frontShow: { ...settings.frontShow, [key]: !settings.frontShow[key] } });
  };
  const toggleBack = (key: keyof KanjiStudySettings['backShow']) => {
    onUpdateSettings({ ...settings, backShow: { ...settings.backShow, [key]: !settings.backShow[key] } });
  };

  const renderToggle = (label: string, active: boolean, onClick: () => void) => (
    <label className={`setting-toggle ${active ? 'active' : ''}`} onClick={onClick}>
      <div className="toggle-switch" />
      <span className="toggle-label">{label}</span>
      <input type="checkbox" checked={active} readOnly />
    </label>
  );

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-modal-header">
          <h3>Cài đặt hiển thị</h3>
          <button className="btn-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="settings-modal-content">
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
          </div>
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
          </div>
          <div className="settings-section">
            <div className="section-header"><Type size={18} /><h4>Nét viết</h4></div>
            <div className="settings-grid">
              {renderToggle('Tự động phát', settings.autoPlayStroke, () => onUpdateSettings({ ...settings, autoPlayStroke: !settings.autoPlayStroke }))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
