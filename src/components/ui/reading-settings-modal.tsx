// Reading Settings Modal - Premium modal for text/furigana settings

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Settings, Type, Minus, Plus, Eye, EyeOff, X, Sparkles, Palette, ChevronDown, ChevronUp } from 'lucide-react';
import { useReadingSettings } from '../../contexts/reading-settings-context';

// Text colors - simple flat list like furigana colors
const TEXT_COLORS = [
  { color: '#ffffff', name: 'Trắng' },
  { color: '#f8fafc', name: 'Trắng sữa' },
  { color: '#e2e8f0', name: 'Xám bạc' },
  { color: '#fef3c7', name: 'Kem vàng' },
  { color: '#fde68a', name: 'Vàng nhạt' },
  { color: '#fbbf24', name: 'Vàng amber' },
  { color: '#fdba74', name: 'Cam nhạt' },
  { color: '#fb923c', name: 'Cam' },
  { color: '#f97316', name: 'Cam đậm' },
  { color: '#fca5a5', name: 'Đỏ nhạt' },
  { color: '#f87171', name: 'Đỏ san hô' },
  { color: '#ef4444', name: 'Đỏ' },
  { color: '#dbeafe', name: 'Xanh dương nhạt' },
  { color: '#93c5fd', name: 'Xanh biển' },
  { color: '#60a5fa', name: 'Xanh đại dương' },
  { color: '#d1fae5', name: 'Bạc hà' },
  { color: '#6ee7b7', name: 'Xanh lá non' },
  { color: '#34d399', name: 'Xanh ngọc' },
  { color: '#e9d5ff', name: 'Lavender' },
  { color: '#c4b5fd', name: 'Tím violet' },
  { color: '#a78bfa', name: 'Tím đậm' },
  { color: '#fce7f3', name: 'Hồng nhạt' },
  { color: '#f9a8d4', name: 'Hồng đào' },
  { color: '#f472b6', name: 'Hồng sen' },
];

// Flatten for furigana colors (separate list)
const FURIGANA_COLORS = [
  { color: '#a78bfa', name: 'Tím mặc định' },
  { color: '#c4b5fd', name: 'Tím nhạt' },
  { color: '#f472b6', name: 'Hồng' },
  { color: '#fb7185', name: 'Đỏ hồng' },
  { color: '#fbbf24', name: 'Vàng amber' },
  { color: '#fcd34d', name: 'Vàng chanh' },
  { color: '#34d399', name: 'Xanh ngọc' },
  { color: '#22d3ee', name: 'Xanh cyan' },
  { color: '#60a5fa', name: 'Xanh biển' },
  { color: '#818cf8', name: 'Indigo' },
  { color: '#94a3b8', name: 'Xám' },
  { color: '#ffffff', name: 'Trắng' },
];

interface ReadingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReadingSettingsModal({ isOpen, onClose }: ReadingSettingsModalProps) {
  const [mounted, setMounted] = useState(false);
  const {
    settings,
    updateSettings,
    toggleFurigana,
    increaseFontSize,
    decreaseFontSize,
    increaseFuriganaSize,
    decreaseFuriganaSize,
  } = useReadingSettings();

  const [showTextColors, setShowTextColors] = useState(false);
  const [showFuriganaColors, setShowFuriganaColors] = useState(false);

