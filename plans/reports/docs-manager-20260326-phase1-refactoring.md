# Documentation Update Report: Phase 1 Maintainability Refactoring

**Date:** 2026-03-26
**File Updated:** `/docs/system-architecture.md`

## Summary of Changes

Updated `system-architecture.md` to reflect Phase 1 maintainability refactoring initiatives with minimal, surgical edits.

## Changes Made

### 1. Service Layer (Firestore services diagram)
- Added 3 new services to the architecture diagram:
  - `exercise-service`
  - `reading-service`
  - `listening-service`
- Location: Architecture pattern diagram, service layer box (lines 49-51)

### 2. Hooks Directory Listing
- Added service-based hooks to the directory structure:
  - `use-exercises.ts` (Exercise data via service)
  - `use-reading.ts` (Reading practice data via service)
  - `use-listening.ts` (Listening study data via service)
- Documented new `settings/` module under hooks (split from monolithic `use-settings.ts`)
- Location: Key Directories section, `src/hooks/` entry (lines 80-87)

### 3. Role Hierarchy (Access Control)
- Enhanced access control description to mention centralized `src/utils/role-permissions.ts`
- Noted new `canAccessPage()` utility for page-level access control
- Location: Role Hierarchy section (line 170)

## Files Modified

- `/docs/system-architecture.md` (3 surgical edits, ~10 lines added/modified)

## Untracked Changes in Codebase

Per git status:
- New service files: `exercise-service.ts`, `reading-service.ts`, `listening-service.ts` in `src/services/firestore/`
- New utility: `src/utils/role-permissions.ts`
- New settings module: `src/hooks/settings/` (split from `use-settings.ts`)
- Type update: `listening.ts` now exports `normalizeLessonType`, has `storagePath` on `ListeningAudio`
- 3 hooks refactored to use service layer: `use-exercises`, `use-reading`, `use-listening`

## Notes

- Documentation does not yet include full `project-overview-pdr.md`, `code-standards.md`, or `codebase-summary.md` files. These may require creation or updates in subsequent documentation phases.
- Architecture diagram intentionally kept concise—no detailed listing of new service signatures, as interface details are better suited to service-specific documentation.
