// src/features/resume/templates/index.ts
import type { ResumeTemplate, TemplateId } from '../../../core/types/resume';
import { ModernTemplate } from './modern.template';
import { ATSClassicTemplate } from './ats-classic.template';

/**
 * Registry of all available resume templates keyed by their id.
 */
export const TEMPLATES: Record<TemplateId, ResumeTemplate> = {
  'modern': ModernTemplate,
  'ats-classic': ATSClassicTemplate,
};

/**
 * Returns the template definition for the given id.
 * Throws if the id is not registered (guards against future mismatches).
 */
export function getTemplate(id: TemplateId): ResumeTemplate {
  const template = TEMPLATES[id];
  if (!template) {
    throw new Error(`Unknown template id: ${id}`);
  }
  return template;
}

/**
 * Returns all registered templates as an array.
 */
export function listTemplates(): ResumeTemplate[] {
  return Object.values(TEMPLATES);
}
