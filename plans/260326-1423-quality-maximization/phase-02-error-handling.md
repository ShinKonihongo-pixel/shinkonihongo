# Phase 2: Error Handling Standardization

## Context
- [Main Plan](./plan.md)
- **Date:** 2026-03-26
- **Priority:** HIGH | **Risk:** LOW | **Status:** NOT STARTED

## Overview
Standardize ~200 catch blocks across 60+ files. Eliminate silent catches, create shared error handler utility, establish consistent hook error pattern.

## Key Insights
- 129+ catch blocks across hooks/services; ~60 are silent (no logging)
- use-auth.ts has 12 catches, use-quiz-game.ts 15, use-teachers.ts 15
- No centralized error reporting; errors lost in production
- Mixed patterns: some use `setError()`, some `console.error`, some do nothing
- use-custom-topics.ts has 9 catches - likely repetitive CRUD pattern

## Requirements
1. Create `handleError` utility with severity levels + optional user-facing message
2. Every catch block must at minimum call `handleError`
3. Hooks that manage UI state must also call `setError` for user feedback
4. No silent catches remain after this phase
5. Error messages remain in Vietnamese (existing language)

## Architecture

### New files
```
src/utils/error-handler.ts    # Central error handling utility
```

### handleError API
```ts
type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

interface HandleErrorOptions {
  severity?: ErrorSeverity;
  context?: string;        // e.g., "use-auth/login"
  userMessage?: string;    // Vietnamese user-facing message
  silent?: boolean;        // true = log only, no UI
}

export function handleError(error: unknown, options?: HandleErrorOptions): string {
  // 1. Normalize error to string message
  // 2. console.error with context prefix
  // 3. In production: send to analytics (trackError)
  // 4. Return normalized message for setError() usage
}
```

### Standard Hook Pattern
```ts
try {
  await someOperation();
} catch (err) {
  const msg = handleError(err, { context: 'useAuth/login', severity: 'error' });
  setError(msg);
}
```

## Related Code Files (highest catch count)
- `src/hooks/use-quiz-game.ts` (15 catches)
- `src/hooks/use-teachers.ts` (15 catches)
- `src/hooks/use-auth.ts` (12 catches)
- `src/hooks/use-custom-topics.ts` (9 catches)
- `src/hooks/use-lessons.ts` (7 catches)
- `src/hooks/classrooms/use-test-templates.ts` (7 catches)
- `src/hooks/use-kanji-analysis.ts` (6 catches)
- `src/services/kanji-ai-service.ts` (6 catches)
- `src/hooks/game-sounds/use-game-sounds-hook.ts` (5 catches)

## Implementation Steps

### Step 1: Create error handler utility
- Build `src/utils/error-handler.ts`
- Handle Error objects, strings, unknown types
- Include context tagging for easy debugging
- Wire to existing analytics `trackError` if available

### Step 2: Fix critical hooks (auth, quiz, teachers)
- Start with use-auth.ts (12 catches) - auth errors are security-critical
- Then use-quiz-game.ts (15 catches) - game state errors affect UX
- Then use-teachers.ts (15 catches) - admin data integrity

### Step 3: Fix remaining hooks
- Process hooks by catch count descending
- For each: replace silent catches with `handleError` + `setError` where applicable
- For service files: `handleError` with `silent: true` for expected failures

### Step 4: Fix service layer catches
- Services should throw, not swallow
- Remove catches that hide errors from hook layer
- Add handleError only for expected failures (e.g., network timeout retries)

### Step 5: Audit completion
- Grep for empty catch blocks
- Grep for bare `console.error` without handleError
- Ensure 100% coverage

## Todo
- [ ] Create `src/utils/error-handler.ts`
- [ ] Refactor use-auth.ts (12 catches)
- [ ] Refactor use-quiz-game.ts (15 catches)
- [ ] Refactor use-teachers.ts (15 catches)
- [ ] Refactor use-custom-topics.ts (9 catches)
- [ ] Refactor use-lessons.ts (7 catches)
- [ ] Refactor classrooms/use-test-templates.ts (7 catches)
- [ ] Refactor use-kanji-analysis.ts (6 catches)
- [ ] Refactor remaining hooks (~30 files with 1-5 catches each)
- [ ] Refactor service layer catches (~15 files)
- [ ] Final audit: zero silent catches

## Success Criteria
- Zero silent catch blocks
- All catches use `handleError` utility
- Hooks with UI state also call `setError`
- Error context (file/function) included in every log
- No user-facing error messages expose internals

## Risk Assessment
- **LOW**: Only changes catch block internals; no control flow changes
- Error messages remain same for users
- Worst case: over-logging (easily tuned via severity levels)

## Security Considerations
- Never log sensitive data (passwords, tokens) in error context
- Sanitize Firebase error messages before showing to users
- Critical severity errors in auth flows should trigger logout if token invalid

## Next Steps
Phase 3 (App.tsx decomposition) benefits from standardized error handling in extracted hooks.
