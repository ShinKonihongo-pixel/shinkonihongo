# Design Guidelines - Room Modal System

## Overview

This document describes the unified Room Modal Design System used across all game room creation screens, classroom modals, and quiz game creation forms.

## Design Philosophy

- **Dark Gaming Theme**: Deep purple (#0F0F23) background with vibrant purple (#7C3AED) accents
- **Glass Morphism**: Subtle transparency and blur effects for depth
- **Consistent UX**: All modals follow the same structure and interaction patterns
- **Mobile-First**: Responsive design that works on all screen sizes

## Color Palette

### Primary Colors
| Variable | Hex | Usage |
|----------|-----|-------|
| `--rm-primary` | #7C3AED | Primary accent, buttons, active states |
| `--rm-primary-light` | #A78BFA | Hover states, icons |
| `--rm-primary-dark` | #5B21B6 | Pressed states |
| `--rm-secondary` | #06B6D4 | Secondary accent (cyan) |
| `--rm-accent` | #F43F5E | CTA, warnings |
| `--rm-success` | #10B981 | Success states |
| `--rm-warning` | #F59E0B | Warning states |

### Backgrounds
| Variable | Value | Usage |
|----------|-------|-------|
| `--rm-bg-dark` | #0F0F23 | Modal background |
| `--rm-bg-card` | rgba(15, 15, 35, 0.8) | Card backgrounds |
| `--rm-bg-glass` | rgba(124, 58, 237, 0.08) | Glass effect |
| `--rm-bg-input` | rgba(255, 255, 255, 0.05) | Input backgrounds |
| `--rm-bg-hover` | rgba(124, 58, 237, 0.15) | Hover states |

### Text Colors
| Variable | Hex | Usage |
|----------|-----|-------|
| `--rm-text` | #E2E8F0 | Primary text |
| `--rm-text-muted` | #94A3B8 | Secondary text |
| `--rm-text-dim` | #64748B | Hint text |

### JLPT Level Colors
| Level | Color |
|-------|-------|
| N5 | #22c55e (Green) |
| N4 | #06b6d4 (Cyan) |
| N3 | #3b82f6 (Blue) |
| N2 | #8b5cf6 (Purple) |
| N1 | #f59e0b (Amber) |

## Component Structure

### Modal Layout
```
.rm-overlay          (Backdrop with blur)
└── .rm-modal        (Modal container)
    ├── .rm-header   (Header with icon, title, close button)
    ├── .rm-body     (Scrollable content area)
    └── .rm-footer   (Action buttons)
```

### CSS Class Naming Convention
All classes use the `rm-` prefix (Room Modal):
- `.rm-overlay` - Modal backdrop
- `.rm-modal` - Modal container
- `.rm-header` - Modal header
- `.rm-body` - Modal body
- `.rm-footer` - Modal footer
- `.rm-field` - Form field wrapper
- `.rm-label` - Field label
- `.rm-input` - Text input
- `.rm-pills` - Pill button group
- `.rm-pill` - Individual pill button
- `.rm-slider` - Range slider
- `.rm-toggle-row` - Toggle switch row
- `.rm-toggle-btn` - Toggle switch button
- `.rm-preview` - Preview card
- `.rm-btn` - Button base class
- `.rm-error` - Error message
- `.rm-success` - Success message

## Components

### 1. Overlay
```css
.rm-overlay {
  backdrop-filter: blur(8px);
  animation: rm-fade-in 0.3s ease;
}
```

### 2. Modal Container
```css
.rm-modal {
  max-width: 520px;
  border-radius: 20px;
  animation: rm-slide-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.rm-modal.large {
  max-width: 640px;
}
```

### 3. Header
Contains:
- Back button (optional)
- Icon with gradient background
- Title and subtitle
- Close button

### 4. Form Fields
- Text inputs with focus glow effect
- Range sliders with progress fill
- Pill buttons for selection (single/multi)
- Toggle switches for boolean options

### 5. Pill Buttons
```jsx
<div className="rm-pills">
  <button className="rm-pill active">Option 1</button>
  <button className="rm-pill">Option 2</button>
</div>
```

Sizes: `.sm`, default, `.lg`

### 6. Toggle Switch
```jsx
<div className="rm-toggle-row">
  <div className="rm-toggle-info">
    <span className="rm-toggle-icon">{icon}</span>
    <div className="rm-toggle-text">
      <span className="rm-toggle-label">Label</span>
      <span className="rm-toggle-desc">Description</span>
    </div>
  </div>
  <button className="rm-toggle-btn active" />
</div>
```

### 7. Buttons
```jsx
<button className="rm-btn rm-btn-primary">Primary</button>
<button className="rm-btn rm-btn-ghost">Cancel</button>
<button className="rm-btn rm-btn-accent">Accent</button>
<button className="rm-btn rm-btn-success">Success</button>
```

Full width: Add `.rm-btn-lg`

### 8. Preview Card
```jsx
<div className="rm-preview">
  <div className="rm-preview-header">
    <span className="rm-preview-icon">{icon}</span>
    <div className="rm-preview-title">
      <span className="rm-preview-name">Room Name</span>
      <span className="rm-preview-game">Game Type</span>
    </div>
  </div>
  <div className="rm-preview-stats">
    <div className="rm-preview-stat">
      <Icon size={14} />
      <span>Value</span>
    </div>
  </div>
</div>
```

## Animations

### Fade In
```css
@keyframes rm-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### Slide Up
```css
@keyframes rm-slide-up {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

### Error Shake
```css
@keyframes rm-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
```

## Responsive Design

### Mobile (< 640px)
- Modal slides up from bottom
- Full width with rounded top corners
- Footer buttons stack vertically
- Day grid uses smaller padding

```css
@media (max-width: 640px) {
  .rm-overlay {
    align-items: flex-end;
  }

  .rm-modal {
    border-radius: 20px 20px 0 0;
    animation: rm-slide-up-mobile;
  }
}
```

## Usage Examples

### GameRoomSetup
```tsx
<GameRoomSetup
  gameType="bingo"
  config={BINGO_SETUP_CONFIG}
  onCreateRoom={handleCreate}
  onBack={handleBack}
  loading={isLoading}
  error={errorMessage}
/>
```

### ClassroomCreateModal
```tsx
<ClassroomCreateModal
  isOpen={isOpen}
  onClose={handleClose}
  onSave={handleSave}
  classroom={editingClassroom}
/>
```

### GameCreate (Quiz)
```tsx
<GameCreate
  flashcards={flashcards}
  jlptQuestions={jlptQuestions}
  getLessonsByLevel={getLessonsByLevel}
  getChildLessons={getChildLessons}
  onCreateGame={handleCreate}
  onCancel={handleCancel}
  loading={isLoading}
  error={errorMessage}
  gameSettings={settings}
/>
```

## Files

| File | Purpose |
|------|---------|
| `src/App.css` (lines 75591+) | CSS variables and styles |
| `src/components/game-hub/game-room-setup.tsx` | Unified game room setup |
| `src/components/classroom/classroom-create-modal.tsx` | Classroom modal |
| `src/components/quiz-game/game-create.tsx` | Quiz game creation |

## Version History

- **v1.0** (2026-01-30): Initial unified design system
  - Glass morphism dark theme
  - Consistent spacing and typography
  - Mobile-first responsive design
  - Smooth animations and micro-interactions
