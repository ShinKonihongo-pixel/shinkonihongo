// AuthGate — handles pre-auth states before rendering the main app
// Shows: login page, center router, center loading/error/membership states
// Wraps children in CenterProvider when in center app mode

import type { ReactNode } from 'react';
import { useAuthData } from '../../contexts/auth-context';
import { useUrlRouter } from '../../hooks/use-url-router';
import { useCenterData } from '../../hooks/use-center-data';
import { LoginPage } from '../pages/login-page';
import { LoadingIndicator } from '../ui/loading-indicator';
import { CenterRouter } from '../center/center-router';
import { CenterProvider } from '../../contexts/center-context';

export function AuthGate({ children }: { children: ReactNode }) {
  const { currentUser, isLoggedIn, login, register } = useAuthData();
  const urlRouter = useUrlRouter();

  const isCenterApp = urlRouter.isCenterApp && !!urlRouter.centerSlug;
  const centerSlug = urlRouter.isCenterApp ? urlRouter.centerSlug : null;
  const centerData = useCenterData(centerSlug, currentUser?.id ?? null);

  // Center router — non-app center routes (landing, join)
  if (urlRouter.centerSlug && !urlRouter.isCenterApp) {
    return (
      <CenterRouter
        slug={urlRouter.centerSlug}
        isPublicLanding={urlRouter.isPublicLanding}
        isJoinPage={urlRouter.isJoinPage}
        inviteCode={urlRouter.inviteCode}
        currentUser={currentUser}
        navigate={urlRouter.navigate}
      />
    );
  }

  // Show login page if not logged in
  if (!isLoggedIn) {
    return (
      <div className="app">
        <LoginPage onLogin={login} onRegister={register} />
      </div>
    );
  }

  // Center app loading state
  if (isCenterApp && centerData.loading) {
    return <LoadingIndicator fullScreen label="Đang tải trung tâm..." />;
  }

  // Center app error / not found
  if (isCenterApp && (centerData.error || !centerData.center)) {
    return (
      <div className="center-error">
        <h2>404</h2>
        <p>{centerData.error || 'Không tìm thấy trung tâm'}</p>
        <button className="btn btn-primary" onClick={() => urlRouter.navigate('/')}>
          Về trang chủ
        </button>
      </div>
    );
  }

  // Center app — user not a member
  if (isCenterApp && !centerData.userRole) {
    return (
      <div className="center-error">
        <h2>Chưa là thành viên</h2>
        <p>Bạn chưa tham gia trung tâm {centerData.center?.name}.</p>
        <button
          className="btn btn-primary"
          onClick={() => urlRouter.navigate(`/center/${urlRouter.centerSlug}/join`)}
        >
          Tham gia ngay
        </button>
        <button
          className="btn btn-secondary"
          style={{ marginLeft: '0.5rem' }}
          onClick={() => urlRouter.navigate('/')}
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  // Wrap in CenterProvider when in center app mode
  if (isCenterApp && centerData.center && centerData.userRole) {
    return (
      <CenterProvider center={centerData.center} userRole={centerData.userRole}>
        {children}
      </CenterProvider>
    );
  }

  return <>{children}</>;
}
