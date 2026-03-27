# System Architecture

**Shinko** — Vietnamese-language Japanese learning app (学ぼう / Học Tiếng Nhật)

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| UI framework | React | 19 |
| Language | TypeScript | 5.x |
| Build tool | Vite | 6.x |
| Styling | Plain CSS (per-component files, direct imports) | — |
| Icons | lucide-react | latest |
| Database | Firebase Firestore | 11.x |
| Auth | Firebase Anonymous Auth | 11.x |
| File storage | Firebase Storage | 11.x |
| AI (conversation) | Groq API (llama-3 family) | REST |
| Speech recognition | Google Cloud STT (dual mode: free Web Speech + paid STT) | REST |
| Error tracking | Sentry (`@sentry/react`) | optional, via DSN env var |
| PWA | vite-plugin-pwa + Workbox | — |
| Testing | Vitest + Testing Library + jsdom | — |

---

## Architecture Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│  App.tsx — root shell                                           │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Context providers (data layer)                           │ │
│  │  UserDataProvider → FlashcardDataProvider → JLPTDataProvider│ │
│  │  AchievementProvider, CenterProvider, ReadingSettings...  │ │
│  └──────────────────────┬────────────────────────────────────┘ │
│                         │ React context                         │
│  ┌──────────────────────▼────────────────────────────────────┐ │
│  │  Pages (lazy-loaded via React.lazy + Suspense)            │ │
│  │  HomePage, StudyPage, KaiwaPage, GameHubPage, ...         │ │
│  └──────────────────────┬────────────────────────────────────┘ │
│                         │ consume contexts + call hooks         │
│  ┌──────────────────────▼────────────────────────────────────┐ │
│  │  Custom hooks  (src/hooks/)                               │ │
│  │  useFlashcards, useStudySession, useAchievements, ...     │ │
│  └──────────────────────┬────────────────────────────────────┘ │
│                         │ call Firestore services               │
│  ┌──────────────────────▼────────────────────────────────────┐ │
│  │  Firestore service layer  (src/services/firestore/)       │ │
│  │  flashcard-service, user-service, session-service,        │ │
│  │  exercise-service, reading-service, listening-service ... │ │
│  └──────────────────────┬────────────────────────────────────┘ │
│                         │ Firebase SDK                          │
│                    Cloud Firestore                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Directories

```
src/
├── App.tsx                     # Root: context tree + page routing (no React Router — page state via useState)
├── components/
│   ├── pages/                  # Full-page views (lazy-loaded)
│   ├── layout/                 # Sidebar, Header
│   ├── common/                 # Shared UI (modals, buttons, error boundaries)
│   ├── flashcard/              # Flashcard study UI
│   ├── achievements/           # Achievement toasts, missions widget, celebration overlay
│   ├── games/                  # Game components (bingo, golden-bell, kanji-battle, etc.)
│   ├── kaiwa/                  # Conversation practice UI
│   └── center/                 # Multi-branch center management UI
├── contexts/                   # React contexts (data providers)
│   ├── user-data-context.tsx   # Auth + user list
│   ├── flashcard-data-context.tsx  # All flashcards + lessons
│   ├── jlpt-data-context.tsx   # JLPT questions + folders
│   ├── achievement-context.tsx # Achievement state + unlock events
│   ├── center-context.tsx      # Current branch/center state
│   └── ...
├── hooks/                      # Business logic hooks
│   ├── use-auth.ts             # Login/logout
│   ├── use-progress.ts         # Study progress + stats
│   ├── use-achievements.ts     # Achievement checking + XP
│   ├── use-daily-missions.ts   # Daily mission generation + progress (localStorage)
│   ├── use-exercises.ts        # Exercise data (service-based)
│   ├── use-reading.ts          # Reading practice data (service-based)
│   ├── use-listening.ts        # Listening study data (service-based)
│   ├── settings/               # Settings module (split from monolithic use-settings.ts)
│   ├── groq/                   # Groq AI conversation hooks
│   └── ...
├── services/
│   └── firestore/              # Firestore CRUD per collection
├── types/                      # TypeScript interfaces (source of truth for schemas)
├── lib/
│   ├── firebase.ts             # Firebase init + anonymous auth
│   ├── sentry.ts               # Sentry init (conditional on VITE_SENTRY_DSN)
│   ├── spaced-repetition.ts    # SM-2 algorithm
│   └── offline-storage.ts      # IndexedDB helpers
└── data/                       # Static data (achievement defs, radical index, etc.)
```

---

## Data Flow

### Firestore → Components

```
Firestore (cloud)
  │  onSnapshot / getDocs
  ▼
Firestore service (src/services/firestore/*.ts)
  │  returns typed objects
  ▼
Context providers (src/contexts/*.tsx)
  │  stores in React state, exposes via useContext
  ▼
Custom hooks (src/hooks/*.ts)
  │  transforms/filters data, exposes simple API
  ▼
Page/component (src/components/pages/*.tsx)
```

