// src/features/resume/renderers/modern.renderer.ts
import type { Resume, ResumeSection } from '../../../core/types/resume';

// ── Embedded CSS (canonical source: modern.preview.css) ───────────────────
const MODERN_CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{
  font-family:-apple-system,'Segoe UI',Roboto,sans-serif;
  font-size:11px;color:#1f2937;background:#fff;
}
.resume{display:grid;grid-template-columns:220px 1fr;min-height:100%}
.sidebar{background:#1e3a8a;color:#fff;padding:1.5rem 1rem}
.main{padding:1.5rem;background:#fff}
.resume-name{font-size:1.4rem;font-weight:700;line-height:1.2;margin-bottom:1rem}
.section{margin-bottom:1.2rem}
.section-title{
  font-size:0.65rem;font-weight:700;text-transform:uppercase;
  letter-spacing:0.12em;padding-bottom:0.3rem;margin-bottom:0.6rem;
}
.sidebar .section-title{border-bottom:1px solid rgba(255,255,255,0.25);color:rgba(255,255,255,0.75)}
.main .section-title{border-bottom:2px solid #1e3a8a;color:#1e3a8a}
.skill-item{
  font-size:0.8rem;padding:0.15rem 0;
  color:rgba(255,255,255,0.9);border-bottom:1px solid rgba(255,255,255,0.1);
}
.entry{margin-bottom:0.8rem}
.entry-head{display:flex;justify-content:space-between;gap:0.5rem;align-items:baseline}
.entry-title{font-weight:700;font-size:0.9rem}
.entry-org{color:#4b5563;font-size:0.82rem}
.sidebar .entry-org{color:rgba(255,255,255,0.7)}
.entry-date{font-size:0.78rem;color:#6b7280;white-space:nowrap}
.sidebar .entry-date{color:rgba(255,255,255,0.6)}
.bullets{margin:0.3rem 0 0 1rem}
.bullets li{font-size:0.82rem;margin-bottom:0.15rem}
.summary-text{font-size:0.85rem;line-height:1.6;color:#374151}
.tag-row{display:flex;flex-wrap:wrap;gap:0.25rem;margin-top:0.3rem}
.tag{
  background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);
  padding:0.1rem 0.4rem;border-radius:3px;font-size:0.75rem;
}
.proj-stack{font-size:0.78rem;color:#6b7280;margin-top:0.15rem}
.proj-link{font-size:0.78rem;color:#2563eb;margin-top:0.1rem}
.empty-hint{font-style:italic;font-size:0.8rem;color:rgba(255,255,255,0.45)}
.main .empty-hint{color:#9ca3af}
`;

// ── Helpers ────────────────────────────────────────────────────────────────

function esc(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function str(data: Record<string, unknown>, key: string): string {
  return esc(typeof data[key] === 'string' ? (data[key] as string) : '');
}

function arr(data: Record<string, unknown>, key: string): string[] {
  const v = data[key];
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

// ── Section renderers ──────────────────────────────────────────────────────

function renderSummary(s: ResumeSection): string {
  const text = str(s.data, 'text');
  return `<div class="section">
  <div class="section-title">${esc(s.title)}</div>
  <div class="summary-text">${text || '<span class="empty-hint">No summary added.</span>'}</div>
</div>`;
}

function renderExperience(s: ResumeSection): string {
  const company = str(s.data, 'company');
  const role = str(s.data, 'role');
  const duration = str(s.data, 'duration');
  const bullets = arr(s.data, 'bullets');
  return `<div class="section">
  <div class="section-title">${esc(s.title)}</div>
  <div class="entry">
    <div class="entry-head">
      <span class="entry-title">${role || '<em>Role</em>'}</span>
      <span class="entry-date">${duration}</span>
    </div>
    ${company ? `<div class="entry-org">${company}</div>` : ''}
    ${bullets.length ? `<ul class="bullets">${bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
  </div>
</div>`;
}

function renderEducation(s: ResumeSection): string {
  const degree = str(s.data, 'degree');
  const university = str(s.data, 'university');
  const cgpa = str(s.data, 'cgpa');
  const year = str(s.data, 'year');
  return `<div class="section">
  <div class="section-title">${esc(s.title)}</div>
  <div class="entry">
    <div class="entry-head">
      <span class="entry-title">${degree || '<em>Degree</em>'}</span>
      <span class="entry-date">${year}</span>
    </div>
    ${university ? `<div class="entry-org">${university}</div>` : ''}
    ${cgpa ? `<div class="entry-date">GPA: ${cgpa}</div>` : ''}
  </div>
</div>`;
}

function renderProject(s: ResumeSection): string {
  const title = str(s.data, 'title');
  const description = str(s.data, 'description');
  const stack = arr(s.data, 'stack');
  const link = str(s.data, 'link');
  return `<div class="section">
  <div class="section-title">${esc(s.title)}</div>
  <div class="entry">
    <div class="entry-title">${title || '<em>Project</em>'}</div>
    ${description ? `<div style="font-size:0.82rem;color:#374151;margin-top:0.15rem">${description}</div>` : ''}
    ${stack.length ? `<div class="tag-row">${stack.map(t => `<span class="proj-stack">${esc(t)}</span>`).join(' ')}</div>` : ''}
    ${link ? `<div class="proj-link">${link}</div>` : ''}
  </div>
</div>`;
}

function renderSkills(s: ResumeSection, isSidebar: boolean): string {
  const items = arr(s.data, 'items');
  const content = items.length
    ? items.map(i => `<div class="skill-item">${esc(i)}</div>`).join('')
    : `<div class="empty-hint">No skills listed.</div>`;
  if (!isSidebar) {
    // Render as tags in main column
    const tagsContent = items.length
      ? `<div class="tag-row">${items.map(i => `<span class="tag" style="background:#dbeafe;color:#1e40af;border-color:#bfdbfe">${esc(i)}</span>`).join('')}</div>`
      : `<div class="empty-hint">No skills listed.</div>`;
    return `<div class="section">
  <div class="section-title">${esc(s.title)}</div>
  ${tagsContent}
</div>`;
  }
  return `<div class="section">
  <div class="section-title">${esc(s.title)}</div>
  ${content}
</div>`;
}

function renderCustom(s: ResumeSection, _isSidebar: boolean): string {
  const text = str(s.data, 'text');
  return `<div class="section">
  <div class="section-title">${esc(s.title)}</div>
  <div style="font-size:0.82rem">${text || '<span class="empty-hint">No content.</span>'}</div>
</div>`;
}

// Sidebar section types: skills, education, custom
const SIDEBAR_TYPES = new Set<string>(['skills', 'education', 'custom']);

function renderSidebarSection(s: ResumeSection): string {
  switch (s.type) {
    case 'skills':    return renderSkills(s, true);
    case 'education': return renderEducation(s);
    case 'custom':    return renderCustom(s, true);
    default:          return '';
  }
}

function renderMainSection(s: ResumeSection): string {
  switch (s.type) {
    case 'summary':    return renderSummary(s);
    case 'experience': return renderExperience(s);
    case 'project':    return renderProject(s);
    case 'skills':     return renderSkills(s, false);
    case 'custom':     return renderCustom(s, false);
    default:           return '';
  }
}

// ── ModernRenderer ─────────────────────────────────────────────────────────

export class ModernRenderer {
  render(resume: Resume): string {
    const sorted = [...resume.sections].sort((a, b) => a.order - b.order);

    const sidebarSections = sorted.filter(s => SIDEBAR_TYPES.has(s.type));
    const mainSections = sorted.filter(s => !SIDEBAR_TYPES.has(s.type));

    const sidebarHtml = sidebarSections.length
      ? sidebarSections.map(renderSidebarSection).join('\n')
      : '<p class="empty-hint">No sidebar sections.</p>';

    const mainHtml = mainSections.length
      ? mainSections.map(renderMainSection).join('\n')
      : '<p class="empty-hint" style="color:#9ca3af">No main sections added yet.</p>';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(resume.name)}</title>
<style>${MODERN_CSS}</style>
</head>
<body>
<div class="resume">
  <div class="sidebar">
    <h1 class="resume-name">${esc(resume.name)}</h1>
    ${sidebarHtml}
  </div>
  <div class="main">
    ${mainHtml}
  </div>
</div>
</body>
</html>`;
  }
}
