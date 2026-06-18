import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileService } from '../../src/features/profile/profile.service';
import { db } from '../../src/core/storage/idb';
import type { Profile } from '../../src/core/types/profile';
import { ZodError } from 'zod';

// Mock the dexie db instance
vi.mock('../../src/core/storage/idb', () => {
  return {
    db: {
      profile: {
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
      }
    }
  };
});

describe('ProfileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validProfilePayload = {
    personal: {
      name: 'John Doe',
      email: 'john@example.com',
    },
    education: [],
    skills: ['TypeScript'],
    experience: [],
    projects: [],
  };

  it('should get profile from db', async () => {
    vi.mocked(db.profile.get).mockResolvedValueOnce(validProfilePayload as unknown as Profile);
    const result = await ProfileService.getProfile();
    expect(result).toEqual(validProfilePayload);
    expect(db.profile.get).toHaveBeenCalledWith(1);
  });

  it('should return null when profile not found', async () => {
    vi.mocked(db.profile.get).mockResolvedValueOnce(undefined);
    const result = await ProfileService.getProfile();
    expect(result).toBeNull();
  });

  it('should save profile when valid', async () => {
    vi.mocked(db.profile.put).mockResolvedValueOnce(1);
    await ProfileService.saveProfile(validProfilePayload);
    expect(db.profile.put).toHaveBeenCalledWith({ ...validProfilePayload, id: 1 });
  });

  it('should throw ZodError when profile payload is invalid', async () => {
    const invalidPayload = { personal: { email: 'not-an-email' } };
    await expect(ProfileService.saveProfile(invalidPayload)).rejects.toThrow(ZodError);
    expect(db.profile.put).not.toHaveBeenCalled();
  });

  it('should delete profile via db', async () => {
    vi.mocked(db.profile.delete).mockResolvedValueOnce(undefined);
    await ProfileService.deleteProfile();
    expect(db.profile.delete).toHaveBeenCalledWith(1);
  });
});
