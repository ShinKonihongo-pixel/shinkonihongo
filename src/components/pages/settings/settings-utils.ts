// Settings page utility functions
// Extracted from settings-page.tsx for better maintainability

import type { AppSettings, CustomFrameSettings } from '../../../hooks/use-settings';
import type { DeviceType } from './settings-types';

/**
 * Detect current device type based on screen width
 */
export function getDeviceType(): DeviceType {
  const width = window.innerWidth;
  if (width > 1024) return 'desktop';
  if (width >= 768) return 'tablet';
  return 'mobile';
}

/**
 * Get font size multiplier based on device type
 */
export function getFontSizeMultiplier(deviceType: DeviceType): number {
  switch (deviceType) {
    case 'desktop': return 1;
    case 'tablet': return 0.7;
    case 'mobile': return 0.5;
  }
}

/**
 * Format duration in seconds to readable string (Vietnamese)
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} giây`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

/**
 * Format date to Vietnamese locale string
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Get background style for card preview based on settings
 */
export function getPreviewBackground(settings: AppSettings): React.CSSProperties {
  switch (settings.cardBackgroundType) {
    case 'solid':
      return { background: settings.cardBackgroundColor };
    case 'image':
      return settings.cardBackgroundImage
        ? {
            backgroundImage: `url(${settings.cardBackgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }
        : { background: settings.cardBackgroundGradient };
    case 'gradient':
    default:
      return { background: settings.cardBackgroundGradient };
  }
}

/**
 * Get custom frame style from settings
 */
export function getCustomFrameStyle(customFrame: CustomFrameSettings): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    border: `${customFrame.borderWidth}px ${customFrame.borderStyle} ${customFrame.borderColor}`,
    borderRadius: `${customFrame.borderRadius}px`,
  };

  if (customFrame.glowEnabled) {
    baseStyle.boxShadow = `0 0 ${customFrame.glowIntensity}px ${customFrame.glowColor}, 0 0 ${customFrame.glowIntensity * 2}px ${customFrame.glowColor}`;
  }

  return baseStyle;
}
