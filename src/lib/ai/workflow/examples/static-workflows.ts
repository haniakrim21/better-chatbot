import { DBEdge, DBNode } from "app-types/workflow";
import { generateUUID } from "lib/utils";

// --- HELPERS ---

const createEdge = (sourceId: string, targetId: string): Partial<DBEdge> => ({
  id: generateUUID(),
  source: sourceId,
  target: targetId,
});

const emptySchema = {
  type: "object",
  properties: {},
};

// Standard output schema for LLM nodes
const llmOutputSchema = {
  type: "object",
  properties: {
    answer: { type: "string" },
  },
};

// --- HERO WORKFLOWS ---

// 1. Blog Post Generator (Advanced)
const blogWorkflow = () => {
  const inputId = generateUUID();
  const outlineId = generateUUID();
  const draftId = generateUUID();
  const seoId = generateUUID();
  const outputId = generateUUID();

  const nodes = [
    {
      id: inputId,
      kind: "input",
      name: "Topic Input",
      position: { x: 50, y: 300 },
      nodeConfig: {
        outputSchema: {
          type: "object",
          properties: {
            topic: { type: "string" },
            tone: { type: "string" },
          },
        },
      },
    },
    {
      id: outlineId,
      kind: "llm",
      name: "Generate Outline",
      position: { x: 400, y: 300 },
      nodeConfig: {
        model: "gpt-4o",
        outputSchema: llmOutputSchema,
        messages: [
          {
            role: "user",
            content:
              "Create a detailed 5-section outline for a blog post about: {{${inputId}.output.topic}}. Tone: {{${inputId}.output.tone}}. Include key takeaways for each section.",
          },
        ],
      },
    },
    {
      id: draftId,
      kind: "llm",
      name: "Write Draft",
      position: { x: 750, y: 300 },
      nodeConfig: {
        model: "gpt-4o",
        outputSchema: llmOutputSchema,
        messages: [
          {
            role: "user",
            content:
              "Using this outline: {{${outlineId}.output.answer}}, write the full blog post. Use markdown formatting. Keep paragraphs short.",
          },
        ],
      },
    },
    {
      id: seoId,
      kind: "llm",
      name: "SEO Polish",
      position: { x: 1100, y: 300 },
      nodeConfig: {
        model: "gpt-4o",
        outputSchema: llmOutputSchema,
        messages: [
          {
            role: "user",
            content:
              "Optimize this article for SEO. Add a meta description, suggest 5 keywords, and ensure the title is catchy. Article: {{${draftId}.output.answer}}",
          },
        ],
      },
    },
    {
      id: outputId,
      kind: "output",
      name: "Final Post",
      position: { x: 1450, y: 300 },
      nodeConfig: {
        outputSchema: emptySchema,
        outputData: [
          { key: "blog_post", source: { nodeId: seoId, path: ["answer"] } },
        ],
      },
    },
  ];

  const edges = [
    createEdge(inputId, outlineId),
    createEdge(outlineId, draftId),
    createEdge(draftId, seoId),
    createEdge(seoId, outputId),
  ];

  return {
    name: "Pro Blog Generator",
    description: "End-to-end SEO optimized article writer",
    icon: "📝",
    nodes,
    edges,
  };
};

