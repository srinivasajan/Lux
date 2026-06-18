import { ProfileService } from '../features/profile/profile.service';
import { ApplicationService } from '../features/tracker/application.service';
import type { MessageType, GetProfileResponse, LogApplicationMessage, CheckApplicationMessage } from '../core/messaging/types';

export function initBackground(): void {
  chrome.runtime.onMessage.addListener((message: { type: MessageType, payload?: unknown }, _sender, sendResponse) => {
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
    
    if (message.type === 'LOG_APPLICATION') {
      const logMsg = message as LogApplicationMessage;
      ApplicationService.createApplication(logMsg.payload)
        .then((app) => sendResponse({ success: true, data: app }))
        .catch(err => sendResponse({ success: false, error: (err as Error).message }));
      return true;
    }

    if (message.type === 'CHECK_APPLICATION') {
      const checkMsg = message as CheckApplicationMessage;
      ApplicationService.getApplicationByUrl(checkMsg.payload.jobUrl)
        .then(app => sendResponse({ success: true, data: !!app }))
        .catch(err => sendResponse({ success: false, error: (err as Error).message }));
      return true;
    }

    return false;
  });
}

initBackground();
