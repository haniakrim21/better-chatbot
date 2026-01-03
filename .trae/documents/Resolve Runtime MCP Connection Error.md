I have detected a runtime error in the server logs (Terminal 2) which the user might be referring to (or "21 logs" might be a misinterpretation of something else, but this is a real error needing fixing).

### Error Identification
*   **Error**: `[ccdf] MCP Client Docker: MCP error -32000: Connection closed`
*   **Context**: `[Runner] Error: API error occurred: {"error":"Server not found"}`
*   **Root Cause**: The application is trying to connect to a Docker MCP client (likely configured by default or in the DB), but it fails, causing a 500 error on `/discover/mcp`. This often happens if the MCP server configuration is invalid or the docker container/service isn't running/accessible.

### Plan

1.  **Investigate MCP Configuration**:
    *   Check how "Docker" MCP client is configured.
    *   It seems to be failing to connect. The error "Server not found" suggests the Docker MCP server isn't running or isn't accessible.

2.  **Fix**:
    *   Since I cannot easily start an external Docker MCP server, I should **disable** this failing MCP server to prevent runtime errors and 500 responses.
    *   I will verify if this "Docker" server is in the database seed data or default config and disable it or make it fail gracefully.

3.  **Verify**:
    *   Restart the dev server (or check if it recovers).
    *   Verify `/discover/mcp` loads without error.

4.  **Final Verification**:
    *   Run `pnpm test` one last time to ensure everything is clean.
