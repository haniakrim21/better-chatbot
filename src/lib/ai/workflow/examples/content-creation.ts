import { DBEdge, DBNode } from "app-types/workflow";
import { generateUUID } from "lib/utils";

const INPUT_ID = generateUUID();
const OUTLINE_ID = generateUUID();
const WRITER_ID = generateUUID();
const OUTPUT_ID = generateUUID();

export const contentCreationNodes: Partial<DBNode>[] = [
  {
    id: INPUT_ID,
    kind: "input",
    name: "Topic Input",
    description: "Accepts the blog post topic",
    uiConfig: { position: { x: 0, y: 0 }, type: "default" },
    nodeConfig: {
      kind: "input",
      outputSchema: {
        type: "object",
        properties: {
          topic: { type: "string", title: "Blog Topic" },
        },
        required: ["topic"],
      },
    },
  },
  {
    id: OUTLINE_ID,
    kind: "llm",
    name: "Outline Generator",
    description: "Generates a blog post outline",
    uiConfig: { position: { x: 400, y: 0 }, type: "default" },
    nodeConfig: {
      kind: "llm",
      model: { provider: "openai", model: "4o" },
      outputSchema: {
        type: "object",
        properties: {
          answer: {
            type: "object",
            properties: {
              outline: { type: "string", description: "The generated outline" },
            },
            required: ["outline"],
          },
        },
      },
      messages: [
        {
          role: "user",
          content: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Create a detailed outline for a blog post about: ",
                  },
                  {
                    type: "mention",
                    attrs: {
                      id: generateUUID(),
                      label: `{"nodeId":"${INPUT_ID}","path":["topic"]}`,
                    },
                  },
                ],
              },
            ],
          },
        },
      ],
    },
  },
  {
    id: WRITER_ID,
    kind: "llm",
    name: "Content Writer",
    description: "Writes the full blog post based on the outline",
    uiConfig: { position: { x: 800, y: 0 }, type: "default" },
    nodeConfig: {
      kind: "llm",
      model: { provider: "openai", model: "4o" },
      outputSchema: {
        type: "object",
        properties: {
          answer: {
            type: "object",
            properties: {
              content: {
                type: "string",
                description: "The full blog post content",
              },
            },
            required: ["content"],
          },
        },
      },
      messages: [
        {
          role: "user",
          content: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Write a comprehensive blog post using this outline: ",
                  },
                  {
                    type: "mention",
                    attrs: {
                      id: generateUUID(),
                      label: `{"nodeId":"${OUTLINE_ID}","path":["answer", "outline"]}`,
                    },
                  },
                ],
              },
            ],
          },
        },
      ],
    },
  },
  {
    id: OUTPUT_ID,
    kind: "output",
    name: "Final Output",
    description: "Displays the generated blog post",
    uiConfig: { position: { x: 1200, y: 0 }, type: "default" },
    nodeConfig: {
      kind: "output",
      outputSchema: {
        type: "object",
        properties: {
          blogPost: { type: "string", title: "Blog Post" },
        },
      },
      outputData: [
        {
          key: "blogPost",
          source: { nodeId: WRITER_ID, path: ["answer", "content"] },
        },
      ],
    },
  },
];

export const contentCreationEdges: Partial<DBEdge>[] = [
  {
    source: INPUT_ID,
    target: OUTLINE_ID,
    uiConfig: {},
  },
  {
    source: OUTLINE_ID,
    target: WRITER_ID,
    uiConfig: {},
  },
  {
    source: WRITER_ID,
    target: OUTPUT_ID,
    uiConfig: {},
  },
];
