/**
 * AnyDB SDK Client
 * TypeScript client for interacting with AnyDB API
 */

import axios, { AxiosInstance, AxiosResponse } from "axios";
import type {
  ADORecord,
  Team,
  ADB,
  CreateRecordParams,
  UpdateRecordParams,
  RemoveRecordParams,
  CopyRecordParams,
  MoveRecordParams,
  ListRecordsResponse,
  SearchRecordsParams,
  DownloadFileParams,
  DownloadFileResponse,
  GetUploadUrlParams,
  CompleteUploadParams,
  UploadFileContent,
  UploadFileParams,
  CreatePublicShareLinkParams,
  PublicShareLinkResponse,
  CreatePrivateShareLinkParams,
  PrivateShareLinkResponse,
  DeleteShareParams,
  DeleteShareResponse,
  RegisterWebhookParams,
  RegisterWebhookResponse,
  UpdateWebhookParams,
  UpdateWebhookResponse,
  DeleteWebhookResponse,
  SubscribeWebhookParams,
  SubscribeWebhookResponse,
  UnsubscribeWebhookResponse,
  CreateWorkspaceParams,
  CreateWorkspaceResponse,
  WorkspaceResourceParams,
  WorkflowSummary,
  WorkflowDetails,
  GetWorkflowParams,
  WorkflowArtifactCatalogEntry,
  CreateWorkflowParams,
  CreateWorkflowResponse,
  UpdateWorkflowParams,
  UpdateWorkflowResponse,
  CreateViewParams,
  CreateViewResponse,
  UpdateViewParams,
  UpdateViewResponse,
  ViewDefinition,
  GetViewParams,
  DeleteViewParams,
  DeleteViewResponse,
  DiscoverTypesParams,
  DiscoverTypesResponse,
  GetTypeParams,
  GetTypeDefinitionParams,
  TypeDefinitionResponse,
  AnyDBType,
  TypeSummary,
  CreateTypeParams,
  CreateTypeResponse,
  UpdateTypeParams,
  UpdateTypeResponse,
  TeamGroup,
  CreateShareParams,
  CreateShareResponse,
  ShareDefinition,
  GetShareParams,
  RevokeShareParams,
  RevokeShareResponse,
  AnyDBClientConfig,
} from "./types.js";
import {
  NULL_OBJECTID,
  PredefinedTemplateAdoIds,
  PUBLIC_USER_ID,
} from "./types.js";

export class AnyDBClient {
  private client: AxiosInstance;
  private apiKey: string;
  private userEmail: string;
  private debugEnabled: boolean;
  private runtime: "auto" | "node" | "browser";
  private uploadTransport: "auto" | "axios" | "fetch";

