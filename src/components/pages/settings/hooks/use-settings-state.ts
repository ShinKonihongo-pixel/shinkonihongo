import { useState, useEffect } from 'react';
import type { SettingsTab, GeneralSubTab, DeviceType } from '../settings-types';
import type { GradientCategory } from '../settings-constants';
import { getDeviceType } from '../settings-utils';

export function useSettingsState(initialTab?: SettingsTab) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab || 'general');
  const [generalSubTab, setGeneralSubTab] = useState<GeneralSubTab>('flashcard');
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceType>(getDeviceType);
  const [frameCategory, setFrameCategory] = useState<string>('all');
  const [gradientCategory, setGradientCategory] = useState<GradientCategory>('all');

  useEffect(() => {
    const handleResize = () => setSelectedDevice(getDeviceType());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fontSizeMultiplier = selectedDevice === 'desktop' ? 1 : selectedDevice === 'tablet' ? 0.7 : 0.5;

  return {
    activeTab,
    setActiveTab,
    generalSubTab,
    setGeneralSubTab,
    showExportModal,
    setShowExportModal,
    selectedDevice,
    setSelectedDevice,
    frameCategory,
    setFrameCategory,
    gradientCategory,
    setGradientCategory,
    fontSizeMultiplier,
  };
}
