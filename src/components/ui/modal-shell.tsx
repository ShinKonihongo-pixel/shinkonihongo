// ModalShell — reusable modal wrapper with overlay, portal, ESC key, click-outside
// Replaces 78+ inline overlay patterns across the codebase
// Usage:
//   <ModalShell isOpen={show} onClose={close} title="Edit" maxWidth={480}>
//     {children}
//   </ModalShell>

import { useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './modal-shell.css';

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Modal title shown in header. Omit for headerless modal. */
  title?: string;
  /** Max width in px (default 480) */
  maxWidth?: number;
  /** Hide the close X button */
  hideClose?: boolean;
  /** Additional CSS class on the dialog */
  className?: string;
  /** Accent bar color variant */
  accent?: 'purple' | 'danger' | 'none';
}

export function ModalShell({
  isOpen,
  onClose,
  children,
  title,
  maxWidth = 480,
  hideClose = false,
  className = '',
  accent = 'none',
}: ModalShellProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return createPortal(
    <div className="ms-overlay" onClick={onClose}>
      <div
        className={`ms-dialog ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'ms-title' : undefined}
        style={{ maxWidth }}
        onClick={e => e.stopPropagation()}
      >
        {accent !== 'none' && <div className={`ms-accent ms-accent--${accent}`} />}
        {(title || !hideClose) && (
          <div className="ms-header">
            {title && <h3 id="ms-title" className="ms-title">{title}</h3>}
            {!hideClose && (
              <button className="ms-close" onClick={onClose} aria-label="Đóng">
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div className="ms-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
