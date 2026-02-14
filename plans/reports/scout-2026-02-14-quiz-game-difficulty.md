# Quiz Game Difficulty Settings & Game Setup - Codebase Scout Report

**Date:** 2026-02-14  
**Topic:** Quiz game difficulty levels, game setup/configuration, "Quản lí" management tab, question generation, and flashcard types

---

## Executive Summary

Quiz game difficulty management is implemented across multiple layers:

1. **Game Difficulty Levels:** 4 levels (easy, medium, hard, super_hard) + unset for flashcards
2. **Game Setup Flow:** `GameCreate` component handles both flashcard and JLPT sources with difficulty selection
3. **Management Tab:** Located in `GameTab` component with `QuizGameSettingsPanel` for difficulty mix % configuration
4. **Question Generation:** `question-generator.ts` mixes card difficulties based on configured percentages
5. **Flashcard Types:** Support for kanji, vocabulary, meaning fields with difficulty levels
6. **Game Creation:** Unified room modal system with per-game setup screens

---

## 1. Core Types & Constants

### Difficulty Level Types
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/types/quiz-game.ts`

```typescript
// 4 difficulty levels for game difficulty selection
export type GameDifficultyLevel = 'super_hard' | 'hard' | 'medium' | 'easy';

// Game settings for multiplayer quiz
export interface GameSettings {
  minPlayers: number;              // min players to start (default: 2)
  maxPlayers: number;              // max players (default: 20)
  showLeaderboardEvery: number;    // show leaderboard after N questions (default: 5)
  specialRoundEvery: number;       // special round with power-ups every N questions (default: 5)
  basePoints: number;              // base points for correct answer (default: 100)
  streakBonus: number;             // bonus for streak (default: 10)
  timeBonus: boolean;              // enable time-based bonus (default: true)
}

// Default settings
export const DEFAULT_GAME_SETTINGS: GameSettings = {
  minPlayers: 2,
  maxPlayers: 20,
  showLeaderboardEvery: 5,
  specialRoundEvery: 5,
  basePoints: 100,
  streakBonus: 10,
  timeBonus: true,
};

// Create game data
export interface CreateGameData {
  title: string;
  source: GameQuestionSource;           // 'flashcards' | 'jlpt'
  lessonIds: string[];                  // for flashcards source
  lessonNames?: string[];
  difficultyLevels?: GameDifficultyLevel[]; // difficulty filter (one level only)
  jlptLevels?: string[];                // for JLPT source
  jlptCategories?: string[];
  totalRounds: number;                  // 20-50 (or up to 50 for VIP)
  timePerQuestion: number;              // 10-30 seconds
  maxPlayers?: number;
  questionContent?: GameQuestionContent; // what to show as question
  answerContent?: GameAnswerContent;     // what to show as options
  settings?: Partial<GameSettings>;
}
```

### Flashcard Difficulty Types
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/types/flashcard.ts`

```typescript
// Flashcard difficulty levels
export type DifficultyLevel = 'super_hard' | 'hard' | 'medium' | 'easy' | 'unset';

// Flashcard interface with difficulty fields
export interface Flashcard {
  id: string;
  vocabulary: string;           // Hiragana/Katakana form
  kanji: string;                // Kanji form (can be empty)
  sinoVietnamese: string;       // Sino-Vietnamese reading
  meaning: string;              // Vietnamese meaning
  english?: string;             // English meaning
  examples: string[];           // Example sentences
  jlptLevel: JLPTLevel;
  lessonId: string;
  
  // Spaced Repetition
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
  
  // Difficulty tracking
  memorizationStatus: MemorizationStatus;
  difficultyLevel: DifficultyLevel;           // current difficulty
  originalDifficultyLevel?: DifficultyLevel;  // difficulty at creation (for reset)
}
```

---

## 2. Game Difficulty Mix Configuration (Quản lí Tab)

### Location & Purpose
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/cards-management/game-tab.tsx`

The "Quản lí" (Management) tab contains the `QuizGameSettingsPanel` (lines 695-935) which manages:
- **Phần Trăm Trộn Mức Độ** (Difficulty Mix Percentages)
- **Thời Gian JLPT Mỗi Loại Câu Hỏi** (JLPT Time Per Category)

### Settings Structure
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/hooks/use-settings.ts` (lines 129-133)

