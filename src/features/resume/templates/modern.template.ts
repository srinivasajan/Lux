// src/features/resume/templates/modern.template.ts
import type { ResumeTemplate } from '../../../core/types/resume';

/**
 * Modern template — two-column layout with accent colour and icon links.
 * Intended for visually rich PDF output (future milestone).
 */
export const ModernTemplate: ResumeTemplate = {
  id: 'modern',
  name: 'Modern',
  description:
    'A visually engaging two-column layout with an accent colour sidebar. ' +
    'Best for creative, product, and software roles where design matters.',
  layoutHints: ['two-column', 'accent-color', 'icon-links'],
};
