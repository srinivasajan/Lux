import { describe, it, expect, beforeEach } from 'vitest';
import { ResumeService } from '../../src/features/resume/resume.service';
import { db } from '../../src/core/storage/idb';

describe('Versioning Integration', () => {
  beforeEach(async () => {
    await db.resumes.clear();
    await db.resumeVersions.clear();
  });

  it('can create, list, and delete versions', async () => {
    const resume = await ResumeService.createResume({
      name: 'Base Resume',
      templateId: 'modern',
      sections: []
    });

    const v1 = await ResumeService.createVersion(resume.id!, 'Version 1');
    const v2 = await ResumeService.createVersion(resume.id!, 'Version 2');

    let versions = await ResumeService.listVersions(resume.id!);
    expect(versions).toHaveLength(2);
    expect(versions[0]!.id).toBe(v1.id);
    expect(versions[1]!.id).toBe(v2.id);

    // Test cascade delete when resume is deleted
    await ResumeService.deleteResume(resume.id!);
    
    versions = await ResumeService.listVersions(resume.id!);
    expect(versions).toHaveLength(0);
  });
});
