import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initAnalyzer } from '../../src/content/analyzer';
import { SidebarUI } from '../../src/features/analyzer/ui/sidebar';
import { MatcherService } from '../../src/features/analyzer/matcher.service';
import { LinkedInExtractor } from '../../src/features/analyzer/linkedin.extractor';
import type { Profile } from '../../src/core/types/profile';

// Mock the services
vi.mock('../../src/features/analyzer/ui/sidebar');
vi.mock('../../src/features/analyzer/matcher.service');
vi.mock('../../src/features/analyzer/linkedin.extractor');

// We need to mock chrome.runtime.sendMessage
// No need to declare global var chrome, since @types/chrome provides it

describe('Analyzer SPA Navigation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    
    // Reset window.location
    Object.defineProperty(window, 'location', {
      value: { href: 'https://www.linkedin.com/jobs/view/123' },
      writable: true,
    });

    Object.assign(globalThis, {
      chrome: {
        runtime: {
          sendMessage: vi.fn((_msg: unknown, cb?: (res: unknown) => void) => {
            if (cb) {
              cb({
                success: true,
                data: { personal: { name: 'Test' }, skills: ['React'] } as unknown as Profile
              });
            }
          }) as unknown as typeof chrome.runtime.sendMessage
        }
      }
    });

    vi.mocked(MatcherService.calculateMatch).mockReturnValue({
      score: 100,
      matched: ['React'],
      missing: []
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  it('should analyze Job A, then analyze Job B on URL change', async () => {
    // 1. Initial Job A
    vi.mocked(LinkedInExtractor.extract).mockReturnValue({
      title: 'Job A',
      company: 'Company A',
      description: 'Need React'
    });

    // We can't import the singleton state from analyzer.ts easily because it's module level,
    // so we trigger the observer logic by executing the module logic manually, but since it's side-effect heavy,
    // let's just run initAnalyzer.
    initAnalyzer();

    // Advance timers for initial timeout
    await vi.runAllTimersAsync();

    expect(LinkedInExtractor.extract).toHaveBeenCalledTimes(1);
    expect(SidebarUI.prototype.render).toHaveBeenCalledTimes(1);

    // 2. Simulate SPA Navigation to Job B
    window.location.href = 'https://www.linkedin.com/jobs/view/456';
    vi.mocked(LinkedInExtractor.extract).mockReturnValue({
      title: 'Job B',
      company: 'Company B',
      description: 'Need Vue'
    });

    // Trigger mutation observer that listens to URL changes
    document.body.appendChild(document.createElement('div'));

    // Wait for async functions and debounce
    await vi.runAllTimersAsync();

    // It should have re-extracted and re-rendered
    expect(LinkedInExtractor.extract).toHaveBeenCalledTimes(2);
    expect(SidebarUI.prototype.render).toHaveBeenCalledTimes(2);
  });
});
