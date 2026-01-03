I have identified the type errors in the test files. The errors are due to a mismatch between the expected `McpServerSelect` type and the mock objects provided in the tests. Specifically, the `enabled` property is missing from the mock objects.

### Error Analysis
*   **Error 1**: `src/lib/ai/mcp/create-mcp-clients-manager.test.ts:215:53`
    *   `Argument of type '{ ... }' is not assignable to parameter of type 'McpServerSelect'. Property 'enabled' is missing...`
*   **Error 2**: `src/lib/ai/mcp/db-mcp-config-storage.test.ts:103:59`
    *   `Argument of type '{ ... }' is not assignable to parameter of type 'McpServerSelect'. Property 'enabled' is missing...`

The `McpServerSelect` type (defined in `src/types/mcp.ts`) requires an `enabled: boolean` property, but the test mocks are not providing it in the `mockResolvedValue` calls.

### Plan

1.  **Fix Type Error in `create-mcp-clients-manager.test.ts`**:
    *   Add `enabled: true` (or `false`) to the mock object in the `persistClient` test case.

2.  **Fix Type Error in `db-mcp-config-storage.test.ts`**:
    *   Add `enabled: true` (or `false`) to the mock object in the `save` test case.

3.  **Verify Resolution**:
    *   Run `pnpm check-types` again to confirm the errors are resolved.

4.  **Documentation**:
    *   Update `INSTALL_AND_TEST.md` to reflect that type checking now passes.
