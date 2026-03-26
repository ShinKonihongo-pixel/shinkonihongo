// Route guard component — wraps routes that require specific roles
// Uses canAccessPage() from role-permissions utility

import { Navigate, Outlet } from 'react-router-dom';
import { useUserData } from '../../contexts/user-data-context';
import { canAccessPage } from '../../utils/role-permissions';

interface ProtectedRouteProps {
  /** Page identifier used by canAccessPage() for role checking */
  page: string;
  /** Redirect path when access denied (default: /) */
  redirectTo?: string;
}

export function ProtectedRoute({ page, redirectTo = '/' }: ProtectedRouteProps) {
  const { currentUser, isLoggedIn } = useUserData();

  if (!isLoggedIn || !currentUser) {
    return <Navigate to="/" replace />;
  }

  if (!canAccessPage(page, currentUser.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
