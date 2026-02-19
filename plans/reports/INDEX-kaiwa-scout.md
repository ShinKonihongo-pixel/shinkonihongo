# Kaiwa Feature Scout Reports - Index

**Generated:** 2026-02-18  
**Feature:** Kaiwa (会話) - Japanese Conversation Practice  
**Total Files:** 37+  
**Total LOC:** ~12,712

---

## Report Files

This directory contains 4 comprehensive scout reports documenting the entire Kaiwa feature:

### 1. scout-2026-02-18-kaiwa-summary.txt
**Quick reference guide** - Start here for a quick overview.
- Scope and results summary
- All absolute file paths grouped by category
- Key architecture insights
- Session modes overview
- Recommended reading order
- File format: Plain text (easy terminal viewing)

### 2. scout-2026-02-18-kaiwa-feature.md
**Complete feature inventory and analysis** - Deep architecture guide.
- Core page components (orchestrator, setup, session, state)
- UI components breakdown (messages, modals, support)
- Type system documentation
- Custom hooks reference
- Services layer
- Constants and configuration
- Settings integration
- Conversation flow explanation
- Audio/speech features
- Data persistence model
- File structure summary
- Key dependencies

### 3. scout-2026-02-18-kaiwa-key-files.md
**Three main files with complete content** - For detailed implementation.
- Full code of index.tsx (146 lines)
- Full code of kaiwa-setup-view.tsx (638 lines) with section markers
- Full code of kaiwa-session-view.tsx (627 lines) with section markers
- Summary comparison table
- Read this to understand the main page flow and UI structure

### 4. scout-2026-02-18-kaiwa-file-listing.md
**Complete file reference with absolute paths** - For file operations.
- All 37+ files listed in tables
- Absolute file paths (copy-paste ready)
- Line counts for each file
- Type and description
- Organized by category with subtotals
- Directory structure tree
- Integration points
- Suggested reading order

---

## Quick Navigation

### For Different Tasks

**Understanding Architecture:**
1. Read: scout-2026-02-18-kaiwa-summary.txt (5 min)
2. Read: scout-2026-02-18-kaiwa-feature.md (20 min)
3. Skim: scout-2026-02-18-kaiwa-file-listing.md (5 min)

**Implementation Deep Dive:**
1. Read: scout-2026-02-18-kaiwa-key-files.md (30 min)
2. Read: scout-2026-02-18-kaiwa-feature.md (20 min)
3. Reference: scout-2026-02-18-kaiwa-file-listing.md

**File Location Lookup:**
1. Use: scout-2026-02-18-kaiwa-file-listing.md
   - Table format for quick scanning
   - All absolute paths provided
   - Organized by category

**Integration & Dependencies:**
1. See: scout-2026-02-18-kaiwa-feature.md
   - "Key Dependencies & Integrations" section
   - "Integration Points" section

**Reading Code:**
1. Suggested order in each report
2. Start with types and constants
3. Progress to orchestrator and state
4. Then specific components

---

## File Categories at a Glance

| Category | Files | Lines | Focus |
|----------|-------|-------|-------|
| Core Pages | 7 | 2,331 | Orchestration & state |
| UI Components | 13 | 1,570 | Messages, modals, support |
| Styling | 2 | 480 | CSS modules |
| Hooks | 4 | 937 | Data & state management |
| Types | 4 | 467 | TypeScript definitions |
| Services | 2 | 94 | Firestore operations |
| Constants | 1 | 109 | Configuration |
| Settings | 1 | 156 | User preferences |
| Cards Mgmt | 3 | 568+ | Integration |
| **TOTAL** | **37+** | **12,712+** | Complete feature |

---

## Key Files by Importance

### Tier 1: Foundation (Must Read)
- `src/types/kaiwa.ts` - Core domain model
- `src/components/pages/kaiwa/index.tsx` - Main router
- `src/components/pages/kaiwa/use-kaiwa-state.ts` - State machine

### Tier 2: Main Flow (Should Read)
- `src/components/pages/kaiwa/kaiwa-setup-view.tsx` - Configuration
- `src/components/pages/kaiwa/kaiwa-session-view.tsx` - Conversation
- `src/constants/kaiwa.ts` - Configuration data

