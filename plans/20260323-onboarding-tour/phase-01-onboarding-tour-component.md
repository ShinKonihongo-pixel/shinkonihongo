# Phase 01: Onboarding Tour Component

## Files to Create

### 1. `src/components/onboarding/onboarding-tour.tsx`

**Component: `OnboardingTour`**

Props:
```ts
interface OnboardingTourProps {
  onComplete: () => void;  // called when user finishes or skips
}
```

Internal state:
- `currentStep: number` (0-10)
- `direction: 'next' | 'prev'` (for animation direction)
- `swiping: boolean` + `swipeOffset: number` (touch tracking)

**Tour step data array** (defined in same file or separate `tour-steps.ts`):
```ts
interface TourStep {
  icon: LucideIcon;          // primary icon from lucide-react
  secondaryIcons?: LucideIcon[]; // supporting icons for illustration
  title: string;             // Vietnamese title
  subtitle: string;          // Japanese subtitle (e.g. "ホーム")
  description: string;       // Vietnamese description (2-3 sentences)
  accentColor: string;       // step accent color
  illustrationClass: string; // CSS class for custom illustration styling
}
```

Steps mapping (icon -> sidebar mapping):
| # | Icon | Accent | Title |
|---|------|--------|-------|
| 1 | Home | #3b82f6 | Trang chu |
| 2 | Layers | #8b5cf6 | Tu Vung |
| 3 | FileText | #a855f7 | Ngu Phap |
| 4 | BookOpen | #f59e0b | Han Tu |
| 5 | BookOpenCheck | #22c55e | Doc Hieu |
| 6 | Headphones | #06b6d4 | Nghe Hieu |
| 7 | ClipboardList | #f59e0b | Bai Tap |
| 8 | School | #ec4899 | Lop Hoc |
| 9 | Award | #22c55e | JLPT |
| 10 | MessageCircle | #8b5cf6 | Kaiwa |
| 11 | Gamepad2 | #ec4899 | Game |

**Component structure (JSX)**:
```
.ob-overlay                         // fixed fullscreen backdrop
  .ob-modal                         // centered card
    .ob-close                       // skip/close button (top-right)
    .ob-step-container              // overflow hidden, holds sliding steps
      .ob-step                      // individual step (translated via transform)
        .ob-illustration            // CSS illustration area
          .ob-illust-bg             // gradient circle bg
          .ob-illust-icon           // main icon
          .ob-illust-deco-*         // floating decorative icons
        .ob-step-content
          .ob-step-title
          .ob-step-subtitle         // Japanese
          .ob-step-description
    .ob-footer
      .ob-dots                      // progress indicator
        .ob-dot (.active)
      .ob-nav
        .ob-btn-prev               // "Truoc" (hidden on step 0)
        .ob-btn-next               // "Tiep theo" / "Bat dau!" on last
```

**Swipe logic**:
- `onPointerDown` -> record startX, set swiping=true
- `onPointerMove` -> calc deltaX, update swipeOffset (clamped)
- `onPointerUp` -> if |deltaX| > 50px, advance/retreat; else snap back
- CSS: `transform: translateX(calc(-${currentStep * 100}% + ${swipeOffset}px))`

**Keyboard**: ArrowLeft/ArrowRight for prev/next, Escape to skip

### 2. `src/components/onboarding/onboarding-tour.css`

**Theme** (dark glassmorphism from MEMORY.md):
- Overlay: `background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(8px)`
- Modal bg: `linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)`
- Glass card borders: `border: 1px solid rgba(255,255,255,0.1)`
- Text: `rgba(255,255,255,0.9)` primary, `rgba(255,255,255,0.6)` secondary
- Accent gradient: `linear-gradient(135deg, #8b5cf6, #ec4899)` for buttons and active dots

**CSS Illustrations** (per step):
- Each step gets a `ob-illust-{step}` class
- Base: large circle with radial gradient using step's accentColor
- Main icon centered, 48px, white
- 2-3 smaller decorative icons floating around with subtle animation
- Use `@keyframes ob-float` for gentle up/down movement on deco icons

**Animations**:
```css
@keyframes ob-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes ob-slide-in {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes ob-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
```

**Step transition**: `transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)`

**Progress dots**:
- Inactive: `8px` circle, `rgba(255,255,255,0.2)`
- Active: `24px` pill shape, gradient fill `#8b5cf6 -> #ec4899`
- Transition: `width 0.3s, background 0.3s`

**Responsive (mobile < 640px)**:
- Modal: `width: 100%; height: 100%; border-radius: 0` (fullscreen)
- Illustration scales down
- Description font slightly smaller

**Responsive (desktop > 640px)**:
- Modal: `max-width: 440px; max-height: 85vh; border-radius: 20px`

## Files to Modify

### 3. `src/App.tsx`

**Changes in `AppContent` function**:

Add state:
```ts
const [showOnboarding, setShowOnboarding] = useState(false);
```

Add effect (after existing JLPT modal effect, ~line 366):
```ts
useEffect(() => {
  if (currentUser && !showJlptLevelModal) {
    const seen = localStorage.getItem('shinko_onboarding_seen');
    if (!seen) setShowOnboarding(true);
  }
}, [currentUser, showJlptLevelModal]);
```

Add lazy import at top:
```ts
const OnboardingTour = lazy(() => import('./components/onboarding/onboarding-tour').then(m => ({ default: m.OnboardingTour })));
```

Add render (after JLPTLevelModal block, ~line 871):
```tsx
{showOnboarding && (
  <Suspense fallback={null}>
    <OnboardingTour onComplete={() => {
      localStorage.setItem('shinko_onboarding_seen', 'true');
      setShowOnboarding(false);
    }} />
  </Suspense>
)}
```

**Note**: onboarding shows AFTER JLPT level modal dismissed (guarded by `!showJlptLevelModal`).

### 4. `src/components/pages/home-page.tsx`

**Add prop**: `onShowTour?: () => void`

**Add button** in the activities section (after ACTIVITIES grid, ~line 332):
```tsx
<button className="hp-tour-btn" onClick={onShowTour}>
  <Sparkles size={16} />
  Huong dan su dung
</button>
```

**CSS** (add to `home.css`):
```css
.hp-tour-btn { /* ghost button style matching hp theme */ }
```

**Wire up in App.tsx**: Pass `onShowTour={() => setShowOnboarding(true)}` to HomePage.

## Implementation Order
1. Create `onboarding-tour.css` - all styles first
2. Create `onboarding-tour.tsx` - component + step data
3. Modify `App.tsx` - lazy import, state, effect, render
4. Modify `home-page.tsx` - add prop + re-trigger button
5. Test: first-login auto-show, dismiss, re-trigger from home, swipe, keyboard, mobile

## Acceptance Criteria
- [ ] Tour shows automatically on first login (after JLPT modal if applicable)
- [ ] Tour does NOT show on subsequent logins (localStorage persisted)
- [ ] All 11 steps render with correct icon, title, description
- [ ] Swipe left/right navigates between steps
- [ ] Arrow keys and button clicks navigate
- [ ] Progress dots reflect current step
- [ ] "Bat dau!" on last step closes tour and sets localStorage
- [ ] Skip button (X) closes tour and sets localStorage
- [ ] "Huong dan" button on home page re-opens tour
- [ ] Dark glassmorphism theme consistent with app
- [ ] Responsive: fullscreen on mobile, centered card on desktop
- [ ] CSS illustrations render correctly per step
- [ ] Smooth slide transitions between steps
