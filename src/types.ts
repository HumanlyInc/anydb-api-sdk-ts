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
  COMMENTS = "comments",
  AI = "ai",
  BARCODE = "barcode",
  QRCODE = "qrcode",
  CHART = "chart",
  REPORT = "report",
  LOOKUP = "lookup",
  BUTTON = "button",
  TIMELINE = "timeline",
  USERS = "users",
  DYNAMIC = "dynamic",
  HEADING = "heading",
  MULTI_SELECT = "multi-select",
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
  display?: string;
  comments?: Record<string, any>;
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
  display?: string;
  comments?: Record<string, any>;
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
  templatename?: string;
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

export type UploadFileContent = string | ArrayBuffer | Uint8Array;

export interface UploadFileParams {
  filename: string;
  filepath?: string;
  fileContent?: UploadFileContent;
  teamid: string;
  adbid: string;
  adoid: string;
  cellpos?: string;
  contentType?: string;
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

export type WebhookEventType =
  | "RECORD_CREATE"
  | "RECORD_UPDATE"
  | "RECORD_DELETE";

export type WebhookEventInput = WebhookEventType | "RECORD_CRAETE";

export interface WebhookRetryPolicy {
  maxRetries: number;
  backoffMs: number;
}

export type WebhookStatus = "active" | "disabled" | "suspended";

export interface WebhookDefinition {
  webhookId: string;
  teamid: string;
  registeredBy: string;
  name: string;
  description?: string;
  url: string;
  customHeaders?: Record<string, string>;
  status: WebhookStatus;
  failureCount: number;
  lastFailureReason?: string;
  lastFailureAt?: string;
  lastSuccessAt?: string;
  totalCalls: number;
  successfulCalls: number;
  timeout: number;
  retryPolicy: WebhookRetryPolicy;
  created: string;
  updated?: string;
}

export interface RegisterWebhookParams {
  teamid: string;
  url: string;
  name: string;
  description?: string;
  timeout?: number;
  maxRetries?: number;
  backoffMs?: number;
  customHeaders?: Record<string, string>;
}

export interface RegisterWebhookResponse {
  webhook: WebhookDefinition;
  secret: string;
}

export interface UpdateWebhookParams {
  webhookId: string;
  name?: string;
  description?: string;
  url?: string;
  timeout?: number;
  customHeaders?: Record<string, string>;
}

export interface UpdateWebhookResponse {
  webhook: WebhookDefinition;
}

export interface DeleteWebhookResponse {
  success: boolean;
}

export interface SubscribeWebhookParams {
  webhookId: string;
  event: WebhookEventInput;
}

export interface SubscribeWebhookResponse {
  webhookId: string;
  teamid: string;
  event: WebhookEventType;
  subscribed: true;
}

export interface UnsubscribeWebhookResponse {
  webhookId: string;
  teamid: string;
  event: WebhookEventType;
  unsubscribed: true;
}

export interface CreateWorkspaceParams {
  teamid: string;
  name: string;
  clientRequestId: string;
}

export interface CreateWorkspaceResponse {
  success: true;
  operation: "create_workspace";
  requestId: string;
  result: { adbid: string; teamid: string; name: string };
}

export interface WorkspaceResourceParams {
  teamid: string;
  adbid: string;
}

export interface WorkflowTriggerDefinition {
  id: string;
  type: string;
  description?: string;
  config: Record<string, unknown>;
  nextActionId: string | null;
}

export interface WorkflowActionDefinition {
  id: string;
  type: string;
  description?: string;
  config: Record<string, unknown>;
  nextActionIds: string[];
}

export interface WorkflowSummary {
  workflowId: string;
  name: string;
  description?: string;
  enabled: boolean;
  createdAt: number;
  updatedAt?: number;
  trigger: WorkflowTriggerDefinition | null;
  actions: WorkflowActionDefinition[];
}

export interface WorkflowDetails extends WorkflowSummary {
  executionHistory: unknown[];
}

export interface GetWorkflowParams extends WorkspaceResourceParams {
  workflowId: string;
}

export interface WorkflowArtifactCatalogEntry {
  type: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  creatableViaAnydbCreateWorkflow: boolean;
  availableForCurrentTeam?: boolean;
  unavailableReason?: string;
  supportedTriggers?: string[];
  guidance?: Record<string, unknown>;
}

export type WorkflowTriggerType =
  | "trigger_on_form_submit"
  | "trigger_on_record_create"
  | "trigger_on_record_update"
  | "trigger_on_schedule"
  | "trigger_manual";

export interface WorkflowTriggerConfig {
  formName?: string;
  templateName?: string;
  fieldNames?: string[];
  parentRecordId?: string;
  filter?: string;
  interval?: string;
  specificTime?: string;
  daysOfWeek?: string;
  daysOfMonth?: string;
  startTime?: string;
  endTime?: string;
  [key: string]: unknown;
}

export interface WorkflowActionInput {
  key: string;
  type: string;
  description?: string;
  config: Record<string, unknown>;
}

export interface CreateWorkflowParams extends WorkspaceResourceParams {
  clientRequestId: string;
  validateOnly?: boolean;
  workflow: {
    name: string;
    description?: string;
    enabled?: boolean;
    trigger: { type: WorkflowTriggerType; config: WorkflowTriggerConfig };
    actions?: WorkflowActionInput[];
    script?: { source: string; timeoutMs?: number };
  };
}

export interface CreateWorkflowResponse {
  success: true;
  operation: "create_workflow";
  requestId: string;
  result: {
    workflowId?: string;
    name: string;
    enabled: boolean;
    persisted: boolean;
  };
  graph: {
    triggerType: string;
    triggerId?: string;
    actions: Array<{
      key: string;
      type: string;
      actionId?: string;
    }>;
    actionType?: "action_script";
    actionId?: string;
    recordIdBinding?: string;
  };
  warnings: string[];
  validation: { valid: true; errors: [] };
}

export interface UpdateWorkflowParams extends GetWorkflowParams {
  clientRequestId: string;
  changes: { name?: string; description?: string; enabled?: boolean };
}

export interface UpdateWorkflowResponse {
  success: true;
  operation: "update_workflow";
  requestId: string;
  result: {
    workflowId: string;
    name: string;
    description: string;
    enabled: boolean;
  };
}

export type ViewFilterSource = "cell" | "meta" | "badge";
export type ViewFilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "like"
  | "contains"
  | "startswith"
  | "endswith"
  | "includes"
  | "notincludes";
export type ViewFilterFieldType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "array";

export interface ViewFilter {
  source: ViewFilterSource;
  field: string;
  operator: ViewFilterOperator;
  value: string | number | boolean;
  fieldType?: ViewFilterFieldType;
}

export interface ViewTarget {
  typeName: string;
  filters?: ViewFilter[];
}

export interface CreateViewParams {
  teamid: string;
  adbid: string;
  clientRequestId: string;
  validateOnly?: boolean;
  view: {
    name: string;
    scope: "workspace" | "children";
    parentRecordId?: string;
    targets: ViewTarget[];
  };
}

export interface CreateViewResponse {
  success: true;
  operation: "create_view";
  requestId: string;
  result: {
    viewId?: string;
    name: string;
    scope: "workspace" | "children";
    parentRecordId: string;
    targetTypes: string[];
    persisted: boolean;
  };
  validation: { valid: true; errors: [] };
}

export interface UpdateViewParams {
  viewId: string;
  teamid: string;
  adbid: string;
  clientRequestId: string;
  validateOnly?: boolean;
  changes: { name?: string; targets?: ViewTarget[] };
}

export interface UpdateViewResponse {
  success: true;
  operation: "update_view";
  requestId: string;
  result: {
    viewId: string;
    name: string;
    targetTypes?: string[];
    persisted: boolean;
  };
  validation: { valid: true; errors: [] };
}

export interface ViewDefinition {
  viewId: string;
  name: string;
  scope: "workspace" | "children";
  parentRecordId: string;
  targets: Array<ViewTarget & { templateId: string; filters: ViewFilter[] }>;
}

export interface GetViewParams extends WorkspaceResourceParams {
  viewId: string;
}

export interface DeleteViewParams {
  viewId: string;
  teamid: string;
  adbid: string;
  clientRequestId: string;
}

export interface DeleteViewResponse {
  success: true;
  operation: "delete_view";
  requestId: string;
  result: { viewId: string; deleted: true };
}

export type TypeDiscoverySource = "workspace" | "builtin" | "all";

export interface TypeDiscoveryCandidate {
  source: "workspace" | "builtin";
  templateId: string;
  name: string;
  description: string;
  icon: string;
  version?: number;
  fieldCount: number;
  previewImageUrl?: string;
}

export interface DiscoverTypesParams {
  teamid: string;
  adbid: string;
  search: string;
  source?: TypeDiscoverySource;
  limit?: number;
}

export interface DiscoverTypesResponse {
  search: string;
  sources: {
    workspace?: {
      status: "ok" | "unavailable";
      candidates: TypeDiscoveryCandidate[];
    };
    builtin?: {
      status: "ok" | "unavailable";
      candidates: TypeDiscoveryCandidate[];
      categories?: string[];
    };
  };
  candidates: TypeDiscoveryCandidate[];
}

export interface TypeDefinitionResponse {
  source: "workspace" | "builtin";
  templateName: string;
  templateId?: string;
  status: "ok" | "not_found_or_unavailable";
  definition?: ADORecord;
}

export interface GetTypeParams extends WorkspaceResourceParams {
  typeName: string;
}

export interface GetTypeDefinitionParams extends GetTypeParams {
  source: "workspace" | "builtin";
}

export type AnyDBType = ADORecord;

export interface TypeSummary {
  adoid: string;
  adbid: string;
  teamid: string;
  name: string;
  description?: string;
  icon?: string;
  version?: number;
  type: "TEMPLATE";
  [key: string]: any;
}

export interface SemanticTypeField {
  key: string;
  description?: string;
  valueType:
    | "string"
    | "number"
    | "boolean"
    | "array"
    | "void"
    | "file"
    | "object"
    | "ref"
    | "user";
  format: string;
  formula?: string;
  targetType?: string;
  lookup?: {
    fromField: string;
    targetField: string;
    mode?: "snapshot" | "live";
  };
  options?: string[];
  required?: boolean;
  locked?: boolean;
  layout: { position: string; colspan: number; rowspan: number };
}

export interface SemanticTypeDefinition {
  name: string;
  description?: string;
  icon?: string;
  titleFormula?: string;
  fields: SemanticTypeField[];
  badges?: Array<{ name: string; formula: string }>;
  childPolicy?: {
    allowOnly: string[];
    autoCreate: Array<{ typeName: string; minimum: number }>;
  };
}

interface CreateTypeParamsBase {
  teamid: string;
  adbid: string;
  clientRequestId: string;
  validateOnly?: boolean;
}

export type CreateTypeParams = CreateTypeParamsBase &
  (
    | { mode: "define"; type: SemanticTypeDefinition }
    | { mode: "import_builtin"; builtInTemplateName: string }
  );

export interface CreateTypeResponse {
  success: true;
  operation: "create_type";
  requestId: string;
  result: {
    templateId?: string;
    sourceTemplateId?: string;
    name: string;
    revision?: string;
    persisted: boolean;
  };
  warnings: string[];
  validation: { valid: true; errors: [] };
}

export interface UpdateTypeParams {
  typeName: string;
  teamid: string;
  adbid: string;
  clientRequestId: string;
  expectedRevision: string;
  validateOnly?: boolean;
  changes: {
    description?: string;
    addFields?: SemanticTypeField[];
    updateFields?: Array<
      Partial<SemanticTypeField> & { key: string; newKey?: string }
    >;
    removeFields?: string[];
    replaceBadges?: Array<{ name: string; formula: string }> | null;
    replaceChildPolicy?: SemanticTypeDefinition["childPolicy"] | null;
  };
  confirmDataLoss: boolean;
}

export interface UpdateTypeResponse {
  success: true;
  operation: "update_type";
  requestId: string;
  result: {
    name: string;
    previousTemplateId: string;
    templateId?: string;
    previousRevision: string;
    revision: string;
    persisted: boolean;
  };
  impact: { affectedFields: string[]; destructive: boolean };
  migration: {
    status: "not_started" | "queued" | "completed" | "enqueue_failed";
    jobId?: number;
  };
  warnings: string[];
  validation: { valid: true; errors: [] };
}

export interface TeamGroup {
  groupId: string;
  name: string;
  memberCount: number;
  builtIn: boolean;
}

export interface ShareRecipients {
  emails?: string[];
  groupNames?: string[];
}

export type SemanticShareTarget =
  | { kind: "record"; recordId: string }
  | { kind: "form"; typeName: string; parentRecordId?: string };

export interface CreateShareParams {
  teamid: string;
  adbid: string;
  clientRequestId: string;
  validateOnly?: boolean;
  share: {
    name?: string;
    privacy: "public" | "private";
    target: SemanticShareTarget;
    recipients?: ShareRecipients;
    role?: "viewer" | "editor";
    withAttachments?: boolean;
  };
}

export interface CreateShareResponse {
  success: true;
  operation: "create_share";
  requestId: string;
  result: {
    shareId?: string;
    shareToken?: string;
    publicUrl?: string;
    targetKind: "record" | "form";
    privacy: "public" | "private";
    name: string;
    parentRecordId?: string;
    templateName?: string;
    recipientEmails: string[];
    recipientGroups: string[];
    persisted: boolean;
  };
  validation: { valid: true; errors: [] };
}

export interface ShareDefinition {
  shareId: string;
  kind: "record" | "form";
  privacy: "public" | "private";
  name: string;
  target:
    | { kind: "record"; recordId: string; recordName: string }
    | {
        kind: "form";
        templateName: string;
        parentRecordId: string;
        parentRecordName: string;
      };
  recipientUserCount: number;
  recipientGroupNames: string[];
  createdOn: string;
  publicUrl?: string;
}

export interface GetShareParams {
  shareId: string;
  teamid: string;
  adbid: string;
  kind: "record" | "form";
}

export interface RevokeShareParams extends GetShareParams {
  clientRequestId: string;
}

export interface RevokeShareResponse {
  success: true;
  operation: "revoke_share";
  requestId: string;
  result: { shareId: string; kind: "record" | "form"; revoked: true };
}

export interface AnyDBClientConfig {
  apiKey: string;
  userEmail: string;
  baseURL?: string;
  timeout?: number;
  debug?: boolean;
  runtime?: "auto" | "node" | "browser";
  uploadTransport?: "auto" | "axios" | "fetch";
}
