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
