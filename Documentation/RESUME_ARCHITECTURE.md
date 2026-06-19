# Resume Architecture

## Overview

The Resume Foundation layer (M4.1) provides the full data model, persistence,
service API, and management UI for user resumes. It is designed for future
extensibility with PDF generation (M5) and AI tailoring (M6).

---

## Schema Design

### ResumeSection

```
ResumeSection {
  id:      string                  // client-generated, e.g. Date.now().toString(36) + random
  type:    'summary' | 'experience' | 'education' | 'project' | 'skills' | 'custom'
  title:   string                  // display label, e.g. "Work Experience"
  data:    Record<string, unknown>  // structured payload — interpreted per type
  order:   number                  // ascending render order
}
```

The `data` field uses a `Record<string, unknown>` type so each section type
can carry its own structure without a monolithic union. Examples:

| type       | data shape (illustrative) |
|------------|---------------------------|
| summary    | `{ text: string }` |
| experience | `{ company, role, duration, bullets: string[] }` |
| education  | `{ degree, university, cgpa?, year? }` |
| project    | `{ title, description, stack: string[], link? }` |
| skills     | `{ items: string[] }` |
| custom     | `{ [key: string]: unknown }` |

### Resume

```
Resume {
  id?:        number          // Dexie auto-increment PK
  name:       string          // user label, e.g. "SWE — Remote"
  templateId: 'modern' | 'ats-classic'
  sections:   ResumeSection[]
  createdAt:  number          // Unix ms
  updatedAt:  number          // Unix ms
}
```

### ResumeVersion

```
ResumeVersion {
  id:        string   // client-generated PK
  resumeId:  number   // logical FK → resumes.id
  snapshot:  Resume   // deep copy at moment of versioning
  createdAt: number
  label?:    string   // e.g. "Before AI tailoring"
}
```

### ResumeTemplate

```
ResumeTemplate {
  id:          'modern' | 'ats-classic'
  name:        string
  description: string
  layoutHints: string[]   // consumed by future PDF renderer
}
```

---

## Migration Strategy

| DB Version | Change | Data Safety |
|---|---|---|
| 1 | Initial tables | — |
| 2 | Applications PK change (string → number) | `applications.clear()` was safe (no real data in M2) |
| 3 | Add `resumes` + `resumeVersions` tables | New tables only, no upgrade fn, existing data untouched |

Version 3 upgrade is a no-op in terms of data transformation — Dexie creates
the new tables empty. All existing `profile` and `applications` rows survive
unchanged.

---

## IndexedDB Indexes

```
resumes:        ++id, templateId, createdAt, updatedAt
resumeVersions: id, resumeId, createdAt
```

`resumeId` index on `resumeVersions` enables efficient `where('resumeId').equals(id)`
queries for listing and cascade-deleting versions.

---

## Template System

Templates are plain TypeScript constants (`ResumeTemplate` objects) exported
from `src/features/resume/templates/`. The `index.ts` file provides:

- `TEMPLATES: Record<TemplateId, ResumeTemplate>` — registry map
- `getTemplate(id)` — lookup with error guard
- `listTemplates()` — array for UI rendering

Templates declare `layoutHints` that will be consumed by the PDF renderer in
a future milestone. No rendering logic lives in templates.

---

## ResumeService API

| Method | Description |
|---|---|
| `createResume(data)` | Validates via `CreateResumeInputSchema`, sets timestamps, writes to DB |
| `updateResume(id, data)` | Validates via `UpdateResumeInputSchema`, merges, refreshes `updatedAt` |
| `getResume(id)` | Returns resume or `null` |
| `listResumes()` | Returns all resumes ordered by `createdAt` |
| `deleteResume(id)` | Deletes resume + all its `resumeVersions` entries |
| `createVersion(resumeId, label?)` | Snapshots current resume into `resumeVersions` |
| `listVersions(resumeId)` | Returns versions for a resume ordered by `createdAt` |

All write methods validate through Zod before touching the DB. Invalid input
throws `ZodError` — callers must handle this.

---

## UI

The Resume Manager is a standalone `<section>` card in `options.html`, outside
the profile form. It supports:

- **List** — all resumes displayed as rows with template badge + timestamps
- **Create** — New Resume button opens inline form (name + template select)
- **Edit** — Edit button pre-fills form with existing data
- **Delete** — Delete button with confirmation dialog

Sections are not editable in the UI at this milestone. The data model supports
them fully; section editing is the responsibility of a future Resume Editor view.
