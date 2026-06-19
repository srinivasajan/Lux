import { describe, it, expect, beforeEach } from 'vitest';
import { ProfileService } from '../../src/features/profile/profile.service';
import { ChromeStorageService } from '../../src/core/storage/chrome';
import { db } from '../../src/core/storage/idb';

describe('Profile & Settings Integration Tests', () => {
  beforeEach(async () => {
    // Clear Dexie database before each test
    await db.profile.clear();
    // Clear mocked chrome storage
    await new Promise<void>(resolve => {
      chrome.storage.local.clear(() => resolve());
    });
  });

  it('should perform full CRUD on Profile via service to IndexedDB', async () => {
    // 1. Initially empty
    let profile = await ProfileService.getProfile();
    expect(profile).toBeNull();

    const payload = {
      personal: {
        name: 'Integration Tester',
        email: 'test@example.com',
      },
      education: [{ degree: 'B.S.', university: 'State U' }],
      skills: ['TypeScript'],
      experience: [],
      projects: [],
    };

    // 2. Create
    await ProfileService.saveProfile(payload);
    
    // 3. Read
    profile = await ProfileService.getProfile();
    expect(profile).toBeDefined();
    expect(profile?.personal.name).toBe('Integration Tester');
    expect(profile?.education[0]?.degree).toBe('B.S.');
    expect(profile?.id).toBe(1); // Ensures ID is forced to 1

    // 4. Update
    payload.personal.name = 'Updated Name';
    await ProfileService.saveProfile(payload);
    profile = await ProfileService.getProfile();
    expect(profile?.personal.name).toBe('Updated Name');

    // 5. Delete
    await ProfileService.deleteProfile();
    profile = await ProfileService.getProfile();
    expect(profile).toBeNull();
  });

  it('should persist and retrieve settings via ChromeStorageService', async () => {
    // Default fallback check
    let settings = await ChromeStorageService.getSettings();
    expect(settings.dailyApplicationLimit).toBe(100);

    // Update settings
    await ChromeStorageService.updateSettings({ dailyApplicationLimit: 50 });
    
    // Retrieve settings
    settings = await ChromeStorageService.getSettings();
    expect(settings.dailyApplicationLimit).toBe(50);
  });

  it('should save and persist profile with multiple experiences and projects', async () => {
    const payload = {
      personal: { name: 'Multi Tester', email: 'multi@example.com' },
      education: [],
      skills: [],
      experience: [
        { company: 'Company A', role: 'Dev', duration: '1 Year', bullets: ['Did X', 'Did Y'] },
        { company: 'Company B', role: 'Lead', duration: '2 Years', bullets: ['Managed Z'] }
      ],
      projects: [
        { title: 'Proj 1', description: 'Desc 1', stack: ['React', 'TS'], link: '' },
        { title: 'Proj 2', description: 'Desc 2', stack: ['Node'], link: 'http://example.com' }
      ]
    };

    await ProfileService.saveProfile(payload);

    // Simulate "reload" by fetching straight from DB
    const profile = await ProfileService.getProfile();
    expect(profile).toBeDefined();
    expect(profile?.experience.length).toBe(2);
    expect(profile?.experience[1]?.company).toBe('Company B');
    expect(profile?.projects.length).toBe(2);
    expect(profile?.projects[0]?.stack).toContain('TS');
  });

  it('should support delete-and-reload persistence verification', async () => {
    const payload = {
      personal: { name: 'Delete Tester', email: 'del@example.com' },
      education: [],
      skills: [],
      experience: [],
      projects: []
    };

    await ProfileService.saveProfile(payload);
    let profile = await ProfileService.getProfile();
    expect(profile?.personal.name).toBe('Delete Tester');

    await ProfileService.deleteProfile();
    
    // "Reload"
    profile = await ProfileService.getProfile();
    expect(profile).toBeNull();
  });
});
