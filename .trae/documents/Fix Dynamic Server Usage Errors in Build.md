I have identified the source of the errors. The user likely encountered build-time errors ("Dynamic server usage") which prevented the application from building or rendering correctly in production mode. These errors occur because several pages (`/discover/*`, `/knowledge`, `/teams`) are trying to access user session data (headers/cookies) during static generation.

To resolve this, I will force these pages to be dynamically rendered.

### Plan

1.  **Fix Dynamic Usage Errors**:
    *   Update `src/app/(chat)/discover/agents/page.tsx`
    *   Update `src/app/(chat)/discover/mcp/page.tsx`
    *   Update `src/app/(chat)/discover/workflows/page.tsx`
    *   Update `src/app/(chat)/knowledge/page.tsx`
    *   Update `src/app/(chat)/teams/page.tsx`
    *   **Action**: Add `export const dynamic = "force-dynamic";` to each file.

2.  **Verify Resolution**:
    *   Run `pnpm build` to ensure all "Dynamic server usage" errors are eliminated.
    *   This serves as the regression test to ensure the build passes.

3.  **Documentation**:
    *   Update `INSTALL_AND_TEST.md` to include a "Build & Deployment" section noting these changes.
