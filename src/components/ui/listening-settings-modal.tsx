// Listening Settings Modal - Display settings modal for listening practice

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Settings, Eye, EyeOff, X, Headphones } from 'lucide-react';
import { useListeningSettings } from '../../contexts/listening-settings-context';

interface ListeningSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ListeningSettingsModal({ isOpen, onClose }: ListeningSettingsModalProps) {
  const [mounted, setMounted] = useState(false);

  const {
    settings,
    toggleAutoPlayNext,
    toggleShowVocabulary,
    toggleShowMeaning,
    toggleShowKanji,
  } = useListeningSettings();

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
          maxWidth: '420px',
          maxHeight: '90vh',
          overflowY: 'auto',
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
            background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.1) 100%)',
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
                background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
              }}
            >
              <Headphones size={20} color="white" />
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

            {/* Show Vocabulary Toggle */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.875rem 1rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                marginBottom: '0.5rem',
              }}
            >
              <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
                Từ vựng (Hiragana)
              </span>
              <button
                onClick={toggleShowVocabulary}
                style={{
                  width: '50px',
                  height: '28px',
                  borderRadius: '14px',
                  border: 'none',
                  background: settings.showVocabulary
                    ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                    : 'rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '3px',
                    left: settings.showVocabulary ? 'calc(100% - 25px)' : '3px',
                    width: '22px',
                    height: '22px',
                    background: 'white',
                    borderRadius: '50%',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {settings.showVocabulary ? <Eye size={12} color="#22c55e" /> : <EyeOff size={12} color="#666" />}
                </div>
              </button>
            </div>

            {/* Show Kanji Toggle */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.875rem 1rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                marginBottom: '0.5rem',
              }}
            >
              <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
                Kanji
              </span>
              <button
                onClick={toggleShowKanji}
                style={{
                  width: '50px',
                  height: '28px',
                  borderRadius: '14px',
                  border: 'none',
                  background: settings.showKanji
                    ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                    : 'rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '3px',
                    left: settings.showKanji ? 'calc(100% - 25px)' : '3px',
                    width: '22px',
                    height: '22px',
                    background: 'white',
                    borderRadius: '50%',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {settings.showKanji ? <Eye size={12} color="#22c55e" /> : <EyeOff size={12} color="#666" />}
                </div>
              </button>
            </div>

            {/* Show Meaning Toggle */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.875rem 1rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                marginBottom: '0.5rem',
              }}
            >
              <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
                Nghĩa tiếng Việt
              </span>
              <button
                onClick={toggleShowMeaning}
                style={{
                  width: '50px',
                  height: '28px',
                  borderRadius: '14px',
                  border: 'none',
                  background: settings.showMeaning
                    ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                    : 'rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '3px',
                    left: settings.showMeaning ? 'calc(100% - 25px)' : '3px',
                    width: '22px',
                    height: '22px',
                    background: 'white',
                    borderRadius: '50%',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {settings.showMeaning ? <Eye size={12} color="#22c55e" /> : <EyeOff size={12} color="#666" />}
                </div>
              </button>
            </div>

            {/* Auto Play Next Toggle */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.875rem 1rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
              }}
            >
              <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
                Tự động phát tiếp
              </span>
              <button
                onClick={toggleAutoPlayNext}
                style={{
                  width: '50px',
                  height: '28px',
                  borderRadius: '14px',
                  border: 'none',
                  background: settings.autoPlayNext
                    ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                    : 'rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '3px',
                    left: settings.autoPlayNext ? 'calc(100% - 25px)' : '3px',
                    width: '22px',
                    height: '22px',
                    background: 'white',
                    borderRadius: '50%',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {settings.autoPlayNext ? <Eye size={12} color="#22c55e" /> : <EyeOff size={12} color="#666" />}
                </div>
              </button>
            </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0 1.25rem 1.25rem' }}>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '1rem',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
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

  // Use portal to render modal at document.body level
  return createPortal(modalContent, document.body);
}

// Trigger button component
export function ListeningSettingsButton({ onClick }: { onClick: () => void }) {
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
