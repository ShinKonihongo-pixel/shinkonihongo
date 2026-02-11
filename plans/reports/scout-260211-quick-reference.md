# Settings & Profile Pages - Quick Reference Guide

## Entry Points
- **Settings Page**: Accessible via sidebar → "Settings" button
- **Profile Page**: Uses settings page with `initialTab='profile'`
- **File**: `/src/components/pages/settings-page-refactored.tsx`

## Architecture
```
App.tsx
└── SettingsPage (orchestrator)
    ├── SettingsHeader
    ├── SettingsTabs (general | profile | friends)
    │   ├── SettingsSubTabs (flashcard | study | grammar | game | kaiwa | listening | system)
    │   │   ├── FlashcardSettings
    │   │   ├── StudySettings
    │   │   ├── GrammarSettings
    │   │   ├── GameSettings
    │   │   ├── KaiwaSettings
    │   │   ├── ListeningSettings
    │   │   └── SystemSettings
    │   ├── ProfileSection
    │   └── FriendsSection
```

## Key Files Quick Lookup

| Purpose | File |
|---------|------|
| Main container | `settings-page-refactored.tsx` |
| Settings hook | `hooks/use-settings.ts` |
| Profile handlers | `settings/hooks/use-profile-handlers.ts` |
| UI state | `settings/hooks/use-settings-state.ts` |
| Type defs | `settings/settings-types.ts` |
| User types | `types/user.ts` |
| Routing | `App.tsx` (lines 645-650) |
| Sidebar nav | `layout/sidebar.tsx` |
| Avatar utils | `utils/avatar-icons.ts` |

## Settings Tabs Structure

### General Tab (7 sub-tabs)
1. **Flashcard** - Card appearance, fonts, flip styles, backgrounds, frames
2. **Study** - Weekly goals, daily word targets
3. **Grammar** - Grammar card display (front/back toggles)
4. **Game** - Game content, difficulty, sources
5. **Kaiwa** - Conversation settings (voice, auto-speak)
6. **Listening** - Listening practice config
7. **System** - Theme, import/export, reset options

### Profile Tab
- User avatar, display name, JLPT level
- Password change
- Profile background
- User stats and history

### Friends Tab
- Friends list
- Friend requests (pending, sent, received)
- Badges (send/received)
- Friend management

## Data Flow

### Read Settings
```typescript
const { settings, updateSetting, resetSettings } = useSettings();
// Access: settings.kanjiFontSize, settings.cardFlipStyle, etc.
// Persisted: localStorage ('flashcard-settings')
```

### Update Settings
```typescript
onUpdateSetting('kanjiFontSize', 300);
// Triggers: state update → localStorage sync → re-render
```

### Profile Updates
```typescript
onUpdateDisplayName(newName)
onChangePassword(oldPwd, newPwd)
onUpdateAvatar(avatarId)
onUpdateJlptLevel(level)
// All return: Promise<{ success: boolean; error?: string }>
```

## Component Props Chain

```typescript
// From App.tsx to SettingsPage
<SettingsPage
  settings={settings}
  onUpdateSetting={updateSetting}
  currentUser={currentUser}
  onUpdateDisplayName={updateDisplayName}
  onChangePassword={changePassword}
  onUpdateAvatar={updateAvatar}
  initialTab={currentPage === 'profile' ? 'profile' : undefined}
  // ... 50+ more props for theme, friends, badges, etc.
/>
```

## Configuration Fields (AppSettings)

### Card Display (20 fields)
- Font sizes (desktop & mobile)
- Font colors
- Visibility toggles
- Card scale

### Card Styling (14 fields)
- Card flip animation (11 styles)
- Background type (gradient/solid/image)
- Card frame (40+ presets)
- Custom frame settings

### Game Settings (8 fields)
- Question content
- Answer content
- Font sizes

### Kaiwa Settings (9 fields)
- Voice (gender, rate)
- Auto-speak
- Auto-send threshold & delay

### AI Challenge (5 fields)
- Per-AI custom settings (27 profiles)
- Per-level question config

### Study & Goals (6 fields)
- Weekly targets
- Daily word goals
- Question count

