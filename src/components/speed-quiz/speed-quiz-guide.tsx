// Speed Quiz Guide - How to play instructions
import React from 'react';
import { SPEED_QUIZ_SKILLS } from '../../types/speed-quiz';

interface SpeedQuizGuideProps {
  onClose: () => void;
}

export const SpeedQuizGuide: React.FC<SpeedQuizGuideProps> = ({ onClose }) => {
  const skills = Object.values(SPEED_QUIZ_SKILLS);

  return (
    <div className="speed-quiz-guide">
      <div className="guide-header">
        <h1>📖 Hướng Dẫn Chơi</h1>
        <button className="speed-quiz-close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="guide-content">
        <section className="guide-section">
          <h2>⚡ Ai Nhanh Hơn Ai là gì?</h2>
          <p>
            Đây là game đố vui về từ vựng tiếng Nhật. Mỗi câu hỏi sẽ hiện một chữ
            (kanji, từ vựng, hoặc ngữ pháp), và bạn phải gõ đáp án đúng càng nhanh
            càng tốt!
          </p>
        </section>

        <section className="guide-section">
          <h2>🎮 Cách Chơi</h2>
          <div className="steps">
            <div className="step">
              <span className="step-number">1</span>
              <div className="step-content">
                <strong>Tạo hoặc vào phòng</strong>
                <p>Chọn "Tạo Phòng" hoặc nhập mã phòng để tham gia</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <div className="step-content">
                <strong>Đọc câu hỏi</strong>
                <p>Khi bắt đầu, một chữ sẽ hiện trên màn hình</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <div className="step-content">
                <strong>Gõ đáp án</strong>
                <p>Gõ nghĩa hoặc cách đọc của chữ đó vào ô trả lời</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">4</span>
              <div className="step-content">
                <strong>Gửi câu trả lời</strong>
                <p>Nhấn Enter hoặc nút "Gửi" để xác nhận</p>
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
                <strong>Trả lời đúng: +100 điểm</strong>
                <p>Trả lời nhanh nhất có thể!</p>
              </div>
            </div>
            <div className="rule wrong">
              <span className="icon">❌</span>
              <div className="rule-text">
                <strong>Trả lời sai: -30 điểm</strong>
                <p>Cẩn thận khi trả lời nhé!</p>
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
          <h2>💡 Gợi Ý</h2>
          <p>
            Mỗi người chơi có <strong>3 lượt gợi ý</strong> trong suốt game.
            Mỗi lần dùng sẽ hiện thêm thông tin giúp bạn đoán đáp án:
          </p>
          <ul>
            <li>Gợi ý 1: Chữ cái đầu tiên</li>
            <li>Gợi ý 2: Độ dài của đáp án</li>
            <li>Gợi ý 3: Nửa đầu của đáp án</li>
          </ul>
          <p className="hint-warning">
            ⚠️ Sử dụng gợi ý một cách khôn ngoan! Khi hết là không có thêm đâu!
          </p>
        </section>

        <section className="guide-section">
          <h2>✨ Kỹ Năng Đặc Biệt</h2>
          <p>
            Sau mỗi <strong>5 câu hỏi</strong>, tất cả người chơi được chọn
            một kỹ năng đặc biệt:
          </p>
          <div className="skills-list">
            {skills.map((skill) => (
              <div key={skill.type} className="skill-item">
                <span className="skill-emoji">{skill.emoji}</span>
                <div className="skill-info">
                  <strong>{skill.name}</strong>
                  <p>{skill.description}</p>
                  {skill.targetOther && (
                    <span className="target-badge">🎯 Nhắm vào đối thủ</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="guide-section">
          <h2>🏆 Chiến Thắng</h2>
          <p>
            Sau khi hoàn thành tất cả câu hỏi, người có <strong>điểm cao nhất</strong>
            sẽ là người chiến thắng!
          </p>
          <div className="tips">
            <h3>💪 Mẹo để thắng:</h3>
            <ul>
              <li>Luyện tập từ vựng thường xuyên</li>
              <li>Gõ nhanh và chính xác</li>
              <li>Dùng gợi ý khi thực sự cần thiết</li>
              <li>Chọn kỹ năng phù hợp với chiến thuật</li>
              <li>Giữ bình tĩnh, đừng vội vàng gõ sai!</li>
            </ul>
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
