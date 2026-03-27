// Kanji Drop tutorial overlay — first-time instructions

import { useState, useEffect } from 'react';
import { ModalShell } from '../../ui/modal-shell';

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

  return (
    <ModalShell isOpen={show} onClose={handleDismiss} title="Cách chơi Kanji Drop" maxWidth={400} accent="purple">
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
    </ModalShell>
  );
}
