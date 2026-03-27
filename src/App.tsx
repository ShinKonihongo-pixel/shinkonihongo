// App.tsx — Legacy entry point, no longer used directly
// The app now boots via main.tsx → RouterProvider → router.tsx → AppLayout
//
// Architecture:
//   main.tsx → RouterProvider(router)
//   router.tsx → AppLayout (layout route) → AppContent (catch-all)
//   AppLayout: providers + AuthGate + DataProviders + NavigationProvider + AppChrome
//   AppContent: conditional page rendering (being migrated to direct routes in Phase 2-4)
//
// This file is kept temporarily for any stale imports.
// It can be deleted once all imports are verified clean.

export default function App() {
  return null;
}
