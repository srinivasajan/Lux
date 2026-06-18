# Architecture Document

## Overview
Lux is a local-first Chrome Extension built on Manifest V3. It features a domain-based modular architecture using Vanilla TypeScript and Vite (`@crxjs/vite-plugin`).

## Tech Stack
- **Framework:** Vanilla HTML/CSS/JS (No React/Vue/Svelte)
- **Language:** TypeScript (Strict mode enabled)
- **Bundler:** Vite with `@crxjs/vite-plugin`
- **Database:** IndexedDB via Dexie.js
- **PDF Generation:** pdf-lib
- **Storage:** Chrome `storage.local` for settings, IndexedDB for primary data

## Architectural Layers

### 1. Presentation Layer (UI)
**Location**: `src/options/`, `src/popup/`
- Standard HTML/CSS/JS (TypeScript) bound directly to the DOM.
- Orchestrates forms, button clicks, and basic validations before passing payloads to services.
- Displays visual success/error states directly to the user.

### 2. Business Logic Layer (Services)
**Location**: `src/features/*/`
- Validates structural integrity using `Zod` schemas.
- Translates UI intent into specific operations.
- Interacts directly with the local data stores.

### 3. Storage Layer
**Location**: `src/core/storage/idb.ts` and `chrome.ts`
- **IndexedDB via Dexie**: Serves as the master database for Profiles, Resumes, and Application tracking. Singleton pattern utilized for the master profile.
- **Chrome Storage**: Holds lightweight extension settings (e.g., NVIDIA NIM API Key).

## Directory Structure
The application uses a feature-based architectural pattern to ensure scalability:

```text
src/
├── features/          # Independent, domain-specific modules
│   ├── profile/       # Profile management and data entry
│   ├── analyzer/      # JD scraping and match score calculation
│   ├── resume/        # Tailoring engine and PDF generation
│   ├── tracker/       # Application logging and history
│   └── analytics/     # Metrics and charting
├── core/              # Shared infrastructure and utilities
│   ├── storage/       # Dexie setup and Chrome storage wrappers
│   ├── messaging/     # Content <-> Background communication
│   ├── config/        # Constants and environment-like settings
│   └── types/         # Global TypeScript interfaces
├── background/        # Service worker entry point
├── content/           # Content scripts (analyzer, sidebar UI injection)
├── popup/             # Extension popup UI (controls, toggles)
└── options/           # Options page UI (Profile manager, full log view)
```

## Storage Layer
1. **IndexedDB (Dexie):**
   - Handles large, structured data sets.
   - Tables: `Profile`, `Applications`, `ResumeVersions`.
2. **`chrome.storage.local`:**
   - Handles lightweight configuration (toggles, limits, API keys).

## Communication Strategy
- **Content Scripts -> Background:** Used for triggering background tasks (e.g., saving an application log) via `chrome.runtime.sendMessage`.
- **Background -> Content Scripts:** Used for injecting the sidebar or returning data asynchronously.
- **Popup/Options -> Background:** Used for reading/writing configuration or initiating PDF generation.

## Build and Bundling
Vite, powered by `@crxjs/vite-plugin`, automatically parses `manifest.json` to configure Rollup entry points for all HTML pages, content scripts, and the background service worker.

## Coding Standards
- No placeholder code (`TODO`, `FIXME`, empty methods). Unimplemented code must explicitly `throw new Error("Not implemented")`.
- Strict typing enforcement: No `any`.
