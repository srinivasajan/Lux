import { db } from '../../core/storage/idb';
import { ApplicationSchema, type Application } from '../../core/types/application';
import { ZodError } from 'zod';

export class ApplicationService {
  /**
   * Creates a new application if the exact jobUrl doesn't already exist.
   */
  static async createApplication(appData: Application): Promise<Application> {
    try {
      const validData = ApplicationSchema.parse(appData);

      // Check for duplicates
      const existing = await db.applications.where('jobUrl').equals(validData.jobUrl).first();
      if (existing) {
        throw new Error('An application for this exact job URL already exists.');
      }

      const id = await db.applications.add(validData);
      return { ...validData, id };
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error('Validation failed: ' + error.issues.map(e => e.message).join(', '), { cause: error });
      }
      throw error;
    }
  }

  /**
   * Retrieves an application by jobUrl.
   */
  static async getApplicationByUrl(jobUrl: string): Promise<Application | undefined> {
    return db.applications.where('jobUrl').equals(jobUrl).first();
  }

  /**
   * Lists all applications, sorted by appliedAt descending.
   */
  static async listApplications(): Promise<Application[]> {
    return db.applications.orderBy('appliedAt').reverse().toArray();
  }

  /**
   * Updates an existing application.
   */
  static async updateApplication(id: number, updates: Partial<Application>): Promise<Application> {
    const existing = await db.applications.get(id);
    if (!existing) {
      throw new Error('Application not found');
    }

    const merged = { ...existing, ...updates };
    
    try {
      const validData = ApplicationSchema.parse(merged);
      await db.applications.put(validData);
      return validData;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error('Validation failed: ' + error.issues.map(e => e.message).join(', '), { cause: error });
      }
      throw error;
    }
  }

  /**
   * Deletes an application by ID.
   */
  static async deleteApplication(id: number): Promise<void> {
    await db.applications.delete(id);
  }
}
