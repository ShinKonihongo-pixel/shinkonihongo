# Kaiwa (会話) Feature - Complete File Inventory

**Date:** 2026-02-18 | **Scope:** All Kaiwa-related TypeScript, TSX, and CSS files

## Summary

Total files found: 35+ files across components, types, hooks, services, and constants. Total line count: ~12,050 lines.

Architecture: Kaiwa feature follows modular extraction pattern with main orchestrator (`index.tsx`) delegating to setup and session views.

---

## Core Page Components

### 1. Main Page Orchestrator
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/kaiwa/index.tsx` (146 lines)
- **Description:** Routes between setup and active session views
- **Purpose:** Orchestrates the Kaiwa conversation feature, delegates to KaiwaSetupView and KaiwaSessionView
- **Key role:** State coordinator using `useKaiwaState` hook
- **Exports:** KaiwaPage component

### 2. Setup View (Pre-Session Configuration)
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/kaiwa/kaiwa-setup-view.tsx` (638 lines)
- **Description:** Configuration UI for conversation parameters before session starts
- **Features:** 
  - Session mode selector (default/speaking/advanced/custom)
  - Level, style, topic selection
  - Default question picker with hierarchical selector (level → topic → folder → question)
  - Advanced topics grid selector
  - Custom topics selector
  - Role selector for scenario-based conversations
  - Slow mode toggle
- **Complexity:** Extensive nested navigation with multiple conditional states

### 3. Session View (Active Conversation)
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/kaiwa/kaiwa-session-view.tsx` (627 lines)
- **Description:** Main conversation interface during active session
- **Features:**
  - Message display with speaker avatars
  - Header with stats (exchanges, duration, saved sentences, controls)
  - Input area with mic support (2 modes: immediate/reading-practice)
  - Suggestion tabs (answer template, sample answers, suggested questions)
  - Pronunciation practice modal integration
  - Analysis modal for translations/grammar
  - Evaluation modal for feedback
  - Reading practice modal
  - Saved sentences panel
- **State management:** Extensive prop-based state system

### 4. State Management Hook
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/kaiwa/use-kaiwa-state.ts` (796 lines)
- **Description:** Central state management for Kaiwa feature
- **Scope:** Handles all state initialization, computation, event handlers
- **Key responsibilities:**
  - Message management and conversation flow
  - AI interaction with Groq API
  - Speech recognition and synthesis
  - Pronunciation evaluation
  - Session history and persistence
  - File I/O for saving conversations
- **Dependencies:** uses-speech, useGroq, useKaiwaQuestions, useKaiwaTopics

---

## UI Components (src/components/kaiwa/)

### Message & Communication
- **kaiwa-message-item.tsx** (~80 lines): Individual message with speaker info, speak/translate/save actions
- **kaiwa-input-area.tsx** (~150 lines): Bottom input controls with mic modes and suggestion tabs
- **kaiwa-suggestions-box.tsx** (~60 lines): Displays suggested answers with practice/send options

### Modals
- **kaiwa-practice-modal.tsx** (~120 lines): Pronunciation practice with karaoke-style feedback
- **kaiwa-reading-practice-modal.tsx** (~180 lines): Visual character recognition for reading practice
- **kaiwa-analysis-modal.tsx** (~80 lines): Translation and grammar analysis display
- **kaiwa-evaluation-modal.tsx** (~150 lines): End-of-session AI feedback and scoring

### Support Components
- **kaiwa-answer-template.tsx** (~60 lines): Shows sentence patterns and vocabulary hints
- **kaiwa-karaoke-text.tsx** (~120 lines): Character-by-character accuracy coloring for pronunciation
- **kaiwa-start-screen.tsx** (~200 lines): Level/style/topic selectors (legacy/alternative)
- **kaiwa-conversation-header.tsx** (~90 lines): Header display with level/style/topic badges
- **kaiwa-stats-dashboard.tsx** (~100 lines): Session statistics visualization
- **kaiwa-shadowing-mode.tsx** (~180 lines): Listen-and-repeat practice with timing controls

### Styling
- **kaiwa.css** (~400 lines): Main stylesheet for conversation interface
- **kaiwa-reading-practice-modal.css** (~80 lines): Reading practice modal styles

---

## Type Definitions

