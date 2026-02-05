import type { CardFrameId } from '../../../hooks/use-settings';
import { CARD_FRAME_PRESETS } from '../../../hooks/use-settings';
import type { AppSettings } from '../../../hooks/use-settings';

interface FlashcardFrameProps {
  settings: AppSettings;
  onUpdateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  frameCategory: string;
  setFrameCategory: (category: string) => void;
}

export function FlashcardFrame({ settings, onUpdateSetting, frameCategory, setFrameCategory }: FlashcardFrameProps) {
  return (
    <div className="fc-section">
      <div className="fc-section-header">
        <span className="fc-section-icon">🖼️</span>
        <span className="fc-section-title">Khung</span>
      </div>
      <div className="fc-section-body">
        <div className="fc-cat-tabs">
          {[{ k: 'all', i: '🎨' }, { k: 'basic', i: '◻️' }, { k: 'gradient', i: '🌈' }, { k: 'shadow', i: '✨' }, { k: 'animated', i: '🔮' }, { k: 'custom', i: '⚙️' }].map(c => (
            <button key={c.k} className={frameCategory === c.k ? 'active' : ''} onClick={() => setFrameCategory(c.k)}>{c.i}</button>
          ))}
        </div>
        {frameCategory !== 'custom' ? (
          <div className="fc-frames">
            {CARD_FRAME_PRESETS.filter(f => frameCategory === 'all' || f.category === frameCategory || (frameCategory === 'basic' && f.id === 'none')).map(frame => (
              <button key={frame.id} className={`fc-frame ${settings.cardFrame === frame.id ? 'active' : ''}`}
                onClick={() => onUpdateSetting('cardFrame', frame.id as CardFrameId)} title={frame.name}
                style={{ border: frame.id === 'none' ? '2px dashed #ccc' : (frame.css.border || 'none'), boxShadow: frame.css.boxShadow as string || 'none', borderRadius: frame.css.borderRadius as string || '4px' }}>
                {frame.id === 'none' ? '✕' : '漢'}
              </button>
            ))}
          </div>
        ) : (
          <div className="fc-custom-frame">
            <div className="fc-cf-row">
              <span>Viền</span>
              <input type="range" min="1" max="10" value={settings.customFrame.borderWidth} onChange={(e) => onUpdateSetting('customFrame', { ...settings.customFrame, borderWidth: Number(e.target.value) })} />
              <input type="color" value={settings.customFrame.borderColor} onChange={(e) => onUpdateSetting('customFrame', { ...settings.customFrame, borderColor: e.target.value })} />
            </div>
            <div className="fc-cf-row">
              <span>Bo góc</span>
              <input type="range" min="0" max="24" value={settings.customFrame.borderRadius} onChange={(e) => onUpdateSetting('customFrame', { ...settings.customFrame, borderRadius: Number(e.target.value) })} />
              <label><input type="checkbox" checked={settings.customFrame.glowEnabled} onChange={(e) => onUpdateSetting('customFrame', { ...settings.customFrame, glowEnabled: e.target.checked })} /> Glow</label>
            </div>
            <button className="fc-apply-btn" onClick={() => onUpdateSetting('cardFrame', 'custom' as CardFrameId)}>Áp dụng khung</button>
          </div>
        )}
      </div>
    </div>
  );
}
