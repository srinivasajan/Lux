import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../../src/core/storage/idb';
import { ApplicationStatus, ApplicationPlatform } from '../../src/core/types/application';

describe('Application Tracker Integration', () => {
  type ListenerFn = (message: unknown, sender: unknown, sendResponse: (res: unknown) => void) => boolean | void;
  let messageListeners: ListenerFn[] = [];

  beforeEach(async () => {
    await db.applications.clear();
    messageListeners = [];
    
    Object.assign(globalThis, {
      chrome: {
        runtime: {
          onMessage: {
            addListener: (fn: ListenerFn) => {
              messageListeners.push(fn);
            }
          } as unknown as typeof chrome.runtime.onMessage
        },
        scripting: {
          getRegisteredContentScripts: () => Promise.resolve([]),
          registerContentScripts: () => Promise.resolve(),
        }
      }
    });

    // Dynamic import to avoid immediate execution before mock is ready
    const { initBackground } = await import('../../src/background/service-worker');
    initBackground();
  });

  afterEach(async () => {
    await db.applications.clear();
  });

  function simulateMessage(message: unknown): Promise<{ success: boolean; data?: unknown; }> {
    return new Promise((resolve) => {
      let handled = false;
      for (const listener of messageListeners) {
        if (listener(message, {}, (res: unknown) => resolve(res as { success: boolean; data?: unknown }))) {
          handled = true;
        }
      }
      if (!handled) resolve({ success: false });
    });
  }

  it('should capture LinkedIn application via background message', async () => {
    const payload = {
      company: 'Test Capture',
      role: 'Dev',
      platform: ApplicationPlatform.LinkedIn,
      jobUrl: 'https://test.com/job',
      status: ApplicationStatus.Applied,
      matchScore: 50,
      appliedAt: new Date().toISOString()
    };

    const res = await simulateMessage({ type: 'LOG_APPLICATION', payload });
    expect(res.success).toBe(true);
    expect((res.data as any).id).toBeDefined();

    // Verify it was actually saved to Dexie
    const saved = await db.applications.where('jobUrl').equals('https://test.com/job').first();
    expect(saved).toBeDefined();
    expect(saved?.company).toBe('Test Capture');
  });

  it('should successfully check if an application is logged', async () => {
    // Insert directly
    await db.applications.add({
      company: 'Exists',
      role: 'Dev',
      platform: ApplicationPlatform.LinkedIn,
      jobUrl: 'https://exist.com',
      status: ApplicationStatus.Applied,
      appliedAt: new Date().toISOString()
    } as unknown as any);

    const res = await simulateMessage({ type: 'CHECK_APPLICATION', payload: { jobUrl: 'https://exist.com' } });
    expect(res.success).toBe(true);
    expect(res.data).toBe(true);

    const resFalse = await simulateMessage({ type: 'CHECK_APPLICATION', payload: { jobUrl: 'https://new.com' } });
    expect(resFalse.data).toBe(false);
  });
});
