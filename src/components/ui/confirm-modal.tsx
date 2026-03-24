// Premium confirm modal — dark glassmorphism, centered, with accent bar

import { createPortal } from 'react-dom';
import { AlertTriangle, Info } from 'lucide-react';
import './confirm-modal.css';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'info';
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  variant = 'danger',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return createPortal(
    <div className="confirm-overlay" onClick={onCancel}>
      <div
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={e => e.stopPropagation()}
      >
        <div className={`confirm-accent-bar ${isDanger ? 'danger' : 'info'}`} />
        <div className="confirm-body">
          <div className={`confirm-icon-circle ${isDanger ? 'danger' : 'info'}`}>
            {isDanger ? <AlertTriangle size={22} /> : <Info size={22} />}
          </div>
          <h3 id="confirm-dialog-title" className="confirm-title">{title}</h3>
          <p className="confirm-message">{message}</p>
        </div>
        <div className="confirm-actions">
          <button className="confirm-btn cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button className={`confirm-btn ${isDanger ? 'danger' : 'primary'}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
