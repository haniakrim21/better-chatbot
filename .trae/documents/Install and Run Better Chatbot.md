This plan outlines the steps to install dependencies, configure the environment, set up the database, and run the Better Chatbot application locally.

### Prerequisites
- **Node.js** (v18+)
- **pnpm** (Package Manager)
- **Docker** (For the PostgreSQL database)

### Implementation Steps

1.  **Prerequisites Check**
    *   Verify that `node`, `pnpm`, and `docker` are installed and running.
    *   If `pnpm` is missing, install it via `npm install -g pnpm`.

2.  **Install Dependencies**
    *   Run `pnpm install`.
    *   This will automatically trigger the `postinstall` script, which copies `.env.example` to `.env`.

3.  **Configure Environment**
    *   Generate a secure secret for `BETTER_AUTH_SECRET` using `openssl` or a similar tool.
    *   Update the `.env` file with the generated secret.
    *   *Note:* The application requires at least one LLM API Key (e.g., OpenAI, Anthropic) to function fully. Since I cannot provide these, the app will start but chat functionality will be limited until you add your keys.

4.  **Database Setup**
    *   Start the local PostgreSQL container using the provided script: `pnpm docker:pg`.
    *   Initialize the database schema by running migrations: `pnpm db:migrate`.

5.  **Execute Application**
    *   Start the development server: `pnpm dev`.

6.  **Validation**
    *   Monitor the console for startup errors.
    *   Verify the application is running by accessing `http://localhost:3000`.
