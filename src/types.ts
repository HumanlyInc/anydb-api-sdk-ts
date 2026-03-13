/**
 * Type definitions for AnyDB SDK
 */

// Special Object IDs
export const NULL_OBJECTID = "000000000000000000000000";
export const PUBLIC_USER_ID = "777788881111111111111000";

// Predefined Template IDs
export enum PredefinedTemplateAdoIds {
  FILE_TEMPLATE_ADOID = "222222222222222222222222",
  FOLDER_TEMPLATE_ADOID = "333333333333333333333333",
  PAGE_TEMPLATE_ADOID = "444444444444444444444444",
  LINK_TEMPLATE_ADOID = "555555555555555555555555",
  VIEW_TEMPLATE_ADOID = "666666666666666666666666",
}

// Cell Value Types
export enum ADOCellValueType {
  STRING = "string", // general type, that can hold any type and is mutable
  NUMBER = "number", // only numbers
  BOOLEAN = "boolean", // true/false
  ARRAY = "array", // multiple items
  VOID = "void", // indicates that the cell has been cleared
  FILE = "file", // value is JSON string with file specific data
  OBJECT = "object", // value is JSON string with object specific data
  REF = "ref",
  USER = "user",
}

// Cell Format Types
export enum ADOCellFormat {
  GENERAL = "general",
  NUMBER = "number",
  CURRENCY = "currency",
  PERCENTAGE = "percentage",
  DATE = "date",
  DATETIME = "datetime",
  TIME = "time",
  REF = "ref",
  SIGNATURE = "signature",
  FILE = "file",
  CHECKBOX = "checkbox",
  USER = "user",
  SELECT = "select",
  RICH_TEXT = "rich-text",
  ATTACHMENTS = "attachments",
}

// Cell structure in record content
export interface ADOCell {
  pos: string;
  key?: string;
  type?: ADOCellValueType;
  format?: ADOCellFormat;
  value: any;
  colspan?: number;
  rowspan?: number;
  props?: Record<string, any>;
  expr?: string;
  msg?: string | null;
}

// Partial cell for updates (only requires pos and value at minimum)
export interface ADOCellUpdate {
  pos: string;
  value: any;
  key?: string;
  type?: ADOCellValueType;
  format?: ADOCellFormat;
  colspan?: number;
  rowspan?: number;
  props?: Record<string, any>;
  expr?: string;
  msg?: string | null;
}

// Content is a map of cell positions to cell data
export type ADOContent = Record<string, ADOCell>;

// AnyDB Record Types
export interface ADORecord {
  meta: {
    adoid: string;
    adbid: string;
    teamid: string;

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
  content?: ADOContent;
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
  content?: ADOContent | Record<string, ADOCellUpdate>;
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
    attach?: string;
    assignees?: {
      users?: string[];
      groups?: string[];
    };
  };
  content?: ADOContent | Record<string, ADOCellUpdate>;
}

export interface RemoveRecordParams {
  adoid: string;
  adbid: string;
  teamid: string;
  removefromids: string; // Comma-separated parent ADOIDs, or NULL_OBJECTID to delete
}

export interface CopyRecordParams {
  adoid: string;
  adbid: string;
  teamid: string;
  attachto?: string; // ID of another record to attach the copy to
  attachmentsmode?: "noattachments" | "link" | "duplicate"; // How to handle attachments
}

export interface MoveRecordParams {
  adoid: string; // Source record to move
  adbid: string;
  teamid: string;
  parentid: string; // Target record to move under
}

export interface ListRecordsResponse {
  items: ADORecord["meta"][];
  lastmarker?: string;
  hasmore?: boolean;
  total?: number;
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

export interface CreatePublicShareLinkParams {
  teamid: string;
  adbid: string;
  adoid: string;
  role?: "viewer" | "editor";
  withattachments?: boolean;
  name?: string;
  shareExpiryDate?: Date | number;
}

export interface PublicShareLinkResponse {
  shareid: string;
  url: string;
}

export interface CreatePrivateShareLinkParams {
  teamid: string;
  adbid: string;
  adoid: string;
  userIds: string[] | string;
  groupIds?: string[] | string;
  role?: "viewer" | "editor";
  withattachments?: boolean;
  name?: string;
  shareExpiryDate?: Date | number;
}

export interface PrivateShareLinkResponse {
  [key: string]: any;
}

export interface DeleteShareParams {
  shareid: string;
  teamid: string;
}

export interface DeleteShareResponse {
  [key: string]: any;
}

export interface AnyDBClientConfig {
  apiKey: string;
  userEmail: string;
  baseURL?: string;
  timeout?: number;
}
