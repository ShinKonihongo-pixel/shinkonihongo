# Phase 6: Integration

**Parent**: [plan.md](./plan.md)
**Dependencies**: Phase 4 (UI components), Phase 5 (styling)
**Date**: 2026-02-27 | **Priority**: High | **Status**: Pending

## Overview

Wire Kanji Drop into the Game Hub: add to GameType union, add GAMES entry, add lazy import + render in game-hub-page, and pass kanjiCards data through the component tree.

## Key Insights

- 3 existing files modified, no new shared files
- `kanjiCards` is available in `App.tsx` from `FlashcardDataProvider` but NOT currently passed to `GameHubPage`. Need to add it as a new prop.
- Pattern: lazy import at top of game-hub-page, conditional render in the Suspense block
- No setup modal needed -- Kanji Drop handles its own setup screen internally (like ai-challenge)
- No multiplayer -- no room/lobby/Firebase code needed

## Requirements

1. Add `'kanji-drop'` to `GameType` union in `src/types/game-hub.ts`
2. Add GAMES entry for kanji-drop with icon, color, gradient, category
3. Add `kanjiCards` optional prop to `GameHubPageProps`
4. Pass `kanjiCards` from `App.tsx` to `GameHubPage`
5. Add lazy import for KanjiDropPage in game-hub-page.tsx
6. Add render case for `selectedGame === 'kanji-drop'`
7. No setup modal case needed (game has internal setup)

## Architecture

### Modification 1: `src/types/game-hub.ts`

```diff
- export type GameType = 'quiz' | 'golden-bell' | 'picture-guess' | 'bingo' | 'kanji-battle' | 'word-match' | 'ai-challenge' | 'image-word' | 'word-scramble';
+ export type GameType = 'quiz' | 'golden-bell' | 'picture-guess' | 'bingo' | 'kanji-battle' | 'word-match' | 'ai-challenge' | 'image-word' | 'word-scramble' | 'kanji-drop';
```

Add GAMES entry (after word-scramble):

```typescript
  'kanji-drop': {
    id: 'kanji-drop',
    name: 'Kanji Drop',
    description: 'Xếp kanji vào hàng, gom nhóm và tiêu diệt!',
    icon: '🀄',
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 50%, #C4B5FD 100%)',
    playerRange: '1',
    features: ['Nhiều màn chơi', 'Power-ups', 'Xếp hạng cấp độ'],
    difficulty: 'medium',
    isNew: true,
    category: 'puzzle',
  },
```

### Modification 2: `src/components/pages/game-hub-page.tsx`

Add import at top (with other lazy imports, line ~95):

```typescript
const KanjiDropPage = lazy(() => import('./kanji-drop-page').then(m => ({ default: m.KanjiDropPage })));
```

Add to `GameHubPageProps` interface:

```diff
  interface GameHubPageProps {
    currentUser: CurrentUser | null;
    flashcards: Flashcard[];
+   kanjiCards?: import('../../types/kanji').KanjiCard[];
    jlptQuestions: JLPTQuestion[];
    // ... rest unchanged
  }
```

Add to props destructuring:

```diff
  export function GameHubPage({
    currentUser,
    flashcards,
+   kanjiCards = [],
    jlptQuestions,
    // ... rest
  }: GameHubPageProps) {
```

Add render case inside `<Suspense>` block (after word-scramble, before closing `</Suspense>`):

```typescript
      {selectedGame === 'kanji-drop' && (
        <KanjiDropPage
          onClose={handleBackToHub}
          kanjiCards={kanjiCards}
          currentUser={{
            id: currentUser.id,
            displayName: currentUser.displayName || currentUser.username,
            avatar: currentUser.avatar || '🀄',
            role: currentUser.role,
          }}
          onSaveGameSession={onSaveGameSession}
        />
      )}
```

Note: No setup modal case needed in `renderSetupModal()` -- kanji-drop uses internal setup like ai-challenge. When user clicks the game card, it goes directly to the game page which shows its own setup screen.

### Modification 3: `src/App.tsx`

Pass kanjiCards to GameHubPage:

```diff
          <GameHubPage
            currentUser={currentUser}
            flashcards={cards}
+           kanjiCards={kanjiCards}
            jlptQuestions={jlptQuestions}
            getLessonsByLevel={filteredGetLessonsByLevel}
            // ... rest unchanged
          />
```

`kanjiCards` is already destructured from `useFlashcardData()` at line ~302.

## Related Code Files

| File | Lines | Change |
|------|-------|--------|
| `src/types/game-hub.ts` | L4, L199-211 | Add union member + GAMES entry |
| `src/components/pages/game-hub-page.tsx` | L95, L107, L126, L483 | Lazy import, prop, destructure, render |
| `src/App.tsx` | L718 | Pass kanjiCards prop |

## Implementation Steps

1. Add `'kanji-drop'` to GameType union (game-hub.ts:L4)
2. Add GAMES record entry for kanji-drop (game-hub.ts:L211+)
3. Add `kanjiCards` to GameHubPageProps interface (game-hub-page.tsx)
4. Add `kanjiCards` to props destructuring with default `[]`
5. Add lazy import for KanjiDropPage
6. Add conditional render for `selectedGame === 'kanji-drop'`
7. Pass `kanjiCards` in App.tsx GameHubPage usage
8. Verify TypeScript compilation
9. Test: click Kanji Drop card in game hub -> setup screen shows -> play -> result -> back to hub

## Todo

- [ ] Modify game-hub.ts (GameType union + GAMES entry)
- [ ] Modify game-hub-page.tsx (import + prop + render)
- [ ] Modify App.tsx (pass kanjiCards)
- [ ] Verify end-to-end flow works
- [ ] Verify game appears in Game Hub grid with correct icon/color

## Success Criteria

- Kanji Drop appears in Game Hub game selector with purple gradient and "New" badge
- Clicking Kanji Drop card enters the game page
- Setup screen shows available kanji from selected JLPT levels
- Full game flow works: setup -> play -> result -> back to hub
- Game session saves for XP tracking
- No TypeScript errors
- No console errors

## Risk Assessment

- **Breaking existing games**: minimal risk -- only adds new union member + new render case. No modification to existing game logic.
- **kanjiCards undefined**: mitigated by default value `[]` in destructuring. Setup screen shows 0 available kanji and disables start button.
- **Import path**: KanjiDropPage exports from `./kanji-drop-page` (same directory level as word-scramble-page.tsx)

## Security Considerations

- No new attack surface -- follows existing patterns exactly
- kanjiCards data is read-only in game context

## Next Steps

After Phase 6: end-to-end testing, polish animations, and QA.
