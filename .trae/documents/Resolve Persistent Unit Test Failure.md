I have identified the failing test that is likely the cause of the "21 logs" (actually 1 failed test in the 21 test files/suites output).

### Error Identification
*   **Test Failure**: `src/lib/ai/models.test.ts` > `customModelProvider file support metadata` > `includes default file support for OpenAI gpt-4.1`
*   **Assertion Error**: `expected undefined to deeply equal [ 'image/jpeg', 'image/png', ... ]`
*   **Root Cause**: The test expects `gpt-4.1` to be defined in `staticModels.openai` and registered with file support, but `gpt-4.1` is **NOT** present in the `staticModels.openai` object in `src/lib/ai/models.ts`. It seems `gpt-4.1` was removed or never added, but the test still expects it. The available models are `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `o1`, `o1-mini`, `o1-preview`, `o3-pro`, `gpt-5.2`, `gpt-5.2-pro`.

### Plan

1.  **Fix Test Case**:
    *   Update `src/lib/ai/models.test.ts` to test against an existing model like `gpt-4o` instead of the non-existent `gpt-4.1`.
    *   Alternatively, if `gpt-4.1` was intended to be a future mapping, it should be added to `models.ts`. Given the current state, updating the test to use a valid model is the correct fix.

2.  **Verify Resolution**:
    *   Run `pnpm test` again to ensure all tests pass.

3.  **Documentation**:
    *   Update `INSTALL_AND_TEST.md` to confirm unit tests are passing.
