import { describe, it, expect } from 'vitest';
import { RendererFactory } from '../../src/features/resume/renderers/renderer.factory';
import { ModernRenderer } from '../../src/features/resume/renderers/modern.renderer';
import { ATSRenderer } from '../../src/features/resume/renderers/ats.renderer';
import type { Resume } from '../../src/core/types/resume';

const baseResume: Resume = {
  id: 1,
  name: 'Test Resume',
  templateId: 'modern',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  sections: [],
};

describe('RendererFactory', () => {
  it('creates ModernRenderer for modern template', () => {
    const renderer = RendererFactory.create('modern');
    expect(renderer).toBeInstanceOf(ModernRenderer);
  });

  it('creates ATSRenderer for ats-classic template', () => {
    const renderer = RendererFactory.create('ats-classic');
    expect(renderer).toBeInstanceOf(ATSRenderer);
  });
});

describe('ModernRenderer', () => {
  const renderer = new ModernRenderer();

  it('renders basic structure with no sections', () => {
    const html = renderer.render(baseResume);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<title>Test Resume</title>');
    expect(html).toContain('class="resume-name">Test Resume</h1>');
    expect(html).toContain('No sidebar sections.');
    expect(html).toContain('No main sections added yet.');
  });

  it('safely escapes HTML in text fields', () => {
    const xssResume: Resume = {
      ...baseResume,
      name: '<script>alert("xss")</script>',
      sections: [
        {
          id: 'sec-1',
          type: 'summary',
          title: 'Obj & Goals',
          data: { text: 'I love <br> tags and "quotes" & ampersands.' },
          order: 0,
        },
      ],
    };
    const html = renderer.render(xssResume);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    expect(html).toContain('&lt;br&gt;');
    expect(html).toContain('&quot;quotes&quot;');
    expect(html).toContain('&amp; ampersands');
  });

  it('splits sections into sidebar and main columns correctly', () => {
    const sectionedResume: Resume = {
      ...baseResume,
      sections: [
        { id: '1', type: 'summary', title: 'Summary', data: { text: 'Hi' }, order: 0 },
        { id: '2', type: 'skills', title: 'Skills', data: { items: ['TS'] }, order: 1 },
      ],
    };
    const html = renderer.render(sectionedResume);
    // Modern renderer puts skills in sidebar, summary in main
    expect(html).toContain('<div class="sidebar">');
    expect(html).toMatch(/<div class="sidebar">[\s\S]*Skills[\s\S]*<\/div>\s*<div class="main">/);
    expect(html).toMatch(/<div class="main">[\s\S]*Summary[\s\S]*<\/div>/);
  });
  
  it('handles malformed structured data gracefully', () => {
     const badResume: Resume = {
      ...baseResume,
      sections: [
        { id: '1', type: 'skills', title: 'Skills', data: { items: "not-an-array" }, order: 0 },
        { id: '2', type: 'experience', title: 'Exp', data: { bullets: 123 }, order: 1 },
      ],
    };
    const html = renderer.render(badResume);
    expect(html).toContain('No skills listed.');
    expect(html).toContain('<em>Role</em>');
  });
});

describe('ATSRenderer', () => {
  const renderer = new ATSRenderer();

  it('renders a single-column layout', () => {
    const sectionedResume: Resume = {
      ...baseResume,
      templateId: 'ats-classic',
      sections: [
        { id: '1', type: 'summary', title: 'Summary', data: { text: 'Hi' }, order: 0 },
        { id: '2', type: 'skills', title: 'Skills', data: { items: ['TS'] }, order: 1 },
      ],
    };
    const html = renderer.render(sectionedResume);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).not.toContain('class="sidebar"');
    expect(html).not.toContain('class="main"');
    // Sections should appear in order
    const summaryIdx = html.indexOf('Summary');
    const skillsIdx = html.indexOf('Skills');
    expect(summaryIdx).toBeLessThan(skillsIdx);
  });
});
