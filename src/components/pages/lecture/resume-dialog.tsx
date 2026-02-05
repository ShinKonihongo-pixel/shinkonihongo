// Resume progress dialog

interface ResumeDialogProps {
  slideIndex: number;
  onResume: () => void;
  onStartOver: () => void;
}

export function ResumeDialog({ slideIndex, onResume, onStartOver }: ResumeDialogProps) {
  return (
    <div className="resume-dialog-overlay">
      <div className="resume-dialog">
        <h3>Tiếp tục học?</h3>
        <p>Bạn đã xem đến slide {slideIndex + 1}. Bạn muốn tiếp tục từ đó?</p>
        <div className="resume-actions">
          <button className="btn btn-primary" onClick={onResume}>
            Tiếp tục (Slide {slideIndex + 1})
          </button>
          <button className="btn btn-secondary" onClick={onStartOver}>
            Bắt đầu lại
          </button>
        </div>
      </div>
    </div>
  );
}
