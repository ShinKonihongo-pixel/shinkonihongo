# Database Schema — Firestore

Shinko (学ぼう — Vietnamese Japanese Learning App) uses **Cloud Firestore** as its primary database. All collection names are defined as constants in `src/services/firestore/collections.ts`.

---

## Collections Overview

| Collection | Constant | Purpose |
|---|---|---|
| `users` | `COLLECTIONS.USERS` | User accounts and profile data |
| `settings` | `COLLECTIONS.SETTINGS` | Per-user app settings (keyed by userId) |
| `flashcards` | `COLLECTIONS.FLASHCARDS` | Vocabulary flashcards with SM-2 spaced repetition data |
| `lessons` | `COLLECTIONS.LESSONS` | Vocabulary lesson hierarchy (JLPT-level groupings) |
| `grammarCards` | `COLLECTIONS.GRAMMAR_CARDS` | Grammar pattern cards |
| `grammarLessons` | `COLLECTIONS.GRAMMAR_LESSONS` | Grammar lesson hierarchy |
| `kanjiCards` | `COLLECTIONS.KANJI_CARDS` | Kanji character study cards |
| `kanjiLessons` | `COLLECTIONS.KANJI_LESSONS` | Kanji lesson hierarchy |
| `kanjiAnalysis` | `COLLECTIONS.KANJI_ANALYSIS` | Per-character kanji decomposition (doc ID = kanji character) |
| `radicalKanjiCustom` | `COLLECTIONS.RADICAL_KANJI_CUSTOM` | Admin-curated radical→kanji mappings (doc ID = radical) |
| `jlptQuestions` | `COLLECTIONS.JLPT_QUESTIONS` | JLPT mock test questions (multiple choice) |
| `jlptFolders` | `COLLECTIONS.JLPT_FOLDERS` | Folders organizing JLPT questions |
| `kaiwaQuestions` | `COLLECTIONS.KAIWA_QUESTIONS` | Preset conversation prompts for AI Kaiwa practice |
| `kaiwaFolders` | `COLLECTIONS.KAIWA_FOLDERS` | Folders organizing Kaiwa prompts |
| `customTopics` | `COLLECTIONS.CUSTOM_TOPICS` | User-created conversation topic collections |
| `customTopicFolders` | `COLLECTIONS.CUSTOM_TOPIC_FOLDERS` | Sub-folders within custom topics |
| `customTopicQuestions` | `COLLECTIONS.CUSTOM_TOPIC_QUESTIONS` | Questions within custom topics |
| `studySessions` | `COLLECTIONS.STUDY_SESSIONS` | Flashcard study session history |
| `gameSessions` | `COLLECTIONS.GAME_SESSIONS` | Multiplayer game result history |
| `jlptSessions` | `COLLECTIONS.JLPT_SESSIONS` | JLPT practice session history |
| `vocabularyNotes` | `COLLECTIONS.VOCABULARY_NOTES` | User personal notes per flashcard |
| `vocabularyNotebooks` | `COLLECTIONS.VOCABULARY_NOTEBOOKS` | User curated word-list notebooks |
| `userAchievements` | *(local constant)* | Achievement progress per user (doc ID = userId) |

---

## Document Schemas

### `users`

Document ID: auto-generated

```typescript
interface User {
  id: string;
  username: string;
  password: string;           // stored (legacy — not hashed in current implementation)
  role: UserRole;             // 'super_admin' | 'director' | 'branch_admin' | 'main_teacher'
                              //   | 'part_time_teacher' | 'assistant' | 'admin' | 'vip_user' | 'user'
  displayName?: string;
  email?: string;
  avatar?: string;            // URL or emoji
  profileBackground?: string; // CSS gradient/color string
  jlptLevel?: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  vipExpirationDate?: string; // 'YYYY-MM-DD'
  createdBy?: string;         // userId of creating admin
  createdAt: string;          // ISO date string
  branchId?: string;          // current center (teachers, branch_admin)
  branchIds?: string[];       // managed centers (directors)
}
```

Queries: `where('username', '==', username)` — requires index on `username`.

---

### `settings`

Document ID: `{userId}` (one doc per user, merged/overwritten via `setDoc(..., { merge: true })`)

