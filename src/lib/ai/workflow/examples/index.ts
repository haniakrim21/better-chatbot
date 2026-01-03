import { DBEdge, DBNode, DBWorkflow } from "app-types/workflow";
import { generateUUID } from "lib/utils";
import { babyResearchEdges, babyResearchNodes } from "./baby-research";
import { getWeatherEdges, getWeatherNodes } from "./get-weather";
import { sequentialEdges, sequentialNodes } from "./sequential-processing";
import { parallelEdges, parallelNodes } from "./parallel-processing";

export const GetWeather = (): {
  workflow: Partial<DBWorkflow>;
  nodes: Partial<DBNode>[];
  edges: Partial<DBEdge>[];
} => {
  return {
    workflow: {
      description: "Get weather data from the API",
      name: "Get Weather",
      isPublished: true,
      visibility: "private",
      icon: {
        type: "emoji",
        value:
          "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26c8-fe0f.png",
        style: {
          backgroundColor: "oklch(20.5% 0 0)",
        },
      },
    },
    nodes: getWeatherNodes,
    edges: getWeatherEdges.map((edge) => ({
      ...edge,
      id: generateUUID(),
    })),
  };
};

export const BabyResearch = (): {
  workflow: Partial<DBWorkflow>;
  nodes: Partial<DBNode>[];
  edges: Partial<DBEdge>[];
} => {
  return {
    workflow: {
      description:
        "Comprehensive web research workflow that performs multi-layered search and content analysis to generate detailed research reports based on user instructions and research objectives.",
      name: "baby-research",
      isPublished: true,
      visibility: "private",
      icon: {
        type: "emoji",
        value:
          "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f468-1f3fb-200d-1f52c.png",
        style: {
          backgroundColor: "oklch(78.5% 0.115 274.713)",
        },
      },
    },
    nodes: babyResearchNodes,
    edges: babyResearchEdges.map((edge) => ({
      ...edge,
      id: generateUUID(),
    })),
  };
};

export const SequentialProcessing = (): {
  workflow: Partial<DBWorkflow>;
  nodes: Partial<DBNode>[];
  edges: Partial<DBEdge>[];
} => {
  return {
    workflow: {
      description: "Linear process: Summarize -> Translate -> Output",
      name: "Sequential Processing",
      isPublished: true,
      visibility: "private",
      icon: {
        type: "emoji",
        value: "➡️",
        style: {
          backgroundColor: "oklch(50% 0.1 200)",
        },
      },
    },
    nodes: sequentialNodes,
    edges: sequentialEdges.map((edge) => ({
      ...edge,
      id: generateUUID(),
    })),
  };
};

export const ParallelProcessing = (): {
  workflow: Partial<DBWorkflow>;
  nodes: Partial<DBNode>[];
  edges: Partial<DBEdge>[];
} => {
  return {
    workflow: {
      description: "Parallel tasks: Sentiment & Keyword Extraction",
      name: "Parallel Processing",
      isPublished: true,
      visibility: "private",
      icon: {
        type: "emoji",
        value: "🔀",
        style: {
          backgroundColor: "oklch(60% 0.15 150)",
        },
      },
    },
    nodes: parallelNodes,
    edges: parallelEdges.map((edge) => ({
      ...edge,
      id: generateUUID(),
    })),
  };
};
