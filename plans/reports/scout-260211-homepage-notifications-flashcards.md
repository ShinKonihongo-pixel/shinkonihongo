# Scout Report: Homepage, Notification Bell Modal, Flashcard Components

**Date:** 2026-02-11
**Focus Areas:** Homepage with "nhiệm vụ hôm nay", notification bell modal pattern, flashcard types/components

---

## 1. HOMEPAGE WITH "NHIỆM VỤ HÔM NAY" (TODAY'S TASKS)

### Primary Files

**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/home-page.tsx`
- **Purpose:** Main homepage component with authentic Japanese aesthetic
- **Key Features:**
  - Hero section with animated background, sakura motifs
  - Progress ring showing level & mastery percentage
  - Motivational quotes (7 Japanese phrases with romaji)
  - Activities grid (6 activities: vocabulary, grammar, listening, exercises, games, JLPT)
  - JLPT level sections with expandable lessons
  - Daily words task integration
- **Props:** HomePageProps with stats, cards, callbacks, user name, progress, daily words data
- **Notable:** Uses `DailyWordsTask` component from `../home/daily-words-task`

**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/daily-words-page.tsx`
- **Purpose:** Full-page daily words/tasks study experience
- **Key Section:** Title "Nhiệm vụ hôm nay" at line 196
- **Features:**
  - Header with back button, target icon, streak display
  - Progress bar with percentage and dot indicators
  - FlashcardItem for each word
  - Navigation (prev/next cards)
  - Control actions: speak, mark learned, mark all learned
  - Completion state with trophy animation
- **Key Pattern:** Uses `FlashcardItem` component (see section 3)

**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/home/daily-words-task.tsx`
- **Purpose:** Compact modal-based daily learning component (embedded in homepage)
- **Key Features:**
  - Displays as a collapsible section on homepage
  - Shows today's task progress
  - Motivational messages based on progress %
  - Streak tier display (colors: #9333ea legendary, #f59e0b superstar, #10b981 excellent, #3b82f6 good)
  - Quick word study cards
  - Memoized `WordItem` component for performance

---

## 2. NOTIFICATION BELL MODAL PATTERN

### The Notification Bell Component

**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/classroom/notification-badge.tsx`
- **Purpose:** Header notification bell with dropdown modal pattern
- **Pattern Structure:**
  - Button with Bell icon from lucide-react
  - Badge count display (shows "9+" if >9)
  - Dropdown modal (not a portal modal, appears inline)
  - Overlay that closes on click

**Key Pattern Elements:**
```
STATE: isOpen (useState)
TRIGGER: onClick on bell button
MODAL: Appears when isOpen is true
OVERLAY: Full-screen click-to-close overlay
CONTENT: Dropdown list with header, items, footer
```

**Modal Features:**
- Header with title and "Mark all as read" button
- List of notifications (max 10 shown, with overflow indicator)
- Each notification item shows: icon (emoji), title, message, time, unread dot
- Footer with "View all" link for 10+ notifications
- Notification icons mapped by type: test_assigned 📝, assignment 📋, graded ✅, deadline ⏰, invitation 🎓
- Time formatting: "Vừa xong", "X phút trước", "X giờ trước", etc.

**No CSS-in-JS:** Uses plain CSS classes (`notification-badge-container`, `notification-bell-btn`, `notification-dropdown`, etc.)

---

## 3. FLASHCARD-RELATED COMPONENTS & TYPES

### Type Definitions

**File:** `/Users/admin/Documents/名称未設定フォルダ/src/types/flashcard.ts`
- **Core Types:**
  - `JLPTLevel`: 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'BT'
  - `MemorizationStatus`: 'memorized' | 'not_memorized' | 'unset'
  - `DifficultyLevel`: 'super_hard' | 'hard' | 'medium' | 'easy' | 'unset'
  - `ReviewQuality`: 0 | 1 | 2 | 3 | 4 | 5 (SM-2 algorithm)
  - `SimpleRating`: 'again' | 'hard' | 'good' | 'easy'

**Main Interfaces:**
  1. **Flashcard** (vocabulary card)
     - id, vocabulary (main word), kanji, sinoVietnamese, meaning, english, examples[]
     - jlptLevel, lessonId
     - SM-2 spaced repetition: easeFactor, interval, repetitions, nextReviewDate
     - Tracking: memorizationStatus, difficultyLevel, createdAt, createdBy

  2. **Lesson** (bài học)
     - id, name, jlptLevel, parentId (null for root), order, isLocked, isHidden, createdBy

  3. **GrammarCard** (ngữ pháp thẻ)
     - id, title, formula, meaning, explanation, examples[], jlptLevel, lessonId

  4. **KanjiCharacterAnalysis** (individual kanji character)
     - character, onYomi[], kunYomi[], sinoVietnamese, mnemonic, sampleWords[]

  5. **VocabularyNote** (user personal notes)
     - id: `${userId}_${flashcardId}`, content, updatedAt

