# Running Tests

This SDK includes both unit tests (with mocked dependencies) and integration tests (against real API).

## Unit Tests

Unit tests use mocked axios calls and don't require any real credentials:

```bash
# Run unit tests
npm test

# Run unit tests in watch mode
npm run test:watch

# Run unit tests with coverage
npm run test:coverage
```

## Integration Tests

Integration tests run against a real AnyDB API instance. To run them:

### 1. Set up environment variables

Create a `.env` file in the project root (or set environment variables):

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Required
ANYDB_BASE_URL=https://your-api.anydb.com/api
ANYDB_API_KEY=your-api-key-here
ANYDB_USER_EMAIL=your-email@example.com

# Optional - for specific record/database tests
ANYDB_TEST_TEAM_ID=your-team-id
ANYDB_TEST_ADB_ID=your-database-id
ANYDB_TEST_ADO_ID=your-record-id
```

### 2. Run integration tests

```bash
# Run integration tests
npm run test:integration

# Or set variables inline
ANYDB_BASE_URL=https://api.example.com ANYDB_API_KEY=key123 ANYDB_USER_EMAIL=test@example.com npm run test:integration

# Run all tests (unit + integration)
npm run test:all
```

### Test Coverage

- **Unit Tests**: 27 tests covering all SDK methods with mocked dependencies
- **Integration Tests**: Real API tests for record operations, file uploads/downloads, and error handling

### Notes

- Integration tests will be **skipped** if environment variables are not set
- Integration tests may create temporary records/files in your AnyDB instance
- File upload tests create temporary test files that are automatically cleaned up
- Integration tests have longer timeouts (30s) to accommodate network requests
