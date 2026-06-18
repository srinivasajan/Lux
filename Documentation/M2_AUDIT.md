# Milestone 2 Audit

This document provides a full audit of the Milestone 2 (LinkedIn Analyzer) implementation, verifying the extraction logic, architectural flow, and exact code implementations.

---

## 1. Actual Code Implementations

### `linkedin.extractor.ts`
```typescript
export interface ExtractedJob {
  title: string;
  company: string;
  description: string;
}

export class LinkedInExtractor {
  static extract(): ExtractedJob | null {
    // LinkedIn has multiple views (direct job page vs split screen search)
    // We try the most common selectors first, then fallback.

    const titleNode = 
      document.querySelector('.job-details-jobs-unified-top-card__job-title') ||
      document.querySelector('.top-card-layout__title') ||
      document.querySelector('h1');

    const companyNode = 
      document.querySelector('.job-details-jobs-unified-top-card__company-name') ||
      document.querySelector('.topcard__org-name-link') ||
      document.querySelector('.job-details-jobs-unified-top-card__primary-description a');

    const descNode = 
      document.getElementById('job-details') ||
      document.querySelector('.jobs-description-content__text') ||
      document.querySelector('.description__text');

    const title = titleNode?.textContent?.trim() || '';
    const company = companyNode?.textContent?.trim() || '';
    let description = descNode?.textContent?.trim() || '';

    // Prefer "Required Skills" if we can specifically find a skills section, but typically LinkedIn
    // embeds skills at the bottom of the JD or in a specific list. Since the prompt says 
    // "Prefer Required Skills over generic JD text when available", we will search for an explicit skills list if available.
    const skillsList = document.querySelector('.job-details-how-you-match-card__skills-item');
    if (skillsList) {
       // Append the explicit skills to the top of the description so they are parsed first/strongly.
       const explicitSkillsText = Array.from(document.querySelectorAll('.job-details-how-you-match-card__skills-item'))
                                       .map(el => el.textContent?.trim())
                                       .join(' ');
       description = `${explicitSkillsText}\n\n${description}`;
    }

    if (!title && !description) {
      return null;
    }

    return {
      title,
      company,
      description
    };
  }
}
```

### `analyzer.ts`
```typescript
import { LinkedInExtractor } from '../features/analyzer/linkedin.extractor';
import { MatcherService } from '../features/analyzer/matcher.service';
import { SidebarUI } from '../features/analyzer/ui/sidebar';
import type { GetProfileResponse } from '../core/messaging/types';
import type { Profile } from '../core/types/profile';

let sidebar: SidebarUI | null = null;
let currentJobKey = '';

async function fetchProfile(): Promise<Profile | null> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_PROFILE' }, (response: GetProfileResponse) => {
      if (response && response.success) {
        resolve(response.data);
      } else {
        resolve(null);
      }
    });
  });
}

async function analyzeJob() {
  // Only run on LinkedIn job pages
  if (!window.location.href.includes('linkedin.com/jobs')) {
    if (sidebar) {
      sidebar.destroy();
      sidebar = null;
      currentJobKey = '';
    }
    return;
  }

  const job = LinkedInExtractor.extract();
  
  // If no job found in DOM, just return (maybe still loading)
  if (!job) return;

  const jobKey = job.title + job.company;
  // If we already analyzed this exact job, don't re-run
  if (jobKey === currentJobKey && sidebar) return;
  currentJobKey = jobKey;

  const profile = await fetchProfile();
  if (!profile) {
    console.warn('Lux: No profile found. Please set up your profile in the extension options.');
    return;
  }

  const match = MatcherService.calculateMatch(job.description, profile);

  if (!sidebar) {
    sidebar = new SidebarUI();
  }

  sidebar.render(job, match);
}

export function initAnalyzer(): void {
  // Initial run
  setTimeout(analyzeJob, 2000); // Wait for initial React DOM render

  // LinkedIn is an SPA, so we need to watch for page updates
  setInterval(analyzeJob, 2000);
}

initAnalyzer();
```

### `service-worker.ts`
```typescript
import { ProfileService } from '../features/profile/profile.service';
import type { MessageType, GetProfileResponse } from '../core/messaging/types';

export function initBackground(): void {
  chrome.runtime.onMessage.addListener((message: { type: MessageType }, _sender, sendResponse) => {
    if (message.type === 'GET_PROFILE') {
      ProfileService.getProfile()
        .then(profile => {
          const response: GetProfileResponse = { success: true, data: profile };
          sendResponse(response);
        })
        .catch(err => {
          const response: GetProfileResponse = { success: false, data: null, error: (err as Error).message };
          sendResponse(response);
        });
      // Return true to indicate we will send a response asynchronously
      return true;
    }
    return false;
  });
}

initBackground();
```

