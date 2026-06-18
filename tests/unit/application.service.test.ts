import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ApplicationService } from '../../src/features/tracker/application.service';
import { ApplicationStatus, ApplicationPlatform } from '../../src/core/types/application';
import { db } from '../../src/core/storage/idb';

describe('ApplicationService', () => {
  beforeEach(async () => {
    await db.applications.clear();
  });

  afterEach(async () => {
    await db.applications.clear();
  });

  const validApp = {
    company: 'Test Corp',
    role: 'Developer',
    platform: ApplicationPlatform.LinkedIn,
    jobUrl: 'https://linkedin.com/jobs/view/123',
    status: ApplicationStatus.Applied,
    matchScore: 90,
    appliedAt: new Date().toISOString()
  };

  it('should create a valid application', async () => {
    const created = await ApplicationService.createApplication(validApp);
    expect(created.id).toBeDefined();
    expect(created.company).toBe('Test Corp');
  });

  it('should prevent duplicate applications by jobUrl', async () => {
    await ApplicationService.createApplication(validApp);
    
    await expect(ApplicationService.createApplication(validApp)).rejects.toThrow('already exists');
  });

  it('should validate zod schema on creation', async () => {
    const invalidApp = { ...validApp, company: '' };
    await expect(ApplicationService.createApplication(invalidApp as any)).rejects.toThrow('Validation failed');
  });

  it('should retrieve applications sorted by date descending', async () => {
    await ApplicationService.createApplication({ ...validApp, appliedAt: new Date('2023-01-01').toISOString() });
    await ApplicationService.createApplication({ ...validApp, jobUrl: 'https://foo.com', appliedAt: new Date('2023-01-02').toISOString() });

    const apps = await ApplicationService.listApplications();
    expect(apps.length).toBe(2);
    expect(apps[0].appliedAt).toContain('2023-01-02'); // newest first
  });

  it('should update an application', async () => {
    const created = await ApplicationService.createApplication(validApp);
    const updated = await ApplicationService.updateApplication(created.id as number, { status: ApplicationStatus.Interview });
    
    expect(updated.status).toBe(ApplicationStatus.Interview);
    const fetched = await ApplicationService.getApplicationByUrl(validApp.jobUrl);
    expect(fetched).toBeDefined();
    expect(fetched!.status).toBe(ApplicationStatus.Interview);
  });

  it('should delete an application', async () => {
    const created = await ApplicationService.createApplication(validApp);
    await ApplicationService.deleteApplication(created.id!);
    
    const apps = await ApplicationService.listApplications();
    expect(apps.length).toBe(0);
  });
});
