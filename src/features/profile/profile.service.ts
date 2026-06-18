// src/features/profile/profile.service.ts
import { db } from '../../core/storage/idb';
import { ProfileSchema, type Profile } from '../../core/types/profile';

export class ProfileService {
  /**
   * Retrieves the profile or returns null if it doesn't exist
   */
  static async getProfile(): Promise<Profile | null> {
    const profile = await db.profile.get(1);
    return profile || null;
  }

  /**
   * Validates and saves the profile.
   * Throws ZodError if validation fails.
   */
  static async saveProfile(profileData: unknown): Promise<void> {
    // Validate payload against Zod schema
    const parsedProfile = ProfileSchema.parse(profileData);
    
    // Save to singleton ID 1
    await db.profile.put({ ...parsedProfile, id: 1 });
  }

  /**
   * Deletes the profile
   */
  static async deleteProfile(): Promise<void> {
    await db.profile.delete(1);
  }
}
