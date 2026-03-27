// Modal for user personal notes per vocabulary flashcard

import { useState, useEffect } from 'react';
import { X, Trash2, Save, RefreshCw, PenLine } from 'lucide-react';
import type { Flashcard } from '../../types/flashcard';
import { getVocabularyNote, saveVocabularyNote, deleteVocabularyNote } from '../../services/firestore';
import { ModalShell } from '../ui/modal-shell';
import './vocabulary-notes-modal.css';

interface VocabularyNotesModalProps {
  flashcard: Flashcard;
  userId: string;
  onClose: () => void;
  onSaved?: () => void;
  onToast?: (msg: string) => void;
}

export function VocabularyNotesModal({ flashcard, userId, onClose, onSaved, onToast }: VocabularyNotesModalProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

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
      onSaved?.();
      onToast?.('Đã lưu ghi chú thành công!');
      onClose();
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
      onSaved?.();
      onToast?.('Đã xóa ghi chú');
      onClose();
    } catch (err) {
      console.error('Error deleting note:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell isOpen onClose={onClose} maxWidth={460} hideClose className="vn-shell">
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
            className="vn-btn vn-btn-save"
            onClick={handleSave}
            disabled={saving || !content.trim()}
          >
            {saving ? (
              <RefreshCw size={15} className="vn-spin" />
            ) : (
              <Save size={15} />
            )}
            <span>Lưu</span>
          </button>
        </div>
    </ModalShell>
  );
}
