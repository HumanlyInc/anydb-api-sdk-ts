#!/bin/bash
# Example script to run integration tests with credentials

# Set your AnyDB credentials
export ANYDB_BASE_URL="https://your-api.anydb.com/api"
export ANYDB_API_KEY="your-api-key-here"
export ANYDB_USER_EMAIL="your-email@example.com"

# Optional: Set test IDs for specific tests
export ANYDB_TEST_TEAM_ID="your-team-id"
export ANYDB_TEST_ADB_ID="your-database-id"
export ANYDB_TEST_ADO_ID="your-record-id"

# Run integration tests
npm run test:integration
