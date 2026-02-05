// Help overlay component

interface HelpOverlayProps {
  onClose: () => void;
}

export function HelpOverlay({ onClose }: HelpOverlayProps) {
  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="help-content" onClick={(e) => e.stopPropagation()}>
        <h3>Phím tắt</h3>
        <div className="help-grid">
          <div><kbd>← → ↑ ↓</kbd> Điều hướng slide</div>
          <div><kbd>Space</kbd> Slide tiếp theo</div>
          <div><kbd>Home</kbd> Slide đầu tiên</div>
          <div><kbd>End</kbd> Slide cuối cùng</div>
          <div><kbd>G</kbd> Chuyển đến slide</div>
          <div><kbd>B</kbd> Màn hình đen</div>
          <div><kbd>W</kbd> Màn hình trắng</div>
          <div><kbd>L</kbd> Bật/tắt laser</div>
          <div><kbd>S</kbd> Ghi chú slide</div>
          <div><kbd>V</kbd> Preview slide tiếp</div>
          <div><kbd>O</kbd> Xem tất cả (grid)</div>
          <div><kbd>F</kbd> Toàn màn hình</div>
          <div><kbd>ESC</kbd> Thoát</div>
          <div><kbd>H / ?</kbd> Hiện trợ giúp</div>
        </div>
        <button className="btn btn-primary" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
