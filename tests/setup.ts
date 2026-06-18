import 'fake-indexeddb/auto';

// Mock chrome.storage
const mockStore: Record<string, unknown> = {};

// We use `unknown` to safely bypass strict type constraints of the massive `chrome` object
const chromeMock: unknown = {
  storage: {
    local: {
      get: (_keys: unknown, cb?: (res: Record<string, unknown>) => void) => { if (cb) cb(mockStore); },
      set: (data: Record<string, unknown>, cb?: () => void) => { 
        Object.assign(mockStore, data);
        if (cb) cb(); 
      },
      remove: (_keys: unknown, cb?: () => void) => { if (cb) cb(); },
      clear: (cb?: () => void) => { 
        for (const key in mockStore) delete mockStore[key];
        if (cb) cb(); 
      },
    },
  },
};

Object.assign(globalThis, { chrome: chromeMock });
