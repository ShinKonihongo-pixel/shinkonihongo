# Listening Practice (Nghe Hiểu) Files Scout Report
**Date:** 2026-01-31  
**Project:** Shinko日本語 React Application  
**Search Scope:** src/ directory for listening comprehension features

---

## Overview
Found 7 primary listening practice files organized in a modular structure. The app features:
- Premium glassmorphic UI with dark theme
- JLPT level-based vocabulary listening
- Custom audio file upload with A-B repeat
- Global settings context with persistence
- Admin management interface for audio content

---

## Core Files

### 1. Main Listening Practice Component
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/listening-practice-page.tsx`
- **Size:** 1237 lines
- **Purpose:** Main practice UI component
- **Key Features:**
  - Level selection (N5-N1)
  - Vocabulary view with flashcard-style display
  - Custom audio upload with playback controls
  - Lesson/difficulty filtering
  - Text-to-speech for vocabulary pronunciation
  - Playback speed, repeat count, delay controls
  - A-B repeat functionality for custom audio
  - Toggle visibility for: vocabulary, kanji, meaning
  - Auto-play next feature
  - Shuffle and loop modes
- **Dependencies:**
  - Uses ListeningSettings context for global settings
  - Imports types from listening-practice-types
  - Uses constants from listening-practice-constants

### 2. Type Definitions
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/types/listening.ts`
- **Purpose:** Data models for listening practice
- **Exports:**
  ```
  - ListeningFolder {id, name, jlptLevel, createdAt, createdBy}
  - ListeningAudio {id, title, description, audioUrl, duration, jlptLevel, folderId, createdAt, createdBy}
  - ListeningQuestion {id, audioId, question, answers[], timestamp?}
  ```
- **Status:** Prepared for future comprehension questions feature

**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/listening-practice/listening-practice-types.ts`
- **Purpose:** Component-specific type definitions
- **Exports:**
  ```
  - ListeningPracticePageProps
  - ViewMode = 'level-select' | 'vocabulary' | 'custom-audio'
  - DifficultyOption
  ```

### 3. Constants
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/listening-practice/listening-practice-constants.ts`
- **Exports:**
  - JLPT_LEVELS: ['N5', 'N4', 'N3', 'N2', 'N1']
  - DIFFICULTY_OPTIONS with Vietnamese labels
  - DEFAULT_PLAYBACK_SPEED: 1
  - DEFAULT_REPEAT_COUNT: 1
  - DEFAULT_DELAY_BETWEEN_WORDS: 2

### 4. Settings Context & Provider
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/contexts/listening-settings-context.tsx`
- **Purpose:** Global listening settings management
- **Settings Interface:**
  - Playback: defaultPlaybackSpeed (0.5-2.0), defaultRepeatCount (1-10), delayBetweenWords (0.5-10s), autoPlayNext
  - Display: showVocabulary, showMeaning, showKanji
  - Source: vocabularySourceLevel, defaultLevel
  - Voice: voiceRate (0.5-2.0)
- **Features:**
  - localStorage persistence (key: 'shinko-listening-settings')
  - Helper functions for incremental adjustments
  - Toggle functions for display options
- **Context Hook:** `useListeningSettings()`

### 5. Settings Modal Component
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/ui/listening-settings-modal.tsx`
- **Purpose:** Premium modal UI for listening settings
- **Features:**
  - Playback speed adjustment (slider UI)
  - Repeat count control
  - Delay between words adjustment
  - Toggle for vocabulary/kanji/meaning display
  - Auto-play next toggle
  - Glassmorphic design with gradient backgrounds
  - Modal trigger button component: `ListeningSettingsButton`
- **Styling:** Inline styles with gradient effects, backdrop blur

