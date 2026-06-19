import { describe, it, expect, beforeEach } from 'vitest';
import { ResumeService } from '../../src/features/resume/resume.service';
import { RendererFactory } from '../../src/features/resume/renderers/renderer.factory';
import { db } from '../../src/core/storage/idb';
import type { ResumeSection } from '../../src/core/types/resume';

describe('Resume Preview Integration', () => {
  beforeEach(async () => {
    await db.resumes.clear();
    await db.resumeVersions.clear();
  });

  it('renders different HTML structures when templates switch', async () => {
    const sections: ResumeSection[] = [
      { id: '1', type: 'summary', title: 'Summary', data: { text: 'Test summary' }, order: 0 }
    ];

    const resume = await ResumeService.createResume({
      name: 'Template Switch Test',
      templateId: 'modern',
      sections
    });

    const modernHtml = RendererFactory.create('modern').render(resume);
    expect(modernHtml).toContain('class="sidebar"');
    
    // Switch template
    const updated = await ResumeService.updateResume(resume.id!, { templateId: 'ats-classic' });
    const atsHtml = RendererFactory.create('ats-classic').render(updated);
    
    // Verify changes
    expect(atsHtml).not.toContain('class="sidebar"');
    expect(atsHtml).toContain('Template Switch Test');
    expect(atsHtml).toContain('Test summary');
  });

  it('auto-snapshots version creation on every update (simulated flow)', async () => {
    // Simulate what options.ts does on form submit
    const created = await ResumeService.createResume({
      name: 'Versioning Flow',
      templateId: 'modern',
      sections: []
    });
    await ResumeService.createVersion(created.id!, 'Initial version');

    // Make an edit and snapshot
    await ResumeService.updateResume(created.id!, { name: 'Updated Name' });
    await ResumeService.createVersion(created.id!, 'Saved after update');

    const versions = await ResumeService.listVersions(created.id!);
    expect(versions).toHaveLength(2);
    expect(versions[0]!.label).toBe('Initial version');
    expect(versions[1]!.label).toBe('Saved after update');
    
    // The snapshot data is isolated
    expect(versions[0]!.snapshot.name).toBe('Versioning Flow');
    expect(versions[1]!.snapshot.name).toBe('Updated Name');
  });
});
