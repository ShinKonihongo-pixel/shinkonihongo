# Security Audit Report

**Date:** 2026-03-31
**Scope:** Full security audit — Shinko React+TypeScript+Firebase educational platform
**Focus:** Security vulnerabilities only (no style/quality)

---

## Scope

- Files reviewed: 24 source files + firestore.rules + storage.rules + cors.json + vercel.json + .env.example + proxy/groq-worker.js
- Review type: Security-only, full audit

---

## CRITICAL Issues

### C-1: XSS — `FuriganaText` in `src/components/ui/furigana-text.tsx` renders unsanitized HTML

**File:** `src/components/ui/furigana-text.tsx:11-12, 62`

`convertManualFuriganaToHtml()` does a raw regex replace and the result is injected via `dangerouslySetInnerHTML` with **no DOMPurify call**.

```ts
// UNSAFE — no sanitization
function convertManualFuriganaToHtml(text: string): string {
  return text.replace(/\[([^\]|]+)\|([^\]]+)\]/g, '<ruby>$1<rt>$2</rt></ruby>');
}
// ...
dangerouslySetInnerHTML={{ __html: furiganaHtml }}
```

**Contrast:** `src/lib/furigana-utils.ts` (used by `slide-renderer` and `common/furigana-text.tsx`) does the identical conversion **and then calls `DOMPurify.sanitize()`**. The `ui/furigana-text.tsx` copy was written or diverged without the sanitization step.

**Exploit:** If `text` originates from user-controlled content (flashcard fields, custom topics, notebook content), a payload like `[<img src=x onerror=alert(1)>|reading]` bypasses the regex guard because the regex capture groups are injected verbatim. The `$1` capture group is directly placed inside a `<ruby>` element so script-bearing event handlers survive.

**Who can inject:** Any authenticated user who can create/edit flashcards, custom topics, or vocabulary notes — which includes all `user` roles.

**Fix:** Import and apply `DOMPurify.sanitize` identically to `furigana-utils.ts`:

```ts
import DOMPurify from 'dompurify';
function convertManualFuriganaToHtml(text: string): string {
  const html = text.replace(/\[([^\]|]+)\|([^\]]+)\]/g, '<ruby>$1<rt>$2</rt></ruby>');
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: ['ruby', 'rt', 'rp', 'br'] });
}
```

Or, better: **delete** `ui/furigana-text.tsx`'s private copy and import from `lib/furigana-utils.ts` directly, eliminating the duplication.

---

### C-2: Hardcoded default admin password in production code

**File:** `src/hooks/use-auth.ts:14`

```ts
const DEFAULT_ADMIN_PW = 'superadmin'; // CHANGE THIS after first login
```

This plaintext password exists in the **production bundle** — it's a `const` at module scope, not in a comment. Every user who opens DevTools (or reads the minified bundle) sees it. The comment "CHANGE THIS" is not an effective control. If the `superadmin` account is auto-created on any new deployment before the admin changes the password, the window of exposure is unbounded.

**Fix:**
- Generate a random password server-side (Cloud Function) rather than hard-coding it, OR
- Require explicit admin bootstrapping (e.g., environment variable `VITE_INITIAL_ADMIN_PW` set during deploy — though still VITE_ and thus public), OR
- Remove auto-creation entirely; require manual account seeding via a secure script

---

### C-3: `changePassword` has no authorization check — any user can change any other user's password

**File:** `src/hooks/use-auth.ts:213-225`

```ts
const changePassword = useCallback(async (userId: string, newPassword: string) => {
  if (newPassword.length < 4) { ... }     // min-length 4, not 8
  const hashedPw = await hashPassword(newPassword);
  await firestoreService.updateUser(userId, { password: hashedPw });
```

- No check that `currentUser.id === userId` OR `currentUser` is an admin.
- Any logged-in user who discovers another user's Firestore `userId` can call `changePassword(victimId, 'newpass')`.
- Min-length for `changePassword` is **4**, inconsistent with `register`'s 8. This is a logic bug with security implications (weaker passwords allowed on reset path).

**Fix:**
```ts
if (currentUser?.id !== userId && !isAdmin) {
  return { success: false, error: 'Không có quyền' };
}
if (newPassword.length < 8) { ... }
```

Also enforce the min-length parity at 8.

---

### C-4: `updateUser` in Firestore rules allows any authenticated user to change their own `role` field

**File:** `firestore.rules:43`

```
allow update: if isOwner(userId) || isAdmin();
```

`isOwner` means any user can write any field on their own document — including `role`, `vipExpirationDate`, and `branchId`. A regular user can promote themselves to `vip_user`, `admin`, or `super_admin` by calling `updateDoc` directly from the browser:

