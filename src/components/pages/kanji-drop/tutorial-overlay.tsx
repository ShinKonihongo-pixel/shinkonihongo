// Kanji Drop tutorial overlay — first-time instructions

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const TUTORIAL_KEY = 'kanji-drop-tutorial-seen';

export function TutorialOverlay({ onDismiss }: { onDismiss: () => void }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(TUTORIAL_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!seen) setShow(true);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(TUTORIAL_KEY, 'true');
    setShow(false);
    onDismiss();
  };

  if (!show) return null;

  return (
    <div className="kd-tutorial-overlay" onClick={handleDismiss}>
      <div className="kd-tutorial-card" onClick={e => e.stopPropagation()}>
        <button className="kd-tutorial-close" onClick={handleDismiss}>
          <X size={20} />
        </button>
        <h2>Cách chơi Kanji Drop</h2>
        <div className="kd-tutorial-steps">
          <div className="kd-tutorial-step">
            <span className="step-num">1</span>
            <p>Chọn kanji từ bảng trên</p>
          </div>
          <div className="kd-tutorial-step">
            <span className="step-num">2</span>
            <p>Kanji rơi vào hàng dưới, tự gom nhóm</p>
          </div>
          <div className="kd-tutorial-step">
            <span className="step-num">3</span>
            <p>3+ kanji giống nhau liền kề sẽ bị xóa</p>
          </div>
          <div className="kd-tutorial-step">
            <span className="step-num">4</span>
            <p>Xóa hết tất cả để chiến thắng!</p>
          </div>
        </div>
        <button className="kd-btn kd-btn-primary kd-btn-full" onClick={handleDismiss}>
          Đã hiểu!
        </button>
      </div>
    </div>
  );
}