### 6. Admin Management Interface
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/cards-management/listening-tab.tsx`
- **Size:** 1104 lines
- **Purpose:** Admin panel for managing listening audio content
- **Navigation Structure:**
  - Root: Level selection (N5-N1 with file counts)
  - Level view: Browse folders by JLPT level
  - Folder view: Upload and manage audio files
- **Features:**
  - Create/edit/delete folders
  - Upload audio files with title & description
  - Preview audio playback in admin panel
  - File count display
  - Empty states with helpful icons
  - Animated transitions and level-themed colors
- **Props Interface:**
  ```
  onAddAudio, onUpdateAudio, onDeleteAudio
  onAddFolder, onUpdateFolder, onDeleteFolder
  getFoldersByLevel, getAudiosByFolder
  isSuperAdmin flag
  ```

### 7. Module Exports
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/listening-practice/index.ts`
- Central export point for types and constants

---

## Related Files (Contextual References)

**App.tsx** - Routes and integrates listening practice page
**Exercise types** - `/src/types/exercise.ts` (if exercises link to listening)
**JLPT Question types** - `/src/types/jlpt-question.ts` (for future comprehension questions)
**Classroom types** - `/src/types/classroom.ts` (group listening features planned)

---

## UI/UX Architecture

### Color Scheme (Level-Based)
- N5: Green (#10b981)
- N4: Blue (#3b82f6)
- N3: Purple (#8b5cf6)
- N2: Amber (#f59e0b)
- N1: Red (#ef4444)

### Design Patterns
- Glassmorphism with backdrop blur
- Gradient backgrounds on interactive elements
- Sparkle animations on headers
- Smooth slide-down animations for modals
- 3D-like card hover effects with glow

### Responsive Design
- Mobile-optimized with flex wrapping
- Touch-friendly button sizes (44-68px)
- Adaptive grid layout (auto-fit, minmax)

---

## Settings Persistence
- **Storage Key:** 'shinko-listening-settings' (localStorage)
- **Format:** JSON serialized ListeningSettings object
- **Auto-sync:** Updates whenever settings change in modal

---

## Audio Features
- **Playback Methods:**
  1. Text-to-speech (using Web Speech API)
  2. Custom audio file upload
- **Controls:**
  - Play/pause toggle
  - Previous/next navigation
  - Shuffle and loop modes
  - Speed adjustment (0.5x - 2x)
  - Repeat functionality with configurable delay
  - A-B repeat for custom audio (set points, auto-loop)
  - Seek/timeline scrubbing for custom files

---

## Implementation Notes

### State Management
- Uses React hooks (useState, useContext, useRef, useEffect, useMemo)
- Context API for global settings
- Local component state for view/playback controls

### Performance Optimizations
- useMemo for filtered card lists and shuffled indices
- useCallback for speech synthesis
- Refs for audio element and file input

### Accessibility
- Semantic HTML with form inputs
- ARIA-compliant button states
- Clear visual feedback for active states

---

## Future Extension Points

1. **ListeningQuestion Type** - Prepared in listening.ts for comprehension Q&A
2. **Classroom Integration** - Types exist in classroom.ts
3. **Speaking Comparison** - Parallel file structure for speaking-practice.ts
4. **Question Management** - Admin interface could expand to manage questions per audio
5. **Progress Tracking** - Ready for user score/statistics per level
6. **Pronunciation Analysis** - Could integrate speech recognition API

---

## File Dependency Graph
```
listening-practice-page.tsx
├── listening-practice-types.ts
├── listening-practice-constants.ts
├── listening-settings-context.tsx
├── listening-settings-modal.tsx
└── flashcard types (vocabulary, difficultyLevel, lesson)

listening-tab.tsx (admin)
├── listening types (ListeningAudio, ListeningFolder)
└── flashcard types (JLPTLevel)

listening-settings-context.tsx
└── flashcard types (JLPTLevel)
```

---

## Summary Statistics
- **Total listening-specific files:** 7 primary + 1 context
- **Total lines of code:** ~3500+
- **UI Components:** 3 (main page, admin tab, settings modal)
- **Type definitions:** 5 interfaces
- **Supported JLPT Levels:** 5 (N5-N1)
- **Supported difficulty levels:** 4 (easy, medium, hard, super_hard) + all

**Status:** Fully functional with premium UI, ready for extension
