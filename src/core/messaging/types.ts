import type { Profile } from '../types/profile';
import type { Application } from '../types/application';

export type MessageType = 'GET_PROFILE' | 'OPEN_OPTIONS' | 'LOG_APPLICATION' | 'CHECK_APPLICATION';

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

export interface LogApplicationMessage extends BaseMessage {
  type: 'LOG_APPLICATION';
  payload: Application;
}

export interface CheckApplicationMessage extends BaseMessage {
  type: 'CHECK_APPLICATION';
  payload: { jobUrl: string };
}

export interface GetProfileResponse {
  success: boolean;
  data: Profile | null;
  error?: string;
}

export interface GenericResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}
