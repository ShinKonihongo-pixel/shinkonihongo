// Center join page - invite code entry and student enrollment

import { useState } from 'react';
import { KeyRound, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useJoinCenter } from '../../hooks/use-center-invite';
import { addBranchMember } from '../../services/branch-firestore';
import type { Branch, BranchMemberRole } from '../../types/branch';
import type { CurrentUser } from '../../types/user';

interface CenterJoinPageProps {
  center: Branch;
  inviteCode: string | null;
  currentUser: CurrentUser | null;
  navigate: (path: string) => void;
  userRole: BranchMemberRole | 'director' | null;
}

export function CenterJoinPage({ center, inviteCode, currentUser, navigate, userRole }: CenterJoinPageProps) {
  const [code, setCode] = useState(inviteCode || '');
  const [success, setSuccess] = useState(false);
  const { joining, error, joinWithCode, setError } = useJoinCenter();

  // Already a member
  if (userRole) {
    return (
      <div className="center-join">
        <div className="center-join-card">
          <div className="center-join-success">
            <div className="center-join-success-icon">
              <CheckCircle2 size={48} className="center-join-check-icon" />
            </div>
            <h2>Bạn đã là thành viên!</h2>
            <p>Bạn đã là thành viên của <strong>{center.name}</strong></p>
            <button
              className="center-join-btn"
              onClick={() => navigate(`/center/${center.slug}/app`)}
            >
              Vào trung tâm <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleJoin = async () => {
    if (!code.trim()) {
      setError('Vui lòng nhập mã mời');
      return;
    }

    if (!currentUser) {
      setError('Vui lòng đăng nhập để tham gia');
      return;
    }

    const result = await joinWithCode(code.trim());
    if (result.success && result.branchId) {
      try {
        await addBranchMember(result.branchId, { role: 'student' }, currentUser.id, code.trim());
        setSuccess(true);
      } catch {
        setError('Lỗi khi thêm thành viên');
      }
    }
  };

  if (success) {
    return (
      <div className="center-join">
        <div className="center-join-card">
          <div className="center-join-success">
            <div className="center-join-success-icon">
              <CheckCircle2 size={48} className="center-join-check-icon" />
            </div>
            <h2>Tham gia thành công!</h2>
            <p>Chào mừng bạn đến với <strong>{center.name}</strong></p>
            <button
              className="center-join-btn"
              onClick={() => navigate(`/center/${center.slug}/app`)}
            >
              Vào trung tâm <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="center-join">
      <div className="center-join-card">
        <div className="center-join-header">
          <div className="center-join-icon-ring">
            <KeyRound size={28} />
          </div>
          <h1>Tham gia {center.name}</h1>
          <p>Nhập mã mời để tham gia trung tâm</p>
        </div>

        <div className="center-join-input-group">
          <label>Mã mời</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="VD: ABC123"
            maxLength={8}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />
        </div>

        <button
          className="center-join-btn"
          onClick={handleJoin}
          disabled={joining || !code.trim()}
        >
          {joining ? (
            <><Loader2 size={18} className="center-join-spinner" /> Đang xử lý...</>
          ) : (
            <>Tham gia <ArrowRight size={18} /></>
          )}
        </button>

        {error && <p className="center-join-error">{error}</p>}

        {!currentUser && (
          <div className="center-join-login-prompt">
            Bạn cần đăng nhập trước.{' '}
            <button onClick={() => navigate('/')}>Đăng nhập</button>
          </div>
        )}
      </div>
    </div>
  );
}
