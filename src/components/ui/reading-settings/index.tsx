// Main reading settings modal - refactored into smaller modules

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Type, Palette, Settings } from 'lucide-react';
import { useReadingSettings } from '../../../contexts/reading-settings-context';
import { TEXT_COLORS, FURIGANA_COLORS } from './color-palette';
import { FuriganaToggle } from './furigana-toggle';
import { SizeControl } from './size-control';
import { ColorPicker } from './color-picker';
import { PreviewSection } from './preview-section';
import { ModalHeader } from './modal-header';
import { ModalFooter } from './modal-footer';

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
        <ModalHeader onClose={onClose} />

        <div style={{ padding: '1rem', overflowY: 'auto', flex: 1 }}>
          <FuriganaToggle showFurigana={settings.showFurigana} onToggle={toggleFurigana} />

          <SizeControl
            label="Cỡ chữ"
            description="Kích thước văn bản"
            icon={<Type size={20} color="white" />}
            iconBackground="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
            currentSize={settings.fontSize}
            minSize={0.8}
            maxSize={1.5}
            onIncrease={increaseFontSize}
            onDecrease={decreaseFontSize}
            accentColor="#3b82f6"
          />

          <SizeControl
            label="Cỡ Furigana"
            description="Kích thước chữ đọc"
            icon={
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'white' }}>
                ルビ
              </span>
            }
            iconBackground="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
            currentSize={settings.furiganaSize}
            minSize={0.3}
            maxSize={0.8}
            onIncrease={increaseFuriganaSize}
            onDecrease={decreaseFuriganaSize}
            accentColor="#f59e0b"
            disabled={!settings.showFurigana}
          />

          <ColorPicker
            label="Màu chữ văn bản"
            description="Chọn màu cho nội dung"
            icon={<Palette size={20} color="white" />}
            iconBackground="linear-gradient(135deg, #ec4899 0%, #be185d 100%)"
            currentColor={settings.textColor || 'white'}
            colors={TEXT_COLORS}
            isExpanded={showTextColors}
            onToggle={() => setShowTextColors(!showTextColors)}
            onColorSelect={color => updateSettings({ textColor: color })}
          />

          <ColorPicker
            label="Màu Furigana"
            description="Màu chữ đọc hiragana"
            icon={
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white' }}>
                読
              </span>
            }
            iconBackground={`linear-gradient(135deg, ${settings.furiganaColor || '#a78bfa'} 0%, #6366f1 100%)`}
            currentColor={settings.furiganaColor || '#a78bfa'}
            colors={FURIGANA_COLORS}
            isExpanded={showFuriganaColors}
            onToggle={() => setShowFuriganaColors(!showFuriganaColors)}
            onColorSelect={color => updateSettings({ furiganaColor: color })}
            disabled={!settings.showFurigana}
          />

          <PreviewSection
            fontSize={settings.fontSize}
            textColor={settings.textColor || 'white'}
            showFurigana={settings.showFurigana}
            furiganaSize={settings.furiganaSize}
            furiganaColor={settings.furiganaColor || '#a78bfa'}
          />
        </div>

        <ModalFooter onClose={onClose} />
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

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
