import { DBEdge, DBNode } from "app-types/workflow";

export const parallelNodes: Partial<DBNode>[] = [
  {
    id: "start",
    kind: "input",
    name: "Input Text",
    uiConfig: { position: { x: 0, y: 150 }, type: "default" },
    nodeConfig: {
      kind: "input",
      schema: {
        type: "object",
        properties: {
          text: { type: "string", title: "Text" },
        },
        required: ["text"],
      },
    },
  },
  {
    id: "sentiment",
    kind: "llm",
    name: "Sentiment Analysis",
    uiConfig: { position: { x: 300, y: 0 }, type: "default" },
    nodeConfig: {
      kind: "llm",
      model: { provider: "openai", model: "gpt-4o" },
      messages: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Analyze sentiment (positive/negative/neutral): ",
            },
            {
              type: "mention",
              attrs: { id: "start", label: "text", value: "text" },
            },
          ],
        },
      ],
    },
  },
  {
    id: "keywords",
    kind: "llm",
    name: "Keyword Extraction",
    uiConfig: { position: { x: 300, y: 300 }, type: "default" },
    nodeConfig: {
      kind: "llm",
      model: { provider: "openai", model: "gpt-4o" },
      messages: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Extract 5 keywords: " },
            {
              type: "mention",
              attrs: { id: "start", label: "text", value: "text" },
            },
          ],
        },
      ],
    },
  },
  {
    id: "end",
    kind: "output",
    name: "Result",
    uiConfig: { position: { x: 600, y: 150 }, type: "default" },
    nodeConfig: {
      kind: "output",
      schema: {
        type: "object",
        properties: {
          sentiment: { type: "string" },
          keywords: { type: "string" },
        },
      },
    },
  },
];

export const parallelEdges: Partial<DBEdge>[] = [
  {
    source: "start",
    target: "sentiment",
    uiConfig: { sourceHandle: "right", targetHandle: "left" },
  },
  {
    source: "start",
    target: "keywords",
    uiConfig: { sourceHandle: "right", targetHandle: "left" },
  },
  {
    source: "sentiment",
    target: "end",
    uiConfig: { sourceHandle: "right", targetHandle: "left" },
  },
  {
    source: "keywords",
    target: "end",
    uiConfig: { sourceHandle: "right", targetHandle: "left" },
  },
];
