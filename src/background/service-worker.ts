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
    
    if (message.type === 'OPEN_OPTIONS') {
      chrome.runtime.openOptionsPage();
      sendResponse({ success: true });
      return false; // synchronous
    }
    
    return false;
  });
}

initBackground();
