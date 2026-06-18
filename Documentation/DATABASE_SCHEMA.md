# Database Schema

## Overview
Lux uses `Dexie.js` as a wrapper around IndexedDB to store all user data locally. No data leaves the device.

## Dexie Configuration
```typescript
import Dexie, { Table } from 'dexie';

export class LuxDatabase extends Dexie {
  profile!: Table<Profile, number>;
  applications!: Table<Application, string>;
  resumeVersions!: Table<ResumeVersion, string>;

  constructor() {
    super('LuxDB');
    this.version(1).stores({
      profile: '++id', // Singleton table, usually just id=1
      applications: 'id, platform, status, dateApplied',
      resumeVersions: 'id, applicationId, dateGenerated'
    });
  }
}
export const db = new LuxDatabase();
```

## Schemas

### 1. Profile Table
Stores the master profile used to generate tailored resumes.
- **`id`** (number, Primary Key)
- **`personal`** (Object): `{ name, email, phone, linkedin, github, portfolio }`
- **`education`** (Array of Objects): `[{ degree, university, cgpa, year }]`
- **`skills`** (Array of Strings): `["TypeScript", "React", "Node.js"]`
- **`experience`** (Array of Objects): `[{ company, role, duration, bullets: string[] }]`
- **`projects`** (Array of Objects): `[{ title, description, stack: string[], link }]`

### 2. Applications Table
Logs every job application sent via the extension.
- **`id`** (string, UUID, Primary Key)
- **`companyName`** (string)
- **`roleTitle`** (string)
- **`platform`** (string, Indexed): e.g., "LinkedIn", "Naukri"
- **`dateApplied`** (number, Indexed): Epoch timestamp
- **`jdUrl`** (string)
- **`matchScore`** (number): The score at the time of application (0-100)
- **`resumeVersionId`** (string, Foreign Key)
- **`status`** (string, Indexed): "Applied" | "Viewed" | "Rejected" | "Interview" | "Offer"
- **`notes`** (string)

### 3. ResumeVersions Table
Stores snapshots of the tailored bullets and metadata for generated resumes.
- **`id`** (string, UUID, Primary Key)
- **`applicationId`** (string, Foreign Key)
- **`dateGenerated`** (number, Indexed)
- **`tailoredExperience`** (Array of Objects): Snapshots of the specific bullets used for this resume version.
- **`engineUsed`** (string): "NvidiaTailor" | "LocalTailor"
