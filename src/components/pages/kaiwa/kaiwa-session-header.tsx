// Session header bar for kaiwa-session-view

import type { JLPTLevel, ConversationStyle, ConversationTopic } from '../../../types/kaiwa';
import type { KaiwaRole } from '../../../types/kaiwa';
import type { KaiwaAdvancedTopic } from '../../../types/kaiwa-advanced';
import type { CustomTopic } from '../../../types/custom-topic';
import type { AppSettings } from '../../../hooks/use-settings';
import type { SessionMode } from './kaiwa-page-types';
import { CONVERSATION_TOPICS, getStyleDisplay } from '../../../constants/kaiwa';
import {
  MessagesSquare,
  Clock,
  Bookmark,
  RefreshCw,
  Gauge,
  Award,
  Zap,
} from 'lucide-react';

interface KaiwaSessionHeaderProps {
  messages: any[];
  level: JLPTLevel;
  style: ConversationStyle;
  topic: ConversationTopic;
  conversationStats: { exchanges: number; duration: number };
  savedSentences: string[];
  showSavedPanel: boolean;
  slowMode: boolean;
  showFurigana: boolean;
  fontSize: number;
  isAiLoading: boolean;
  isEvaluating: boolean;
  selectedAdvancedTopic: KaiwaAdvancedTopic | null;
  selectedCustomTopic: CustomTopic | null;
  sessionMode: SessionMode;
  settings: AppSettings;
  getUserRoleInfo: () => KaiwaRole | null;
  setShowSavedPanel: (show: boolean) => void;
  setSlowMode: (slow: boolean) => void;
  setShowFurigana: (show: boolean) => void;
  setFontSize: (size: number) => void;
  handleStart: () => void;
  handleEnd: (skipEvaluation?: boolean) => void;
}

export function KaiwaSessionHeader({
  messages,
  level,
  style,
  topic,
  conversationStats,
  savedSentences,
  showSavedPanel,
  slowMode,
  showFurigana,
  fontSize,
  isAiLoading,
  isEvaluating,
  selectedAdvancedTopic,
  selectedCustomTopic,
  settings,
  getUserRoleInfo,
  setShowSavedPanel,
  setSlowMode,
  setShowFurigana,
  setFontSize,
  handleStart,
  handleEnd,
}: KaiwaSessionHeaderProps) {
  const currentTopic = CONVERSATION_TOPICS.find(t => t.value === topic);

  return (
    <div className="kaiwa-header">
      <div className="kaiwa-header-left">
        <h2>会話練習</h2>
        <div className="kaiwa-info">
          <span className="kaiwa-badge">{level}</span>
          <span className="kaiwa-badge">{getStyleDisplay(style)}</span>
          {selectedAdvancedTopic ? (
            <span className="kaiwa-badge topic advanced" style={{ borderColor: selectedAdvancedTopic.color }}>
              {selectedAdvancedTopic.icon} {selectedAdvancedTopic.name}
            </span>
          ) : selectedCustomTopic ? (
            <span className="kaiwa-badge topic custom" style={{ borderColor: selectedCustomTopic.color }}>
              {selectedCustomTopic.icon} {selectedCustomTopic.name}
            </span>
          ) : (
            <span className="kaiwa-badge topic">{currentTopic?.icon} {currentTopic?.label.split(' ')[0]}</span>
          )}
          {getUserRoleInfo() && (
            <span className="kaiwa-badge role">
              {getUserRoleInfo()?.emoji} {getUserRoleInfo()?.nameVi}
            </span>
          )}
        </div>
      </div>
      <div className="kaiwa-header-center">
        <div className="kaiwa-stats">
          <span className="kaiwa-stat" title="Số lượt trao đổi"><MessagesSquare size={14} /> {conversationStats.exchanges}</span>
          <span className="kaiwa-stat" title="Thời gian"><Clock size={14} /> {conversationStats.duration}m</span>
          {savedSentences.length > 0 && (
            <button
              className={`kaiwa-stat saved ${showSavedPanel ? 'active' : ''}`}
              onClick={() => setShowSavedPanel(!showSavedPanel)}
              title="Xem câu đã lưu"
            >
              <Bookmark size={14} /> {savedSentences.length}
            </button>
          )}
        </div>
      </div>
      <div className="kaiwa-header-right">
        <button
          className="kaiwa-restart-btn"
          onClick={() => handleStart()}
          disabled={isAiLoading}
          title="Bắt đầu lại từ đầu"
        >
          <RefreshCw size={14} /> Lại từ đầu
        </button>
        <button
          className={`kaiwa-send-mode-btn ${settings.kaiwaSendMode === 'auto' ? 'active' : ''}`}
          onClick={() => {
            // Toggle send mode (only in settings page, but show status here)
          }}
          title={settings.kaiwaSendMode === 'auto' ? 'Chế độ tự động gửi' : 'Chế độ gửi thủ công'}
        >
          <Zap size={14} /> {settings.kaiwaSendMode === 'auto' ? 'Auto' : 'Manual'}
        </button>
        <button
          className={`kaiwa-slow-btn ${slowMode ? 'active' : ''}`}
          onClick={() => setSlowMode(!slowMode)}
          title={slowMode ? 'Tắt chế độ chậm' : 'Bật chế độ chậm'}
        >
          <Gauge size={14} /> {slowMode ? 'Chậm' : 'Thường'}
        </button>
        <button
          className={`kaiwa-furigana-btn ${showFurigana ? 'active' : ''}`}
          onClick={() => setShowFurigana(!showFurigana)}
          title={showFurigana ? 'Ẩn furigana' : 'Hiện furigana'}
        >
          あ {showFurigana ? 'ON' : 'OFF'}
        </button>
        <div className="kaiwa-fontsize-control">
          <button
            className="kaiwa-fontsize-btn"
            onClick={() => setFontSize(Math.max(12, fontSize - 2))}
            title="Giảm cỡ chữ"
          >
            A-
          </button>
          <span className="kaiwa-fontsize-value">{fontSize}</span>
          <button
            className="kaiwa-fontsize-btn"
            onClick={() => setFontSize(Math.min(28, fontSize + 2))}
            title="Tăng cỡ chữ"
          >
            A+
          </button>
        </div>
        {messages.length >= 4 && (
          <button
            className="kaiwa-eval-btn"
            onClick={() => handleEnd(false)}
            disabled={isAiLoading || isEvaluating}
            title="Đánh giá và kết thúc"
          >
            <Award size={14} /> Đánh giá
          </button>
        )}
        <button className="btn btn-danger btn-small kaiwa-end-btn" onClick={() => handleEnd(true)}>
          Kết thúc
        </button>
      </div>
    </div>
  );
}
