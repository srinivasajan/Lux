// src/core/types/resume.ts
import { z } from 'zod';

// ── Section Types ──────────────────────────────────────────────────────────

export const ResumeSectionTypeSchema = z.enum([
  'summary',
  'experience',
  'education',
  'project',
  'skills',
  'custom',
]);

export const ResumeSectionSchema = z.object({
  id: z.string().min(1, 'Section id is required'),
  type: ResumeSectionTypeSchema,
  title: z.string().min(1, 'Section title is required'),
  data: z.record(z.string(), z.unknown()),
  order: z.number().int().min(0),
});

// ── Template ───────────────────────────────────────────────────────────────

export const TemplateIdSchema = z.enum(['modern', 'ats-classic']);

export const ResumeTemplateSchema = z.object({
  id: TemplateIdSchema,
  name: z.string().min(1),
  description: z.string(),
  layoutHints: z.array(z.string()),
});

// ── Resume ─────────────────────────────────────────────────────────────────

export const ResumeSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1, 'Resume name is required'),
  templateId: TemplateIdSchema,
  sections: z.array(ResumeSectionSchema),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
});

// ── Resume Version (immutable snapshot) ───────────────────────────────────

export const ResumeVersionSchema = z.object({
  id: z.string().min(1, 'Version id is required'),
  resumeId: z.number().int().positive(),
  snapshot: ResumeSchema,
  createdAt: z.number().int(),
  label: z.string().optional(),
});

// ── Create / Update input schemas (no timestamps — service sets these) ─────

export const CreateResumeInputSchema = z.object({
  name: z.string().min(1, 'Resume name is required'),
  templateId: TemplateIdSchema,
  sections: z.array(ResumeSectionSchema).default([]),
});

export const UpdateResumeInputSchema = z.object({
  name: z.string().min(1, 'Resume name is required').optional(),
  templateId: TemplateIdSchema.optional(),
  sections: z.array(ResumeSectionSchema).optional(),
});

// ── TypeScript Types ───────────────────────────────────────────────────────

export type ResumeSectionType = z.infer<typeof ResumeSectionTypeSchema>;
export type ResumeSection = z.infer<typeof ResumeSectionSchema>;
export type TemplateId = z.infer<typeof TemplateIdSchema>;
export type ResumeTemplate = z.infer<typeof ResumeTemplateSchema>;
export type Resume = z.infer<typeof ResumeSchema>;
export type ResumeVersion = z.infer<typeof ResumeVersionSchema>;
export type CreateResumeInput = z.infer<typeof CreateResumeInputSchema>;
export type UpdateResumeInput = z.infer<typeof UpdateResumeInputSchema>;
