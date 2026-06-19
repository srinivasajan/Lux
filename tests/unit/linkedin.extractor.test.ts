import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LinkedInExtractor } from '../../src/features/analyzer/linkedin.extractor';

describe('LinkedInExtractor', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  afterEach(() => { document.body.innerHTML = ''; });

  // ── 2024-2025 unified top-card (most common view) ─────────────────────
  it('extracts from 2025 unified top-card selectors', () => {
    document.body.innerHTML = `
      <div class="job-details-jobs-unified-top-card__job-title">
        <h1>Senior Android Developer</h1>
      </div>
      <div class="job-details-jobs-unified-top-card__company-name">
        <a href="/company/acme">Acme Corp</a>
      </div>
      <div id="job-details">
        We need Kotlin, Android, Firebase and REST API experience.
      </div>
    `;
    const job = LinkedInExtractor.extract();
    expect(job).not.toBeNull();
    expect(job!.title).toBe('Senior Android Developer');
    expect(job!.company).toBe('Acme Corp');
    expect(job!.description).toContain('Kotlin');
  });

  // ── Older top-card layout ─────────────────────────────────────────────
  it('falls back to top-card-layout selectors', () => {
    document.body.innerHTML = `
      <div>
        <h1 class="top-card-layout__title">Backend Developer</h1>
        <a class="topcard__org-name-link" href="/company/startup">Startup Inc</a>
        <div class="description__text">Must know Node.js and Postgres.</div>
      </div>
    `;
    const job = LinkedInExtractor.extract();
    expect(job).not.toBeNull();
    expect(job!.title).toBe('Backend Developer');
    expect(job!.company).toBe('Startup Inc');
    expect(job!.description).toContain('Node.js');
  });

  // ── Bare h1 + company link fallback ──────────────────────────────────
  it('falls back to bare h1 and company link', () => {
    document.body.innerHTML = `
      <div>
        <h1>Data Scientist</h1>
        <a href="/company/dataco">DataCo</a>
        <div class="jobs-description__content">Python, SQL, ML experience required.</div>
      </div>
    `;
    const job = LinkedInExtractor.extract();
    expect(job).not.toBeNull();
    expect(job!.title).toBe('Data Scientist');
    expect(job!.company).toBe('DataCo');
    expect(job!.description).toContain('Python');
  });

  // ── Skills boost ─────────────────────────────────────────────────────
  it('prepends explicit skills from how-you-match card', () => {
    document.body.innerHTML = `
      <div>
        <h1>Dev</h1>
        <div id="job-details">Generic JD text here.</div>
        <div class="job-details-how-you-match-card__skills-item">TypeScript</div>
        <div class="job-details-how-you-match-card__skills-item">Go</div>
      </div>
    `;
    const job = LinkedInExtractor.extract();
    expect(job!.description).toContain('TypeScript');
    expect(job!.description).toContain('Go');
    expect(job!.description).toContain('Generic JD text here.');
    // Skills appear BEFORE the generic description
    expect(job!.description.indexOf('TypeScript')).toBeLessThan(
      job!.description.indexOf('Generic JD text here.')
    );
  });

  // ── Missing title – not null ──────────────────────────────────────────
  it('returns job with empty title if no title found but description exists', () => {
    document.body.innerHTML = `
      <div>
        <div class="job-details-jobs-unified-top-card__company-name">Tech Corp</div>
        <div id="job-details">Some description</div>
      </div>
    `;
    const job = LinkedInExtractor.extract();
    expect(job).not.toBeNull();
    expect(job!.title).toBe('');
    expect(job!.company).toBe('Tech Corp');
  });

  // ── Missing company – not null ─────────────────────────────────────────
  it('returns job with empty company if no company found', () => {
    document.body.innerHTML = `
      <div>
        <h1>Software Engineer</h1>
        <div id="job-details">Some description</div>
      </div>
    `;
    const job = LinkedInExtractor.extract();
    expect(job).not.toBeNull();
    expect(job!.title).toBe('Software Engineer');
    expect(job!.company).toBe('');
  });

  // ── Missing description – not null ────────────────────────────────────
  it('returns job with empty description if no description found', () => {
    document.body.innerHTML = `
      <div>
        <h1>Software Engineer</h1>
        <div class="topcard__org-name-link">Startup Inc</div>
      </div>
    `;
    const job = LinkedInExtractor.extract();
    expect(job).not.toBeNull();
    expect(job!.title).toBe('Software Engineer');
    expect(job!.company).toBe('Startup Inc');
    expect(job!.description).toBe('');
  });

  // ── Completely empty page – returns null ─────────────────────────────
  it('returns null when page has no job content at all', () => {
    document.body.innerHTML = `<div>Not a job page</div>`;
    const job = LinkedInExtractor.extract();
    expect(job).toBeNull();
  });
});
