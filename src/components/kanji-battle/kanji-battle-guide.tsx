// Kanji Battle Guide - How to play instructions
import React from 'react';
import { KANJI_BATTLE_SKILLS } from '../../types/kanji-battle';

interface KanjiBattleGuideProps {
  onClose: () => void;
}

export const KanjiBattleGuide: React.FC<KanjiBattleGuideProps> = ({ onClose }) => {
  const skills = Object.values(KANJI_BATTLE_SKILLS);

  return (
    <div className="speed-quiz-guide">
      <div className="guide-header">
        <h1>📖 Hướng Dẫn Chơi</h1>
        <button className="speed-quiz-close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="guide-content">
        <section className="guide-section">
          <h2>⚔️ Đại Chiến Kanji là gì?</h2>
          <p>
            Đây là game thi đấu kanji với 2 chế độ: <strong>Đọc Kanji</strong> (gõ nghĩa/cách đọc)
            và <strong>Viết Kanji</strong> (vẽ kanji theo thứ tự nét). Thi đấu solo hoặc multiplayer!
          </p>
        </section>

        <section className="guide-section">
          <h2>📖 Chế Độ Đọc Kanji</h2>
          <div className="steps">
            <div className="step">
              <span className="step-number">1</span>
              <div className="step-content">
                <strong>Kanji hiện lên</strong>
                <p>Một chữ kanji sẽ hiện lớn trên màn hình</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <div className="step-content">
                <strong>Gõ đáp án</strong>
                <p>Gõ nghĩa tiếng Việt, Hán Việt, On'yomi hoặc Kun'yomi</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <div className="step-content">
                <strong>Gửi câu trả lời</strong>
                <p>Nhấn Enter hoặc nút "Gửi" để xác nhận</p>
              </div>
            </div>
          </div>
        </section>

        <section className="guide-section">
          <h2>✍️ Chế Độ Viết Kanji</h2>
          <div className="steps">
            <div className="step">
              <span className="step-number">1</span>
              <div className="step-content">
                <strong>Kanji hiện lên</strong>
                <p>Xem kanji cần viết và các nét mờ gợi ý</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <div className="step-content">
                <strong>Vẽ từng nét</strong>
                <p>Dùng chuột/ngón tay vẽ từng nét theo đúng thứ tự</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <div className="step-content">
                <strong>Được chấm điểm</strong>
                <p>Mỗi nét được chấm điểm chính xác. Xanh = đúng, Đỏ = sai</p>
              </div>
            </div>
          </div>
        </section>

        <section className="guide-section">
          <h2>📊 Tính Điểm</h2>
          <div className="scoring-rules">
            <div className="rule correct">
              <span className="icon">✅</span>
              <div className="rule-text">
                <strong>Đọc đúng: +100 điểm | Viết: điểm × % chính xác</strong>
                <p>Trả lời nhanh nhất có thể!</p>
              </div>
            </div>
            <div className="rule wrong">
              <span className="icon">❌</span>
              <div className="rule-text">
                <strong>Sai: -30 điểm</strong>
                <p>Cẩn thận khi trả lời!</p>
              </div>
            </div>
            <div className="rule timeout">
              <span className="icon">⏱️</span>
              <div className="rule-text">
                <strong>Hết giờ: 0 điểm</strong>
                <p>Không được cộng hay trừ điểm</p>
              </div>
            </div>
          </div>
        </section>

        <section className="guide-section">
          <h2>✨ Kỹ Năng Đặc Biệt</h2>
          <p>Sau mỗi <strong>5 câu hỏi</strong>, tất cả người chơi được chọn một kỹ năng đặc biệt:</p>
          <div className="skills-list">
            {skills.map(skill => (
              <div key={skill.type} className="skill-item">
                <span className="skill-emoji">{skill.emoji}</span>
                <div className="skill-info">
                  <strong>{skill.name}</strong>
                  <p>{skill.description}</p>
                  {skill.targetOther && <span className="target-badge">🎯 Nhắm vào đối thủ</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="guide-footer">
        <button className="speed-quiz-btn primary large" onClick={onClose}>
          Đã hiểu! Bắt đầu chơi thôi! 🚀
        </button>
      </div>
    </div>
  );
};
