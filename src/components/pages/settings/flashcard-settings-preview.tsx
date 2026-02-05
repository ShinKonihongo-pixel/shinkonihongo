import { CARD_FRAME_PRESETS } from '../../../hooks/use-settings';
import type { AppSettings } from '../../../hooks/use-settings';
import { getPreviewBackground, getCustomFrameStyle } from './settings-utils';
import { KANJI_FONTS } from './settings-constants';

interface FlashcardPreviewProps {
  settings: AppSettings;
  onUpdateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

export function FlashcardPreview({ settings, onUpdateSetting }: FlashcardPreviewProps) {
  return (
    <div className="fc-studio-top">
      <div className="fc-preview-area">
        <div
          className={`fc-preview-card fc-card-front ${CARD_FRAME_PRESETS.find(f => f.id === settings.cardFrame)?.animationClass || ''}`}
          style={{
            ...(settings.cardFrame === 'custom' ? getCustomFrameStyle(settings.customFrame) : CARD_FRAME_PRESETS.find(f => f.id === settings.cardFrame)?.css),
            ...getPreviewBackground(settings),
          }}
        >
          <span
            className="fc-kanji"
            style={{
              fontFamily: `"${settings.kanjiFont}", serif`,
              fontSize: `${Math.min(settings.kanjiFontSize * 0.4, 120)}px`,
              fontWeight: settings.kanjiBold ? 900 : 400
            }}
          >
            漢字
          </span>
        </div>
        <div className="fc-preview-label">Mặt trước</div>
      </div>

      <div className="fc-preview-area">
        <div className="fc-preview-card fc-card-back">
          {settings.showSinoVietnamese && <div className="fc-sino" style={{ fontSize: `${settings.sinoVietnameseFontSize * 0.6}px` }}>HÁN TỰ</div>}
          {settings.showVocabulary && <div className="fc-vocab" style={{ fontSize: `${settings.vocabularyFontSize * 0.6}px` }}>かんじ</div>}
          {settings.showMeaning && <div className="fc-meaning" style={{ fontSize: `${settings.meaningFontSize * 0.6}px` }}>Chữ Hán</div>}
        </div>
        <div className="fc-preview-label">Mặt sau</div>
      </div>

      <div className="fc-section fc-typography">
        <div className="fc-section-header">
          <span className="fc-section-title">Kiểu chữ</span>
        </div>
        <div className="fc-section-body">
          <div className="fc-control-row">
            <label>Font</label>
            <select
              value={settings.kanjiFont}
              onChange={(e) => onUpdateSetting('kanjiFont', e.target.value)}
              className="fc-select"
            >
              {KANJI_FONTS.map((font) => (
                <option key={font.value} value={font.value}>{font.label}</option>
              ))}
            </select>
            <label className="fc-toggle-mini">
              <input type="checkbox" checked={settings.kanjiBold} onChange={(e) => onUpdateSetting('kanjiBold', e.target.checked)} />
              <span>B</span>
            </label>
          </div>
          <div className="fc-control-row">
            <label>Kanji</label>
            <input type="range" min="100" max="400" step="10" value={settings.kanjiFontSize}
              onChange={(e) => onUpdateSetting('kanjiFontSize', Number(e.target.value))} />
            <span className="fc-value">{settings.kanjiFontSize}</span>
          </div>
          <div className="fc-control-row">
            <label>Hán Việt</label>
            <input type="range" min="16" max="60" step="2" value={settings.sinoVietnameseFontSize}
              onChange={(e) => onUpdateSetting('sinoVietnameseFontSize', Number(e.target.value))} />
            <span className="fc-value">{settings.sinoVietnameseFontSize}</span>
          </div>
          <div className="fc-control-row">
            <label>Từ vựng</label>
            <input type="range" min="16" max="60" step="2" value={settings.vocabularyFontSize}
              onChange={(e) => onUpdateSetting('vocabularyFontSize', Number(e.target.value))} />
            <span className="fc-value">{settings.vocabularyFontSize}</span>
          </div>
          <div className="fc-control-row">
            <label>Nghĩa</label>
            <input type="range" min="14" max="48" step="2" value={settings.meaningFontSize}
              onChange={(e) => onUpdateSetting('meaningFontSize', Number(e.target.value))} />
            <span className="fc-value">{settings.meaningFontSize}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
