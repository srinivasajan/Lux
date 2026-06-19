// src/core/storage/idb.ts
import Dexie, { Table } from 'dexie';
import type { Profile } from '../types/profile';
import type { Application } from '../types/application';
import type { Resume, ResumeVersion } from '../types/resume';

export class LuxDatabase extends Dexie {
  profile!: Table<Profile, number>;
  applications!: Table<Application, number>;
  resumes!: Table<Resume, number>;
  resumeVersions!: Table<ResumeVersion, string>;

  constructor() {
    super('LuxDB');

    // Version 1 (M1)
    this.version(1).stores({
      profile: '++id',
      applications: 'id, platform, status, dateApplied',
      resumeVersions: 'id, applicationId, dateGenerated',
    });

    // Version 2 (M3 Application Tracker)
    this.version(2).stores({
      profile: '++id',
      applications: '++id, &jobUrl, status, appliedAt, company, platform',
      resumeVersions: 'id, applicationId, dateGenerated',
    }).upgrade(tx => {
      // Clear out any old dummy application data from V1 if it exists
      // because the primary key changed from string 'id' to number '++id'.
      // In a real production system with active users we would map data,
      // but since M2 was just a scanner without saving, clearing is safe.
      return tx.table('applications').clear();
    });

    // Version 3 (M4.1 Resume Foundation)
    // Adds `resumes` and `resumeVersions` tables with proper indexes.
    // No upgrade function needed — new tables are created empty.
    // Existing `profile` and `applications` data is fully preserved.
    this.version(3).stores({
      profile: '++id',
      applications: '++id, &jobUrl, status, appliedAt, company, platform',
      resumes: '++id, templateId, createdAt, updatedAt',
      resumeVersions: 'id, resumeId, createdAt',
    });
  }
}

export const db = new LuxDatabase();
