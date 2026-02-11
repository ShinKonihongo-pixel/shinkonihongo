# Settings & Profile Pages - Complete File Inventory

## Project Stack
- **Framework**: React 19.2 + TypeScript 5.9 + Vite 7.2
- **UI Library**: Lucide React (icon library)
- **Styling**: Custom CSS (no shadcn/ui or Tailwind in dependencies)
- **Navigation**: Direct page routing via currentPage state in App.tsx

---

## Main Page Files

### Core Settings Pages
1. **Main Settings Page (Entry Point)**
   - `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings-page-refactored.tsx`
   - Thin wrapper orchestrating modular components
   - Imports all sub-components and manages prop distribution

2. **Legacy Settings Page (Backup)**
   - `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings-page.tsx`
   - Index file that exports settings-page-refactored
   - Used as re-export for backwards compatibility

---

## Settings Sub-Components (Modular Architecture)

All located in `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/`

### Main Tab Components
- **settings-tabs.tsx** - Tab navigation (General, Profile, Friends)
- **settings-sub-tabs.tsx** - Sub-tabs within General tab
- **settings-header.tsx** - Page header component

### Feature Components
- **flashcard-settings.tsx** - Card appearance, fonts, flip styles, backgrounds, frames
- **flashcard-settings-preview.tsx** - Live flashcard preview
- **flashcard-settings-background.tsx** - Background/gradient picker
- **flashcard-settings-frame.tsx** - Frame/border style selector
- **study-settings.tsx** - Weekly goals, daily word targets
- **grammar-settings.tsx** - Grammar card display options (front/back)
- **game-settings.tsx** - Game question/answer content settings
- **game-settings-basic.tsx** - Basic game configuration
- **game-settings-jlpt.tsx** - JLPT-specific game settings
- **game-settings-ai.tsx** - AI difficulty levels per character (27 AI profiles)
- **game-settings-sources.tsx** - Question source filtering
- **kaiwa-settings.tsx** - Conversation practice (voice, auto-speak, suggestions)
- **listening-settings.tsx** - Listening practice configuration
- **system-settings.tsx** - Theme, import/export, system preferences

### Profile & Social Components
- **profile-section.tsx** - User profile display/editing
- **friends-section.tsx** - Friends list, pending requests, badges

### Utilities & Support
- **settings-constants.ts** - Constants for settings UI
- **settings-types.ts** - TypeScript interfaces (SettingsPageProps, tab types, etc.)
- **settings-utils.ts** - Utility functions for settings logic
- **settings-sound-panel.tsx** - Game sound settings

### Custom Hooks
- **hooks/use-settings-state.ts** - Manages UI state (active tabs, categories, filters)
- **hooks/use-profile-handlers.ts** - Profile edit handlers (name, password, avatar, background, level)

### Exports
- **index.ts** - Module exports (types, constants, utilities, components)

---

## Profile-Related Files

### Profile Section Component
- `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/profile-section.tsx`
  - Displays user avatar, name, JLPT level
  - Handles avatar selection from AVATAR_CATEGORIES
  - Shows user stats (level calculation via calculateUserLevel)

### Profile Hooks & Utilities
- Profile handlers in `hooks/use-profile-handlers.ts`
- Avatar utilities at `/Users/admin/Documents/名称未設定フォルダ/src/utils/avatar-icons.ts`
- User type definitions at `/Users/admin/Documents/名称未設定フォルダ/src/types/user.ts`

---

## Settings Management System

### Core Settings Hook
- `/Users/admin/Documents/名称未設定フォルダ/src/hooks/use-settings.ts`
  - **Purpose**: Global settings management with localStorage persistence
  - **Features**:
    - AppSettings interface (198 configuration fields)
    - Card flip styles (horizontal, vertical, fade, slide, zoom, swing, flip-up, airplane, crumple, flyaway, none)
    - Font sizes (desktop & mobile variants)
    - Card background types (gradient, solid, image)
    - Card frames (40+ preset styles)
    - Game content settings
    - Kaiwa conversation settings
    - AI Challenge settings (27 AI profiles with difficulty modifiers)
    - JLPT practice settings
    - Grammar card display toggles

### Theme Management Hook
- Also in `use-settings.ts`
  - `useGlobalTheme()` - Global theme for super_admin users
  - 15+ theme presets (color schemes)
  - CSS variable application (--primary, --primary-dark)
  - Body gradient customization

### Settings Contexts
- `/Users/admin/Documents/名称未設定フォルダ/src/contexts/reading-settings-context.tsx` - Reading practice settings
- `/Users/admin/Documents/名称未設定フォルダ/src/contexts/listening-settings-context.tsx` - Listening practice settings

---

## Router & Navigation

### Routing Configuration
- **Main App Router**: `/Users/admin/Documents/名称未設定フォルダ/src/App.tsx`
  - Lines 645-650: Settings/Profile page routing
  - `currentPage === 'settings' || currentPage === 'profile'` → SettingsPage
  - `initialTab={currentPage === 'profile' ? 'profile' : undefined}`
  - Indirect routing: Users click "Settings" or "Profile" in sidebar → setCurrentPage() → page renders

