import type { Dispatch, SetStateAction } from 'react';
import type { FlashcardSettingsProps, DeviceType } from './settings-types';
import type { GradientCategory } from './settings-constants';
import { FlashcardPreview } from './flashcard-settings-preview';
import { FlashcardBackground } from './flashcard-settings-background';
import { FlashcardFrame } from './flashcard-settings-frame';

interface FlashcardSettingsExtendedProps extends FlashcardSettingsProps {
  frameCategory: string;
  setFrameCategory: (category: string) => void;
  gradientCategory: GradientCategory;
  setGradientCategory: (category: GradientCategory) => void;
  selectedDevice: DeviceType;
  setSelectedDevice: Dispatch<SetStateAction<DeviceType>>;
  fontSizeMultiplier: number;
}

export function FlashcardSettings({
  settings,
  onUpdateSetting,
  frameCategory,
  setFrameCategory,
  gradientCategory,
  setGradientCategory,
}: FlashcardSettingsExtendedProps) {
  return (
    <>
      <div className="fc-studio">
        <FlashcardPreview settings={settings} onUpdateSetting={onUpdateSetting} />

        <div className="fc-studio-bottom">
          <FlashcardBackground
            settings={settings}
            onUpdateSetting={onUpdateSetting}
            gradientCategory={gradientCategory}
            setGradientCategory={setGradientCategory}
          />

          <FlashcardFrame
            settings={settings}
            onUpdateSetting={onUpdateSetting}
            frameCategory={frameCategory}
            setFrameCategory={setFrameCategory}
          />
        </div>
      </div>

      <section className="settings-section">
        <h3>Hiển thị trường (mặt sau)</h3>

        <div className="setting-item">
          <label>Từ vựng</label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.showVocabulary}
              onChange={(e) => onUpdateSetting('showVocabulary', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <label>Âm Hán Việt</label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.showSinoVietnamese}
              onChange={(e) => onUpdateSetting('showSinoVietnamese', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <label>Nghĩa</label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.showMeaning}
              onChange={(e) => onUpdateSetting('showMeaning', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <label>Ví dụ</label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.showExample}
              onChange={(e) => onUpdateSetting('showExample', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </section>
    </>
  );
}
