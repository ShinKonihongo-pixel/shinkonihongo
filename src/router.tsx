// React Router v6 configuration for Shinko
// Phase 1: All routes handled by App.tsx as catch-all
// Future phases will extract individual page routes here

import { createBrowserRouter } from 'react-router-dom';
import App from './App';

// Phase 1: Single catch-all route — App.tsx handles all rendering internally
// This preserves exact current behavior while establishing RouterProvider infrastructure
export const router = createBrowserRouter([
  {
    path: '*',
    element: <App />,
  },
]);
