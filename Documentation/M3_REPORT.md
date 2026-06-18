# Milestone 3 Report: Application Tracker

## 1. Schema Changes & Migration
The Dexie `LuxDatabase` was safely migrated to Version 2.
**New Table:** `applications`
**Optimized Index:** `++id, &jobUrl, status, appliedAt, company, platform`

The unique constraint `&jobUrl` strictly enforces that no duplicate applications can be created for the exact same job listing, protecting the user from dirty data if they repeatedly open the same LinkedIn page.

## 2. Service Architecture
- **Application Entity:** Defined with a strict `Zod` validation layer containing `ApplicationStatus` and `ApplicationPlatform` enums.
- **ApplicationService:** Handles CRUD operations and catches schema validation issues locally. It rejects additions when `jobUrl` uniqueness is violated.
- **Messaging Bridge:** Due to Content Scripts executing in an isolated storage domain, the analyzer sidebar sends `LOG_APPLICATION` and `CHECK_APPLICATION` payloads to `service-worker.ts`, which safely interacts with IndexedDB.

## 3. UI Implementation
### LinkedIn Sidebar (Capture)
When a user views a job, the sidebar queries IndexedDB. 
- If already logged, it displays an unclickable `Already Logged` button.
- If new, it displays `Log Application`. Clicking it instantly stores the job data, status (`Applied`), and exact URL, then disables itself.

### Popup Dashboard (Tracker)
A fully Vanilla JS implementation separated cleanly between `popup.html`, `popup.css`, `popup.ts` (DOM Binding), and `popup.controller.ts` (Business Logic).
- **Table:** Displays Company, Role, Status, and Date.
- **Actions:** 
  - Inline drop-down to immediately update `Status`.
  - Delete button to wipe the record.
  - View button to re-open the LinkedIn `jobUrl`.
- **Filtering:** Real-time search across `company`/`role` and a dropdown for `Status`.
- **CSV Export:** Fully escaping-safe export utility generating a local `.csv` file.

## 4. Test Coverage
- `application.service.test.ts`: Verified exact Zod boundary validation and `jobUrl` duplicate rejection.
- `csv.export.test.ts`: Validated correct escaping of commas, quotes, and newlines in arbitrary job roles/company names.
- `application.integration.test.ts`: Verified the full `service-worker.ts` messaging path, mimicking LinkedIn sidebar capture payloads and verifying storage propagation.

**Verification:** Build, Typecheck, and Lint are completely clean.
