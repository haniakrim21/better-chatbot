import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/lib/db/pg/schema.pg";
import { eq } from "drizzle-orm";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

const db = drizzle(pool, { schema });

async function main() {
  console.log("Seeding Workflows...");

  const targetEmail = "haniakrim@gmail.com";
  const user = await db.query.UserTable.findFirst({
    where: eq(schema.UserTable.email, targetEmail),
  });

  if (!user) {
    console.error(
      `User ${targetEmail} not found. functionality requires a valid user to own the seed data.`,
    );
    process.exit(1);
  }

  const workflows: {
    name: string;
    description: string;
    icon: {
      type: "lucide" | "emoji" | "image";
      value: string;
      color?: string;
      style?: any;
    };
    tags: string[];
  }[] = [
    // --- Business Automation ---
    {
      name: "Invoice Processing Pipeline",
      description:
        "Automatically extract data from PDF invoices received via email and update QuickBooks.",
      icon: { type: "lucide", value: "receipt", color: "#3b82f6" }, // Blue
      tags: ["finance", "ocr", "automation"],
    },
    {
      name: "Lead Qualification Bot",
      description:
        "Qualify inbound leads from Typeform using GPT-4 and sync valuable ones to HubSpot.",
      icon: { type: "lucide", value: "target", color: "#22c55e" }, // Green
      tags: ["sales", "crm", "ai"],
    },
    {
      name: "Customer Support Triage",
      description:
        "Classify incoming Zendesk tickets by sentiment and route to the correct department.",
      icon: { type: "lucide", value: "life-buoy", color: "#ef4444" }, // Red
      tags: ["support", "zendesk", "classification"],
    },
    {
      name: "Meeting Summarizer",
      description:
        "Transcribe Zoom recordings, generate action items, and email attendees via Gmail.",
      icon: { type: "image", value: "https://logo.clearbit.com/zoom.us" },
      tags: ["productivity", "meetings", "gmail"],
    },
    {
      name: "Contract Reviewer",
      description:
        "Analyze legal contracts for high-risk clauses and generate a summary report.",
      icon: { type: "lucide", value: "scale", color: "#eab308" }, // Yellow
      tags: ["legal", "analysis", "review"],
    },

    // --- Social Media & Marketing ---
    {
      name: "Competitor Monitor",
      description:
        "Track competitor tweets and headlines, summarizing daily activity to Slack.",
      icon: { type: "image", value: "https://logo.clearbit.com/x.com" },
      tags: ["marketing", "monitoring", "slack"],
    },
    {
      name: "Content Repurposer",
      description:
        "Turn blog posts into Twitter threads, LinkedIn posts, and Instagram captions.",
      icon: { type: "lucide", value: "recycle", color: "#22c55e" },
      tags: ["content", "social-media", "writing"],
    },
    {
      name: "SEO Audit Automation",
      description:
        "Weekly crawl of landing pages to check for broken links and missing meta tags.",
      icon: { type: "lucide", value: "search", color: "#3b82f6" },
      tags: ["seo", "marketing", "web"],
    },
    {
      name: "Social Listening Assistant",
      description:
        "Monitor brand mentions on Reddit and draft suggested responses for review.",
      icon: { type: "image", value: "https://logo.clearbit.com/reddit.com" },
      tags: ["marketing", "reddit", "engagement"],
    },
    {
      name: "Newsletter Generator",
      description:
        "Curate top tech news from RSS feeds and draft a weekly newsletter.",
      icon: { type: "lucide", value: "newspaper", color: "#78716c" },
      tags: ["marketing", "email", "news"],
    },

    // --- Developer Operations ---
    {
      name: "PR Review Agent",
      description:
        "Automatically review GitHub PRs for style violations and security issues.",
      icon: { type: "image", value: "https://logo.clearbit.com/github.com" },
      tags: ["devops", "github", "code"],
    },
    {
      name: "Release Note Generator",
      description:
        "Compile git commits since last tag and generate formatted release notes.",
      icon: { type: "lucide", value: "tag", color: "#3b82f6" },
      tags: ["devops", "release", "git"],
    },
    {
      name: "Database Backup Validator",
      description:
        "Verify integrity of nightly Postgres backups and alert on failure.",
      icon: {
        type: "image",
        value: "https://logo.clearbit.com/postgresql.org",
      },
      tags: ["devops", "database", "reliability"],
    },
    {
      name: "Incident Response",
      description:
        "Create PagerDuty status, open Jira ticket, and create Slack war room on alert.",
      icon: { type: "image", value: "https://logo.clearbit.com/pagerduty.com" },
      tags: ["sre", "incident", "automation"],
    },
    {
      name: "Feature Flag Cleanup",
      description:
        "Identify stale feature flags in code and suggest removal PRs.",
      icon: { type: "lucide", value: "flag", color: "#f97316" },
      tags: ["dev", "maintenance", "code"],
    },

    // --- Personal Productivity ---
    {
      name: "Daily Briefing",
      description:
        "Compile calendar, weather, and top tasks into a morning briefing.",
      icon: { type: "lucide", value: "sun", color: "#eab308" },
      tags: ["personal", "productivity", "planning"],
    },
    {
      name: "Travel Planner",
      description:
        "Research flights, hotels, and activities for a destination and create an itinerary.",
      icon: { type: "lucide", value: "plane", color: "#0ea5e9" },
      tags: ["travel", "planning", "research"],
    },
    {
      name: "Learning Plan Generator",
      description:
        "Create a 4-week study plan for any topic based on current skill level.",
      icon: { type: "lucide", value: "book-open", color: "#10b981" },
      tags: ["education", "learning", "plan"],
    },
    {
      name: "Expense Categorizer",
      description:
        "Parse CSV bank statements and categorize transactions automatically.",
      icon: { type: "lucide", value: "dollar-sign", color: "#22c55e" },
      tags: ["finance", "personal", "money"],
    },
    {
      name: "Meal Planner",
      description:
        "Generate a weekly meal plan and shopping list based on dietary restrictions.",
      icon: { type: "lucide", value: "utensils", color: "#f97316" },
      tags: ["lifestyle", "food", "health"],
    },
  ];

  for (const w of workflows) {
    console.log(`Inserting ${w.name}...`);
    // Check if exists
    const existing = await db.query.WorkflowTable.findFirst({
      where: (table, { eq, and }) =>
        and(eq(table.name, w.name), eq(table.userId, user.id)),
    });

    if (existing) {
      console.log(`Updating ${w.name}...`);
      await db
        .update(schema.WorkflowTable)
        .set({
          description: w.description,
          icon: w.icon, // Update the icon
          tags: w.tags,
        })
        .where(eq(schema.WorkflowTable.id, existing.id));
      continue;
    }

    await db.insert(schema.WorkflowTable).values({
      name: w.name,
      description: w.description,
      icon: w.icon,
      userId: user.id,
      visibility: "public",
      isPublished: true,
      // Minimal empty version
      version: "0.1.0",
    });
  }

  console.log("Seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