### Sidebar Navigation
- `/Users/admin/Documents/名称未設定フォルダ/src/components/layout/sidebar.tsx`
  - Sidebar buttons trigger page navigation
  - Settings icon navigates to settings page

### Page Types
- `/Users/admin/Documents/名称未設定フォルダ/src/components/layout/header.tsx`
  - Page type definition includes 'settings' and 'profile'

---

## Type Definitions

### Main Types File
- `/Users/admin/Documents/名称未設定フォルダ/src/types/user.ts`
  - CurrentUser interface
  - User interface
  - UserStats, StudySession, GameSession, JLPTSession
  - calculateUserLevel() function

### Settings Types
- `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/settings-types.ts`
  - SettingsPageProps (main settings page props interface)
  - SettingsTab type ('general' | 'profile' | 'friends')
  - GeneralSubTab type (7 sub-tabs)
  - Device type ('desktop' | 'tablet' | 'mobile')
  - Individual component prop interfaces (FlashcardSettingsProps, etc.)

---

## UI Library & Styling

### Icons
- **lucide-react** (v0.562.0)
  - Used in Settings: Settings, Home, Layers, Gamepad2, Award, etc.
  - Import pattern: `import { IconName } from 'lucide-react'`

### Styling Approach
- **Custom CSS** (no Tailwind in dependencies)
- CSS files paired with components:
  - Settings components likely have corresponding `.css` files
  - Main app stylesheet: `/Users/admin/Documents/名称未設定フォルダ/src/App.css`

### No UI Component Library
- No shadcn/ui, Material-UI, Ant Design, etc.
- Custom HTML elements styled with CSS
- Input elements, buttons, modals all custom-built

---

## Integration Points

### Props Chain (App.tsx → SettingsPage)
```
App.tsx (lines 645-716)
  → SettingsPage
    → Settings hooks (useSettings, useGlobalTheme)
    → Auth callbacks (updateDisplayName, changePassword, updateAvatar, etc.)
    → Data (flashcards, lessons, users, friends, badges)
    → Theme management
```

### Settings Update Flow
1. User interacts with settings component
2. Component calls `onUpdateSetting(key, value)`
3. Hook updates state → localStorage sync
4. Component re-renders with new value

### Profile Update Flow
1. User edits profile (name, password, avatar, etc.)
2. Component calls handler (onUpdateDisplayName, etc.)
3. Auth hook processes update
4. Success/error response returned to UI

---

## Other Related Settings Components

### Inline Settings (Not Full Page)
- `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/listening-practice/inline-settings.tsx`
- `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/grammar-study/settings-modal.tsx`
- `/Users/admin/Documents/名称未設定フォルダ/src/components/pages/kanji-study/settings-modal.tsx`
- `/Users/admin/Documents/名称未設定フォルダ/src/components/study/session/settings-modal.tsx`
- `/Users/admin/Documents/名称未設定フォルダ/src/components/ui/listening-settings-modal.tsx`
- `/Users/admin/Documents/名称未設定フォルダ/src/components/ui/reading-settings/index.tsx`
- `/Users/admin/Documents/名称未設定フォルダ/src/components/classroom/report-settings-modal.tsx`
- `/Users/admin/Documents/名称未設定フォルダ/src/components/branch-management/branch-settings-tab.tsx`

### Reading Settings (Dedicated Component)
- `/Users/admin/Documents/名称未設定フォルダ/src/components/ui/reading-settings/` (directory)
  - index.tsx, color-picker.tsx, furigana-toggle.tsx, size-control.tsx, etc.

---

## User Permissions & Roles

### Settings Access
- Settings tab: Available to all logged-in users
- Profile tab: Available to all logged-in users
- Friends tab: Available to all logged-in users
- Theme customization (System → Themes): **super_admin only** (checked in code)

### Data Visibility
- Users can edit own profile only
- Friends can be managed per-user
- Badges/stats are user-specific

---

## Summary Statistics

- **Core settings page files**: 2 (settings-page + settings-page-refactored)
- **Settings sub-components**: 19
- **Profile components**: 2
- **Settings hooks**: 3 (use-settings, use-profile-handlers, use-settings-state)
- **Type definition files**: 2 (settings-types.ts, user.ts)
- **Configuration fields**: 198+ in AppSettings interface
- **Theme presets**: 15
- **Card frame presets**: 40+
- **AI difficulty profiles**: 27

---

## Unresolved Questions
- Is there a dedicated profile page component or does it use the settings page with initialTab='profile'?
  - **Answer**: Uses settings page with initialTab parameter (line 650 in App.tsx)
- Are there any backup/legacy versions of settings page?
  - **Answer**: Yes, settings-page.tsx.backup mentioned in settings-page-refactored.tsx
