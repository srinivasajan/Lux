import { z } from 'zod';

// Zod Schemas
export const PersonalInfoSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  linkedin: z.string().url('Invalid URL').optional().or(z.literal('')),
  github: z.string().url('Invalid URL').optional().or(z.literal('')),
  portfolio: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export const EducationSchema = z.object({
  degree: z.string().min(1, 'Degree is required'),
  university: z.string().min(1, 'University is required'),
  cgpa: z.string().optional(),
  year: z.string().optional(),
});

export const ExperienceSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  role: z.string().min(1, 'Role is required'),
  duration: z.string().min(1, 'Duration is required'),
  bullets: z.array(z.string().min(1, 'Bullet point cannot be empty')),
});

export const ProjectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  stack: z.array(z.string()),
  link: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export const ProfileSchema = z.object({
  id: z.number().optional(), // usually 1 for singleton
  personal: PersonalInfoSchema,
  education: z.array(EducationSchema),
  skills: z.array(z.string()),
  experience: z.array(ExperienceSchema),
  projects: z.array(ProjectSchema),
});

// TypeScript Types derived from Zod
export type PersonalInfo = z.infer<typeof PersonalInfoSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
