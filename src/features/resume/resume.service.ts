// src/features/resume/resume.service.ts
import { db } from '../../core/storage/idb';
import {
  CreateResumeInputSchema,
  UpdateResumeInputSchema,
  ResumeVersionSchema,
  type Resume,
  type ResumeVersion,
} from '../../core/types/resume';

/**
 * Generates a short unique id suitable for client-side use.
 * Uses timestamp + random suffix — no external dependency required.
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export class ResumeService {
  /**
   * Creates a new resume after validating input via Zod.
   * Timestamps are set by the service.
   */
  static async createResume(data: unknown): Promise<Resume> {
    const parsed = CreateResumeInputSchema.parse(data);
    const now = Date.now();
    const resume: Omit<Resume, 'id'> = {
      name: parsed.name,
      templateId: parsed.templateId,
      sections: parsed.sections,
      createdAt: now,
      updatedAt: now,
    };
    const id = await db.resumes.add(resume as Resume);
    return { ...resume, id: id as number };
  }

  /**
   * Updates an existing resume by id.
   * Only the fields provided in `data` are changed; timestamps are refreshed.
   * Throws if the resume does not exist.
   */
  static async updateResume(id: number, data: unknown): Promise<Resume> {
    const existing = await db.resumes.get(id);
    if (!existing) {
      throw new Error(`Resume not found: ${id}`);
    }
    const parsed = UpdateResumeInputSchema.parse(data);
    const updated: Resume = {
      ...existing,
      ...parsed,
      id,
      updatedAt: Date.now(),
    };
    await db.resumes.put(updated);
    return updated;
  }

  /**
   * Retrieves a single resume by id, or null if not found.
   */
  static async getResume(id: number): Promise<Resume | null> {
    const resume = await db.resumes.get(id);
    return resume ?? null;
  }

  /**
   * Returns all resumes ordered by creation date (oldest first).
   */
  static async listResumes(): Promise<Resume[]> {
    return db.resumes.orderBy('createdAt').toArray();
  }

  /**
   * Deletes a resume and all of its version history.
   */
  static async deleteResume(id: number): Promise<void> {
    await db.resumes.delete(id);
    await db.resumeVersions.where('resumeId').equals(id).delete();
  }

  /**
   * Snapshots the current state of a resume into an immutable ResumeVersion.
   * Throws if the resume does not exist.
   */
  static async createVersion(resumeId: number, label?: string): Promise<ResumeVersion> {
    const resume = await db.resumes.get(resumeId);
    if (!resume) {
      throw new Error(`Resume not found: ${resumeId}`);
    }
    const version: ResumeVersion = ResumeVersionSchema.parse({
      id: generateId(),
      resumeId,
      snapshot: resume,
      createdAt: Date.now(),
      label,
    });
    await db.resumeVersions.add(version);
    return version;
  }

  /**
   * Returns all version snapshots for a given resume, ordered by creation date.
   */
  static async listVersions(resumeId: number): Promise<ResumeVersion[]> {
    return db.resumeVersions
      .where('resumeId')
      .equals(resumeId)
      .sortBy('createdAt');
  }
}
