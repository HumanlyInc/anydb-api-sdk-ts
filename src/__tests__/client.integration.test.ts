/**
 * Integration tests for AnyDB SDK Client
 * These tests run against a real AnyDB API instance
 *
 * To run these tests, set the following environment variables:
 * - ANYDB_BASE_URL: The base URL of your AnyDB API
 * - ANYDB_API_KEY: Your API key
 * - ANYDB_USER_EMAIL: Your user email
 * - ANYDB_TEST_TEAM_ID: A test team ID
 * - ANYDB_TEST_ADB_ID: A test database ID
 *
 * Run with: npm run test:integration
 * Or: ANYDB_BASE_URL=... ANYDB_API_KEY=... npm run test:integration
 */

import { AnyDBClient } from "../client";
import { ADOCellValueType } from "../types";
import { promises as fs } from "fs";
import path from "path";

// Skip these tests if environment variables are not set

const shouldRunIntegrationTests =
  process.env.ANYDB_BASE_URL &&
  process.env.ANYDB_API_KEY &&
  process.env.ANYDB_USER_EMAIL;

const describeIf = shouldRunIntegrationTests ? describe : describe.skip;

describeIf("AnyDBClient Integration Tests", () => {
  let client: AnyDBClient;

  const config = {
    baseURL: process.env.ANYDB_BASE_URL!,
    apiKey: process.env.ANYDB_API_KEY!,
    userEmail: process.env.ANYDB_USER_EMAIL!,
  };

  // Test data from environment
  const testTeamId = process.env.ANYDB_TEST_TEAM_ID || "";
  const testAdbId = process.env.ANYDB_TEST_ADB_ID || "";

  // Test ADO will be created dynamically
  let testAdoId = "";

  beforeAll(async () => {
    client = new AnyDBClient(config);

    // Create a test ADO if teamId and adbId are provided
    if (testTeamId && testAdbId) {
      try {
        const testRecord = await client.createRecord({
          teamid: testTeamId,
          adbid: testAdbId,
          name: `Integration Test Record - ${new Date().toISOString()}`,
          content: {
            A1: {
              pos: "A1",
              key: "testField",
              type: ADOCellValueType.STRING,
              value: "integration test",
              colspan: 1,
              rowspan: 1,
              props: {},
            },
            A2: {
              pos: "A2",
              key: "createdAt",
              type: ADOCellValueType.STRING,
              value: new Date().toISOString(),
              colspan: 1,
              rowspan: 1,
              props: {},
            },
          },
        });
        testAdoId = testRecord.meta.adoid;
        console.log(`✓ Created test record with ID: ${testAdoId}`);
      } catch (error) {
        console.warn("Warning: Could not create test record:", error);
      }
    }
  });

  afterAll(async () => {
    // Note: Add cleanup logic here if your API supports deleting records
    // For now, we leave the test record in the system
    if (testAdoId) {
      console.log(
        `ℹ Test record ${testAdoId} was created and may need manual cleanup`,
      );
    }
  });

  describe("Record Operations", () => {
    describe("listTeams", () => {
      it("should list all teams", async () => {
        const teams = await client.listTeams();

        expect(Array.isArray(teams)).toBe(true);
        expect(teams.length).toBeGreaterThan(0);
        expect(teams[0]).toHaveProperty("teamid");
        expect(teams[0]).toHaveProperty("name");
      });
    });

    describe("listDatabasesForTeam", () => {
      it("should list databases for a team", async () => {
        if (!testTeamId) {
          console.warn("Skipping: ANYDB_TEST_TEAM_ID not set");
          return;
        }

        const databases = await client.listDatabasesForTeam(testTeamId);

        expect(Array.isArray(databases)).toBe(true);
        if (databases.length > 0) {
          expect(databases[0]).toHaveProperty("adbid");
          expect(databases[0]).toHaveProperty("teamid");
          expect(databases[0]).toHaveProperty("name");
        }
      });
    });

    describe("listRecords", () => {
      it("should list records in a database", async () => {
        if (!testTeamId || !testAdbId) {
          console.warn(
            "Skipping: ANYDB_TEST_TEAM_ID or ANYDB_TEST_ADB_ID not set",
          );
          return;
        }

        const records = await client.listRecords(testTeamId, testAdbId);

        expect(Array.isArray(records)).toBe(true);
        if (records.length > 0) {
          expect(records[0]).toHaveProperty("adoid");
          expect(records[0]).toHaveProperty("adbid");
          expect(records[0]).toHaveProperty("teamid");
        }
      });
    });

    describe("getRecord", () => {
      it("should get a specific record", async () => {
        if (!testTeamId || !testAdbId) {
          console.warn(
            "Skipping: ANYDB_TEST_TEAM_ID or ANYDB_TEST_ADB_ID not set",
          );
          return;
        }

        if (!testAdoId) {
          console.warn("Skipping: Test ADO was not created");
          return;
        }

        const record = await client.getRecord(testTeamId, testAdbId, testAdoId);

        expect(record.meta).toHaveProperty("adoid", testAdoId);
        expect(record.meta).toHaveProperty("adbid", testAdbId);
        expect(record.meta).toHaveProperty("teamid", testTeamId);
        expect(record).toHaveProperty("meta");
        expect(record.meta).toHaveProperty("name");

        // Verify content structure
        if (record.content) {
          expect(record.content.A1).toBeDefined();
          expect(record.content.A1?.pos).toBe("A1");
          expect(record.content.A1?.value).toBe("integration test");
        }
      });
    });

    describe("searchRecords", () => {
      it("should search records with a keyword", async () => {
        if (!testTeamId || !testAdbId) {
          console.warn(
            "Skipping: ANYDB_TEST_TEAM_ID or ANYDB_TEST_ADB_ID not set",
          );
          return;
        }

        const results = await client.searchRecords({
          teamid: testTeamId,
          adbid: testAdbId,
          search: "test",
        });

        expect(Array.isArray(results)).toBe(true);
        // Results may be empty if no matches found
      });
    });

    describe("createRecord and updateRecord", () => {
      it("should create and update a record", async () => {
        if (!testTeamId || !testAdbId) {
          console.warn(
            "Skipping: ANYDB_TEST_TEAM_ID or ANYDB_TEST_ADB_ID not set",
          );
          return;
        }

        // Create a test record with proper content structure
        const newRecord = await client.createRecord({
          teamid: testTeamId,
          adbid: testAdbId,
          name: `Test Record ${Date.now()}`,
          content: {
            A1: {
              pos: "A1",
              key: "Name",
              type: ADOCellValueType.STRING,
              value: "Test Person",
              colspan: 1,
              rowspan: 1,
              props: {},
            },
            A2: {
              pos: "A2",
              key: "Age",
              type: ADOCellValueType.NUMBER,
              value: 25,
              colspan: 1,
              rowspan: 1,
              props: {},
            },
            B1: {
              pos: "B1",
              key: "testField",
              type: ADOCellValueType.STRING,
              value: "test value",
              colspan: 1,
              rowspan: 1,
              props: {},
            },
          },
        });

        expect(newRecord.meta).toHaveProperty("adoid");
        expect(newRecord.meta.name).toContain("Test Record");
        expect(newRecord.content).toBeDefined();
        if (newRecord.content) {
          expect(newRecord.content.B1?.value).toBe("test value");
        }

        // Update the record with minimal cell data
        const updatedRecord = await client.updateRecord({
          meta: {
            adoid: newRecord.meta.adoid,
            adbid: testAdbId,
            teamid: testTeamId,
            name: `Updated Record ${Date.now()}`,
          },
          content: {
            A1: {
              pos: "A1",
              key: "Name",
              value: "Updated Person",
            },
            B1: {
              pos: "B1",
              key: "testField",
              value: "updated value",
            },
          },
        });

        expect(updatedRecord.meta.adoid).toBe(newRecord.meta.adoid);
        expect(updatedRecord.meta.name).toContain("Updated Record");
        if (updatedRecord.content) {
          expect(updatedRecord.content.B1?.value).toBe("updated value");
        }
      });
    });
  });

  describe("File Operations", () => {
    let uploadedFileAdoId: string;

    describe("uploadFile with fileContent", () => {
      it("should upload a file using file content", async () => {
        if (!testTeamId || !testAdbId) {
          console.warn(
            "Skipping: ANYDB_TEST_TEAM_ID or ANYDB_TEST_ADB_ID not set",
          );
          return;
        }

        if (!testAdoId) {
          console.warn("Skipping: Test ADO was not created");
          return;
        }

        const testContent = `Test file content created at ${new Date().toISOString()}`;
        const fileBuffer = Buffer.from(testContent);

        uploadedFileAdoId = await client.uploadFile({
          filename: "test-file.txt",
          fileContent: fileBuffer,
          teamid: testTeamId,
          adbid: testAdbId,
          adoid: testAdoId,
          cellpos: "A1",
          contentType: "text/plain",
        });

        expect(uploadedFileAdoId).toBeTruthy();
        expect(typeof uploadedFileAdoId).toBe("string");
        console.log(`✓ Uploaded file with ADOID: ${uploadedFileAdoId}`);
      }, 30000); // 30 second timeout for upload
    });

    describe("uploadFile with filepath", () => {
      it("should upload a file using filepath", async () => {
        if (!testTeamId || !testAdbId) {
          console.warn(
            "Skipping: ANYDB_TEST_TEAM_ID or ANYDB_TEST_ADB_ID not set",
          );
          return;
        }

        if (!testAdoId) {
          console.warn("Skipping: Test ADO was not created");
          return;
        }

        // Create a temporary test file
        const tempFilePath = path.join(__dirname, "temp-test-file.txt");
        const testContent = `Test file from disk created at ${new Date().toISOString()}`;
        await fs.writeFile(tempFilePath, testContent);

        try {
          const fileAdoId = await client.uploadFile({
            filename: "test-file-from-disk.txt",
            filepath: tempFilePath,
            teamid: testTeamId,
            adbid: testAdbId,
            adoid: testAdoId,
            cellpos: "B2",
            contentType: "text/plain",
          });

          expect(fileAdoId).toBeTruthy();
          expect(typeof fileAdoId).toBe("string");
        } finally {
          // Clean up temp file
          await fs.unlink(tempFilePath).catch(() => {});
        }
      }, 30000); // 30 second timeout for upload
    });

    describe("downloadFile", () => {
      it("should download or get URL for the uploaded file", async () => {
        if (!testTeamId || !testAdbId) {
          console.warn(
            "Skipping: ANYDB_TEST_TEAM_ID or ANYDB_TEST_ADB_ID not set",
          );
          return;
        }

        if (!uploadedFileAdoId) {
          console.warn("Skipping: No file was uploaded in previous test");
          return;
        }

        const result = await client.downloadFile({
          teamid: testTeamId,
          adbid: testAdbId,
          adoid: uploadedFileAdoId,
          cellpos: "A1",
          redirect: false,
        });

        expect(result).toHaveProperty("url");
        expect(typeof result.url).toBe("string");
        console.log(`✓ Got download URL for file ${uploadedFileAdoId}`);
      });
    });
  });

  describe("Error Handling", () => {
    it("should throw error for invalid record", async () => {
      await expect(
        client.getRecord("invalid-team", "invalid-db", "invalid-record"),
      ).rejects.toThrow();
    });

    it("should throw error for invalid team", async () => {
      await expect(
        client.listDatabasesForTeam("invalid-team-id"),
      ).rejects.toThrow();
    });
  });
});

// Log a message if tests are skipped
if (!shouldRunIntegrationTests) {
  console.log("\n⚠️  Integration tests are skipped.");
  console.log("To run integration tests, set these environment variables:");
  console.log("  - ANYDB_BASE_URL");
  console.log("  - ANYDB_API_KEY");
  console.log("  - ANYDB_USER_EMAIL");
  console.log("  - ANYDB_TEST_TEAM_ID (optional, for specific tests)");
  console.log("  - ANYDB_TEST_ADB_ID (optional, for specific tests)");
  console.log(
    "\nNote: A test record will be automatically created for tests that require an ADO ID.\n",
  );
}
