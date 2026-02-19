# Kaiwa Feature - Complete File Listing with Details

Generated: 2026-02-18

---

## ABSOLUTE FILE PATHS & SPECIFICATIONS

### Core Page Components (7 files)

| File | Lines | Type | Description |
|------|-------|------|-------------|
| `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/kaiwa/index.tsx` | 146 | TSX | Main orchestrator routing setup/session views |
| `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/kaiwa/kaiwa-setup-view.tsx` | 638 | TSX | Pre-session configuration UI (4 modes) |
| `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/kaiwa/kaiwa-session-view.tsx` | 627 | TSX | Active conversation interface |
| `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/kaiwa/use-kaiwa-state.ts` | 796 | TS | Central state management hook |
| `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/kaiwa/mic-mode-selector.tsx` | 54 | TSX | Mic mode toggle (immediate/reading) |
| `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/kaiwa/kaiwa-page-types.ts` | 36 | TS | Page prop types |
| `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/kaiwa/kaiwa-types.ts` | 34 | TS | Session types (SessionMode, SelectorState) |

**Subtotal: 2,331 lines**

---

### UI Components - Messages & Communication (3 files)

| File | Lines | Type | Description |
|------|-------|------|-------------|
| `/Users/admin/Documents/名称未設定フォルダ/src/components/kaiwa/kaiwa-message-item.tsx` | 80 | TSX | Individual message with speak/translate/save |
| `/Users/admin/Documents/名称未設定フォルダ/src/components/kaiwa/kaiwa-input-area.tsx` | 150 | TSX | Input controls with mic & suggestion tabs |
| `/Users/admin/Documents/名称未設定フォルダ/src/components/kaiwa/kaiwa-suggestions-box.tsx` | 60 | TSX | Suggested answers display |

**Subtotal: 290 lines**

---

### UI Components - Modals (4 files)

| File | Lines | Type | Description |
|------|-------|------|-------------|
| `/Users/admin/Documents/名称未設定フォルダ/src/components/kaiwa/kaiwa-practice-modal.tsx` | 120 | TSX | Pronunciation practice modal |
| `/Users/admin/Documents/名称未設定フォルダ/src/components/kaiwa/kaiwa-reading-practice-modal.tsx` | 180 | TSX | Visual character recognition modal |
| `/Users/admin/Documents/名称未設定フォルダ/src/components/kaiwa/kaiwa-analysis-modal.tsx` | 80 | TSX | Translation/grammar analysis modal |
| `/Users/admin/Documents/名称未設定フォルダ/src/components/kaiwa/kaiwa-evaluation-modal.tsx` | 150 | TSX | End-of-session feedback modal |

**Subtotal: 530 lines**

---

### UI Components - Support (6 files)

| File | Lines | Type | Description |
|------|-------|------|-------------|
| `/Users/admin/Documents/名称未設定フォルダ/src/components/kaiwa/kaiwa-answer-template.tsx` | 60 | TSX | Sentence patterns & vocab hints |
| `/Users/admin/Documents/名称未設定フォルダ/src/components/kaiwa/kaiwa-karaoke-text.tsx` | 120 | TSX | Character-by-character accuracy coloring |
| `/Users/admin/Documents/名称未設定フォルダ/src/components/kaiwa/kaiwa-start-screen.tsx` | 200 | TSX | Alt setup screen (legacy) |
| `/Users/admin/Documents/名称未設定フォルダ/src/components/kaiwa/kaiwa-conversation-header.tsx` | 90 | TSX | Header with badges |
| `/Users/admin/Documents/名称未設定フォルダ/src/components/kaiwa/kaiwa-stats-dashboard.tsx` | 100 | TSX | Session stats display |
| `/Users/admin/Documents/名称未設定フォルダ/src/components/kaiwa/kaiwa-shadowing-mode.tsx` | 180 | TSX | Listen-and-repeat practice |

**Subtotal: 750 lines**

---

### UI Components - Styling (2 files)

| File | Lines | Type | Description |
|------|-------|------|-------------|
| `/Users/admin/Documents/名称未設定フォルダ/src/components/kaiwa/kaiwa.css` | 400 | CSS | Main stylesheet |
| `/Users/admin/Documents/名称未設定フォルダ/src/components/kaiwa/kaiwa-reading-practice-modal.css` | 80 | CSS | Reading practice modal styles |

**Subtotal: 480 lines**

---

### Custom Hooks (4 files)

