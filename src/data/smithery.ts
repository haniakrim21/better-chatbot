export interface SmitheryMVP {
  name: string;
  description: string;
  command: string; // The full npx command or just the package name
  icon?: string;
}

export const featuredSmitheryMcps: SmitheryMVP[] = [
  // --- Development & Git ---
  {
    name: "GitHub",
    description:
      "Manage repositories, issues, pull requests, and file content.",
    command: "npx -y @smithery/cli run @smithery/github",
    icon: "github",
  },
  {
    name: "GitLab",
    description:
      "Interact with GitLab repositories, pipelines, and merge requests.",
    command: "npx -y @smithery/cli run @smithery/gitlab",
    icon: "gitlab",
  },
  {
    name: "Linear",
    description: "Manage Linear issues, projects, and cycles.",
    command: "npx -y @smithery/cli run @smithery/linear",
    icon: "linear",
  },
  {
    name: "Jira",
    description: "View and update Jira tickets and sprints.",
    command: "npx -y @smithery/cli run @smithery/jira",
    icon: "jira",
  },
  {
    name: "Sentry",
    description: "Retrieve error reports and performance metrics from Sentry.",
    command: "npx -y @smithery/cli run @smithery/sentry",
    icon: "alert-octagon",
  },
  {
    name: "Docker",
    description: "Manage Docker containers, images, and volumes.",
    command: "npx -y @smithery/cli run @smithery/docker",
    icon: "docker",
  },
  {
    name: "Kubernetes",
    description: "Inspect and manage Kubernetes clusters and resources.",
    command: "npx -y @smithery/cli run @smithery/kubernetes",
    icon: "network",
  },

  // --- Databases & Data ---
  {
    name: "PostgreSQL",
    description: "Connect to, query, and manage PostgreSQL databases.",
    command: "npx -y @smithery/cli run @smithery/postgres",
    icon: "database",
  },
  {
    name: "MySQL",
    description: "Execute queries and inspect schemas in MySQL databases.",
    command: "npx -y @smithery/cli run @smithery/mysql",
    icon: "database",
  },
  {
    name: "SQLite",
    description: "Lightweight file-based database access.",
    command: "npx -y @smithery/cli run @smithery/sqlite",
    icon: "database",
  },
  {
    name: "MongoDB",
    description: "NoSQL database operations for MongoDB.",
    command: "npx -y @smithery/cli run @smithery/mongo",
    icon: "database",
  },
  {
    name: "Redis",
    description: "Interact with Redis key-value store.",
    command: "npx -y @smithery/cli run @smithery/redis",
    icon: "layers",
  },
  {
    name: "Snowflake",
    description: "Enterprise data warehousing and analytics queries.",
    command: "npx -y @smithery/cli run @smithery/snowflake",
    icon: "snowflake",
  },
  {
    name: "BigQuery",
    description: "Run analytics queries on Google BigQuery.",
    command: "npx -y @smithery/cli run @smithery/bigquery",
    icon: "database-backup",
  },
  {
    name: "Supabase",
    description: "Manage Supabase projects, auth, and databases.",
    command: "npx -y @smithery/cli run @smithery/supabase",
    icon: "zap",
  },
  {
    name: "Airtable",
    description: "Read and write data in Airtable bases.",
    command: "npx -y @smithery/cli run @smithery/airtable",
    icon: "table",
  },

  // --- Search & Information ---
  {
    name: "Brave Search",
    description: "Privacy-focused web search API.",
    command: "npx -y @smithery/cli run @smithery/brave-search",
    icon: "search",
  },
  {
    name: "Google Maps",
    description: "Search places, get directions, and traffic info.",
    command: "npx -y @smithery/cli run @smithery/google-maps",
    icon: "map-pin",
  },
  {
    name: "Perplexity",
    description: "AI-powered answer engine and research tool.",
    command: "npx -y @smithery/cli run @smithery/perplexity",
    icon: "search-code",
  },
  {
    name: "Wikipedia",
    description: "Search and retrieve encyclopedia articles.",
    command: "npx -y @smithery/cli run @smithery/wikipedia",
    icon: "book",
  },
  {
    name: "Weather",
    description: "Get current weather and forecasts for any location.",
    command: "npx -y @smithery/cli run @smithery/weather",
    icon: "cloud-sun",
  },
  {
    name: "FlightRadar24",
    description: "Track flights and airport status in real-time.",
    command: "npx -y @smithery/cli run @smithery/flightradar24",
    icon: "plane",
  },
  {
    name: "TMDB",
    description: "Movie and TV show information database.",
    command: "npx -y @smithery/cli run @smithery/tmdb",
    icon: "film",
  },
  {
    name: "Scholarly",
    description: "Search specific queries for academic papers and citations.",
    command: "npx -y @smithery/cli run @smithery/scholarly",
    icon: "graduation-cap",
  },

  // --- Productivity & Communication ---
  {
    name: "Slack",
    description: "Send messages, read channels, and manage workspaces.",
    command: "npx -y @smithery/cli run @smithery/slack",
    icon: "slack",
  },
  {
    name: "Discord",
    description: "Interact with Discord servers and channels.",
    command: "npx -y @smithery/cli run @smithery/discord",
    icon: "message-circle",
  },
  {
    name: "Gmail",
    description: "Send, read, and manage emails.",
    command: "npx -y @smithery/cli run @smithery/gmail",
    icon: "mail",
  },
  {
    name: "Google Calendar",
    description: "Manage events and schedules.",
    command: "npx -y @smithery/cli run @smithery/google-calendar",
    icon: "calendar",
  },
  {
    name: "Notion",
    description: "Access and modify Notion pages and databases.",
    command: "npx -y @smithery/cli run @smithery/notion",
    icon: "file-text",
  },
  {
    name: "Obsidian",
    description: "Interact with your local Obsidian vault.",
    command: "npx -y @smithery/cli run @smithery/obsidian",
    icon: "file",
  },
  {
    name: "Todoist",
    description: "Manage tasks and projects in Todoist.",
    command: "npx -y @smithery/cli run @smithery/todoist",
    icon: "check-square",
  },
  {
    name: "Google Tasks",
    description: "Manage todo lists and tasks.",
    command: "npx -y @smithery/cli run @smithery/google-tasks",
    icon: "check-circle",
  },

  // --- Files & Cloud Storage ---
  {
    name: "Filesystem",
    description: "Secure local file access and manipulation.",
    command: "npx -y @smithery/cli run @modelcontextprotocol/server-filesystem",
    icon: "hard-drive",
  },
  {
    name: "Google Drive",
    description: "Access and manage files in Google Drive.",
    command: "npx -y @smithery/cli run @smithery/google-drive",
    icon: "cloud",
  },
  {
    name: "AWS S3",
    description: "Manage buckets and objects in Amazon S3.",
    command: "npx -y @smithery/cli run @smithery/aws-s3",
    icon: "server",
  },
  {
    name: "OneDrive",
    description: "Access files in Microsoft OneDrive.",
    command: "npx -y @smithery/cli run @smithery/onedrive",
    icon: "cloud",
  },

  // --- Media & Social ---
  {
    name: "YouTube",
    description: "Search videos, get transcripts and comments.",
    command: "npx -y @smithery/cli run @smithery/youtube",
    icon: "youtube",
  },
  {
    name: "Spotify",
    description: "Control playback and manage playlists.",
    command: "npx -y @smithery/cli run @smithery/spotify",
    icon: "music",
  },
  {
    name: "Twitter (X)",
    description: "Post tweets and search timelines.",
    command: "npx -y @smithery/cli run @smithery/twitter",
    icon: "twitter",
  },
  {
    name: "Cloudinary",
    description: "Upload and manage media assets.",
    command: "npx -y @smithery/cli run @smithery/cloudinary",
    icon: "image",
  },

  // --- System & DevOps ---
  {
    name: "Memory",
    description: "Knowledge graph memory for long-term retention.",
    command: "npx -y @smithery/cli run @modelcontextprotocol/server-memory",
    icon: "brain",
  },
  {
    name: "Time",
    description: "Get current time and timezone conversions.",
    command: "npx -y @smithery/cli run @smithery/time",
    icon: "clock",
  },
  {
    name: "Terminal",
    description: "Execute shell commands (Use with caution).",
    command: "npx -y @smithery/cli run @smithery/wcgw",
    icon: "terminal",
  },
  {
    name: "Home Assistant",
    description: "Control smart home devices.",
    command: "npx -y @smithery/cli run @smithery/home-assistant",
    icon: "home",
  },
  {
    name: "Puppeteer",
    description: "Browser automation and scraping.",
    command: "npx -y @smithery/cli run @smithery/puppeteer",
    icon: "globe",
  },
  {
    name: "Vercel",
    description: "Manage deployments and projects.",
    command: "npx -y @smithery/cli run @smithery/vercel",
    icon: "triangle",
  },
  {
    name: "Cloudflare",
    description: "Manage DNS, workers, and settings.",
    command: "npx -y @smithery/cli run @smithery/cloudflare",
    icon: "cloud-lightning",
  },
  {
    name: "Stripe",
    description: "Access payments, customers, and subscriptions.",
    command: "npx -y @smithery/cli run @smithery/stripe",
    icon: "credit-card",
  },
];
