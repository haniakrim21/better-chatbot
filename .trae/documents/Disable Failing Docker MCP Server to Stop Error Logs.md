I have confirmed that the "9 logs" errors are due to the "Docker" MCP server repeatedly failing to connect. This happens because the server is enabled in the database but the underlying Docker environment is not available or configured correctly.

To resolve this permanently and stop the error logs:

### Plan

1.  **Create Disablement Script**:
    *   Create a new script `scripts/disable-docker-mcp.ts`.
    *   This script will connect to the database, find the "Docker" MCP server, and set its `enabled` status to `false`.

2.  **Execute Fix**:
    *   Run `npx tsx scripts/disable-docker-mcp.ts`.
    *   This will immediately update the database state.

3.  **Verify**:
    *   Restart the development server (`pnpm dev`).
    *   Check the logs to confirm the error messages have stopped.

4.  **Prevent Recurrence**:
    *   Modify `scripts/seed-mcp.ts` to ensure that if the Docker MCP server is seeded in the future, it remains disabled by default (which it already is, but the script will ensure the *current* persistent state is fixed).
