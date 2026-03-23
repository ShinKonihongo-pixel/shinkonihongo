# Phase 03: UI Components

## Goal
Build 4 visual components: toast notification, achievement showcase, daily missions widget, celebration overlay. All follow dark glassmorphism theme.

---

## Theme Reference (from MEMORY.md)
- Background: `linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)`
- Text: `rgba(255,255,255,*)` on dark bg
- Borders: `rgba(255,255,255,0.08-0.12)`
- Purple/pink accents: `#8b5cf6`, `#ec4899`
- Glass: `backdrop-filter: blur(12px)`
- Gradient divider: `height: 4px; background: linear-gradient(90deg, #8b5cf6, #ec4899);`

### CSS Prefix Convention
- `ach-` for achievement components
- `dm-` for daily missions
- `cel-` for celebration overlay

---

## Component 1: Achievement Toast

**Files:** `src/components/achievements/achievement-toast.tsx` + `.css`

**Behavior:**
- Renders from `pendingToast` in achievement context
- Slides in from bottom-right (mobile: bottom-center)
- Shows: tier badge color, achievement icon (Lucide), name, XP reward
- Auto-dismiss after 4 seconds, or click to dismiss
- Stacks: only one visible at a time; next appears after dismiss

**Layout:**
```
[icon] [achievement name]     [+20 XP]
       [tier badge: Bronze/Silver/Gold]
```

**CSS (`ach-toast-*`):**
- `ach-toast` -- fixed position bottom-right, z-index 1000
- `ach-toast-enter` / `ach-toast-exit` -- slide + fade animations
- Tier colors: bronze=#cd7f32, silver=#c0c0c0, gold=#ffd700
- Glass card background with blur
- Width: 320px desktop, 90vw mobile

**Props:**
```ts
interface AchievementToastProps {
  toast: AchievementToastItem | null;
  onDismiss: () => void;
}
```

**Implementation:**
- useEffect with 4s setTimeout for auto-dismiss
- CSS keyframes for enter/exit animation
- Render null if no toast

---

## Component 2: Achievement Showcase

**Files:** `src/components/achievements/achievement-showcase.tsx` + `.css`

**Behavior:**
- Full modal view of all achievements with progress
- Accessed via profile page or button on home page
- Grid layout: 2 columns on mobile, 3 on desktop
- Each card shows: icon, name, progress bar, tier badges (locked/unlocked)

**Card States:**
1. **Locked** -- grayed out, progress bar shows current/next threshold
2. **Bronze unlocked** -- bronze glow, progress toward silver shown
3. **Silver unlocked** -- silver glow, progress toward gold shown
4. **Gold unlocked** -- gold glow, sparkle effect, "MAX" label

**Layout per card:**
```
[icon]
[name Vi]
[name Jp]
[progress bar: current/next_threshold]
[tier badges: (bronze) (silver) (gold)]
```

**CSS (`ach-showcase-*`):**
- `ach-showcase-overlay` -- fullscreen modal backdrop
- `ach-showcase-grid` -- CSS grid, gap 12px
- `ach-showcase-card` -- glass card with tier-specific border glow
- `ach-showcase-progress` -- progress bar with gradient fill
- `ach-showcase-tier` -- small circles, filled when unlocked
- Category filter tabs at top

**Props:**
```ts
interface AchievementShowcaseProps {
  achievements: UserAchievementProgress[];
  isOpen: boolean;
  onClose: () => void;
}
```

**Implementation:**
- Map `ACHIEVEMENT_DEFINITIONS` with user progress overlay
- Category filter: all | learning | streak | games | social | mastery | special
- useCallback for filter changes
- Import Lucide icons dynamically based on achievement def icon string

---

## Component 3: Daily Missions Widget

**Files:** `src/components/achievements/daily-missions-widget.tsx` + `.css`

**Behavior:**
- Compact card displayed on home page (below DailyWordsTask)
- Shows today's 3-4 missions with progress bars
- Completion animation when mission done
- All-complete state shows bonus XP claim button

**Layout:**
```
[header: "Nhiem Vu Hang Ngay" | "Daily Missions"]
[mission 1: icon | title | progress bar | XP]
[mission 2: icon | title | progress bar | XP]
[mission 3: icon | title | progress bar | XP]
[mission 4: icon | title | progress bar | XP]
[footer: total XP earned today | bonus status]
```

**Mission Row States:**
- In progress: progress bar partially filled, "{current}/{target}"
- Completed: checkmark, green highlight, strikethrough-like muted style
- All complete: gold border on widget, "Bonus +50 XP!" banner

**CSS (`dm-*`):**
- `dm-widget` -- glass card matching home page style
- `dm-header` -- gradient divider below (purple->pink)
- `dm-mission` -- flex row with icon, text, bar, xp
- `dm-progress-bar` -- thin bar, gradient fill matching accent
- `dm-completed` -- green checkmark, subtle glow
- `dm-bonus` -- gold gradient banner, pulse animation
- Responsive: single column, full width on mobile

**Props:**
```ts
interface DailyMissionsWidgetProps {
  missions: DailyMission[];
  allCompleted: boolean;
  bonusClaimed: boolean;
  onClaimBonus: () => void;
}
```

---

## Component 4: Celebration Overlay

**Files:** `src/components/achievements/celebration-overlay.tsx` + `.css`

**Behavior:**
- Fullscreen overlay for major milestones:
  - All daily missions completed
  - Gold achievement unlocked
  - Level up (future: integrate with XP system)
- CSS-only confetti particles (no libraries)
- Auto-dismiss after 3 seconds, or tap to dismiss
- Shows relevant message + icon

**Trigger Types:**
```ts
type CelebrationReason = 'all_missions' | 'gold_achievement' | 'level_up';
```

**Layout:**
```
[fullscreen dark overlay with particles]
  [center content:]
    [large icon / emoji]
    [title: congratulation message]
    [subtitle: detail]
    [tap to dismiss]
```

**CSS (`cel-*`):**
- `cel-overlay` -- fixed fullscreen, z-index 2000, dark backdrop
- `cel-particles` -- 20-30 CSS-animated confetti pieces using @keyframes
  - Random colors: gold, pink, purple, cyan, white
  - `animation: cel-fall` with random delays and durations
  - `cel-particle-N` classes with nth-child variations
- `cel-content` -- centered, scale-in animation
- `cel-title` -- large text with text-shadow glow
- `cel-subtitle` -- smaller, muted
- Fade-out animation on dismiss

**Props:**
```ts
interface CelebrationOverlayProps {
  reason: CelebrationReason | null;
  detail?: string;  // e.g., achievement name
  onDismiss: () => void;
}
```

**Confetti Implementation (CSS-only):**
```css
.cel-particle {
  position: absolute;
  width: 8px; height: 8px;
  border-radius: 2px;
  animation: cel-fall 3s ease-in forwards;
}
@keyframes cel-fall {
  0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
/* Generate 25 particles with varying delays, positions, colors via nth-child */
```

---

## Acceptance Criteria
- [ ] Toast appears on achievement unlock, auto-dismisses after 4s
- [ ] Showcase shows all achievements with correct progress/tier states
- [ ] Daily missions widget renders on home page with live progress
- [ ] Celebration overlay shows confetti without JS animation libraries
- [ ] All components use dark glassmorphism theme
- [ ] All CSS uses correct prefix convention (ach-, dm-, cel-)
- [ ] Responsive: works on mobile (320px+) and desktop
- [ ] No CSS conflicts with existing components (prefixed classes)
