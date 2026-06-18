import Dexie, { Table } from 'dexie';
import type { Profile } from '../types/profile';

// Interfaces for future milestones, kept minimal for M1
export interface Application {
  id: string;
  platform: string;
  status: string;
  dateApplied: number;
  [key: string]: unknown;
}

export interface ResumeVersion {
  id: string;
  applicationId: string;
  dateGenerated: number;
  [key: string]: unknown;
}

export class LuxDatabase extends Dexie {
  profile!: Table<Profile, number>;
  applications!: Table<Application, string>;
  resumeVersions!: Table<ResumeVersion, string>;

  constructor() {
    super('LuxDB');
    this.version(1).stores({
      profile: '++id', // Singleton table, usually id=1
      applications: 'id, platform, status, dateApplied',
      resumeVersions: 'id, applicationId, dateGenerated',
    });
  }
}

export const db = new LuxDatabase();
