// DataProviders — wraps children with all data context providers
// Must be inside UserDataProvider since FlashcardData and JLPTData
// need currentUser to compute levelFilter

import type { ReactNode } from 'react';
import { useUserData } from '../../contexts/user-data-context';
import { FlashcardDataProvider } from '../../contexts/flashcard-data-context';
import { JLPTDataProvider } from '../../contexts/jlpt-data-context';
import { AchievementProvider } from '../../contexts/achievement-context';
import { ReadingSettingsProvider } from '../../contexts/reading-settings-context';
import { ListeningSettingsProvider } from '../../contexts/listening-settings-context';

export function DataProviders({ children }: { children: ReactNode }) {
  const { currentUser, isAdmin } = useUserData();

  // Admin loads all data; regular users load only their JLPT level
  const levelFilter = isAdmin ? undefined : currentUser?.jlptLevel;

  return (
    <FlashcardDataProvider levelFilter={levelFilter}>
      <JLPTDataProvider currentUserId={currentUser?.id ?? ''} levelFilter={levelFilter}>
        <AchievementProvider>
          <ReadingSettingsProvider>
            <ListeningSettingsProvider>
              {children}
            </ListeningSettingsProvider>
          </ReadingSettingsProvider>
        </AchievementProvider>
      </JLPTDataProvider>
    </FlashcardDataProvider>
  );
}
