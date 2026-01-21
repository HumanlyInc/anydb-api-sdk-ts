/**
 * Example: Working with Record Content
 *
 * This example demonstrates the proper structure for record content
 * and how to create/update records with cell data.
 */

import { AnyDBClient, ADOCellValueType, ADOContent } from "anydb-api-sdk-ts";

const client = new AnyDBClient({
  apiKey: "your-api-key",
  userEmail: "your-email@example.com",
  baseURL: "https://api.anydb.com/api",
});

async function createRecordWithContent() {
  // Define content with full cell structure
  const content: ADOContent = {
    A0: {
      pos: "A0",
      key: "Name",
      type: ADOCellValueType.STRING,
      value: "Zinthu Zalazar",
      colspan: 1,
      rowspan: 1,
      props: {},
    },
    A1: {
      pos: "A1",
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
    teamid: "team123",
    adbid: "db456",
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
      adbid: "db456",
      teamid: "team123",
    },
    content: {
      A0: {
        pos: "A0",
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
      adbid: "db456",
      teamid: "team123",
      name: "Updated Person Record", // Can also update metadata
    },
    content: {
      A1: {
        pos: "A1",
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
      adbid: "db456",
      teamid: "team123",
    },
    content: {
      A0: {
        pos: "A0",
        value: "String value",
        type: ADOCellValueType.STRING,
      },
      A1: {
        pos: "A1",
        value: 123,
        type: ADOCellValueType.NUMBER,
      },
      A2: {
        pos: "A2",
        value: true,
        type: ADOCellValueType.BOOLEAN,
      },
      A3: {
        pos: "A3",
        value: "2026-01-21",
        type: ADOCellValueType.DATE,
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

// Run examples
async function main() {
  try {
    const newRecord = await createRecordWithContent();
    await updateRecordContent(newRecord.meta.adoid);
    await updateMultipleCells(newRecord.meta.adoid);
    await workWithDifferentTypes(newRecord.meta.adoid);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
