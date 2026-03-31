# Code Review Summary

**Date:** 2026-03-31
**Reviewer:** code-reviewer subagent
**Commit range:** HEAD (uncommitted working tree changes)

---

## Scope

- Files reviewed: 125 changed files (full diff reviewed; focused analysis on security-critical files)
- Lines: 591 insertions / 710 deletions (net −119, healthy deletions)
- Review focus: Security-critical new files + all uncommitted changes
- Key files: `auth-context.tsx`, `password-hash.ts`, `groq-worker.js`, `storage.rules`, `firestore.rules`, `vercel.json`, `cors.json`, `use-auth.ts`, `user-service.ts`, `user-data-context.tsx`
- Updated plans: none (no plan file provided)

---

## Overall Assessment

This is a solid security-focused refactoring pass. The most important improvements — moving API keys server-side via Cloudflare Workers proxy, upgrading SHA-256 to PBKDF2, splitting password storage into a Firestore private subcollection, scoping Firestore rules to document owners, hardening CORS, and adding CSP headers — are all genuine improvements. Type checks pass clean. No regressions found in component refactoring.

**Four real issues require attention**, ranging from high to medium severity.

---

## Critical Issues

None.

---

## High Priority Findings

### H1 — `storage.rules`: Any authenticated user can write any file (up to 50 MB)

```
allow write: if request.auth != null && request.resource.size < 50 * 1024 * 1024;
```

**Problem:** Every authenticated user can upload 50 MB to *any* path in Firebase Storage. No path scoping. A user can overwrite `/users/other-user-id/avatar` or spam storage with large files.

**Fix:** Scope writes by path:

```
match /users/{userId}/{allPaths=**} {
  allow read:  if request.auth != null;
  allow write: if request.auth.uid == userId
               && request.resource.size < 5 * 1024 * 1024; // 5 MB per file
}
match /public/{allPaths=**} {
  allow read:  if true;
  allow write: if request.auth != null && isAdmin();
}
```

---

### H2 — `password-hash.ts`: Non-constant-time comparison enables timing oracle

```ts
return toHex(new Uint8Array(hashBuffer)) === expectedHash; // line 62
return computed === storedHash;                             // line 69
```

**Problem:** JavaScript string `===` short-circuits on the first differing character. In a server environment this can be exploited for timing attacks against stored hashes. Less exploitable in a browser context (network jitter dominates), but PBKDF2 at 100k iterations was added specifically for security — the comparison should match that intent.

**Fix:** Replace string equality with a constant-time byte-by-byte comparison:

```ts
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
```

Use `timingSafeEqual(toHex(...), expectedHash)` and `timingSafeEqual(computed, storedHash)`.

---

## Medium Priority Findings

### M1 — `use-auth.ts`: Base64 "obfuscation" of default password is security theater

```ts
const DEFAULT_ADMIN_PW = atob('c3VwZXJhZG1pbg=='); // decodes to "superadmin"
```

**Problem:** `atob('c3VwZXJhZG1pbg==')` is trivially reversible — anyone reading the source (or the compiled bundle) gets `"superadmin"` instantly. The comment claims it avoids "plain grep" but it's in the bundle as a string literal after Vite compiles it. It adds zero security while adding false confidence. The well-known default username is also `superadmin`.

**Fix:** Remove the base64 pretense. Leave the plaintext string with a clear comment that it MUST be changed on first deploy, or better: require the deployer to pass `DEFAULT_ADMIN_PW` as an environment variable and refuse to create the account if it is not set.

```ts
// Require operator to set this — no default fallback
const DEFAULT_ADMIN_PW = import.meta.env.VITE_DEFAULT_ADMIN_PW;
if (!DEFAULT_ADMIN_PW) throw new Error('Set VITE_DEFAULT_ADMIN_PW before first deploy');
```

---

### M2 — `vercel.json` CSP: `workers.dev` not in `connect-src`; CSP will block proxy calls in production

```
connect-src 'self' https://*.firebaseio.com https://*.googleapis.com ...
```

**Problem:** `VITE_GROQ_PROXY_URL` points to `https://shinko-groq-proxy.<subdomain>.workers.dev` and `VITE_ANTHROPIC_PROXY_URL` points to a similar Cloudflare Worker. Neither `*.workers.dev` nor the specific domains are in `connect-src`. When deployed to Vercel with this CSP, all AI features will be blocked by the browser.

**Fix:** Add to `connect-src`:

```
https://*.workers.dev
```

Or the specific worker URLs if known. Also add `https://api.groq.com` as fallback for local dev without proxy.

---

### M3 — `firestore.rules`: `vocabularyNotes` / `vocabularyNotebooks` `create` doesn't enforce `userId`

```
allow create: if isAuth();
```

**Problem:** A user can create a note with `userId` set to another user's UID, then that other user "owns" the document and cannot be prevented from accessing it — or conversely the attacker can later claim they authored it. The read/update/delete rules do check `userId`, making the create rule the weak link.

**Fix:**

```
allow create: if isAuth() && request.resource.data.userId == request.auth.uid;
```

---

### M4 — `password-hash.ts`: `fromHex` called with unchecked `parts[1]` — potential NaN injection

```ts
const salt = fromHex(parts[1]);
```

