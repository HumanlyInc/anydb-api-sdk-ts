# AnyDB SDK

Official TypeScript/JavaScript SDK for [AnyDB](https://www.anydb.com) - The object-based platform for managing custom business operations. Provides a simple and type-safe way to manage records, databases, teams, and files.

## About AnyDB

[AnyDB](https://www.anydb.com) is an object-based platform for managing custom business operations.

Most software forces work into rigid tables, fixed modules, or predefined workflows. Real operations do not work that way. They are made up of things that belong together and things that relate to each other.

AnyDB lets you model your business the way it actually runs.

### The Problem AnyDB Solves

Operational data is usually fragmented:

- Information spread across spreadsheets, tools, folders, and emails
- Records split across multiple tables that only make sense when joined
- Files and notes disconnected from the data they belong to
- Systems that break when workflows evolve

AnyDB replaces this with complete, connected business records.

Visit [www.anydb.com](https://www.anydb.com) to learn more.

## Installation

```bash
npm install anydb-api-sdk-ts
```

## Getting Your API Key

Before using the SDK, you'll need to obtain your API key from [AnyDB](https://www.anydb.com):

1. Log in to your AnyDB account at [app.anydb.com](https://app.anydb.com)
2. Click on the **user icon** in the bottom right corner of the browser UI
3. In the Profile Dialog that opens, navigate to the **Integration** tab
4. Copy your API key from the Integration settings

Your API key is unique to your account and should be kept secure. Never commit it to version control or share it publicly.

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

List all records in a database with pagination support.

```typescript
const response = await client.listRecords("teamid", "adbid");
console.log(response.items); // Array of records
console.log(response.total); // Total count
console.log(response.hasmore); // Has more pages

// With parent filter (for folder hierarchy)
const childRecords = await client.listRecords("teamid", "adbid", "parentid");

// With pagination
const page2 = await client.listRecords(
  "teamid",
  "adbid",
  undefined,
  undefined,
  undefined,
  "50", // pagesize
  response.lastmarker, // lastmarker from previous response
);
// Returns: ListRecordsResponse { items, lastmarker, hasmore, total }
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
import { ADOCellValueType } from "anydb-api-sdk-ts";

const newRecord = await client.createRecord({
  teamid: "teamid",
  adbid: "adbid",
  name: "New Record",
  content: {
    A1: {
      pos: "A1",
      key: "firstName",
      type: ADOCellValueType.STRING,
      value: "John",
      colspan: 1,
      rowspan: 1,
    },
    B1: {
      pos: "B1",
      key: "age",
      type: ADOCellValueType.NUMBER,
      value: 30,
      colspan: 1,
      rowspan: 1,
    },
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

#### Create Public Share Link

Create a public share link for a record with sensible defaults.

- Uses `PUBLIC_USER_ID` internally for public sharing
- Default `role` is `"viewer"`
- Default `withattachments` is `false`

```typescript
const share = await client.createPublicShareLink({
  teamid: "teamid",
  adbid: "adbid",
  adoid: "adoid",
  // Optional:
  // role: "viewer" | "editor" (default: "viewer")
  // withattachments: boolean (default: false)
  // name: string
  // shareExpiryDate:  unix timestamp
});

console.log(share);
```

#### Create Private Share Link

Create a private share link for one or more specific user IDs.

- `userIds` is required (string or string[])
- `groupIds` is optional (string or string[])
- Default `role` is `"viewer"`
- Default `withattachments` is `false`

```typescript
const privateShare = await client.createPrivateShareLink({
  teamid: "teamid",
  adbid: "adbid",
  adoid: "adoid",
  userIds: ["111111111111111111111111", "222222222222222222222222"],
  // groupIds: ["333333333333333333333333"],
  // Optional:
  // role: "viewer" | "editor" (default: "viewer")
  // withattachments: boolean (default: false)
  // name: string
  // shareExpiryDate: unix timestamp
});

console.log(privateShare);
```

#### Delete Share

Delete an existing share by `shareid` (uses `sharetype: "item"`).

```typescript
await client.deleteShare({
  shareid: "shareid",
  teamid: "teamid",
});
```

#### Share Lifecycle Example

Create a private share, then delete it.

```typescript
const created = await client.createPrivateShareLink({
  teamid: "teamid",
  adbid: "adbid",
  adoid: "adoid",
  userIds: ["111111111111111111111111"],
});

const shareid = created.shareid || created.id || created._id;

await client.deleteShare({
  shareid,
  teamid: "teamid",
});
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

#### Upload File

Upload a file in one call (handles all steps automatically including creating a child file record).

```typescript
// Upload from file content
const fileAdoid = await client.uploadFile({
  filename: "document.pdf",
  fileContent: fileBuffer, // Buffer or string
  teamid: "teamid",
  adbid: "adbid",
  adoid: "parentAdoid", // Parent record to attach file to
  cellpos: "A1", // Optional, defaults to "A1"
  contentType: "application/pdf", // Optional
});

// Upload from file path
const fileAdoid = await client.uploadFile({
  filename: "document.pdf",
  filepath: "/path/to/document.pdf",
  teamid: "teamid",
  adbid: "adbid",
  adoid: "parentAdoid",
  cellpos: "A1",
});

// Returns: string (ADOID of the created file record)
console.log("File uploaded with ID:", fileAdoid);
```

#### Remove Record

Remove or delete a record.

```typescript
import { NULL_OBJECTID } from "anydb-api-sdk-ts";

// Remove from specific parent (detach)
await client.removeRecord({
  adoid: "adoid",
  adbid: "adbid",
  teamid: "teamid",
  removefromids: "parentAdoid1,parentAdoid2", // Comma-separated parent IDs
});

// Delete completely
await client.removeRecord({
  adoid: "adoid",
  adbid: "adbid",
  teamid: "teamid",
  removefromids: NULL_OBJECTID, // Special constant for deletion
});
```

## Understanding AnyDB Concepts

- **teamid**: MongoDB ObjectId identifying a team/organization. Each team is a separate workspace.
- **adbid**: MongoDB ObjectId for an ADB (AnyDB Database). Similar to a spreadsheet or table.
- **adoid**: MongoDB ObjectId for an ADO (AnyDB Object/Record). Similar to a row in a spreadsheet.
- **cellpos**: Cell position identifier (e.g., "A1", "B2"). Valid positions are A1-A9, B1-B9, etc. (Note: A0, B0, etc. are not valid)

### Predefined Templates

AnyDB provides predefined templates for common record types:

```typescript
import { PredefinedTemplateAdoIds } from "anydb-api-sdk-ts";

// Create a folder
const folder = await client.createRecord({
  teamid,
  adbid,
  name: "My Folder",
  template: PredefinedTemplateAdoIds.FOLDER_TEMPLATE_ADOID,
});

// Create a page
const page = await client.createRecord({
  teamid,
  adbid,
  name: "My Page",
  template: PredefinedTemplateAdoIds.PAGE_TEMPLATE_ADOID,
});

// Available templates:
// - FILE_TEMPLATE_ADOID
// - FOLDER_TEMPLATE_ADOID
// - PAGE_TEMPLATE_ADOID
// - LINK_TEMPLATE_ADOID
// - VIEW_TEMPLATE_ADOID
```

Learn more about AnyDB concepts in the [official documentation](https://www.anydb.com/support).

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
      A1: {
        pos: "A1",
        key: "description",
        type: "string",
        value: "Hello World",
        colspan: 1,
        rowspan: 1,
      },
    },
  });

  console.log("Created record:", record.meta.adoid);

  // 4. Upload a file to the record
  const fileBuffer = Buffer.from("Hello, this is a test file");
  const fileAdoid = await client.uploadFile({
    filename: "test.txt",
    fileContent: fileBuffer,
    teamid,
    adbid,
    adoid: record.meta.adoid,
    cellpos: "A1",
    contentType: "text/plain",
  });

  console.log("File uploaded with ID:", fileAdoid);

  // 5. Download the file
  const { url } = await client.downloadFile({
    teamid,
    adbid,
    adoid: fileAdoid,
    cellpos: "A1",
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

## Resources

- **Website**: [www.anydb.com](https://www.anydb.com)
- **Documentation**: [www.anydb.com/support](https://www.anydb.com/support)
- **GitHub Issues**: [github.com/HumanlyInc/anydb-api-sdk-ts/issues](https://github.com/HumanlyInc/anydb-api-sdk-ts/issues)
- **Email Support**: support@anydb.com