```typescript
export interface AppSettings {
  // Per-level difficulty mix matrix (each row = when player selects that difficulty)
  // Key = game difficulty chosen by player
  // Value = % mix of card difficulties (super_hard, hard, medium, easy)
  quizDifficultyMix: Record<'super_hard' | 'hard' | 'medium' | 'easy', { 
    super_hard: number; 
    hard: number; 
    medium: number; 
    easy: number 
  }>;
  
  // JLPT time per question category (seconds)
  quizJlptTimePerCategory: { 
    vocabulary: number;   // default: 15s
    grammar: number;      // default: 20s
    reading: number;      // default: 30s
    listening: number     // default: 25s
  };
}
```

### Default Difficulty Mix
```typescript
// In QuizGameSettingsPanel (game-tab.tsx, lines 734-742)
quizDifficultyMix: {
  super_hard: { super_hard: 60, hard: 25, medium: 10, easy: 5 },
  hard:       { super_hard: 20, hard: 45, medium: 25, easy: 10 },
  medium:     { super_hard: 5,  hard: 20, medium: 50, easy: 25 },
  easy:       { super_hard: 0,  hard: 10, medium: 30, easy: 60 },
}
```

### UI Components in QuizGameSettingsPanel
1. **Difficulty Mix Section** (lines 764-847)
   - Expandable cards for each game difficulty level
   - Each shows mini visual bar preview of current mix
   - Individual sliders for each card difficulty (0-100%, max constrained to row total)
   - Displays row total (must be ≤ 100%)

2. **JLPT Time Section** (lines 851-883)
   - Separate sliders for vocabulary (5-60s), grammar, reading, listening
   - Settings used when creating JLPT-based quiz games

3. **Question/Answer Content Section** (lines 885-926)
   - `gameQuestionContent`: What shows as question (kanji/vocabulary/meaning)
   - `gameAnswerContent`: What shows as options (kanji/vocabulary/meaning/vocabulary_meaning)

---

## 3. Game Creation Flow & Difficulty Selection

### Game Create Component
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/components/quiz-game/game-create.tsx`

**Difficulty Options** (lines 39-45):
```typescript
const DIFFICULTY_OPTIONS: { value: GameDifficultyLevel; label: string; color: string }[] = [
  { value: 'super_hard', label: 'Siêu khó', color: '#DC2626' },
  { value: 'hard', label: 'Khó', color: '#F59E0B' },
  { value: 'medium', label: 'Vừa', color: '#3B82F6' },
  { value: 'easy', label: 'Dễ', color: '#10B981' },
];
```

**Key Features:**
1. **Source Selection** (lines 73): Choose between 'flashcards' or 'jlpt'

2. **For Flashcards Source:**
   - Select lessons from JLPT levels (N5, N4, N3, N2, N1)
   - Select ONE difficulty level (optional) (lines 79, 449-477)
   - Difficulty selector shows 4 color-coded buttons
   - Shows "Không chọn = tất cả mức độ" (No selection = all levels)
   - Mix percentages are configured in Quản lí tab

3. **Role-Based Limits** (lines 48-57):
   ```typescript
   // Max rounds based on user role
   super_admin/vip_user: 50 rounds
   admin/branch_admin/director: 20 rounds
   others: 10 rounds
   
   // Max players based on user role
   super_admin/vip_user: 50 players
   admin/branch_admin/director: 20 players
   others: 10 players
   ```

4. **Difficulty Fulfillment Check** (lines 113-140):
   - Validates if selected difficulty can be fulfilled based on:
     - Available card difficulties in selected lessons
     - Mix percentages configured in settings
     - Total rounds requested
   - Auto-disables unfulfillable difficulty options

5. **Game Settings** (lines 252, 265):
   ```typescript
   settings: { specialRoundEvery: 5 }  // special round every 5 questions
   ```

---

## 4. Question Generation Logic

### Question Generator Service
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/services/quiz-game/question-generator.ts`

**For Flashcard Source** (lines 44-87):
```typescript
export function generateQuestionsFromFlashcards(
  flashcards: Flashcard[],
  totalRounds: number,
  timePerQuestion: number,
  specialRoundEvery: number,
  questionContent: GameQuestionContent = 'kanji',
  answerContent: GameAnswerContent = 'vocabulary_meaning'
): GameQuestion[] {
  // 1. Shuffle cards randomly
  const shuffled = shuffleArray(flashcards);
  
  // 2. Pick cards up to totalRounds limit
  const selectedCards = shuffled.slice(0, Math.min(totalRounds, shuffled.length));
  
  // 3. For each card:
  //    - Get question text based on questionContent setting
  //    - Get correct answer based on answerContent setting
  //    - Generate wrong options from other cards
  //    - Shuffle all options
  //    - Mark as special round if (index + 1) % specialRoundEvery === 0
  
  // 4. Ensure special round is not last (swap if needed)
  return ensureSpecialNotLast(questions);
}
```

