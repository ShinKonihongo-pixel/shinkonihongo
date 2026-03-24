// Domain context: reading passages + folders
// Isolated so reading state changes don't re-render vocab/grammar/kanji/exercise consumers

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { ReadingPassage, ReadingFolder } from '../types/reading';
import type { JLPTLevel } from '../types/flashcard';
import { useReading } from '../hooks/use-reading';

export interface ReadingDataContextValue {
  readingPassages: ReadingPassage[];
  readingFolders: ReadingFolder[];
  getReadingFoldersByLevel: (level: JLPTLevel) => ReadingFolder[];
  getReadingPassagesByFolder: (folderId: string) => ReadingPassage[];
}

const ReadingDataContext = createContext<ReadingDataContextValue | null>(null);

interface Props {
  children: ReactNode;
}

export function ReadingDataProvider({ children }: Props) {
  const {
    passages: readingPassages,
    folders: readingFolders,
    getFoldersByLevel: getReadingFoldersByLevel,
    getPassagesByFolder: getReadingPassagesByFolder,
  } = useReading();

  const value = useMemo<ReadingDataContextValue>(() => ({
    readingPassages, readingFolders, getReadingFoldersByLevel, getReadingPassagesByFolder,
  }), [
    readingPassages, readingFolders, getReadingFoldersByLevel, getReadingPassagesByFolder,
  ]);

  return <ReadingDataContext.Provider value={value}>{children}</ReadingDataContext.Provider>;
}

export function useReadingData() {
  const ctx = useContext(ReadingDataContext);
  if (!ctx) throw new Error('useReadingData must be used within ReadingDataProvider');
  return ctx;
}
