# Complete File Paths - Settings & Profile Pages

## MAIN ENTRY POINTS

### Settings Page Container
```
/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings-page-refactored.tsx
  - Main orchestrator component
  - Manages tab state and props distribution
  - Imported by settings-page.tsx

/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings-page.tsx
  - Re-export wrapper (index file)
  - Exports SettingsPage component
```

---

## SETTINGS SUB-COMPONENTS (19 files)

### Navigation & Layout
```
/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/settings-header.tsx
/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/settings-tabs.tsx
/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/settings-sub-tabs.tsx
```

### Feature Settings Tabs
```
/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/flashcard-settings.tsx
/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/flashcard-settings-background.tsx
/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/flashcard-settings-frame.tsx
/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/flashcard-settings-preview.tsx

/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/study-settings.tsx
/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/grammar-settings.tsx

/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/game-settings.tsx
/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/game-settings-basic.tsx
/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/game-settings-jlpt.tsx
/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/game-settings-ai.tsx
/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/game-settings-sources.tsx

/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/kaiwa-settings.tsx
/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/listening-settings.tsx

/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/system-settings.tsx
```

### Profile & Social Tabs
```
/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/profile-section.tsx
/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/friends-section.tsx
```

### Utilities & Support
```
/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/settings-constants.ts
/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/settings-types.ts
/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/settings-utils.ts
/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/settings-sound-panel.tsx
/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/index.ts
```

---

## CUSTOM HOOKS FOR SETTINGS

```
/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/hooks/use-settings-state.ts
  - Manages UI state (active tabs, filters, categories)
  - Device type selection
  - Font size multiplier calculation

/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/hooks/use-profile-handlers.ts
  - Profile field edit handlers
  - Avatar picker state
  - Password change logic
  - Display name update
  - JLPT level updates
```

---

## GLOBAL HOOKS & CONTEXTS

### Settings Management
```
/Users/admin/Documents/名称未設定フォルダ/src/hooks/use-settings.ts
  - useSettings() hook for app-wide settings
  - useGlobalTheme() hook for global theme (super_admin)
  - AppSettings interface (198 fields)
  - LocalStorage persistence
  - Default settings constants
  - Theme presets (15 color schemes)
  - Card frame presets (40+ styles)

/Users/admin/Documents/名称未設定フォルダ/src/hooks/use-user-history.ts
  - User study/game/JLPT session history
  - User stats tracking
```

### Settings Contexts
```
/Users/admin/Documents/名称未設定フォルダ/src/contexts/reading-settings-context.tsx
  - Reading practice configuration

/Users/admin/Documents/名称未設定フォルダ/src/contexts/listening-settings-context.tsx
  - Listening practice configuration
```

---

## TYPE DEFINITIONS

### User Types
```
/Users/admin/Documents/名称未設定フォルダ/src/types/user.ts
  - CurrentUser interface
  - User interface
  - UserStats interface
  - StudySession, GameSession, JLPTSession types
  - UserBadgeStats, UserJLPTLevel types
  - calculateUserLevel() function
```

### Settings Types
```
/Users/admin/Documents/名称未設定フォルダ/src/components/pages/settings/settings-types.ts
  - SettingsPageProps (main interface)
  - SettingsTab type ('general' | 'profile' | 'friends')
  - GeneralSubTab type
  - FlashcardSettingsProps
  - StudySettingsProps
  - GrammarSettingsProps
  - GameSettingsProps
  - KaiwaSettingsProps
  - SystemSettingsProps
  - ProfileSettingsProps
  - FriendsSettingsProps
  - ThemePreset interface
  - PendingFriendRequest interface
  - DeviceType ('desktop' | 'tablet' | 'mobile')
```

---

## ROUTER & NAVIGATION

