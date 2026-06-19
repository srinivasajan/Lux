# M4.2 — Resume Rendering Engine Report

**Status:** Complete  
**Date:** 2026-06-19  
**Branch:** master

---

## Files Changed

### New Files

| File | Description |
|---|---|
| `src/features/resume/renderers/renderer.factory.ts` | Factory class mapped to template IDs |
| `src/features/resume/renderers/ats.renderer.ts` | ATS Classic plain-text HTML renderer |
| `src/features/resume/renderers/modern.renderer.ts` | Modern two-column HTML renderer |
| `src/features/resume/renderers/ats.preview.css` | Canonical styles for ATS layout |
| `src/features/resume/renderers/modern.preview.css` | Canonical styles for Modern layout |
| `tests/unit/renderer.test.ts` | Exhaustive layout & escaping tests |
| `tests/integration/resume.preview.integration.test.ts` | Auto-versioning & template switch logic test |
| `Documentation/RENDERING_ARCHITECTURE.md` | Engine documentation |

### Modified Files

| File | Change |
|---|---|
| `src/options/options.html` | Added iframe-based preview panel |
| `src/options/options.ts` | Added `updatePreview()` logic, live input listeners, and auto-snapshot on save |
| `src/options/options.css` | Added styling for the preview container |

---

## Architecture Summary

1.  **Factory Pattern**: `RendererFactory.create(templateId)` returns the appropriate
    `ResumeRenderer` instance, ensuring compile-time safety across supported templates.
2.  **HTML Isolation**: The UI dynamically injects rendered output into a sandboxed
    `iframe` (`srcdoc`), preventing CSS leakage between the extension UI and the resume styles.
3.  **Graceful Fallbacks**: The renderers safely process empty, incomplete, or malformed
    section data (`Record<string, unknown>`). HTML entities are strictly escaped to prevent XSS.
4.  **Auto-Versioning**: Calling `save` in the UI now seamlessly creates a `ResumeVersion`
    snapshot alongside the `Resume` update, enabling historical recovery (needed for AI later).

---

## Test Results

```
Test Files  13 passed (13)     ← +2 new test files
Tests       82 passed (82)     ← +9 new tests

npm run build     ✓ clean (106 modules transformed)
npm run typecheck ✓ 0 errors
npm run lint      ✓ 0 errors, 3 pre-existing warnings
npm run test      ✓ 82/82 passed
```

---

## Definition of Done Validated

- [x] Resume preview visible in iframe.
- [x] Template switching updates live preview instantly.
- [x] Snapshot versions created automatically on save.
- [x] Supports Summary, Education, Experience, Projects, Skills sections.
- [x] All 82 tests pass.
- [x] No PDF generation included.
- [x] No AI included.
- [x] No placeholder code.
