# Phase 04: Integration

## Goal
Wire achievement system + daily missions into existing app. Minimal changes to existing files.

---

## Modified File 1: `src/services/firestore/collections.ts`

Add to COLLECTIONS object:
```ts
USER_ACHIEVEMENTS: 'userAchievements',
```

---

## Modified File 2: `src/App.tsx`

### Changes

1. **Import AchievementProvider:**
```ts
import { AchievementProvider } from './contexts/achievement-context';
```

2. **Import global UI components:**
```ts
const AchievementToast = lazy(() => import('./components/achievements/achievement-toast').then(m => ({ default: m.AchievementToast })));
const CelebrationOverlay = lazy(() => import('./components/achievements/celebration-overlay').then(m => ({ default: m.CelebrationOverlay })));
```

3. **Wrap AppContent in AchievementProvider:**
Current structure:
```tsx
<FlashcardDataProvider levelFilter={levelFilter}>
  <JLPTDataProvider ...>
    <ReadingSettingsProvider>
      <ListeningSettingsProvider>
        {/* AppContent */}
      </ListeningSettingsProvider>
    </ReadingSettingsProvider>
  </JLPTDataProvider>
</FlashcardDataProvider>
```

New structure (AchievementProvider inside FlashcardDataProvider so it can access card data):
```tsx
<FlashcardDataProvider levelFilter={levelFilter}>
  <JLPTDataProvider ...>
    <AchievementProvider>
      <ReadingSettingsProvider>
        <ListeningSettingsProvider>
          {/* AppContent */}
        </ListeningSettingsProvider>
      </ReadingSettingsProvider>
    </AchievementProvider>
  </JLPTDataProvider>
</FlashcardDataProvider>
```

4. **Render global toast + overlay in AppContent:**
After the Sidebar + main content area, add:
```tsx
<Suspense fallback={null}>
  <AchievementToast />
  <CelebrationOverlay />
</Suspense>
```

These components consume context internally (no props needed from AppContent).

---

## Modified File 3: `src/components/pages/home-page.tsx`

### Changes

1. **Add DailyMissionsWidget import:**
```ts
import { DailyMissionsWidget } from '../achievements/daily-missions-widget';
```

2. **Add props to HomePageProps:**
```ts
interface HomePageProps {
  // ... existing props ...
  missions?: {
    missions: DailyMission[];
    allCompleted: boolean;
    bonusClaimed: boolean;
    onClaimBonus: () => void;
  };
}
```

3. **Render widget after DailyWordsTask:**
```tsx
{/* Inside hp-content, after DailyWordsTask block */}
{missions && missions.missions.length > 0 && (
  <DailyMissionsWidget
    missions={missions.missions}
    allCompleted={missions.allCompleted}
    bonusClaimed={missions.bonusClaimed}
    onClaimBonus={missions.onClaimBonus}
  />
)}
```

4. **Pass missions prop from AppContent:**
In `App.tsx` where HomePage is rendered, construct missions prop from achievement context:
```tsx
const achievementCtx = useAchievementContext();
// ...
<HomePage
  // ...existing props...
  missions={{
    missions: achievementCtx.missions,
    allCompleted: achievementCtx.allMissionsCompleted,
    bonusClaimed: false, // from context
    onClaimBonus: achievementCtx.claimMissionBonus,
  }}
/>
```

---

## Modified File 4: `src/components/layout/sidebar.tsx`

### Changes

Add mission progress indicator on Home nav item.

1. **Import useAchievementContext:**
```ts
import { useAchievementContext } from '../../contexts/achievement-context';
```

2. **In Sidebar component, get mission count:**
```ts
const { missions, allMissionsCompleted } = useAchievementContext();
const completedMissions = missions.filter(m => m.isCompleted).length;
const totalMissions = missions.length;
```

3. **Modify renderNavItem for 'home' page:**
Add a small badge next to the Home icon showing `{completed}/{total}` when missions exist and not all complete:
```tsx
{item.page === 'home' && totalMissions > 0 && !allMissionsCompleted && (
  <span className="sidebar-mission-badge">{completedMissions}/{totalMissions}</span>
)}
```

4. **CSS addition in existing sidebar CSS:**
```css
.sidebar-mission-badge {
  font-size: 0.65rem;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  color: white;
  padding: 1px 5px;
  border-radius: 8px;
  margin-left: auto;
}
```

---

## Modified File 5: `src/contexts/user-data-context.tsx`

### Changes

**Option A (Recommended): Event callback approach**

Rather than making user-data-context depend on achievement-context (circular), use a callback pattern:

1. **Add optional callback to UserDataProvider:**
```ts
interface UserDataProviderProps {
  children: ReactNode;
  onStudySessionAdded?: (session: StudySession) => void;
  onGameSessionAdded?: (session: GameSession) => void;
  onJLPTSessionAdded?: (session: JLPTSession) => void;
}
```

