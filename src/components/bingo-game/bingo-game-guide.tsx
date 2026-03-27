// Bingo Game Guide - Instructions and rules

import { ModalShell } from '../ui/modal-shell';

interface BingoGameGuideProps {
  onClose: () => void;
}

export function BingoGameGuide({ onClose }: BingoGameGuideProps) {
  return (
    <ModalShell isOpen={true} onClose={onClose} title="📖 Hướng Dẫn Chơi Bingo" maxWidth={560}>
      <div className="guide-content">
        {/* Basic rules */}
        <section className="guide-section">
          <h3>🎯 Cấu Trúc Trò Chơi</h3>
          <ul>
            <li>Mỗi người chơi có <strong>6 dãy số</strong></li>
            <li>Mỗi dãy gồm <strong>5 số</strong> từ 01 đến 99</li>
            <li>Các số trong thẻ của bạn là <strong>duy nhất</strong></li>
          </ul>
        </section>

        {/* Gameplay */}
        <section className="guide-section">
          <h3>🎮 Cách Chơi</h3>
          <div className="step-list">
            <div className="step">
              <span className="step-number">1</span>
              <span className="step-text">
                Nhấn nút <strong>"Bốc Số"</strong> để rút một số ngẫu nhiên từ 01-99
              </span>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <span className="step-text">
                Nếu số đó trùng với số trong thẻ của bạn, số sẽ được <strong>tự động đánh dấu</strong>
              </span>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <span className="step-text">
                Khi có <strong>5 số trong một dãy</strong> được đánh dấu, nút <strong>BINGO</strong> sẽ hiện
              </span>
            </div>
            <div className="step">
              <span className="step-number">4</span>
              <span className="step-text">
                Người <strong>nhấn BINGO trước</strong> sẽ chiến thắng!
              </span>
            </div>
          </div>
        </section>

        {/* Special skills */}
        <section className="guide-section">
          <h3>✨ Kỹ Năng Đặc Biệt</h3>
          <p className="skill-intro">Sau mỗi <strong>5 lượt</strong>, bạn có thể chọn 1 kỹ năng:</p>

          <div className="skills-list">
            <div className="skill-item">
              <span className="skill-icon">🗑️</span>
              <div className="skill-info">
                <strong>Xóa Dấu</strong>
                <span>Xóa một số đã trúng của đối thủ</span>
              </div>
            </div>

            <div className="skill-item">
              <span className="skill-icon">✨</span>
              <div className="skill-info">
                <strong>Thêm Số</strong>
                <span>Tự động đánh dấu một số trong thẻ của bạn</span>
              </div>
            </div>

            <div className="skill-item">
              <span className="skill-icon">🍀</span>
              <div className="skill-info">
                <strong>May Mắn</strong>
                <span>Tăng 30% tỉ lệ trúng số trong 3 lượt sau</span>
              </div>
            </div>

            <div className="skill-item">
              <span className="skill-icon">🚫</span>
              <div className="skill-info">
                <strong>Chặn Lượt</strong>
                <span>Đối thủ không thể bốc số trong lượt kế tiếp</span>
              </div>
            </div>

            <div className="skill-item">
              <span className="skill-icon">🎲</span>
              <div className="skill-info">
                <strong>50/50</strong>
                <span>Lưu lại để dùng trong câu hỏi đặc biệt</span>
              </div>
            </div>
          </div>
        </section>

        {/* Tips */}
        <section className="guide-section tips">
          <h3>💡 Mẹo Chơi</h3>
          <ul>
            <li>Theo dõi số đã bốc để biết còn bao nhiêu số chưa ra</li>
            <li>Quan sát đối thủ - nếu họ sắp BINGO, hãy dùng kỹ năng!</li>
            <li>Kỹ năng "Chặn Lượt" hiệu quả khi đối thủ sắp hoàn thành</li>
          </ul>
        </section>
      </div>

      <div className="guide-footer">
        <button className="understand-btn" onClick={onClose}>
          Đã Hiểu!
        </button>
      </div>
    </ModalShell>
  );
}
