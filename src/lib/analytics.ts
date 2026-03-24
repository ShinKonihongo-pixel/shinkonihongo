// Lightweight analytics service — provider-agnostic
// Currently supports PostHog, but easily swappable

let initialized = false;

// Initialize analytics — call once on app startup
export function initAnalytics(): void {
  const apiKey = import.meta.env.VITE_POSTHOG_KEY;
  if (!apiKey || initialized) return;

  // Lazy load PostHog to avoid blocking startup
  import('posthog-js').then(({ default: posthog }) => {
    posthog.init(apiKey, {
      api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
      loaded: () => { initialized = true; },
      capture_pageview: false, // We track manually
      capture_pageleave: true,
      autocapture: false, // Manual events only — less noise
      persistence: 'localStorage',
    });
  }).catch(() => {
    // Analytics failure should never break the app
    console.warn('[Analytics] Failed to load PostHog');
  });
}

// Track event
export function trackEvent(name: string, properties?: Record<string, unknown>): void {
  if (!initialized) return;
  import('posthog-js').then(({ default: posthog }) => {
    posthog.capture(name, properties);
  }).catch(() => {});
}

// Track page view
export function trackPageView(pageName: string): void {
  trackEvent('$pageview', { page: pageName });
}

// Identify user (after login)
export function identifyUser(userId: string, properties?: Record<string, unknown>): void {
  if (!initialized) return;
  import('posthog-js').then(({ default: posthog }) => {
    posthog.identify(userId, properties);
  }).catch(() => {});
}

// Reset on logout
export function resetAnalytics(): void {
  if (!initialized) return;
  import('posthog-js').then(({ default: posthog }) => {
    posthog.reset();
  }).catch(() => {});
}
