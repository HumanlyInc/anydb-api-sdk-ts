/**
 * AnyDB SDK Client
 * TypeScript client for interacting with AnyDB API
 */

import axios, { AxiosInstance } from "axios";
import { promises as fs } from "fs";
import type {
  ADORecord,
  Team,
  ADB,
  CreateRecordParams,
  UpdateRecordParams,
  RemoveRecordParams,
  ListRecordsResponse,
  SearchRecordsParams,
  DownloadFileParams,
  DownloadFileResponse,
  GetUploadUrlParams,
  CompleteUploadParams,
  AnyDBClientConfig,
} from "./types.js";
import { PredefinedTemplateAdoIds } from "./types.js";

export class AnyDBClient {
  private client: AxiosInstance;
  private apiKey: string;
  private userEmail: string;

  constructor(config: AnyDBClientConfig) {
    this.apiKey = config.apiKey;
    this.userEmail = config.userEmail;

    this.client = axios.create({
      baseURL: config.baseURL || "http://app.anydb.com/api",
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
        if (process.env.DEBUG_ANYDB) {
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
        if (process.env.DEBUG_ANYDB) {
          console.log(
            `[AnyDB Response] Status: ${response.status} ${response.message}`,
          );
        }
        return response;
      },
      (error) => {
        if (error.response) {
          const errorMsg =
            error.response.data?.message ||
            error.response.data?.error ||
            error.response.statusText;
          throw new Error(
            `AnyDB API Error (${error.response.status}): ${errorMsg}`,
          );
        } else if (error.request) {
          throw new Error("AnyDB API Error: No response received from server");
        } else {
          throw new Error(`AnyDB API Error: ${error.message}`);
        }
      },
    );
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
    throw new Error(`Failed to get record ${adoid}: ${response.message}`);
  }

  /**
   * List all teams the API key provides access to
   */
  async listTeams(): Promise<Team[]> {
    const response = await this.client.get("/integrations/ext/listteams");

    if (response.status === 200 && response.data.status === "success") {
      return response.data.data;
    }
    throw new Error(`Failed to list teams: ${response.message}`);
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
      `Failed to list databases for team ${teamid}: ${response.message}`,
    );
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
      // Return full response with pagination metadata
      return {
        items: response.data.data.items || response.data.data,
        lastmarker: response.data.data.lastmarker,
        hasmore: response.data.data.hasmore,
        total: response.data.data.total,
      };
    }
    throw new Error(
      `Failed to list records for database ${adbid}: ${response.message}`,
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
    throw new Error(`Failed to create record: ${response.message}`);
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
    throw new Error(`Failed to update record: ${response.message}`);
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
    console.log("Response = ", response.data);
    if (response.data.status === "success") {
      return true;
    }
    throw new Error(`Failed to remove record: ${response.message}`);
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
    throw new Error(`Failed to search records: ${response.message}`);
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
      validateStatus: (status) => status >= 200 && status < 400, // Accept 302
    });
    console.log(response.data);

    // If it's a redirect response, return the Location header
    if (response.status === 302 && response.headers.location) {
      return {
        url: response.headers.location,
        redirect: true,
      };
    }

    // Otherwise return the URL from response data
    return response.data;
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
      throw new Error(`Failed to get upload URL: ${response.message}`);
    }
    return response.data.data.url;
  }

  /**
   * Step 2: Upload file content to the provided URL
   * This is typically a direct upload to cloud storage (e.g., S3)
   */
  async uploadFileToUrl(
    uploadUrl: string,
    fileContent: Buffer | string,
    contentType?: string,
  ): Promise<void> {
    await axios.put(uploadUrl, fileContent, {
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
      throw new Error(`Failed to complete upload: ${response.message}`);
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
  async uploadFile(params: {
    filename: string;
    filepath?: string;
    fileContent?: Buffer | string;
    teamid: string;
    adbid: string;
    adoid: string;
    cellpos?: string;
    contentType?: string;
  }): Promise<string> {
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
    let file: Buffer;
    if (filepath) {
      try {
        file = await fs.readFile(filepath);
      } catch (error) {
        throw new Error(
          `Failed to read file from path "${filepath}": ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    } else {
      // Convert fileContent to Buffer if it's a string
      file = Buffer.isBuffer(fileContent)
        ? fileContent
        : Buffer.from(fileContent!);
    }

    const filesize = file.length.toString();

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

    // Step 2: Get upload URL for the new file record
    const url = await this.getUploadUrl({
      filename,
      teamid,
      adbid,
      adoid: fileAdoid,
      filesize,
      cellpos,
    });
    //console.log(url);

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

    return fileRecord.meta.adoid;
  }
}
