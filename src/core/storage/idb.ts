import Dexie, { Table } from 'dexie';
import type { Profile } from '../types/profile';
import type { Application } from '../types/application';

// Interfaces for future milestones, kept minimal
export interface ResumeVersion {
  id: string;
  applicationId: string;
  dateGenerated: number;
  [key: string]: unknown;
}

export class LuxDatabase extends Dexie {
  profile!: Table<Profile, number>;
  applications!: Table<Application, number>;
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
  }
}

export const db = new LuxDatabase();
