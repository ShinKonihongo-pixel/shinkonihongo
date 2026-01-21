// Kaiwa Conversation Header - Top controls during active conversation
// Displays stats, mode toggles, and action buttons

import {
  MessagesSquare,
  Clock,
  Bookmark,
  RefreshCw,
  Zap,
  Gauge,
  Award,
} from 'lucide-react';
import type { JLPTLevel, ConversationStyle, ConversationTopic, KaiwaRole, KaiwaSendMode } from '../../types/kaiwa';
import type { KaiwaAdvancedTopic } from '../../types/kaiwa-advanced';
import { getStyleDisplay, CONVERSATION_TOPICS } from '../../constants/kaiwa';

interface ConversationStats {
  exchanges: number;
  duration: number;
}

interface KaiwaConversationHeaderProps {
  level: JLPTLevel;
  style: ConversationStyle;
  topic: ConversationTopic;
  selectedAdvancedTopic: KaiwaAdvancedTopic | null;
  userRoleInfo: KaiwaRole | null;
  stats: ConversationStats;
  savedCount: number;
  showSavedPanel: boolean;
  slowMode: boolean;
  showFurigana: boolean;
  fontSize: number;
  sendMode: KaiwaSendMode;
  isLoading: boolean;
  isEvaluating: boolean;
  canEvaluate: boolean;

  // Handlers
  onToggleSavedPanel: () => void;
  onToggleSlowMode: () => void;
  onToggleFurigana: () => void;
  onFontSizeChange: (size: number) => void;
  onRestart: () => void;
  onEvaluate: () => void;
  onEnd: () => void;
}

export function KaiwaConversationHeader({
  level,
  style,
  topic,
  selectedAdvancedTopic,
  userRoleInfo,
  stats,
  savedCount,
  showSavedPanel,
  slowMode,
  showFurigana,
  fontSize,
  sendMode,
  isLoading,
  isEvaluating,
  canEvaluate,
  onToggleSavedPanel,
  onToggleSlowMode,
  onToggleFurigana,
  onFontSizeChange,
  onRestart,
  onEvaluate,
  onEnd,
}: KaiwaConversationHeaderProps) {
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
          ) : (
            <span className="kaiwa-badge topic">{currentTopic?.icon} {currentTopic?.label.split(' ')[0]}</span>
          )}
          {userRoleInfo && (
            <span className="kaiwa-badge role">
              {userRoleInfo.emoji} {userRoleInfo.nameVi}
            </span>
          )}
        </div>
      </div>

      <div className="kaiwa-header-center">
        <div className="kaiwa-stats">
          <span className="kaiwa-stat" title="Số lượt trao đổi">
            <MessagesSquare size={14} /> {stats.exchanges}
          </span>
          <span className="kaiwa-stat" title="Thời gian">
            <Clock size={14} /> {stats.duration}m
          </span>
          {savedCount > 0 && (
            <button
              className={`kaiwa-stat saved ${showSavedPanel ? 'active' : ''}`}
              onClick={onToggleSavedPanel}
              title="Xem câu đã lưu"
            >
              <Bookmark size={14} /> {savedCount}
            </button>
          )}
        </div>
      </div>

      <div className="kaiwa-header-right">
        <button
          className="kaiwa-restart-btn"
          onClick={onRestart}
          disabled={isLoading}
          title="Bắt đầu lại từ đầu"
        >
          <RefreshCw size={14} /> Lại từ đầu
        </button>

        <button
          className={`kaiwa-send-mode-btn ${sendMode === 'auto' ? 'active' : ''}`}
          title={sendMode === 'auto' ? 'Chế độ tự động gửi' : 'Chế độ gửi thủ công'}
        >
          <Zap size={14} /> {sendMode === 'auto' ? 'Auto' : 'Manual'}
        </button>

        <button
          className={`kaiwa-slow-btn ${slowMode ? 'active' : ''}`}
          onClick={onToggleSlowMode}
          title={slowMode ? 'Tắt chế độ chậm' : 'Bật chế độ chậm'}
        >
          <Gauge size={14} /> {slowMode ? 'Chậm' : 'Thường'}
        </button>

        <button
          className={`kaiwa-furigana-btn ${showFurigana ? 'active' : ''}`}
          onClick={onToggleFurigana}
          title={showFurigana ? 'Ẩn furigana' : 'Hiện furigana'}
        >
          あ {showFurigana ? 'ON' : 'OFF'}
        </button>

        <div className="kaiwa-fontsize-control">
          <button
            className="kaiwa-fontsize-btn"
            onClick={() => onFontSizeChange(Math.max(12, fontSize - 2))}
            title="Giảm cỡ chữ"
          >
            A-
          </button>
          <span className="kaiwa-fontsize-value">{fontSize}</span>
          <button
            className="kaiwa-fontsize-btn"
            onClick={() => onFontSizeChange(Math.min(28, fontSize + 2))}
            title="Tăng cỡ chữ"
          >
            A+
          </button>
        </div>

        {canEvaluate && (
          <button
            className="kaiwa-eval-btn"
            onClick={onEvaluate}
            disabled={isLoading || isEvaluating}
            title="Đánh giá và kết thúc"
          >
            <Award size={14} /> Đánh giá
          </button>
        )}

        <button className="btn btn-danger btn-small kaiwa-end-btn" onClick={onEnd}>
          Kết thúc
        </button>
      </div>
    </div>
  );
}
