// Reading Settings Panel - Dropdown panel for text/furigana settings

import { useState, useRef, useEffect } from 'react';
import { Settings, Type, Minus, Plus, Eye, EyeOff, X } from 'lucide-react';
import { useReadingSettings } from '../../contexts/reading-settings-context';

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
                disabled={settings.fontSize >= 1.5}
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

      <style>{`
        .settings-panel-wrapper {
          position: relative;
        }

        .settings-trigger {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .settings-trigger:hover,
        .settings-trigger.active {
          background: rgba(59, 130, 246, 0.15);
          border-color: rgba(59, 130, 246, 0.4);
          color: #3b82f6;
        }

        .settings-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          z-index: 1000;
          width: 280px;
          background: rgba(20, 20, 35, 0.98);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 0;
          animation: dropdownSlide 0.2s ease;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }

        .settings-dropdown.right {
          right: 0;
        }

        .settings-dropdown.left {
          left: 0;
        }

        @keyframes dropdownSlide {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          font-weight: 600;
          color: white;
          font-size: 0.9rem;
        }

        .close-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border: none;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .settings-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.875rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .settings-item:last-of-type {
          border-bottom: none;
        }

        .setting-label {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.875rem;
        }

        .setting-icon {
          font-size: 0.9rem;
          font-weight: 600;
          color: #8b5cf6;
        }

        .setting-icon-svg {
          color: #8b5cf6;
        }

        .furigana-icon {
          font-size: 0.65rem;
          padding: 2px 4px;
          background: rgba(139, 92, 246, 0.2);
          border-radius: 4px;
        }

        .toggle-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.75rem;
          border: none;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .toggle-btn.on {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .toggle-btn.off {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.5);
        }

        .toggle-btn:hover {
          transform: scale(1.02);
        }

        .size-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .size-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .size-btn:hover:not(:disabled) {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.4);
          color: #3b82f6;
        }

        .size-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .size-value {
          min-width: 45px;
          text-align: center;
          font-size: 0.8rem;
          font-weight: 600;
          color: white;
        }

        .settings-preview {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 0 0 16px 16px;
        }

        .preview-label {
          display: block;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 0.5rem;
        }

        .preview-text {
          color: white;
          line-height: 2.2;
        }

        .preview-text rt {
          color: rgba(255, 255, 255, 0.6);
        }

        @media (max-width: 480px) {
          .settings-dropdown {
            position: fixed;
            top: auto;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            border-radius: 20px 20px 0 0;
            animation: slideUp 0.3s ease;
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(100%);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        }
      `}</style>
    </div>
  );
}
