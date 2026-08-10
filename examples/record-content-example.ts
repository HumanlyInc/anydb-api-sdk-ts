/**
 * Example: Working with Record Content
 *
 * This example demonstrates the proper structure for record content
 * and how to create/update records with cell data.
 *
 * Required environment variables:
 * - ANYDB_API_KEY
 * - ANYDB_USER_EMAIL
 * - ANYDB_TEAM_ID
 * - ANYDB_ADB_ID
 *
 * Optional environment variables:
 * - ANYDB_BASE_URL (defaults to https://app.anydb.com/api)
 *
 * Run from the repository root:
 *
 * PowerShell:
 * $env:ANYDB_API_KEY="your-key"; $env:ANYDB_USER_EMAIL="you@example.com"; $env:ANYDB_TEAM_ID="your-team-id"; $env:ANYDB_ADB_ID="your-database-id"; npx tsx examples/record-content-example.ts
 *
 * Bash/Zsh:
 * ANYDB_API_KEY="your-key" ANYDB_USER_EMAIL="you@example.com" ANYDB_TEAM_ID="your-team-id" ANYDB_ADB_ID="your-database-id" npx tsx examples/record-content-example.ts
 *
 * Windows Command Prompt (cmd.exe):
 * set "ANYDB_API_KEY=your-key" && set "ANYDB_USER_EMAIL=you@example.com" && set "ANYDB_TEAM_ID=your-team-id" && set "ANYDB_ADB_ID=your-database-id" && npx tsx examples/record-content-example.ts
 */

import {
  AnyDBClient,
  ADOCellFormat,
  ADOCellValueType,
  ADOContent,
} from "anydb-api-sdk-ts";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const teamId = requireEnv("ANYDB_TEAM_ID");
const adbId = requireEnv("ANYDB_ADB_ID");

const client = new AnyDBClient({
  apiKey: requireEnv("ANYDB_API_KEY"),
  userEmail: requireEnv("ANYDB_USER_EMAIL"),
  baseURL: process.env.ANYDB_BASE_URL,
});

async function createRecordWithContent() {
  // Define content with full cell structure
  const content: ADOContent = {
    A1: {
      pos: "A1",
      key: "Name",
      type: ADOCellValueType.STRING,
      value: "Zinthu Zalazar",
      colspan: 1,
      rowspan: 1,
      props: {},
    },
    A2: {
      pos: "A2",
      key: "Age",
      type: ADOCellValueType.NUMBER,
      value: 45,
      colspan: 1,
      rowspan: 1,
      props: {},
    },
    C1: {
      pos: "C1",
      key: "text",
      type: ADOCellValueType.STRING,
      value: "Initial text",
      colspan: 1,
      rowspan: 1,
      props: {},
    },
  };

  const record = await client.createRecord({
    teamid: teamId,
    adbid: adbId,
    name: "Person Record",
    content: content,
  });

  console.log("Created record:", record);
  return record;
}

async function updateRecordContent(adoid: string) {
  // When updating, you can provide minimal cell data
  // Only pos and value are required, everything else will be left as is
  const record = await client.updateRecord({
    meta: {
      adoid: adoid,
      adbid: adbId,
      teamid: teamId,
    },
    content: {
      A1: {
        pos: "A1",
        value: "Updated Name",
      },
      C1: {
        pos: "C1",
        value: "should be replaced",
      },
    },
  });

  console.log("Updated record:", record);
  return record;
}

async function updateMultipleCells(adoid: string) {
  // Update multiple cells at once
  const record = await client.updateRecord({
    meta: {
      adoid: adoid,
      adbid: adbId,
      teamid: teamId,
      name: "Updated Person Record", // Can also update metadata
    },
    content: {
      A2: {
        pos: "A2",
        value: 46, // Just update the age
      },
      B2: {
        pos: "B2",
        value: "New cell value",
        key: "NewField", // Can optionally add more properties
        type: ADOCellValueType.STRING,
      },
    },
  });

  console.log("Updated record with multiple cells:", record);
  return record;
}