### Tier 3: Support (Reference As Needed)
- UI components in `src/components/kaiwa/`
- Hooks in `src/hooks/use-kaiwa-*`
- Services and types

---

## Architecture Overview

```
KaiwaPage (Orchestrator)
├── Setup Phase
│   └── KaiwaSetupView
│       ├── Session mode selector
│       ├── Level/style/topic selection
│       ├── Question hierarchical picker
│       └── Advanced/custom topic selectors
└── Session Phase
    └── KaiwaSessionView
        ├── Header (stats & controls)
        ├── Messages display
        ├── Modals (practice, analysis, eval, reading)
        ├── Saved sentences panel
        └── Input section (suggestions, mic, text input)

State Management: use-kaiwa-state.ts (796 lines)
├── AI Interaction: useGroq()
├── Speech: useSpeech()
├── Data: useKaiwaQuestions(), useKaiwaTopics()
└── Persistence: useKaiwaSessionHistory()
```

---

## Session Modes

1. **Default Mode**
   - Free conversation or preset questions
   - Setup: Choose level, style, topic
   - Optional: Select specific question

2. **Speaking Mode**
   - Pure speaking practice
   - No conversation flow
   - Separate component: SpeakingPracticeMode

3. **Advanced Mode**
   - Topic-based conversation
   - Includes vocabulary lists
   - Multiple questions per topic
   - Setup: Select topic, optionally select question

4. **Custom Mode**
   - User-defined topics and questions
   - Similar to advanced mode
   - Setup: Select custom topic

---

## Core Features

- **Speech I/O:** Recognition + synthesis with 10 voice presets
- **Pronunciation:** Character-level evaluation
- **Reading Practice:** Visual karaoke-style feedback
- **Shadowing Mode:** Listen-and-repeat with timing
- **Suggestions:** Patterns, examples, follow-up questions
- **History:** Persistence + CSV export
- **Stats:** Track exchanges, duration, accuracy

---

## Data Models

**Core Types:**
- `JLPTLevel`: N5, N4, N3, N2, N1, BT
- `ConversationStyle`: casual, polite, formal
- `ConversationTopic`: 10 different topics
- `KaiwaMessage`: Chat message with role/timestamp
- `KaiwaRole`: Speaker info for scenarios
- `KaiwaEvaluation`: AI feedback

**Support Types:**
- `PronunciationResult`: Accuracy metrics
- `SuggestedAnswer`: Template suggestions
- `AnswerTemplate`: Sentence patterns
- `VocabularyHint`: Word meanings

---

## Absolute Path Reference

All reports use consistent absolute paths starting with:
```
/Users/admin/Documents/名称未設定フォルダ/
```

This is the project root directory. All paths are complete and can be used directly
with file commands or your editor's "Go to File" feature.

---

## How to Use These Reports

1. **First Time Learning:**
   - Start with scout-2026-02-18-kaiwa-summary.txt
   - Then scout-2026-02-18-kaiwa-feature.md
   - Then scout-2026-02-18-kaiwa-key-files.md

2. **Finding a Specific File:**
   - Use scout-2026-02-18-kaiwa-file-listing.md
   - Search for filename or category

3. **Understanding Feature Flow:**
   - Read scout-2026-02-18-kaiwa-feature.md
   - Focus on "Conversation Flow" section

4. **Deep Code Analysis:**
   - Use scout-2026-02-18-kaiwa-key-files.md
   - Reference scout-2026-02-18-kaiwa-file-listing.md for other files

5. **Integration Tasks:**
   - Check "Integration Points" in scout-2026-02-18-kaiwa-feature.md
   - Reference types and hooks documentation

---

## Report Statistics

- **Total Scanning Time:** ~5-10 minutes (all 4 reports)
- **Study Time:** ~1-2 hours (thorough understanding)
- **Implementation Reference:** Ongoing

---

Last Updated: 2026-02-18
Scout Agent: Codebase Scout for Kaiwa Feature