// 2. YouTube Script Creator
const youtubeWorkflow = () => {
  const inputId = generateUUID();
  const ideasId = generateUUID();
  const scriptId = generateUUID();
  const descId = generateUUID();
  const outputId = generateUUID();

  return {
    name: "YouTube Script Writer",
    description: "From concept to full video script and metadata",
    icon: "🎬",
    nodes: [
      {
        id: inputId,
        kind: "input",
        name: "Video Concept",
        position: { x: 50, y: 100 },
        nodeConfig: {
          outputSchema: {
            type: "object",
            properties: { concept: { type: "string" } },
          },
        },
      },
      {
        id: ideasId,
        kind: "llm",
        name: "Brainstorm Hooks",
        position: { x: 400, y: 100 },
        nodeConfig: {
          outputSchema: llmOutputSchema,
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content:
                "Generate 3 viral hooks (first 15 seconds) for a video about: {{${inputId}.output.concept}}.",
            },
          ],
        },
      },
      {
        id: scriptId,
        kind: "llm",
        name: "Write Script",
        position: { x: 750, y: 100 },
        nodeConfig: {
          outputSchema: llmOutputSchema,
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content:
                "Write a full 10-minute video script using the hooks: {{${ideasId}.output.answer}}. Include 'Visual Cues' in brackets [Like this].",
            },
          ],
        },
      },
      {
        id: descId,
        kind: "llm",
        name: "Metadata Gen",
        position: { x: 1100, y: 100 },
        nodeConfig: {
          outputSchema: llmOutputSchema,
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content:
                "Write a YouTube video description, 15 tags, and a clickbait title for: {{${scriptId}.output.answer}}",
            },
          ],
        },
      },
      {
        id: outputId,
        kind: "output",
        name: "Package",
        position: { x: 1450, y: 100 },
        nodeConfig: {
          outputSchema: emptySchema,
          outputData: [
            {
              key: "script_package",
              source: { nodeId: descId, path: ["answer"] },
            },
          ],
        },
      },
    ],
    edges: [
      createEdge(inputId, ideasId),
      createEdge(ideasId, scriptId),
      createEdge(scriptId, descId),
      createEdge(descId, outputId),
    ],
  };
};

// 3. Code Refactor Pipeline
const refactorWorkflow = () => {
  const inputId = generateUUID();
  const analyzeId = generateUUID();
  const refactorId = generateUUID();
  const testId = generateUUID();
  const outputId = generateUUID();

  return {
    name: "Code Refactor Pro",
    description: "Analyze, refactor, and generate tests for code snippets",
    icon: "🧹",
    nodes: [
      {
        id: inputId,
        kind: "input",
        name: "Code Input",
        position: { x: 50, y: 200 },
        nodeConfig: {
          outputSchema: {
            type: "object",
            properties: {
              code: { type: "string" },
              language: { type: "string" },
            },
          },
        },
      },
      {
        id: analyzeId,
        kind: "llm",
        name: "Security Audit",
        position: { x: 400, y: 200 },
        nodeConfig: {
          outputSchema: llmOutputSchema,
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content:
                "Analyze this {{${inputId}.output.language}} code for security vulnerabilities and performance bottlenecks: {{${inputId}.output.code}}",
            },
          ],
        },
      },
      {
        id: refactorId,
        kind: "llm",
        name: "Apply Refactor",
        position: { x: 750, y: 200 },
        nodeConfig: {
          outputSchema: llmOutputSchema,
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content:
                "Refactor the code based on these findings: {{${analyzeId}.output.answer}}. Return ONLY the code.",
            },
          ],
        },
      },
      {
        id: testId,
        kind: "llm",
        name: "Gen Unit Tests",
        position: { x: 1100, y: 200 },
        nodeConfig: {
          outputSchema: llmOutputSchema,
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content:
                "Write unit tests for this refactored code: {{${refactorId}.output.answer}}",
            },
          ],
        },
      },
      {
        id: outputId,
        kind: "output",
        name: "Clean Code",
        position: { x: 1450, y: 200 },
        nodeConfig: {
          outputSchema: emptySchema,
          outputData: [
            {
              key: "refactored_code",
              source: { nodeId: refactorId, path: ["answer"] },
            },
            { key: "tests", source: { nodeId: testId, path: ["answer"] } },
          ],
        },
      },
    ],
    edges: [
      createEdge(inputId, analyzeId),
      createEdge(analyzeId, refactorId),
      createEdge(refactorId, testId),
      createEdge(testId, outputId),
    ],
  };
};

