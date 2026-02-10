// Admin UI for managing center invites

import { useState } from 'react';
import { Plus, Copy, XCircle, Check } from 'lucide-react';
import { useCenterInvites } from '../../hooks/use-center-invite';
import type { CenterInvite } from '../../types/branch';

interface CenterInviteManagerProps {
  branchId: string;
  centerSlug?: string;
  currentUserId: string;
}

export function CenterInviteManager({ branchId, centerSlug, currentUserId }: CenterInviteManagerProps) {
  const { invites, loading, createInvite, deactivateInvite } = useCenterInvites(branchId);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCreate = async () => {
    await createInvite(currentUserId);
  };

  const handleCopy = (invite: CenterInvite) => {
    const url = centerSlug
      ? `${window.location.origin}/center/${centerSlug}/join/${invite.code}`
      : invite.code;
    navigator.clipboard.writeText(url);
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return <p>Đang tải...</p>;

  const activeInvites = invites.filter(i => i.isActive);
  const inactiveInvites = invites.filter(i => !i.isActive);

  return (
    <div className="center-invite-manager">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>Mã mời ({activeInvites.length})</h3>
        <button className="center-invite-create-btn" onClick={handleCreate}>
          <Plus size={16} /> Tạo mã mới
        </button>
      </div>

      <div className="center-invite-list">
        {activeInvites.map(invite => (
          <div key={invite.id} className="center-invite-item">
            <div>
              <span className="center-invite-code">{invite.code}</span>
              <div className="center-invite-meta">
                Đã dùng: {invite.useCount}{invite.maxUses ? `/${invite.maxUses}` : ''}
                {invite.expiresAt && ` · HSD: ${new Date(invite.expiresAt).toLocaleDateString('vi-VN')}`}
              </div>
            </div>
            <div className="center-invite-actions">
              <button className="center-invite-copy-btn" onClick={() => handleCopy(invite)}>
                {copiedId === invite.id ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <button className="center-invite-deactivate-btn" onClick={() => deactivateInvite(invite.id)}>
                <XCircle size={14} />
              </button>
            </div>
          </div>
        ))}
        {activeInvites.length === 0 && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Chưa có mã mời nào</p>
        )}
      </div>

      {inactiveInvites.length > 0 && (
        <>
          <h4 style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Đã vô hiệu hóa</h4>
          <div className="center-invite-list">
            {inactiveInvites.map(invite => (
              <div key={invite.id} className="center-invite-item center-invite-inactive">
                <span className="center-invite-code">{invite.code}</span>
                <span className="center-invite-meta">Đã dùng: {invite.useCount}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