Shape is flexible (`Record<string, unknown>`) — stores reading/listening/study preferences.

---

### `flashcards`

Document ID: auto-generated

```typescript
interface Flashcard {
  id: string;
  vocabulary: string;         // kanji or hiragana spelling
  kanji: string;              // kanji form (may be empty)
  sinoVietnamese: string;     // Hán Việt reading
  meaning: string;            // Vietnamese meaning
  english?: string;
  examples: string[];         // legacy flat format
  leveledExamples?: {         // per-level structured examples (max 3 each)
    N5: { japanese: string; vietnamese: string; english: string }[];
    N4: ...; N3: ...; N2: ...; N1: ...;
  };
  jlptLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'BT';
  lessonId: string;           // FK → lessons.id
  // SM-2 spaced repetition
  easeFactor: number;         // default 2.5
  interval: number;           // days until next review
  repetitions: number;        // consecutive correct count
  nextReviewDate: string;     // ISO date
  createdAt: string;
  createdBy?: string;
  memorizationStatus: 'memorized' | 'not_memorized' | 'unset';
  difficultyLevel: 'super_hard' | 'hard' | 'medium' | 'easy' | 'unset';
  originalDifficultyLevel?: 'super_hard' | 'hard' | 'medium' | 'easy' | 'unset';
}
```

Queries: `where('lessonId', '==', id)`, `where('jlptLevel', '==', level)`.

---

### `lessons`

Document ID: auto-generated

```typescript
interface Lesson {
  id: string;
  name: string;
  jlptLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'BT';
  parentId: string | null;    // null = root lesson
  order: number;
  isLocked: boolean;          // VIP/admin only
  isHidden: boolean;
  createdBy?: string;
}
```

---

### `grammarCards`

Document ID: auto-generated

```typescript
interface GrammarCard {
  id: string;
  title: string;              // e.g. "〜てから"
  formula: string;            // e.g. "V-て + から"
  meaning: string;            // Vietnamese meaning
  explanation?: string;
  examples: { japanese: string; vietnamese: string }[];
  jlptLevel: 'N5'|'N4'|'N3'|'N2'|'N1'|'BT';
  lessonId: string;           // FK → grammarLessons.id
  createdAt: string;
  createdBy?: string;
  memorizationStatus?: 'memorized' | 'not_memorized' | 'unset';
}
```

---

### `grammarLessons`

Document ID: auto-generated

```typescript
interface GrammarLesson {
  id: string;
  name: string;
  jlptLevel: 'N5'|'N4'|'N3'|'N2'|'N1'|'BT';
  parentId: string | null;
  order: number;
  createdBy?: string;
  createdAt?: string;
}
```

---

### `kanjiCards`

Document ID: auto-generated

```typescript
interface KanjiCard {
  id: string;
  character: string;          // single kanji character
  onYomi: string[];           // on'yomi readings
  kunYomi: string[];          // kun'yomi readings
  sinoVietnamese: string;     // e.g. "THỰC"
  meaning: string;            // Vietnamese
  mnemonic: string;
  strokeCount: number;
  radicals: string[];
  jlptLevel: 'N5'|'N4'|'N3'|'N2'|'N1'|'BT';
  lessonId: string;           // FK → kanjiLessons.id
  sampleWords: { word: string; reading: string; meaning: string }[];
  memorizationStatus?: 'memorized' | 'not_memorized' | 'unset';
  createdAt: string;
  createdBy?: string;
}
```

---

### `kanjiLessons`

Document ID: auto-generated

```typescript
interface KanjiLesson {
  id: string;
  name: string;
  jlptLevel: 'N5'|'N4'|'N3'|'N2'|'N1'|'BT';
  parentId: string | null;
  order: number;
  createdBy?: string;
  createdAt?: string;
}
```

---

### `kanjiAnalysis`

Document ID: **kanji character itself** (e.g., `食`)

```typescript
interface KanjiCharacterAnalysis {
  character: string;
  onYomi: string[];
  kunYomi: string[];
  sinoVietnamese: string;
  mnemonic: string;           // Vietnamese memory tip
  radicals?: string[];        // Kangxi radical components
  sampleWords: { word: string; reading: string; meaning: string }[];
  createdAt: string;
}
```

