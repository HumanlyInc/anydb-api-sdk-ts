import axios, { AxiosInstance, AxiosResponse } from "axios";

import { AnyDBClient } from "../client";
import { NULL_OBJECTID } from "../types";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;
const request = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  defaults: { baseURL: "https://app.anydb.com/api" },
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

const successResponse = (data: unknown): AxiosResponse =>
  ({ status: 200, data: { status: "success", data } }) as AxiosResponse;

describe("AnyDBClient integration endpoints", () => {
  let client: AnyDBClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue(request as unknown as AxiosInstance);
    client = new AnyDBClient({ apiKey: "key", userEmail: "user@example.com" });
  });

  it("surfaces nested API error messages", async () => {
    const responseInterceptor =
      request.interceptors.response.use.mock.calls[0][1];
    expect(() =>
      responseInterceptor({
        response: {
          status: 424,
          data: {
            status: "error",
            error: {
              type: "failed-dependency",
              message: "Persistence failed",
            },
          },
        },
      }),
    ).toThrow("AnyDB API Error (424): Persistence failed");
  });

  it("exposes retry-after metadata on rate-limit errors", () => {
    const responseInterceptor =
      request.interceptors.response.use.mock.calls[0][1];
    try {
      responseInterceptor({
        response: {
          status: 429,
          headers: { "retry-after": "30" },
          data: { status: "error", message: "Too many requests" },
        },
      });
      throw new Error("Expected interceptor to throw");
    } catch (error) {
      expect(error).toMatchObject({
        status: 429,
        retryAfter: "30",
      });
    }
  });

  describe("downloadFile", () => {
    const params = {
      teamid: "team",
      adbid: "adb",
      adoid: "file-record",
      cellpos: "A1",
      redirect: false,
    };

    it("unwraps a URL string from the standard API response", async () => {
      request.get.mockResolvedValue(successResponse("https://files.example/file"));

      await expect(client.downloadFile(params)).resolves.toEqual({
        url: "https://files.example/file",
        redirect: false,
      });
    });

    it("unwraps a URL object from the standard API response", async () => {
      request.get.mockResolvedValue(
        successResponse({ url: "https://files.example/file" }),
      );

      await expect(client.downloadFile(params)).resolves.toEqual({
        url: "https://files.example/file",
        redirect: false,
      });
    });

    it("keeps supporting the legacy direct URL response", async () => {
      request.get.mockResolvedValue({
        status: 200,
        data: { url: "https://files.example/file", redirect: true },
      } as AxiosResponse);

      await expect(client.downloadFile(params)).resolves.toEqual({
        url: "https://files.example/file",
        redirect: true,
      });
    });

    it("returns the Location header for a redirect response", async () => {
      request.get.mockResolvedValue({
        status: 302,
        headers: { location: "https://files.example/file" },
        data: undefined,
      } as AxiosResponse);

      await expect(client.downloadFile({ ...params, redirect: true })).resolves.toEqual({
        url: "https://files.example/file",
        redirect: true,
      });
    });

    it("throws the API message for an application-level failure", async () => {
      request.get.mockResolvedValue({
        status: 200,
        data: { status: "error", message: "File is not available" },
      } as AxiosResponse);

      await expect(client.downloadFile(params)).rejects.toThrow(
        "Failed to download file: File is not available",
      );
    });

    it("rejects successful responses that do not contain a URL", async () => {
      request.get.mockResolvedValue(successResponse({}));

      await expect(client.downloadFile(params)).rejects.toThrow(
        "Failed to download file: success response did not contain a URL",
      );
    });
  });

  it("creates a workspace", async () => {
    const params = {
      teamid: "team",
      name: "Operations",
      clientRequestId: "workspace-1",
    };
    request.post.mockResolvedValue(successResponse({ success: true }));

    await client.createWorkspace(params);

    expect(request.post).toHaveBeenCalledWith(
      "/integrations/ext/workspaces",
      params,
    );
  });

  it("supports all workflow routes", async () => {
    request.get.mockResolvedValue(successResponse([]));
    request.post.mockResolvedValue(successResponse({}));
    request.put.mockResolvedValue(successResponse({}));
    const resource = { teamid: "team", adbid: "adb" };

    await client.listWorkflows(resource);
    await client.getWorkflow({ ...resource, workflowId: "workflow/id" });
    await client.getWorkflowExecutionHistory({
      ...resource,
      workflowId: "workflow/id",
    });
    await client.listWorkflowTriggers(resource);
    await client.listWorkflowActions(resource);
    await client.createWorkflow({
      ...resource,
      clientRequestId: "workflow-create",
      validateOnly: true,
      workflow: {
        name: "Notify on task creation",
        trigger: {
          type: "trigger_on_record_create",
          config: { templateName: "Task" },
        },
        actions: [
          {
            key: "notify",
            type: "action_send_email",
            config: { subject: "New task" },
          },
        ],
      },
    });
    await client.updateWorkflow({
      ...resource,
      workflowId: "workflow/id",
      clientRequestId: "workflow-update",
      changes: { enabled: false },
    });

    expect(request.get).toHaveBeenNthCalledWith(
      1,
      "/integrations/ext/workflows",
      { params: resource },
    );
    expect(request.get).toHaveBeenNthCalledWith(
      2,
      "/integrations/ext/workflows/workflow%2Fid",
      { params: resource },
    );
    expect(request.get).toHaveBeenNthCalledWith(
      3,
      "/integrations/ext/workflows/workflow%2Fid/execution-history",
      { params: resource },
    );
    expect(request.get).toHaveBeenNthCalledWith(
      4,
      "/integrations/ext/workflow-triggers",
      { params: resource },
    );
    expect(request.get).toHaveBeenNthCalledWith(
      5,
      "/integrations/ext/workflow-actions",
      { params: resource },
    );
    expect(request.post).toHaveBeenCalledWith("/integrations/ext/workflows", {
      ...resource,
      clientRequestId: "workflow-create",
      validateOnly: true,
      workflow: {
        name: "Notify on task creation",
        trigger: {
          type: "trigger_on_record_create",
          config: { templateName: "Task" },
        },
        actions: [
          {
            key: "notify",
            type: "action_send_email",
            config: { subject: "New task" },
          },
        ],
      },
    });
    expect(request.put).toHaveBeenCalledWith(
      "/integrations/ext/workflows/workflow%2Fid",
      {
        ...resource,
        clientRequestId: "workflow-update",
        changes: { enabled: false },
      },
    );
  });

  it("supports all view routes", async () => {
    request.post.mockResolvedValue(successResponse({}));
    request.put.mockResolvedValue(successResponse({}));
    request.get.mockResolvedValue(successResponse([]));
    request.delete.mockResolvedValue(successResponse({}));
    const resource = { teamid: "team", adbid: "adb" };
    const view = {
      name: "Open items",
      scope: "workspace" as const,
      targets: [{ typeName: "Task" }],
    };

    await client.createView({
      ...resource,
      clientRequestId: "view-create",
      view,
    });
    await client.updateView({
      ...resource,
      viewId: "view/id",
      clientRequestId: "view-update",
      changes: { name: "Open work" },
    });
    await client.listViews(resource);
    await client.getView({ ...resource, viewId: "view/id" });
    await client.deleteView({
      ...resource,
      viewId: "view/id",
      clientRequestId: "view-delete",
    });

    expect(request.post).toHaveBeenCalledWith("/integrations/ext/views", {
      ...resource,
      clientRequestId: "view-create",
      view,
    });
    expect(request.put).toHaveBeenCalledWith(
      "/integrations/ext/views/view%2Fid",
      {
        ...resource,
        clientRequestId: "view-update",
        changes: { name: "Open work" },
      },
    );
    expect(request.get).toHaveBeenNthCalledWith(1, "/integrations/ext/views", {
      params: resource,
    });
    expect(request.get).toHaveBeenNthCalledWith(
      2,
      "/integrations/ext/views/view%2Fid",
      { params: resource },
    );
    expect(request.delete).toHaveBeenCalledWith(
      "/integrations/ext/views/view%2Fid",
      { data: { ...resource, clientRequestId: "view-delete" } },
    );
  });

  it("supports all type routes using type names in the SDK", async () => {
    request.get.mockResolvedValue(successResponse([]));
    request.post.mockResolvedValue(successResponse({}));
    request.put.mockResolvedValue(successResponse({}));
    const resource = { teamid: "team", adbid: "adb" };

    await client.listTypes(resource);
    await client.discoverTypes({ ...resource, search: "task", source: "all" });
    await client.getTypeDefinition({
      ...resource,
      typeName: "Task / Issue",
      source: "workspace",
    });
    await client.createType({
      ...resource,
      clientRequestId: "type-create",
      mode: "import_builtin",
      builtInTemplateName: "Task",
    });
    await client.updateType({
      ...resource,
      typeName: "Task / Issue",
      clientRequestId: "type-update",
      expectedRevision: "1",
      changes: { description: "Tracked work" },
      confirmDataLoss: false,
    });
    await client.getType({ ...resource, typeName: "Task / Issue" });

    expect(request.get).toHaveBeenNthCalledWith(
      1,
      "/integrations/ext/templates",
      { params: resource },
    );
    expect(request.get).toHaveBeenNthCalledWith(
      2,
      "/integrations/ext/templates/discover",
      { params: { ...resource, search: "task", source: "all" } },
    );
    expect(request.get).toHaveBeenNthCalledWith(
      3,
      "/integrations/ext/templates/Task%20%2F%20Issue/definition",
      { params: { ...resource, source: "workspace" } },
    );
    expect(request.post).toHaveBeenCalledWith("/integrations/ext/templates", {
      ...resource,
      clientRequestId: "type-create",
      mode: "import_builtin",
      builtInTemplateName: "Task",
    });
    expect(request.put).toHaveBeenCalledWith(
      "/integrations/ext/templates/Task%20%2F%20Issue",
      {
        ...resource,
        clientRequestId: "type-update",
        expectedRevision: "1",
        changes: { description: "Tracked work" },
        confirmDataLoss: false,
      },
    );
    expect(request.get).toHaveBeenNthCalledWith(
      4,
      "/integrations/ext/templates/Task%20%2F%20Issue",
      { params: resource },
    );
  });

  it("lists team groups", async () => {
    request.get.mockResolvedValue(successResponse([]));

    await client.listTeamGroups("team");

    expect(request.get).toHaveBeenCalledWith("/integrations/ext/team-groups", {
      params: { teamid: "team" },
    });
  });

  it("supports all semantic share routes", async () => {
    request.post.mockResolvedValue(successResponse({}));
    request.get.mockResolvedValue(successResponse([]));
    request.delete.mockResolvedValue(successResponse({}));
    const resource = { teamid: "team", adbid: "adb" };

    await client.createShare({
      ...resource,
      clientRequestId: "share-create",
      share: {
        privacy: "public",
        target: {
          kind: "form",
          typeName: "Issue Form",
          parentRecordId: "parent",
        },
      },
    });
    await client.listShares(resource);
    await client.getShare({
      ...resource,
      shareId: "share/id",
      kind: "form",
    });
    await client.revokeShare({
      ...resource,
      shareId: "share/id",
      kind: "form",
      clientRequestId: "share-delete",
    });

    expect(request.post).toHaveBeenCalledWith("/integrations/ext/shares", {
      ...resource,
      clientRequestId: "share-create",
      share: {
        privacy: "public",
        target: {
          kind: "form",
          templateName: "Issue Form",
          parentRecordId: "parent",
        },
      },
    });
    expect(request.get).toHaveBeenNthCalledWith(1, "/integrations/ext/shares", {
      params: resource,
    });
    expect(request.get).toHaveBeenNthCalledWith(
      2,
      "/integrations/ext/shares/share%2Fid",
      { params: { ...resource, kind: "form" } },
    );
    expect(request.delete).toHaveBeenCalledWith(
      "/integrations/ext/shares/share%2Fid",
      {
        data: {
          ...resource,
          kind: "form",
          clientRequestId: "share-delete",
        },
      },
    );
  });

  it("removes an incomplete file record when upload setup fails", async () => {
    const incompleteRecord = {
      meta: { adoid: "incomplete-file" },
    } as Awaited<ReturnType<AnyDBClient["createRecord"]>>;
    const createRecord = jest
      .spyOn(client, "createRecord")
      .mockResolvedValue(incompleteRecord);
    jest
      .spyOn(client, "getUploadUrl")
      .mockRejectedValue(new Error("Upload URL unavailable"));
    const removeRecord = jest
      .spyOn(client, "removeRecord")
      .mockResolvedValue(true);

    await expect(
      client.uploadFile({
        filename: "tasks.txt",
        fileContent: Buffer.from("tasks"),
        teamid: "team",
        adbid: "adb",
        adoid: "parent",
      }),
    ).rejects.toThrow("Upload URL unavailable");

    expect(createRecord).toHaveBeenCalled();
    expect(removeRecord).toHaveBeenCalledWith({
      adoid: "incomplete-file",
      adbid: "adb",
      teamid: "team",
      removefromids: NULL_OBJECTID,
    });
  });
});