Real-time listeners (`onSnapshot`) are used for:
- `users` collection (live user list)
- `userAchievements` (live achievement progress)

All other reads use one-shot `getDocs` / `getDoc` with Firestore's **persistent local cache** serving as the offline/performance layer.

---

## Auth Flow

```
App loads
  │
  ├── Firebase auto-detects existing Anonymous Auth session
  │     └── resolves authReady promise
  │
  ├── (no session) → signInAnonymously() → authReady resolves
  │
  └── App renders LoginPage
        │  user enters username + password
        ▼
      getUserByUsername(username) → Firestore users collection
        │  match found + password check
        ▼
      setCurrentUser() → stored in UserDataContext (React state + localStorage)
        │
        ▼
      AppInner renders with page routing
```

- Firebase Anonymous Auth provides a UID for Firestore security rules — actual user identity is managed via the `users` collection (custom auth layer).
- No Firebase Email/Password or OAuth used.
- Sessions persist via `localStorage` across browser reloads.

---

## Role Hierarchy

```
super_admin (100)
  └── director (90)            # manages multiple branches
        └── branch_admin (70)
              ├── main_teacher (50)
              ├── part_time_teacher (40)
              └── assistant (30)
vip_user (20)                  # premium learner
user (10)                      # standard learner
admin (60)                     # legacy alias
```

Access control is enforced client-side via `hasPermission(userRole, requiredRole)` (see `src/types/user.ts`) and centralized in `src/utils/role-permissions.ts` (provides `canAccessPage()` for page-level access control).

---

## PWA Setup

Configured via `vite-plugin-pwa` in `vite.config.ts`:

- App name: **Shinko - Học Tiếng Nhật**
- `registerType: 'autoUpdate'` — SW auto-updates on new deploy
- Workbox runtime caching strategy:
  - Firestore API → **NetworkFirst** (1h TTL)
  - Google Fonts → **CacheFirst** (1 year TTL)
  - jsDelivr CDN → **CacheFirst** (30 day TTL)
  - Firebase Storage → **StaleWhileRevalidate** (7 day TTL, 200 entries)
- Icons: 192×192 and 512×512 PNG
- Display: `standalone`, portrait-primary orientation

---

## External Services

### Groq AI (Kaiwa Conversation)

- Endpoint: `https://api.groq.com/openai/v1/chat/completions`
- Model: llama-3 family (see `src/hooks/groq/constants.ts`)
- Auth: `VITE_GROQ_API_KEY` env var (user can also enter own key in UI)
- Used for: AI conversation partner in Kaiwa practice, speech evaluation, grammar analysis
- Hooks: `src/hooks/groq/use-conversation.ts`, `use-evaluation.ts`, `use-analysis.ts`

### Google Cloud STT (Speech Recognition)

- Two modes:
  - **Free mode**: browser's native Web Speech API
  - **Practice mode**: Google Cloud Speech-to-Text REST API (requires `VITE_GOOGLE_STT_API_KEY`)
- Used in: Pronunciation Practice page, Kaiwa speaking mode

### Firebase Storage

- Stores: JLPT listening question audio files
- Served via `StaleWhileRevalidate` Workbox cache
- URL pattern: `*.firebasestorage.googleapis.com`

### Sentry

- Package: `@sentry/react`
- Enabled only when `VITE_SENTRY_DSN` is set
- `tracesSampleRate`: 0.1 in production, 1.0 in dev
- Ignored errors: `ResizeObserver loop`, `Network request failed`, `Load failed`, `ChunkLoadError`

---

## Build & CI

### Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `vite` | Local dev server |
| `build` | `vite build` | Production build to `dist/` |
| `lint` | `eslint .` | ESLint with TypeScript rules |
| `test` | `vitest` | Watch mode |
| `test:run` | `vitest run` | Single-pass (CI) |
| `test:coverage` | `vitest run --coverage` | Coverage report |
| `analyze` | `ANALYZE=1 vite build` | Bundle visualizer (`dist/stats.html`) |

### Manual chunk splitting (`vite.config.ts`)

- `vendor-firebase` — Firebase SDK
- `vendor-react` — React + ReactDOM
- `vendor-ui` — lucide-react
- Lazy routes create additional async chunks per page

### GitHub Actions CI

Three sequential jobs: `lint-and-typecheck` → `test` → `build`. See `.github/workflows/ci.yml`.
Build artifacts uploaded to GitHub Actions for 7 days.
Firebase env vars injected as GitHub Secrets during `build` job.

---

## Offline Support

- Firestore `persistentLocalCache` + `persistentMultipleTabManager`: all Firestore data cached in IndexedDB, available offline after first load.
- PWA service worker: pre-caches all static assets; runtime caching for Firestore, Storage, Fonts, CDN.
- `src/lib/offline-storage.ts`: additional IndexedDB helpers for app-specific offline data.
- `useOffline` hook: detects navigator.onLine changes and shows `OfflineIndicator` banner.
