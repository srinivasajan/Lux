import { describe, it, expect, beforeEach } from 'vitest';
import { ResumeService } from '../../src/features/resume/resume.service';
import { db } from '../../src/core/storage/idb';
import { ZodError } from 'zod';

// Uses real fake-indexeddb (injected via tests/setup.ts) — no mocks.

describe('Resume Integration Tests', () => {
  beforeEach(async () => {
    // Clear resume tables before each test
    await db.resumes.clear();
    await db.resumeVersions.clear();
  });

  // ── Migration safety ────────────────────────────────────────────────────

  it('migration — existing profile table survives v3 schema upgrade', async () => {
    // profile table should still be present and accessible
    const count = await db.profile.count();
    expect(typeof count).toBe('number');
  });

  it('migration — existing applications table survives v3 schema upgrade', async () => {
    const count = await db.applications.count();
    expect(typeof count).toBe('number');
  });

  // ── CRUD round-trip ─────────────────────────────────────────────────────

  it('createResume — persists and returns resume with auto-incremented id', async () => {
    const resume = await ResumeService.createResume({
      name: 'SWE General',
      templateId: 'modern',
      sections: [],
    });

    expect(resume.id).toBeGreaterThan(0);
    expect(resume.name).toBe('SWE General');
    expect(resume.templateId).toBe('modern');
    expect(resume.sections).toEqual([]);
    expect(resume.createdAt).toBeGreaterThan(0);
    expect(resume.updatedAt).toBe(resume.createdAt);
  });

  it('getResume — retrieves persisted resume by id', async () => {
    const created = await ResumeService.createResume({
      name: 'Backend Focus',
      templateId: 'ats-classic',
      sections: [],
    });

    const fetched = await ResumeService.getResume(created.id!);
    expect(fetched).not.toBeNull();
    expect(fetched!.name).toBe('Backend Focus');
    expect(fetched!.templateId).toBe('ats-classic');
  });

  it('getResume — returns null for non-existent id', async () => {
    const result = await ResumeService.getResume(9999);
    expect(result).toBeNull();
  });

  it('updateResume — persists changes and refreshes updatedAt', async () => {
    const created = await ResumeService.createResume({
      name: 'Original Name',
      templateId: 'modern',
      sections: [],
    });

    // Ensure at least 1ms passes so updatedAt differs
    await new Promise(r => setTimeout(r, 2));

    const updated = await ResumeService.updateResume(created.id!, {
      name: 'Renamed',
      templateId: 'ats-classic',
    });

    expect(updated.name).toBe('Renamed');
    expect(updated.templateId).toBe('ats-classic');
    expect(updated.updatedAt).toBeGreaterThanOrEqual(created.updatedAt);

    const fetched = await ResumeService.getResume(created.id!);
    expect(fetched!.name).toBe('Renamed');
  });

  it('deleteResume — removes resume from db', async () => {
    const created = await ResumeService.createResume({
      name: 'To Delete',
      templateId: 'modern',
      sections: [],
    });

    await ResumeService.deleteResume(created.id!);

    const fetched = await ResumeService.getResume(created.id!);
    expect(fetched).toBeNull();
  });

  it('listResumes — returns all resumes ordered by createdAt', async () => {
    await ResumeService.createResume({ name: 'First', templateId: 'modern', sections: [] });
    await ResumeService.createResume({ name: 'Second', templateId: 'ats-classic', sections: [] });
    await ResumeService.createResume({ name: 'Third', templateId: 'modern', sections: [] });

    const list = await ResumeService.listResumes();
    expect(list).toHaveLength(3);
    expect(list[0]!.name).toBe('First');
    expect(list[2]!.name).toBe('Third');
  });

  // ── Validation ──────────────────────────────────────────────────────────

  it('createResume — rejects missing name with ZodError', async () => {
    await expect(
      ResumeService.createResume({ name: '', templateId: 'modern', sections: [] })
    ).rejects.toThrow(ZodError);
  });

  it('createResume — rejects unknown templateId with ZodError', async () => {
    await expect(
      ResumeService.createResume({ name: 'Test', templateId: 'unknown', sections: [] })
    ).rejects.toThrow(ZodError);
  });

  it('updateResume — rejects update on non-existent resume', async () => {
    await expect(
      ResumeService.updateResume(99999, { name: 'Ghost' })
    ).rejects.toThrow('Resume not found: 99999');
  });

  // ── Template selection ──────────────────────────────────────────────────

  it('templateId persists correctly for both templates', async () => {
    const modern = await ResumeService.createResume({ name: 'M', templateId: 'modern', sections: [] });
    const ats = await ResumeService.createResume({ name: 'A', templateId: 'ats-classic', sections: [] });

    expect((await ResumeService.getResume(modern.id!))!.templateId).toBe('modern');
    expect((await ResumeService.getResume(ats.id!))!.templateId).toBe('ats-classic');
  });

  // ── Sections (structured data) ──────────────────────────────────────────

  it('createResume — persists sections with structured data', async () => {
    const sections = [
      {
        id: 'sec-1',
        type: 'summary' as const,
        title: 'Summary',
        data: { text: 'Experienced engineer with 5 years in TypeScript.' },
        order: 0,
      },
      {
        id: 'sec-2',
        type: 'skills' as const,
        title: 'Skills',
        data: { items: ['TypeScript', 'React', 'Node.js'] },
        order: 1,
      },
    ];

    const created = await ResumeService.createResume({
      name: 'With Sections',
      templateId: 'modern',
      sections,
    });

    const fetched = await ResumeService.getResume(created.id!);
    expect(fetched!.sections).toHaveLength(2);
    expect(fetched!.sections[0]!.type).toBe('summary');
    expect(fetched!.sections[0]!.data).toEqual({ text: 'Experienced engineer with 5 years in TypeScript.' });
    expect(fetched!.sections[1]!.data).toEqual({ items: ['TypeScript', 'React', 'Node.js'] });
  });

  // ── Version history ─────────────────────────────────────────────────────

  it('createVersion — snapshots resume state', async () => {
    const resume = await ResumeService.createResume({
      name: 'Versioned Resume',
      templateId: 'modern',
      sections: [],
    });

    const version = await ResumeService.createVersion(resume.id!, 'Initial snapshot');

    expect(version.resumeId).toBe(resume.id);
    expect(version.label).toBe('Initial snapshot');
    expect(version.snapshot.name).toBe('Versioned Resume');
    expect(typeof version.id).toBe('string');
    expect(version.id.length).toBeGreaterThan(0);
  });

  it('deleteResume — cascades to remove all its versions', async () => {
    const resume = await ResumeService.createResume({
      name: 'Resume With Versions',
      templateId: 'ats-classic',
      sections: [],
    });

    await ResumeService.createVersion(resume.id!, 'v1');
    await ResumeService.createVersion(resume.id!, 'v2');

    let versions = await ResumeService.listVersions(resume.id!);
    expect(versions).toHaveLength(2);

    await ResumeService.deleteResume(resume.id!);

    versions = await ResumeService.listVersions(resume.id!);
    expect(versions).toHaveLength(0);

    const fetched = await ResumeService.getResume(resume.id!);
    expect(fetched).toBeNull();
  });

  it('listVersions — returns versions for a specific resume ordered by createdAt', async () => {
    const resume = await ResumeService.createResume({
      name: 'Multi-version',
      templateId: 'modern',
      sections: [],
    });

    await ResumeService.createVersion(resume.id!, 'v1');
    await new Promise(r => setTimeout(r, 2));
    await ResumeService.createVersion(resume.id!, 'v2');

    const versions = await ResumeService.listVersions(resume.id!);
    expect(versions).toHaveLength(2);
    expect(versions[0]!.label).toBe('v1');
    expect(versions[1]!.label).toBe('v2');
    expect(versions[0]!.createdAt).toBeLessThanOrEqual(versions[1]!.createdAt);
  });
});
