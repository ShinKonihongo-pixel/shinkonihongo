// Badge gift modal - select and send badges to friends

import { useState } from 'react';
import type { BadgeType } from '../../types/friendship';
import { BADGE_DEFINITIONS } from '../../types/friendship';
import { Send } from 'lucide-react';
import { ModalShell } from '../ui/modal-shell';

interface BadgeGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  friendName: string;
  friendId: string;
  onSendBadge: (badgeType: BadgeType, toUserId: string, message?: string) => Promise<boolean>;
}

export function BadgeGiftModal({
  isOpen,
  onClose,
  friendName,
  friendId,
  onSendBadge,
}: BadgeGiftModalProps) {
  const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    if (!selectedBadge) return;

    setSending(true);
    const result = await onSendBadge(selectedBadge, friendId, message || undefined);
    setSending(false);

    if (result) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedBadge(null);
        setMessage('');
        onClose();
      }, 1500);
    }
  };

  const handleClose = () => {
    setSelectedBadge(null);
    setMessage('');
    setSuccess(false);
    onClose();
  };

  const selectedBadgeDef = selectedBadge
    ? BADGE_DEFINITIONS.find(b => b.type === selectedBadge)
    : null;

  return (
    <ModalShell isOpen={isOpen} onClose={handleClose} title={`Tặng huy hiệu cho ${friendName}`} maxWidth={480}>
        {success ? (
          <div className="success-message">
            <span className="success-icon">🎉</span>
            <p>Đã gửi huy hiệu thành công!</p>
          </div>
        ) : (
          <>
            <div className="badge-grid">
              {BADGE_DEFINITIONS.map(badge => (
                <button
                  key={badge.type}
                  className={`badge-option ${selectedBadge === badge.type ? 'selected' : ''}`}
                  onClick={() => setSelectedBadge(badge.type)}
                  style={{
                    '--badge-color': badge.color,
                  } as React.CSSProperties}
                >
                  <span className="badge-icon">{badge.icon}</span>
                  <span className="badge-name">{badge.name}</span>
                </button>
              ))}
            </div>

            {selectedBadgeDef && (
              <div className="selected-badge-info">
                <div
                  className="selected-badge-preview"
                  style={{ backgroundColor: selectedBadgeDef.color }}
                >
                  <span>{selectedBadgeDef.icon}</span>
                </div>
                <div className="selected-badge-details">
                  <span className="badge-title">{selectedBadgeDef.name}</span>
                  <span className="badge-desc">{selectedBadgeDef.description}</span>
                </div>
              </div>
            )}

            <div className="message-input">
              <label>Lời nhắn (tùy chọn)</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={`Nhắn gì đó cho ${friendName}...`}
                maxLength={100}
                rows={2}
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={handleClose}>
                Hủy
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSend}
                disabled={!selectedBadge || sending}
              >
                <Send size={16} />
                {sending ? 'Đang gửi...' : 'Gửi huy hiệu'}
              </button>
            </div>
          </>
        )}
    </ModalShell>
  );
}
