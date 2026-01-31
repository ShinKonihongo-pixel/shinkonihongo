// Listening Settings Modal - Premium modal for listening practice settings

import { Settings, Minus, Plus, Eye, EyeOff, X, Sparkles, Headphones, Volume2, Repeat } from 'lucide-react';
import { useListeningSettings } from '../../contexts/listening-settings-context';

interface ListeningSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ListeningSettingsModal({ isOpen, onClose }: ListeningSettingsModalProps) {
  const {
    settings,
    increasePlaybackSpeed,
    decreasePlaybackSpeed,
    increaseRepeatCount,
    decreaseRepeatCount,
    increaseDelay,
    decreaseDelay,
    toggleAutoPlayNext,
    toggleShowVocabulary,
    toggleShowMeaning,
    toggleShowKanji,
  } = useListeningSettings();

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
              Cài đặt nghe
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
          {/* Playback Speed */}
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
                <Volume2 size={22} color="white" />
              </div>
              <div>
                <div style={{ color: 'white', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.2rem' }}>
                  Tốc độ phát
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>
                  Điều chỉnh tốc độ âm thanh
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={decreasePlaybackSpeed}
                disabled={settings.defaultPlaybackSpeed <= 0.5}
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '10px',
                  color: settings.defaultPlaybackSpeed <= 0.5 ? 'rgba(255, 255, 255, 0.3)' : '#3b82f6',
                  cursor: settings.defaultPlaybackSpeed <= 0.5 ? 'not-allowed' : 'pointer',
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
                {settings.defaultPlaybackSpeed}x
              </span>
              <button
                onClick={increasePlaybackSpeed}
                disabled={settings.defaultPlaybackSpeed >= 2}
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '10px',
                  color: settings.defaultPlaybackSpeed >= 2 ? 'rgba(255, 255, 255, 0.3)' : '#3b82f6',
                  cursor: settings.defaultPlaybackSpeed >= 2 ? 'not-allowed' : 'pointer',
                }}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Repeat Count */}
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
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                  borderRadius: '12px',
                }}
              >
                <Repeat size={22} color="white" />
              </div>
              <div>
                <div style={{ color: 'white', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.2rem' }}>
                  Số lần lặp
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>
                  Lặp lại mỗi từ
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={decreaseRepeatCount}
                disabled={settings.defaultRepeatCount <= 1}
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '10px',
                  color: settings.defaultRepeatCount <= 1 ? 'rgba(255, 255, 255, 0.3)' : '#8b5cf6',
                  cursor: settings.defaultRepeatCount <= 1 ? 'not-allowed' : 'pointer',
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
                  color: '#8b5cf6',
                }}
              >
                {settings.defaultRepeatCount} lần
              </span>
              <button
                onClick={increaseRepeatCount}
                disabled={settings.defaultRepeatCount >= 10}
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '10px',
                  color: settings.defaultRepeatCount >= 10 ? 'rgba(255, 255, 255, 0.3)' : '#8b5cf6',
                  cursor: settings.defaultRepeatCount >= 10 ? 'not-allowed' : 'pointer',
                }}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Delay Between Words */}
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
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  borderRadius: '12px',
                  fontSize: '1rem',
                }}
              >
                ⏱️
              </div>
              <div>
                <div style={{ color: 'white', fontSize: '0.95rem', fontWeight: 500, marginBottom: '0.2rem' }}>
                  Khoảng cách
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>
                  Giữa các từ
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={decreaseDelay}
                disabled={settings.delayBetweenWords <= 0.5}
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '10px',
                  color: settings.delayBetweenWords <= 0.5 ? 'rgba(255, 255, 255, 0.3)' : '#f59e0b',
                  cursor: settings.delayBetweenWords <= 0.5 ? 'not-allowed' : 'pointer',
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
                {settings.delayBetweenWords}s
              </span>
              <button
                onClick={increaseDelay}
                disabled={settings.delayBetweenWords >= 10}
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '10px',
                  color: settings.delayBetweenWords >= 10 ? 'rgba(255, 255, 255, 0.3)' : '#f59e0b',
                  cursor: settings.delayBetweenWords >= 10 ? 'not-allowed' : 'pointer',
                }}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Display Toggles */}
          <div style={{ marginTop: '1rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
              }}
            >
              <Sparkles size={14} color="#8b5cf6" />
              <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Hiển thị
              </span>
            </div>

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
}

// Trigger button component
export function ListeningSettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Cài đặt nghe"
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
