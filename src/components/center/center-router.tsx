// Center router - dispatches to landing or join page based on URL

import { useCenterData } from '../../hooks/use-center-data';
import { CenterLandingPage } from '../pages/center-landing-page';
import { CenterJoinPage } from '../pages/center-join-page';
import type { CurrentUser } from '../../types/user';

interface CenterRouterProps {
  slug: string;
  isPublicLanding: boolean;
  isJoinPage: boolean;
  inviteCode: string | null;
  currentUser: CurrentUser | null;
  navigate: (path: string) => void;
}

export function CenterRouter({
  slug,
  isPublicLanding: _isPublicLanding,
  isJoinPage,
  inviteCode,
  currentUser,
  navigate,
}: CenterRouterProps) {
  const { center, userRole, loading, error } = useCenterData(slug, currentUser?.id ?? null);

  if (loading) {
    return (
      <div className="center-loading">
        <div className="loading-spinner" />
        <span>Đang tải trung tâm...</span>
      </div>
    );
  }

  if (error || !center) {
    return (
      <div className="center-error">
        <h2>404</h2>
        <p>{error || 'Không tìm thấy trung tâm'}</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Về trang chủ
        </button>
      </div>
    );
  }

  // Join page
  if (isJoinPage) {
    return (
      <CenterJoinPage
        center={center}
        inviteCode={inviteCode}
        currentUser={currentUser}
        navigate={navigate}
        userRole={userRole}
      />
    );
  }

  // Public landing page (default)
  return (
    <CenterLandingPage
      center={center}
      navigate={navigate}
      isLoggedIn={!!currentUser}
      isMember={!!userRole}
    />
  );
}
