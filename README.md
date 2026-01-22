# AnyDB SDK

TypeScript/JavaScript SDK for interacting with AnyDB API. Provides a simple and type-safe way to manage records, databases, teams, and files in AnyDB (www.anydb.com).

## Installation

```bash
npm install anydb-api-sdk-ts
```

## Quick Start

```typescript
import { AnyDBClient } from "anydb-api-sdk-ts";

// Initialize the client
const client = new AnyDBClient({
  apiKey: "your-api-key",
  userEmail: "user@example.com",
  baseURL: "https://app.anydb.com/api", // Optional, defaults to localhost
});

// List teams
const teams = await client.listTeams();
console.log("Teams:", teams);

// Get a record
const record = await client.getRecord("teamid", "adbid", "adoid");
console.log("Record:", record);
```

## Features

- ✅ **Full TypeScript support** with type definitions
- ✅ **Record operations** - CRUD operations for AnyDB records
- ✅ **File management** - Upload and download files from record cells
- ✅ **Team & database discovery** - List teams and databases
- ✅ **Search functionality** - Search records by keyword
- ✅ **Error handling** - Comprehensive error messages
- ✅ **Debug mode** - Optional request/response logging

## API Reference

### Client Initialization

```typescript
const client = new AnyDBClient({
  apiKey: string;        // Required: Your AnyDB API key
  userEmail: string;     // Required: User email for authentication
  baseURL?: string;      // Optional: API base URL (default: http://localhost:3000/api)
  timeout?: number;      // Optional: Request timeout in ms (default: 30000)
});
```

### Record Operations

#### List Teams

Get all teams accessible with your credentials.

```typescript
const teams = await client.listTeams();
// Returns: Team[]
```

#### List Databases for Team

Get all databases within a team.

```typescript
const databases = await client.listDatabasesForTeam("teamid");
// Returns: ADB[]
```

#### List Records

List all records in a database.

```typescript
const records = await client.listRecords("teamid", "adbid");
// With parent filter
const childRecords = await client.listRecords("teamid", "adbid", "parentid");
// Returns: ADORecord[]
```

#### Get Record

Get a specific record with all its data.

```typescript
const record = await client.getRecord("teamid", "adbid", "adoid");
// Returns: ADORecord
```

#### Create Record

Create a new record in a database.

```typescript
const newRecord = await client.createRecord({
  teamid: "teamid",
  adbid: "adbid",
  name: "New Record",
  content: {
    A1: { value: "Hello" },
    B1: { value: "World" },
  },
});
// Returns: ADORecord
```

#### Update Record

Update an existing record.

```typescript
const updatedRecord = await client.updateRecord({
  meta: {
    adoid: "adoid",
    adbid: "adbid",
    teamid: "teamid",
    name: "Updated Name",
    description: "New description",
  },
  content: {
    A1: { value: "Updated value" },
  },
});
// Returns: ADORecord
```

#### Search Records

Search for records by keyword.

```typescript
const results = await client.searchRecords({
  teamid: "teamid",
  adbid: "adbid",
  search: "keyword",
  limit: "10",
});
// Returns: ADORecord[]
```

### File Operations

#### Download File

Download a file or get its URL.

```typescript
// Get download URL
const { url } = await client.downloadFile({
  teamid: "teamid",
  adbid: "adbid",
  adoid: "adoid",
  cellpos: "C5",
  redirect: false, // Return URL instead of redirecting
  preview: false, // Download instead of preview
});
console.log("Download URL:", url);
```

#### Upload File (Simple)

Upload a file in one call (handles all 3 steps automatically).

```typescript
const result = await client.uploadFile(
  fileBuffer, // Buffer or string
  "document.pdf", // filename
  "teamid",
  "adbid",
  "adoid",
  "C5", // cellpos (optional)
  "application/pdf", // contentType (optional)
);
```

#### Upload File (Manual 3-Step Process)

For more control, you can use the 3-step process manually:

```typescript
// Step 1: Get upload URL
const { url } = await client.getUploadUrl({
  filename: "document.pdf",
  teamid: "teamid",
  adbid: "adbid",
  adoid: "adoid",
  filesize: fileBuffer.length.toString(),
  cellpos: "C5",
});

// Step 2: Upload file to cloud storage
await client.uploadFileToUrl(url, fileBuffer, "application/pdf");

// Step 3: Complete the upload
const result = await client.completeUpload({
  filesize: fileBuffer.length.toString(),
  teamid: "teamid",
  adbid: "adbid",
  adoid: "adoid",
  cellpos: "C5",
});
```

## Understanding AnyDB Concepts

- **teamid**: MongoDB ObjectId identifying a team/organization. Each team is a separate workspace.
- **adbid**: MongoDB ObjectId for an ADB (AnyDB Database). Similar to a spreadsheet or table.
- **adoid**: MongoDB ObjectId for an ADO (AnyDB Object/Record). Similar to a row in a spreadsheet.
- **cellpos**: Cell position identifier (e.g., "A1", "B2"). Each record has cells organized in a grid.

## Debug Mode

Enable debug logging by setting the environment variable:

```bash
DEBUG_ANYDB=1 node your-script.js
```

This will log all API requests and responses to the console.

## Error Handling

The SDK throws descriptive errors that include the HTTP status code and error message:

```typescript
try {
  const record = await client.getRecord("teamid", "adbid", "invalid-adoid");
} catch (error) {
  console.error(error.message);
  // Example: "AnyDB API Error (404): Record not found"
}
```

## TypeScript Support

The SDK is written in TypeScript and includes full type definitions. All types are exported:

```typescript
import type {
  ADORecord,
  Team,
  ADB,
  CreateRecordParams,
  UpdateRecordParams,
  // ... and more
} from "anydb-api-sdk-ts";
```

## Examples

### Complete Workflow Example

```typescript
import { AnyDBClient } from "anydb-api-sdk-ts";

async function main() {
  const client = new AnyDBClient({
    apiKey: process.env.ANYDB_API_KEY!,
    userEmail: process.env.ANYDB_USER_EMAIL!,
  });

  // 1. List teams
  const teams = await client.listTeams();
  const teamid = teams[0].teamid;

  // 2. List databases
  const databases = await client.listDatabasesForTeam(teamid);
  const adbid = databases[0].adbid;

  // 3. Create a new record
  const record = await client.createRecord({
    teamid,
    adbid,
    name: "My New Record",
    content: {
      A1: { value: "Hello" },
      B1: { value: "World" },
    },
  });

  console.log("Created record:", record.adoid);

  // 4. Upload a file to the record
  const fileBuffer = Buffer.from("Hello, this is a test file");
  await client.uploadFile(
    fileBuffer,
    "test.txt",
    teamid,
    adbid,
    record.adoid,
    "C1",
    "text/plain",
  );

  console.log("File uploaded successfully");

  // 5. Download the file
  const { url } = await client.downloadFile({
    teamid,
    adbid,
    adoid: record.adoid,
    cellpos: "C1",
    redirect: false,
  });

  console.log("Download URL:", url);
}

main().catch(console.error);
```

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For issues and questions:

- GitHub Issues: https://github.com/HumanlyInc/anydb-api-sdk-ts/issues
- Email: support@anydb.com
- Support: www.anydb.com/support
