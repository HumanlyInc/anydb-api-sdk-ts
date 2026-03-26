import { AnyDBClient } from "anydb-api-sdk-ts";

const app = document.getElementById("app");

if (!app) {
  throw new Error("Missing #app container");
}

app.innerHTML = `
  <main style="max-width: 720px; margin: 40px auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.4;">
    <h1 style="margin-bottom: 8px;">AnyDB Browser Upload Demo</h1>
    <p style="margin-top: 0; color: #444;">Uploads a selected file to AnyDB from browser runtime.</p>

    <label style="display:block; margin: 10px 0 4px;">API Key</label>
    <input id="apiKey" type="password" placeholder="anydb api key" style="width:100%; padding:8px;" />

    <label style="display:block; margin: 10px 0 4px;">User Email</label>
    <input id="userEmail" type="email" placeholder="user@example.com" style="width:100%; padding:8px;" />

    <label style="display:block; margin: 10px 0 4px;">Team ID</label>
    <input id="teamid" type="text" placeholder="teamid" style="width:100%; padding:8px;" />

    <label style="display:block; margin: 10px 0 4px;">Database ID</label>
    <input id="adbid" type="text" placeholder="adbid" style="width:100%; padding:8px;" />

    <label style="display:block; margin: 10px 0 4px;">Parent Record ID</label>
    <input id="parentAdoid" type="text" placeholder="parent adoid" style="width:100%; padding:8px;" />

    <label style="display:block; margin: 10px 0 4px;">Cell Position</label>
    <input id="cellpos" type="text" value="A1" style="width:100%; padding:8px;" />

    <label style="display:block; margin: 10px 0 4px;">File</label>
    <input id="fileInput" type="file" />

    <div style="margin-top: 16px;">
      <button id="uploadBtn" style="padding: 10px 14px; cursor:pointer;">Upload</button>
    </div>

    <pre id="output" style="margin-top: 16px; padding: 12px; background: #f6f8fa; border:1px solid #ddd; white-space: pre-wrap;"></pre>
  </main>
`;

const apiKeyInput = document.getElementById("apiKey") as HTMLInputElement;
const userEmailInput = document.getElementById("userEmail") as HTMLInputElement;
const teamInput = document.getElementById("teamid") as HTMLInputElement;
const dbInput = document.getElementById("adbid") as HTMLInputElement;
const parentInput = document.getElementById("parentAdoid") as HTMLInputElement;
const cellposInput = document.getElementById("cellpos") as HTMLInputElement;
const fileInput = document.getElementById("fileInput") as HTMLInputElement;
const uploadBtn = document.getElementById("uploadBtn") as HTMLButtonElement;
const output = document.getElementById("output") as HTMLPreElement;

function log(message: string) {
  output.textContent = message;
}

uploadBtn.addEventListener("click", async () => {
  const file = fileInput.files?.[0];
  if (!file) {
    log("Select a file first.");
    return;
  }

  if (
    !apiKeyInput.value ||
    !userEmailInput.value ||
    !teamInput.value ||
    !dbInput.value ||
    !parentInput.value
  ) {
    log("Fill in API key, email, teamid, adbid, and parent adoid.");
    return;
  }

  uploadBtn.disabled = true;
  log("Uploading...");

  try {
    const client = new AnyDBClient({
      apiKey: apiKeyInput.value,
      userEmail: userEmailInput.value,
      runtime: "browser",
      uploadTransport: "fetch",
      debug: true,
    });

    const uploadedAdoid = await client.uploadFile({
      filename: file.name,
      fileContent: await file.arrayBuffer(),
      teamid: teamInput.value,
      adbid: dbInput.value,
      adoid: parentInput.value,
      cellpos: cellposInput.value || "A1",
      contentType: file.type || "application/octet-stream",
    });

    log(`Upload succeeded. File ADOID: ${uploadedAdoid}`);
  } catch (error) {
    log(
      `Upload failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    uploadBtn.disabled = false;
  }
});