Note: doc ID equals the character itself for O(1) lookup. Query by batch via `where(documentId(), 'in', [...])` (max 30 per batch).

---

### `radicalKanjiCustom`

Document ID: **radical character**

```typescript
{
  entries: {
    kanji: string;
    meaning: string;
    // ... RadicalKanjiEntry fields
  }[];
}
```

Admin-editable override list. Loaded in full on app init; merged with static local radical index.

---

### `jlptQuestions`

Document ID: auto-generated

```typescript
interface JLPTQuestion {
  id: string;
  level: 'N5'|'N4'|'N3'|'N2'|'N1';
  category: 'vocabulary' | 'grammar' | 'reading' | 'listening';
  folderId?: string;          // FK → jlptFolders.id
  question: string;
  answers: { text: string; isCorrect: boolean }[];  // always 4 items
  explanation?: string;
  audioUrl?: string;          // Firebase Storage URL (listening questions)
  createdBy?: string;
  createdAt: string;
}
```

Queries: `where('level', '==', level)`, `where('category', '==', category)`, `where('folderId', '==', id)`.
Compound index required: `(level, category)`.

---

### `jlptFolders`

Document ID: auto-generated

```typescript
interface JLPTFolder {
  id: string;
  name: string;
  level: 'N5'|'N4'|'N3'|'N2'|'N1';
  category: 'vocabulary' | 'grammar' | 'reading' | 'listening';
  order: number;
  createdBy?: string;
  createdAt: string;
}
```

---

### `kaiwaQuestions`

Document ID: auto-generated

```typescript
interface KaiwaDefaultQuestion {
  id: string;
  level: 'N5'|'N4'|'N3'|'N2'|'N1'|'BT';
  topic: ConversationTopic;   // predefined topic enum
  folderId?: string;          // FK → kaiwaFolders.id
  questionJa: string;
  questionVi?: string;
  situationContext?: string;
  suggestedAnswers?: string[];
  style: 'casual' | 'polite' | 'formal';
  createdBy?: string;
  createdAt: string;
}
```

---

### `kaiwaFolders`

Document ID: auto-generated

```typescript
interface KaiwaFolder {
  id: string;
  name: string;
  level: 'N5'|'N4'|'N3'|'N2'|'N1'|'BT';
  topic: ConversationTopic;
  order: number;
  createdBy?: string;
  createdAt: string;
}
```

---

### `customTopics`

Document ID: auto-generated

