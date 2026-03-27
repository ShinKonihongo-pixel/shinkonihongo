---
title: React 19 Context & Prop Drilling Elimination
date: 2026-03-27
topics: context performance, splitting strategies, router integration, incremental migration
---

## Key Findings

### 1. React 19 Context Performance
- `useContextSelector` enables granular subscriptions (no external packages needed)
- New `<Context>` provider syntax replacing `Context.Provider`
- Solves "god context" re-render problem if used correctly

### 2. Context Splitting Strategy
- Separate read (state) from write (dispatch) contexts → prevents unnecessary re-renders
- Domain-based splitting (Auth, Theme, UI, Data) isolates update boundaries
- Components using only dispatch won't re-render during state mutations

### 3. React Router v6 + Context Integration
- `useOutletContext` replaces prop drilling between layout and nested routes
- Layout routes manage state, children consume via hook pattern
- Best for layout-level state (auth, sidebar, breadcrumbs)

### 4. Incremental Migration
- Coexist props + context + outlet context during transition
- Target high-impact prop chains (3+ levels deep) first
- Wrap expensive consumers with React.memo

### 5. Performance Comparison (30+ page apps)
- Optimized Context: 0 KB overhead, ~95% as fast as Zustand
- Zustand: 70-90% fewer unnecessary re-renders, 2 KB
- Context viable but requires discipline in splitting

## Recommendation for Shinko
Direct context consumption in pages is the right approach. No need for Zustand — existing contexts are well-scoped. Key: ensure contexts split read/write if re-render issues arise.