**File:** `/Users/admin/Documents/名称未設定フォルダ/src/hooks/use-flashcards.ts`
- Custom hook for flashcard logic (service layer)

**File:** `/Users/admin/Documents/名称未設定フォルダ/src/services/firestore/flashcard-service.ts`
- Firebase Firestore service for CRUD operations

---

### Flashcard UI Components

**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/flashcard/flashcard-item.tsx`
- **Purpose:** Individual flashcard display with flip animation
- **Props:**
  - card: Flashcard
  - isFlipped: boolean
  - onFlip: callback
  - showActions?: boolean
  - onEdit?, onDelete?: callbacks
  - settings?: AppSettings (customization)
  - lessonName?: string

- **Default Settings:** Comprehensive AppSettings with font sizes, colors, flip styles, backgrounds
  - Flip style: 'horizontal'
  - Auto-advance: 3 clicks to advance option
  - Frame types: none, custom (gold border with glow)
  - Mobile-specific font sizes

**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/flashcard/flashcard-list.tsx`
- Displays multiple flashcards in list format

**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/flashcard/flashcard-form.tsx`
- Form for creating/editing flashcards

---

### Flashcard Modal Pattern

**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/flashcard/vocabulary-notes-modal.tsx`
- **Purpose:** User personal notes modal for vocabulary flashcards
- **Modal Pattern (with CSS-in-JS embedded):**
  - Overlay: Fixed position, background blur, z-index 1000
  - Modal: Dark gradient background, rounded (20px), max-width 460px
  - Animations: fade-in (0.2s), slide-up (0.25s)
  - Header: Icon, title, close button (X icon)
  - Body: Loading state or textarea for notes
  - Footer: Delete button (if existing), Save button
  - Styling approach: All CSS embedded as template literal

- **State Management:**
  - content: note text
  - loading: initial load state
  - saving: async save state
  - hasExisting: tracks if note exists

- **Key Feature:** Disable save button when content is empty or while saving

---

### Settings/Preview Components

**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/flashcard-settings-preview.tsx`
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/flashcard-settings-background.tsx`
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/flashcard-settings-frame.tsx`
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/flashcard-settings.tsx`
- Settings tabs for customizing flashcard appearance

---

## ARCHITECTURE INSIGHTS

### Modal Patterns Used

1. **Dropdown Modal (Notification Bell):** Inline dropdown with overlay
   - Minimal, stateful (isOpen)
   - Positioned near trigger
   - No portal needed

2. **Full Modal (Vocabulary Notes):** Centered overlay modal with CSS-in-JS
   - Fixed overlay + centered modal
   - Embedded styles in component
   - Animations for entrance

### Component Organization

- `/src/components/pages/` - Full page components
- `/src/components/home/` - Homepage sub-components
- `/src/components/flashcard/` - Flashcard-specific components
- `/src/components/classroom/` - Classroom features (notifications)
- `/src/types/flashcard.ts` - All type definitions
- `/src/hooks/use-flashcards.ts` - Business logic hook
- `/src/services/firestore/flashcard-service.ts` - Data layer

### Settings System

- `AppSettings` interface provides extensive customization (60+ properties)
- Font size differentiation: desktop vs mobile
- Card backgrounds: gradient, solid color, or image
- Card frames: preset options + custom frame editor
- Stored persistently in app state/localStorage

---

## KEY TAKEAWAYS

1. **"Nhiệm vụ hôm nay" Location:** Primary in `daily-words-page.tsx` (full page), embedded in `home-page.tsx` via `DailyWordsTask` component

2. **Notification Bell Pattern:** Simple state-based dropdown with overlay (not a complex modal library)
   - Uses `useState` for `isOpen`
   - Overlay click to close
   - No special modal library required

3. **Flashcard Architecture:**
   - Rich type system (MemorizationStatus, DifficultyLevel, ReviewQuality)
   - SM-2 spaced repetition fields built-in
   - Settings deeply customizable (fonts, colors, backgrounds, frames)
   - Separate components for display, form, list, modals
   - User notes system with async persistence

4. **Reusability:** `FlashcardItem` used across multiple pages with optional settings prop

---

## UNRESOLVED QUESTIONS

None identified. All three requested areas have clear implementations with documented patterns.