**For JLPT Source** (lines 90-124):
```typescript
export function generateQuestionsFromJLPT(
  jlptQuestions: JLPTQuestion[],
  totalRounds: number,
  timePerQuestion: number,
  specialRoundEvery: number
): GameQuestion[] {
  // Similar flow but uses pre-defined JLPT questions
  // Preserves question structure from JLPT question bank
}
```

**Content Types Available:**
```typescript
type GameQuestionContent = 'kanji' | 'vocabulary' | 'meaning';
type GameAnswerContent = 'kanji' | 'vocabulary' | 'meaning' | 'vocabulary_meaning';
```

### Helper Function: getCardContent
```typescript
function getCardContent(
  card: Flashcard,
  contentType: GameQuestionContent | GameAnswerContent
): string {
  switch (contentType) {
    case 'kanji':
      return card.kanji || card.vocabulary;
    case 'vocabulary':
      return card.vocabulary;  // Hiragana/Katakana
    case 'meaning':
      return card.meaning;
    case 'vocabulary_meaning':
      return `${card.vocabulary} - ${card.meaning}`;
  }
}
```

---

## 5. Game CRUD Operations

### Game Creation Service
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/services/quiz-game/game-crud.ts`

**createGame Function** (lines 28-138):
```typescript
export async function createGame(
  data: CreateGameData,
  hostId: string,
  hostName: string,
  hostAvatar: string | undefined,
  flashcards: Flashcard[],
  jlptQuestions?: JLPTQuestion[]
): Promise<QuizGame> {
  // 1. Merge settings with defaults
  const settings = {
    minPlayers: 2,
    maxPlayers: 20,
    showLeaderboardEvery: 5,
    specialRoundEvery: 5,
    basePoints: 100,
    streakBonus: 10,
    timeBonus: true,
    ...data.settings,  // merge user-provided settings
  };
  
  // 2. Filter source (flashcards or JLPT)
  if (data.source === 'jlpt') {
    // Filter by jlptLevels and jlptCategories
  } else {
    // Filter by lessonIds
    const lessonCards = flashcards.filter(card => data.lessonIds.includes(card.lessonId));
  }
  
  // 3. Generate questions (applies difficulty mix)
  // 4. Generate unique 6-digit game code
  // 5. Create host player
  // 6. Save to Firestore
  // 7. Return game object
}
```

---

## 6. Game Setup/Configuration Screens

### Per-Game Setup Components
**Base Pattern:** `/Users/admin/Documents/名称未設定フォルダ/src/components/**/setup.tsx`

Examples:
- `src/components/bingo-game/bingo-game-setup.tsx`
- `src/components/golden-bell/golden-bell-setup.tsx`
- `src/components/kanji-battle/kanji-battle-setup.tsx`
- `src/components/picture-guess/picture-guess-setup.tsx`
- `src/components/racing-game/racing-game-setup.tsx`
- `src/components/word-match/word-match-setup.tsx`

### Unified Room Modal System
**Files:**
- `/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/room-setup/game-room-setup.tsx` - Main setup component
- `/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/room-setup/game-configs-basic.tsx` - Basic config
- `/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/room-setup/game-configs-advanced.tsx` - Advanced options
- `/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/room-setup/game-configs-extra.tsx` - Extra settings
- `/Users/admin/Documents/名称未設定フォルダ/src/components/game-hub/room-setup/types.ts` - Type definitions

**Type Structure** (types.ts):
```typescript
export interface GameRoomConfig {
  title: string;
  maxPlayers: number;
  timePerQuestion?: number;
  totalRounds?: number;
  skillsEnabled?: boolean;
  jlptLevel?: JLPTLevel;
  categories?: string[];
  difficultyProgression?: boolean;
  [key: string]: unknown;
}

