import { z } from 'zod';

export enum ApplicationStatus {
  Applied = 'Applied',
  Viewed = 'Viewed',
  Rejected = 'Rejected',
  Interview = 'Interview',
  Offer = 'Offer'
}

export enum ApplicationPlatform {
  LinkedIn = 'LinkedIn',
  Manual = 'Manual'
}

export const ApplicationSchema = z.object({
  id: z.number().optional(),
  company: z.string().min(1, "Company name is required"),
  role: z.string().min(1, "Role is required"),
  platform: z.nativeEnum(ApplicationPlatform),
  jobUrl: z.string().url("Invalid Job URL"),
  status: z.nativeEnum(ApplicationStatus),
  matchScore: z.number().min(0).max(100).optional(),
  appliedAt: z.string().datetime(), // ISO 8601
  notes: z.string().optional()
});

export type Application = z.infer<typeof ApplicationSchema>;
