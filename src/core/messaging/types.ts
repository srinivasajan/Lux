import type { Profile } from '../types/profile';

export type MessageType = 'GET_PROFILE' | 'OPEN_OPTIONS';

export interface BaseMessage {
  type: MessageType;
  payload?: unknown;
}

export interface GetProfileMessage extends BaseMessage {
  type: 'GET_PROFILE';
}

export interface OpenOptionsMessage extends BaseMessage {
  type: 'OPEN_OPTIONS';
}

export interface GetProfileResponse {
  success: boolean;
  data: Profile | null;
  error?: string;
}
