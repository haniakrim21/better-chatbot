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

  // Template definitions
  type NodeTemplate = {
    id: string;
    name: string;
    kind: string;
    position: { x: number; y: number };
    nodeConfig: any;
    uiConfig?: any;
  };

  type EdgeTemplate = {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  };

  const workflowTemplates: Record<
    string,
    { nodes: NodeTemplate[]; edges: EdgeTemplate[] }
  > = {
    "Invoice Processing Pipeline": {
      nodes: [
        {
          id: "1",
          kind: "input",
          name: "Document Input",
          position: { x: 50, y: 150 },
          nodeConfig: {
            outputSchema: {
              properties: {
                documentUrl: { type: "string" },
                sender: { type: "string" },
              },
            },
          },
        },
        {
          id: "2",
          kind: "llm",
          name: "Document Extractor",
          position: { x: 400, y: 150 },
          nodeConfig: {
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: "Extract invoice details from: {{1.documentUrl}}",
              },
            ],
            outputSchema: {
              properties: {
                date: { type: "string" },
                amount: { type: "number" },
                vendor: { type: "string" },
              },
            },
          },
        },
        {
          id: "3",
          kind: "output",
          name: "Result",
          position: { x: 800, y: 150 },
          nodeConfig: {
            outputData: [{ key: "result", source: { nodeId: "2", path: [] } }],
          },
        },
      ],
      edges: [
        { id: "e1", source: "1", target: "2" },
        { id: "e2", source: "2", target: "3" },
      ],
    },
    "Lead Qualification Bot": {
      nodes: [
        {
          id: "1",
          kind: "input",
          name: "New Lead",
          position: { x: 50, y: 150 },
          nodeConfig: {
            outputSchema: {
              properties: {
                name: { type: "string" },
                email: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
        {
          id: "2",
          kind: "llm",
          name: "Score Lead",
          position: { x: 400, y: 150 },
          nodeConfig: {
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: "Score this lead (0-100) based on: {{1.message}}",
              },
            ],
            outputSchema: {
              properties: {
                score: { type: "number" },
                reason: { type: "string" },
              },
            },
          },
        },
        {
          id: "3",
          kind: "condition",
          name: "Check Score",
          position: { x: 750, y: 150 },
          nodeConfig: {
            kind: "condition",
            branches: [
              { id: "qualified", name: "Qualified", condition: "score >= 70" },
              { id: "unqualified", name: "Unqualified", condition: "true" },
            ],
            outputSchema: { properties: {} },
          },
        },
        {
          id: "4",
          kind: "note",
          name: "Add to HubSpot",
          position: { x: 1100, y: 50 },
          nodeConfig: { text: "Simulated: Adding to HubSpot..." },
        },
        {
          id: "5",
          kind: "note",
          name: "Discard",
          position: { x: 1100, y: 250 },
          nodeConfig: { text: "Lead discarded." },
        },
      ],
      edges: [
        { id: "e1", source: "1", target: "2" },
        { id: "e2", source: "2", target: "3" },
        { id: "e3", source: "3", target: "4", sourceHandle: "qualified" },
        { id: "e4", source: "3", target: "5", sourceHandle: "unqualified" },
      ],
    },
    // Business Automation
    "Customer Support Triage": {
      nodes: [
        {
          id: "1",
          kind: "input",
          name: "Support Ticket",
          position: { x: 50, y: 150 },
          nodeConfig: {
            outputSchema: {
              properties: {
                ticketId: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
        {
          id: "2",
          kind: "llm",
          name: "Analyze Sentiment",
          position: { x: 400, y: 150 },
          nodeConfig: {
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: "Analyze sentiment and urgency: {{1.message}}",
              },
            ],
            outputSchema: {
              properties: {
                sentiment: {
                  type: "string",
                  enum: ["positive", "neutral", "negative"],
                },
                urgency: { type: "string", enum: ["low", "medium", "high"] },
              },
            },
          },
        },
        {
          id: "3",
          kind: "condition",
          name: "Route Ticket",
          position: { x: 750, y: 150 },
          nodeConfig: {
            kind: "condition",
            branches: [
              { id: "urgent", name: "Urgent", condition: "urgency == 'high'" },
              { id: "normal", name: "Normal", condition: "true" },
            ],
            outputSchema: { properties: {} },
          },
        },
        {
          id: "4",
          kind: "note",
          name: "Escalate",
          position: { x: 1100, y: 50 },
          nodeConfig: { text: "Escalating to Tier 2..." },
        },
        {
          id: "5",
          kind: "llm",
          name: "Auto-Reply",
          position: { x: 1100, y: 250 },
          nodeConfig: {
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "user",
                content: "Draft reply for ticket {{1.ticketId}}",
              },
            ],
            outputSchema: { properties: { reply: { type: "string" } } },
          },
        },
      ],
      edges: [
        { id: "e1", source: "1", target: "2" },
        { id: "e2", source: "2", target: "3" },
        { id: "e3", source: "3", target: "4", sourceHandle: "urgent" },
        { id: "e4", source: "3", target: "5", sourceHandle: "normal" },
      ],
    },
    "Meeting Summarizer": {
      nodes: [
        {
          id: "1",
          kind: "input",
          name: "Transcript Upload",
          position: { x: 50, y: 150 },
          nodeConfig: {
            outputSchema: { properties: { transcript: { type: "string" } } },
          },
        },
        {
          id: "2",
          kind: "llm",
          name: "Summarize",
          position: { x: 400, y: 150 },
          nodeConfig: {
            model: "gpt-4o",
            messages: [
              { role: "user", content: "Summarize: {{1.transcript}}" },
            ],
            outputSchema: {
              properties: {
                summary: { type: "string" },
                actions: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
        {
          id: "3",
          kind: "output",
          name: "Final Summary",
          position: { x: 800, y: 150 },
          nodeConfig: {
            outputData: [
              { key: "report", source: { nodeId: "2", path: ["summary"] } },
            ],
          },
        },
      ],
      edges: [
        { id: "e1", source: "1", target: "2" },
        { id: "e2", source: "2", target: "3" },
      ],
    },
    "Contract Reviewer": {
      nodes: [
        {
          id: "1",
          kind: "input",
          name: "Contract Doc",
          position: { x: 50, y: 150 },
          nodeConfig: {
            outputSchema: { properties: { text: { type: "string" } } },
          },
        },
        {
          id: "2",
          kind: "llm",
          name: "Risk Analysis",
          position: { x: 400, y: 150 },
          nodeConfig: {
            model: "gpt-4o",
            messages: [{ role: "user", content: "Identify risks: {{1.text}}" }],
            outputSchema: {
              properties: {
                risks: { type: "array", items: { type: "string" } },
                score: { type: "number" },
              },
            },
          },
        },
        {
          id: "3",
          kind: "output",
          name: "Review Report",
          position: { x: 800, y: 150 },
          nodeConfig: {
            outputData: [{ key: "report", source: { nodeId: "2", path: [] } }],
          },
        },
      ],
      edges: [
        { id: "e1", source: "1", target: "2" },
        { id: "e2", source: "2", target: "3" },
      ],
    },
    // Social Media & Marketing
    "Competitor Monitor": {
      nodes: [
        {
          id: "1",
          kind: "input",
          name: "Competitor Info",
          position: { x: 50, y: 150 },
          nodeConfig: {
            outputSchema: {
              properties: {
                competitorName: { type: "string" },
                url: { type: "string" },
              },
            },
          },
        },
        {
          id: "2",
          kind: "llm",
          name: "Analyze Strategy",
          position: { x: 400, y: 150 },
          nodeConfig: {
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content:
                  "Analyze the output strategy for {{1.competitorName}} at {{1.url}}",
              },
            ],
            outputSchema: {
              properties: {
                strategy: { type: "string" },
                strengths: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
        {
          id: "3",
          kind: "output",
          name: "Competitor Report",
          position: { x: 800, y: 150 },
          nodeConfig: {
            outputData: [
              { key: "report", source: { nodeId: "2", path: ["strategy"] } },
            ],
          },
        },
      ],
      edges: [
        { id: "e1", source: "1", target: "2" },
        { id: "e2", source: "2", target: "3" },
      ],
    },
    "Content Repurposer": {
      nodes: [
        {
          id: "1",
          kind: "input",
          name: "Source Content",
          position: { x: 50, y: 200 },
          nodeConfig: {
            outputSchema: {
              properties: {
                content: { type: "string", title: "Blog Post/Article" },
              },
            },
          },
        },
        {
          id: "2",
          kind: "llm",
          name: "Draft Tweets",
          position: { x: 400, y: 100 },
          nodeConfig: {
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: "Draft a twitter thread from: {{1.content}}",
              },
            ],
            outputSchema: {
              properties: {
                thread: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
        {
          id: "3",
          kind: "llm",
          name: "Draft LinkedIn",
          position: { x: 400, y: 300 },
          nodeConfig: {
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: "Draft a LinkedIn post from: {{1.content}}",
              },
            ],
            outputSchema: { properties: { post: { type: "string" } } },
          },
        },
        {
          id: "4",
          kind: "output",
          name: "Social Posts",
          position: { x: 800, y: 200 },
          nodeConfig: {
            outputData: [
              { key: "tweets", source: { nodeId: "2", path: ["thread"] } },
              { key: "linkedin", source: { nodeId: "3", path: ["post"] } },
            ],
          },
        },
      ],
      edges: [
        { id: "e1", source: "1", target: "2" },
        { id: "e2", source: "1", target: "3" },
        { id: "e3", source: "2", target: "4" },
        { id: "e4", source: "3", target: "4" },
      ],
    },
    "SEO Audit Automation": {
      nodes: [
        {
          id: "1",
          kind: "input",
          name: "Target URL",
          position: { x: 50, y: 200 },
          nodeConfig: {
            outputSchema: { properties: { url: { type: "string" } } },
          },
        },
        {
          id: "2",
          kind: "note",
          name: "Simulate Crawl",
          position: { x: 300, y: 100 },
          nodeConfig: { text: "Simulated: Fetching page metadata..." },
        },
        {
          id: "3",
          kind: "llm",
          name: "Audit Meta Tags",
          position: { x: 550, y: 200 },
          nodeConfig: {
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content:
                  "Analyze SEO for {{1.url}}. Suggest title and description improvements.",
              },
            ],
            outputSchema: { properties: { suggestions: { type: "string" } } },
          },
        },
        {
          id: "4",
          kind: "output",
          name: "Audit Report",
          position: { x: 900, y: 200 },
          nodeConfig: {
            outputData: [
              {
                key: "suggestions",
                source: { nodeId: "3", path: ["suggestions"] },
              },
            ],
          },
        },
      ],
      edges: [
        { id: "e1", source: "1", target: "2" },
        { id: "e2", source: "1", target: "3" },
        { id: "e3", source: "3", target: "4" },
      ],
    },
    "Social Listening Assistant": {
      nodes: [
        {
          id: "1",
          kind: "input",
          name: "Topic/Keyword",
          position: { x: 50, y: 200 },
          nodeConfig: {
            outputSchema: { properties: { keyword: { type: "string" } } },
          },
        },
        {
          id: "2",
          kind: "note",
          name: "Fetch Mentions",
          position: { x: 300, y: 200 },
          nodeConfig: { text: "Simulating search on Reddit/Twitter..." },
        },
        {
          id: "3",
          kind: "llm",
          name: "Analyze Sentiment",
          position: { x: 550, y: 200 },
          nodeConfig: {
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: "Analyze sentiment for {{1.keyword}} mentions.",
              },
            ],
            outputSchema: { properties: { analysis: { type: "string" } } },
          },
        },
        {
          id: "4",
          kind: "output",
          name: "Sentiment Report",
          position: { x: 900, y: 200 },
          nodeConfig: {
            outputData: [
              { key: "analysis", source: { nodeId: "3", path: ["analysis"] } },
            ],
          },
        },
      ],
      edges: [
        { id: "e1", source: "1", target: "2" },
        { id: "e2", source: "2", target: "3" },
        { id: "e3", source: "3", target: "4" },
      ],
    },
    "Newsletter Generator": {
      nodes: [
        {
          id: "1",
          kind: "input",
          name: "Topic & Links",
          position: { x: 50, y: 200 },
          nodeConfig: {
            outputSchema: {
              properties: {
                topic: { type: "string" },
                links: { type: "string" },
              },
            },
          },
        },
        {
          id: "2",
          kind: "llm",
          name: "Curate & Draft",
          position: { x: 400, y: 200 },
          nodeConfig: {
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content:
                  "Draft a newsletter about {{1.topic}} using these links: {{1.links}}",
              },
            ],
            outputSchema: { properties: { newsletter: { type: "string" } } },
          },
        },
        {
          id: "3",
          kind: "output",
          name: "Final Draft",
          position: { x: 800, y: 200 },
          nodeConfig: {
            outputData: [
              {
                key: "newsletter",
                source: { nodeId: "2", path: ["newsletter"] },
              },
            ],
          },
        },
      ],
      edges: [
        { id: "e1", source: "1", target: "2" },
        { id: "e2", source: "2", target: "3" },
      ],
    },
    // Developer Operations
    "PR Review Agent": {
      nodes: [
        {
          id: "1",
          kind: "input",
          name: "PR Diff",
          position: { x: 50, y: 150 },
          nodeConfig: {
            outputSchema: { properties: { diff: { type: "string" } } },
          },
        },
        {
          id: "2",
          kind: "llm",
          name: "Security Check",
          position: { x: 350, y: 50 },
          nodeConfig: {
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: "Check for security issues: {{1.diff}}",
              },
            ],
            outputSchema: {
              properties: {
                issues: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
        {
          id: "3",
          kind: "llm",
          name: "Style Check",
          position: { x: 350, y: 250 },
          nodeConfig: {
            model: "gpt-4o",
            messages: [
              { role: "user", content: "Check for style issues: {{1.diff}}" },
            ],
            outputSchema: {
              properties: {
                suggestions: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
        {
          id: "4",
          kind: "output",
          name: "Review Summary",
          position: { x: 700, y: 150 },
          nodeConfig: {
            outputData: [
              { key: "security", source: { nodeId: "2", path: ["issues"] } },
              { key: "style", source: { nodeId: "3", path: ["suggestions"] } },
            ],
          },
        },
      ],
      edges: [
        { id: "e1", source: "1", target: "2" },
        { id: "e2", source: "1", target: "3" },
        { id: "e3", source: "2", target: "4" },
        { id: "e4", source: "3", target: "4" },
      ],
    },
    "Release Note Generator": {
      nodes: [
        {
          id: "1",
          kind: "input",
          name: "Commit Log",
          position: { x: 50, y: 150 },
          nodeConfig: {
            outputSchema: { properties: { commits: { type: "string" } } },
          },
        },
        {
          id: "2",
          kind: "llm",
          name: "Group Changes",
          position: { x: 400, y: 150 },
          nodeConfig: {
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content:
                  "Group these commits by type (feat, fix, chore): {{1.commits}}",
              },
            ],
            outputSchema: { properties: { notes: { type: "string" } } },
          },
        },
        {
          id: "3",
          kind: "output",
          name: "Release Notes",
          position: { x: 800, y: 150 },
          nodeConfig: {
            outputData: [
              { key: "markdown", source: { nodeId: "2", path: ["notes"] } },
            ],
          },
        },
      ],
      edges: [
        { id: "e1", source: "1", target: "2" },
        { id: "e2", source: "2", target: "3" },
      ],
    },
    "Database Backup Validator": {
      nodes: [
        {
          id: "1",
          kind: "input",
          name: "Backup Log",
          position: { x: 50, y: 150 },
          nodeConfig: {
            outputSchema: { properties: { log: { type: "string" } } },
          },
        },
        {
          id: "2",
          kind: "llm",
          name: "Parse Log",
          position: { x: 400, y: 150 },
          nodeConfig: {
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "user",
                content: "Did the backup succeed? Log: {{1.log}}",
              },
            ],
            outputSchema: {
              properties: {
                success: { type: "boolean" },
                error: { type: "string" },
              },
            },
          },
        },
        {
          id: "3",
          kind: "condition",
          name: "Success?",
          position: { x: 700, y: 150 },
          nodeConfig: {
            kind: "condition",
            branches: [
              { id: "fail", name: "Failed", condition: "success == false" },
              { id: "pass", name: "Passed", condition: "true" },
            ],
            outputSchema: { properties: {} },
          },
        },
        {
          id: "4",
          kind: "note",
          name: "Alert Team",
          position: { x: 1000, y: 50 },
          nodeConfig: { text: "Backup Failed! Check logs." },
        },
        {
          id: "5",
          kind: "note",
          name: "Log Success",
          position: { x: 1000, y: 250 },
          nodeConfig: { text: "Backup Verified." },
        },
      ],
      edges: [
        { id: "e1", source: "1", target: "2" },
        { id: "e2", source: "2", target: "3" },
        { id: "e3", source: "3", target: "4", sourceHandle: "fail" },
        { id: "e4", source: "3", target: "5", sourceHandle: "pass" },
      ],
    },
    "Incident Response": {
      nodes: [
        {
          id: "1",
          kind: "input",
          name: "Alert Payload",
          position: { x: 50, y: 150 },
          nodeConfig: {
            outputSchema: {
              properties: {
                severity: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
        {
          id: "2",
          kind: "llm",
          name: "Triage Incident",
          position: { x: 400, y: 150 },
          nodeConfig: {
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content:
                  "Analyze incident: {{1.message}}. Severity: {{1.severity}}. Suggest playbook.",
              },
            ],
            outputSchema: { properties: { playbook: { type: "string" } } },
          },
        },
        {
          id: "3",
          kind: "note",
          name: "PagerDuty Trigger",
          position: { x: 800, y: 150 },
          nodeConfig: { text: "Simulated: Triggering PagerDuty..." },
        },
      ],
      edges: [
        { id: "e1", source: "1", target: "2" },
        { id: "e2", source: "2", target: "3" },
      ],
    },
    "Feature Flag Cleanup": {
      nodes: [
        {
          id: "1",
          kind: "input",
          name: "Codebase Scan",
          position: { x: 50, y: 150 },
          nodeConfig: {
            outputSchema: { properties: { flags: { type: "string" } } },
          },
        },
        {
          id: "2",
          kind: "llm",
          name: "Identify Stale",
          position: { x: 400, y: 150 },
          nodeConfig: {
            model: "gpt-4o",
            messages: [
              { role: "user", content: "Identify stale flags in: {{1.flags}}" },
            ],
            outputSchema: {
              properties: {
                staleFlags: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
        {
          id: "3",
          kind: "output",
          name: "Cleanup Report",
          position: { x: 800, y: 150 },
          nodeConfig: {
            outputData: [
              { key: "report", source: { nodeId: "2", path: ["staleFlags"] } },
            ],
          },
        },
      ],
      edges: [
        { id: "e1", source: "1", target: "2" },
        { id: "e2", source: "2", target: "3" },
      ],
    },
    // Personal Productivity
    "Daily Briefing": {
      nodes: [
        {
          id: "1",
          kind: "input",
          name: "Data Sources",
          position: { x: 50, y: 150 },
          nodeConfig: {
            outputSchema: {
              properties: {
                calendar: { type: "string" },
                weather: { type: "string" },
                tasks: { type: "string" },
              },
            },
          },
        },
        {
          id: "2",
          kind: "llm",
          name: "Generate Briefing",
          position: { x: 400, y: 150 },
          nodeConfig: {
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content:
                  "Create a morning briefing. Calendar: {{1.calendar}}. Weather: {{1.weather}}. Tasks: {{1.tasks}}.",
              },
            ],
            outputSchema: { properties: { briefing: { type: "string" } } },
          },
        },
        {
          id: "3",
          kind: "output",
          name: "Briefing Output",
          position: { x: 800, y: 150 },
          nodeConfig: {
            outputData: [
              { key: "text", source: { nodeId: "2", path: ["briefing"] } },
            ],
          },
        },
      ],
      edges: [
        { id: "e1", source: "1", target: "2" },
        { id: "e2", source: "2", target: "3" },
      ],
    },
    "Travel Planner": {
      nodes: [
        {
          id: "1",
          kind: "input",
          name: "Preferences",
          position: { x: 50, y: 150 },
          nodeConfig: {
            outputSchema: {
              properties: {
                destination: { type: "string" },
                dates: { type: "string" },
                budget: { type: "string" },
              },
            },
          },
        },
        {
          id: "2",
          kind: "llm",
          name: "Suggest Itinerary",
          position: { x: 400, y: 150 },
          nodeConfig: {
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content:
                  "Plan a trip to {{1.destination}} for {{1.dates}} with budget {{1.budget}}. Suggest flights, hotel, and activities.",
              },
            ],
            outputSchema: {
              properties: {
                itinerary: { type: "string" },
                breakdown: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
        {
          id: "3",
          kind: "output",
          name: "Itinerary",
          position: { x: 800, y: 150 },
          nodeConfig: {
            outputData: [
              { key: "plan", source: { nodeId: "2", path: ["itinerary"] } },
            ],
          },
        },
      ],
      edges: [
        { id: "e1", source: "1", target: "2" },
        { id: "e2", source: "2", target: "3" },
      ],
    },
    "Learning Plan Generator": {
      nodes: [
        {
          id: "1",
          kind: "input",
          name: "Topic & Level",
          position: { x: 50, y: 150 },
          nodeConfig: {
            outputSchema: {
              properties: {
                topic: { type: "string" },
                level: { type: "string" },
              },
            },
          },
        },
        {
          id: "2",
          kind: "llm",
          name: "Create Plan",
          position: { x: 400, y: 150 },
          nodeConfig: {
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content:
                  "Create a 4-week study plan for {{1.topic}} at {{1.level}} level.",
              },
            ],
            outputSchema: {
              properties: {
                plan: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      week: { type: "number" },
                      topics: { type: "array", items: { type: "string" } },
                    },
                  },
                },
              },
            },
          },
        },
        {
          id: "3",
          kind: "output",
          name: "Study Schedule",
          position: { x: 800, y: 150 },
          nodeConfig: {
            outputData: [
              { key: "schedule", source: { nodeId: "2", path: ["plan"] } },
            ],
          },
        },
      ],
      edges: [
        { id: "e1", source: "1", target: "2" },
        { id: "e2", source: "2", target: "3" },
      ],
    },
    "Expense Categorizer": {
      nodes: [
        {
          id: "1",
          kind: "input",
          name: "Transactions CSV",
          position: { x: 50, y: 150 },
          nodeConfig: {
            outputSchema: { properties: { csv: { type: "string" } } },
          },
        },
        {
          id: "2",
          kind: "llm",
          name: "Categorize",
          position: { x: 400, y: 150 },
          nodeConfig: {
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "user",
                content: "Categorize these transactions: {{1.csv}}",
              },
            ],
            outputSchema: {
              properties: {
                categorized: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      date: { type: "string" },
                      amount: { type: "number" },
                      category: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
        {
          id: "3",
          kind: "output",
          name: "Categorized Data",
          position: { x: 800, y: 150 },
          nodeConfig: {
            outputData: [
              { key: "data", source: { nodeId: "2", path: ["categorized"] } },
            ],
          },
        },
      ],
      edges: [
        { id: "e1", source: "1", target: "2" },
        { id: "e2", source: "2", target: "3" },
      ],
    },
    "Meal Planner": {
      nodes: [
        {
          id: "1",
          kind: "input",
          name: "Dietary Needs",
          position: { x: 50, y: 150 },
          nodeConfig: {
            outputSchema: {
              properties: {
                diet: { type: "string" },
                exclusion: { type: "string" },
              },
            },
          },
        },
        {
          id: "2",
          kind: "llm",
          name: "Plan Meals",
          position: { x: 400, y: 150 },
          nodeConfig: {
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content:
                  "Plan weekly meals for {{1.diet}}. Avoid {{1.exclusion}}.",
              },
            ],
            outputSchema: {
              properties: {
                menu: { type: "array", items: { type: "string" } },
                shoppingList: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
        {
          id: "3",
          kind: "output",
          name: "Meal Plan",
          position: { x: 800, y: 150 },
          nodeConfig: {
            outputData: [
              { key: "menu", source: { nodeId: "2", path: ["menu"] } },
              {
                key: "shopping",
                source: { nodeId: "2", path: ["shoppingList"] },
              },
            ],
          },
        },
      ],
      edges: [
        { id: "e1", source: "1", target: "2" },
        { id: "e2", source: "2", target: "3" },
      ],
    },
  };

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
      name: "Sequential Processing",
      description: "Linear process: Summarize -> Translate -> Output",
      icon: {
        type: "emoji",
        value: "➡️",
        style: {
          backgroundColor: "oklch(50% 0.1 200)",
        },
      },
      tags: ["example", "sequential"],
    },
    {
      name: "Parallel Processing",
      description: "Parallel tasks: Sentiment & Keyword Extraction",
      icon: {
        type: "emoji",
        value: "🔀",
        style: {
          backgroundColor: "oklch(60% 0.15 150)",
        },
      },
      tags: ["example", "parallel"],
    },
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

    let workflowId = existing?.id;

    if (existing) {
      console.log(`Updating ${w.name}...`);
      await db
        .update(schema.WorkflowTable)
        .set({
          description: w.description,
          icon: w.icon,
          tags: w.tags,
        })
        .where(eq(schema.WorkflowTable.id, existing.id));
    } else {
      const [insertedWorkflow] = await db
        .insert(schema.WorkflowTable)
        .values({
          name: w.name,
          description: w.description,
          icon: w.icon,
          userId: user.id,
          visibility: "public",
          isPublished: true,
          version: "0.1.0",
        })
        .returning();
      workflowId = insertedWorkflow.id;
    }

    // Check if workflow has nodes
    const existingNodes = await db.query.WorkflowNodeDataTable.findFirst({
      where: eq(schema.WorkflowNodeDataTable.workflowId, workflowId!),
    });

    if (workflowTemplates[w.name]) {
      console.log(`  - Applying template for ${w.name} (Overwriting)`);
      // Delete existing nodes (cascades to edges)
      await db
        .delete(schema.WorkflowNodeDataTable)
        .where(eq(schema.WorkflowNodeDataTable.workflowId, workflowId!));

      const template = workflowTemplates[w.name];
      const idMap = new Map<string, string>();

      // Insert Nodes
      for (const node of template.nodes) {
        const [inserted] = await db
          .insert(schema.WorkflowNodeDataTable)
          .values({
            workflowId: workflowId!,
            name: node.name,
            kind: node.kind as any,
            uiConfig: { position: node.position, ...(node.uiConfig || {}) },
            nodeConfig: node.nodeConfig,
          })
          .returning();
        idMap.set(node.id, inserted.id);
      }

      // Insert Edges
      for (const edge of template.edges) {
        const sourceId = idMap.get(edge.source);
        const targetId = idMap.get(edge.target);

        if (sourceId && targetId) {
          await db.insert(schema.WorkflowEdgeTable).values({
            workflowId: workflowId!,
            source: sourceId,
            target: targetId,
            uiConfig: {
              sourceHandle: edge.sourceHandle,
              targetHandle: edge.targetHandle,
            },
          });
        }
      }
    } else if (!existingNodes) {
      // Create default INPUT node
      console.log(`  - Adding default INPUT node to ${w.name}`);
      const inputNode = {
        position: { x: 100, y: 300 },
        data: {
          label: "START",
          kind: "input",
          config: {},
          ui: {},
        },
        type: "input",
        kind: "input",
      };

      await db.insert(schema.WorkflowNodeDataTable).values({
        workflowId: workflowId!,
        name: "INPUT",
        kind: "input",
        uiConfig: {
          position: inputNode.position,
        },
        nodeConfig: { outputSchema: {} },
      });
    }
  }

  console.log("Seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