2. **Call callbacks in addStudySession/addGameSession/addJLPTSession:**
After successful Firestore write + state update, call the callback:
```ts
const addStudySession = useCallback(async (data) => {
  // ... existing logic ...
  const session = await firestoreService.addStudySession({ ...data, userId });
  setStudySessions(prev => [session, ...prev]);
  onStudySessionAdded?.(session);  // <-- NEW
}, [userId, onStudySessionAdded]);
```

3. **Wire in App.tsx:**
```tsx
const achievementCtx = useAchievementContext();

<UserDataProvider
  onStudySessionAdded={(s) => achievementCtx.onStudyCompleted(s.cardsStudied, s.duration)}
  onGameSessionAdded={(s) => achievementCtx.onGameCompleted(s.rank === 1)}
  onJLPTSessionAdded={(s) => achievementCtx.onJLPTCompleted(s.totalQuestions)}
>
```

**Wait -- UserDataProvider wraps everything including AchievementProvider.** This creates a dependency issue.

**Option B (Simpler): Achievement context watches user-data-context**

Since AchievementProvider is inside UserDataProvider:
- AchievementProvider calls `useUserData()` to get sessions/stats
- Uses `useEffect` to detect when sessions arrays change length
- On change, runs achievement checks + mission progress updates

```tsx
// In AchievementProvider
const { studySessions, gameSessions, jlptSessions, userStats, friendsWithUsers, badgeStats } = useUserData();

const prevStudyCount = useRef(studySessions.length);
useEffect(() => {
  if (studySessions.length > prevStudyCount.current) {
    const newSession = studySessions[0]; // Most recent
    onStudyCompleted(newSession.cardsStudied, newSession.duration);
  }
  prevStudyCount.current = studySessions.length;
}, [studySessions.length]);
// Same pattern for gameSessions, jlptSessions
```

**This is cleaner**: no changes to user-data-context.tsx at all. Achievement context observes session changes reactively.

**Decision: Use Option B.** Zero modifications to `user-data-context.tsx`.

---

## Integration Flow (Complete)

### Study Session
1. User completes flashcard study -> `addStudySession()` in user-data-context
2. `studySessions` array updates -> AchievementProvider detects length change
3. Achievement context: `updateMissionProgress('study_words', cardsStudied)` + `checkAchievements(assembledStats)`
4. If mission completed -> widget updates live, if all complete -> CelebrationOverlay
5. If achievement tier unlocked -> toast queue -> AchievementToast renders

### Game Session
1. User finishes game -> `addGameSession()`
2. AchievementProvider detects -> `updateMissionProgress('play_game', 1)` + check achievements
3. Same toast/celebration flow

### JLPT Practice
1. User completes JLPT quiz -> `addJLPTSession()`
2. AchievementProvider detects -> `updateMissionProgress('jlpt_practice', totalQuestions)` + check

### Grammar/Listening/Reading/Kanji
These don't currently go through user-data-context sessions. Two approaches:
- **Phase 4a**: Call achievement context directly from those page components
- **Phase 4b (future)**: Add session tracking for these modes to user-data-context

For now (Phase 4a), import `useAchievementContext` in:
- `grammar-study-page.tsx` -> call `onGrammarStudied(count)` when lesson completed
- `audio-player-page` -> call `onListeningCompleted(1)` when passage finished
- `reading-practice` -> call `onReadingCompleted(1)` when passage read
- `kanji-study-page.tsx` -> call `onKanjiStudied(count)` when kanji reviewed

These are lightweight additions: import context, call one function on completion.

---

## Files Summary

| File | Change Type | Scope |
|------|-------------|-------|
| `collections.ts` | Add 1 line | Trivial |
| `App.tsx` | Add provider + 2 lazy imports + render | Small |
| `home-page.tsx` | Add widget import + render + props | Small |
| `sidebar.tsx` | Add mission badge | Minimal |
| `user-data-context.tsx` | **No changes** (Option B) | None |
| `grammar-study-page.tsx` | Add 2 lines (import + call) | Minimal |
| `audio-player-page` | Add 2 lines | Minimal |
| `reading-practice` | Add 2 lines | Minimal |
| `kanji-study-page.tsx` | Add 2 lines | Minimal |

---

## Acceptance Criteria
- [ ] AchievementProvider wraps app content, positioned inside FlashcardDataProvider
- [ ] Global toast renders on any page when achievement unlocks
- [ ] Celebration overlay fires for all-missions-complete
- [ ] Daily missions widget visible on home page
- [ ] Sidebar shows mission progress badge on Home item
- [ ] Study/game/JLPT sessions auto-trigger achievement + mission checks
- [ ] Grammar/listening/reading/kanji pages call context on completion
- [ ] No circular dependencies between contexts
- [ ] No changes to user-data-context.tsx (Option B reactive approach)
