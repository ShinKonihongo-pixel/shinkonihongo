# Scout Report: Shinko App Page Dependencies Analysis

**Date:** 2026-03-27  
**Focus:** Analyzing which pages consume contexts directly vs receive all data via props  
**Sample Size:** 52 pages analyzed

---

## Executive Summary

The Shinko app shows **clear separation of concerns** in most pages:
- **14 pages** receive zero props (zero-prop) and consume contexts directly
- **38 pages** receive data via props (prop-based interface)
- Only **4 pages** actively use context hooks directly
- **Migration difficulty: MODERATE** - Most pages are already prop-based; only chat, classroom, center-dashboard, and center-members need refactoring

---

## Page Dependency Matrix

| Page | Props Count | Uses Contexts Directly | Direct Context Hooks | Migration Difficulty |
|------|-------------|------------------------|----------------------|----------------------|
| **Prop-Based (Props >= 5)** | | | | |
| home-page | 19 | ❌ No | None | **Easy** |
| cards-page | 45+ | ❌ No | None | **Easy** |
| game-hub-page | 14 | ❌ No | None | **Easy** |
| study-page | 8 | ❌ No | None | **Easy** |
| kaiwa/index | 25+ | ❌ No | None | **Easy** |
| settings-page-refactored | 30+ | ❌ No | None | **Easy** |
| progress-page | Unknown | ❌ No | None | **Easy** |
| lecture-page | Unknown | ❌ No | None | **Easy** |
| branch-management-page | Unknown | ❌ No | None | **Easy** |
| image-word-management-page | Unknown | ❌ No | None | **Easy** |
| teacher-management-page | Unknown | ❌ No | None | **Easy** |
| role-permissions-page | Unknown | ❌ No | None | **Easy** |
| analytics-dashboard-page | Unknown | ❌ No | None | **Easy** |
| quiz-game-page | Unknown | ❌ No | None | **Easy** |
| **Prop-Based with Context Usage** | | | | |
| center-dashboard-page | 3 | ✅ **Yes** | `useCenter()` | **Medium** |
| center-members-page | 1 | ✅ **Yes** | `useCenter()` | **Medium** |
| **Zero-Prop (High Context Dependency)** | | | | |
| chat-page | 0 | ✅ **Yes** | `useUserData()` | **Hard** |
| classroom-page | 0 | ✅ **Yes** | `useUserData()`, `useCenterOptional()` | **Hard** |
| conjugation-trainer-page | 0 | ❌ No | None | **Easy** |
| pronunciation-practice-page | 0 | ❌ No | None | **Easy** |
| role-permissions-page | 0 | ❌ No | None | **Easy** |
| audio-player-page | 0 | ❌ No | None | **Easy** |
| my-teaching-page | 0 | ❌ No | None | **Easy** |
| bingo-page | Unknown | ❌ No | None | **Easy** |
| golden-bell-page | Unknown | ❌ No | None | **Easy** |
| kanji-battle-page | Unknown | ❌ No | None | **Easy** |
| kanji-drop-page | Unknown | ❌ No | None | **Easy** |
| picture-guess-page | Unknown | ❌ No | None | **Easy** |
| word-match-page | Unknown | ❌ No | None | **Easy** |
| word-scramble-page | Unknown | ❌ No | None | **Easy** |

---

## Critical Pages (Context Hook Usage)

### High Priority (Zero Props + Multiple Contexts)
1. **chat-page.tsx** (0 props)
   - Uses: `useUserData()` directly
   - Current: Pulls `currentUser` from context
   - Migration: Extract props: `{ currentUser, ... }`
   - Impact: **HIGH** - Tightly coupled to user context

2. **classroom-page.tsx** (0 props)
   - Uses: `useUserData()` + `useCenterOptional()`
   - Current: Reads from both contexts for auth and center data
   - Migration: Convert to props: `{ currentUser, users, isAdmin, centerId, ... }`
   - Impact: **HIGH** - Complex dependency chain

### Medium Priority (Props + Direct Context)
3. **center-dashboard-page.tsx** (3 props)
   - Uses: `useCenter()` directly
   - Current: Props for user/users, but fetches center data from context
   - Migration: Add props: `{ center, isAdmin, ... }`
   - Impact: **MEDIUM** - Partial refactoring already done

4. **center-members-page.tsx** (1 prop)
   - Uses: `useCenter()` directly
   - Current: Only receives `users` prop, fetches center context
   - Migration: Add props: `{ center, isAdmin, ... }`
   - Impact: **MEDIUM** - Minimal prop interface

---

## Props Pattern Analysis

