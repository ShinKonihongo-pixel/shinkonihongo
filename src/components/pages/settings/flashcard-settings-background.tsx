import type { AppSettings } from '../../../hooks/use-settings';
import { GRADIENT_PRESETS, GRADIENT_CATEGORIES, type GradientCategory } from './settings-constants';

interface FlashcardBackgroundProps {
  settings: AppSettings;
  onUpdateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  gradientCategory: GradientCategory;
  setGradientCategory: (category: GradientCategory) => void;
}

export function FlashcardBackground({ settings, onUpdateSetting, gradientCategory, setGradientCategory }: FlashcardBackgroundProps) {
  return (
    <div className="fc-section">
      <div className="fc-section-header">
        <span className="fc-section-icon">🎨</span>
        <span className="fc-section-title">Nền thẻ</span>
        <div className="fc-bg-tabs">
          <button className={settings.cardBackgroundType === 'gradient' ? 'active' : ''} onClick={() => onUpdateSetting('cardBackgroundType', 'gradient')}>Gradient</button>
          <button className={settings.cardBackgroundType === 'solid' ? 'active' : ''} onClick={() => onUpdateSetting('cardBackgroundType', 'solid')}>Màu</button>
          <button className={settings.cardBackgroundType === 'image' ? 'active' : ''} onClick={() => onUpdateSetting('cardBackgroundType', 'image')}>Ảnh</button>
        </div>
      </div>
      <div className="fc-section-body">
        {settings.cardBackgroundType === 'gradient' && (
          <>
            <div className="fc-cat-tabs">
              {GRADIENT_CATEGORIES.map(cat => (
                <button key={cat.key} className={gradientCategory === cat.key ? 'active' : ''} onClick={() => setGradientCategory(cat.key)} title={cat.label}>{cat.icon}</button>
              ))}
            </div>
            <div className="fc-palette">
              {GRADIENT_PRESETS.filter(g => gradientCategory === 'all' || g.category === gradientCategory).map((preset, idx) => (
                <button key={`${preset.category}-${idx}`} className={`fc-swatch ${settings.cardBackgroundGradient === preset.value ? 'active' : ''}`}
                  style={{ background: preset.value }} onClick={() => onUpdateSetting('cardBackgroundGradient', preset.value)} title={preset.label} />
              ))}
            </div>
          </>
        )}
        {settings.cardBackgroundType === 'solid' && (
          <div className="fc-color-row">
            <input type="color" value={settings.cardBackgroundColor} onChange={(e) => onUpdateSetting('cardBackgroundColor', e.target.value)} />
            {['#667eea', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#e91e63'].map(c => (
              <button key={c} className={`fc-color ${settings.cardBackgroundColor === c ? 'active' : ''}`} style={{ background: c }} onClick={() => onUpdateSetting('cardBackgroundColor', c)} />
            ))}
          </div>
        )}
        {settings.cardBackgroundType === 'image' && (
          <input type="text" className="fc-input" placeholder="Dán URL hình ảnh..." value={settings.cardBackgroundImage} onChange={(e) => onUpdateSetting('cardBackgroundImage', e.target.value)} />
        )}
      </div>
    </div>
  );
}