### Core Types
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/types/kaiwa.ts` (136 lines)
- **Exports:**
  - `JLPTLevel`: 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'BT'
  - `ConversationStyle`: 'casual' | 'polite' | 'formal'
  - `ConversationTopic`: 'free' | 'greetings' | 'self_intro' | 'shopping' | 'restaurant' | 'travel' | 'work' | 'hobbies' | 'weather' | 'directions'
  - `KaiwaMessage`, `KaiwaRole`, `KaiwaEvaluation`
  - `PronunciationResult`, `PronunciationDiff`
  - `SuggestedAnswer`, `AnswerTemplate`, `VocabularyHint`

### Session Types
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/types/kaiwa-session.ts` (138 lines)
- Conversation session data, history records, persistence models

### Advanced Types
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/types/kaiwa-advanced.ts` (151 lines)
- `KaiwaAdvancedTopic`, `KaiwaAdvancedQuestion`
- Complex conversation scenarios with vocabulary lists

### Question Types
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/types/kaiwa-question.ts` (42 lines)
- `KaiwaDefaultQuestion`, `KaiwaFolder`, `KaiwaCustomTopic`

### Page Types
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/kaiwa/kaiwa-types.ts` (34 lines)
- `SessionMode`, `QuestionSelectorState`

---

## Custom Hooks (src/hooks/)

### 1. use-kaiwa-characters.ts (171 lines)
- **Purpose:** TTS voice management for conversation characters
- **Features:**
  - 10 voice presets (adult/youth/children/elderly, male/female)
  - Pitch/rate combinations for voice diversity
  - localStorage persistence
  - Character assignment system

### 2. use-kaiwa-questions.ts (105 lines)
- **Purpose:** Fetch and manage default conversation questions
- **Features:**
  - Load from Firestore
  - Filter by level/topic/style
  - Folder organization support

### 3. use-kaiwa-topics.ts (244 lines)
- **Purpose:** Advanced and custom topic management
- **Features:**
  - Load advanced topics from Firestore
  - Custom topic CRUD operations
  - Topic question associations
  - Vocabulary lists per topic

### 4. use-kaiwa-session-history.ts (417 lines)
- **Purpose:** Session persistence and history tracking
- **Features:**
  - Save/load conversation sessions
  - Session metadata (duration, exchanges, evaluation)
  - Sentence storage
  - CSV export functionality

---

## Services (Firestore)

### 1. kaiwa-question-service.ts (43 lines)
- CRUD operations for default questions
- Firestore document management

### 2. kaiwa-folder-service.ts (51 lines)
- Folder organization for questions
- Hierarchical structure support

---

## Constants

**File:** `/Users/admin/Documents/名称未設定フォルダ/src/constants/kaiwa.ts` (109 lines)
- JLPT_LEVELS configuration
- CONVERSATION_STYLES definitions
- CONVERSATION_TOPICS with icons/labels
- Display helpers and formatters

---

## Settings Integration

**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/kaiwa-settings.tsx` (156 lines)
- **Purpose:** Kaiwa preferences configuration page
- **Settings managed:**
  - Default level
  - Voice gender and rate
  - Furigana display toggle
  - Send mode (auto/manual)
  - Pronunciation evaluation sensitivity

---

## Cards Management Integration

### kaiwa-character-modal.tsx (223 lines)
- **Purpose:** Character/speaker voice assignment modal
- **Features:** Voice preset selection, character customization

### kaiwa-character-modal.css (345 lines)
- Styling for character modal interface

### kaiwa/kaiwa-tab-types.ts (TBD)
- Type definitions for tab management in cards section

---

## Page Types & Routing

**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/kaiwa/kaiwa-page-types.ts` (36 lines)
- `KaiwaPageProps` interface with complete prop definitions
- Integration with settings, questions, topics

---

## Mic Mode Selector

**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/kaiwa/mic-mode-selector.tsx` (54 lines)
- Two-mode mic selector: immediate answer or reading practice
- Visual mode indicator

---

## File Structure Summary