  constructor(config: AnyDBClientConfig) {
    this.apiKey = config.apiKey;
    this.userEmail = config.userEmail;
    this.runtime = config.runtime || "auto";
    this.uploadTransport = config.uploadTransport || "auto";
    this.debugEnabled =
      typeof config.debug === "boolean"
        ? config.debug
        : typeof process !== "undefined" &&
          typeof process.env !== "undefined" &&
          Boolean(process.env.DEBUG_ANYDB);

    this.client = axios.create({
      baseURL: config.baseURL || "https://app.anydb.com/api",
      headers: {
        "Content-Type": "application/json",
        "x-anydb-api-key": this.apiKey,
        "x-anydb-email": this.userEmail,
      },
      timeout: config.timeout || 30000,
    });

    // Add request interceptor for logging (optional, can be disabled)
    this.client.interceptors.request.use(
      (config) => {
        const maskedKey = this.apiKey
          ? `${this.apiKey.substring(0, 8)}...${this.apiKey.substring(
              this.apiKey.length - 4,
            )}`
          : "none";
        if (this.debugEnabled) {
          console.log(
            `[AnyDB Request] ${config.method?.toUpperCase()} ${config.baseURL}${
              config.url
            }`,
          );
          console.log(`[AnyDB Request] API Key: ${maskedKey}`);
          console.log(`[AnyDB Request] User Email: ${this.userEmail}`);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Add response interceptor for logging (optional, can be disabled)
    this.client.interceptors.response.use(
      (response) => {
        if (this.debugEnabled) {
          console.log(`[AnyDB Response] Status: ${response.status}`);
        }
        return response;
      },
      (error) => {
        if (error.response) {
          if (this.debugEnabled) {
            console.log(
              `[AnyDB Response Error] Status: ${error.response.status}`,
            );
            console.log(
              `[AnyDB Response Error] Data: ${JSON.stringify(error.response.data)}`,
            );
          }
          const responseError = error.response.data?.error;
          const errorMsg =
            error.response.data?.message ||
            (typeof responseError === "string"
              ? responseError
              : responseError?.message) ||
            `HTTP ${error.response.status}`;
          throw Object.assign(
            new Error(
              `AnyDB API Error (${error.response.status}): ${errorMsg}`,
            ),
            {
              status: error.response.status,
              data: error.response.data,
              retryAfter: error.response.headers?.["retry-after"],
            },
          );
        } else if (error.request) {
          throw new Error("AnyDB API Error: No response received from server");
        } else {
          throw new Error(`AnyDB API Error: ${error.message}`);
        }
      },
    );
  }

  private isNodeRuntime(): boolean {
    if (this.runtime === "node") {
      return true;
    }
    if (this.runtime === "browser") {
      return false;
    }
    return (
      !("window" in globalThis) &&
      typeof process !== "undefined" &&
      typeof process.versions !== "undefined" &&
      Boolean(process.versions.node)
    );
  }

  private resolveUploadTransport(): "axios" | "fetch" {
    if (this.uploadTransport === "axios" || this.uploadTransport === "fetch") {
      return this.uploadTransport;
    }
    if (
      !this.isNodeRuntime() &&
      typeof (globalThis as any).fetch === "function"
    ) {
      return "fetch";
    }
    return "axios";
  }

  private getUploadContentLength(content: UploadFileContent): number {
    if (typeof content === "string") {
      return new TextEncoder().encode(content).length;
    }
    if (content instanceof ArrayBuffer) {
      return content.byteLength;
    }
    return content.byteLength;
  }

  private getResponseMessage(response: AxiosResponse): string {
    return (
      response.data?.message ||
      response.data?.error ||
      JSON.stringify(response.data) ||
      `HTTP ${response.status}`
    );
  }

  private unwrapResponse<T>(
    response: AxiosResponse,
    failureMessage: string,
  ): T {
    if (response.data.status === "success") {
      return response.data.data as T;
    }
    throw new Error(`${failureMessage}: ${this.getResponseMessage(response)}`);
  }

  private normalizeUploadBody(content: UploadFileContent): UploadFileContent {
    if (content instanceof ArrayBuffer) {
      return new Uint8Array(content);
    }
    return content;
  }

  private async readFileFromPath(filepath: string): Promise<Uint8Array> {
    if (!this.isNodeRuntime()) {
      throw new Error(
        "`filepath` uploads are only supported in Node runtime. In browsers, provide `fileContent` (e.g., await file.arrayBuffer()).",
      );
    }

    try {
      const fs = await import("fs");
      return await fs.promises.readFile(filepath);
    } catch (error) {
      throw new Error(
        `Failed to read file from path "${filepath}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  // ============================================================================
  // Record Operations
  // ============================================================================

  /**
   * Get a specific record by teamid, adbid, and adoid
   */
  async getRecord(
    teamid: string,
    adbid: string,
    adoid: string,
  ): Promise<ADORecord> {
    const response = await this.client.get("/integrations/ext/record", {
      params: { teamid, adbid, adoid },
    });
    if (response.data.status === "success") {
      return response.data.data;
    }
    throw new Error(
      `Failed to get record ${adoid}: ${this.getResponseMessage(response)}`,
    );
  }

  /**
   * List all teams the API key provides access to
   */
  async listTeams(): Promise<Team[]> {
    const response = await this.client.get("/integrations/ext/listteams");

    if (response.status === 200 && response.data.status === "success") {
      return response.data.data;
    }
    throw new Error(
      `Failed to list teams: ${this.getResponseMessage(response)}`,
    );
  }

  /**
   * Get all ADBs (databases) for a specific team
   */
  async listDatabasesForTeam(teamid: string): Promise<ADB[]> {
    const response = await this.client.get("/integrations/ext/listdbsforteam", {
      params: { teamid },
    });
    // check if response is 200 and status is "success" and if so, return data
    if (response.status === 200 && response.data.status === "success") {
      return response.data.data;
    }
    throw new Error(
      `Failed to list databases for team ${teamid}: ${this.getResponseMessage(
        response,
      )}`,
    );
  }

  // ============================================================================
  // Workspace, Type, and View Operations
  // ============================================================================

  async createWorkspace(
    params: CreateWorkspaceParams,
  ): Promise<CreateWorkspaceResponse> {
    const response = await this.client.post(
      "/integrations/ext/workspaces",
      params,
    );
    return this.unwrapResponse(response, "Failed to create workspace");
  }

  // ============================================================================
  // Workflow Operations
  // ============================================================================

  async listWorkflows(
    params: WorkspaceResourceParams,
  ): Promise<WorkflowSummary[]> {
    const response = await this.client.get("/integrations/ext/workflows", {
      params,
    });
    return this.unwrapResponse(response, "Failed to list workflows");
  }

  async getWorkflow(params: GetWorkflowParams): Promise<WorkflowDetails> {
    const { workflowId, ...queryParams } = params;
    const response = await this.client.get(
      `/integrations/ext/workflows/${encodeURIComponent(workflowId)}`,
      { params: queryParams },
    );
    return this.unwrapResponse(
      response,
      `Failed to get workflow ${workflowId}`,
    );
  }

  async getWorkflowExecutionHistory(
    params: GetWorkflowParams,
  ): Promise<unknown[]> {
    const { workflowId, ...queryParams } = params;
    const response = await this.client.get(
      `/integrations/ext/workflows/${encodeURIComponent(workflowId)}/execution-history`,
      { params: queryParams },
    );
    return this.unwrapResponse(
      response,
      `Failed to get execution history for workflow ${workflowId}`,
    );
  }

  async listWorkflowTriggers(
    params: WorkspaceResourceParams,
  ): Promise<WorkflowArtifactCatalogEntry[]> {
    const response = await this.client.get(
      "/integrations/ext/workflow-triggers",
      { params },
    );
    return this.unwrapResponse(response, "Failed to list workflow triggers");
  }

  async listWorkflowActions(
    params: WorkspaceResourceParams,
  ): Promise<WorkflowArtifactCatalogEntry[]> {
    const response = await this.client.get(
      "/integrations/ext/workflow-actions",
      { params },
    );
    return this.unwrapResponse(response, "Failed to list workflow actions");
  }

  async createWorkflow(
    params: CreateWorkflowParams,
  ): Promise<CreateWorkflowResponse> {
    const response = await this.client.post(
      "/integrations/ext/workflows",
      params,
    );
    return this.unwrapResponse(response, "Failed to create workflow");
  }

  async updateWorkflow(
    params: UpdateWorkflowParams,
  ): Promise<UpdateWorkflowResponse> {
    const { workflowId, ...requestBody } = params;
    const response = await this.client.put(
      `/integrations/ext/workflows/${encodeURIComponent(workflowId)}`,
      requestBody,
    );
    return this.unwrapResponse(
      response,
      `Failed to update workflow ${workflowId}`,
    );
  }

  async listTypes(params: WorkspaceResourceParams): Promise<TypeSummary[]> {
    const response = await this.client.get("/integrations/ext/templates", {
      params,
    });
    return this.unwrapResponse(response, "Failed to list types");
  }

  async discoverTypes(
    params: DiscoverTypesParams,
  ): Promise<DiscoverTypesResponse> {
    const response = await this.client.get(
      "/integrations/ext/templates/discover",
      { params },
    );
    return this.unwrapResponse(response, "Failed to discover types");
  }

  async getTypeDefinition(
    params: GetTypeDefinitionParams,
  ): Promise<TypeDefinitionResponse> {
    const { typeName, ...queryParams } = params;
    const response = await this.client.get(
      `/integrations/ext/templates/${encodeURIComponent(typeName)}/definition`,
      { params: queryParams },
    );
    return this.unwrapResponse(
      response,
      `Failed to get definition for type ${typeName}`,
    );
  }

  async createType(params: CreateTypeParams): Promise<CreateTypeResponse> {
    const response = await this.client.post(
      "/integrations/ext/templates",
      params,
    );
    return this.unwrapResponse(response, "Failed to create type");
  }

  async updateType(params: UpdateTypeParams): Promise<UpdateTypeResponse> {
    const { typeName, ...requestBody } = params;
    const response = await this.client.put(
      `/integrations/ext/templates/${encodeURIComponent(typeName)}`,
      requestBody,
    );
    return this.unwrapResponse(response, `Failed to update type ${typeName}`);
  }

  async getType(params: GetTypeParams): Promise<AnyDBType> {
    const { typeName, ...queryParams } = params;
    const response = await this.client.get(
      `/integrations/ext/templates/${encodeURIComponent(typeName)}`,
      { params: queryParams },
    );
    return this.unwrapResponse(response, `Failed to get type ${typeName}`);
  }

  async createView(params: CreateViewParams): Promise<CreateViewResponse> {
    const response = await this.client.post("/integrations/ext/views", params);
    return this.unwrapResponse(response, "Failed to create view");
  }

  async updateView(params: UpdateViewParams): Promise<UpdateViewResponse> {
    const { viewId, ...requestBody } = params;
    const response = await this.client.put(
      `/integrations/ext/views/${encodeURIComponent(viewId)}`,
      requestBody,
    );
    return this.unwrapResponse(response, `Failed to update view ${viewId}`);
  }

  async listViews(params: WorkspaceResourceParams): Promise<ViewDefinition[]> {
    const response = await this.client.get("/integrations/ext/views", {
      params,
    });
    return this.unwrapResponse(response, "Failed to list views");
  }

  async getView(params: GetViewParams): Promise<ViewDefinition> {
    const { viewId, ...queryParams } = params;
    const response = await this.client.get(
      `/integrations/ext/views/${encodeURIComponent(viewId)}`,
      { params: queryParams },
    );
    return this.unwrapResponse(response, `Failed to get view ${viewId}`);
  }

  async deleteView(params: DeleteViewParams): Promise<DeleteViewResponse> {
    const { viewId, ...requestBody } = params;
    const response = await this.client.delete(
      `/integrations/ext/views/${encodeURIComponent(viewId)}`,
      { data: requestBody },
    );
    return this.unwrapResponse(response, `Failed to delete view ${viewId}`);
  }

  async listTeamGroups(teamid: string): Promise<TeamGroup[]> {
    const response = await this.client.get("/integrations/ext/team-groups", {
      params: { teamid },
    });
    return this.unwrapResponse(response, "Failed to list team groups");
  }

  /**
   * List all ADOs (records) in a database
   */
  async listRecords(
    teamid: string,
    adbid: string,
    parentid?: string,
    templateid?: string,
    templatename?: string,
    pagesize?: string,
    lastmarker?: string,
  ): Promise<ListRecordsResponse> {
    const params: any = { teamid, adbid };
    if (parentid) {
      params.parentid = parentid;
    }
    if (templateid) {
      params.templateid = templateid;
    }
    if (templatename) {
      params.templatename = templatename;
    }
    if (pagesize) {
      params.pagesize = pagesize;
    }
    if (lastmarker) {
      params.lastmarker = lastmarker;
    }
    const response = await this.client.get("/integrations/ext/list", {
      params,
    });

    //console.log(response.data);
    if (response.data.status === "success") {
      const data = response.data.data;

      // Return full response with pagination metadata
      return {
        items: data.items || data,
        lastmarker: data.lastmarker || data.lastMarker || data.nextCursor,
        hasmore: data.hasmore ?? data.hasMore,
        total: data.total,
      };
    }
    throw new Error(
      `Failed to list records for database ${adbid}: ${this.getResponseMessage(
        response,
      )}`,
    );
  }

  /**
   * Create a new record
   */
  async createRecord(params: CreateRecordParams): Promise<ADORecord> {
    const response = await this.client.post(
      "/integrations/ext/createrecord",
      params,
    );

    if (response.data.status === "success") {
      return response.data.data;
    }
    throw new Error(
      `Failed to create record: ${this.getResponseMessage(response)}`,
    );
  }

  /**
   * Update an existing record
   */
  async updateRecord(params: UpdateRecordParams): Promise<ADORecord> {
    const response = await this.client.put(
      "/integrations/ext/updaterecord",
      params,
    );
    if (response.data.status === "success") {
      return response.data.data;
    }
    throw new Error(
      `Failed to update record: ${this.getResponseMessage(response)}`,
    );
  }

  /**
   * Remove or delete a record
   * @param params.adoid - Record ID to remove
   * @param params.adbid - Database ID
   * @param params.teamid - Team ID
   * @param params.removefromids - Comma-separated parent ADOIDs to remove from, or NULL_OBJECTID to delete completely
   */
  async removeRecord(params: RemoveRecordParams): Promise<boolean> {
    const response = await this.client.delete("/integrations/ext/remove", {
      data: params,
    });
    if (response.data.status === "success") {
      return true;
    }
    throw new Error(
      `Failed to remove record: ${this.getResponseMessage(response)}`,
    );
  }

  /**
   * Copy a record
   * @param params.adoid - Record ID to copy
   * @param params.adbid - Database ID
   * @param params.teamid - Team ID
   * @param params.attachto - Optional ID of another record to attach the copy to
   * @param params.attachmentsmode - How to handle attachments: "noattachments", "link", or "duplicate"
   */
  async copyRecord(params: CopyRecordParams): Promise<ADORecord> {
    const bodyParams: any = {
      adoid: params.adoid,
      adbid: params.adbid,
      teamid: params.teamid,
    };

    if (params.attachto) {
      bodyParams.attachto = params.attachto;
    }
    if (params.attachmentsmode) {
      bodyParams.attachmentsmode = params.attachmentsmode;
    }

    const response = await this.client.post(
      "/integrations/ext/copyrecord",
      bodyParams,
    );

    if (response.data.status === "success") {
      return response.data.data;
    }
    throw new Error(
      `Failed to copy record: ${this.getResponseMessage(response)}`,
    );
  }

  /**
   * Move a record to a new parent
   * Convenience method that uses updateRecord to change the parent
   * @param params.adoid - Source record ID to move
   * @param params.adbid - Database ID
   * @param params.teamid - Team ID
   * @param params.parentid - Target parent record ID to move under
   */
  async moveRecord(params: MoveRecordParams): Promise<ADORecord> {
    return this.updateRecord({
      meta: {
        adoid: params.adoid,
        adbid: params.adbid,
        teamid: params.teamid,
        attach: params.parentid,
      },
    });
  }

  /**
   * Search for records with a keyword
   */
  async searchRecords(params: SearchRecordsParams): Promise<ADORecord[]> {
    const response = await this.client.get("/integrations/ext/search", {
      params,
    });
    if (response.data.status === "success") {
      return response.data.data;
    }
    throw new Error(
      `Failed to search records: ${this.getResponseMessage(response)}`,
    );
  }

  // ============================================================================
  // Semantic Share Operations
  // ============================================================================

  async createShare(params: CreateShareParams): Promise<CreateShareResponse> {
    const target = params.share.target;
    const requestBody =
      target.kind === "form"
        ? {
            ...params,
            share: {
              ...params.share,
              target: {
                kind: "form",
                templateName: target.typeName,
                ...(target.parentRecordId
                  ? { parentRecordId: target.parentRecordId }
                  : {}),
              },
            },
          }
        : params;
    const response = await this.client.post(
      "/integrations/ext/shares",
      requestBody,
    );
    return this.unwrapResponse(response, "Failed to create share");
  }

  async listShares(
    params: WorkspaceResourceParams,
  ): Promise<ShareDefinition[]> {
    const response = await this.client.get("/integrations/ext/shares", {
      params,
    });
    return this.unwrapResponse(response, "Failed to list shares");
  }

  async getShare(params: GetShareParams): Promise<ShareDefinition> {
    const { shareId, ...queryParams } = params;
    const response = await this.client.get(
      `/integrations/ext/shares/${encodeURIComponent(shareId)}`,
      { params: queryParams },
    );
    return this.unwrapResponse(response, `Failed to get share ${shareId}`);
  }

  async revokeShare(params: RevokeShareParams): Promise<RevokeShareResponse> {
    const { shareId, ...requestBody } = params;
    const response = await this.client.delete(
      `/integrations/ext/shares/${encodeURIComponent(shareId)}`,
      { data: requestBody },
    );
    return this.unwrapResponse(response, `Failed to revoke share ${shareId}`);
  }

  /**
   * Create a public share link for a record
   * By default this creates a viewer link without attachments
   */
  async createPublicShareLink(
    params: CreatePublicShareLinkParams,
  ): Promise<PublicShareLinkResponse> {
    const {
      teamid,
      adbid,
      adoid,
      role = "viewer",
      withattachments = false,
      name,
      shareExpiryDate,
    } = params;

    const requestBody: Record<string, unknown> = {
      teamid,
      adbid,
      adoid,
      role,
      withattachments: withattachments ? "true" : "false",
      shared_userids: PUBLIC_USER_ID,
      share_expiry_enable: shareExpiryDate !== undefined,
    };

    if (name) {
      requestBody.name = name;
    }

    if (shareExpiryDate !== undefined) {
      const rawUnixTimestamp =
        shareExpiryDate instanceof Date
          ? shareExpiryDate.getTime()
          : shareExpiryDate;

      requestBody.share_expiry_date =
        rawUnixTimestamp < 1_000_000_000_000
          ? Math.floor(rawUnixTimestamp * 1000).toString()
          : Math.floor(rawUnixTimestamp).toString();
    }

    const response = await this.client.put(
      "/integrations/ext/share",
      requestBody,
    );

    if (response.data.status === "success") {
      const responseData = response.data.data || {};
      const shareid: string | undefined = responseData.shareid;
      const shareToken: string | undefined =
        responseData.shareUrl || responseData.shareurl;

      const configuredBaseUrl = this.client.defaults.baseURL || "";
      const serverBaseUrl = configuredBaseUrl.replace(/\/api\/?$/, "");

      if (!shareid || !shareToken) {
        throw new Error(
          "Failed to create public share link: Missing shareid or shareUrl in response",
        );
      }

      return {
        shareid,
        url: `${serverBaseUrl}/s/${shareToken}`,
      };
    }
    throw new Error(
      `Failed to create public share link: ${this.getResponseMessage(response)}`,
    );
  }

  /**
   * Create a private share link for one or more users
   */
  async createPrivateShareLink(
    params: CreatePrivateShareLinkParams,
  ): Promise<PrivateShareLinkResponse> {
    const {
      teamid,
      adbid,
      adoid,
      userIds,
      groupIds,
      role = "viewer",
      withattachments = false,
      name,
      shareExpiryDate,
    } = params;

    const normalizedUserIds = Array.isArray(userIds) ? userIds : [userIds];
    if (normalizedUserIds.length === 0) {
      throw new Error("createPrivateShareLink requires at least one user ID");
    }
    const normalizedGroupIds = groupIds
      ? Array.isArray(groupIds)
        ? groupIds
        : [groupIds]
      : [];

    const requestBody: Record<string, unknown> = {
      teamid,
      adbid,
      adoid,
      role,
      withattachments: withattachments ? "true" : "false",
      shared_userids: normalizedUserIds.join(","),
      share_expiry_enable: shareExpiryDate !== undefined,
    };

    if (normalizedGroupIds.length > 0) {
      requestBody.shared_groupids = normalizedGroupIds.join(",");
    }

    if (name) {
      requestBody.name = name;
    }

    if (shareExpiryDate !== undefined) {
      const rawUnixTimestamp =
        shareExpiryDate instanceof Date
          ? shareExpiryDate.getTime()
          : shareExpiryDate;

      requestBody.share_expiry_date =
        rawUnixTimestamp < 1_000_000_000_000
          ? Math.floor(rawUnixTimestamp * 1000).toString()
          : Math.floor(rawUnixTimestamp).toString();
    }

    const response = await this.client.put(
      "/integrations/ext/share",
      requestBody,
    );

    if (response.data.status === "success") {
      return response.data.data;
    }
    throw new Error(
      `Failed to create private share link: ${this.getResponseMessage(
        response,
      )}`,
    );
  }

  /**
   * Delete a share by share ID
   * Uses fixed sharetype "item"
   */
  async deleteShare(params: DeleteShareParams): Promise<DeleteShareResponse> {
    const response = await this.client.delete(
      `/integrations/ext/share/${params.shareid}`,
      {
        params: {
          teamid: params.teamid,
          sharetype: "item",
        },
      },
    );

    if (response.data.status === "success") {
      return response.data.data;
    }
    throw new Error(
      `Failed to delete share ${params.shareid}: ${this.getResponseMessage(
        response,
      )}`,
    );
  }

  // ============================================================================
  // Webhook Operations
  // ============================================================================

  /**
   * Register a new webhook for a team
   * Returns webhook metadata and a one-time secret
   */
  async registerWebhook(
    params: RegisterWebhookParams,
  ): Promise<RegisterWebhookResponse> {
    const response = await this.client.post(
      "/integrations/ext/register",
      params,
    );

    if (response.data.status === "success") {
      return response.data.data;
    }
    throw new Error(
      `Failed to register webhook: ${this.getResponseMessage(response)}`,
    );
  }

  /**
   * Update an existing webhook
   */
  async updateWebhook(
    params: UpdateWebhookParams,
  ): Promise<UpdateWebhookResponse> {
    const { webhookId, ...updateBody } = params;
    const response = await this.client.put(
      `/integrations/ext/${webhookId}`,
      updateBody,
    );

    if (response.data.status === "success") {
      return response.data.data;
    }
    throw new Error(
      `Failed to update webhook ${webhookId}: ${this.getResponseMessage(
        response,
      )}`,
    );
  }

  /**
   * Delete a webhook by ID
   */
  async deleteWebhook(webhookId: string): Promise<DeleteWebhookResponse> {
    const response = await this.client.delete(`/integrations/ext/${webhookId}`);

    if (response.data.status === "success") {
      return response.data.data;
    }
    throw new Error(
      `Failed to delete webhook ${webhookId}: ${this.getResponseMessage(
        response,
      )}`,
    );
  }

  /**
   * Subscribe a webhook to a record event
   */
  async subscribeWebhook(
    params: SubscribeWebhookParams,
  ): Promise<SubscribeWebhookResponse> {
    const response = await this.client.post(
      "/integrations/ext/subscribe",
      params,
    );

    if (response.data.status === "success") {
      return response.data.data;
    }
    throw new Error(
      `Failed to subscribe webhook ${
        params.webhookId
      }: ${this.getResponseMessage(response)}`,
    );
  }

  /**
   * Unsubscribe a webhook from a record event
   */
  async unsubscribeWebhook(
    params: SubscribeWebhookParams,
  ): Promise<UnsubscribeWebhookResponse> {
    const response = await this.client.delete("/integrations/ext/unsubscribe", {
      data: params,
    });

    if (response.data.status === "success") {
      return response.data.data;
    }
    throw new Error(
      `Failed to unsubscribe webhook ${
        params.webhookId
      }: ${this.getResponseMessage(response)}`,
    );
  }

  // ============================================================================
  // File Operations
  // ============================================================================

  /**
   * Download a file or get download URL from a record cell
   * If redirect is true, returns URL for direct download
   * If redirect is false, returns the file URL in response
   */
  async downloadFile(
    params: DownloadFileParams,
  ): Promise<DownloadFileResponse> {
    const queryParams: any = {
      teamid: params.teamid,
      adbid: params.adbid,
      adoid: params.adoid,
      cellpos: params.cellpos,
    };

    if (params.redirect !== undefined) {
      queryParams.redirect = params.redirect ? "1" : "0";
    }
    if (params.preview !== undefined) {
      queryParams.preview = params.preview ? "1" : "0";
    }

    const response = await this.client.get("/integrations/ext/download", {
      params: queryParams,
      maxRedirects: 0, // Don't follow redirects automatically
      validateStatus: (status) =>
        (status >= 200 && status < 300) || status === 302,
    });

    // If it's a redirect response, return the Location header.
    if (response.status === 302) {
      const url = response.headers.location;
      if (!url) {
        throw new Error(
          "Failed to download file: redirect response did not contain a URL",
        );
      }
      return {
        url,
        redirect: true,
      };
    }

    const body = response.data;
    let url: unknown;
    let redirect = false;

    // AnyDB API responses normally use { status, data }. Keep accepting the
    // older direct response shapes so existing API deployments remain usable.
    if (body?.status !== undefined) {
      if (body.status !== "success") {
        throw new Error(
          `Failed to download file: ${this.getResponseMessage(response)}`,
        );
      }

      const payload = body.data;
      url = typeof payload === "string" ? payload : payload?.url;
      redirect = Boolean(payload?.redirect);
    } else {
      url = typeof body === "string" ? body : body?.url;
      redirect = Boolean(body?.redirect);
    }

    if (typeof url !== "string" || url.length === 0) {
      throw new Error(
        "Failed to download file: success response did not contain a URL",
      );
    }

    return { url, redirect };
  }

  /**
   * Step 1: Get upload URL from AnyDB service
   * Request a pre-signed URL to upload a file
   */
  async getUploadUrl(params: GetUploadUrlParams): Promise<string> {
    const response = await this.client.get("/integrations/ext/getuploadurl", {
      params: {
        filename: params.filename,
        teamid: params.teamid,
        adbid: params.adbid,
        adoid: params.adoid,
        filesize: params.filesize,
        cellpos: params.cellpos,
      },
    });
    if (response.data.status !== "success") {
      throw new Error(
        `Failed to get upload URL: ${this.getResponseMessage(response)}`,
      );
    }
    return response.data.data.url;
  }

  /**
   * Step 2: Upload file content to the provided URL
   * This is typically a direct upload to cloud storage (e.g., S3)
   */
  async uploadFileToUrl(
    uploadUrl: string,
    fileContent: UploadFileContent,
    contentType?: string,
  ): Promise<void> {
    const body = this.normalizeUploadBody(fileContent);
    const transport = this.resolveUploadTransport();

    if (transport === "fetch") {
      const fetchFn = (globalThis as any).fetch;
      if (typeof fetchFn !== "function") {
        throw new Error(
          'Fetch upload transport is not available in this runtime. Use `uploadTransport: "axios"`.',
        );
      }

      const response = await fetchFn(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": contentType || "application/octet-stream",
        },
        body: body as any,
      });

      if (!response.ok) {
        throw new Error(
          `Failed to upload file content to URL: ${response.status} ${response.statusText}`,
        );
      }
      return;
    }

    await axios.put(uploadUrl, body, {
      headers: {
        "Content-Type": contentType || "application/octet-stream",
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
  }

  /**
   * Step 3: Complete the upload process
   * Notify AnyDB service that the file has been uploaded
   */
  async completeUpload(params: CompleteUploadParams): Promise<boolean> {
    const response = await this.client.put("/integrations/ext/completeupload", {
      filesize: params.filesize,
      teamid: params.teamid,
      adbid: params.adbid,
      adoid: params.adoid,
      cellpos: params.cellpos,
    });
    if (response.data.status !== "success") {
      throw new Error(
        `Failed to complete upload: ${this.getResponseMessage(response)}`,
      );
    }
    return true;
  }

  // ============================================================================
  // Convenience Methods
  // ============================================================================

  /**
   * Complete file upload workflow (4 steps in one)
   * Supports both file path and direct file content
   * Automatically handles multipart upload for the file data
   *
   * @param params - Upload parameters
   * @param params.filename - Name of the file
   * @param params.filepath - Path to the file (mutually exclusive with fileContent)
   * @param params.fileContent - File content as Buffer or string (mutually exclusive with filepath)
   * @param params.teamid - Team ID
   * @param params.adbid - Database ID
   * @param params.adoid - Parent record ID (file will be attached as child)
   * @param params.cellpos - Cell position (default: "A1")
   * @param params.contentType - MIME type (optional)
   * @returns Promise resolving to adoid of the created file record
   */
  async uploadFile(params: UploadFileParams): Promise<string> {
    const {
      filename,
      filepath,
      fileContent,
      teamid,
      adbid,
      adoid,
      cellpos = "A1",
      contentType,
    } = params;

    // Validate input: must provide either filepath or fileContent
    if (!filepath && !fileContent) {
      throw new Error("Either filepath or fileContent must be provided");
    }
    if (filepath && fileContent) {
      throw new Error(
        "Cannot provide both filepath and fileContent. Choose one.",
      );
    }

    // Read file content if filepath is provided
    let file: UploadFileContent;
    if (filepath) {
      file = await this.readFileFromPath(filepath);
    } else {
      file = fileContent!;
    }

    const filesize = this.getUploadContentLength(file).toString();

    // Step 1: Create a new record as a child of the provided adoid using FILE_TEMPLATE
    const fileRecord = await this.createRecord({
      teamid,
      adbid,
      name: filename,
      attach: adoid,
      template: PredefinedTemplateAdoIds.FILE_TEMPLATE_ADOID,
    });
    //console.log(fileRecord);

    // Use the newly created file record's adoid for subsequent operations
    const fileAdoid = fileRecord.meta.adoid;

    try {
      // Step 2: Get upload URL for the new file record
      const url = await this.getUploadUrl({
        filename,
        teamid,
        adbid,
        adoid: fileAdoid,
        filesize,
        cellpos,
      });

      // Step 3: Upload file using multipart upload to the URL
      await this.uploadFileToUrl(url, file, contentType);

      // Step 4: Complete upload for the new file record
      await this.completeUpload({
        filesize,
        teamid,
        adbid,
        adoid: fileAdoid,
        cellpos,
      });

      return fileAdoid;
    } catch (uploadError) {
      try {
        await this.removeRecord({
          adoid: fileAdoid,
          adbid,
          teamid,
          removefromids: NULL_OBJECTID,
        });
      } catch (cleanupError) {
        const uploadMessage = uploadError instanceof Error ? uploadError.message : String(uploadError);
        const cleanupMessage = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
        throw new Error(
          `${uploadMessage}; cleanup of incomplete file record ${fileAdoid} failed: ${cleanupMessage}`,
        );
      }
      throw uploadError;
    }
  }
}
