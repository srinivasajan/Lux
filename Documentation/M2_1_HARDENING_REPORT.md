# Milestone 2.1 Hardening Report

## 1. Files Changed
- `manifest.json`: Restricted entirely to `*://*.linkedin.com/*`.
- `src/core/messaging/types.ts`: Added `OPEN_OPTIONS` message definitions.
- `src/background/service-worker.ts`: Implemented `OPEN_OPTIONS` proxy relay logic.
- `src/features/analyzer/ui/sidebar.ts`: Added `renderSetupUI()` for missing profiles.
- `src/content/analyzer.ts`: Stripped out interval polling; implemented dual-layer `MutationObserver` (URL & Job Container) with deep debouncing and duplicate state checking.
- `tests/unit/linkedin.extractor.test.ts`: Added explicit missing-node degradation suites.
- `tests/integration/analyzer.integration.test.ts`: Added `vitest` SPA navigation and mutation trigger logic.
- `Documentation/SELECTOR_STRATEGY.md`: Documented all extraction queries.
- `Documentation/MATCHING_STRATEGY.md`: Documented the exact normalized skill matching engine.

## 2. Polling Removal & MutationObserver Details
**Before:** The extension mindlessly executed DOM extraction every 2,000ms regardless of context.
**After:** 
1. **URL Observer:** A lightweight `MutationObserver` watches `document.body` but only fires extraction if `location.href` has physically changed (catching LinkedIn SPA routers).
2. **Container Observer:** Once a job is detected, a secondary scoped `MutationObserver` is attached explicitly to `.jobs-details` or `.job-view-layout`. 
3. **Debouncing & Deduplication:** When the container mutates, it is debounced by 500ms to prevent CPU thrashing during LinkedIn's heavy React updates. Before rendering, it checks `if (currentJobKey === newJobKey && sidebar) return;` to completely eliminate UI flickering.

## 3. Missing Profile UX
Rather than throwing a silent `console.warn()`, a missing profile now triggers `sidebar.renderSetupUI()`. This injects a high-priority "Lux Setup Required" red/blue dialog into the LinkedIn UI. The user clicks "Open Options", which dispatches a message to the Background Service Worker to trigger `chrome.runtime.openOptionsPage()`, elegantly bypassing the Content Script sandbox.

## 4. Test Coverage Additions
- **SPA Navigation Test:** `analyzer.integration.test.ts` forcefully navigates from Job A to Job B, verifying the debounced observer triggers exactly twice.
- **Degradation Testing:** Extractor tests now explicitly remove `h1` titles and company links to ensure the fallback string `''` is safely passed into the pipeline without throwing `TypeError: cannot read property of null`.

## 5. Manual Validation Checklist
- [x] Extension loads only on LinkedIn pages (verify other sites in `chrome://extensions`).
- [x] Navigating via clicking job lists fires the sidebar update once.
- [x] Setting up a new browser with no Lux data triggers the "Setup Required" UI.
- [x] The `v0.2.0` tag is successfully committed.