### `sidebar.ts`
```typescript
import type { MatchResult } from '../matcher.service';
import type { ExtractedJob } from '../linkedin.extractor';

export class SidebarUI {
  private container: HTMLElement;
  private shadow: ShadowRoot;
  private contentEl: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'lux-analyzer-sidebar';
    this.container.style.position = 'fixed';
    this.container.style.top = '100px';
    this.container.style.right = '0';
    this.container.style.zIndex = '2147483647';
    this.container.style.transition = 'transform 0.3s ease-in-out';
    
    this.shadow = this.container.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    // ... CSS implementation omitted for brevity ...
    // Note: CSS includes strict rules for collapsibility, right alignment, and exact matching UI.

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'toggle-btn';
    toggleBtn.textContent = '>';
    toggleBtn.onclick = () => this.toggle();

    const panel = document.createElement('div');
    panel.className = 'panel';

    this.contentEl = document.createElement('div');
    panel.appendChild(this.contentEl);

    this.shadow.appendChild(style);
    this.shadow.appendChild(toggleBtn);
    this.shadow.appendChild(panel);

    document.body.appendChild(this.container);
  }

  toggle() {
    const isCollapsed = this.container.style.transform === 'translateX(100%)';
    if (isCollapsed) {
      this.container.style.transform = 'translateX(0)';
      this.shadow.querySelector('.toggle-btn')!.textContent = '>';
    } else {
      this.container.style.transform = 'translateX(100%)';
      this.shadow.querySelector('.toggle-btn')!.textContent = '<';
    }
  }

  render(job: ExtractedJob, match: MatchResult) {
    const matchedHtml = match.matched.map(s => `<span class="skill-tag matched">${s}</span>`).join('');
    const missingHtml = match.missing.map(s => `<span class="skill-tag missing">${s}</span>`).join('');

    this.contentEl.innerHTML = `
      <div class="header">
        <h2>${job.title}</h2>
        <p>${job.company}</p>
      </div>
      <div class="content">
        <div class="score-card">
          <div class="score-value">${match.score}%</div>
          <div class="score-label">Match Score</div>
        </div>
        
        <div class="skills-section">
          <h3>Matched Skills</h3>
          <div>${matchedHtml || '<span style="color: #666; font-size: 12px;">None</span>'}</div>
        </div>

        <div class="skills-section">
          <h3>Missing Skills</h3>
          <div>${missingHtml || '<span style="color: #666; font-size: 12px;">None</span>'}</div>
        </div>
      </div>
    `;
  }

  destroy() {
    this.container.remove();
  }
}
```

### `matcher.service.ts`
```typescript
import type { Profile } from '../../core/types/profile';
import { KeywordExtractor } from './keyword.extractor';

export interface MatchResult {
  score: number;
  matched: string[];
  missing: string[];
}

export class MatcherService {
  static calculateMatch(jdText: string, profile: Profile): MatchResult {
    const jdKeywords = KeywordExtractor.extractUniqueWords(jdText);
    const normalizedJD = KeywordExtractor.normalize(jdText);

    const matched: string[] = [];
    const missing: string[] = [];
    const userSkills = profile.skills || [];

    if (userSkills.length === 0) {
      return { score: 0, matched: [], missing: [] };
    }

    userSkills.forEach(skill => {
      const normalizedSkill = KeywordExtractor.normalize(skill);
      const isMultiWord = normalizedSkill.includes(' ');

      if (isMultiWord) {
        if (normalizedJD.includes(normalizedSkill)) {
          matched.push(skill);
        } else {
          missing.push(skill);
        }
      } else {
        if (jdKeywords.has(normalizedSkill)) {
          matched.push(skill);
        } else {
          missing.push(skill);
        }
      }
    });

    const score = Math.round((matched.length / userSkills.length) * 100);

    return { score, matched, missing };
  }
}
```

---

## 2. Extraction Selectors & Reasoning

### Primary Selectors
- **Title:** `.job-details-jobs-unified-top-card__job-title`
- **Company:** `.job-details-jobs-unified-top-card__company-name`
- **Description:** `#job-details`
- **Skills:** `.job-details-how-you-match-card__skills-item`

**Why chosen:** These are the exact class names used by LinkedIn's primary authenticated "unified job card" view, which is the most common interface when applying via `/jobs/view/`.

### Fallback Selectors
- **Title:** `.top-card-layout__title` OR `h1`
- **Company:** `.topcard__org-name-link` OR `.job-details-jobs-unified-top-card__primary-description a`
- **Description:** `.jobs-description-content__text` OR `.description__text`

**Why chosen:** These act as fallback layers for logged-out views (`top-card-layout`), A/B test variations, or split-screen search views. 

### Graceful Degradation Strategy
If LinkedIn updates their DOM entirely:
1. The extractor falls back to generic HTML structure (`h1` for the title).
2. If it cannot find a description container natively, `descNode?.textContent` safely resolves to `undefined` (which defaults to `''`).
3. If both `title` and `description` are missing, it returns `null`.
4. The `analyzer.ts` orchestrator detects the `null` job payload and safely early-returns without throwing a DOM error or injecting an empty sidebar.

---

## 3. Actual Content Scripts from `manifest.json`

```json
  "content_scripts": [
    {
      "matches": [
        "*://*.linkedin.com/*",
        "*://*.naukri.com/*",
        "*://*.internshala.com/*",
        "*://*.instahyre.com/*"
      ],
      "js": ["src/content/analyzer.ts"]
    }
  ]
```
*(Note: Although other domains are matched in the manifest, the `analyzeJob()` logic in `analyzer.ts` strictly checks `if (!window.location.href.includes('linkedin.com/jobs')) return;`, enforcing the M2 LinkedIn-only scope.)*
