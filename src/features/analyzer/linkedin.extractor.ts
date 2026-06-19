export interface ExtractedJob {
  title: string;
  company: string;
  description: string;
  url?: string;
}

/**
 * Attempts to find text from a prioritised list of CSS selectors.
 * Returns the first non-empty match, or '' if none match.
 */
function trySelectors(selectors: string[]): string {
  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel);
      const text = el?.textContent?.trim();
      if (text) return text;
    } catch {
      // invalid selector – skip
    }
  }
  return '';
}

export class LinkedInExtractor {
  /**
   * Extracts job title, company name, and description from a LinkedIn jobs page.
   * Uses a wide fallback chain and NEVER returns null.
   * Falls back to { title: 'Unknown Job', company: 'Unknown Company', description: '' }.
   */
  static extract(): ExtractedJob | null {
    // ── TITLE ─────────────────────────────────────────────────────────────
    // Ordered from most-specific to most-generic so we get the job title h1,
    // not some random nav h1.
    const title = trySelectors([
      // 2024-2025 unified top-card (jobs/view/* and search results panel)
      '.job-details-jobs-unified-top-card__job-title h1',
      '.job-details-jobs-unified-top-card__job-title',
      // Older "top card" layout used on embedded and share URLs
      '.top-card-layout__title',
      // Aria landmark – LinkedIn sets this on the primary heading
      'h1[class*="job-details"]',
      'h1[class*="top-card"]',
      'h1[class*="jobs-unified"]',
      // Generic: first h1 inside the job panel container
      '.jobs-details h1',
      '.job-view-layout h1',
      // Last resort: any h1 on the page
      'h1',
    ]);

    // ── COMPANY ───────────────────────────────────────────────────────────
    const company = trySelectors([
      // 2024-2025 unified card: company name link or span
      '.job-details-jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name',
      // Primary description area contains "Company · Location · …"
      '.job-details-jobs-unified-top-card__primary-description-container a',
      '.job-details-jobs-unified-top-card__primary-description a',
      // Older top-card
      '.topcard__org-name-link',
      '.topcard__flavor--black-link',
      // Public / share job page
      '.sub-nav-cta__optional-url',
      // Any anchor pointing to a company page
      'a[href*="/company/"]',
    ]);

    // ── DESCRIPTION ───────────────────────────────────────────────────────
    const descNode =
      document.getElementById('job-details') ||
      document.querySelector('.jobs-description__content') ||
      document.querySelector('.jobs-description-content__text') ||
      document.querySelector('.description__text') ||
      document.querySelector('[class*="jobs-description"]') ||
      document.querySelector('[class*="job-description"]');

    let description = descNode?.textContent?.trim() ?? '';

    // Boost explicit skills list to the top of description text so the
    // matcher sees them first (LinkedIn "How you match" card).
    const skillItems = document.querySelectorAll(
      '.job-details-how-you-match-card__skills-item, [class*="how-you-match"] li'
    );
    if (skillItems.length > 0) {
      const skillsText = Array.from(skillItems)
        .map(el => el.textContent?.trim())
        .filter(Boolean)
        .join(' ');
      description = skillsText + '\n\n' + description;
    }

    // ── DIAGNOSTICS ───────────────────────────────────────────────────────


    // ── RETURN NULL only when there is genuinely nothing ──────────────────
    // Caller (analyzer.ts) handles the null case with a timed retry.
    if (!title && !description) {
      return null;
    }

    return { title, company, description };
  }
}
