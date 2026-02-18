// Popover to add/remove a flashcard from notebooks

import { useState, useEffect, useRef } from 'react';
import { Check, Plus } from 'lucide-react';
import type { VocabularyNotebook } from '../../../types/flashcard';
import './notebook.css';

const QUICK_PALETTE = [
  '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6',
  '#10b981', '#ec4899', '#06b6d4', '#f97316',
];

interface NotebookAddPopoverProps {
  flashcardId: string;
  notebooks: VocabularyNotebook[];
  onToggle: (notebookId: string, flashcardId: string) => Promise<void>;
  onClose: () => void;
  onQuickCreate: (name: string, color: string) => Promise<void>;
}

export function NotebookAddPopover({
  flashcardId,
  notebooks,
  onToggle,
  onClose,
  onQuickCreate,
}: NotebookAddPopoverProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickColor, setQuickColor] = useState(QUICK_PALETTE[0]);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleQuickCreate = async () => {
    if (!quickName.trim()) return;
    await onQuickCreate(quickName.trim(), quickColor);
    setQuickName('');
    setShowCreate(false);
  };

  return (
    <div className="nb-popover" ref={popoverRef}>
      <div className="nb-popover-header">Thêm vào sổ tay</div>

      <div className="nb-popover-list">
        {notebooks.length === 0 && !showCreate && (
          <div className="nb-popover-empty">Chưa có sổ tay nào</div>
        )}
        {notebooks.map((nb) => {
          const isIn = nb.flashcardIds.includes(flashcardId);
          return (
            <button
              key={nb.id}
              className="nb-popover-item"
              onClick={() => onToggle(nb.id, flashcardId)}
            >
              <span className={`nb-popover-check ${isIn ? 'checked' : ''}`}>
                {isIn && <Check size={10} color="white" />}
              </span>
              <span className="nb-popover-item-color" style={{ background: nb.color }} />
              <span className="nb-popover-item-name">{nb.name}</span>
            </button>
          );
        })}
      </div>

      {showCreate ? (
        <div className="nb-popover-quick-create">
          <div className="nb-popover-quick-row">
            <input
              className="nb-popover-quick-input"
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              placeholder="Tên sổ tay..."
              onKeyDown={(e) => e.key === 'Enter' && handleQuickCreate()}
              autoFocus
            />
            <button
              className="nb-popover-quick-save"
              onClick={handleQuickCreate}
              disabled={!quickName.trim()}
            >
              Tạo
            </button>
          </div>
          <div className="nb-color-picker">
            {QUICK_PALETTE.map((c) => (
              <button
                key={c}
                className={`nb-color-swatch ${quickColor === c ? 'active' : ''}`}
                style={{ background: c }}
                onClick={() => setQuickColor(c)}
              />
            ))}
          </div>
        </div>
      ) : (
        <button className="nb-popover-create" onClick={() => setShowCreate(true)}>
          <Plus size={14} />
          <span>Tạo sổ tay mới</span>
        </button>
      )}
    </div>
  );
}
