import { LinkedInExtractor } from '../features/analyzer/linkedin.extractor';
import { MatcherService } from '../features/analyzer/matcher.service';
import { SidebarUI } from '../features/analyzer/ui/sidebar';
import type { GetProfileResponse } from '../core/messaging/types';
import type { Profile } from '../core/types/profile';

let sidebar: SidebarUI | null = null;
let currentJobKey = '';
let isAnalyzing = false;

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
  if (isAnalyzing) return;
  isAnalyzing = true;

  try {
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

    const jobKey = job.title + '|' + job.company;
    
    // If we already analyzed this exact job and the sidebar is showing, don't re-run
    if (jobKey === currentJobKey && sidebar) return;
    currentJobKey = jobKey;

    if (!sidebar) {
      sidebar = new SidebarUI();
    }

    const profile = await fetchProfile();
    if (!profile || !profile.personal.name) {
      sidebar.renderSetupUI();
      return;
    }

    const match = MatcherService.calculateMatch(job.description, profile);
    
    // Check if already logged
    const isLogged = await new Promise<boolean>((resolve) => {
      // Need a stable unique job URL, we can strip queries. 
      // The canonical URL on LinkedIn is usually the current path.
      const url = window.location.href.split('?')[0]; 
      chrome.runtime.sendMessage({ 
        type: 'CHECK_APPLICATION', 
        payload: { jobUrl: url } 
      }, (res: { data?: boolean }) => resolve(res?.data || false));
    });

    // Provide the clean url so the sidebar can use it
    job.url = window.location.href.split('?')[0];

    sidebar.render(job, match, isLogged);
  } finally {
    isAnalyzing = false;
  }
}

let jobObserver: MutationObserver | null = null;

function observeJobContainer() {
  const container = document.querySelector('.jobs-details') || document.querySelector('.job-view-layout');
  if (!container) return;

  if (jobObserver) {
    jobObserver.disconnect();
  }

  let debounceTimer: ReturnType<typeof setTimeout>;
  jobObserver = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      analyzeJob();
    }, 500);
  });

  jobObserver.observe(container, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

export function initAnalyzer(): void {
  // 1. Observe URL changes
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      currentJobKey = ''; // reset to force re-analysis on new URL
      analyzeJob();
      observeJobContainer();
    }
  }).observe(document.body, { childList: true, subtree: true });

  // Initial trigger
  setTimeout(() => {
    analyzeJob();
    observeJobContainer();
  }, 1000);
}

initAnalyzer();
