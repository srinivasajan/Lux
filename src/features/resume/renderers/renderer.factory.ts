// src/features/resume/renderers/renderer.factory.ts
import type { TemplateId, Resume } from '../../../core/types/resume';
import { ModernRenderer } from './modern.renderer';
import { ATSRenderer } from './ats.renderer';

/**
 * Common interface for all resume renderers.
 * Input: a Resume object.
 * Output: a complete, self-contained HTML string (with embedded CSS).
 */
export interface ResumeRenderer {
  render(resume: Resume): string;
}

/**
 * Returns the correct renderer for the given templateId.
 * The switch is exhaustive — TypeScript will fail to compile if a new
 * TemplateId is added without a corresponding renderer case.
 */
export class RendererFactory {
  static create(templateId: TemplateId): ResumeRenderer {
    switch (templateId) {
      case 'modern':
        return new ModernRenderer();
      case 'ats-classic':
        return new ATSRenderer();
      default: {
        const _exhaustive: never = templateId;
        throw new Error(`Unknown template id: ${_exhaustive}`);
      }
    }
  }
}
