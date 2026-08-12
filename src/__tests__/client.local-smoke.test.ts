import { AnyDBClient } from "../client";
import { NULL_OBJECTID } from "../types";

const requiredEnvironment = [
  "ANYDB_BASE_URL",
  "ANYDB_API_KEY",
  "ANYDB_USER_EMAIL",
] as const;
const shouldRun =
  process.env.ANYDB_RUN_LOCAL_SMOKE === "true" &&
  requiredEnvironment.every((name) => process.env[name]);
const describeLocal = shouldRun ? describe : describe.skip;

describeLocal("AnyDB local SDK smoke test", () => {
  jest.setTimeout(120_000);

  it("exercises workspace, type, record, view, group, and share endpoints", async () => {
    const client = new AnyDBClient({
      baseURL: process.env.ANYDB_BASE_URL!,
      apiKey: process.env.ANYDB_API_KEY!,
      userEmail: process.env.ANYDB_USER_EMAIL!,
      timeout: 30_000,
    });
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const requestId = (operation: string) => `sdk-smoke-${operation}-${suffix}`;
    const typeName = `SDK Smoke Type ${suffix.replace("-", " ")}`;
    const recordName = `SDK Smoke Record ${suffix}`;
    let teamid = "";
    let adbid = "";
    let recordId = "";
    let viewId = "";
    let shareId = "";

    try {
      const teams = await client.listTeams();
      expect(teams.length).toBeGreaterThan(0);
      teamid = process.env.ANYDB_TEST_TEAM_ID || teams[0].teamid;
      const existingWorkspaces = await client.listDatabasesForTeam(teamid);
      expect(existingWorkspaces.length).toBeGreaterThan(0);
      adbid = process.env.ANYDB_TEST_ADB_ID || existingWorkspaces[0].adbid;

      const createdType = await client.createType({
        teamid,
        adbid,
        clientRequestId: requestId("type-create"),
        mode: "define",
        type: {
          name: typeName,
          description: "Created by the SDK local smoke test",
          fields: [
            {
              key: "Title",
              valueType: "string",
              format: "general",
              required: true,
              layout: { position: "A1", colspan: 1, rowspan: 1 },
            },
          ],
        },
      });
      expect(createdType.result.persisted).toBe(true);

      const listedTypes = await client.listTypes({ teamid, adbid });
      expect(listedTypes.some((type) => type.name === typeName)).toBe(true);

      const discoveredTypes = await client.discoverTypes({
        teamid,
        adbid,
        search: typeName,
        source: "workspace",
      });
      expect(
        discoveredTypes.candidates.some((type) => type.name === typeName),
      ).toBe(true);

      const type = await client.getType({ teamid, adbid, typeName });
      expect(type.meta.name).toBe(typeName);

      const definition = await client.getTypeDefinition({
        teamid,
        adbid,
        typeName,
        source: "workspace",
      });
      expect(definition.status).toBe("ok");

      const updatedType = await client.updateType({
        teamid,
        adbid,
        typeName,
        clientRequestId: requestId("type-update"),
        expectedRevision: createdType.result.revision || "1",
        changes: {
          description: "Updated by the SDK local smoke test",
          addFields: [
            {
              key: "Status",
              valueType: "string",
              format: "select",
              options: ["Open", "Closed"],
              layout: { position: "A2", colspan: 1, rowspan: 1 },
            },
          ],
        },
        confirmDataLoss: false,
      });
      expect(updatedType.result.revision).not.toBe(
        updatedType.result.previousRevision,
      );

      const createdRecord = await client.createRecord({
        teamid,
        adbid,
        name: recordName,
        templatename: typeName,
      });
      recordId = createdRecord.meta.adoid;
      const writableCell = Object.values(createdRecord.content || {}).find(
        (cell) => cell.type === "string" && !cell.expr,
      );
      expect(writableCell).toBeDefined();
      const updatedValue = `SDK smoke value ${suffix}`;

      const updatedRecord = await client.updateRecord({
        meta: { teamid, adbid, adoid: recordId },
        content: {
          [writableCell!.pos]: {
            pos: writableCell!.pos,
            key: writableCell!.key,
            value: updatedValue,
          },
        },
      });
      expect(updatedRecord.content?.[writableCell!.pos]?.value).toBe(
        updatedValue,
      );

      const foundRecord = await client.getRecord(teamid, adbid, recordId);
      expect(foundRecord.meta.adoid).toBe(recordId);

      const searchResults = await client.searchRecords({
        teamid,
        adbid,
        search: updatedValue,
      });
      expect(Array.isArray(searchResults)).toBe(true);

      const createdView = await client.createView({
        teamid,
        adbid,
        clientRequestId: requestId("view-create"),
        view: {
          name: `SDK Smoke View ${suffix}`,
          scope: "workspace",
          targets: [{ typeName }],
        },
      });
      viewId = createdView.result.viewId!;

      expect(
        (await client.listViews({ teamid, adbid })).some(
          (view) => view.viewId === viewId,
        ),
      ).toBe(true);
      expect((await client.getView({ teamid, adbid, viewId })).viewId).toBe(
        viewId,
      );

      const updatedView = await client.updateView({
        teamid,
        adbid,
        viewId,
        clientRequestId: requestId("view-update"),
        changes: { name: `SDK Smoke View Updated ${suffix}` },
      });
      expect(updatedView.result.name).toContain("Updated");

      expect(Array.isArray(await client.listTeamGroups(teamid))).toBe(true);

      const createdShare = await client.createShare({
        teamid,
        adbid,
        clientRequestId: requestId("share-create"),
        share: {
          name: `SDK Smoke Share ${suffix}`,
          privacy: "public",
          target: { kind: "record", recordId },
          role: "viewer",
          withAttachments: false,
        },
      });
      shareId = createdShare.result.shareId!;

      expect(
        (await client.listShares({ teamid, adbid })).some(
          (share) => share.shareId === shareId,
        ),
      ).toBe(true);
      expect(
        (await client.getShare({ teamid, adbid, shareId, kind: "record" }))
          .shareId,
      ).toBe(shareId);

      const revokedShare = await client.revokeShare({
        teamid,
        adbid,
        shareId,
        kind: "record",
        clientRequestId: requestId("share-revoke"),
      });
      expect(revokedShare.result.revoked).toBe(true);
      shareId = "";

      const deletedView = await client.deleteView({
        teamid,
        adbid,
        viewId,
        clientRequestId: requestId("view-delete"),
      });
      expect(deletedView.result.deleted).toBe(true);
      viewId = "";

      const workspace = await client.createWorkspace({
        teamid,
        name: `SDK Smoke Workspace ${suffix}`,
        clientRequestId: requestId("workspace"),
      });
      expect(workspace.result.teamid).toBe(teamid);
      expect(workspace.result.adbid).toBeTruthy();
    } finally {
      if (shareId) {
        await client
          .revokeShare({
            teamid,
            adbid,
            shareId,
            kind: "record",
            clientRequestId: requestId("share-cleanup"),
          })
          .catch(() => undefined);
      }
      if (viewId) {
        await client
          .deleteView({
            teamid,
            adbid,
            viewId,
            clientRequestId: requestId("view-cleanup"),
          })
          .catch(() => undefined);
      }
      if (recordId) {
        await client
          .removeRecord({
            teamid,
            adbid,
            adoid: recordId,
            removefromids: NULL_OBJECTID,
          })
          .catch(() => undefined);
      }
    }
  });
});
