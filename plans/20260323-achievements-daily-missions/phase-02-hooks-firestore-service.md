# Phase 02: Hooks, Firestore Service & Context

## Goal
Implement business logic: Firestore persistence for achievements, localStorage for missions, React context for global state.

---

## File 1: `src/services/firestore/achievement-service.ts`

### Firestore Collection
- Add to `COLLECTIONS` in `collections.ts`: `USER_ACHIEVEMENTS: 'userAchievements'`
- One document per user, doc ID = userId
- Schema: `UserAchievementData` type from Phase 01

### Functions

```ts
// Get user's achievement data (or create default if missing)
getUserAchievements(userId: string): Promise<UserAchievementData>

// Subscribe to real-time updates (for cross-device sync)
subscribeUserAchievements(userId: string, callback: (data: UserAchievementData) => void): Unsubscribe

// Update progress for a specific achievement
updateAchievementProgress(
  userId: string,
  achievementId: string,
  newValue: number,
  newlyUnlockedTier?: AchievementTier
): Promise<void>

// Batch update multiple achievements at once (after session completion)
batchUpdateAchievements(
  userId: string,
  updates: Array<{ achievementId: string; newValue: number; newlyUnlockedTier?: AchievementTier }>
): Promise<void>
```

### Implementation Notes
- Use `setDoc` with merge for upsert pattern (matches existing service patterns in codebase)
- `updateAchievementProgress` reads current doc, updates the specific achievement entry, writes back
- `batchUpdateAchievements` does single read + single write for efficiency
- Import from `collections.ts` re-exports (db, collection, doc, setDoc, getDoc, onSnapshot)

---

## File 2: `src/hooks/use-achievements.ts`

### Hook: `useAchievements(userId: string | null)`

**State:**
- `achievements: UserAchievementProgress[]` -- from Firestore subscription
- `loading: boolean`
- `toastQueue: AchievementToastItem[]` -- pending unlock notifications

**Core Logic:**

```ts
// Called after user actions to check if any achievements should progress/unlock
checkAchievements(stats: CheckableStats): void
```

Where `CheckableStats` aggregates:
```ts
interface CheckableStats {
  // From UserStats
  totalCardsStudied: number;
  totalStudySessions: number;
  totalStudyTime: number;   // seconds
  totalGamesPlayed: number;
  totalGameWins: number;
  goldMedals: number;
  totalJLPTQuestions: number;
  // From StreakInfo
  currentStreak: number;
  longestStreak: number;
  // From social
  friendCount: number;
  badgesSent: number;
  badgesReceived: number;
  // From LevelProgress
  masteryByLevel: Record<string, number>; // level -> masteryPercent
  // Custom
  modesUsed: number;
  kanjiLearned: number;
}
```

**Check Flow:**
1. For each `AchievementDef`, resolve current value from `CheckableStats` using `statKey`
2. Compare against each tier threshold
3. If threshold met and tier not yet in `unlockedTiers` -> mark as newly unlocked
4. Batch all updates -> `batchUpdateAchievements()`
5. For each newly unlocked tier -> push to `toastQueue`

**Toast Management:**
- `consumeToast(): AchievementToastItem | null` -- pops first item from queue
- `clearToasts(): void`

**Subscription:**
- `useEffect` subscribes to Firestore on mount, unsubscribes on unmount
- Follows same pattern as `useUserHistory` and `useFriendships`

---

## File 3: `src/hooks/use-daily-missions.ts`

### Hook: `useDailyMissions(userId: string | null, userJlptLevel?: string)`

**Follows `use-daily-words.ts` pattern** (localStorage persistence, daily reset).

**State:**
- `state: DailyMissionState` from localStorage key `'daily-missions-data'`
- `justCompletedAll: boolean` -- animation trigger for all-complete celebration

**Mission Generation:**
```ts
function generateDailyMissions(date: string, userId: string): DailyMission[]
```
1. Create seed: `hashCode(date + userId)`
2. Shuffle `MISSION_TEMPLATES` with seeded random
3. Pick first `DAILY_MISSION_COUNT` (4)
4. For each, resolve target from `targetRange` using seed
5. Return `DailyMission[]` with progress=0, isCompleted=false

**Progress Update:**
```ts
updateMissionProgress(type: MissionType, increment: number): void
```
- Find mission matching `type` in today's missions
- Increment progress, cap at target
- If progress >= target -> mark completed, record completedAt
- If all missions completed -> set allCompleted, trigger justCompletedAll

**Daily Reset:**
- On init, check if `state.date !== today` -> generate new missions, persist
- Old state discarded (no history needed)

**localStorage Structure:**
```ts
{
  date: '2026-03-23',
  missions: DailyMission[],
  allCompleted: boolean,
  bonusXpClaimed: boolean,
  bonusXp: 50
}
```

---

## File 4: `src/contexts/achievement-context.tsx`

### Provider: `AchievementProvider`

Wraps app content (inside `UserDataProvider`, outside page components).

**Dependencies consumed:**
- `useUserData()` -- for userId, stats, friends, badges
- `useAchievements(userId)` -- achievement state
- `useDailyMissions(userId, jlptLevel)` -- mission state

**Context Value:**
```ts
interface AchievementContextValue {
  // Achievement state
  achievements: UserAchievementProgress[];
  achievementsLoading: boolean;

  // Mission state
  missions: DailyMission[];
  allMissionsCompleted: boolean;
  justCompletedAllMissions: boolean;

  // Actions (called by user-data-context after session writes)
  onStudyCompleted: (cardsStudied: number, duration: number) => void;
  onGameCompleted: (won: boolean) => void;
  onJLPTCompleted: (questionsAnswered: number) => void;
  onGrammarStudied: (count: number) => void;
  onListeningCompleted: (count: number) => void;
  onKanjiStudied: (count: number) => void;
  onReadingCompleted: (count: number) => void;

  // Toast queue
  pendingToast: AchievementToastItem | null;
  dismissToast: () => void;

  // Navigation
  showShowcase: boolean;
  openShowcase: () => void;
  closeShowcase: () => void;

  // Mission completion bonus
  claimMissionBonus: () => void;
}
```

**Event Handler Pattern:**
Each `on*Completed` method:
1. Calls `useDailyMissions.updateMissionProgress(type, increment)`
2. Assembles `CheckableStats` from current user data
3. Calls `useAchievements.checkAchievements(stats)`

**Provider Location:**
```tsx
// In App.tsx, inside FlashcardDataProvider (needs card data for mastery calc)
<AchievementProvider>
  <AppContent />
</AchievementProvider>
```

---

## Modified: `src/services/firestore/collections.ts`

Add to COLLECTIONS:
```ts
USER_ACHIEVEMENTS: 'userAchievements',
```

---

## Acceptance Criteria
- [ ] Achievement service CRUD works with Firestore
- [ ] Real-time subscription updates achievements across tabs
- [ ] Daily missions generate deterministically for same date+userId
- [ ] Mission progress updates correctly, detects completion
- [ ] Context provides all state/actions needed by UI components
- [ ] No unnecessary re-renders (useMemo on context value)
- [ ] Toast queue works FIFO, one at a time
