/**
 * Example: Browser File Upload
 *
 * This example demonstrates how to use AnyDB SDK in browser apps.
 * It uploads a selected File from an <input type="file"> element.
 */

import { AnyDBClient } from "anydb-api-sdk-ts";

const client = new AnyDBClient({
  apiKey: "your-api-key",
  userEmail: "your-email@example.com",
  baseURL: "https://app.anydb.com/api",
  runtime: "browser",
  uploadTransport: "fetch",
});

export async function uploadSelectedFile(params: {
  file: File;
  teamid: string;
  adbid: string;
  parentAdoid: string;
  cellpos?: string;
}) {
  const { file, teamid, adbid, parentAdoid, cellpos = "A1" } = params;

  const uploadedFileAdoid = await client.uploadFile({
    filename: file.name,
    fileContent: await file.arrayBuffer(),
    teamid,
    adbid,
    adoid: parentAdoid,
    cellpos,
    contentType: file.type || "application/octet-stream",
  });

  return uploadedFileAdoid;
}

// Usage with an existing file input element:
//
// const input = document.getElementById("fileInput") as HTMLInputElement;
// const file = input.files?.[0];
// if (!file) throw new Error("No file selected");
//
// const uploadedFileAdoid = await uploadSelectedFile({
//   file,
//   teamid: "team123",
//   adbid: "db456",
//   parentAdoid: "record789",
//   cellpos: "A1",
// });
//
// console.log("Uploaded file ADOID:", uploadedFileAdoid);
