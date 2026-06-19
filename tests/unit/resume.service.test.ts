import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResumeService } from '../../src/features/resume/resume.service';
import { db } from '../../src/core/storage/idb';
import type { Resume, ResumeVersion } from '../../src/core/types/resume';
import { ZodError } from 'zod';

// ── Mock the Dexie database ────────────────────────────────────────────────

function makeVersionsChain(overrides: Partial<{
  toArray: () => Promise<ResumeVersion[]>;
  sortBy: (field: string) => Promise<ResumeVersion[]>;
  delete: () => Promise<number>;
}> = {}) {
  return {
    toArray: overrides.toArray ?? vi.fn().mockResolvedValue([]),
    sortBy: overrides.sortBy ?? vi.fn().mockResolvedValue([]),
    delete: overrides.delete ?? vi.fn().mockResolvedValue(0),
  };
}

const mockWhere = {
  equals: vi.fn(() => makeVersionsChain()),
};

vi.mock('../../src/core/storage/idb', () => ({
  db: {
    resumes: {
      add: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      orderBy: vi.fn(() => ({ toArray: vi.fn() })),
    },
    resumeVersions: {
      add: vi.fn(),
      where: vi.fn(() => mockWhere),
    },
  },
}));

// ── Helpers ────────────────────────────────────────────────────────────────

const validCreateInput = {
  name: 'SWE General',
  templateId: 'modern' as const,
  sections: [],
};

const storedResume: Resume = {
  id: 1,
  name: 'SWE General',
  templateId: 'modern',
  sections: [],
  createdAt: 1000,
  updatedAt: 1000,
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('ResumeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWhere.equals.mockReturnValue(makeVersionsChain());
  });

  // ── createResume ──────────────────────────────────────────────────────────

  it('createResume — validates and writes to db', async () => {
    vi.mocked(db.resumes.add).mockResolvedValueOnce(1 as unknown as number);
    const result = await ResumeService.createResume(validCreateInput);

    expect(db.resumes.add).toHaveBeenCalledOnce();
    expect(result.id).toBe(1);
    expect(result.name).toBe('SWE General');
    expect(result.templateId).toBe('modern');
    expect(result.sections).toEqual([]);
    expect(typeof result.createdAt).toBe('number');
    expect(typeof result.updatedAt).toBe('number');
  });

  it('createResume — rejects invalid templateId with ZodError', async () => {
    await expect(
      ResumeService.createResume({ name: 'Test', templateId: 'not-a-template', sections: [] })
    ).rejects.toThrow(ZodError);
    expect(db.resumes.add).not.toHaveBeenCalled();
  });

  it('createResume — rejects empty name with ZodError', async () => {
    await expect(
      ResumeService.createResume({ name: '', templateId: 'modern', sections: [] })
    ).rejects.toThrow(ZodError);
    expect(db.resumes.add).not.toHaveBeenCalled();
  });

  // ── updateResume ──────────────────────────────────────────────────────────

  it('updateResume — merges fields and refreshes updatedAt', async () => {
    vi.mocked(db.resumes.get).mockResolvedValueOnce(storedResume);
    vi.mocked(db.resumes.put).mockResolvedValueOnce(1 as unknown as number);

    const result = await ResumeService.updateResume(1, { name: 'Updated Name' });

    expect(result.name).toBe('Updated Name');
    expect(result.templateId).toBe('modern');
    expect(result.updatedAt).toBeGreaterThanOrEqual(storedResume.updatedAt);
    expect(db.resumes.put).toHaveBeenCalledWith(expect.objectContaining({ id: 1, name: 'Updated Name' }));
  });

  it('updateResume — throws when resume not found', async () => {
    vi.mocked(db.resumes.get).mockResolvedValueOnce(undefined);
    await expect(ResumeService.updateResume(99, { name: 'X' })).rejects.toThrow('Resume not found: 99');
  });

  it('updateResume — rejects invalid templateId with ZodError', async () => {
    vi.mocked(db.resumes.get).mockResolvedValueOnce(storedResume);
    await expect(
      ResumeService.updateResume(1, { templateId: 'bad-template' as 'modern' })
    ).rejects.toThrow(ZodError);
    expect(db.resumes.put).not.toHaveBeenCalled();
  });

  // ── getResume ─────────────────────────────────────────────────────────────

  it('getResume — returns resume when found', async () => {
    vi.mocked(db.resumes.get).mockResolvedValueOnce(storedResume);
    const result = await ResumeService.getResume(1);
    expect(result).toEqual(storedResume);
  });

  it('getResume — returns null when not found', async () => {
    vi.mocked(db.resumes.get).mockResolvedValueOnce(undefined);
    const result = await ResumeService.getResume(99);
    expect(result).toBeNull();
  });

  // ── listResumes ───────────────────────────────────────────────────────────

  it('listResumes — returns ordered array from db', async () => {
    const resumes: Resume[] = [storedResume, { ...storedResume, id: 2, name: 'Another' }];
    const toArray = vi.fn().mockResolvedValueOnce(resumes);
    vi.mocked(db.resumes.orderBy).mockReturnValueOnce({ toArray } as unknown as ReturnType<typeof db.resumes.orderBy>);

    const result = await ResumeService.listResumes();
    expect(result).toEqual(resumes);
    expect(db.resumes.orderBy).toHaveBeenCalledWith('createdAt');
  });

  // ── deleteResume ──────────────────────────────────────────────────────────

  it('deleteResume — deletes resume and cascades to versions', async () => {
    vi.mocked(db.resumes.delete).mockResolvedValueOnce(undefined);
    const deleteFn = vi.fn().mockResolvedValueOnce(1);
    mockWhere.equals.mockReturnValueOnce(makeVersionsChain({ delete: deleteFn }));

    await ResumeService.deleteResume(1);

    expect(db.resumes.delete).toHaveBeenCalledWith(1);
    expect(db.resumeVersions.where).toHaveBeenCalledWith('resumeId');
    expect(mockWhere.equals).toHaveBeenCalledWith(1);
    expect(deleteFn).toHaveBeenCalled();
  });

  // ── createVersion ─────────────────────────────────────────────────────────

  it('createVersion — snapshots resume into a ResumeVersion', async () => {
    vi.mocked(db.resumes.get).mockResolvedValueOnce(storedResume);
    vi.mocked(db.resumeVersions.add).mockResolvedValueOnce('abc' as unknown as string);

    const version = await ResumeService.createVersion(1, 'Before tailoring');

    expect(version.resumeId).toBe(1);
    expect(version.label).toBe('Before tailoring');
    expect(version.snapshot).toEqual(storedResume);
    expect(typeof version.id).toBe('string');
    expect(typeof version.createdAt).toBe('number');
    expect(db.resumeVersions.add).toHaveBeenCalledWith(version);
  });

  it('createVersion — throws when resume not found', async () => {
    vi.mocked(db.resumes.get).mockResolvedValueOnce(undefined);
    await expect(ResumeService.createVersion(99)).rejects.toThrow('Resume not found: 99');
  });
});
