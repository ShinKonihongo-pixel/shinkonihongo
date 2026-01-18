// Milestone Question Component - Special bonus question UI
// Shows golden border and badge for milestone questions with bonus rewards

import type { RacingQuestion } from '../../../types/racing-game';

// Milestone badge displayed on milestone questions
export function MilestoneBadge() {
  return (
    <div className="milestone-badge">
      <span className="badge-icon">🏆</span>
      <span className="badge-text">CỘT MỐC</span>
    </div>
  );
}

interface MilestoneRewardPreviewProps {
  speedBonus: number;
}

// Preview of potential rewards for milestone question
export function MilestoneRewardPreview({ speedBonus }: MilestoneRewardPreviewProps) {
  return (
    <div className="milestone-reward-preview">
      <div className="reward-header">
        <span className="reward-icon">🎁</span>
        <span className="reward-title">Phần Thưởng Tiềm Năng</span>
      </div>
      <div className="reward-items">
        <div className="reward-item">
          <span className="item-icon">⚡</span>
          <span className="item-text">+{speedBonus} km/h (x2 bonus)</span>
        </div>
        <div className="reward-item">
          <span className="item-icon">🎒</span>
          <span className="item-text">+1 item ngẫu nhiên</span>
        </div>
        <div className="reward-item">
          <span className="item-icon">💎</span>
          <span className="item-text">+50 điểm bonus</span>
        </div>
      </div>
    </div>
  );
}

interface MilestoneQuestionOverlayProps {
  questionNumber: number;
  onContinue: () => void;
}

// Overlay shown before milestone question starts
export function MilestoneQuestionOverlay({ questionNumber, onContinue }: MilestoneQuestionOverlayProps) {
  return (
    <div className="milestone-overlay">
      <div className="milestone-overlay-content">
        <div className="milestone-sparkles">✨</div>
        <div className="milestone-icon">🏆</div>
        <h2 className="milestone-title">Câu Hỏi Cột Mốc!</h2>
        <p className="milestone-subtitle">Câu {questionNumber}</p>
        <p className="milestone-desc">
          Trả lời đúng để nhận phần thưởng đặc biệt!
        </p>
        <div className="milestone-rewards-summary">
          <span>⚡ Tốc độ x2</span>
          <span>🎒 Item bonus</span>
          <span>💎 +50 điểm</span>
        </div>
        <button className="milestone-continue-btn" onClick={onContinue}>
          Sẵn Sàng!
        </button>
      </div>
    </div>
  );
}

interface MilestoneSuccessProps {
  speedGained: number;
  itemReceived?: string;
  bonusPoints: number;
  onDismiss: () => void;
}

// Success animation shown when milestone completed correctly
export function MilestoneSuccess({
  speedGained,
  itemReceived,
  bonusPoints,
  onDismiss,
}: MilestoneSuccessProps) {
  return (
    <div className="milestone-success-overlay">
      <div className="milestone-success-content">
        <div className="success-confetti">🎊</div>
        <div className="success-icon">🏆</div>
        <h2 className="success-title">Hoàn Thành Cột Mốc!</h2>

        <div className="success-rewards">
          <div className="success-reward-item">
            <span className="reward-icon">⚡</span>
            <span className="reward-value">+{speedGained} km/h</span>
          </div>
          {itemReceived && (
            <div className="success-reward-item">
              <span className="reward-icon">🎒</span>
              <span className="reward-value">Nhận {itemReceived}</span>
            </div>
          )}
          <div className="success-reward-item">
            <span className="reward-icon">💎</span>
            <span className="reward-value">+{bonusPoints} điểm</span>
          </div>
        </div>

        <button className="success-dismiss-btn" onClick={onDismiss}>
          Tiếp Tục
        </button>
      </div>
    </div>
  );
}

interface MilestoneQuestionWrapperProps {
  question: RacingQuestion;
  children: React.ReactNode;
}

// Wrapper component to add milestone styling to question
export function MilestoneQuestionWrapper({
  question,
  children,
}: MilestoneQuestionWrapperProps) {
  if (!question.isMilestone) {
    return <>{children}</>;
  }

  return (
    <div className="milestone-question-wrapper">
      <MilestoneBadge />
      <MilestoneRewardPreview speedBonus={question.speedBonus} />
      {children}
    </div>
  );
}
