# Listening Practice Files - Quick Reference
**Generated:** 2026-01-31

## All Listening Practice Files (Absolute Paths)

### User-Facing Components
1. `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/listening-practice-page.tsx` (1237 lines)
   - Main listening practice interface
   
2. `/Users/admin/Documents/名称未設定フォルダ/src/components/ui/listening-settings-modal.tsx` (640 lines)
   - Settings panel with playback controls
   
### Admin/Management Components  
3. `/Users/admin/Documents/名称未設定フォルダ/src/components/cards-management/listening-tab.tsx` (1104 lines)
   - Admin interface for audio management
   
### Context & State Management
4. `/Users/admin/Documents/名称未設定フォルダ/src/contexts/listening-settings-context.tsx` (199 lines)
   - Global settings provider & hook
   
### Type Definitions
5. `/Users/admin/Documents/名称未設定フォルダ/src/types/listening.ts` (35 lines)
   - ListeningFolder, ListeningAudio, ListeningQuestion interfaces
   
6. `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/listening-practice/listening-practice-types.ts` (23 lines)
   - Component-specific types
   
### Constants
7. `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/listening-practice/listening-practice-constants.ts` (23 lines)
   - JLPT levels, difficulty options, defaults
   
### Module Exports
8. `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/listening-practice/index.ts` (9 lines)
   - Central export file

---

## Quick Import Paths (for development)

### Using Types
```tsx
import type { ListeningAudio, ListeningFolder, ListeningQuestion } from '@/types/listening';
import type { ListeningPracticePageProps, ViewMode } from '@/components/pages/listening-practice/listening-practice-types';
```

### Using Context
```tsx
import { useListeningSettings, ListeningSettingsProvider } from '@/contexts/listening-settings-context';
```

### Using Components
```tsx
import { ListeningPracticePage } from '@/components/pages/listening-practice-page';
import { ListeningTab } from '@/components/cards-management/listening-tab';
import { ListeningSettingsModal, ListeningSettingsButton } from '@/components/ui/listening-settings-modal';
```

### Using Constants
```tsx
import { JLPT_LEVELS, DIFFICULTY_OPTIONS } from '@/components/pages/listening-practice/listening-practice-constants';
```

---

## File Organization Structure
```
src/
├── types/
│   └── listening.ts (data models)
├── contexts/
│   └── listening-settings-context.tsx (global settings)
├── components/
│   ├── ui/
│   │   └── listening-settings-modal.tsx (settings UI)
│   ├── pages/
│   │   ├── listening-practice-page.tsx (main component)
│   │   └── listening-practice/
│   │       ├── index.ts (exports)
│   │       ├── listening-practice-types.ts (types)
│   │       └── listening-practice-constants.ts (constants)
│   └── cards-management/
│       └── listening-tab.tsx (admin panel)
```

---

## Key Interfaces

### ListeningAudio
```ts
interface ListeningAudio {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  duration: number; // seconds
  jlptLevel: JLPTLevel;
  folderId: string;
  createdAt: Date;
  createdBy: string;
}
```

### ListeningFolder
```ts
interface ListeningFolder {
  id: string;
  name: string;
  jlptLevel: JLPTLevel;
  createdAt: Date;
  createdBy: string;
}
```

### ListeningSettings
```ts
interface ListeningSettings {
  defaultPlaybackSpeed: number;      // 0.5-2.0
  defaultRepeatCount: number;        // 1-10
  delayBetweenWords: number;         // 0.5-10s
  autoPlayNext: boolean;
  showVocabulary: boolean;
  showMeaning: boolean;
  showKanji: boolean;
  vocabularySourceLevel: JLPTLevel | 'match_selected';
  defaultLevel: JLPTLevel;
  voiceRate: number;                 // 0.5-2.0
}
```

---

## Main Component Props

### ListeningPracticePage
```ts
interface ListeningPracticePageProps {
  cards: Flashcard[];
  lessons: Lesson[];
  getLessonsByLevel: (level: JLPTLevel) => Lesson[];
  getChildLessons: (parentId: string) => Lesson[];
  onGoHome?: () => void;
}
```

### ListeningTab (Admin)
```ts
interface ListeningTabProps {
  audios: ListeningAudio[];
  folders: ListeningFolder[];
  onAddAudio: (data: Omit<ListeningAudio, 'id' | 'createdAt' | 'createdBy'>, file: File) => Promise<void>;
  onUpdateAudio: (id: string, data: Partial<ListeningAudio>) => Promise<void>;
  onDeleteAudio: (id: string) => Promise<void>;
  onAddFolder: (name: string, level: JLPTLevel) => Promise<void>;
  onUpdateFolder: (id: string, data: Partial<ListeningFolder>) => Promise<void>;
  onDeleteFolder: (id: string) => Promise<void>;
  getFoldersByLevel: (level: JLPTLevel) => ListeningFolder[];
  getAudiosByFolder: (folderId: string) => ListeningAudio[];
  currentUser: CurrentUser;
  isSuperAdmin: boolean;
}
```

---

## Settings localStorage Key
- Key: `shinko-listening-settings`
- Format: JSON stringified ListeningSettings object
- Persistence: Auto-synced on any setting change

---

## View Modes
```ts
type ViewMode = 'level-select' | 'vocabulary' | 'custom-audio';
```

## JLPT Levels
```ts
type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
```

## Difficulty Levels
```ts
type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'super_hard';
```
