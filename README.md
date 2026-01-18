<div align="center">

<img width="1184" height="576" alt="thumbnail" loading="lazy" src="https://github.com/user-attachments/assets/d6ba80ff-a62a-4920-b266-85c4a89d6076" />

# 🚀 Nabd AI - Better Chatbot

### *Your All-in-One AI Workspace*

**Powered by AI Agents, MCP & Advanced Workflows**

[![MCP Supported](https://img.shields.io/badge/MCP-Supported-08c53f)](https://modelcontextprotocol.io/introduction)
[![Local First](https://img.shields.io/badge/Local-First-5865F2)](https://localfirstweb.dev/)
[![Discord](https://img.shields.io/discord/1374847276874537103?label=Discord&logo=discord&color=5865F2)](https://discord.gg/gCRu69Upnp)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cgoinglove/better-chatbot&env=BETTER_AUTH_SECRET&env=OPENAI_API_KEY)

[🎮 Live Demo](https://nabdai.sliplane.app/) • [📚 Documentation](./docs) • [💬 Discord Community](https://discord.gg/gCRu69Upnp) • [🐛 Report Bug](https://github.com/haniakrim21/better-chatbot/issues)

</div>

---

## ✨ Why Nabd AI?

Nabd AI isn't just another chatbot - it's a comprehensive AI platform that brings together:

- 🤖 **Multiple AI Models** - GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro & more
- 🔧 **Specialized Agents** - Pre-built AI personas for specific tasks
- ⚡ **Workflow Automation** - Chain multiple AI tasks together
- 📚 **RAG Knowledge Base** - Upload documents and chat with your data
- 👥 **Team Collaboration** - Share chats, agents, and knowledge bases
- 🌐 **Web Search & Tools** - Powered by Exa AI with real-time data
- 💻 **Code Execution** - Run Python/JavaScript in secure sandboxes
- 📊 **Data Visualization** - Create charts and graphs instantly
- 🎨 **Canvas Editor** - Collaborative document editing

---

## 🎯 Quick Start

### Option 1: Deploy to Vercel (Recommended - 5 minutes)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cgoinglove/better-chatbot&env=BETTER_AUTH_SECRET&env=OPENAI_API_KEY)

✅ **No installation required** | ✅ **Free tier available** | ✅ **One-click setup**

👉 **[Follow our step-by-step Vercel deployment guide](./docs/tips-guides/vercel.md)**

### Option 2: Local Development

```bash
# Install dependencies
pnpm install

# Start local PostgreSQL (optional if using cloud DB)
pnpm docker:pg

# Configure environment variables (.env file auto-created)
# Add your API keys to .env file

# Build and start
pnpm build:local && pnpm start

# Or run in development mode
pnpm dev
```

### 🔑 Required Environment Variables

```env
# === Authentication ===
BETTER_AUTH_SECRET=your_secret_here  # Generate with: npx @better-auth/cli@latest secret

# === AI Provider (Choose at least one) ===
OPENAI_API_KEY=sk-***
GOOGLE_GENERATIVE_AI_API_KEY=***
ANTHROPIC_API_KEY=***

# === Database ===
POSTGRES_URL=postgres://user:pass@localhost:5432/dbname

# === Tools (Optional) ===
EXA_API_KEY=***  # For web search functionality
```

---

## 🎨 Features Overview

### 🤖 Multiple AI Models

Switch between different AI models based on your needs:

| Model | Best For | Context Window |
|-------|----------|----------------|
| **GPT-4o** | General reasoning & complex tasks | 128K tokens |
| **Claude 3.5 Sonnet** | Coding & creative writing | 200K tokens |
| **Gemini 1.5 Pro** | Massive context (books/codebases) | 2M tokens |
| **Local Models** | Privacy-first, offline usage | Varies |

### 🕵️ Specialized Agents

Pre-built AI personas for specific tasks:

- 📝 **Speechwriter** - Craft compelling speeches
- 💰 **Grant Writer** - Funding proposals specialist
- 🤔 **Philosophy Major** - Deep existential debates
- 📰 **Editor in Chief** - Professional content editing
- 📊 **Stock Analysis Expert** - Financial analysis
- And many more in the Discover tab!

### ⚡ Workflow Automation

Chain multiple AI tasks into reusable workflows:

1. **Trigger** - On demand or scheduled
2. **Actions** - Search, summarize, analyze
3. **Output** - Send email, save to database, or export

### 🛠️ Powerful Tools

| Tool | Description | Use Case |
|------|-------------|----------|
| 🌐 **Web Search** | Exa AI semantic search | Research & fact-checking |
| 📊 **Data Viz** | Interactive charts | Analyze & present data |
| 💻 **Code Execution** | Python/JS sandbox | Complex calculations |
| 📝 **Canvas** | Document editor | Collaborative writing |
| 🔌 **HTTP/API** | REST API calls | Integration & testing |
| 🧠 **RAG** | Document Q&A | Company knowledge base |

### 👥 Team Collaboration

- **Shared Chats** - Collaborate on conversations
- **Team Knowledge Base** - Centralized document library
- **Shared Agents** - Consistent AI behavior across team
- **Role-Based Access** - Admin, member, viewer permissions

---

## 📖 User Guide Highlights

### 🧭 Navigation

- **🖊️ New Chat** - Start fresh conversation
- **🧭 Discover** - Browse agent library
- **⚡ Workflow** - Automate multi-step tasks
- **📖 Knowledge** - Manage documents (RAG)
- **👥 Teams** - Collaborative workspaces
- **🔌 MCP Config** - Connect local tools
- **📂 Archive** - Past conversations

### 🎨 Personalization

- **Theme** - Dark/Light mode with color accents
- **Language** - English/Arabic support
- **Chat Preferences** - Default model & behavior
- **Keyboard Shortcuts** - Power user features

### 🔍 Search Strategies

**For Facts:** "Find PDF reports from consulting firms about GenAI trends in 2025"

**For Analysis:** "Analyze this data and create a bar chart comparing Q1 vs Q2 sales"

**For Documents:** "According to the Employee Handbook, what is the policy on remote work?"

---

## 📚 Documentation

### 🚀 Deployment Guides
- [Vercel Hosting](./docs/tips-guides/vercel.md) ⭐ Recommended
- [Docker Deployment](./docs/tips-guides/docker.md)
- [File Storage Setup](./docs/tips-guides/file-storage.md)

### ⚙️ Configuration
- [MCP Server Setup](./docs/tips-guides/mcp-server-setup-and-tool-testing.md)
- [OAuth Sign-In](./docs/tips-guides/oauth.md)
- [System Prompts](./docs/tips-guides/system-prompts-and-customization.md)

### 📖 Additional Resources
- [Full User Guide](./INSTALL_AND_TEST.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [Agent Documentation](./AGENTS.md)
- [Changelog](./CHANGELOG.md)

---

## 🗺️ Roadmap

- [x] **File Upload & Storage** (Vercel Blob)
- [x] **Image Generation** 
- [x] **Multi-language Support** (English/Arabic)
- [x] **Team Collaboration**
- [x] **MCP Integration**
- [ ] **Enhanced Canvas** (Real-time co-editing)
- [ ] **Advanced RAG** (Multi-source knowledge graphs)
- [ ] **Web-based Compute** ([WebContainers](https://webcontainers.io/))
- [ ] **Mobile App** (iOS/Android)
- [ ] **Voice Conversation**

💡 Have a feature request? [Create an issue](https://github.com/haniakrim21/better-chatbot/issues/new)

---

## 🤝 Contributing

We welcome all contributions! Here's how you can help:

- ⭐ **Star this repository** - Show your support
- 🐛 **Report bugs** - Help us improve
- 💡 **Suggest features** - Share your ideas
- 🔧 **Submit PRs** - Contribute code
- 📖 **Improve docs** - Help others get started
- 💬 **Join Discord** - Connect with the community

**Before contributing, please read our [Contributing Guide](./CONTRIBUTING.md)**

---

## 💖 Support the Project

If Nabd AI has been helpful to you:

- ⭐ **Star** this repository on GitHub
- 💰 **[Become a sponsor](https://github.com/sponsors/cgoinglove)**
- 🐦 **Share** on social media
- 💬 **Join our [Discord community](https://discord.gg/gCRu69Upnp)**

Your support helps us continue developing and improving Nabd AI! 🙏

---

## 📝 License

**MIT License** - See [LICENSE](./LICENSE) file for details

Free to use, modify, and distribute. Built with ❤️ by the open-source community.

---

## 🌟 Contributors

Thanks to all our amazing contributors!

<a href="https://github.com/haniakrim21/better-chatbot/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=haniakrim21/better-chatbot" />
</a>

---

<div align="center">

### 🔗 Quick Links

[🎮 Try Demo](https://nabdai.sliplane.app/) • [📚 Full Documentation](./docs) • [💬 Discord](https://discord.gg/gCRu69Upnp) • [🐛 Issues](https://github.com/haniakrim21/better-chatbot/issues)

**Built with Next.js, AI SDK by Vercel, and ❤️**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cgoinglove/better-chatbot)

*Star ⭐ this repo if you find it useful!*

</div>
