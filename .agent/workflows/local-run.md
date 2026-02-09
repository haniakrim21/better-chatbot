---
description: Steps to run the Better Chatbot application locally for development.
---

1. **Install Dependencies**
   Run the following command to install required packages:
   ```bash
   pnpm install
   ```

2. **Configure Environment Variables**
   Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in at least the following:
   - `OPENAI_API_KEY` or other LLM provider keys.
   - `POSTGRES_URL` (default works if using Step 3).
   - `BETTER_AUTH_SECRET` (generate with `npx @better-auth/cli@latest secret`).

3. **Start Local Database**
   If you don't have a PostgreSQL instance, use the provided Docker command:
   ```bash
   pnpm docker:pg
   ```

4. **Run Database Migrations**
   Initialize the database schema:
   ```bash
   pnpm db:migrate
   ```

6. **Start Development Server**
   ```bash
   pnpm dev
   ```
   The application will be available at [http://localhost:3000](http://localhost:3000).

7. **Troubleshooting: Port already in use**
   If port 3000 is occupied, run the server on a different port (e.g., 3001):
   ```bash
   PORT=3001 pnpm dev
   ```
   Or use the `--port` flag:
   ```bash
   pnpm dev --port 3001
   ```
   *Note: If you change the port, remember to update `BETTER_AUTH_URL` in your `.env` to match.*
