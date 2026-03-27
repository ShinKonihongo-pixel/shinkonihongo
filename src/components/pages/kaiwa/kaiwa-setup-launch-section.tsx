// Launch section (slow mode toggle + start CTA) for kaiwa setup view
// Shown for default and advanced modes

import { Mic, Volume2, Zap, Play } from 'lucide-react';

interface KaiwaSetupLaunchSectionProps {
  slowMode: boolean;
  sessionMode: string;
  selectedAdvancedTopic: any;
  selectedDefaultQuestion: any;
  settings: any;
  recognitionSupported: boolean;
  setSlowMode: (slow: boolean) => void;
  handleStart: () => void;
}

export function KaiwaSetupLaunchSection({
  slowMode,
  sessionMode,
  selectedAdvancedTopic,
  selectedDefaultQuestion,
  settings,
  recognitionSupported,
  setSlowMode,
  handleStart,
}: KaiwaSetupLaunchSectionProps) {
  return (
    <>
      <div className="kaiwa-section-header">
        <div className="kaiwa-section-line" />
        <span className="kaiwa-section-label">
          <span className="kaiwa-step-badge">3</span>
          Bắt đầu
        </span>
        <div className="kaiwa-section-line" />
      </div>
      <div className="kaiwa-launch-section">
        <div className="kaiwa-options-bar">
          <button
            className={`kaiwa-toggle-option ${slowMode ? 'active' : ''}`}
            onClick={() => setSlowMode(!slowMode)}
          >
            <Volume2 size={15} />
            <span>Chế độ chậm</span>
            <div className={`kaiwa-toggle-switch ${slowMode ? 'on' : ''}`}>
              <div className="kaiwa-toggle-thumb" />
            </div>
          </button>
          <div className="kaiwa-voice-badge">
            <Mic size={13} />
            {settings.kaiwaVoiceGender === 'female' ? 'Nữ' : 'Nam'}
          </div>
        </div>

        {!recognitionSupported && (
          <div className="kaiwa-warning">
            <Zap size={16} />
            <span>Trình duyệt không hỗ trợ nhận dạng giọng nói. Vui lòng dùng Chrome.</span>
          </div>
        )}

        <button
          className="kaiwa-cta-btn"
          onClick={handleStart}
          disabled={sessionMode === 'advanced' && !selectedAdvancedTopic}
        >
          <span className="kaiwa-cta-shimmer" />
          <Play size={20} />
          <span>
            {sessionMode === 'advanced' && selectedAdvancedTopic
              ? `Bắt đầu: ${selectedAdvancedTopic.name}`
              : selectedDefaultQuestion
                ? 'Bắt đầu với câu hỏi đã chọn'
                : 'Bắt đầu hội thoại'}
          </span>
        </button>
      </div>
    </>
  );
}
