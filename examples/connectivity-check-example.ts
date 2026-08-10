/**
 * Example: Connectivity Check
 *
 * This example verifies that the SDK can connect to AnyDB and authenticate
 * with your API key and user email before running other operations.
 *
 * Required environment variables:
 * - ANYDB_API_KEY
 * - ANYDB_USER_EMAIL
 *
 * Optional environment variables:
 * - ANYDB_BASE_URL (defaults to https://app.anydb.com/api)
 * - ANYDB_TEAM_ID (checks database access for a specific team)
 *
 * Run from the repository root:
 *
 * PowerShell:
 * $env:ANYDB_API_KEY="your-key"; $env:ANYDB_USER_EMAIL="you@example.com"; $env:ANYDB_BASE_URL="http://localhost:4000/api"; $env:ANYDB_TEAM_ID="your-team-id"; npx tsx examples/connectivity-check-example.ts
 *
 * Bash/Zsh:
 * ANYDB_API_KEY="your-key" ANYDB_USER_EMAIL="you@example.com" ANYDB_BASE_URL="http://localhost:4000/api" ANYDB_TEAM_ID="your-team-id" npx tsx examples/connectivity-check-example.ts
 *
 * Windows Command Prompt (cmd.exe):
 * set "ANYDB_API_KEY=your-key" && set "ANYDB_USER_EMAIL=you@example.com" && set "ANYDB_BASE_URL=http://localhost:4000/api" && set "ANYDB_TEAM_ID=your-team-id" && npx tsx examples/connectivity-check-example.ts
 */

import { AnyDBClient } from "anydb-api-sdk-ts";

const apiKey = process.env.ANYDB_API_KEY;
const userEmail = process.env.ANYDB_USER_EMAIL;
const baseURL = process.env.ANYDB_BASE_URL;
const teamId = process.env.ANYDB_TEAM_ID;

if (!apiKey || !userEmail) {
  throw new Error(
    "Missing required environment variables: ANYDB_API_KEY and ANYDB_USER_EMAIL",
  );
}

const client = new AnyDBClient({
  apiKey,
  userEmail,
  baseURL,
});

async function checkConnectivity() {
  console.log("Checking AnyDB connectivity...");

  const teams = await client.listTeams();
  console.log(`Connected successfully. Found ${teams.length} team(s).`);

  if (teams.length === 0) {
    console.log("No teams are available for these credentials.");
    return;
  }

  const selectedTeamId = teamId || teams[0].teamid;
  const selectedTeam = teams.find((team) => team.teamid === selectedTeamId);

  console.log(
    `Checking database access for team: ${
      selectedTeam?.name || selectedTeamId
    }`,
  );

  const databases = await client.listDatabasesForTeam(selectedTeamId);
  console.log(`Database check succeeded. Found ${databases.length} database(s).`);
}

checkConnectivity().catch((error) => {
  console.error("Connectivity check failed:", error);
  process.exitCode = 1;
});