```typescript
interface CustomTopic {
  id: string;
  name: string;
  description: string;
  icon: string;               // Lucide icon name
  color: string;              // hex color
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  tags: string[];
  isPublic: boolean;
  questionCount: number;      // cached count
  linkedLessonIds: string[];  // FK → lessons.id[]
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### `customTopicFolders`

Document ID: auto-generated

```typescript
interface CustomTopicFolder {
  id: string;
  topicId: string;            // FK → customTopics.id
  name: string;
  level: 'N5'|'N4'|'N3'|'N2'|'N1'|'BT';
  linkedLessonIds: string[];
  order: number;
  createdBy: string;
  createdAt: string;
}
```

---

### `customTopicQuestions`

Document ID: auto-generated

```typescript
interface CustomTopicQuestion {
  id: string;
  topicId: string;            // FK → customTopics.id
  folderId?: string;          // FK → customTopicFolders.id
  questionJa: string;
  questionVi?: string;
  situationContext?: string;
  suggestedAnswers?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  tags?: string[];
  createdBy: string;
  createdAt: string;
}
```

Queries: `where('topicId', '==', id)`, `where('folderId', '==', id)`.

---

### `studySessions`

Document ID: auto-generated

```typescript
interface StudySession {
  id: string;
  userId: string;             // FK → users.id
  date: string;               // 'YYYY-MM-DD'
  cardsStudied: number;
  correctCount: number;
  duration: number;           // seconds
  lessonIds: string[];        // lessons covered
}
```

Queries: `where('userId', '==', userId)`.

---

### `gameSessions`

Document ID: auto-generated

```typescript
interface GameSession {
  id: string;
  userId: string;
  date: string;
  gameTitle: string;
  rank: number;
  totalPlayers: number;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
}
```

Queries: `where('userId', '==', userId)`.

---

### `jlptSessions`

Document ID: auto-generated

```typescript
interface JLPTSession {
  id: string;
  userId: string;
  date: string;
  level: string;              // 'N5'–'N1'
  category: string;
  correctCount: number;
  totalQuestions: number;
  duration: number;           // seconds
}
```

Queries: `where('userId', '==', userId)`.

---

### `vocabularyNotes`

Document ID: `{userId}_{flashcardId}`

```typescript
interface VocabularyNote {
  id: string;                 // composite key
  userId: string;
  flashcardId: string;        // FK → flashcards.id
  content: string;
  updatedAt: string;
}
```

---

### `vocabularyNotebooks`

Document ID: auto-generated

```typescript
interface VocabularyNotebook {
  id: string;
  userId: string;
  name: string;
  description?: string;
  flashcardIds: string[];     // FK → flashcards.id[]
  color: string;
  createdAt: string;
  updatedAt: string;
}
```

Queries: `where('userId', '==', userId)`.

---

### `userAchievements`

Document ID: `{userId}` (one doc per user)

```typescript
interface UserAchievementData {
  userId: string;
  achievements: {
    [achievementId: string]: {
      achievementId: string;
      currentValue: number;
      unlockedTiers: ('bronze' | 'silver' | 'gold')[];
      lastUnlockedAt?: string;  // ISO date
    }
  };
  updatedAt: string;
}
```

Real-time listener used (`onSnapshot`). Created on first access with empty `achievements: {}`.

---

## Collection Relationships

```
users (1) ──────────────────────────────────────────────────────────────────┐
  │                                                                          │
  ├── settings (1:1, doc ID = userId)                                        │
  ├── userAchievements (1:1, doc ID = userId)                                │
  ├── studySessions (1:N, userId field)                                      │
  ├── gameSessions (1:N, userId field)                                       │
  ├── jlptSessions (1:N, userId field)                                       │
  ├── vocabularyNotes (1:N, userId field, doc ID = userId_flashcardId)       │
  └── vocabularyNotebooks (1:N, userId field)                                │
                                                                             │
lessons (1) ──── flashcards (1:N, lessonId field)                           │
                 vocabularyNotebooks.flashcardIds (M:N via array)            │
                                                                             │
grammarLessons (1) ──── grammarCards (1:N, lessonId field)                  │
                                                                             │
kanjiLessons (1) ──── kanjiCards (1:N, lessonId field)                      │
                                                                             │
jlptFolders (1) ──── jlptQuestions (1:N, folderId field)                    │
                                                                             │
kaiwaFolders (1) ──── kaiwaQuestions (1:N, folderId field)                  │
                                                                             │
customTopics (1) ┬─── customTopicFolders (1:N, topicId field)               │
                 └─── customTopicQuestions (1:N, topicId + folderId fields)  │
                                                                             │
kanjiAnalysis ── doc ID = kanji character (no FK, lookup by character)       │
radicalKanjiCustom ── doc ID = radical character                             │
```

---

## Recommended Firestore Indexes

| Collection | Fields | Query Type |
|---|---|---|
| `flashcards` | `lessonId ASC`, `jlptLevel ASC` | Compound |
| `jlptQuestions` | `level ASC`, `category ASC` | Compound |
| `jlptQuestions` | `folderId ASC`, `level ASC` | Compound |
| `kaiwaQuestions` | `level ASC`, `topic ASC` | Compound |
| `customTopicQuestions` | `topicId ASC`, `folderId ASC` | Compound |
| `studySessions` | `userId ASC`, `date DESC` | Compound |
| `gameSessions` | `userId ASC`, `date DESC` | Compound |
| `jlptSessions` | `userId ASC`, `date DESC` | Compound |
| `users` | `username ASC` | Single-field |

---

## Notes

- **Offline persistence**: Firestore is initialized with `persistentLocalCache` + `persistentMultipleTabManager` — all reads are served from IndexedDB on repeat visits.
- **Anonymous auth**: All Firestore access is gated behind Firebase Anonymous Authentication. Security rules should restrict writes to authenticated UIDs.
- **Daily missions**: Stored in `localStorage` only (not Firestore) — see `DailyMissionState` type.
- **User stats (XP/level)**: Computed client-side from session collections — not stored as a separate document.
