import { ObjectJsonSchema7 } from "app-types/util";
import { generateUUID } from "lib/utils";
import { defaultObjectJsonSchema } from "./shared.workflow";
import { NodeKind, UINode } from "./workflow.interface";

export function createUINode(
  kind: NodeKind,
  option?: Partial<{
    position: { x: number; y: number };
    name?: string;
    id?: string;
  }>,
): UINode {
  const id = option?.id ?? generateUUID();

  const node: UINode = {
    ...option,
    id,
    position: option?.position ?? { x: 0, y: 0 },
    data: {
      kind: kind as any,
      name: option?.name ?? kind.toUpperCase(),
      id,
      outputSchema: structuredClone(defaultObjectJsonSchema),
      runtime: {
        isNew: true,
      },
    },
    type: "default",
  };

  if (node.data.kind === NodeKind.Output) {
    node.data.outputData = [];
  } else if (node.data.kind === NodeKind.LLM) {
    node.data.outputSchema = structuredClone(defaultLLMNodeOutputSchema);
    node.data.messages = [
      {
        role: "user",
      },
    ];
  } else if (node.data.kind === NodeKind.Condition) {
    node.data.branches = {
      if: {
        id: "if",
        logicalOperator: "AND",
        type: "if",
        conditions: [],
      },
      else: {
        id: "else",
        logicalOperator: "AND",
        type: "else",
        conditions: [],
      },
    };
  } else if (node.data.kind === NodeKind.Tool) {
    node.data.outputSchema.properties = {
      tool_result: {
        type: "object",
      },
    };
  } else if (node.data.kind === NodeKind.Http) {
    node.data.outputSchema.properties = {
      response: {
        type: "object",
        properties: {
          status: {
            type: "number",
          },
          statusText: {
            type: "string",
          },
          ok: {
            type: "boolean",
          },
          headers: {
            type: "object",
          },
          body: {
            type: "string",
          },
          duration: {
            type: "number",
          },
          size: {
            type: "number",
          },
        },
      },
    };
    // Set default values for HTTP node
    node.data.method = "GET";
    node.data.headers = [];
    node.data.query = [];
    node.data.timeout = 30000; // 30 seconds default
  } else if (node.data.kind === NodeKind.Template) {
    node.data.outputSchema = structuredClone(defaultTemplateNodeOutputSchema);
    // Set default values for Template node
    node.data.template = {
      type: "tiptap",
      tiptap: {
        type: "doc",
        content: [],
      },
    };
  } else if (node.data.kind === NodeKind.MultiAgent) {
    node.data.outputSchema = structuredClone(defaultMultiAgentNodeOutputSchema);
    node.data.maxTurns = 10;
    node.data.taskDescription = {
      type: "doc",
      content: [],
    };
  } else if (node.data.kind === NodeKind.Code) {
    node.data.outputSchema = structuredClone(defaultCodeNodeOutputSchema);
    node.data.language = "javascript";
    node.data.code =
      '// Access previous node outputs via inputs object\n// Example: const data = inputs.myVar;\n\nreturn { message: "Hello from Code node!" };';
    node.data.timeout = 5000;
    node.data.inputMappings = [];
  } else if (node.data.kind === NodeKind.Loop) {
    node.data.outputSchema = structuredClone(defaultLoopNodeOutputSchema);
    node.data.itemVariable = "item";
    node.data.indexVariable = "index";
    node.data.maxIterations = 100;
    node.data.mode = "sequential";
  } else if (node.data.kind === NodeKind.Delay) {
    node.data.outputSchema = structuredClone(defaultDelayNodeOutputSchema);
    node.data.delayMs = 1000;
    node.data.delayType = "fixed";
  } else if (node.data.kind === NodeKind.SubWorkflow) {
    node.data.outputSchema = structuredClone(
      defaultSubWorkflowNodeOutputSchema,
    );
    node.data.inputMappings = [];
    node.data.timeout = 300000;
  } else if (node.data.kind === NodeKind.Storage) {
    node.data.outputSchema = structuredClone(defaultStorageNodeOutputSchema);
    node.data.operation = "get";
  } else if (node.data.kind === NodeKind.Approval) {
    node.data.outputSchema = structuredClone(defaultApprovalNodeOutputSchema);
    node.data.timeoutMs = 300000;
    node.data.onTimeout = "stop";
    node.data.message = { type: "doc", content: [] };
  }

  return node;
}

export const defaultLLMNodeOutputSchema: ObjectJsonSchema7 = {
  type: "object",
  properties: {
    answer: {
      type: "string",
    },
    totalTokens: {
      type: "number",
    },
  },
};

export const defaultTemplateNodeOutputSchema: ObjectJsonSchema7 = {
  type: "object",
  properties: {
    template: {
      type: "string",
    },
  },
};

export const defaultMultiAgentNodeOutputSchema: ObjectJsonSchema7 = {
  type: "object",
  properties: {
    result: {
      type: "string",
    },
    transcript: {
      type: "string",
    },
    turns: {
      type: "number",
    },
  },
};

export const defaultCodeNodeOutputSchema: ObjectJsonSchema7 = {
  type: "object",
  properties: {
    result: {
      type: "object",
    },
  },
};

export const defaultLoopNodeOutputSchema: ObjectJsonSchema7 = {
  type: "object",
  properties: {
    items: {
      type: "array",
    },
    length: {
      type: "number",
    },
    currentItem: {
      type: "object",
    },
    currentIndex: {
      type: "number",
    },
  },
};

export const defaultDelayNodeOutputSchema: ObjectJsonSchema7 = {
  type: "object",
  properties: {
    delayed: {
      type: "boolean",
    },
    delayMs: {
      type: "number",
    },
  },
};

export const defaultSubWorkflowNodeOutputSchema: ObjectJsonSchema7 = {
  type: "object",
  properties: {
    result: {
      type: "object",
    },
  },
};

export const defaultStorageNodeOutputSchema: ObjectJsonSchema7 = {
  type: "object",
  properties: {
    value: {
      type: "object",
    },
    found: {
      type: "boolean",
    },
  },
};

export const defaultApprovalNodeOutputSchema: ObjectJsonSchema7 = {
  type: "object",
  properties: {
    approved: {
      type: "boolean",
    },
    rejected: {
      type: "boolean",
    },
    message: {
      type: "string",
    },
  },
};