```js
import { doc, updateDoc } from 'firebase/firestore';
updateDoc(doc(db, 'users', myUid), { role: 'super_admin' });
```

**Fix:** Use `request.resource.data.diff(resource.data).affectedKeys()` to whitelist self-updatable fields:

```
allow update: if isOwner(userId)
    && request.resource.data.diff(resource.data).affectedKeys()
         .hasOnly(['displayName','avatar','profileBackground','jlptLevel'])
  || isAdmin();
```

---

## HIGH Issues

### H-1: `VITE_GOOGLE_STT_API_KEY` is a browser-exposed Google Cloud API key

**File:** `src/services/google-speech.ts:5`, `.env.example:30`

```ts
const API_KEY = import.meta.env.VITE_GOOGLE_STT_API_KEY || '';
// ...
return `https://speech.googleapis.com/v1/speech:recognize?key=${API_KEY}`;
```

`VITE_*` variables are embedded in the Vite client bundle at build time. Anyone viewing page source or the network tab can extract the key and make unlimited Google STT calls on the app's billing account. The `.env.example` file acknowledges this pattern for Groq/Claude (where proxy is recommended) but the Google STT key has **no proxy path commented as recommended** — `VITE_GOOGLE_STT_PROXY_URL` exists but is optional with no enforcement.

**Fix:** Treat `VITE_GOOGLE_STT_API_KEY` the same as Groq — deploy a proxy worker and make the key fallback emit a clear warning rather than silently proceeding.

---

### H-2: `groqLimiter` is exported but never used — no rate limiting on Groq API calls

**Files:** `src/utils/rate-limiter.ts:54`, `src/hooks/groq/use-conversation.ts`, `src/hooks/groq/use-groq-advanced.ts`, `src/services/kanji-ai-service.ts`, `src/services/kanji-analysis-ai-service.ts`

`claudeLimiter` is used before every Claude API call. `groqLimiter` (`20/min`) is defined but **zero callers** import it. All Groq call sites (`use-conversation`, `use-groq-advanced`, `use-evaluation`, `kanji-ai-service`, `kanji-analysis-ai-service`) send requests without any throttle. A user can trigger hundreds of parallel AI calls (e.g., looping `generateKanjiCharacterAnalysis` on a large card deck), burning the Groq quota or triggering upstream rate-limit errors in bulk.

**Fix:** Apply `groqLimiter.tryRequest()` at each Groq call site, same pattern as `claudeLimiter` in `claude-api.ts`.

---

### H-3: Storage rules — `lectures/` path has **no write rule**, falls through to read-only wildcard

**File:** `storage.rules:17-22`

```
match /{allPaths=**} {
  allow read: if request.auth != null;
  // NO write allowed
}
```

`storage-service.ts` uploads to `lectures/{lectureId}/media/{filename}`. The `users/{userId}/` rule only covers that prefix. The `shared/` rule has no write. The catch-all has no write. This means lecture media uploads **silently fail in production** (Firebase denies the write with permission-denied). Worse — if someone previously deployed with permissive rules, files may be in unguarded locations.

More critically: there is currently **no explicit admin-only write rule** for `lectures/`. If the rules are ever relaxed to fix the upload issue without care, any authenticated user would be able to write there.

**Fix:** Add an explicit rule:
```
match /lectures/{lectureId}/{allPaths=**} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && isAdmin(); // requires helper or duplicate logic
}
```
Since storage rules can't call Firestore `get()` (cross-service), use a custom claim or check `request.auth.token.role` after setting custom claims, or keep a simpler `isAuth()` write with file size limit and content-type restriction.

---

### H-4: `groq-worker.js` CORS — production domain not in `ALLOWED_ORIGINS`

**File:** `proxy/groq-worker.js:13-14`

```js
const ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:4173'];
// Add your production domain: 'https://your-app.web.app'
```

The production origin is left as a comment. This means either:
1. `env.ALLOWED_ORIGIN` must be set (acceptable but easy to forget), OR
2. The worker rejects all production requests with 403.

If the deployer sets `ALLOWED_ORIGIN` to `*` to fix the 403, the CORS guard is completely bypassed.

**Fix:** Move production origins into `ALLOWED_ORIGINS` array in the deployed worker, or make the env var validation explicit and documented. The comment should be turned into a deployment checklist item.

---

### H-5: `use-auth.ts` — full `users` array (all user profiles) streamed to every client

**File:** `src/hooks/use-auth.ts:30-58`, `user-service.ts:30-36`

`subscribeToUsers(limit=500)` pushes the entire user list — usernames, roles, avatar URLs, JLPT levels, branch assignments, VIP expiration dates — into every authenticated client's React state, regardless of role. A regular student can read all other students' PII from the React context via DevTools.

Firestore rules `allow read: if isAuth()` permit this, so it's also a rules issue. The design appears intentional for leaderboard/friend features, but the `users` array is exposed through `AuthContext.users` to any component.

**Fix:** Separate the minimal auth requirement (current user profile) from the admin/social list. Only stream the full user list to admins. For leaderboard/friend purposes, create a limited public-profile view with only `displayName`, `avatar`, `jlptLevel`.

---

## MEDIUM Issues

### M-1: Session stored in `localStorage` with full role information — trivially tamperable

**File:** `src/hooks/use-auth.ts:10, 22-29, 69-79`

```ts
const CURRENT_USER_KEY = 'flashcard-current-user';
localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
```

`currentUser` includes `role`, `branchId`, `branchIds`. Firestore rule enforcement means the client role value doesn't directly grant Firestore access, but:
- Client-side UI gates (`isAdmin`, `canAccessPage`) read from this stored value.
- A user can open DevTools → Application → LocalStorage → set `role: "super_admin"` → reload and see admin UI without any server check.
- The `users` subscription (see H-5) re-populates roles from Firestore on load, which partially mitigates this, but the initial render uses the `localStorage` value before the subscription fires.

**Fix:** Don't store `role` in localStorage. Derive it fresh from the Firestore subscription after auth. Accept the brief loading state.

---

### M-2: `claude-api.ts` leaks raw API error body to the user

**File:** `src/services/claude-api.ts:77-78`

```ts
const errorText = await response.text().catch(() => 'Unknown error');
throw new Error(`API error ${response.status}: ${errorText}`);
```

The raw proxy response (which may include internal error details, stack traces from the proxy, or rate-limit messages) is thrown as an `Error` and surfaced to the UI. This reveals internal infrastructure information to users.

**Fix:** Log internally, throw a generic user-facing message:
```ts
console.error('Claude API error:', response.status, errorText);
throw new Error('Lỗi kết nối AI. Vui lòng thử lại.');
```

---

### M-3: `storage.rules` — no file type restriction on user uploads

**File:** `storage.rules:6-10`

User uploads to `users/{userId}/` are only restricted by size (10MB) and auth. No content-type check. A user can upload `.html`, `.js`, or `.exe` files. While Firebase Storage doesn't serve files as web content by default, this can be used for phishing (sharing malicious download URLs), storing arbitrary data, or bypassing intended use.

**Fix:** Add `request.resource.contentType.matches('image/.*') || request.resource.contentType.matches('audio/.*')` restriction.

---

### M-4: `use-auth.ts` — VIP expiration writes triggered from every admin client simultaneously

**File:** `src/hooks/use-auth.ts:300-320`

Every logged-in admin runs the VIP expiration check on every `users` subscription update. If there are 3 admin accounts online, 3 simultaneous `updateUser(id, { role: 'user' })` writes fire for each expired VIP. No deduplication. Beyond the write storm, this is a TOCTOU risk if two admins race on the same user record.

**Fix:** Move VIP expiration to a Cloud Function triggered on a schedule (Firebase scheduled functions, once daily), removing the client-side write entirely.

---

### M-5: `use-auth.ts` — plaintext password fallback in login path

**File:** `src/hooks/use-auth.ts:95-100`

```ts
const matchesPlaintext = !matchesHash && storedPassword === password;
if (!matchesHash && !matchesPlaintext) { ... }
```

The comment says "plaintext fallback" is for migration. But this means the app actively accepts and authenticates users whose passwords were stored in plaintext, without forcing them to change. If the Firestore `private/auth` document is missing (e.g., old user, or doc deletion race), `getUserPassword` returns `null`, falls back to `user.password` (which is `''` from `addUser`), and the comparison `'' === password` fails — acceptable. But if legacy data somehow contains plaintext passwords, they are authenticated without any prompt to migrate and the migration only runs if `matchesPlaintext` is true AND the hash step succeeds. The fallback should at minimum force a password reset rather than silently authenticating.

---

### M-6: `firebase.json` / `vercel.json` — CSP missing `strict-dynamic` and `nonce`, `unsafe-eval` remains

**File:** `vercel.json:12`

```
script-src 'self' 'unsafe-inline' 'unsafe-eval'
```

`unsafe-eval` enables `eval()` and `new Function()`. Combined with `unsafe-inline`, the CSP provides minimal XSS protection — it would not block any injected script. This was likely required for Vite/React in development, but production builds should use hashed scripts or nonces with `strict-dynamic`.

**Note:** This is a defense-in-depth issue; the real XSS fix is C-1 above.

---

## LOW Issues

### L-1: `cors.json` (Firebase Storage CORS) only covers `GET`/`HEAD` — not aligned with upload usage

**File:** `cors.json`

Storage uploads use `PUT` (via Firebase SDK, which uses multipart or resumable upload). The CORS config only lists `GET, HEAD`. If a user uploads from a non-allowlisted origin via direct SDK calls, the preflight for `PUT` would be denied. This doesn't create a vulnerability but could cause operational confusion, and may have been set more restrictively than needed.

---

### L-2: `vercel.json` missing `Permissions-Policy` and `Strict-Transport-Security` headers

**File:** `vercel.json`

No `Permissions-Policy` to restrict microphone/camera access to same-origin only. The app uses `getUserMedia` for speech recognition — policy header should limit this. No HSTS header (Vercel handles TLS termination, but explicit HSTS with `preload` is best practice).

---

### L-3: `use-auth.ts` — `users` list exposed via context includes password hash field path

**File:** `src/hooks/use-auth.ts:56-57`, `user-service.ts:31-35`

`subscribeToUsers` maps all documents including the `password` field. `addUser` stores `password: ''` on the public document, so an empty string leaks. Not a direct exploit, but confirms the field exists and may confuse future developers into accessing it there.

---

### L-4: `game-visibility-storage.ts` error logs to `console.error` with raw exception

**File:** `src/services/game-visibility-storage.ts:23`

Minor: `console.error('Failed to load game visibility settings:', e)` — low sensitivity, but consistent practice should be to use `handleError()` from the project's error handler to avoid inconsistent error exposure patterns.

---

## Positive Observations

- PBKDF2 with random salt and 100k iterations is correct for password hashing.
- `timingSafeEqual` correctly prevents timing attacks on hash comparison.
- `fromHex` validates input before processing.
- `common/furigana-text.tsx` and `lib/furigana-utils.ts` correctly use DOMPurify.
- `groq-worker.js` never exposes the API key to the response body.
- Claude API (`claude-api.ts`) applies client-side rate limiting.
- Firestore private subcollection for passwords is a sound design.
- `isLocked` field enforcement in Firestore rules is correct.
- `studySessions`/`gameSessions`/`jlptSessions` creation rules correctly enforce `userId == request.auth.uid`.

---

## Recommended Actions (Priority Order)

1. **[C-1]** Add DOMPurify to `ui/furigana-text.tsx:convertManualFuriganaToHtml` — or consolidate to `lib/furigana-utils.ts`. Single-line fix, highest impact.
2. **[C-4]** Fix Firestore rules: restrict `isOwner` updates to non-privileged fields only using `affectedKeys().hasOnly(...)`.
3. **[C-3]** Add authorization guard to `changePassword` + raise min-length to 8.
4. **[C-2]** Remove `DEFAULT_ADMIN_PW` hardcoded string or replace with secure bootstrapping.
5. **[H-1]** Proxy `VITE_GOOGLE_STT_API_KEY` — add a worker for Google STT identical to the Groq worker.
6. **[H-2]** Apply `groqLimiter.tryRequest()` in all Groq call sites.
7. **[H-3]** Add `lectures/` write rule to `storage.rules` (admin-only).
8. **[H-4]** Hard-code production origin in `groq-worker.js` `ALLOWED_ORIGINS`.
9. **[H-5]** Restrict `subscribeToUsers` to admin-only; create public-profile endpoint for leaderboard.
10. **[M-1]** Remove `role` from `localStorage` session; derive from Firestore.
11. **[M-3]** Add content-type restriction to Storage rules for user uploads.
12. **[M-4]** Move VIP expiration to a Cloud Function (scheduled trigger).

---

## Metrics

- Critical issues: 4
- High issues: 5
- Medium issues: 6
- Low issues: 4
- Total: 19 findings

---

## Unresolved Questions

1. Does the production deployment have `ALLOWED_ORIGIN` set correctly in the Groq worker? Cannot verify from source alone.
2. Is `VITE_GOOGLE_STT_API_KEY` actually populated in production `.env`? If yes, the key is in the live bundle right now.
3. Are there legacy users in Firestore with plaintext passwords (M-5 migration path)? If yes, those accounts are at risk from a Firestore data breach.
4. The `lectures/` upload path appears to be **broken in production** (no write rule) — was this noticed? Is lecture media upload working at all?
