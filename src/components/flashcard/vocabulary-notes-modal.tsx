// Modal for user personal notes per vocabulary flashcard

import { useState, useEffect } from 'react';
import { X, Trash2, Save, RefreshCw, PenLine } from 'lucide-react';
import type { Flashcard } from '../../types/flashcard';
import { getVocabularyNote, saveVocabularyNote, deleteVocabularyNote } from '../../services/firestore';

interface VocabularyNotesModalProps {
  flashcard: Flashcard;
  userId: string;
  onClose: () => void;
}

export function VocabularyNotesModal({ flashcard, userId, onClose }: VocabularyNotesModalProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadNote() {
      setLoading(true);
      try {
        const note = await getVocabularyNote(userId, flashcard.id);
        if (!cancelled) {
          if (note) {
            setContent(note.content);
            setHasExisting(true);
          } else {
            setContent('');
            setHasExisting(false);
          }
        }
      } catch (err) {
        console.error('Error loading note:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadNote();
    return () => { cancelled = true; };
  }, [userId, flashcard.id]);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await saveVocabularyNote(userId, flashcard.id, content.trim());
      setHasExisting(true);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Error saving note:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteVocabularyNote(userId, flashcard.id);
      setContent('');
      setHasExisting(false);
    } catch (err) {
      console.error('Error deleting note:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="vn-overlay" onClick={onClose}>
      <div className="vn-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="vn-header">
          <div className="vn-title">
            <PenLine size={18} className="vn-title-icon" />
            <h3>{flashcard.kanji || flashcard.vocabulary}</h3>
            <span className="vn-subtitle">Ghi chú</span>
          </div>
          <button className="vn-icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="vn-body">
          {loading ? (
            <div className="vn-loading">
              <RefreshCw size={18} className="vn-spin" />
              <span>Đang tải...</span>
            </div>
          ) : (
            <textarea
              className="vn-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Viết ghi chú cá nhân cho từ này..."
              rows={6}
              autoFocus
            />
          )}
        </div>

        {/* Footer */}
        <div className="vn-footer">
          {hasExisting && (
            <button
              className="vn-btn vn-btn-delete"
              onClick={handleDelete}
              disabled={saving}
            >
              <Trash2 size={15} />
              <span>Xóa</span>
            </button>
          )}
          <button
            className={`vn-btn vn-btn-save ${saved ? 'vn-btn-saved' : ''}`}
            onClick={handleSave}
            disabled={saving || !content.trim()}
          >
            {saving ? (
              <RefreshCw size={15} className="vn-spin" />
            ) : saved ? (
              <span className="vn-check">✓</span>
            ) : (
              <Save size={15} />
            )}
            <span>{saved ? 'Đã lưu' : 'Lưu'}</span>
          </button>
        </div>
      </div>

      <style>{vocabNotesStyles}</style>
    </div>
  );
}

const vocabNotesStyles = `
  /* Overlay */
  .vn-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(8px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    animation: vn-fade-in 0.2s ease-out;
  }

  @keyframes vn-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* Modal frame */
  .vn-modal {
    background: linear-gradient(165deg, #1a1f35 0%, #0d1121 100%);
    border-radius: 20px;
    width: 100%;
    max-width: 460px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow:
      0 25px 80px rgba(0, 0, 0, 0.6),
      0 0 0 1px rgba(255, 255, 255, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    animation: vn-slide-up 0.25s ease-out;
  }

  @keyframes vn-slide-up {
    from { transform: translateY(12px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  /* Header */
  .vn-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    background: linear-gradient(180deg, rgba(16, 185, 129, 0.12) 0%, transparent 100%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
  }

  .vn-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .vn-title-icon {
    color: #6ee7b7;
    flex-shrink: 0;
  }

  .vn-title h3 {
    margin: 0;
    font-size: 1.25rem;
    color: white;
    font-weight: 700;
  }

  .vn-subtitle {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
    font-weight: 500;
    margin-left: 0.25rem;
  }

  .vn-icon-btn {
    background: rgba(255, 255, 255, 0.08);
    border: none;
    color: rgba(255, 255, 255, 0.6);
    border-radius: 10px;
    padding: 0.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .vn-icon-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    color: white;
  }

  /* Body */
  .vn-body {
    padding: 1.25rem 1.5rem;
  }

  .vn-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 2.5rem 0;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.875rem;
  }

  .vn-textarea {
    width: 100%;
    min-height: 140px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 0.875rem 1rem;
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.9rem;
    font-family: inherit;
    line-height: 1.6;
    resize: vertical;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }

  .vn-textarea:focus {
    border-color: rgba(16, 185, 129, 0.4);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.08);
  }

  .vn-textarea::placeholder {
    color: rgba(255, 255, 255, 0.25);
  }

  /* Footer */
  .vn-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 0.875rem 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  .vn-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 1.125rem;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid;
  }

  .vn-btn-save {
    background: rgba(16, 185, 129, 0.12);
    border-color: rgba(16, 185, 129, 0.25);
    color: #6ee7b7;
  }

  .vn-btn-save:hover:not(:disabled) {
    background: rgba(16, 185, 129, 0.2);
    border-color: rgba(16, 185, 129, 0.4);
  }

  .vn-btn-save:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .vn-btn-saved {
    background: rgba(16, 185, 129, 0.2) !important;
    border-color: rgba(16, 185, 129, 0.5) !important;
  }

  .vn-check {
    font-weight: 700;
    font-size: 0.9rem;
  }

  .vn-btn-delete {
    background: rgba(239, 68, 68, 0.08);
    border-color: rgba(239, 68, 68, 0.2);
    color: #fca5a5;
    margin-right: auto;
  }

  .vn-btn-delete:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.35);
  }

  .vn-btn-delete:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  /* Spin animation */
  .vn-spin {
    animation: vn-spin-anim 1s linear infinite;
  }
  @keyframes vn-spin-anim {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Mobile */
  @media (max-width: 480px) {
    .vn-modal {
      border-radius: 16px;
      margin: 0.5rem;
    }

    .vn-header {
      padding: 1rem 1.25rem;
    }

    .vn-body {
      padding: 1rem 1.25rem;
    }

    .vn-footer {
      padding: 0.75rem 1.25rem;
    }

    .vn-subtitle {
      display: none;
    }
  }
`;
