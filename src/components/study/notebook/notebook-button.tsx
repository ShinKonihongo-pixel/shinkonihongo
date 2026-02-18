// Notebook trigger button for study headers
import { BookMarked } from 'lucide-react';

interface NotebookButtonProps {
  notebookCount: number;
  onClick: () => void;
  isMobile?: boolean;
}

export function NotebookButton({ notebookCount, onClick, isMobile }: NotebookButtonProps) {
  return (
    <button
      className="header-action-btn has-label"
      onClick={onClick}
      title="Sổ tay từ vựng"
      style={{ position: 'relative' }}
    >
      <BookMarked size={16} />
      {!isMobile && <span className="btn-label">Sổ tay</span>}
      {notebookCount > 0 && (
        <span className="nb-badge">{notebookCount}</span>
      )}
    </button>
  );
}
