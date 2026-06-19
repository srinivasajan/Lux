// src/features/resume/templates/ats-classic.template.ts
import type { ResumeTemplate } from '../../../core/types/resume';

/**
 * ATS Classic template — single-column, plain-text-safe layout.
 * Optimised for Applicant Tracking Systems that parse raw text.
 */
export const ATSClassicTemplate: ResumeTemplate = {
  id: 'ats-classic',
  name: 'ATS Classic',
  description:
    'A single-column, plain-text-safe layout with no graphics or tables. ' +
    'Maximises ATS parse accuracy for corporate and enterprise applications.',
  layoutHints: ['single-column', 'plain-text', 'ats-safe'],
};
