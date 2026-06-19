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
    try {
      chrome.runtime.sendMessage({ type: 'GET_PROFILE' }, (response: GetProfileResponse) => {
        if (chrome.runtime.lastError) { resolve(null); return; }
        resolve(response?.success ? response.data : null);
      });
    } catch {
      resolve(null);
    }
  });
}

async function checkLogged(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ type: 'CHECK_APPLICATION', payload: { jobUrl: url } }, (res: { data?: boolean }) => {
        if (chrome.runtime.lastError) { resolve(false); return; }
        resolve(res?.data || false);
      });
    } catch {
      resolve(false);
    }
  });
}

async function analyzeJob(): Promise<void> {
  if (isAnalyzing) return;
  isAnalyzing = true;

  try {
    // Only run on LinkedIn job pages
    if (!window.location.href.includes('linkedin.com/jobs')) {
      if (sidebar) { sidebar.destroy(); sidebar = null; currentJobKey = ''; }
      return;
    }

    // --- Step 1: Extract job (fail-open) ---
    let job = LinkedInExtractor.extract();
    if (!job) {
      // DOM not ready yet — retry once after 1.5s
      await new Promise(r => setTimeout(r, 1500));
      job = LinkedInExtractor.extract();
    }

    const jobTitle = job?.title || 'Unknown Job';
    const jobCompany = job?.company || 'Unknown Company';
    const jobKey = jobTitle + '|' + jobCompany;

    // Don't re-render if same job already showing
    if (jobKey === currentJobKey && sidebar) return;
    currentJobKey = jobKey;

    if (!sidebar) { sidebar = new SidebarUI(); }

    // --- Step 2: Load profile (fail-open) ---
    let profile: Profile | null = null;
    try { profile = await fetchProfile(); } catch { /* ignore */ }

    if (!profile) {
      sidebar.renderSetupUI();
      return;
    }

    // --- Step 3: Calculate match (fail-open) ---
    let match = { score: 0, matched: [] as string[], missing: [] as string[] };
    try {
      match = MatcherService.calculateMatch((job?.description) ?? '', profile);
    } catch { /* ignore */ }

    // --- Step 4: Check if logged (fail-open) ---
    const url: string = window.location.href.split('?')[0] ?? window.location.href;
    let isLogged = false;
    try { isLogged = await checkLogged(url); } catch { /* ignore */ }

    // Populate job object for sidebar
    const fullJob: import('../features/analyzer/linkedin.extractor').ExtractedJob = {
      title: job?.title || jobTitle,
      company: job?.company || jobCompany,
      description: job?.description || '',
      url
    };

    // --- Step 5: Render ---
    sidebar.render(fullJob, match, isLogged);

  } finally {
    isAnalyzing = false;
  }
}

let jobObserver: MutationObserver | null = null;

function observeJobContainer() {
  const container = document.querySelector('.jobs-details') || document.querySelector('.job-view-layout') || document.body;
  if (jobObserver) jobObserver.disconnect();

  let debounceTimer: ReturnType<typeof setTimeout>;
  jobObserver = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => { analyzeJob(); }, 500);
  });

  jobObserver.observe(container, { childList: true, subtree: true, characterData: true });
}

export function initAnalyzer(): void {
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      currentJobKey = '';
      analyzeJob();
      observeJobContainer();
    }
  }).observe(document.body, { childList: true, subtree: true });

  // Initial trigger — 1s for DOM to settle, then 3s fallback
  setTimeout(() => { analyzeJob(); observeJobContainer(); }, 1000);
  setTimeout(() => { if (!sidebar) analyzeJob(); }, 3000);
}

initAnalyzer();