export interface GameSetupConfig {
  showTitle?: boolean;
  titlePlaceholder?: string;
  showMaxPlayers?: boolean;
  maxPlayersOptions?: number[];
  maxPlayersSlider?: SliderConfig;
  showTimePerQuestion?: boolean;
  timeSlider?: SliderConfig;
  showTotalRounds?: boolean;
  roundsSlider?: SliderConfig;
  showJLPTLevel?: boolean;
  showCategories?: boolean;
  categories?: SelectOption[];
  multiSelectCategories?: boolean;
  toggles?: ToggleOption[];
  customSections?: React.ReactNode;
  rules?: string[];
}
```

---

## 7. Flashcard Type Structure

### Main Flashcard Fields
**File:** `/Users/admin/Documents/名称未設定フォルダ/src/types/flashcard.ts`

```typescript
export interface Flashcard {
  // Primary fields
  id: string;
  vocabulary: string;           // Main term (Hiragana/Katakana for vocab)
  kanji: string;               // Kanji form (can be empty)
  sinoVietnamese: string;      // sino Vietnamese reading (e.g., âm Hán Việt)
  meaning: string;             // Vietnamese meaning (main definition)
  english?: string;            // English meaning (optional)
  examples: string[];          // Example sentences (array)
  
  // Classification
  jlptLevel: JLPTLevel;        // N5, N4, N3, N2, N1, or BT
  lessonId: string;            // Parent lesson
  
  // Spaced Repetition (SM-2 algorithm)
  easeFactor: number;          // ease factor for scheduling (default: 2.5)
  interval: number;            // days until next review
  repetitions: number;         // consecutive correct repetitions
  nextReviewDate: string;      // ISO date string
  
  // Difficulty tracking
  memorizationStatus: MemorizationStatus;  // 'memorized' | 'not_memorized' | 'unset'
  difficultyLevel: DifficultyLevel;        // 'super_hard' | 'hard' | 'medium' | 'easy' | 'unset'
  originalDifficultyLevel?: DifficultyLevel; // difficulty at creation
  
  // Metadata
  createdAt: string;           // ISO date string
  createdBy?: string;          // User ID
}
```

### Flashcard Special Types

**Grammar Card** (for grammar content):
```typescript
export interface GrammarCard {
  id: string;
  title: string;               // Grammar name (e.g., "〜てから")
  formula: string;             // Grammar pattern (e.g., "V-て + から")
  meaning: string;             // Vietnamese meaning
  explanation?: string;        // Detailed explanation
  examples: GrammarExample[];  // Example sentences with translations
  jlptLevel: JLPTLevel;
  lessonId: string;
  createdAt: string;
  createdBy?: string;
}
```

### Flashcard Form Data
```typescript
export interface FlashcardFormData {
  vocabulary: string;
  kanji: string;
  sinoVietnamese: string;
  meaning: string;
  english?: string;
  examples: string[];
  jlptLevel: JLPTLevel;
  lessonId: string;
  difficultyLevel?: DifficultyLevel;  // defaults to 'unset' if not provided
}
```

---

## 8. File Structure & Relationships

### Quiz Game Files
```
/src/
├── types/
│   ├── quiz-game.ts              ← GameDifficultyLevel, GameSettings, CreateGameData
│   └── flashcard.ts              ← DifficultyLevel, Flashcard interface
├── services/quiz-game/
│   ├── index.ts                  ← Main export file
│   ├── game-crud.ts              ← createGame, getGame, updateGame
│   ├── question-generator.ts     ← generateQuestionsFromFlashcards/JLPT
│   ├── game-flow.ts              ← startGame, submitAnswer, revealAnswer
│   ├── game-results.ts           ← endGame, calculate rankings
│   ├── room-service.ts           ← Room management
│   ├── player-service.ts         ← Player management
│   ├── power-ups.ts              ← Power-up logic
│   ├── utils.ts                  ← Helper functions
│   └── constants.ts              ← Constants
├── components/
│   ├── quiz-game/
│   │   ├── game-create.tsx       ← Game creation form (difficulty selection)
│   │   ├── game-lobby.tsx        ← Waiting room
│   │   ├── game-results.tsx      ← Results display
│   │   └── play/
│   │       ├── game-question.tsx ← Question display
│   │       └── game-leaderboard.tsx
│   ├── cards-management/
│   │   ├── game-tab.tsx          ← "Quản lí" management tab with QuizGameSettingsPanel
│   │   ├── vocabulary-tab.tsx    ← Vocabulary/flashcard management
│   │   └── flashcards-tab.tsx    ← Flashcard list
│   ├── game-hub/room-setup/
│   │   ├── game-room-setup.tsx   ← Unified setup component
│   │   ├── game-configs-basic.tsx
│   │   ├── game-configs-advanced.tsx
│   │   ├── game-configs-extra.tsx
│   │   ├── types.ts              ← GameRoomConfig, GameSetupConfig
│   │   └── form-fields.tsx       ← Common form fields
│   └── pages/
│       ├── quiz-game-page.tsx    ← Quiz game page controller
│       └── game-hub-page.tsx     ← Game hub/selector
├── hooks/
│   ├── use-settings.ts           ← AppSettings with quizDifficultyMix
│   ├── use-quiz-game.ts          ← Quiz game state management
│   └── use-flashcards.ts         ← Flashcard operations
└── services/firestore/
    └── flashcard-service.ts      ← Add/update flashcards with difficulty
