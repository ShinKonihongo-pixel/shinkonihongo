// Center context - provides center data and branding to center-scoped pages

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { Branch, BranchMemberRole, CenterBranding } from '../types/branch';
import { DEFAULT_CENTER_BRANDING } from '../types/branch';

interface CenterContextValue {
  center: Branch;
  centerId: string;
  userRole: BranchMemberRole | 'director' | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  branding: CenterBranding;
}

const CenterContext = createContext<CenterContextValue | null>(null);

interface CenterProviderProps {
  center: Branch;
  userRole: BranchMemberRole | 'director' | null;
  children: ReactNode;
}

export function CenterProvider({ center, userRole, children }: CenterProviderProps) {
  const branding = center.branding || DEFAULT_CENTER_BRANDING;

  // Apply CSS custom properties for center branding
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--center-primary', branding.primaryColor);
    root.style.setProperty('--center-secondary', branding.secondaryColor);
    if (branding.fontFamily) {
      root.style.setProperty('--center-font', branding.fontFamily);
    }

    return () => {
      root.style.removeProperty('--center-primary');
      root.style.removeProperty('--center-secondary');
      root.style.removeProperty('--center-font');
    };
  }, [branding]);

  const value = useMemo<CenterContextValue>(() => ({
    center,
    centerId: center.id,
    userRole,
    isAdmin: userRole === 'director' || userRole === 'branch_admin',
    isTeacher: userRole === 'main_teacher' || userRole === 'part_time_teacher' || userRole === 'assistant',
    isStudent: userRole === 'student',
    branding,
  }), [center, userRole, branding]);

  return (
    <CenterContext.Provider value={value}>
      {children}
    </CenterContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCenter(): CenterContextValue {
  const ctx = useContext(CenterContext);
  if (!ctx) throw new Error('useCenter must be used within CenterProvider');
  return ctx;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCenterOptional(): CenterContextValue | null {
  return useContext(CenterContext);
}