### Main App Router
```
/Users/admin/Documents/名称未設定フォルダ/src/App.tsx
  - Lines 645-650: Settings/Profile routing logic
  - Imports: { SettingsPage } from './components/pages/settings-page'
  - Page mapping: currentPage === 'settings' || currentPage === 'profile' → SettingsPage
  - initialTab prop based on currentPage
```

### Sidebar Navigation
```
/Users/admin/Documents/名称未設定フォルダ/src/components/layout/sidebar.tsx
  - Settings button → setCurrentPage('settings')
  - Profile button → setCurrentPage('profile')

/Users/admin/Documents/名称未設定フォルダ/src/components/layout/header.tsx
  - Page type definition (includes 'settings', 'profile')
```

---

## AVATAR & PROFILE UTILITIES

```
/Users/admin/Documents/名称未設定フォルダ/src/utils/avatar-icons.ts
  - AVATAR_CATEGORIES constant
  - isImageAvatar() function
  - Avatar icon mappings

/Users/admin/Documents/名称未設定フォルダ/src/types/friendship.ts
  - FriendWithUser interface
  - BadgeType, UserBadgeStats
  - Badge-related types
```

---

## RELATED SETTINGS MODALS (Not Full Page)

### Study-Specific Settings
```
/Users/admin/Documents/名称未設定フォルダ/src/components/pages/listening-practice/inline-settings.tsx
/Users/admin/Documents/名称未設定フォルダ/src/components/pages/grammar-study/settings-modal.tsx
/Users/admin/Documents/名称未設定フォルダ/src/components/pages/kanji-study/settings-modal.tsx
/Users/admin/Documents/名称未設定フォルダ/src/components/study/session/settings-modal.tsx
/Users/admin/Documents/名称未設定フォルダ/src/components/ui/listening-settings-modal.tsx
```

### Dedicated Reading Settings
```
/Users/admin/Documents/名称未設定フォルダ/src/components/ui/reading-settings/index.tsx
/Users/admin/Documents/名称未設定フォルダ/src/components/ui/reading-settings/color-picker.tsx
/Users/admin/Documents/名称未設定フォルダ/src/components/ui/reading-settings/color-palette.ts
/Users/admin/Documents/名称未設定フォルダ/src/components/ui/reading-settings/furigana-toggle.tsx
/Users/admin/Documents/名称未設定フォルダ/src/components/ui/reading-settings/modal-footer.tsx
/Users/admin/Documents/名称未設定フォルダ/src/components/ui/reading-settings/modal-header.tsx
/Users/admin/Documents/名称未設定フォルダ/src/components/ui/reading-settings/preview-section.tsx
/Users/admin/Documents/名称未設定フォルダ/src/components/ui/reading-settings/size-control.tsx
```

### Other Settings Modals
```
/Users/admin/Documents/名称未設定フォルダ/src/components/classroom/report-settings-modal.tsx
/Users/admin/Documents/名称未設定フォルダ/src/components/branch-management/branch-settings-tab.tsx
```

---

## CSS STYLING

### Main Stylesheets
```
/Users/admin/Documents/名称未設定フォルダ/src/App.css
  - Global app styles
  - Settings page styles (likely)
```

### Likely Component-Specific CSS (may exist)
```
src/components/pages/settings/*.css
src/components/pages/settings/hooks/*.css (unlikely)
```

---

## PACKAGE DEPENDENCIES

### UI/Icons
- lucide-react@0.562.0 - Icon library

### Core
- react@19.2.0
- react-dom@19.2.0
- typescript@5.9.3

### Build
- vite@7.2.4
- @vitejs/plugin-react@5.1.1

### Linting
- eslint@9.39.1
- typescript-eslint@8.46.4

---

## SUMMARY

| Category | Count |
|----------|-------|
| Core settings page files | 2 |
| Settings sub-components | 19 |
| Profile/Friends components | 2 |
| Custom hooks | 3 |
| Type files | 2 |
| Utility files | 2 |
| Context providers | 2 |
| Related modal settings | 10 |
| Reading settings components | 8 |

**Total settings-related files: ~50**