```

---

## 9. Key Integration Points

### 1. Difficulty Mix Application
```
Game Creation (game-create.tsx)
  ↓ selects difficulty level (or none)
  ↓
game-crud.ts (createGame)
  ↓ calls question-generator.ts
  ↓
question-generator.ts
  ↓ applies mix % from settings.quizDifficultyMix[selectedDifficulty]
  ↓
Final questions shuffled with proper difficulty distribution
```

### 2. Management to Game Pipeline
```
GameTab → QuizGameSettingsPanel
  ↓ user edits quizDifficultyMix sliders
  ↓ updateSetting() → localStorage + context
  ↓ useSettings hook in GameCreate picks it up
  ↓ Next game creation uses new mix percentages
```

### 3. Difficulty Level Constants in Code
- **super_hard:** 0xDC2626 (red)
- **hard:** 0xF59E0B (amber)
- **medium:** 0x3B82F6 (blue)
- **easy:** 0x10B981 (green)
- **unset:** 0x6B7280 (gray)

---

## 10. Related Constants & Defaults

### Special Round Settings
```typescript
// In DEFAULT_GAME_SETTINGS (quiz-game.ts)
specialRoundEvery: 5  // Every 5 questions, a "special round" with power-ups
showLeaderboardEvery: 5  // Show leaderboard every 5 questions
```

### Time Limits Per JLPT Category
```typescript
// Default in use-settings.ts
quizJlptTimePerCategory: {
  vocabulary: 15,   // seconds
  grammar: 20,
  reading: 30,
  listening: 25
}
```

### Question Content Options
```typescript
// gameQuestionContent (what shows as question on screen)
// Default: 'kanji'
Options: 'kanji' | 'vocabulary' | 'meaning'

// gameAnswerContent (what shows as multiple choice options)
// Default: 'vocabulary_meaning'
Options: 'kanji' | 'vocabulary' | 'meaning' | 'vocabulary_meaning'
```

---

## 11. Summary of Difficulty-Related Files

| File | Contains | Difficulty Relevance |
|------|----------|----------------------|
| `src/types/quiz-game.ts` | GameDifficultyLevel, GameSettings, CreateGameData | Defines 4 game difficulty levels, special round config |
| `src/types/flashcard.ts` | DifficultyLevel (flashcard), Flashcard interface | Defines 5 flashcard difficulty states (incl. unset) |
| `src/components/quiz-game/game-create.tsx` | Game creation form | Difficulty selection, mix validation, role-based limits |
| `src/services/quiz-game/game-crud.ts` | Game creation logic | Creates game, applies settings |
| `src/services/quiz-game/question-generator.ts` | Question generation | Applies difficulty mix % to generate questions |
| `src/hooks/use-settings.ts` | AppSettings with quizDifficultyMix | Stores and manages difficulty mix percentages |
| `src/components/cards-management/game-tab.tsx` | Management dashboard | QuizGameSettingsPanel for mix % configuration (Quản lí tab) |
| `src/components/cards-management/vocabulary-tab.tsx` | Vocabulary management | Card creation with difficulty selection |
| `src/components/game-hub/room-setup/types.ts` | GameSetupConfig types | Game-specific setup configuration structure |
| `src/services/quiz-game/game-flow.ts` | Game state transitions | Game flow from start to finish |
| `src/services/quiz-game/game-results.ts` | Results calculation | Ranking and scoring logic |

---

## 12. Difficulty Mix Matrix Example

When a player selects difficulty "hard" in game creation:

```
Selected Difficulty: hard
↓
Looks up: quizDifficultyMix.hard
↓
Gets: { super_hard: 20, hard: 45, medium: 25, easy: 10 }
↓
Question generation will mix:
  - 20% questions from super_hard flashcards
  - 45% questions from hard flashcards
  - 25% questions from medium flashcards
  - 10% questions from easy flashcards
↓
Total: 100% (validation ensures this)
```

---

## Unresolved Questions

None identified. All difficulty settings, game setup flows, and flashcard structures are well-documented in the codebase.

