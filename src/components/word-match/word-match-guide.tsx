// Word Match Guide - How to play instructions
import React from 'react';
import { WORD_MATCH_EFFECTS } from '../../types/word-match';

interface WordMatchGuideProps {
  onClose: () => void;
}

export const WordMatchGuide: React.FC<WordMatchGuideProps> = ({ onClose }) => {
  const effects = Object.values(WORD_MATCH_EFFECTS);

  return (
    <div className="word-match-guide">
      <div className="guide-header">
        <h1>📖 Hướng Dẫn Chơi</h1>
        <button className="word-match-close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="guide-content">
        <section className="guide-section">
          <h2>🔗 Nối Từ Thách Đấu là gì?</h2>
          <p>
            Đây là game nối cặp từ tiếng Nhật - Việt. Mỗi câu có 5 cặp từ,
            bạn cần nối đúng từ tiếng Nhật với nghĩa tiếng Việt của nó.
            Người nối đúng và nhanh nhất sẽ chiến thắng!
          </p>
        </section>

        <section className="guide-section">
          <h2>🎮 Cách Chơi</h2>
          <div className="steps">
            <div className="step">
              <span className="step-number">1</span>
              <div className="step-content">
                <strong>Chọn từ bên trái</strong>
                <p>Nhấn vào từ tiếng Nhật bạn muốn nối</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <div className="step-content">
                <strong>Chọn nghĩa bên phải</strong>
                <p>Nhấn vào nghĩa tiếng Việt tương ứng</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <div className="step-content">
                <strong>Nối đủ 5 cặp</strong>
                <p>Lặp lại cho đến khi nối xong 5 cặp</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">4</span>
              <div className="step-content">
                <strong>Gửi đáp án</strong>
                <p>Nhấn "Gửi Đáp Án" để hoàn thành</p>
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
                <strong>Mỗi cặp đúng: +20 điểm</strong>
                <p>Nối đúng từ với nghĩa</p>
              </div>
            </div>
            <div className="rule bonus">
              <span className="icon">🎉</span>
              <div className="rule-text">
                <strong>Hoàn hảo 5/5: +50 điểm bonus</strong>
                <p>Thưởng thêm khi nối đúng tất cả!</p>
              </div>
            </div>
          </div>
        </section>

        <section className="guide-section">
          <h2>⭐ Câu Đặc Biệt</h2>
          <p>
            Mỗi <strong>5 câu</strong> sẽ là câu đặc biệt. Nếu bạn nối đúng
            tất cả 5 cặp và nhanh nhất, bạn sẽ được quay <strong>Vòng Quay May Mắn</strong>!
          </p>
        </section>

        <section className="guide-section">
          <h2>🎡 Vòng Quay May Mắn</h2>
          <p>Khi thắng câu đặc biệt, bạn được chọn 1 trong 3 hiệu ứng:</p>
          <div className="effects-list">
            {effects.map((effect) => (
              <div key={effect.type} className="effect-item">
                <span className="effect-emoji">{effect.emoji}</span>
                <div className="effect-info">
                  <strong>{effect.name}</strong>
                  <p>{effect.description}</p>
                  {effect.targetOther && (
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
              <li>Học thuộc từ vựng trước khi chơi</li>
              <li>Nối nhanh nhưng chính xác</li>
              <li>Cố gắng đạt 5/5 ở câu đặc biệt</li>
              <li>Sử dụng hiệu ứng một cách chiến thuật</li>
              <li>Dùng Lá Chắn khi sắp bị tấn công!</li>
            </ul>
          </div>
        </section>
      </div>

      <div className="guide-footer">
        <button className="word-match-btn primary large" onClick={onClose}>
          Đã hiểu! Bắt đầu chơi thôi! 🚀
        </button>
      </div>
    </div>
  );
};
