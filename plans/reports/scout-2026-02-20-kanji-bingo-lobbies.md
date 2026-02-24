# Scout Report: Kanji Battle & Bingo Game Lobbies + Shared Lobby System

## Summary

Located all Kanji Battle ("Đại chiến Kanji") and Bingo game lobbies, plus comprehensive shared lobby component system with VIP/premium styling, premium full-screen lobby shell, and role-based visual effects.

## 1. Kanji Battle Game Lobby

### Main Lobby Component
- **File**: `/Users/admin/Documents/名称未設定フォルダ/src/components/kanji-battle/kanji-battle-lobby.tsx`
- **Purpose**: Waiting room for Kanji Battle players, displays game code, settings (game mode: read/write, levels, rounds, time, skills), player grid with bot badges, start button
- **Key Props**: 
  - `game` (KanjiBattleGame), `currentPlayerId`, `onStartGame`, `onAddBot`, `onLeave`, `onKickPlayer`
- **Uses**: Legacy lobby components (GameCodeDisplay, PlayerListGrid, LobbyActionBar)
- **Styling**: CSS class `speed-quiz-lobby` (not premium shell)
- **Bot Support**: Shows bot badge and allows host to add bots

### Supporting Files
- **Type Definition**: `/Users/admin/Documents/名称未設定フォルダ/src/types/kanji-battle.ts` — KanjiBattleGame interface
- **Hook**: `/Users/admin/Documents/名称未設定フォルダ/src/hooks/use-kanji-battle.ts` — Main hook for Kanji Battle logic

---

## 2. Bingo Game Lobby

