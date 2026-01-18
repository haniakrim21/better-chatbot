<img width="1184" height="576" alt="thumbnail" loading="lazy" src="https://github.com/user-attachments/assets/d6ba80ff-a62a-4920-b266-85c4a89d6076" />

[![MCP Supported](https://img.shields.io/badge/MCP-Supported-00c853)](https://modelcontextprotocol.io/introduction)
[![Local First](https://img.shields.io/badge/Local-First-blue)](https://localfirstweb.dev/)
[![Discord](https://img.shields.io/discord/1374047276074537103?label=Discord&logo=discord&color=5865F2)](https://discord.gg/gCRu69Upnp)

[![Deploy with Vercel](https://vercel.com/button)](<https://vercel.com/new/clone?repository-url=https://github.com/cgoinglove/better-chatbot&env=BETTER_AUTH_SECRET&env=OPENAI_API_KEY&env=GOOGLE_GENERATIVE_AI_API_KEY&env=ANTHROPIC_API_KEY&envDescription=BETTER_AUTH_SECRET+is+required+(enter+any+secret+value).+At+least+one+LLM+provider+API+key+(OpenAI,+Claude,+or+Google)+is+required,+but+you+can+add+all+of+them.+See+the+link+below+for+details.&envLink=https://github.com/cgoinglove/better-chatbot/blob/main/.env.example&demo-title=Nabd%20AI&demo-description=An+Open-Source+Chatbot+Template+Built+With+Next.js+and+the+AI+SDK+by+Vercel.&products=[{"type":"integration","protocol":"storage","productSlug":"neon","integrationSlug":"neon"},{"type":"integration","protocol":"storage","productSlug":"upstash-kv","integrationSlug":"upstash"},{"type":"blob"}]>)

🚀 **[Live Demo](https://better-chatbot-demo.vercel.app/)**

---

# Nabd AI User Platform Guide

Welcome to **Nabd**, your all-in-one AI workspace. This platform brings together advanced AI models, specialized agents, and powerful tools into a single collaborative interface.

![Nabd Interface](public/nabd-interface.png)

## 🚀 Getting Started

### The Interface
When you log in, `Nabd` presents a clean, focus-driven interface. As seen in the screenshot above:

**1. Main Navigation (Top Left)**
*   **🖊️ New Chat:** Start a fresh conversation.
*   **🧭 Discover:** Browse the library of community and official agents.
*   **⚡ Workflow:** Automate repetitive multi-step tasks.
*   **📖 Knowledge:** Manage uploaded documents (RAG) for your personal or team use.
*   **👥 Teams:** Access shared chats, agents, and collaborative workspaces.
*   **🔌 MCP Configuration:** Connect to local tools and servers (Advanced).
*   **📂 Archive:** View your past conversations.

**2. Agents List (Middle Left)**
*   Quick access to pinned agents like *Philosophy Major*, *Editor in Chief*, etc.

**3. User Menu (Bottom Left)**
*   Your personal control center (Avatar & Email).

**4. Chat Area (Center)**
*   **Model Selector:** Choose between models like `gpt-4o`, `claude-3-5-sonnet`, `gemini-1.5-pro`.
*   **Input Bar:** Where you type messages, trigger tools (`+`), or use voice input (`🎙️`).

---

## 👤 User Menu & Personalization
Click your **Avatar/Name** at the bottom left to open the User Menu.

### Menu Options (in order):
*   **⚙️ Chat Preferences:** Customize default model and behavior.
*   **🎨 Theme:**
    *   **Dark / Light:** Toggle appearance.
    *   **Color Theme:** Choose an accent color (e.g., *Dark Orange*, Violet, Blue).
*   **🌍 Language:** Switch interface language (English / Arabic).
*   **⌨️ Keyboard Shortcuts:** View hotkeys for power users.
*   **🛡️ Admin Settings:** (Admins Only) Manage users, roles, and system configurations.
*   **👤 User Settings:** Profile management.
*   **🚪 Sign Out:** Log out of your account.

---

## 🤝 Teams & Collaboration
Nabd is built for teamwork. The **Teams** section in the sidebar unlocks collaborative AI features.

### Features:
1.  **Shared Chats:**
    *   Having a great brainstorming session with the AI? **Share it.**
    *   Teammates can view your chat, continue the conversation, or fork it to their own workspace.
    
2.  **Shared Knowledge:**
    *   Upload documents to a **Team Knowledge Base**.
    *   *Example:* Upload "Q3 Sales Data" so your entire sales team can ask the AI questions about it without re-uploading.

3.  **Shared Agents:**
    *   Create specialized agents (e.g., "Customer Support Bot") and publish them to your Team.
    *   Ensures everyone uses the same prompts and tools for consistent results.

---

## ⚡ Workflows (Automation)
The **Workflow** tab allows you to chain multiple steps together into a reusable process.

**How to Build a Workflow:**
1.  Click **Workflow** in the sidebar.
2.  **Create New:** Add a Trigger (e.g., "On Demand" or "Scheduled").
3.  **Add Nodes:** Drag and drop steps like "Search Web", "Summarize", or "Send Email".
4.  **Connect:** Draw lines between nodes to define the flow of data.
5.  **Run:** Execute the entire chain with one click.

---

## 💬 Chat & Models
Nabd isn't just one AI; it's a gateway to all of them.
**Top Models to Use:**
*   **GPT-4o:** Best for general reasoning and complex tasks.
*   **Claude 3.5 Sonnet:** Excellent for coding and creative writing.
*   **Gemini 1.5 Pro:** Great for massive context (uploading whole books/codebases).

---

## 🕵️ Agents
Agents are specialized AI personas trained for specific jobs.
**How to use them:**
1.  **Sidebar List:** Click any pinned agent (e.g., *Editor in Chief*, *Stock Analysis Expert*) to start a focused session.
2.  **Discover:** Click **Discover** in the sidebar to browse the full library of official agents.
3.  **Create:** You can create your own custom agents with specific system prompts and tool access.

> **Popular Agents:**
> *   **Speechwriter:** Crafts compelling speeches.
> *   **Grant Writer:** Specialist in funding proposals.
> *   **Philosophy Major:** For deep, existential debates.

---

## 🛠️ Tools User Guide

Your chat has "arms and legs" to do real work. Here is a deep dive into each tool.

### 🧭 Quick Start Strategy
*   **Need facts?** → Use **Search the Web**.
*   **Need visuals?** → Use **Data Visualization**.
*   **Need accuracy (math/data)?** → Use **Code Execution**.
*   **Need to write a document?** → Use **Canvas**.
*   **Need internal info?** → Use **RAG**.

### 🌐 Search the Web (Powered by Exa AI)
**How it works:**
Unlike a basic Google search, this tool uses *semantic understanding* to read and synthesize information from multiple high-quality sources.

**When to use:**
- Competitor analysis ("What features did Competitor X release in 2024?")
- Fact-checking ("Verify the GDP growth rate of Saudi Arabia in 2023.")

**✅ Pro Tip:** Be specific about the *type* of source you want.
> *"Find **PDF reports** from **consulting firms** about GenAI trends in 2025."*

### 📊 Data Visualization
**How it works:**
The AI analyzes data provided in your chat or from a file and generates interactive charts instantly.

**Triggers:** "Plot this," "Graph this," "Visualize."

**Supported Types:** Pie Charts (Shares), Bar Charts (Comparisons), Line Charts (Trends).

### 🔌 HTTP Request & APIs
**How it works:**
This tool allows the AI to "talk" to other software and websites programmatically.
**Use Cases:** Testing APIs, Fetching raw crypto prices, Sending webhooks.

### 💻 Code Execution (Compute)
**How it works:**
This is your **"Calculator on Steroids."** The AI writes and runs real Python/JavaScript code in a secure sandbox.
**Best For:** Compound interest, Analyzing large CSV files, complex math.

### 📝 Canvas (Document Editor)
**How it works:**
Canvas is a **collaborative writing surface**. When you ask the AI to "draft a document," it opens a dedicated side-panel.
**Capabilities:** Drafting, Iterating ("Make this friendlier"), and Coding.
**Best For:** Blog posts, Quarterly Reports, Technical Specs.

---

## 🧠 Knowledge Base (RAG)
Teach Nabd about *your* company.
1.  Go to **Knowledge** in the sidebar.
2.  **Upload** documents (PDFs, Word docs, TXT files).
3.  **Chat:** Ask questions like *"According to the Employee Handbook, what is the policy on..."* OR *"Based on the uploaded contracts..."*
4.  The AI will cite your documents in its answer.

---

# 👨‍💻 Administrator & Developer Guide

## Quick Start 🚀

> **Get your app running in minutes! No installation or payment required.**

You only need **one AI Provider API Key** (OpenAI, Claude, Gemini, etc.). Everything else runs on free tiers - database, file storage, and hosting.

👉 **[Click this guide to deploy your site with just a few clicks](docs/tips-guides/vercel.md)**

### Installation (Local)

```bash
pnpm i

# Start a local PostgreSQL instance (Optional if using cloud DB)
pnpm docker:pg

# Enter required information in the .env file
# The .env file is created automatically. Just fill in the required values.

pnpm build:local && pnpm start

# For development with hot-reloading:
pnpm dev
```

### Environment Variables

The `pnpm i` command generates a `.env` file. Add your API keys there.

```dotenv
# === LLM Provider API Keys ===
# You only need to enter the keys for the providers you plan to use
GOOGLE_GENERATIVE_AI_API_KEY=****
OPENAI_API_KEY=****

# Secret for Better Auth (generate with: npx @better-auth/cli@latest secret)
BETTER_AUTH_SECRET=****

# === Database ===
POSTGRES_URL=postgres://your_username:your_password@localhost:5432/your_database_name

# === Tools ===
# Exa AI for web search
EXA_API_KEY=your_exa_api_key_here
```

## 📘 Guides & Resources

*   [Plug-in MCP Server Setup](./docs/tips-guides/mcp-server-setup-and-tool-testing.md)
*   [Docker Hosting Guide](./docs/tips-guides/docker.md)
*   [Vercel Hosting Guide](./docs/tips-guides/vercel.md)
*   [File Storage Drivers](./docs/tips-guides/file-storage.md)
*   [System Prompts & Customization](./docs/tips-guides/system-prompts-and-customization.md)
*   [OAuth Sign-In Setup](./docs/tips-guides/oauth.md)

## 🗺️ Roadmap
Planned features coming soon to Nabd AI:
- [x] **File Upload & Storage** (Vercel Blob integration)
- [x] **Image Generation**
- [ ] **Collaborative Document Editing** (like OpenAI Canvas: user & assistant co-editing)
- [ ] **RAG (Retrieval-Augmented Generation)**
- [ ] **Web-based Compute** (with [WebContainers](https://webcontainers.io) integration)

💡 If you have suggestions, please create an [issue](https://github.com/cgoinglove/better-chatbot/issues)!

## 💖 Support

If this project has been helpful to you, please consider supporting its development:
- ⭐ **Star** this repository
- 🐛 **Report** bugs
- 💰 **[Become a sponsor](https://github.com/sponsors/cgoinglove)**

## 🙌 Contributing

We welcome all contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) before submitting any Pull Requests.

## 💬 Join Our Discord

[![Discord](https://img.shields.io/discord/1374047276074537103?label=Discord&logo=discord&color=5865F2)](https://discord.gg/gCRu69Upnp)