  // Ensure we're mounted for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
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
          maxWidth: '420px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 80px rgba(139, 92, 246, 0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.25rem',
            background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.35)',
              }}
            >
              <Settings size={18} color="white" />
            </div>
            <span style={{ color: 'white', fontSize: '1rem', fontWeight: 600 }}>
              Cài đặt hiển thị
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div style={{ padding: '1rem', overflowY: 'auto', flex: 1 }}>
          {/* Furigana Toggle */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.875rem 1rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '14px',
              marginBottom: '0.625rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: settings.showFurigana
                    ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                    : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  borderRadius: '10px',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'white',
                  transition: 'all 0.3s ease',
                }}
              >
                あ
              </div>
              <div>
                <div style={{ color: 'white', fontSize: '0.9rem', fontWeight: 500 }}>
                  Furigana
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.7rem' }}>
                  Hiện chữ đọc trên Kanji
                </div>
              </div>
            </div>
            <button
              onClick={toggleFurigana}
              style={{
                width: '52px',
                height: '28px',
                borderRadius: '14px',
                border: 'none',
                background: settings.showFurigana
                  ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                  : 'rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.3s ease',
                boxShadow: settings.showFurigana ? '0 2px 10px rgba(34, 197, 94, 0.35)' : 'none',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '3px',
                  left: settings.showFurigana ? 'calc(100% - 25px)' : '3px',
                  width: '22px',
                  height: '22px',
                  background: 'white',
                  borderRadius: '50%',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {settings.showFurigana ? (
                  <Eye size={12} color="#22c55e" />
                ) : (
                  <EyeOff size={12} color="#666" />
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
              padding: '0.875rem 1rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '14px',
              marginBottom: '0.625rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  borderRadius: '10px',
                }}
              >
                <Type size={20} color="white" />
              </div>
              <div>
                <div style={{ color: 'white', fontSize: '0.9rem', fontWeight: 500 }}>
                  Cỡ chữ
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.7rem' }}>
                  Kích thước văn bản
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                onClick={decreaseFontSize}
                disabled={settings.fontSize <= 0.8}
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '8px',
                  color: settings.fontSize <= 0.8 ? 'rgba(255, 255, 255, 0.25)' : '#3b82f6',
                  cursor: settings.fontSize <= 0.8 ? 'not-allowed' : 'pointer',
                }}
              >
                <Minus size={14} />
              </button>
              <span
                style={{
                  minWidth: '48px',
                  textAlign: 'center',
                  fontSize: '0.85rem',
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
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '8px',
                  color: settings.fontSize >= 1.5 ? 'rgba(255, 255, 255, 0.25)' : '#3b82f6',
                  cursor: settings.fontSize >= 1.5 ? 'not-allowed' : 'pointer',
                }}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Furigana Size */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.875rem 1rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '14px',
              marginBottom: '0.625rem',
              opacity: settings.showFurigana ? 1 : 0.35,
              pointerEvents: settings.showFurigana ? 'auto' : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  borderRadius: '10px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: 'white',
                }}
              >
                ルビ
              </div>
              <div>
                <div style={{ color: 'white', fontSize: '0.9rem', fontWeight: 500 }}>
                  Cỡ Furigana
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.7rem' }}>
                  Kích thước chữ đọc
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                onClick={decreaseFuriganaSize}
                disabled={settings.furiganaSize <= 0.3}
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '8px',
                  color: settings.furiganaSize <= 0.3 ? 'rgba(255, 255, 255, 0.25)' : '#f59e0b',
                  cursor: settings.furiganaSize <= 0.3 ? 'not-allowed' : 'pointer',
                }}
              >
                <Minus size={14} />
              </button>
              <span
                style={{
                  minWidth: '48px',
                  textAlign: 'center',
                  fontSize: '0.85rem',
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
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '8px',
                  color: settings.furiganaSize >= 0.8 ? 'rgba(255, 255, 255, 0.25)' : '#f59e0b',
                  cursor: settings.furiganaSize >= 0.8 ? 'not-allowed' : 'pointer',
                }}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Text Color - Collapsible like Furigana */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '14px',
              marginBottom: '0.625rem',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setShowTextColors(!showTextColors)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.875rem',
                padding: '0.875rem 1rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                  borderRadius: '10px',
                }}
              >
                <Palette size={20} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'white', fontSize: '0.9rem', fontWeight: 500 }}>
                  Màu chữ văn bản
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.7rem' }}>
                  Chọn màu cho nội dung
                </div>
              </div>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: settings.textColor,
                  border: '2px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
              />
              {showTextColors ? <ChevronUp size={14} color="rgba(255,255,255,0.5)" /> : <ChevronDown size={14} color="rgba(255,255,255,0.5)" />}
            </button>

            {showTextColors && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', padding: '0.6rem 1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                {TEXT_COLORS.map(({ color, name }) => (
                  <button
                    key={color}
                    onClick={() => updateSettings({ textColor: color })}
                    title={name}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: color,
                      border: settings.textColor === color
                        ? '3px solid #8b5cf6'
                        : '2px solid rgba(255, 255, 255, 0.15)',
                      cursor: 'pointer',
                      boxShadow: settings.textColor === color ? '0 0 12px rgba(139, 92, 246, 0.5)' : 'none',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                  >
                    {settings.textColor === color && (
                      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color === '#ffffff' || color === '#f8fafc' || color === '#e2e8f0' || color === '#fef3c7' || color === '#fde68a' ? '#1a1a2e' : '#fff', fontWeight: 700, fontSize: '0.75rem', textShadow: color === '#ffffff' || color === '#f8fafc' ? 'none' : '0 1px 2px rgba(0,0,0,0.3)' }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Furigana Color */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '14px',
              marginBottom: '0.625rem',
              overflow: 'hidden',
              opacity: settings.showFurigana ? 1 : 0.35,
              pointerEvents: settings.showFurigana ? 'auto' : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            <button
              onClick={() => setShowFuriganaColors(!showFuriganaColors)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.875rem',
                padding: '0.875rem 1rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `linear-gradient(135deg, ${settings.furiganaColor || '#a78bfa'} 0%, #6366f1 100%)`,
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'white',
                }}
              >
                読
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'white', fontSize: '0.9rem', fontWeight: 500 }}>
                  Màu Furigana
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.7rem' }}>
                  Màu chữ đọc hiragana
                </div>
              </div>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: settings.furiganaColor || '#a78bfa',
                  border: '2px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
              />
              {showFuriganaColors ? <ChevronUp size={14} color="rgba(255,255,255,0.5)" /> : <ChevronDown size={14} color="rgba(255,255,255,0.5)" />}
            </button>

            {showFuriganaColors && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', padding: '0.6rem 1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                {FURIGANA_COLORS.map(({ color, name }) => (
                  <button
                    key={color}
                    onClick={() => updateSettings({ furiganaColor: color })}
                    title={name}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: color,
                      border: (settings.furiganaColor || '#a78bfa') === color
                        ? '3px solid #8b5cf6'
                        : '2px solid rgba(255, 255, 255, 0.15)',
                      cursor: 'pointer',
                      boxShadow: (settings.furiganaColor || '#a78bfa') === color ? '0 0 12px rgba(139, 92, 246, 0.5)' : 'none',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                  >
                    {(settings.furiganaColor || '#a78bfa') === color && (
                      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color === '#ffffff' ? '#1a1a2e' : '#fff', fontWeight: 700, fontSize: '0.75rem', textShadow: color === '#ffffff' ? 'none' : '0 1px 2px rgba(0,0,0,0.3)' }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preview - Simple */}
          <div
            style={{
              padding: '1rem',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.06) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.15)',
              borderRadius: '14px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginBottom: '0.5rem',
              }}
            >
              <Sparkles size={12} color="#8b5cf6" />
              <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Xem trước
              </span>
            </div>
            <div
              style={{
                fontSize: `${settings.fontSize * 1.5}rem`,
                color: settings.textColor || 'white',
                lineHeight: 2.2,
                textAlign: 'center',
              }}
            >
              {settings.showFurigana ? (
                <ruby style={{ rubyAlign: 'center' }}>
                  日本語
                  <rp>(</rp>
                  <rt style={{ fontSize: `${settings.furiganaSize}em`, color: settings.furiganaColor || '#a78bfa' }}>にほんご</rt>
                  <rp>)</rp>
                </ruby>
              ) : (
                '日本語'
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0.875rem 1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(139, 92, 246, 0.35)',
              transition: 'all 0.2s',
            }}
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at document.body level
  return createPortal(modalContent, document.body);
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
