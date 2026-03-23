# Onboarding Tour Feature

## Overview
Modal overlay component introducing app features step-by-step to new users. Dark glassmorphism theme, Vietnamese UI, swipeable steps with CSS illustrations using lucide-react icons.

## Status
| Phase | Description | Status |
|-------|-------------|--------|
| 01 | Onboarding Tour Component | Not Started |

## Architecture
- **New files**: `src/components/onboarding/onboarding-tour.tsx`, `onboarding-tour.css`
- **Modified files**: `src/App.tsx` (render after login), `src/components/pages/home-page.tsx` (re-trigger button)
- **Storage**: `localStorage` key `shinko_onboarding_seen` (matches existing `shinko_*` pattern from use-settings.ts)

## Integration Points
1. `AppContent` component - show tour when `currentUser` exists AND localStorage flag not set AND JLPT modal not showing
2. `HomePage` - add "Huong dan" button in hero section or activities section to re-open tour
3. Tour covers 11 features matching sidebar nav items (learningItems + managementItems)

## Tour Steps (11)
1. Trang chu (Home) - Dashboard overview
2. Tu Vung (Vocabulary) - Flashcard study
3. Ngu Phap (Grammar) - Grammar study
4. Han Tu (Kanji) - Kanji study + HanziWriter
5. Doc Hieu (Reading) - Reading practice
6. Nghe Hieu (Listening) - Listening practice
7. Bai Tap (Exercises) - Practice exercises
8. Lop Hoc (Classroom) - Virtual classroom
9. JLPT - JLPT preparation
10. Kaiwa (会話) - Conversation practice
11. Game - Game hub with Quiz Battle

## Tech Decisions
- CSS-only illustrations (gradients, shadows, icon compositions) - no image assets
- Touch swipe via pointer events (pointerdown/pointermove/pointerup)
- Step transitions via CSS `transform: translateX()` with `transition`
- Single self-contained component, no external dependencies beyond lucide-react

## Phase Details
- [Phase 01: Onboarding Tour Component](./phase-01-onboarding-tour-component.md)