// ... Helper for the rest ...
const createSimpleWorkflow = (
  name: string,
  description: string,
  icon: string,
  prompt: string,
) => {
  const id1 = generateUUID();
  const id2 = generateUUID();
  const id3 = generateUUID();
  return {
    name,
    description,
    icon,
    nodes: [
      {
        id: id1,
        kind: "input",
        name: "Start",
        position: { x: 50, y: 150 },
        nodeConfig: {
          outputSchema: {
            type: "object",
            properties: { input: { type: "string" } },
          },
        },
      },
      {
        id: id2,
        kind: "llm",
        name: "Process",
        position: { x: 400, y: 150 },
        nodeConfig: {
          outputSchema: llmOutputSchema,
          model: "gpt-4o",
          messages: [
            { role: "user", content: `${prompt}: {{${id1}.output.input}}` },
          ],
        },
      },
      {
        id: id3,
        kind: "output",
        name: "End",
        position: { x: 750, y: 150 },
        nodeConfig: {
          outputSchema: emptySchema,
          outputData: [
            { key: "result", source: { nodeId: id2, path: ["answer"] } },
          ],
        },
      },
    ],
    edges: [createEdge(id1, id2), createEdge(id2, id3)],
  };
};

// Compile final list
export const STATIC_WORKFLOWS = [
  blogWorkflow(),
  youtubeWorkflow(),
  refactorWorkflow(),
  createSimpleWorkflow(
    "Email Polisher",
    "Make emails professional",
    "📧",
    "Rewrite this email to be more professional, concise, and polite",
  ),
  createSimpleWorkflow(
    "Explain Like I'm 5",
    "Simplify complex topics",
    "👶",
    "Explain this topic to a 5-year-old using simple analogies",
  ),
  createSimpleWorkflow(
    "TL;DR Generator",
    "Summarize long text",
    "🤏",
    "Provide a bullet-point summary of this text. Include key dates and names",
  ),
  createSimpleWorkflow(
    "Tweet Generator",
    "Create viral tweets",
    "🐦",
    "Turn this topic into 5 variations of viral tweets. Use emojis",
  ),
  createSimpleWorkflow(
    "Language Translator",
    "Translate to Spanish/French",
    "🌐",
    "Translate this text into Spanish, French, and German",
  ),
  createSimpleWorkflow(
    "Interview Prep",
    "Generate interview questions",
    "👔",
    "Generate 10 behavioral interview questions for this job description",
  ),
  createSimpleWorkflow(
    "Git Commit Message",
    "Generate conventional commits",
    "📝",
    "Generate a Conventional Commit message for these changes",
  ),
  createSimpleWorkflow(
    "Regex Generator",
    "Create regex from description",
    "🔡",
    "Write a RegEx pattern that matches",
  ),
  createSimpleWorkflow(
    "SQL Query Builder",
    "Natural language to SQL",
    "💾",
    "Write a generic SQL query for",
  ),
  createSimpleWorkflow(
    "Recipe Idea",
    "Ingredients to recipe",
    "🍳",
    "Create a recipe using these ingredients",
  ),
  createSimpleWorkflow(
    "Travel Itinerary",
    "Plan a 3-day trip",
    "✈️",
    "Plan a 3-day travel itinerary for",
  ),
  createSimpleWorkflow(
    "Gift Recommender",
    "Gift ideas by interest",
    "🎁",
    "Suggest 5 unique gifts for someone who loves",
  ),
  createSimpleWorkflow(
    "Book Recommender",
    "Books similar to",
    "📚",
    "Recommend 5 books similar to",
  ),
  createSimpleWorkflow(
    "Movie Recommender",
    "Movies similar to",
    "🍿",
    "Recommend 5 movies similar to",
  ),
  createSimpleWorkflow(
    "Workout Plan",
    "Create a workout routine",
    "💪",
    "Create a weekly workout plan for",
  ),
  createSimpleWorkflow(
    "Marketing Slogan",
    "Catchy slogans",
    "🏷️",
    "Generate 10 catchy marketing slogans for",
  ),
  createSimpleWorkflow(
    "Startup Name Gen",
    "Business name ideas",
    "🚀",
    "Generate 10 startup names available as .com for",
  ),
  createSimpleWorkflow(
    "Poem Writer",
    "Write a poem",
    "🌹",
    "Write a sonnet about",
  ),
  createSimpleWorkflow(
    "Joke Teller",
    "Tell a joke",
    "🤣",
    "Tell a funny joke about",
  ),
  createSimpleWorkflow(
    "Horoscope",
    "Daily reading",
    "🔮",
    "Give a horoscope reading for",
  ),
  createSimpleWorkflow(
    "Motivational Speech",
    "Inspiring words",
    "🗣️",
    "Write a motivational speech about",
  ),
  createSimpleWorkflow(
    "Cover Letter Gen",
    "Write a cover letter",
    "📄",
    "Write a professional cover letter for",
  ),
  createSimpleWorkflow(
    "Meeting Agenda",
    "Plan a meeting",
    "📅",
    "Create a meeting agenda for",
  ),
  createSimpleWorkflow(
    "OKR Generator",
    "Set goals",
    "🎯",
    "Define Objectives and Key Results for",
  ),
  createSimpleWorkflow(
    "SWOT Analysis",
    "Business strategy",
    "📊",
    "Perform a SWOT analysis for",
  ),
  createSimpleWorkflow(
    "User Persona",
    "Marketing persona",
    "👤",
    "Create a user persona for",
  ),
  createSimpleWorkflow(
    "Press Release",
    "Company news",
    "📰",
    "Write a press release for",
  ),
  createSimpleWorkflow(
    "Ad Copy",
    "Facebook/Google Ads",
    "📣",
    "Write 3 variations of ad copy for",
  ),
  createSimpleWorkflow(
    "Product Description",
    "E-commerce copy",
    "🛍️",
    "Write a compelling product description for",
  ),
  createSimpleWorkflow(
    "Bug Report",
    "Format bug report",
    "🐞",
    "Format this into a clean bug report",
  ),
  createSimpleWorkflow(
    "Test Case Gen",
    "QA test cases",
    "🧪",
    "Generate QA test cases for",
  ),
  createSimpleWorkflow(
    "API Docs",
    "Document endpoints",
    "📑",
    "Write API documentation for",
  ),
  createSimpleWorkflow(
    "React Component",
    "Generate React code",
    "⚛️",
    "Write a React component for",
  ),
  createSimpleWorkflow(
    "Python Script",
    "Generate Python script",
    "🐍",
    "Write a Python script to",
  ),
  createSimpleWorkflow(
    "Bash Script",
    "Shell automation",
    "💻",
    "Write a bash script to",
  ),
  createSimpleWorkflow(
    "Docker Compose",
    "Container setup",
    "🐳",
    "Generate a docker-compose.yml for",
  ),
  createSimpleWorkflow(
    "Color Palette",
    "Design colors",
    "🎨",
    "Generate a hexadecimal color palette for",
  ),
  createSimpleWorkflow(
    "Logo Idea",
    "Midjourney prompts",
    "🖼️",
    "Write a Midjourney prompt for a logo for",
  ),
  createSimpleWorkflow(
    "Domain Name",
    "Website names",
    "🌐",
    "Suggest domain names for",
  ),
  createSimpleWorkflow(
    "Business Plan",
    "Startup strategy",
    "💼",
    "Outline a business plan for",
  ),
  createSimpleWorkflow(
    "Contract Review",
    "Legal summary",
    "⚖️",
    "Summarize the key risks in this contract clause",
  ),
  createSimpleWorkflow(
    "Essay Grader",
    "Grade writing",
    "🎓",
    "Grade this essay and suggest improvements",
  ),
  createSimpleWorkflow(
    "Study Plan",
    "Leaning schedule",
    "📅",
    "Create a 4-week study plan for",
  ),
  createSimpleWorkflow(
    "Flashcards",
    "Study aid",
    "🗂️",
    "Create 10 flashcards for",
  ),
  createSimpleWorkflow(
    "Debate Arguments",
    "Pros and Cons",
    "🥊",
    "List the strongest pros and cons for",
  ),
  createSimpleWorkflow(
    "Philosophical Quote",
    "Deep thoughts",
    "🤔",
    "Give me a quote and deeper meaning about",
  ),
  createSimpleWorkflow(
    "Meditation Script",
    "Mindfulness",
    "🧘",
    "Write a 5-minute guided meditation script for",
  ),
  // Total should be ~50
];