```
src/components/
├── pages/kaiwa/                    # Page-level orchestration
│   ├── index.tsx                   # Main router (146 lines)
│   ├── kaiwa-setup-view.tsx        # Pre-session config (638 lines)
│   ├── kaiwa-session-view.tsx      # Active session (627 lines)
│   ├── use-kaiwa-state.ts          # Central state management (796 lines)
│   ├── mic-mode-selector.tsx       # Mic mode toggle (54 lines)
│   ├── kaiwa-page-types.ts         # Page prop types (36 lines)
│   └── kaiwa-types.ts              # Session types (34 lines)
├── kaiwa/                          # UI components
│   ├── kaiwa-message-item.tsx      # Message display
│   ├── kaiwa-input-area.tsx        # Input controls
│   ├── kaiwa-suggestions-box.tsx   # Suggestion display
│   ├── kaiwa-practice-modal.tsx    # Pronunciation practice
│   ├── kaiwa-reading-practice-modal.tsx
│   ├── kaiwa-analysis-modal.tsx    # Translation/grammar
│   ├── kaiwa-evaluation-modal.tsx  # Session feedback
│   ├── kaiwa-answer-template.tsx   # Pattern hints
│   ├── kaiwa-karaoke-text.tsx      # Character feedback
│   ├── kaiwa-start-screen.tsx      # Alt setup screen
│   ├── kaiwa-conversation-header.tsx
│   ├── kaiwa-stats-dashboard.tsx   # Session stats
│   ├── kaiwa-shadowing-mode.tsx    # Listen-repeat practice
│   ├── kaiwa.css                   # Main styles (~400 lines)
│   └── kaiwa-reading-practice-modal.css

src/hooks/
├── use-kaiwa-characters.ts         # Voice management (171 lines)
├── use-kaiwa-questions.ts          # Question loading (105 lines)
├── use-kaiwa-topics.ts             # Topic management (244 lines)
└── use-kaiwa-session-history.ts    # History/persistence (417 lines)

src/types/
├── kaiwa.ts                        # Core types (136 lines)
├── kaiwa-session.ts                # Session types (138 lines)
├── kaiwa-advanced.ts               # Advanced topics (151 lines)
└── kaiwa-question.ts               # Question types (42 lines)

src/services/firestore/
├── kaiwa-question-service.ts       # Question CRUD (43 lines)
└── kaiwa-folder-service.ts         # Folder management (51 lines)

src/constants/
└── kaiwa.ts                        # Configuration (109 lines)

src/components/pages/settings/
└── kaiwa-settings.tsx              # Settings UI (156 lines)

src/components/cards-management/
├── kaiwa-character-modal.tsx       # Character modal (223 lines)
└── kaiwa-character-modal.css       # Modal styles (345 lines)
```

---

## Key Dependencies & Integrations

**External Hooks Used:**
- `useSpeech()` - Speech recognition/synthesis
- `useGroq()` - AI conversation API
- `useSettings()` - App settings context

**Internal Hooks Used:**
- `useKaiwaQuestions()`
- `useKaiwaTopics()`
- `useKaiwaCharacters()`
- `useKaiwaSessionHistory()`

**UI Utilities:**
- `FuriganaText` - Japanese text with ruby annotations
- `removeFurigana()` - Text cleaning for speech

---

## Conversation Flow

1. **Setup Phase** (`kaiwa-setup-view.tsx`)
   - User selects mode: default/speaking/advanced/custom
   - Chooses level, style, topic
   - Optionally selects specific question or uses random
   - Sets preferences (slow mode, voice gender, etc.)

2. **Active Session** (`kaiwa-session-view.tsx`)
   - AI presents initial question
   - User responds via text or speech (mic)
   - Suggestion system provides:
     - Answer templates with patterns
     - Sample answers
     - Follow-up questions
   - User can practice pronunciation via modal

3. **Evaluation** 
   - After 4+ exchanges, user can request evaluation
   - AI provides score and feedback
   - Session can be saved with history

---

## Audio/Speech Features

- **Speech Recognition:** Browser Web Speech API
- **Text-to-Speech:** TTS with 10 voice presets (pitch/rate variation)
- **Pronunciation Evaluation:** Character-level accuracy comparison
- **Reading Practice:** Visual pronunciation feedback with karaoke styling
- **Shadowing Mode:** Listen-and-repeat with timing controls

---

## Data Persistence

- **Session History:** Firestore + localStorage
- **Characters & Voices:** localStorage (device-specific TTS)
- **Settings:** App settings context
- **CSV Export:** Conversation transcript export

---

## Stats Tracked

- Exchanges (question-answer pairs)
- Duration (minutes)
- Saved sentences count
- Accuracy metrics (per conversation or overall)
- Session metadata (level, style, topic, timestamp)

