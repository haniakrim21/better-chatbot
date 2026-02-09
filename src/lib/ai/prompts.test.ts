import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  buildAppDefaultToolsSystemPrompt,
  buildMcpServerCustomizationsSystemPrompt,
  buildPersonalityPresetPrompt,
} from "./prompts";

describe("buildPersonalityPresetPrompt", () => {
  it("returns empty string for undefined preset", () => {
    expect(buildPersonalityPresetPrompt(undefined)).toBe("");
  });

  it('returns empty string for "default" preset', () => {
    expect(buildPersonalityPresetPrompt("default")).toBe("");
  });

  it('returns concise style prompt for "concise" preset', () => {
    const result = buildPersonalityPresetPrompt("concise");
    expect(result).toContain("Concise");
    expect(result).toContain("brief and to the point");
  });

  it('returns detailed style prompt for "detailed" preset', () => {
    const result = buildPersonalityPresetPrompt("detailed");
    expect(result).toContain("Detailed");
    expect(result).toContain("thorough");
  });

  it('returns creative style prompt for "creative" preset', () => {
    const result = buildPersonalityPresetPrompt("creative");
    expect(result).toContain("Creative");
    expect(result).toContain("vivid language");
  });

  it('returns technical style prompt for "technical" preset', () => {
    const result = buildPersonalityPresetPrompt("technical");
    expect(result).toContain("Technical");
    expect(result).toContain("precise technical terminology");
  });
});

describe("buildAppDefaultToolsSystemPrompt", () => {
  it("returns empty string for empty toolkit", () => {
    expect(buildAppDefaultToolsSystemPrompt([])).toBe("");
  });

  it("returns prompt with visualization description", () => {
    const result = buildAppDefaultToolsSystemPrompt(["visualization"]);
    expect(result).toContain("Activated Capabilities");
    expect(result).toContain("PieChart");
  });

  it("returns prompt with multiple tools", () => {
    const result = buildAppDefaultToolsSystemPrompt([
      "webSearch",
      "code",
      "document",
    ]);
    expect(result).toContain("search the web");
    expect(result).toContain("execute code");
    expect(result).toContain("GenerateDocument");
  });

  it("ignores unknown tool keys", () => {
    const result = buildAppDefaultToolsSystemPrompt(["unknownTool"]);
    expect(result).toBe("");
  });
});

describe("buildMcpServerCustomizationsSystemPrompt", () => {
  it("returns playwright tips when no custom instructions exist", () => {
    const result = buildMcpServerCustomizationsSystemPrompt({});
    expect(result).toContain("playwright");
    expect(result).toContain("browser_run_code");
  });

  it("includes server-specific instructions", () => {
    const result = buildMcpServerCustomizationsSystemPrompt({
      "my-server": {
        id: "server-1",
        name: "my-server",
        prompt: "Always use JSON format",
        tools: {
          myTool: "Use this tool for data fetching",
        },
      },
    });
    expect(result).toContain("Tool Usage Guidelines");
    expect(result).toContain("Always use JSON format");
    expect(result).toContain("Use this tool for data fetching");
    expect(result).toContain("<my-server>");
  });
});
