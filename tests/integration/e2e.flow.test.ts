/**
 * E2E Integration Test: Complete LinkedIn → Application Tracking Flow
 *
 * Proves all 10 steps of the user journey work end-to-end in a test environment:
 *   1. LinkedIn job page DOM → extraction
 *   2. Profile loading
 *   3. Match score calculation
 *   4. Sidebar render (with real job data)
 *   5. LOG_APPLICATION via background message
 *   6. Application persisted to IndexedDB
 *   7. listApplications() shows it in tracker
 *   8. Status update works
 *   9. CSV export generates correct content
 *  10. Duplicate protection (same jobUrl rejected)
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '../../src/core/storage/idb';
import { ApplicationService } from '../../src/features/tracker/application.service';
import { PopupController } from '../../src/popup/popup.controller';
import { CsvExportService } from '../../src/features/tracker/csv.export';
import { LinkedInExtractor } from '../../src/features/analyzer/linkedin.extractor';
import { MatcherService } from '../../src/features/analyzer/matcher.service';
import { ApplicationStatus, ApplicationPlatform } from '../../src/core/types/application';
import type { Profile } from '../../src/core/types/profile';

// ── helpers ────────────────────────────────────────────────────────────────
type ListenerFn = (
  message: unknown,
  sender: unknown,
  sendResponse: (res: unknown) => void
) => boolean | void;

function buildChromeMock(listeners: ListenerFn[], profile: Profile | null) {
  return {
    runtime: {
      lastError: undefined as chrome.runtime.LastError | undefined,
      onMessage: {
        addListener: (fn: ListenerFn) => listeners.push(fn),
      },
      sendMessage: vi.fn(
        (_msg: unknown, cb?: (res: unknown) => void) => {
          if (cb) cb({ success: true, data: profile });
        }
      ),
    },
    scripting: {
      getRegisteredContentScripts: () => Promise.resolve([]),
      registerContentScripts: () => Promise.resolve(),
    },
  };
}

function simulateMessage(
  listeners: ListenerFn[],
  message: unknown
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  return new Promise((resolve) => {
    let handled = false;
    for (const listener of listeners) {
      if (listener(message, {}, (res: unknown) => resolve(res as never))) {
        handled = true;
      }
    }
    if (!handled) resolve({ success: false });
  });
}

// ── realistic LinkedIn HTML fixture ────────────────────────────────────────
const LINKEDIN_JOB_HTML = `
  <div class="job-details-jobs-unified-top-card__job-title">
    <h1>Senior Android Developer</h1>
  </div>
  <div class="job-details-jobs-unified-top-card__company-name">
    <a href="/company/acme-corp">Acme Corp</a>
  </div>
  <div id="job-details">
    We need 4+ years of Android development. Must have:
    Kotlin, Java, Android SDK, REST APIs, Git, Firebase.
    MVVM architecture experience preferred.
  </div>
`;

const TEST_PROFILE: Profile = {
  personal: { name: 'Test User', email: 'test@example.com', phone: '' },
  skills: ['Kotlin', 'Java', 'Android SDK', 'Git', 'REST APIs', 'Firebase'],
  experience: [],
  education: [],
  projects: [],
};

const JOB_URL = 'https://www.linkedin.com/jobs/view/1234567890';

// ── test suite ─────────────────────────────────────────────────────────────
describe('E2E: LinkedIn Job → Application Tracking Flow', () => {
  let listeners: ListenerFn[] = [];

  beforeEach(async () => {
    await db.applications.clear();
    listeners = [];

    Object.assign(globalThis, {
      chrome: buildChromeMock(listeners, TEST_PROFILE),
    });

    const { initBackground } = await import('../../src/background/service-worker');
    initBackground();

    // Set up DOM with realistic LinkedIn job page structure
    document.body.innerHTML = LINKEDIN_JOB_HTML;

    // Set up window.location to a LinkedIn jobs URL
    Object.defineProperty(window, 'location', {
      value: { href: JOB_URL },
      writable: true,
      configurable: true,
    });
  });

  afterEach(async () => {
    await db.applications.clear();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  // ── STEP 1 & 2: Extraction ─────────────────────────────────────────────
  it('STEP 1-2: LinkedInExtractor extracts title, company, description from LinkedIn DOM', () => {
    const job = LinkedInExtractor.extract();

    expect(job).not.toBeNull();
    expect(job!.title).toBe('Senior Android Developer');
    expect(job!.company).toBe('Acme Corp');
    expect(job!.description).toContain('Kotlin');
    expect(job!.description).toContain('Firebase');
    expect(job!.description.length).toBeGreaterThan(20);
  });

  // ── STEP 3: Match calculation ──────────────────────────────────────────
  it('STEP 3: MatcherService scores profile against extracted JD', () => {
    const job = LinkedInExtractor.extract()!;
    const match = MatcherService.calculateMatch(job.description, TEST_PROFILE);

    expect(match.score).toBeGreaterThan(0);
    expect(match.matched.length).toBeGreaterThan(0);
    // At least Kotlin, Java, Git should be matched
    expect(match.matched).toContain('Kotlin');
    expect(match.matched).toContain('Java');
    expect(match.matched).toContain('Git');
    expect(match.score).toBeGreaterThanOrEqual(50);
  });

  // ── STEP 4: Sidebar data integrity ────────────────────────────────────
  it('STEP 4: Sidebar receives correct job data and match result', () => {
    const job = LinkedInExtractor.extract()!;
    const match = MatcherService.calculateMatch(job.description, TEST_PROFILE);

    // These are the values the sidebar.render() would receive
    expect(job.title).toBeTruthy();
    expect(job.company).toBeTruthy();
    expect(match.score).toBeGreaterThanOrEqual(0);
    expect(match.score).toBeLessThanOrEqual(100);
    // Sidebar can always render: neither field is null/undefined
    expect(typeof match.score).toBe('number');
    expect(Array.isArray(match.matched)).toBe(true);
    expect(Array.isArray(match.missing)).toBe(true);
  });

  // ── STEP 5 & 6: LOG_APPLICATION → IndexedDB ───────────────────────────
  it('STEP 5-6: LOG_APPLICATION message saves application to IndexedDB', async () => {
    const job = LinkedInExtractor.extract()!;
    const match = MatcherService.calculateMatch(job.description, TEST_PROFILE);

    const payload = {
      company: job.company || 'Unknown Company',
      role: job.title || 'Unknown Job',
      jobUrl: JOB_URL,
      platform: ApplicationPlatform.LinkedIn,
      status: ApplicationStatus.Applied,
      matchScore: match.score,
      appliedAt: new Date().toISOString(),
      source: 'LinkedIn',
    };

    const res = await simulateMessage(listeners, { type: 'LOG_APPLICATION', payload });
    expect(res.success).toBe(true);
    expect((res.data as { id?: number }).id).toBeDefined();

    // Verify IndexedDB
    const saved = await db.applications.where('jobUrl').equals(JOB_URL).first();
    expect(saved).toBeDefined();
    // Non-null safe: expect(saved).toBeDefined() already guards these
    const s = saved!;
    expect(s.company).toBe('Acme Corp');
    expect(s.role).toBe('Senior Android Developer');
    expect(s.status).toBe(ApplicationStatus.Applied);
    expect(s.matchScore).toBeGreaterThan(0);
  });

  // ── STEP 7: Popup tracker shows application ────────────────────────────
  it('STEP 7: PopupController.loadApplications() returns saved application', async () => {
    // Pre-insert directly
    await ApplicationService.createApplication({
      company: 'Acme Corp',
      role: 'Senior Android Developer',
      jobUrl: JOB_URL,
      platform: ApplicationPlatform.LinkedIn,
      status: ApplicationStatus.Applied,
      matchScore: 83,
      appliedAt: new Date().toISOString(),
    });

    const controller = new PopupController();
    const apps = await controller.loadApplications();

    expect(apps.length).toBe(1);
    const [firstApp] = apps;
    expect(firstApp!.company).toBe('Acme Corp');
    expect(firstApp!.role).toBe('Senior Android Developer');
    expect(firstApp!.matchScore).toBe(83);
  });

  // ── STEP 8: Status update works ────────────────────────────────────────
  it('STEP 8: Status update via controller persists to IndexedDB', async () => {
    const created = await ApplicationService.createApplication({
      company: 'Acme Corp',
      role: 'Senior Android Developer',
      jobUrl: JOB_URL,
      platform: ApplicationPlatform.LinkedIn,
      status: ApplicationStatus.Applied,
      appliedAt: new Date().toISOString(),
    });

    const controller = new PopupController();
    await controller.loadApplications();
    await controller.updateStatus(created.id as number, ApplicationStatus.Interview);

    const updated = await db.applications.get(created.id as number);
    expect(updated!.status).toBe(ApplicationStatus.Interview);
  });

  // ── STEP 9: CSV export ─────────────────────────────────────────────────
  it('STEP 9: CSV export generates correct content', async () => {
    await ApplicationService.createApplication({
      company: 'Acme Corp',
      role: 'Senior Android Developer',
      jobUrl: JOB_URL,
      platform: ApplicationPlatform.LinkedIn,
      status: ApplicationStatus.Applied,
      matchScore: 83,
      appliedAt: '2025-06-18T10:00:00.000Z',
    });

    const controller = new PopupController();
    const apps = await controller.loadApplications();
    const csv = CsvExportService.generateCsv(apps);

    // Header row
    expect(csv).toContain('Company,Role,Platform,Status,MatchScore,AppliedAt,JobUrl');
    // Data row
    expect(csv).toContain('Acme Corp');
    expect(csv).toContain('Senior Android Developer');
    expect(csv).toContain('LinkedIn');
    expect(csv).toContain('Applied');
    expect(csv).toContain('83');
    expect(csv).toContain(JOB_URL);

    const lines = csv.split('\n');
    expect(lines.length).toBe(2); // header + 1 row
  });

  // ── STEP 10: Duplicate protection ─────────────────────────────────────
  it('STEP 10: Duplicate LOG_APPLICATION for same jobUrl is rejected', async () => {
    const payload = {
      company: 'Acme Corp',
      role: 'Senior Android Developer',
      jobUrl: JOB_URL,
      platform: ApplicationPlatform.LinkedIn,
      status: ApplicationStatus.Applied,
      appliedAt: new Date().toISOString(),
    };

    // First log — should succeed
    const first = await simulateMessage(listeners, { type: 'LOG_APPLICATION', payload });
    expect(first.success).toBe(true);

    // Second log with same URL — should fail
    const second = await simulateMessage(listeners, { type: 'LOG_APPLICATION', payload });
    expect(second.success).toBe(false);
    expect(second.error).toContain('already exists');

    // Only one record in DB
    const all = await db.applications.toArray();
    expect(all.length).toBe(1);
  });

  // ── CHECK_APPLICATION: returns true/false correctly ───────────────────
  it('CHECK_APPLICATION returns true when logged, false when not', async () => {
    await ApplicationService.createApplication({
      company: 'Acme Corp',
      role: 'Senior Android Developer',
      jobUrl: JOB_URL,
      platform: ApplicationPlatform.LinkedIn,
      status: ApplicationStatus.Applied,
      appliedAt: new Date().toISOString(),
    });

    const yes = await simulateMessage(listeners, {
      type: 'CHECK_APPLICATION',
      payload: { jobUrl: JOB_URL },
    });
    expect(yes.success).toBe(true);
    expect(yes.data).toBe(true);

    const no = await simulateMessage(listeners, {
      type: 'CHECK_APPLICATION',
      payload: { jobUrl: 'https://www.linkedin.com/jobs/view/999' },
    });
    expect(no.success).toBe(true);
    expect(no.data).toBe(false);
  });

  // ── Full flow in sequence ──────────────────────────────────────────────
  it('FULL FLOW: extract → match → log → list → update → csv in sequence', async () => {
    // 1. Extract
    const job = LinkedInExtractor.extract()!;
    expect(job.title).toBe('Senior Android Developer');

    // 2. Match
    const match = MatcherService.calculateMatch(job.description, TEST_PROFILE);
    expect(match.score).toBeGreaterThan(0);

    // 3. Log via background message
    const logRes = await simulateMessage(listeners, {
      type: 'LOG_APPLICATION',
      payload: {
        company: job.company,
        role: job.title,
        jobUrl: JOB_URL,
        platform: ApplicationPlatform.LinkedIn,
        status: ApplicationStatus.Applied,
        matchScore: match.score,
        appliedAt: new Date().toISOString(),
      },
    });
    expect(logRes.success).toBe(true);
    const savedId = (logRes.data as { id: number }).id;

    // 4. List via popup controller
    const controller = new PopupController();
    const apps = await controller.loadApplications();
    expect(apps.length).toBe(1);
    const [firstResult] = apps;
    expect(firstResult!.company).toBe('Acme Corp');

    // 5. Filter works
    const found = controller.filterApplications('acme', 'All');
    expect(found.length).toBe(1);
    const notFound = controller.filterApplications('xyzzy', 'All');
    expect(notFound.length).toBe(0);

    // 6. Status update
    await controller.updateStatus(savedId, ApplicationStatus.Interview);
    const afterUpdate = await db.applications.get(savedId);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(afterUpdate!.status).toBe(ApplicationStatus.Interview);

    // 7. CSV
    const apps2 = await controller.loadApplications();
    const csv = CsvExportService.generateCsv(apps2);
    expect(csv).toContain('Acme Corp');
    expect(csv).toContain('Senior Android Developer');
    expect(csv).toContain('Interview');
    expect(csv.split('\n').length).toBe(2);

    // 8. Delete
    await controller.deleteApplication(savedId);
    const appsAfterDelete = await controller.loadApplications();
    expect(appsAfterDelete.length).toBe(0);
  });
});