async function workWithDifferentTypes(adoid: string) {
  // Example with different cell value types
  const record = await client.updateRecord({
    meta: {
      adoid: adoid,
      adbid: adbId,
      teamid: teamId,
    },
    content: {
      A1: {
        pos: "A1",
        value: "String value",
        type: ADOCellValueType.STRING,
      },
      A2: {
        pos: "A2",
        value: 123,
        type: ADOCellValueType.NUMBER,
      },
      A3: {
        pos: "A3",
        value: true,
        type: ADOCellValueType.BOOLEAN,
      },
      A4: {
        pos: "A4",
        value: ["item1", "item2"],
        type: ADOCellValueType.ARRAY,
      },
      A5: {
        pos: "A5",
        value: { nested: "object" },
        type: ADOCellValueType.OBJECT,
      },
    },
  });

  console.log("Updated record with different types:", record);
  return record;
}

async function createChildRecord(parentRecordAdoid: string) {
  // The create-record API calls the parent relationship field `attach`.
  // Setting it to the parent ADOID makes this new record a child of that
  // record. The same ADOID is used as `parentid` when listing its children.
  const record = await client.createRecord({
    teamid: teamId,
    adbid: adbId,
    name: "Child Record",
    attach: parentRecordAdoid,
    content: {
      A1: {
        pos: "A1",
        key: "Name",
        type: ADOCellValueType.STRING,
        value: "Child Record",
      },
    },
  });

  console.log("Created child record attached to the Person record:", record);
  return record;
}

async function createSheetWithReference(personRecordAdoid: string) {
  // Reference expressions use the target record's ADOID as the object ID.
  const personRecordExpression = `O@${personRecordAdoid}!F@GO!M@MINI`;

  const record = await client.createRecord({
    teamid: teamId,
    adbid: adbId,
    name: "Person Reference Sheet",
    content: {
      E5: {
        pos: "E5",
        type: ADOCellValueType.REF,
        format: ADOCellFormat.REF,
        colspan: 1,
        rowspan: 1,
        props: {
          ATTACHMENTS_TEMPLATE_NAME: {
            type: "string",
            value: "Sheet",
            expr: "",
            proptype: "CELL",
          },
        },
        key: "My Reference",
        value: "",
        expr: personRecordExpression,
        msg: "",
        display: "",
        comments: {
          comments: [],
        },
      },
    },
  });

  console.log("Created sheet with person record reference:", record);
  return record;
}

async function addLookupCell(
  referenceSheetAdoid: string,
  referenceCellPosition: string,
  objectLabel: string,
) {
  // DYNREF reads objectLabel from the record linked by referenceCellPosition.
  const lookupExpression = `DYNREF(${referenceCellPosition},{{${objectLabel}}},"GO")`;

  const record = await client.updateRecord({
    meta: {
      adoid: referenceSheetAdoid,
      adbid: adbId,
      teamid: teamId,
    },
    content: {
      F5: {
        pos: "F5",
        type: ADOCellValueType.STRING,
        format: ADOCellFormat.LOOKUP,
        colspan: 1,
        rowspan: 1,
        props: {},
        key: "Lookup Age",
        value: "",
        expr: lookupExpression,
        msg: "",
        display: "",
        comments: {
          comments: [],
        },
      },
    },
  });

  console.log("Added lookup cell to the person reference sheet:", record);
  return record;
}

// Run examples
async function main() {
  try {
    // 1. Create the Person record with initial Name, Age, and text cells.
    // Keep its ADOID because every later person update and reference targets it.
    const newRecord = await createRecordWithContent();

    // 2. Update only selected cell values on the existing Person record.
    // Fields omitted from these cell payloads remain unchanged.
    await updateRecordContent(newRecord.meta.adoid);

    // 3. Update several cells in one request and rename the Person record.
    await updateMultipleCells(newRecord.meta.adoid);

    // 4. Demonstrate values stored with the supported AnyDB cell types.
    await workWithDifferentTypes(newRecord.meta.adoid);

    // 5. Create a child record attached to the Person record. During creation,
    // `attach` receives the parent ADOID; listing children uses it as `parentid`.
    await createChildRecord(newRecord.meta.adoid);

    // 6. Create a second sheet whose E5 cell references the Person record.
    // The reference expression embeds the Person record's ADOID.
    const referenceSheet = await createSheetWithReference(newRecord.meta.adoid);

    // 7. Add an F5 lookup to the second sheet. DYNREF follows the reference
    // in E5 and reads the cell labeled "Age" from the linked Person record.
    await addLookupCell(referenceSheet.meta.adoid, "E5", "Age");
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
