import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LinkedInExtractor } from '../../src/features/analyzer/linkedin.extractor';

describe('LinkedInExtractor', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should extract using primary selectors', () => {
    document.body.innerHTML = `
      <div>
        <h1 class="job-details-jobs-unified-top-card__job-title">Senior Software Engineer</h1>
        <div class="job-details-jobs-unified-top-card__company-name">Tech Corp</div>
        <div id="job-details">
          We are looking for a dev with React and TypeScript experience.
        </div>
      </div>
    `;

    const job = LinkedInExtractor.extract();
    expect(job).not.toBeNull();
    expect(job?.title).toBe('Senior Software Engineer');
    expect(job?.company).toBe('Tech Corp');
    expect(job?.description).toContain('React and TypeScript');
  });

  it('should gracefully degrade to fallback selectors', () => {
    document.body.innerHTML = `
      <div>
        <h1>Backend Developer</h1>
        <a class="topcard__org-name-link">Startup Inc</a>
        <div class="description__text">
          Must know Node.js and Postgres.
        </div>
      </div>
    `;

    const job = LinkedInExtractor.extract();
    expect(job).not.toBeNull();
    expect(job?.title).toBe('Backend Developer');
    expect(job?.company).toBe('Startup Inc');
    expect(job?.description).toContain('Node.js and Postgres');
  });

  it('should return null if no title and no description found', () => {
    document.body.innerHTML = `<div>Empty Page</div>`;
    const job = LinkedInExtractor.extract();
    expect(job).toBeNull();
  });

  it('should prefer explicit skills by appending them', () => {
    document.body.innerHTML = `
      <div>
        <h1>Dev</h1>
        <div id="job-details">Generic text here.</div>
        <div class="job-details-how-you-match-card__skills-item">TypeScript</div>
        <div class="job-details-how-you-match-card__skills-item">Go</div>
      </div>
    `;

    const job = LinkedInExtractor.extract();
    expect(job?.description).toContain('TypeScript Go');
    expect(job?.description).toContain('Generic text here.');
  });

  it('should handle missing title gracefully', () => {
    document.body.innerHTML = `
      <div>
        <div class="job-details-jobs-unified-top-card__company-name">Tech Corp</div>
        <div id="job-details">Description</div>
      </div>
    `;
    const job = LinkedInExtractor.extract();
    expect(job?.title).toBe('');
    expect(job?.company).toBe('Tech Corp');
    expect(job?.description).toBe('Description');
  });

  it('should handle missing company gracefully', () => {
    document.body.innerHTML = `
      <div>
        <h1>Software Engineer</h1>
        <div id="job-details">Description</div>
      </div>
    `;
    const job = LinkedInExtractor.extract();
    expect(job?.title).toBe('Software Engineer');
    expect(job?.company).toBe('');
    expect(job?.description).toBe('Description');
  });

  it('should handle missing description gracefully', () => {
    document.body.innerHTML = `
      <div>
        <h1>Software Engineer</h1>
        <div class="topcard__org-name-link">Startup Inc</div>
      </div>
    `;
    const job = LinkedInExtractor.extract();
    expect(job?.title).toBe('Software Engineer');
    expect(job?.company).toBe('Startup Inc');
    expect(job?.description).toBe('');
  });
});
