# Installation and Test Documentation

## Installation Process

The following steps were executed to install and run the Better Chatbot application locally:

1. **Prerequisites Check**:
   * Node.js: v25.2.1
   * pnpm: 10.2.1
   * Docker: 29.1.3 (Daemon running)

2. **Dependencies Installation**:
   * Executed `pnpm install`.
   * Dependencies were installed successfully.
   * `postinstall` script ran and ensured `.env` file existence.

3. **Environment Configuration**:
   * `.env` file was verified.
   * `BETTER_AUTH_SECRET` was already set.
   * `POSTGRES_URL` was configured to point to the local Docker container (`postgres://your_username:your_password@localhost:5432/your_database_name`).

4. **Database Setup**:
   * Started PostgreSQL container using `pnpm docker:pg`.
   * Image `pgvector/pgvector:pg17` was pulled and container `nabd-gpt-pg` started.
   * Database migrations were executed using `pnpm db:migrate` and completed successfully.

5. **Application Startup**:
   * Started the development server with `pnpm dev`.
   * Server started on `http://localhost:3000`.

## Verification and Test Results

### Service Availability

The application was verified by sending an HTTP HEAD request to the local server.

**Command:**

```bash
curl -I http://localhost:3000
```

**Result:**

```
HTTP/1.1 307 Temporary Redirect
location: /sign-in
Date: Sat, 03 Jan 2026 08:51:24 GMT
Connection: keep-alive
Keep-Alive: timeout=5
```

The `307 Temporary Redirect` to `/sign-in` confirms that:

1. The web server is accepting connections.
2. The application logic (Next.js middleware/routing) is functioning.
3. The application is ready for user interaction.

### How to Reproduce

To reproduce this installation on a similar environment:

1. Ensure Node.js, pnpm, and Docker are installed.
2. Run `pnpm install`.
3. Run `pnpm docker:pg` to start the database.
4. Run `pnpm db:migrate` to setup the database schema.
5. Run `pnpm dev` to start the app.
6. * Open `http://localhost:3000` in your browser.

## Troubleshooting

### Build Issues

* **Dynamic Server Usage**: If you encounter `Dynamic server usage: Route /... couldn't be rendered statically` errors during `pnpm build`, it is because pages using session headers were not marked as dynamic. This has been fixed by adding `export const dynamic = "force-dynamic"` to the affected pages (`/discover/*`, `/knowledge`, `/teams`).

\*- **Lint and Type Errors**: Previously reported linting errors (`noUnusedVariables`) and type errors (`missing property 'enabled'`) have been resolved. The codebase now passes `pnpm lint` and `pnpm check-types`.

* **Unit Tests**: Fixed a failing test case in `src/lib/ai/models.test.ts` that was referencing a non-existent model (`gpt-4.1`). All 395 unit tests are now passing (`pnpm test`).

- **`net::ERR_ABORTED`**: You may see this in the browser console. This typically occurs when a page navigation interrupts a background data fetch (e.g., clicking a link before a previous request completes) or during the initial server compilation. If the application pages load correctly, these can be ignored.

- **`net::ERR_UPLOAD_FILE_CHANGED`**: This error occurs if a file is modified on your disk while it is being uploaded. Ensure you are uploading static files that are not being written to by other processes.

- **`ECONNRESET`**: Seen in server logs when the browser cancels a request (e.g., the user stops loading a page). This is normal behavior during development.