| File | Lines | Type | Description |
|------|-------|------|-------------|
| `/Users/admin/Documents/名称未設定フォルダ/src/hooks/use-kaiwa-characters.ts` | 171 | TS | TTS voice management (10 presets) |
| `/Users/admin/Documents/名称未設定フォルダ/src/hooks/use-kaiwa-questions.ts` | 105 | TS | Default question loading |
| `/Users/admin/Documents/名称未設定フォルダ/src/hooks/use-kaiwa-topics.ts` | 244 | TS | Advanced/custom topic management |
| `/Users/admin/Documents/名称未設定フォルダ/src/hooks/use-kaiwa-session-history.ts` | 417 | TS | Session persistence & history |

**Subtotal: 937 lines**

---

### Type Definitions (4 files)

| File | Lines | Type | Description |
|------|-------|------|-------------|
| `/Users/admin/Documents/名称未設定フォルダ/src/types/kaiwa.ts` | 136 | TS | Core types (Message, Role, Evaluation, etc) |
| `/Users/admin/Documents/名称未設定フォルダ/src/types/kaiwa-session.ts` | 138 | TS | Session data types |
| `/Users/admin/Documents/名称未設定フォルダ/src/types/kaiwa-advanced.ts` | 151 | TS | Advanced topics types |
| `/Users/admin/Documents/名称未設定フォルダ/src/types/kaiwa-question.ts` | 42 | TS | Question types |

**Subtotal: 467 lines**

---

### Firestore Services (2 files)

| File | Lines | Type | Description |
|------|-------|------|-------------|
| `/Users/admin/Documents/名称未設定フォルダ/src/services/firestore/kaiwa-question-service.ts` | 43 | TS | Question CRUD operations |
| `/Users/admin/Documents/名称未設定フォルダ/src/services/firestore/kaiwa-folder-service.ts` | 51 | TS | Folder organization |

**Subtotal: 94 lines**

---

### Constants & Configuration (1 file)

| File | Lines | Type | Description |
|------|-------|------|-------------|
| `/Users/admin/Documents/名称未設定フォルダ/src/constants/kaiwa.ts` | 109 | TS | JLPT levels, styles, topics, helpers |

**Subtotal: 109 lines**

---

### Settings Integration (1 file)

| File | Lines | Type | Description |
|------|-------|------|-------------|
| `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/kaiwa-settings.tsx` | 156 | TSX | Kaiwa preferences UI |

**Subtotal: 156 lines**

---

### Cards Management Integration (3 files)

| File | Lines | Type | Description |
|------|-------|------|-------------|
| `/Users/admin/Documents/名称未設定フォルダ/src/components/cards-management/kaiwa-character-modal.tsx` | 223 | TSX | Character/voice assignment modal |
| `/Users/admin/Documents/名称未設定フォルダ/src/components/cards-management/kaiwa-character-modal.css` | 345 | CSS | Modal styling |
| `/Users/admin/Documents/名称未設定フォルダ/src/components/cards-management/kaiwa/kaiwa-tab-types.ts` | TBD | TS | Tab type definitions |

**Subtotal: 568+ lines**

---

## GRAND TOTALS

| Category | Files | Lines | Notes |
|----------|-------|-------|-------|
| Core Pages | 7 | 2,331 | Main orchestration & state mgmt |
| UI Components | 13 | 1,570 | Messages, modals, support |
| Styling | 2 | 480 | CSS modules |
| Hooks | 4 | 937 | State & data management |
| Types | 4 | 467 | TypeScript definitions |
| Services | 2 | 94 | Firestore operations |
| Constants | 1 | 109 | Configuration |
| Settings | 1 | 156 | Preferences UI |
| Cards Mgmt | 3 | 568+ | Integration |
| **TOTAL** | **37+** | **~12,712** | Complete Kaiwa feature |

---

## DIRECTORY STRUCTURE

