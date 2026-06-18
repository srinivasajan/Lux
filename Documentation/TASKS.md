# Tasks / Roadmap Execution

This document contains atomic tickets derived from the MVP milestones in the PRD.

## Definition of Done (DoD)
Every task must satisfy:
- ✓ Compiles
- ✓ Lints
- ✓ Typechecks
- ✓ Tests pass
- ✓ Documentation updated
- ✓ No placeholder code (`throw new Error("Not implemented")` is acceptable for unwritten boundaries).

---

## M1: Foundation (Current)
- [ ] **TASK-1.1:** Scaffold base Vite + `@crxjs/vite-plugin` project structure with strict TypeScript.
- [ ] **TASK-1.2:** Setup Dexie DB schema in `core/storage/idb.ts`.
- [ ] **TASK-1.3:** Build Profile Data models and typings in `core/types`.
- [ ] **TASK-1.4:** Create Profile Manager UI form in `options/` using Vanilla JS/HTML/CSS.
- [ ] **TASK-1.5:** Wire Profile Manager UI to Dexie `Profile` table (Read/Write).

## M2: Analyzer
- [ ] **TASK-2.1:** Implement LinkedIn DOM Scraper in `features/analyzer/linkedin.ts`.
- [ ] **TASK-2.2:** Implement Matcher algorithm (Skills 50%, Exp 30%, Ed 20%).
- [ ] **TASK-2.3:** Inject Sidebar UI into host page via Content Script.
- [ ] **TASK-2.4:** Wire Scraper to Matcher, display results in injected Sidebar.

## M3: Tracker
- [ ] **TASK-3.1:** Implement Application Log UI in `options/` (Table with filters).
- [ ] **TASK-3.2:** Implement Submit button listener in Content Script to auto-log to Dexie `applications` table.
- [ ] **TASK-3.3:** Add manual Status update controls to the Tracker UI.

## M4: Resume Engine
- [ ] **TASK-4.1:** Implement `pdf-lib` generation logic from Master Profile (no tailoring yet).
- [ ] **TASK-4.2:** Implement `LocalTailor` engine (keyword swapping fallback).
- [ ] **TASK-4.3:** Implement `NvidiaTailor` engine (API integration).
- [ ] **TASK-4.4:** Wire Sidebar "Generate" button to trigger tailoring and download PDF.

## M5: Analytics & Polish
- [ ] **TASK-5.1:** Implement Popup UI Quick Stats (Total Applied, Quota).
- [ ] **TASK-5.2:** Implement Analytics Dashboard charts/tables in `options/`.
- [ ] **TASK-5.3:** Implement CSV Export function from Dexie.
- [ ] **TASK-5.4:** Add Daily Quota limits and Error boundaries.
