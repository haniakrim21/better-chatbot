import { DBEdge, DBNode } from "app-types/workflow";

export const sequentialNodes: Partial<DBNode>[] = [
  {
    id: "node-1",
    kind: "input",
    name: "Start",
    uiConfig: { position: { x: 0, y: 0 }, type: "default" },
    nodeConfig: {
      kind: "input",
      schema: {
        type: "object",
        properties: {
          input: { type: "string", title: "Text to Process" },
        },
        required: ["input"],
      },
    },
  },
  {
    id: "node-2",
    kind: "llm",
    name: "Summarize",
    uiConfig: { position: { x: 300, y: 0 }, type: "default" },
    nodeConfig: {
      kind: "llm",
      model: { provider: "openai", model: "gpt-4o" },
      messages: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Summarize the following text: " },
            {
              type: "mention",
              attrs: { id: "node-1", label: "input", value: "input" },
            },
          ],
        },
      ],
    },
  },
  {
    id: "node-3",
    kind: "llm",
    name: "Translate",
    uiConfig: { position: { x: 600, y: 0 }, type: "default" },
    nodeConfig: {
      kind: "llm",
      model: { provider: "openai", model: "gpt-4o" },
      messages: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Translate this summary to Spanish: " },
            {
              type: "mention",
              attrs: { id: "node-2", label: "output", value: "output" },
            },
          ],
        },
      ],
    },
  },
  {
    id: "node-4",
    kind: "output",
    name: "End",
    uiConfig: { position: { x: 900, y: 0 }, type: "default" },
    nodeConfig: {
      kind: "output",
      schema: {
        type: "object",
        properties: {
          result: { type: "string", title: "Translated Summary" },
        },
      },
    },
  },
];

export const sequentialEdges: Partial<DBEdge>[] = [
  {
    source: "node-1",
    target: "node-2",
    uiConfig: { sourceHandle: "right", targetHandle: "left" },
  },
  {
    source: "node-2",
    target: "node-3",
    uiConfig: { sourceHandle: "right", targetHandle: "left" },
  },
  {
    source: "node-3",
    target: "node-4",
    uiConfig: { sourceHandle: "right", targetHandle: "left" },
  },
];
