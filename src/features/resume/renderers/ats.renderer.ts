// src/features/resume/renderers/ats.renderer.ts
import type { Resume, ResumeSection } from '../../../core/types/resume';

// ── Embedded CSS (canonical source: ats.preview.css) ──────────────────────
const ATS_CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{
  font-family:'Times New Roman',Times,serif;
  font-size:11pt;color:#000;background:#fff;
  padding:0.5in;line-height:1.4;
}
.resume-name{font-size:16pt;font-weight:bold;text-align:center;margin-bottom:0.35rem}
.section{margin-bottom:0.5rem}
.section-title{
  font-size:11pt;font-weight:bold;text-transform:uppercase;
  border-bottom:1px solid #000;padding-bottom:2px;
  margin:0.45rem 0 0.3rem;
}
.entry{margin-bottom:0.35rem}
.entry-head{display:flex;justify-content:space-between;gap:0.5rem}
.entry-title{font-weight:bold}
.entry-org{font-style:italic}
.entry-date{white-space:nowrap}
.bullets{margin:0.2rem 0 0 1.2rem}
.bullets li{margin-bottom:0.1rem}
.summary-text{margin-top:0.1rem}
.skill-items{margin-top:0.1rem}
.proj-stack{font-size:10pt;color:#333}
.proj-link{font-size:10pt}
.empty-hint{color:#666;font-style:italic;font-size:10pt}
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
      <span><span class="entry-title">${role || '<em>Role</em>'}</span>${company ? ` — <span class="entry-org">${company}</span>` : ''}</span>
      <span class="entry-date">${duration}</span>
    </div>
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
      <span><span class="entry-title">${degree || '<em>Degree</em>'}</span>${university ? ` — <span class="entry-org">${university}</span>` : ''}</span>
      <span class="entry-date">${year}</span>
    </div>
    ${cgpa ? `<div>GPA: ${cgpa}</div>` : ''}
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
    ${description ? `<div>${description}</div>` : ''}
    ${stack.length ? `<div class="proj-stack">Tech: ${stack.map(esc).join(', ')}</div>` : ''}
    ${link ? `<div class="proj-link">Link: ${link}</div>` : ''}
  </div>
</div>`;
}

function renderSkills(s: ResumeSection): string {
  const items = arr(s.data, 'items');
  return `<div class="section">
  <div class="section-title">${esc(s.title)}</div>
  <div class="skill-items">${items.length ? items.map(esc).join(', ') : '<span class="empty-hint">No skills listed.</span>'}</div>
</div>`;
}

function renderCustom(s: ResumeSection): string {
  const text = str(s.data, 'text');
  return `<div class="section">
  <div class="section-title">${esc(s.title)}</div>
  <div>${text || '<span class="empty-hint">No content.</span>'}</div>
</div>`;
}

function renderSection(s: ResumeSection): string {
  switch (s.type) {
    case 'summary':    return renderSummary(s);
    case 'experience': return renderExperience(s);
    case 'education':  return renderEducation(s);
    case 'project':    return renderProject(s);
    case 'skills':     return renderSkills(s);
    case 'custom':     return renderCustom(s);
    default:           return '';
  }
}

// ── ATSRenderer ────────────────────────────────────────────────────────────

export class ATSRenderer {
  render(resume: Resume): string {
    const sorted = [...resume.sections].sort((a, b) => a.order - b.order);
    const sectionsHtml = sorted.length
      ? sorted.map(renderSection).join('\n')
      : '<p class="empty-hint">No sections added yet.</p>';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(resume.name)}</title>
<style>${ATS_CSS}</style>
</head>
<body>
<div class="resume">
  <h1 class="resume-name">${esc(resume.name)}</h1>
  ${sectionsHtml}
</div>
</body>
</html>`;
  }
}
