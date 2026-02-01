// Reading Settings Modal - Premium modal for text/furigana settings

import { Settings, Type, Minus, Plus, Eye, EyeOff, X, Sparkles, Palette } from 'lucide-react';
import { useReadingSettings } from '../../contexts/reading-settings-context';

// Preset colors for text
const TEXT_COLOR_PRESETS = [
  '#ffffff', // White
  '#f0f0f0', // Light gray
  '#fef3c7', // Warm cream
  '#d1fae5', // Mint
  '#dbeafe', // Light blue
  '#fce7f3', // Pink
  '#e9d5ff', // Lavender
];

interface ReadingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReadingSettingsModal({ isOpen, onClose }: ReadingSettingsModalProps) {
  const {
    settings,
    updateSettings,
    toggleFurigana,
    increaseFontSize,
    decreaseFontSize,
    increaseFuriganaSize,
    decreaseFuriganaSize,
  } = useReadingSettings();

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'linear-gradient(180deg, #1e1e2f 0%, #151520 100%)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 100px rgba(139, 92, 246, 0.1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
              }}
            >
              <Settings size={20} color="white" />
            </div>
            <span style={{ color: 'white', fontSize: '1.1rem', fontWeight: 600 }}>
              Cài đặt hiển thị
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: '10px',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.25rem' }}>
          {/* Furigana Toggle */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.25rem',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              marginBottom: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: settings.showFurigana
                    ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                    : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  borderRadius: '12px',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: 'white',
                  transition: 'all 0.3s ease',
                }}
              >
                あ
              </div>
              <div>
                <div style={{ color: 'white', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.2rem' }}>
                  Furigana (Hiragana)
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>
                  Hiện chữ đọc trên Kanji
                </div>
              </div>
            </div>
            <button
              onClick={toggleFurigana}
              style={{
                width: '60px',
                height: '34px',
                borderRadius: '17px',
                border: 'none',
                background: settings.showFurigana
                  ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                  : 'rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.3s ease',
                boxShadow: settings.showFurigana ? '0 4px 15px rgba(34, 197, 94, 0.4)' : 'none',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '4px',
                  left: settings.showFurigana ? 'calc(100% - 30px)' : '4px',
                  width: '26px',
                  height: '26px',
                  background: 'white',
                  borderRadius: '50%',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {settings.showFurigana ? (
                  <Eye size={14} color="#22c55e" />
                ) : (
                  <EyeOff size={14} color="#666" />
                )}
              </div>
            </button>
          </div>

          {/* Font Size */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.25rem',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              marginBottom: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  borderRadius: '12px',
                }}
              >
                <Type size={22} color="white" />
              </div>
              <div>
                <div style={{ color: 'white', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.2rem' }}>
                  Cỡ chữ
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>
                  Kích thước văn bản
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={decreaseFontSize}
                disabled={settings.fontSize <= 0.8}
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '10px',
                  color: settings.fontSize <= 0.8 ? 'rgba(255, 255, 255, 0.3)' : '#3b82f6',
                  cursor: settings.fontSize <= 0.8 ? 'not-allowed' : 'pointer',
                }}
              >
                <Minus size={16} />
              </button>
              <span
                style={{
                  minWidth: '55px',
                  textAlign: 'center',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#3b82f6',
                }}
              >
                {Math.round(settings.fontSize * 100)}%
              </span>
              <button
                onClick={increaseFontSize}
                disabled={settings.fontSize >= 1.5}
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '10px',
                  color: settings.fontSize >= 1.5 ? 'rgba(255, 255, 255, 0.3)' : '#3b82f6',
                  cursor: settings.fontSize >= 1.5 ? 'not-allowed' : 'pointer',
                }}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Furigana Size */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.25rem',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              marginBottom: '1rem',
              opacity: settings.showFurigana ? 1 : 0.4,
              pointerEvents: settings.showFurigana ? 'auto' : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'white',
                }}
              >
                ルビ
              </div>
              <div>
                <div style={{ color: 'white', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.2rem' }}>
                  Cỡ Furigana
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>
                  Kích thước chữ đọc
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={decreaseFuriganaSize}
                disabled={settings.furiganaSize <= 0.3}
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '10px',
                  color: settings.furiganaSize <= 0.3 ? 'rgba(255, 255, 255, 0.3)' : '#f59e0b',
                  cursor: settings.furiganaSize <= 0.3 ? 'not-allowed' : 'pointer',
                }}
              >
                <Minus size={16} />
              </button>
              <span
                style={{
                  minWidth: '55px',
                  textAlign: 'center',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#f59e0b',
                }}
              >
                {Math.round(settings.furiganaSize * 100)}%
              </span>
              <button
                onClick={increaseFuriganaSize}
                disabled={settings.furiganaSize >= 0.8}
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '10px',
                  color: settings.furiganaSize >= 0.8 ? 'rgba(255, 255, 255, 0.3)' : '#f59e0b',
                  cursor: settings.furiganaSize >= 0.8 ? 'not-allowed' : 'pointer',
                }}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Text Color */}
          <div
            style={{
              padding: '1rem 1.25rem',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                  borderRadius: '12px',
                }}
              >
                <Palette size={22} color="white" />
              </div>
              <div>
                <div style={{ color: 'white', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.2rem' }}>
                  Màu chữ
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>
                  Màu văn bản câu hỏi
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {TEXT_COLOR_PRESETS.map(color => (
                <button
                  key={color}
                  onClick={() => updateSettings({ textColor: color })}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: color,
                    border: settings.textColor === color
                      ? '3px solid #8b5cf6'
                      : '2px solid rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer',
                    boxShadow: settings.textColor === color ? '0 0 12px rgba(139, 92, 246, 0.5)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div
            style={{
              padding: '1.25rem',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
              }}
            >
              <Sparkles size={14} color="#8b5cf6" />
              <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Xem trước
              </span>
            </div>
            <div
              style={{
                fontSize: `${settings.fontSize * 1.2}rem`,
                color: settings.textColor || 'white',
                lineHeight: 2.5,
                textAlign: 'center',
              }}
            >
              {settings.showFurigana ? (
                <>
                  <ruby style={{ rubyAlign: 'center' }}>
                    日本語
                    <rp>(</rp>
                    <rt style={{ fontSize: `${settings.furiganaSize}em`, color: '#a78bfa' }}>にほんご</rt>
                    <rp>)</rp>
                  </ruby>
                  を
                  <ruby style={{ rubyAlign: 'center' }}>
                    勉強
                    <rp>(</rp>
                    <rt style={{ fontSize: `${settings.furiganaSize}em`, color: '#a78bfa' }}>べんきょう</rt>
                    <rp>)</rp>
                  </ruby>
                  しています。
                </>
              ) : (
                '日本語を勉強しています。'
              )}
            </div>
          </div>

          {/* Info */}
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.875rem 1rem',
              background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.15)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
            }}
          >
            <span style={{ fontSize: '1rem' }}>✨</span>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1.5 }}>
              Furigana tự động thêm cho tất cả Kanji
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0 1.25rem 1.25rem' }}>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '1rem',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              border: 'none',
              borderRadius: '14px',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
            }}
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );
}

// Trigger button component
export function ReadingSettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Cài đặt hiển thị"
      style={{
        width: '36px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        color: 'rgba(255, 255, 255, 0.7)',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <Settings size={18} />
    </button>
  );
}
