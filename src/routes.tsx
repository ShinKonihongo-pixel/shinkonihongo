// Route configuration — maps Page type to URL paths
// Only pages that benefit from direct URL access are mapped here.
// Sub-states (quiz, golden-bell, picture-guess, profile, daily-words) are
// NOT mapped because they are transient UI states within another page.

export const ROUTES: Record<string, string> = {
  'home': '/',
  'cards': '/cards',
  'study': '/study',
  'settings': '/settings',
  'jlpt': '/jlpt',
  'chat': '/chat',
  'kaiwa': '/kaiwa',
  'lectures': '/lectures',
  'lecture-editor': '/lectures/editor',
  'progress': '/progress',
  'classroom': '/classroom',
  'branches': '/admin/branches',
  'teachers': '/admin/teachers',
  'salary': '/admin/salary',
  'my-teaching': '/my-teaching',
  'notifications': '/notifications',
  'game-hub': '/games',
  'listening': '/listening',
  'grammar-study': '/grammar',
  'reading': '/reading',
  'exercises': '/exercise',
  'kanji-study': '/kanji',
  'center-members': '/center-app/members',
  'center-dashboard': '/center-app/dashboard',
  'pricing': '/pricing',
  'permissions': '/admin/permissions',
  'conjugation': '/conjugation',
  'pronunciation': '/pronunciation',
  'analytics': '/analytics',
} as const;

// Reverse map for URL → Page lookup
export const URL_TO_PAGE: Record<string, string> = Object.fromEntries(
  Object.entries(ROUTES).map(([page, url]) => [url, page])
);
