/**
 * Type definitions for AnyDB SDK
 */

// AnyDB Record Types
export interface ADORecord {
  adoid: string;
  adbid: string;
  teamid: string;
  meta: {
    name: string;
    description?: string;
    icon?: string;
    followup?: number;
    locked?: boolean;
    status?: string;
    assignees?: {
      users?: string[];
      groups?: string[];
    };
  };
  content?: Record<string, any>;
  [key: string]: any;
}

export interface Team {
  teamid: string;
  name: string;
  [key: string]: any;
}

export interface ADB {
  adbid: string;
  teamid: string;
  name: string;
  [key: string]: any;
}

export interface CreateRecordParams {
  adbid: string;
  teamid: string;
  name: string;
  attach?: string;
  template?: string;
  content?: Record<string, any>;
}

export interface UpdateRecordParams {
  meta: {
    adoid: string;
    adbid: string;
    teamid: string;
    name?: string;
    description?: string;
    icon?: string;
    followup?: number;
    locked?: boolean;
    status?: string;
    assignees?: {
      users?: string[];
      groups?: string[];
    };
  };
  content?: Record<string, any>;
}

export interface SearchRecordsParams {
  adbid: string;
  teamid: string;
  parentid?: string;
  search: string;
  start?: string;
  limit?: string;
}

export interface DownloadFileParams {
  teamid: string;
  adbid: string;
  adoid: string;
  cellpos: string;
  redirect?: boolean;
  preview?: boolean;
}

export interface DownloadFileResponse {
  url?: string;
  redirect?: boolean;
}

export interface GetUploadUrlParams {
  filename: string;
  teamid: string;
  adbid: string;
  adoid: string;
  filesize: string;
  cellpos?: string;
}

export interface GetUploadUrlResponse {
  url: string;
  [key: string]: any;
}

export interface CompleteUploadParams {
  filesize: string;
  teamid: string;
  adbid: string;
  adoid?: string;
  cellpos?: string;
}

export interface CompleteUploadResponse {
  success: boolean;
  [key: string]: any;
}

export interface AnyDBClientConfig {
  apiKey: string;
  userEmail: string;
  baseURL?: string;
  timeout?: number;
}
