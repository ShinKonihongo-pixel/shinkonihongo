// Reading Settings Panel - Dropdown panel for text/furigana settings

import { useState, useRef, useEffect } from 'react';
import { Settings, Type, Minus, Plus, Eye, EyeOff, X } from 'lucide-react';
import { useReadingSettings } from '../../contexts/reading-settings-context';
import './reading-settings-panel.css';

interface ReadingSettingsPanelProps {
  position?: 'left' | 'right';
}

export function ReadingSettingsPanel({ position = 'right' }: ReadingSettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    settings,
    toggleFurigana,
    increaseFontSize,
    decreaseFontSize,
    increaseFuriganaSize,
    decreaseFuriganaSize,
  } = useReadingSettings();

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="settings-panel-wrapper" ref={panelRef}>
      <button
        className={`settings-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Cài đặt hiển thị"
      >
        <Settings size={18} />
      </button>

      {isOpen && (
        <div className={`settings-dropdown ${position}`}>
          <div className="settings-header">
            <span>Cài đặt hiển thị</span>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              <X size={16} />
            </button>
          </div>

          {/* Furigana Toggle */}
          <div className="settings-item">
            <div className="setting-label">
              <span className="setting-icon">あ</span>
              <span>Furigana</span>
            </div>
            <button
              className={`toggle-btn ${settings.showFurigana ? 'on' : 'off'}`}
              onClick={toggleFurigana}
            >
              {settings.showFurigana ? <Eye size={16} /> : <EyeOff size={16} />}
              <span>{settings.showFurigana ? 'Bật' : 'Tắt'}</span>
            </button>
          </div>

          {/* Font Size */}
          <div className="settings-item">
            <div className="setting-label">
              <Type size={16} className="setting-icon-svg" />
              <span>Cỡ chữ</span>
            </div>
            <div className="size-controls">
              <button
                className="size-btn"
                onClick={decreaseFontSize}
                disabled={settings.fontSize <= 0.8}
              >
                <Minus size={14} />
              </button>
              <span className="size-value">{Math.round(settings.fontSize * 100)}%</span>
              <button
                className="size-btn"
                onClick={increaseFontSize}
                disabled={settings.fontSize >= 2.5}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Furigana Size */}
          {settings.showFurigana && (
            <div className="settings-item">
              <div className="setting-label">
                <span className="setting-icon furigana-icon">ルビ</span>
                <span>Cỡ furigana</span>
              </div>
              <div className="size-controls">
                <button
                  className="size-btn"
                  onClick={decreaseFuriganaSize}
                  disabled={settings.furiganaSize <= 0.3}
                >
                  <Minus size={14} />
                </button>
                <span className="size-value">{Math.round(settings.furiganaSize * 100)}%</span>
                <button
                  className="size-btn"
                  onClick={increaseFuriganaSize}
                  disabled={settings.furiganaSize >= 0.8}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="settings-preview">
            <span className="preview-label">Xem trước:</span>
            <div
              className="preview-text"
              style={{ fontSize: `${settings.fontSize}rem` }}
            >
              {settings.showFurigana ? (
                <ruby>
                  日本語
                  <rp>(</rp>
                  <rt style={{ fontSize: `${settings.furiganaSize}em` }}>にほんご</rt>
                  <rp>)</rp>
                </ruby>
              ) : (
                '日本語'
              )}
              を勉強します
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
