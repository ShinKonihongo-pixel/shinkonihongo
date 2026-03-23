// Sentry error tracking initialization
// Set VITE_SENTRY_DSN in .env to enable

import * as Sentry from '@sentry/react';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return; // Skip if no DSN configured

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Capture 10% of transactions for performance
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    // Don't send errors in development unless DSN is set
    enabled: !!dsn,
    // Ignore common non-actionable errors
    ignoreErrors: [
      'ResizeObserver loop',
      'Network request failed',
      'Load failed',
      'ChunkLoadError',
    ],
  });
}

// Re-export for use in error boundary
export { Sentry };
