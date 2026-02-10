// Lightweight pushState-based URL router for center paths
// Parses /center/:slug, /center/:slug/join, /center/:slug/join/:code, /center/:slug/app

import { useState, useEffect, useCallback } from 'react';

interface CenterRoute {
  centerSlug: string | null;
  isPublicLanding: boolean;
  isJoinPage: boolean;
  inviteCode: string | null;
  isCenterApp: boolean;
}

export function useUrlRouter() {
  const [route, setRoute] = useState<CenterRoute>(() => parseUrl(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseUrl(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((path: string) => {
    window.history.pushState({}, '', path);
    setRoute(parseUrl(path));
  }, []);

  return { ...route, navigate };
}

function parseUrl(pathname: string): CenterRoute {
  const parts = pathname.split('/').filter(Boolean);

  // Match /center/:slug patterns
  if (parts[0] === 'center' && parts[1]) {
    const slug = parts[1];
    const sub = parts[2];

    if (sub === 'join') {
      return {
        centerSlug: slug,
        isPublicLanding: false,
        isJoinPage: true,
        inviteCode: parts[3] || null,
        isCenterApp: false,
      };
    }

    if (sub === 'app') {
      return {
        centerSlug: slug,
        isPublicLanding: false,
        isJoinPage: false,
        inviteCode: null,
        isCenterApp: true,
      };
    }

    // /center/:slug - public landing
    if (!sub) {
      return {
        centerSlug: slug,
        isPublicLanding: true,
        isJoinPage: false,
        inviteCode: null,
        isCenterApp: false,
      };
    }
  }

  return {
    centerSlug: null,
    isPublicLanding: false,
    isJoinPage: false,
    inviteCode: null,
    isCenterApp: false,
  };
}
