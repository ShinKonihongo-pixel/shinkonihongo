// Settings modal for study session configuration
import type { StudySettingsModalProps } from './types';
import { ModalShell } from '../../ui/modal-shell';
import { ModalFilterSection } from './modal-filter-section';
import { ModalFontSection } from './modal-font-section';
import { ModalDisplaySection } from './modal-display-section';

export function StudySettingsModal({
  isOpen,
  filterMemorization,
  onFilterMemorizationChange,
  frontFontSize = 250,
  onFrontFontSizeChange,
  settings,
  onSettingsChange,
  onClose,
  isMobile,
}: StudySettingsModalProps) {
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Cài đặt hiển thị" maxWidth={480}>
      <div className="study-settings-content">
        {isMobile && (
          <ModalFilterSection
            filterMemorization={filterMemorization}
            onFilterMemorizationChange={onFilterMemorizationChange}
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
    </ModalShell>
  );
}
