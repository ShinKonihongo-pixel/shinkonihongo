// Settings modal for study session configuration
import { X } from 'lucide-react';
import type { StudySettingsModalProps } from './types';
import { ModalFilterSection } from './modal-filter-section';
import { ModalFontSection } from './modal-font-section';
import { ModalDisplaySection } from './modal-display-section';

export function StudySettingsModal({
  filterMemorization,
  onFilterMemorizationChange,
  filterDifficulty,
  onFilterDifficultyChange,
  frontFontSize = 250,
  onFrontFontSizeChange,
  settings,
  onSettingsChange,
  onClose,
  isMobile,
}: StudySettingsModalProps) {
  return (
    <div className="study-settings-modal-overlay" onClick={onClose}>
      <div className="study-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="study-settings-header">
          <h3>⚙️ Cài đặt bài học</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="study-settings-content">
          {isMobile && (
            <ModalFilterSection
              filterMemorization={filterMemorization}
              onFilterMemorizationChange={onFilterMemorizationChange}
              filterDifficulty={filterDifficulty}
              onFilterDifficultyChange={onFilterDifficultyChange}
            />
          )}

          <ModalFontSection
            settings={settings}
            frontFontSize={frontFontSize}
            onFrontFontSizeChange={onFrontFontSizeChange}
            onSettingsChange={onSettingsChange}
          />

          <ModalDisplaySection
            settings={settings}
            onSettingsChange={onSettingsChange}
          />
        </div>

        <div className="study-settings-footer">
          <button className="btn-close-settings" onClick={onClose}>
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
}
