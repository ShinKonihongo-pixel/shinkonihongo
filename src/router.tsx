// React Router v6 configuration for Shinko
// AppLayout is the root layout route (providers + chrome)
// Pages are incrementally migrated from AppContent (catch-all) to direct routes

import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './components/layout/app-layout';
import { AppContent } from './components/layout/app-content';

export const router = createBrowserRouter([
  {
    // Root layout route — providers, sidebar, chrome
    element: <AppLayout />,
    children: [
      // Catch-all: AppContent handles remaining pages via conditional rendering
      // Phase 2-4 will move pages out of here into individual route entries
      {
        path: '*',
        element: <AppContent />,
      },
    ],
  },
]);
