// NavigationContext — shares app navigation state between AppChrome and child routes
// Wraps useAppNavigation hook in a context so sidebar, floating panels, and pages
// all access the same navigation state instance

import { createContext, useContext, type ReactNode } from 'react';
import { useAppNavigation, type AppNavigationState } from '../hooks/use-app-navigation';

const NavigationContext = createContext<AppNavigationState | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const nav = useAppNavigation();
  return (
    <NavigationContext.Provider value={nav}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): AppNavigationState {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return ctx;
}