### Main Lobby Component
- **File**: `/Users/admin/Documents/名称未設定フォルダ/src/components/bingo-game/bingo-game-lobby.tsx`
- **Purpose**: Premium full-screen lobby for Bingo game. Thin wrapper around PremiumLobbyShell with Bingo-specific accent color (purple #E040FB), meta tags (JLPT level, grid size, time, skills), rules, QR code, and players panel
- **Key Props**:
  - `game` (BingoGame), `isHost`, `currentPlayerId`, `loading`, `onStartGame`, `onLeaveGame`, `onKickPlayer`
- **Accent Color**: Purple/magenta `{ accent: '#E040FB', accentDark: '#9C27B0', accentRgb: '224, 64, 251' }`
- **Layout**: 
  - Left column: host card + QR/join section + rules
  - Right column: players panel with capacity bar
  - Footer: start button or "waiting for host" message
- **Features**:
  - Leave & kick confirmation modals
  - QR code with toggle (collapsible)
  - Rules display
  - Skill interval info

### Supporting Files
- **Type Definition**: `/Users/admin/Documents/名称未設定フォルダ/src/types/bingo-game.ts` — BingoGame interface
- **Component**: `/Users/admin/Documents/名称未設定フォルダ/src/components/bingo-game/bingo-number-spinner.tsx` — Used in game, not lobby

---

## 3. Shared Lobby Component System (Premium Lobby Shell)

All shared components are in: `/Users/admin/Documents/名称未設定フォルダ/src/components/shared/game-lobby/`

### Core Components

#### **PremiumLobbyShell** (Full-Screen Portal)
- **File**: `premium-lobby-shell.tsx`
- **Purpose**: Reusable full-screen lobby container with animated background, 2-column layout, header, footer
- **Props**:
  - `title`, `metaTags`, `leftContent`, `rightContent`, `footerContent`, `accent`, `onLeave`, `qrHidden`
- **Theming**: CSS custom properties for accent colors (`--pl-accent`, `--pl-accent-dark`, `--pl-accent-rgb`)
- **Portal**: Renders to `document.body` z-index 999

#### **LobbyHostCard**
- **File**: `lobby-host-card.tsx`
- **Purpose**: Displays host info (avatar, name, badge) with VIP styling
- **Features**: Integrates `getVipBadge`, `getVipNameClasses`, `isVipRole` from vip-styling utility

#### **LobbyJoinSection**
- **File**: `lobby-join-section.tsx`
- **Purpose**: QR code + room code + copy/share buttons, collapsible via `qrVisible` toggle
- **Features**: 
  - QR code with scan ring animation
  - Copy room code to clipboard
  - Web share API with fallback
  - Mobile-friendly

#### **LobbyPlayersPanel**
- **File**: `lobby-players-panel.tsx`
- **Purpose**: Players section with header (icon + title), capacity bar, PlayerListGrid, waiting hint
- **Shows**: `playerCount / maxPlayers` with fill percentage bar

#### **PlayerListGrid**
- **File**: `player-list-grid.tsx`
- **Purpose**: Reusable grid of player cards with VIP styling, host badge, kick button
- **Features**:
  - VIP avatar frames (spinning per role)
  - VIP name gradient/colors
  - Host card highlighting
  - Empty slot placeholders
  - Kick button (for host only, not on host card or self)
- **VIP Support**: Uses `getVipAvatarClasses`, `getVipNameClasses`, `getVipBadge`, `isVipRole`

#### **LobbyStartFooter**
- **File**: `lobby-start-footer.tsx`
- **Purpose**: Start button (for host) or "waiting for host" message (for non-host)
- **Props**: `isHost`, `canStart`, `loading`, `onStart`, `startIcon`, `startLabel`, `disabledLabel`

#### **GameCodeDisplay** (Legacy)
- **File**: `game-code-display.tsx`
- **Purpose**: Simple room code display with copy button (used by KanjiBattle)

#### **LobbyActionBar** (Legacy)
- **File**: `lobby-action-bar.tsx`
- **Purpose**: Simple action bar for legacy lobbies (start + leave buttons)

### Barrel Export
- **File**: `index.ts`
- **Exports**: All premium & legacy components, `normalizePlayer` helper, types

### Types
- **File**: `types.ts`
- **BaseLobbyPlayer** interface: `id`, `displayName`, `avatar`, `isHost`, `isBot`, `role`
- **normalizePlayer** helper: Converts game-specific player format to BaseLobbyPlayer

---

## 4. Styling System: VIP/Role-Based Effects

### CSS File
- **File**: `/Users/admin/Documents/名称未設定フォルダ/src/components/shared/game-lobby/premium-lobby.css` (23KB)
- **Scope**: All `.pl-lobby-*` classes

### VIP Styling Utility
- **File**: `/Users/admin/Documents/名称未設定フォルダ/src/utils/vip-styling.ts`
- **Purpose**: Centralized VIP role detection and styling helpers
- **VIP_ROLES**: `['vip_user', 'super_admin', 'director', 'admin']`

#### Functions
- **isVipRole(role?)** → boolean
- **isStaffRole(role?)** → boolean (includes teachers, branch_admin)
- **getVipPlayerClasses(role?, baseClass?)** → className string
- **getVipAvatarClasses(role?, baseClass)** → className with VIP avatar styling
- **getVipNameClasses(role?, baseClass)** → className with VIP name styling
- **getVipBadge(role?)** → emoji string
  - `super_admin` → '👑'
  - `director` → '🌟'
  - `admin` → '⚡'
  - `vip_user` → '💎'
- **getVipNameStyle(role?)** → inline React.CSSProperties
- **renderVipName(player, options?)** → helper for complete VIP rendering

### VIP Visual Effects (CSS)

#### Avatar Styling
- **VIP Avatar Frame**: Spinning border ring per role
  - `vip_user`: 4px solid gradient `#a855f7 → #ec4899` (purple-pink)
  - `super_admin`: 4px solid gradient `#ff6b6b → #ffd93d → #6bcb77 → #4d96ff → #9b59b6` (rainbow)
  - `director`: 4px solid gradient `#ffd700 → #ffb347` (gold)
  - `admin`: 4px solid `#e34234` (red)
- **Animation**: Continuous 2s rotation (`plVipSpin`)
- **Glow**: `box-shadow` with role-colored glow on hover

#### Name Styling (Gradients + Color)
- **super_admin**: Rainbow gradient text (animated, 3s cycle)
- **director**: Gold gradient + text shadow
- **admin**: Red color + red text shadow
- **vip_user**: Purple-pink gradient

#### Player Card Host Highlighting
- **Host Card**: 
  - Accent-colored gradient background
  - Accent-colored border & glow
  - Accent-colored avatar border & glow
  - Radial overlay effect

---

## 5. Premium Lobby CSS Structure

### Layout Layers
1. **Fixed Background** (.pl-lobby-bg): Animated orbs + grid pattern, z-index 0, pointer-events none
2. **Header** (.pl-lobby-header): z-index 1, glassmorphism backdrop
3. **Body** (.pl-lobby-body): 2-column (left + right), stacks on mobile
4. **Footer** (.pl-lobby-footer): Start button / waiting message
5. **Portal Root**: z-index 999 (overlays sidebar & nav)

### Key CSS Classes
- `.pl-lobby` — Root container (fixed, flex column, dark gradient bg)
- `.pl-lobby-header` — Title + meta tags
- `.pl-lobby-body` — 2-column layout
- `.pl-lobby-left` — Left column (host card, QR, rules)
- `.pl-lobby-right` — Right column (players)
- `.pl-lobby-players-grid-wrap` — Players grid container
- `.player-card` — Individual player card
- `.player-card.host` — Host card with glow
- `.player-card.vip-player` — VIP player card
- `.player-avatar` — Avatar circle
- `.player-avatar.vip-avatar` — VIP avatar with frame
- `.player-name` — Name text
- `.vip-name.role-name-*` — Role-specific name styling
- `.pl-lobby-qr-container` — QR code section with glow/ring
- `.pl-lobby-capacity-bar` — Fill percentage bar (playerCount / maxPlayers)

### Responsive Behavior
- **PC** (>1024px): 2-column layout, full grid
- **Tablet** (768-1024px): Stacked layout, adjusted grid
- **Mobile** (<480px): Compact grid (3 cols), smaller avatars

---

## 6. Color Theming System

### CSS Custom Properties (Per-Game Override)
Games set accent colors inline on `.pl-lobby` root:
```tsx
const cssVars = {
  '--pl-accent': accent.accent,           // Primary color
  '--pl-accent-dark': accent.accentDark,  // Darker variant
  '--pl-accent-rgb': accent.accentRgb,    // RGB for rgba()
} as React.CSSProperties;
```

### Per-Game Accents
- **Bingo**: Purple/Magenta `#E040FB` (rgb: 224, 64, 251)
- **Golden Bell**: (see golden-bell-lobby.tsx)
- **Quiz Game**: (see quiz-game/game-lobby.tsx)
- **Racing Game**: (see racing-game-lobby.tsx)
- **Word Match**: (see word-match-lobby.tsx)
- **Picture Guess**: (see picture-guess-lobby.tsx)
- **Kanji Battle**: Uses legacy speed-quiz-lobby styles (not premium)

### Fallback Default
- Premium Lobby Shell default: Purple `#a78bfa` (rgb: 167, 139, 250)

---

## 7. All Lobby Files in Repository

### Kanji Battle
- `/Users/admin/Documents/名称未設定フォルダ/src/components/kanji-battle/kanji-battle-lobby.tsx`

### Bingo
- `/Users/admin/Documents/名称未設定フォルダ/src/components/bingo-game/bingo-game-lobby.tsx`

### Shared Components
- `/Users/admin/Documents/名称未設定フォルダ/src/components/shared/game-lobby/premium-lobby-shell.tsx`
- `/Users/admin/Documents/名称未設定フォルダ/src/components/shared/game-lobby/lobby-host-card.tsx`
- `/Users/admin/Documents/名称未設定フォルダ/src/components/shared/game-lobby/lobby-join-section.tsx`
- `/Users/admin/Documents/名称未設定フォルダ/src/components/shared/game-lobby/lobby-players-panel.tsx`
- `/Users/admin/Documents/名称未設定フォルダ/src/components/shared/game-lobby/player-list-grid.tsx`
- `/Users/admin/Documents/名称未設定フォルダ/src/components/shared/game-lobby/lobby-start-footer.tsx`
- `/Users/admin/Documents/名称未設定フォルダ/src/components/shared/game-lobby/lobby-action-bar.tsx`
- `/Users/admin/Documents/名称未設定フォルダ/src/components/shared/game-lobby/game-code-display.tsx`
- `/Users/admin/Documents/名称未設定フォルダ/src/components/shared/game-lobby/index.ts`
- `/Users/admin/Documents/名称未設定フォルダ/src/components/shared/game-lobby/types.ts`
- `/Users/admin/Documents/名称未設定フォルダ/src/components/shared/game-lobby/premium-lobby.css`

### Other Game Lobbies (Similar Architecture)
- `/Users/admin/Documents/名称未設定フォルダ/src/components/golden-bell/golden-bell-lobby.tsx`
- `/Users/admin/Documents/名称未設定フォルダ/src/components/golden-bell/golden-bell-team-lobby.tsx`
- `/Users/admin/Documents/名称未設定フォルダ/src/components/quiz-game/game-lobby.tsx`
- `/Users/admin/Documents/名称未設定フォルダ/src/components/racing-game/racing-game-lobby.tsx`
- `/Users/admin/Documents/名称未設定フォルダ/src/components/word-match/word-match-lobby.tsx`
- `/Users/admin/Documents/名称未設定フォルダ/src/components/picture-guess/picture-guess-lobby.tsx`

### VIP Styling Utility
- `/Users/admin/Documents/名称未設定フォルダ/src/utils/vip-styling.ts`

---

## Architecture Insights

### Pattern: Premium Lobby Shell
Modern premium lobbies (Bingo, Golden Bell, Quiz, Racing, Word Match, Picture Guess) use the PremiumLobbyShell component with:
- Full-screen portal overlay
- Accent color theming
- Left column (host card + QR + rules/meta)
- Right column (players grid)
- Footer (start button)

### Pattern: Legacy Lobby
Kanji Battle uses older lobby pattern with:
- Standard speed-quiz-lobby DOM structure
- Legacy GameCodeDisplay, PlayerListGrid, LobbyActionBar
- No PremiumLobbyShell wrapper

### VIP Styling Layers
1. **CSS Classes**: Applied via `getVipAvatarClasses`, `getVipNameClasses` in player-list-grid
2. **CSS Rules**: Role-specific styling in premium-lobby.css (`.pl-lobby .vip-name.role-name-*`)
3. **Avatar Frames**: Spinning borders per role with role-colored gradients
4. **Name Gradients**: Text-fill gradients per role
5. **Host Highlighting**: Accent-colored glow + border on host cards

### Normalization Pattern
`normalizePlayer()` converts game-specific player formats (different field names) to `BaseLobbyPlayer` for shared components. Each game calls it before passing to shared UI:
```tsx
const normalizedPlayers = players.map(p => normalizePlayer({
  ...p, odinhId: p.odinhId, isHost: p.odinhId === game.hostId,
}));
```

---

## Key Files for Reference

| File | Lines | Purpose |
|------|-------|---------|
| premium-lobby.css | 23KB | All styling for premium lobby system |
| vip-styling.ts | 137 | VIP role detection & styling helpers |
| premium-lobby-shell.tsx | 94 | Root full-screen container |
| player-list-grid.tsx | 87 | VIP + host + kick styling in grid |
| bingo-game-lobby.tsx | 195 | Bingo-specific thin wrapper |
| kanji-battle-lobby.tsx | 134 | Legacy Kanji Battle lobby |

