/**
 * Jest tests for AnyDB SDK Client
 */

import axios from "axios";
import { promises as fs } from "fs";
import { AnyDBClient } from "../client";
import type {
  ADORecord,
  Team,
  ADB,
  CreateRecordParams,
  UpdateRecordParams,
  SearchRecordsParams,
  DownloadFileParams,
  GetUploadUrlParams,
  CompleteUploadParams,
} from "../types";

// Mock axios and fs
jest.mock("axios");
jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedFs = fs as jest.Mocked<typeof fs>;

describe("AnyDBClient", () => {
  let client: AnyDBClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

    // Create client instance
    client = new AnyDBClient({
      apiKey: "test-api-key",
      userEmail: "test@example.com",
      baseURL: "https://api.anydb.test",
    });
  });

  describe("Constructor", () => {
    it("should create client with correct configuration", () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: "https://api.anydb.test",
        headers: {
          "Content-Type": "application/json",
          "x-anydb-api-key": "test-api-key",
          "x-anydb-email": "test@example.com",
        },
        timeout: 30000,
      });
    });

    it("should use default baseURL when not provided", () => {
      jest.clearAllMocks();
      mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

      new AnyDBClient({
        apiKey: "test-key",
        userEmail: "user@test.com",
      });

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: "http://localhost:3000/api",
        }),
      );
    });
  });

  describe("Record Operations", () => {
    describe("getRecord", () => {
      it("should get a specific record", async () => {
        const mockRecord: ADORecord = {
          adoid: "ado123",
          adbid: "adb456",
          teamid: "team789",
          meta: { name: "Test Record" },
        };

        mockAxiosInstance.get.mockResolvedValue({ data: mockRecord });

        const result = await client.getRecord("team789", "adb456", "ado123");

        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          "/integrations/ext/record",
          {
            params: { teamid: "team789", adbid: "adb456", adoid: "ado123" },
          },
        );
        expect(result).toEqual(mockRecord);
      });
    });

    describe("listTeams", () => {
      it("should list all teams", async () => {
        const mockTeams: Team[] = [
          { teamid: "team1", name: "Team 1" },
          { teamid: "team2", name: "Team 2" },
        ];

        mockAxiosInstance.get.mockResolvedValue({ data: mockTeams });

        const result = await client.listTeams();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          "/integrations/ext/listteams",
        );
        expect(result).toEqual(mockTeams);
      });
    });

    describe("listDatabasesForTeam", () => {
      it("should list databases for a team", async () => {
        const mockDatabases: ADB[] = [
          { adbid: "adb1", teamid: "team1", name: "Database 1" },
          { adbid: "adb2", teamid: "team1", name: "Database 2" },
        ];

        mockAxiosInstance.get.mockResolvedValue({ data: mockDatabases });

        const result = await client.listDatabasesForTeam("team1");

        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          "/integrations/ext/listdbsforteam",
          {
            params: { teamid: "team1" },
          },
        );
        expect(result).toEqual(mockDatabases);
      });
    });

    describe("listRecords", () => {
      it("should list records without parentid", async () => {
        const mockRecords: ADORecord[] = [
          {
            adoid: "ado1",
            adbid: "adb1",
            teamid: "team1",
            meta: { name: "Record 1" },
          },
          {
            adoid: "ado2",
            adbid: "adb1",
            teamid: "team1",
            meta: { name: "Record 2" },
          },
        ];

        mockAxiosInstance.get.mockResolvedValue({ data: mockRecords });

        const result = await client.listRecords("team1", "adb1");

        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          "/integrations/ext/list",
          {
            params: { teamid: "team1", adbid: "adb1" },
          },
        );
        expect(result).toEqual(mockRecords);
      });

      it("should list records with parentid", async () => {
        const mockRecords: ADORecord[] = [
          {
            adoid: "ado3",
            adbid: "adb1",
            teamid: "team1",
            meta: { name: "Child Record" },
          },
        ];

        mockAxiosInstance.get.mockResolvedValue({ data: mockRecords });

        const result = await client.listRecords("team1", "adb1", "parent123");

        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          "/integrations/ext/list",
          {
            params: { teamid: "team1", adbid: "adb1", parentid: "parent123" },
          },
        );
        expect(result).toEqual(mockRecords);
      });
    });

    describe("createRecord", () => {
      it("should create a new record", async () => {
        const createParams: CreateRecordParams = {
          adbid: "adb1",
          teamid: "team1",
          name: "New Record",
          content: { field1: "value1" },
        };

        const mockRecord: ADORecord = {
          adoid: "new-ado",
          adbid: "adb1",
          teamid: "team1",
          meta: { name: "New Record" },
          content: { field1: "value1" },
        };

        mockAxiosInstance.post.mockResolvedValue({ data: mockRecord });

        const result = await client.createRecord(createParams);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          "/integrations/ext/createrecord",
          createParams,
        );
        expect(result).toEqual(mockRecord);
      });
    });

    describe("updateRecord", () => {
      it("should update an existing record", async () => {
        const updateParams: UpdateRecordParams = {
          meta: {
            adoid: "ado1",
            adbid: "adb1",
            teamid: "team1",
            name: "Updated Record",
          },
          content: { field1: "updated-value" },
        };

        const mockRecord: ADORecord = {
          adoid: "ado1",
          adbid: "adb1",
          teamid: "team1",
          meta: { name: "Updated Record" },
          content: { field1: "updated-value" },
        };

        mockAxiosInstance.put.mockResolvedValue({ data: mockRecord });

        const result = await client.updateRecord(updateParams);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith(
          "/integrations/ext/updaterecord",
          updateParams,
        );
        expect(result).toEqual(mockRecord);
      });
    });

    describe("searchRecords", () => {
      it("should search records", async () => {
        const searchParams: SearchRecordsParams = {
          adbid: "adb1",
          teamid: "team1",
          search: "test query",
        };

        const mockRecords: ADORecord[] = [
          {
            adoid: "ado1",
            adbid: "adb1",
            teamid: "team1",
            meta: { name: "Found Record" },
          },
        ];

        mockAxiosInstance.get.mockResolvedValue({ data: mockRecords });

        const result = await client.searchRecords(searchParams);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          "/integrations/ext/search",
          {
            params: searchParams,
          },
        );
        expect(result).toEqual(mockRecords);
      });
    });
  });

  describe("File Operations", () => {
    describe("downloadFile", () => {
      it("should download file with redirect", async () => {
        const downloadParams: DownloadFileParams = {
          teamid: "team1",
          adbid: "adb1",
          adoid: "ado1",
          cellpos: "A1",
          redirect: true,
        };

        mockAxiosInstance.get.mockResolvedValue({
          status: 302,
          headers: { location: "https://s3.aws.com/file.pdf" },
        });

        const result = await client.downloadFile(downloadParams);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          "/integrations/ext/download",
          {
            params: {
              teamid: "team1",
              adbid: "adb1",
              adoid: "ado1",
              cellpos: "A1",
              redirect: "1",
            },
            maxRedirects: 0,
            validateStatus: expect.any(Function),
          },
        );
        expect(result).toEqual({
          url: "https://s3.aws.com/file.pdf",
          redirect: true,
        });
      });

      it("should download file without redirect", async () => {
        const downloadParams: DownloadFileParams = {
          teamid: "team1",
          adbid: "adb1",
          adoid: "ado1",
          cellpos: "A1",
          redirect: false,
        };

        const mockResponse = { url: "https://cdn.example.com/file.pdf" };
        mockAxiosInstance.get.mockResolvedValue({
          status: 200,
          data: mockResponse,
        });

        const result = await client.downloadFile(downloadParams);

        expect(result).toEqual(mockResponse);
      });

      it("should download file with preview option", async () => {
        const downloadParams: DownloadFileParams = {
          teamid: "team1",
          adbid: "adb1",
          adoid: "ado1",
          cellpos: "A1",
          preview: true,
        };

        mockAxiosInstance.get.mockResolvedValue({
          status: 200,
          data: { url: "https://preview.example.com/file.pdf" },
        });

        await client.downloadFile(downloadParams);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          "/integrations/ext/download",
          expect.objectContaining({
            params: expect.objectContaining({
              preview: "1",
            }),
          }),
        );
      });
    });

    describe("getUploadUrl", () => {
      it("should get upload URL", async () => {
        const uploadParams: GetUploadUrlParams = {
          filename: "test.pdf",
          teamid: "team1",
          adbid: "adb1",
          adoid: "ado1",
          filesize: "1024",
          cellpos: "A1",
        };

        const mockResponse = {
          url: "https://s3.aws.com/upload-url",
          uploadId: "upload123",
        };

        mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

        const result = await client.getUploadUrl(uploadParams);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          "/integrations/ext/getuploadurl",
          {
            params: uploadParams,
          },
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe("uploadFileToUrl", () => {
      it("should upload file content to URL", async () => {
        const uploadUrl = "https://s3.aws.com/upload-url";
        const fileContent = Buffer.from("test file content");
        const contentType = "application/pdf";

        mockedAxios.put.mockResolvedValue({ data: {} });

        await client.uploadFileToUrl(uploadUrl, fileContent, contentType);

        expect(mockedAxios.put).toHaveBeenCalledWith(uploadUrl, fileContent, {
          headers: {
            "Content-Type": contentType,
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        });
      });

      it("should upload with default content type", async () => {
        const uploadUrl = "https://s3.aws.com/upload-url";
        const fileContent = Buffer.from("test file content");

        mockedAxios.put.mockResolvedValue({ data: {} });

        await client.uploadFileToUrl(uploadUrl, fileContent);

        expect(mockedAxios.put).toHaveBeenCalledWith(
          uploadUrl,
          fileContent,
          expect.objectContaining({
            headers: {
              "Content-Type": "application/octet-stream",
            },
          }),
        );
      });
    });

    describe("completeUpload", () => {
      it("should complete upload", async () => {
        const completeParams: CompleteUploadParams = {
          filesize: "1024",
          teamid: "team1",
          adbid: "adb1",
          adoid: "ado1",
          cellpos: "A1",
        };

        const mockResponse = {
          success: true,
          message: "Upload completed",
        };

        mockAxiosInstance.put.mockResolvedValue({ data: mockResponse });

        const result = await client.completeUpload(completeParams);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith(
          "/integrations/ext/completeupload",
          completeParams,
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe("uploadFile (Complete Workflow)", () => {
      it("should upload file using file content", async () => {
        const fileContent = Buffer.from("test file content");
        const uploadParams = {
          filename: "test.pdf",
          fileContent,
          teamid: "team1",
          adbid: "adb1",
          adoid: "ado1",
          cellpos: "B2",
          contentType: "application/pdf",
        };

        const mockUploadUrl = {
          url: "https://s3.aws.com/upload-url",
        };

        const mockCompleteResponse = {
          success: true,
        };

        // Mock getUploadUrl
        mockAxiosInstance.get.mockResolvedValueOnce({ data: mockUploadUrl });

        // Mock uploadFileToUrl
        mockedAxios.put.mockResolvedValueOnce({ data: {} });

        // Mock completeUpload
        mockAxiosInstance.put.mockResolvedValueOnce({
          data: mockCompleteResponse,
        });

        const result = await client.uploadFile(uploadParams);

        // Verify getUploadUrl was called
        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          "/integrations/ext/getuploadurl",
          {
            params: {
              filename: "test.pdf",
              teamid: "team1",
              adbid: "adb1",
              adoid: "ado1",
              filesize: fileContent.length.toString(),
              cellpos: "B2",
            },
          },
        );

        // Verify uploadFileToUrl was called
        expect(mockedAxios.put).toHaveBeenCalledWith(
          mockUploadUrl.url,
          fileContent,
          {
            headers: {
              "Content-Type": "application/pdf",
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
          },
        );

        // Verify completeUpload was called
        expect(mockAxiosInstance.put).toHaveBeenCalledWith(
          "/integrations/ext/completeupload",
          {
            filesize: fileContent.length.toString(),
            teamid: "team1",
            adbid: "adb1",
            adoid: "ado1",
            cellpos: "B2",
          },
        );

        expect(result).toEqual(mockCompleteResponse);
      });

      it("should upload file using filepath", async () => {
        const mockFileContent = Buffer.from("file from disk");
        const uploadParams = {
          filename: "document.pdf",
          filepath: "/path/to/document.pdf",
          teamid: "team1",
          adbid: "adb1",
          adoid: "ado1",
        };

        // Mock fs.readFile
        mockedFs.readFile.mockResolvedValue(mockFileContent);

        const mockUploadUrl = {
          url: "https://s3.aws.com/upload-url",
        };

        const mockCompleteResponse = {
          success: true,
        };

        mockAxiosInstance.get.mockResolvedValueOnce({ data: mockUploadUrl });
        mockedAxios.put.mockResolvedValueOnce({ data: {} });
        mockAxiosInstance.put.mockResolvedValueOnce({
          data: mockCompleteResponse,
        });

        const result = await client.uploadFile(uploadParams);

        // Verify file was read from disk
        expect(mockedFs.readFile).toHaveBeenCalledWith("/path/to/document.pdf");

        // Verify getUploadUrl was called with correct filesize
        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          "/integrations/ext/getuploadurl",
          expect.objectContaining({
            params: expect.objectContaining({
              filesize: mockFileContent.length.toString(),
              cellpos: "A1", // Should use default
            }),
          }),
        );

        expect(result).toEqual(mockCompleteResponse);
      });

      it("should use default cellpos A1 when not provided", async () => {
        const fileContent = Buffer.from("test");
        const uploadParams = {
          filename: "test.txt",
          fileContent,
          teamid: "team1",
          adbid: "adb1",
          adoid: "ado1",
        };

        mockAxiosInstance.get.mockResolvedValueOnce({
          data: { url: "https://upload.url" },
        });
        mockedAxios.put.mockResolvedValueOnce({ data: {} });
        mockAxiosInstance.put.mockResolvedValueOnce({
          data: { success: true },
        });

        await client.uploadFile(uploadParams);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          "/integrations/ext/getuploadurl",
          expect.objectContaining({
            params: expect.objectContaining({
              cellpos: "A1",
            }),
          }),
        );
      });

      it("should throw error when neither filepath nor fileContent provided", async () => {
        const uploadParams = {
          filename: "test.pdf",
          teamid: "team1",
          adbid: "adb1",
          adoid: "ado1",
        };

        await expect(client.uploadFile(uploadParams as any)).rejects.toThrow(
          "Either filepath or fileContent must be provided",
        );
      });

      it("should throw error when both filepath and fileContent provided", async () => {
        const uploadParams = {
          filename: "test.pdf",
          filepath: "/path/to/file.pdf",
          fileContent: Buffer.from("content"),
          teamid: "team1",
          adbid: "adb1",
          adoid: "ado1",
        };

        await expect(client.uploadFile(uploadParams)).rejects.toThrow(
          "Cannot provide both filepath and fileContent. Choose one.",
        );
      });

      it("should throw error when file read fails", async () => {
        const uploadParams = {
          filename: "test.pdf",
          filepath: "/nonexistent/file.pdf",
          teamid: "team1",
          adbid: "adb1",
          adoid: "ado1",
        };

        mockedFs.readFile.mockRejectedValue(new Error("File not found"));

        await expect(client.uploadFile(uploadParams)).rejects.toThrow(
          'Failed to read file from path "/nonexistent/file.pdf": File not found',
        );
      });

      it("should convert string fileContent to Buffer", async () => {
        const fileContent = "test file content as string";
        const uploadParams = {
          filename: "test.txt",
          fileContent,
          teamid: "team1",
          adbid: "adb1",
          adoid: "ado1",
        };

        mockAxiosInstance.get.mockResolvedValueOnce({
          data: { url: "https://upload.url" },
        });
        mockedAxios.put.mockResolvedValueOnce({ data: {} });
        mockAxiosInstance.put.mockResolvedValueOnce({
          data: { success: true },
        });

        await client.uploadFile(uploadParams);

        // Verify the string was converted to Buffer
        expect(mockedAxios.put).toHaveBeenCalledWith(
          "https://upload.url",
          Buffer.from(fileContent),
          expect.any(Object),
        );
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors with response", async () => {
      const error = new Error("AnyDB API Error (404): Record not found");
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(
        client.getRecord("team1", "adb1", "nonexistent"),
      ).rejects.toThrow("AnyDB API Error (404): Record not found");
    });

    it("should handle network errors", async () => {
      const error = new Error(
        "AnyDB API Error: No response received from server",
      );
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(client.listTeams()).rejects.toThrow(
        "AnyDB API Error: No response received from server",
      );
    });

    it("should handle generic errors", async () => {
      const error = new Error("AnyDB API Error: Something went wrong");
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(client.listTeams()).rejects.toThrow(
        "AnyDB API Error: Something went wrong",
      );
    });
  });
});
