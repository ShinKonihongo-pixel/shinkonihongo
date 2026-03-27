// AppLayout — root layout route for the entire app
// Provider tree: UserData → AuthGate → DataProviders → Navigation → AppChrome → Outlet
// Used as layout route in router.tsx

import { Outlet } from 'react-router-dom';
import { UserDataProvider } from '../../contexts/user-data-context';
import { NavigationProvider } from '../../contexts/navigation-context';
import { AuthGate } from './auth-gate';
import { DataProviders } from './data-providers';
import { AppChrome } from './app-chrome';

import '../../App.css';

// Dev: Load seed functions to window for console access
import '../../scripts/seed-folders';

export function AppLayout() {
  return (
    <UserDataProvider>
      <AuthGate>
        <DataProviders>
          <NavigationProvider>
            <AppChrome>
              <Outlet />
            </AppChrome>
          </NavigationProvider>
        </DataProviders>
      </AuthGate>
    </UserDataProvider>
  );
}