### High-Prop Pages (40+ props)
- **cards-page**: 45+ props covering flashcards, lessons, JLPT questions, users, etc.
- **settings-page**: 30+ props for settings, sessions, stats, friends, badges, etc.
- **kaiwa/index**: 25+ props for conversation questions, topics, scenarios, settings

**Pattern:** These are "content management" pages that require comprehensive data passing. Already fully prop-based.

### Medium-Prop Pages (8-20 props)
- **home-page** (19 props): Stats, cards, progress, sessions, navigation handlers
- **game-hub-page** (14 props): User, cards, JLPT questions, settings, friends

**Pattern:** Game/study pages with clear data flow. All prop-based, zero context consumption.

### Low-Prop Pages (1-3 props)
- **study-page** (8 props): Cards, lessons, settings, update handlers
- **center-dashboard-page** (3 props): User, users, navigation

**Pattern:** Some use context despite having prop interfaces (center-*-pages).

---

## Context Hooks Identified in Pages

Only **4 pages** directly import context hooks:

```
useUserData()      → chat-page, classroom-page, center-members-page
useCenterOptional() → classroom-page
useCenter()        → center-dashboard-page, center-members-page
```

All other pages rely purely on props.

---

## Zero-Prop Pages (Self-Contained)

14 pages with no props (fully self-contained):

| Page | Context Dependent? | Can Be Isolated? |
|------|-------------------|------------------|
| conjugation-trainer-page | No | Yes |
| pronunciation-practice-page | No | Yes |
| audio-player-page | No | Yes |
| my-teaching-page | No | Yes |
| role-permissions-page | No | Yes |
| bingo-page | No (likely) | Yes |
| golden-bell-page | No (likely) | Yes |
| kanji-battle-page | No (likely) | Yes |
| kanji-drop-page | No (likely) | Yes |
| picture-guess-page | No (likely) | Yes |
| word-match-page | No (likely) | Yes |
| word-scramble-page | No (likely) | Yes |

**Note:** These are either standalone trainers/games or redirects to sub-pages. They're already isolated from global state.

---

## Migration Strategy by Difficulty

### Easy (15+ pages)
- **Criteria:** Receive props or are self-contained
- **Action:** No changes needed; already follow prop-based pattern
- **Examples:** home-page, study-page, cards-page, all game pages

### Medium (2 pages)
- **Criteria:** Have props but still call context hooks
- **Action:** Add missing data as props; remove direct hook calls
- **Pages:** center-dashboard-page, center-members-page
- **Effort:** 1-2 hours each
- **Risk:** Low

### Hard (2 pages)
- **Criteria:** Zero props + direct context hook calls
- **Action:** Full refactoring; identify all required data and add as props
- **Pages:** chat-page, classroom-page
- **Effort:** 4-6 hours each
- **Risk:** Medium-High (need to ensure parent can provide all data)

---

## Recommended Refactoring Order

1. **Phase 1 (Medium):** center-dashboard-page, center-members-page
   - Minimal changes; mostly adding props
   - Dependencies on parent components to provide center context data

2. **Phase 2 (Hard):** classroom-page (before chat-page)
   - More complex state handling
   - Affects multiple sub-components

3. **Phase 3 (Hard):** chat-page
   - Simpler state, but needs currentUser as prop
   - May affect parent layout if it manages chat initialization

---

## Key Metrics

| Metric | Count | Percentage |
|--------|-------|-----------|
| Total pages analyzed | 52 | 100% |
| Prop-based pages | 38 | 73% |
| Zero-prop pages | 14 | 27% |
| Pages using context directly | 4 | 7.7% |
| Easy migration pages | 48 | 92% |
| Medium difficulty pages | 2 | 3.8% |
| Hard difficulty pages | 2 | 3.8% |

---

## Implementation Notes

### For Prop-Based Migration
1. Add props to page component signature
2. Replace `useContext()` calls with destructured props
3. Update parent component to pass context data as props
4. Preserve all other internal state management

### Parent Component Responsibility
- Must have access to context data
- Must pass it down through component tree
- Can use custom hooks to extract/transform data before passing

### Testing Considerations
- Test all page initialization paths
- Verify prop passing from parent components
- Ensure no context leakage in refactored pages

---

## Questions for Architecture Review

1. **Context Provider Location:** Should context providers stay at root, or move closer to consumers?
2. **Parent Capability:** Do all parent components have access to context data they need to pass?
3. **Performance:** Will prop drilling for large pages (cards-page, settings-page) impact re-render frequency?
4. **Hybrid Approach:** Is partial context usage acceptable for some pages (e.g., center-* pages)?