### App Theme (3 fields)
- App background (14 presets)
- Global theme colors

---

## Type Definitions Quick Reference

```typescript
// Tab types
type SettingsTab = 'general' | 'profile' | 'friends';
type GeneralSubTab = 'flashcard' | 'study' | 'grammar' | 'game' | 'kaiwa' | 'listening' | 'system';

// Device (for responsive sizing)
type DeviceType = 'desktop' | 'tablet' | 'mobile';

// Card styles
type CardBackgroundType = 'gradient' | 'solid' | 'image';
type CardFlipStyle = 'horizontal' | 'vertical' | 'fade' | 'slide' | 'zoom' | 'swing' | 'flip-up' | 'airplane' | 'crumple' | 'flyaway' | 'none';
type CardFrameId = 'none' | 'solid-gold' | ... (40+ total)

// Game content
type GameQuestionContent = 'kanji' | 'vocabulary' | 'meaning';
type GameAnswerContent = 'kanji' | 'vocabulary' | 'meaning' | 'vocabulary_meaning';

// AI
type AIDifficultyId = 'gentle' | 'friendly' | ... | 'champion'; // 27 total
```

---

## Permissions & Access Control

| Feature | Visibility | Permission |
|---------|-----------|-----------|
| General tab | All users | All logged-in users |
| Profile tab | All users | All logged-in users |
| Friends tab | All users | All logged-in users |
| Theme preset | System sub-tab | super_admin only |
| Edit own profile | Profile tab | All users (own data only) |
| Send friend request | Friends tab | All users |
| View badges | Friends tab | All users |

---

## UI Library & Styling

### Icons
- **lucide-react** v0.562.0
- Example imports:
  - `import { Settings, Home, Gamepad2, Award } from 'lucide-react'`

### Styling
- Custom CSS (no Tailwind/shadcn)
- Classes likely follow pattern: `.settings-*`, `.profile-*`, `.friends-*`
- Main stylesheet: `App.css`

### Responsive
- Device type selection in settings (mobile/tablet/desktop)
- Font sizes adjust based on device

---

## Common Tasks

### How to Add a New Setting
1. Add field to `AppSettings` interface in `use-settings.ts`
2. Set default in `DEFAULT_SETTINGS`
3. Create component in `settings/` to display/edit
4. Add to appropriate tab component
5. Handle update via `onUpdateSetting(key, value)`

### How to Access Settings Globally
```typescript
const { settings } = useSettings();
// Now available: settings.kanjiFontSize, etc.
```

### How to Update Profile
```typescript
const result = await onUpdateDisplayName('New Name');
if (result.success) {
  // Success - currentUser will update
} else {
  // Show error: result.error
}
```

### How to Navigate to Settings
```typescript
setCurrentPage('settings'); // From sidebar or any component
// Or with profile tab:
setCurrentPage('profile');  // App.tsx will set initialTab='profile'
```

---

## Performance Considerations

- Settings use localStorage → instant load on page refresh
- useSettings() is React hook → re-render on setting change
- Each sub-tab is a separate component → can lazy-load if needed
- Theme changes apply CSS variables globally → fast re-paint

---

## Files to Modify for Common Tasks

| Task | Files |
|------|-------|
| Add new card flip style | `settings-types.ts`, `flashcard-settings.tsx` |
| Add new theme preset | `use-settings.ts` (THEME_PRESETS) |
| Add new card frame | `use-settings.ts` (CARD_FRAME_PRESETS) |
| Add new sub-tab | `settings-sub-tabs.tsx`, `settings-page-refactored.tsx` |
| Change font defaults | `use-settings.ts` (DEFAULT_SETTINGS) |
| Add permission check | `App.tsx` (render condition for tab) |

---

## Debugging Tips

- Check localStorage: `localStorage.getItem('flashcard-settings')`
- Check theme: `localStorage.getItem('flashcard-global-theme')`
- Settings not saving? Check try/catch in useSettings hook
- Component not rendering? Check initialTab logic in App.tsx
- Avatar not updating? Check isImageAvatar() function in avatar-icons.ts

