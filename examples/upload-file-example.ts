/**
 * Example: File Upload with New Flow
 *
 * This example demonstrates the updated uploadFile flow which now:
 * 1. Creates a child file record automatically
 * 2. Uploads the file to that child record
 */

import { AnyDBClient, PredefinedTemplateAdoIds } from "anydb-api-sdk-ts";

const client = new AnyDBClient({
  apiKey: "your-api-key",
  userEmail: "your-email@example.com",
  baseURL: "https://api.anydb.com/api",
});

async function uploadFileExample() {
  // Upload using file content (Buffer)
  const fileContent = Buffer.from("Hello, World!");

  const result = await client.uploadFile({
    filename: "hello.txt",
    fileContent: fileContent,
    teamid: "team123",
    adbid: "db456",
    adoid: "parent789", // The file will be created as a child of this record
    cellpos: "A1",
    contentType: "text/plain",
  });

  console.log("Upload successful:", result);

  // The upload process automatically:
  // 1. Created a new record with FILE_TEMPLATE_ADOID
  // 2. Attached it to parent789
  // 3. Uploaded the file to the new record
}

async function uploadFromDiskExample() {
  // Upload from file path
  const result = await client.uploadFile({
    filename: "document.pdf",
    filepath: "/path/to/document.pdf",
    teamid: "team123",
    adbid: "db456",
    adoid: "parent789",
    cellpos: "B2",
    contentType: "application/pdf",
  });

  console.log("Upload successful:", result);
}

// Available template IDs if you need them for other operations
console.log("File Template ID:", PredefinedTemplateAdoIds.FILE_TEMPLATE_ADOID);
console.log(
  "Folder Template ID:",
  PredefinedTemplateAdoIds.FOLDER_TEMPLATE_ADOID,
);
console.log("Page Template ID:", PredefinedTemplateAdoIds.PAGE_TEMPLATE_ADOID);
console.log("Link Template ID:", PredefinedTemplateAdoIds.LINK_TEMPLATE_ADOID);
console.log("View Template ID:", PredefinedTemplateAdoIds.VIEW_TEMPLATE_ADOID);

// Run examples
uploadFileExample().catch(console.error);
uploadFromDiskExample().catch(console.error);
