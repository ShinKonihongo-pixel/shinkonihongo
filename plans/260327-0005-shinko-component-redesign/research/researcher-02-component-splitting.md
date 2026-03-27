---
title: React Component & Code Splitting Best Practices
date: 2026-03-27
topics: component decomposition, code splitting, Vite chunks, hook composition, CSS splitting
---

## Key Findings

### 1. Component Decomposition (500+ → <200 LOC)
- Container/presentation pattern + custom hooks extraction
- Feature-based folder structure with clear API contracts
- Benefit: granular re-render boundaries, easier code-splitting

### 2. React.lazy + Suspense for 30+ Routes
- Route-level splitting is simplest entry point
- Default exports only; error boundaries required
- Avoid excessive splitting — use granular Suspense boundaries

### 3. Vite Manual Chunk Splitting
- Config via `build.rollupOptions.output.manualChunks`
- Vendor isolation (rarely-changing = better caching)
- Target: 150-250 kB chunks; avoid >500 kB

### 4. Hook Composition (400-500 LOC)
- Split by unrelated concerns (data fetch, forms, websockets)
- Compose smaller hooks in components
- Benefits: testability, reusability, isolated re-renders

### 5. CSS Splitting (115K LOC)
- Component-scoped `.css` files with direct imports (already in use)
- Refactor away `!important` (116 instances remain)
- Conditional imports for rarely-used features

## Recommendation for Shinko
Split largest files first (svg-charts 1161, game-create 849). Use feature-folder pattern. Hook composition for use-speaking-practice (512) and use-quiz-game (439).
