# Record Content Structure

## Overview

AnyDB records contain structured content organized in a grid-like format with cell positions. Each cell has a position (like "A0", "A1", "B2") and contains data with metadata.

## Content Structure

Record content is a map of cell positions to cell data:

```typescript
type ADOContent = Record<string, ADOCell>;
```

### Cell Structure

Each cell in the content has the following structure:

```typescript
interface ADOCell {
  pos: string; // Required: Cell position (e.g., "A0", "B2", "C1")
  key?: string; // Optional: Field name/label
  type?: ADOCellValueType; // Optional: Value type
  value?: any; // Optional: The actual value
  colspan?: number; // Optional: Number of columns to span (default: 1)
  rowspan?: number; // Optional: Number of rows to span (default: 1)
  props?: Record<string, any>; // Optional: Additional properties
}
```

### Cell Value Types

```typescript
enum ADOCellValueType {
  STRING = "STRING",
  NUMBER = "NUMBER",
  BOOLEAN = "BOOLEAN",
  DATE = "DATE",
  ARRAY = "ARRAY",
  OBJECT = "OBJECT",
}
```

## Creating Records with Content

When creating a record, provide the full cell structure:

```typescript
import { AnyDBClient, ADOCellValueType } from "anydb-api-sdk-ts";

const client = new AnyDBClient({
  /* config */
});

const record = await client.createRecord({
  teamid: "team123",
  adbid: "db456",
  name: "Person Record",
  content: {
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
      value: "Some text",
      colspan: 1,
      rowspan: 1,
      props: {},
    },
  },
});
```

## Updating Records

When updating a record, you only need to provide the **minimal cell data**:

- `pos`: Required - the cell position
- `value`: Required - the new value
- Other fields are optional and will be left as is if not provided

```typescript
// Simple update - just pos and value
await client.updateRecord({
  meta: {
    adoid: "record123",
    adbid: "db456",
    teamid: "team123",
  },
  content: {
    A0: {
      pos: "A0",
      value: "New Name",
    },
    C1: {
      pos: "C1",
      value: "should be replaced",
    },
  },
});
```

### Update with Additional Properties

You can optionally include other properties when updating:

```typescript
await client.updateRecord({
  meta: {
    adoid: "record123",
    adbid: "db456",
    teamid: "team123",
  },
  content: {
    A1: {
      pos: "A1",
      value: 46,
      type: ADOCellValueType.NUMBER,
      key: "Age",
    },
  },
});
```

## TypeScript Types

The SDK provides proper TypeScript types for type safety:

```typescript
import {
  ADOCell, // Full cell structure
  ADOCellUpdate, // Minimal cell structure for updates
  ADOContent, // Content type (Record<string, ADOCell>)
  ADOCellValueType, // Enum for cell value types
} from "anydb-api-sdk-ts";

// Full cell (for reading or complete definitions)
const cell: ADOCell = {
  pos: "A0",
  key: "Name",
  type: ADOCellValueType.STRING,
  value: "John Doe",
  colspan: 1,
  rowspan: 1,
  props: {},
};

// Minimal cell for updates
const cellUpdate: ADOCellUpdate = {
  pos: "A0",
  value: "Jane Doe",
};

// Complete content structure
const content: ADOContent = {
  A0: cell,
  A1: { pos: "A1", key: "Age", type: ADOCellValueType.NUMBER, value: 30 },
};
```

## Examples

### Example 1: Create a Contact Record

```typescript
const contact = await client.createRecord({
  teamid: "team123",
  adbid: "contacts-db",
  name: "John Doe",
  content: {
    A0: {
      pos: "A0",
      key: "Email",
      type: ADOCellValueType.STRING,
      value: "john@example.com",
      colspan: 1,
      rowspan: 1,
      props: {},
    },
    A1: {
      pos: "A1",
      key: "Phone",
      type: ADOCellValueType.STRING,
      value: "+1-555-1234",
      colspan: 1,
      rowspan: 1,
      props: {},
    },
  },
});
```

### Example 2: Update Multiple Cells

```typescript
await client.updateRecord({
  meta: {
    adoid: contact.meta.adoid,
    adbid: "contacts-db",
    teamid: "team123",
    name: "John Doe - Updated",
  },
  content: {
    A0: { pos: "A0", value: "newemail@example.com" },
    A1: { pos: "A1", value: "+1-555-5678" },
    B0: { pos: "B0", value: "New York", key: "City" },
  },
});
```

### Example 3: Different Value Types

```typescript
const record = await client.createRecord({
  teamid: "team123",
  adbid: "data-db",
  name: "Mixed Data",
  content: {
    A0: {
      pos: "A0",
      key: "Name",
      type: ADOCellValueType.STRING,
      value: "Sample",
      colspan: 1,
      rowspan: 1,
      props: {},
    },
    A1: {
      pos: "A1",
      key: "Count",
      type: ADOCellValueType.NUMBER,
      value: 42,
      colspan: 1,
      rowspan: 1,
      props: {},
    },
    A2: {
      pos: "A2",
      key: "Active",
      type: ADOCellValueType.BOOLEAN,
      value: true,
      colspan: 1,
      rowspan: 1,
      props: {},
    },
    A3: {
      pos: "A3",
      key: "CreatedDate",
      type: ADOCellValueType.DATE,
      value: "2026-01-21",
      colspan: 1,
      rowspan: 1,
      props: {},
    },
    A4: {
      pos: "A4",
      key: "Tags",
      type: ADOCellValueType.ARRAY,
      value: ["tag1", "tag2", "tag3"],
      colspan: 1,
      rowspan: 1,
      props: {},
    },
    A5: {
      pos: "A5",
      key: "Metadata",
      type: ADOCellValueType.OBJECT,
      value: { custom: "data" },
      colspan: 1,
      rowspan: 1,
      props: {},
    },
  },
});
```

## Best Practices

1. **Creating Records**: Always provide the complete cell structure with all properties for clarity
2. **Updating Records**: Only include `pos` and `value` for simple updates to minimize payload
3. **Type Safety**: Use the provided TypeScript enums and types for better IDE support
4. **Cell Positions**: Use standard grid notation (A0, A1, B2, etc.)
5. **Value Types**: Always specify the correct `ADOCellValueType` to ensure proper data handling

## See Also

- [examples/record-content-example.ts](examples/record-content-example.ts) - Complete working examples
- [API Documentation](README.md) - Full SDK documentation