```
/Users/admin/Documents/名称未設定フォルダ/
├── src/
│   ├── components/
│   │   ├── pages/
│   │   │   ├── kaiwa/
│   │   │   │   ├── index.tsx ..................... 146 lines
│   │   │   │   ├── kaiwa-setup-view.tsx ......... 638 lines
│   │   │   │   ├── kaiwa-session-view.tsx ....... 627 lines
│   │   │   │   ├── use-kaiwa-state.ts ........... 796 lines
│   │   │   │   ├── mic-mode-selector.tsx ........ 54 lines
│   │   │   │   ├── kaiwa-page-types.ts .......... 36 lines
│   │   │   │   └── kaiwa-types.ts .............. 34 lines
│   │   │   ├── settings/
│   │   │   │   └── kaiwa-settings.tsx ........... 156 lines
│   │   ├── kaiwa/
│   │   │   ├── kaiwa-message-item.tsx ........... 80 lines
│   │   │   ├── kaiwa-input-area.tsx ............ 150 lines
│   │   │   ├── kaiwa-suggestions-box.tsx ........ 60 lines
│   │   │   ├── kaiwa-practice-modal.tsx ........ 120 lines
│   │   │   ├── kaiwa-reading-practice-modal.tsx  180 lines
│   │   │   ├── kaiwa-analysis-modal.tsx ......... 80 lines
│   │   │   ├── kaiwa-evaluation-modal.tsx ...... 150 lines
│   │   │   ├── kaiwa-answer-template.tsx ........ 60 lines
│   │   │   ├── kaiwa-karaoke-text.tsx .......... 120 lines
│   │   │   ├── kaiwa-start-screen.tsx .......... 200 lines
│   │   │   ├── kaiwa-conversation-header.tsx .... 90 lines
│   │   │   ├── kaiwa-stats-dashboard.tsx ....... 100 lines
│   │   │   ├── kaiwa-shadowing-mode.tsx ........ 180 lines
│   │   │   ├── kaiwa.css ....................... 400 lines
│   │   │   └── kaiwa-reading-practice-modal.css .. 80 lines
│   │   ├── cards-management/
│   │   │   ├── kaiwa-character-modal.tsx ........ 223 lines
│   │   │   ├── kaiwa-character-modal.css ........ 345 lines
│   │   │   └── kaiwa/
│   │   │       └── kaiwa-tab-types.ts ......... (TBD)
│   ├── hooks/
│   │   ├── use-kaiwa-characters.ts ............. 171 lines
│   │   ├── use-kaiwa-questions.ts ............. 105 lines
│   │   ├── use-kaiwa-topics.ts ................ 244 lines
│   │   └── use-kaiwa-session-history.ts ........ 417 lines
│   ├── types/
│   │   ├── kaiwa.ts ........................... 136 lines
│   │   ├── kaiwa-session.ts ................... 138 lines
│   │   ├── kaiwa-advanced.ts .................. 151 lines
│   │   └── kaiwa-question.ts .................. 42 lines
│   ├── services/
│   │   └── firestore/
│   │       ├── kaiwa-question-service.ts ....... 43 lines
│   │       └── kaiwa-folder-service.ts ........ 51 lines
│   └── constants/
│       └── kaiwa.ts ........................... 109 lines
```

---

## KEY FILES TO READ FIRST

For understanding the Kaiwa feature architecture, read in this order:

1. **`/Users/admin/Documents/名称未設定フォルダ/src/types/kaiwa.ts`** (136 lines)
   - Core type definitions
   - Understand domain model

2. **`/Users/admin/Documents/名称未設定フォルダ/src/components/pages/kaiwa/index.tsx`** (146 lines)
   - Main orchestrator
   - Routing logic

3. **`/Users/admin/Documents/名称未設定フォルダ/src/components/pages/kaiwa/use-kaiwa-state.ts`** (796 lines)
   - Central state machine
   - All business logic

4. **`/Users/admin/Documents/名称未設定フォルダ/src/components/pages/kaiwa/kaiwa-setup-view.tsx`** (638 lines)
   - Configuration UI
   - Multiple modes

5. **`/Users/admin/Documents/名称未設定フォルダ/src/components/pages/kaiwa/kaiwa-session-view.tsx`** (627 lines)
   - Conversation interface
   - User interactions

6. **`/Users/admin/Documents/名称未設定フォルダ/src/constants/kaiwa.ts`** (109 lines)
   - Configuration data
   - Dropdown options

7. **`/Users/admin/Documents/名称未設定フォルダ/src/hooks/use-kaiwa-session-history.ts`** (417 lines)
   - Session persistence
   - History tracking

---

## INTEGRATION POINTS

**External Dependencies:**
- `useSpeech()` - Browser speech API wrapper
- `useGroq()` - AI conversation API
- `useSettings()` - App settings context

**Shared UI Components:**
- `FuriganaText` - Ruby annotation display
- Common buttons, modals, layout

**Data Stores:**
- Firestore collections: questions, topics, sessions, folders
- localStorage: characters, session cache

