# Architectural Decision Record

## 1. Why Vanilla TS over React/Vue?
**Decision:** We are using Vanilla HTML/CSS/TypeScript.
**Reason:** 
- Chrome extensions, particularly Content Scripts that inject into host pages (like LinkedIn), need to be extremely lightweight to avoid conflicting with the host page's own frameworks.
- A virtual DOM overhead is unnecessary for the simple UI requirements (a sidebar, a popup, an options page).
- Keeps the bundle size small and loading times instantaneous.

## 2. Why Dexie / IndexedDB?
**Decision:** We are using Dexie as a wrapper over IndexedDB.
**Reason:** 
- `chrome.storage.local` is capped at around 10MB (or 5MB per item), which is insufficient for storing thousands of application records, resume PDF snapshots, and the Master Profile over time.
- IndexedDB handles large storage capacities and supports indexed querying (e.g., finding all applications for "LinkedIn"), making the analytics dashboard performant.
- Dexie simplifies the notoriously verbose native IndexedDB API and provides robust TypeScript support.

## 3. Why `@crxjs/vite-plugin` over `vite-plugin-web-extension`?
**Decision:** We are using Vite paired with `@crxjs/vite-plugin`.
**Reason:** 
- `@crxjs/vite-plugin` is built specifically for Manifest V3.
- It offers a superior developer experience with Hot Module Replacement (HMR) that works correctly across background service workers, content scripts, and HTML pages.
- It is more popular, better maintained, and parses the `manifest.json` directly to automatically configure Rollup's multiple entry points, eliminating manual bundler configuration.

## 4. Why Manifest V3?
**Decision:** Chrome Extension Manifest V3.
**Reason:** 
- Manifest V2 is deprecated by Google and extensions using it will be removed from the Chrome Web Store. V3 is mandatory for new extensions.
- Enforces better security and performance (e.g., Service Workers instead of persistent Background Pages).

## 5. Why no backend / local-first?
**Decision:** All logic and storage reside on the user's device.
**Reason:** 
- **Privacy:** Job hunting data is highly sensitive. Local-first guarantees no data mining or leaks.
- **Cost:** Eliminates server, database, and hosting costs. The user provides their own NVIDIA API key, shifting the LLM computation cost away from the developer.
- **Speed:** Instant UI responses without network latency (except for the NIM API call).

## 6. Why Architecture Flattening (M1.1)?
**Decision:** Removed the explicit Repository layer for data entities.
**Reason:** 
- During the M1 review, it became apparent that using both a Service layer and a Repository layer to wrap Dexie (which is already a wrapper for IndexedDB) created unnecessary boilerplate.
- The project has zero backend API requirements; everything is local-first. 
- Dexie's API (`db.profile.put`) is already highly expressive and typed, making custom Repository abstractions overly redundant ("wrapping a wrapper"). 
- The Service layer remains necessary to enforce `Zod` schema validation boundaries before data touches IndexedDB.
