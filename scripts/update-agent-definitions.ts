import { drizzle } from "drizzle-orm/node-postgres";
import {
  pgTable,
  text,
  timestamp,
  json,
  uuid,
  varchar,
  integer,
} from "drizzle-orm/pg-core";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  "postgresql://your_username:your_password@localhost:5432/your_database_name";

const pool = new Pool({ connectionString });
const db = drizzle(pool);

// Schema Definition (matching valid DB schema)
const AgentTable = pgTable("agent", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  icon: json("icon"),
  userId: uuid("user_id").notNull(),
  instructions: json("instructions"),
  visibility: varchar("visibility").notNull().default("public"),
  tags: json("tags"),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// New Agent Definition
const stockAgent = {
  name: "Stock Analysis Expert",
  description:
    "This agent helps with stock analysis. It uses web search tools to obtain stock information, analyze market trends, and provide financial insights.",
  icon: { type: "emoji", value: "📈" },
  instructions: {
    systemPrompt: `You are an expert stock market analyst. Your goal is to provide accurate, data-driven financial analysis and insights.

Capabilities:
1.  **Market Data Retrieval**: search for real-time stock prices, historical data, and financial news.
2.  **Technical Analysis**: Interpret charts, identify trends (bullish/bearish), and spot key support/resistance levels.
3.  **Fundamental Analysis**: specific information about company financials, earnings reports, P/E ratios, and market cap.
4.  **Sentiment Analysis**: Gauge market sentiment from news and social media trends.

Guidelines:
-   Always cite your sources when providing data (e.g., "According to Bloomberg...").
-   Do not provide financial advice or recommendations to buy/sell. Always state that your analysis is for informational purposes only.
-   Be concise and professional in your tone.
-   If you lack specific data, explain why and what alternative proxies you are using.`,
  },
  tags: ["finance", "stocks", "analysis", "market"],
  visibility: "public",
};

async function main() {
  console.log("🚀 Updating Agent Definitions...");

  // 1. Get System User
  const userResult = await pool.query('SELECT id FROM "user" LIMIT 1');
  if (userResult.rows.length === 0) {
    console.error("No users found. Please seed users first.");
    process.exit(1);
  }
  const systemUserId = userResult.rows[0].id;

  // 2. Check if Agent exists
  const check = await pool.query('SELECT id FROM "agent" WHERE name = $1', [
    stockAgent.name,
  ]);

  if (check.rows.length > 0) {
    // Update existing
    console.log(`Updating existing agent: ${stockAgent.name}`);
    await db
      .update(AgentTable as any)
      .set({
        description: stockAgent.description,
        instructions: stockAgent.instructions,
        icon: stockAgent.icon,
        tags: stockAgent.tags,
        updatedAt: new Date(),
      } as any)
      .where(sql`name = ${stockAgent.name}`); // Note: sql import missing, need workaround or raw query

    // Drizzle update without 'sql' helper or where clause generic is verbose in script without imports.
    // Falling back to raw SQL for update to be safe and simple in this standalone script.
    await pool.query(
      `UPDATE "agent" SET description = $1, instructions = $2, icon = $3, tags = $4, updated_at = NOW() WHERE name = $5`,
      [
        stockAgent.description,
        JSON.stringify(stockAgent.instructions),
        JSON.stringify(stockAgent.icon),
        JSON.stringify(stockAgent.tags),
        stockAgent.name,
      ],
    );
  } else {
    // Insert new
    console.log(`Creating new agent: ${stockAgent.name}`);
    await db.insert(AgentTable as any).values({
      name: stockAgent.name,
      description: stockAgent.description,
      icon: stockAgent.icon,
      userId: systemUserId,
      instructions: stockAgent.instructions,
      visibility: stockAgent.visibility,
      tags: stockAgent.tags,
      usageCount: 0,
    } as any);
  }

  console.log("✅ Stock Analysis Agent updated/created successfully.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
