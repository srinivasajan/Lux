// src/core/storage/chrome.ts

export interface Settings {
  dailyApplicationLimit: number;
  geminiApiKey?: string;
}

const DEFAULT_SETTINGS: Settings = {
  dailyApplicationLimit: 100,
};

export class ChromeStorageService {
  /**
   * Retrieves the current settings from chrome.storage.local
   */
  static async getSettings(): Promise<Settings> {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      // Return defaults during tests if not mocked
      return { ...DEFAULT_SETTINGS };
    }
    return new Promise((resolve) => {
      chrome.storage.local.get(['settings'], (result: Record<string, unknown>) => {
        const settings = result.settings as Partial<Settings> | undefined;
        resolve({ ...DEFAULT_SETTINGS, ...(settings || {}) });
      });
    });
  }

  /**
   * Saves partial settings to chrome.storage.local
   */
  static async updateSettings(partialSettings: Partial<Settings>): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;
    const current = await this.getSettings();
    const updated = { ...current, ...partialSettings };
    return new Promise((resolve) => {
      chrome.storage.local.set({ settings: updated }, () => resolve());
    });
  }
}