If a stored hash has been tampered (e.g., `parts[1]` is an odd-length or non-hex string), `parseInt(hex.substring(i, i + 2), 16)` returns `NaN`, which gets coerced to `0`. The function will silently produce a wrong salt rather than throwing. This won't cause a security bypass (wrong salt → wrong hash → verification fails), but it can produce confusing silent errors.

**Fix:** Add a guard:

```ts
if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) throw new Error('Invalid hex string');
```

---

## Low Priority Suggestions

### L1 — `groq-worker.js`: No rate limiting

The Cloudflare Worker proxy has no rate limiting. A compromised or bot-driven client can exhaust the Groq API quota. Cloudflare Workers has a built-in `rate_limit` binding (or use a KV-backed counter). Worth adding before production.

### L2 — `password-hash.ts`: Minimum password length is 4 characters

Both `register` and `changePassword` enforce `length < 4`. This is extremely weak. 8 is a reasonable minimum. The PBKDF2 upgrade is negated somewhat by accepting `"abc1"` as a valid password.

### L3 — `user-data-context.tsx`: `useMemo` spreads entire `auth` object

```ts
const value = useMemo(() => ({ ...auth, ...history, ... }), [auth, ...]);
```

Because `auth` is spread, any new field added to `AuthContextValue` is automatically included in `UserDataContextValue` without a corresponding type update. This can silently widen the public API. Explicit pass-through (as it was before) is safer. Low impact now, but a future maintainability concern.

### L4 — `groq-worker.js`: Error detail leaks internal messages to client

```js
return new Response(JSON.stringify({ error: 'Proxy error', detail: err.message }), ...);
```

`err.message` from a failed `fetch()` may include internal Cloudflare Worker details. Strip the `detail` field or replace with a generic message in production.

### L5 — `use-auth.ts`: Silent migration on login writes to public `password` field, not private subcollection

Line 106: `await firestoreService.updateUser(user.id, { password: newHash })` — `updateUser` in `user-service.ts` does correctly route password updates to the private subcollection (when `data.password` is truthy). This is correct. But it also writes an empty-string `password: ''` to the public doc on first `addUser` (line 33 of user-service.ts). The public `User` type still has `password: string` marked `// DEPRECATED`. Until migration is complete, some code paths may still read `user.password` from the public doc. Track this carefully.

---

## Positive Observations

- **PBKDF2 upgrade** with per-password random salt and 100k iterations is the correct approach. Backward-compat handling for SHA-256 and plaintext is clean.
- **`CurrentUser` type excludes `password`** — confirmed at line 112 of `use-auth.ts`. Password never lands in `localStorage` via the session token. Good.
- **Proxy sentinel pattern** (`'proxy'` string) is pragmatic and applied consistently across all 6+ Groq call sites. Beats passing `undefined | string` everywhere.
- **`cors.json`** changed from `"*"` to explicit origin whitelist — correct fix.
- **`AuthContext` split** from `UserDataContext` is architecturally sound. Auth-only consumers avoid social/notification re-renders.
- **VIP expiry now admin-only** — prevents N-client × M-user write fan-out. Good optimization.
- **Firestore `kanjiAnalysis`** create rule now enforces `userId == request.auth.uid`. Correct fix.
- **TypeScript: zero errors** — clean pass.
- **Component refactoring** (StatCard, TabBar, SearchInput adoption) — genuine DRY improvements with no regressions found.

---

## Recommended Actions

1. **[High]** Fix `storage.rules` — scope writes to `users/{userId}/...` paths; reduce 50 MB limit.
2. **[High]** Replace `===` string comparison in `password-hash.ts` with constant-time comparison.
3. **[Medium]** Remove base64 obfuscation of default admin password; require env var or document clearly.
4. **[Medium]** Add `*.workers.dev` (or specific worker URLs) to CSP `connect-src` in `vercel.json`.
5. **[Medium]** Add `userId == request.auth.uid` to `vocabularyNotes`/`vocabularyNotebooks` `create` rules.
6. **[Medium]** Add hex-string validation guard in `fromHex()`.
7. **[Low]** Add rate limiting to `groq-worker.js` (Cloudflare rate_limit binding).
8. **[Low]** Raise minimum password length from 4 to 8.
9. **[Low]** Strip `detail: err.message` from proxy error response.

---

## Metrics

- Type coverage: TypeScript — 0 errors
- Test coverage: not measured in this review
- Linting issues: 0 critical, 0 high (tsc clean)
- Security findings: 0 critical, 2 high, 4 medium, 4 low

---

## Unresolved Questions

1. Is `google-speech.ts` intended to accept `VITE_GOOGLE_STT_API_KEY` as a direct browser-side key? If so it should be noted as a known risk and moved to a proxy like the Groq key was. The `.env.example` lists `VITE_GOOGLE_STT_API_KEY=` without the same "INSECURE" warning it uses for `VITE_GROQ_API_KEY`.

2. The `User.password` field is marked `DEPRECATED` but still required (`string`, not `string | undefined`). Is there a migration plan / timeline to remove it from the public document entirely? Until then, any `getUsers()` call returns password hashes (PBKDF2 strings) in the response for users who haven't triggered the migration yet.
