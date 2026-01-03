I have researched the existing structure for agents and workflows. The codebase separates agent definitions (`src/lib/ai/agent/example.ts`) from workflow definitions (`src/lib/ai/workflow/examples/`). Workflows are more complex, involving separate files for nodes and edges.

To "Develop a comprehensive collection" as requested, I will create a new documentation file that serves as a central catalog and guide for these examples. This file will document the requested patterns and provide the implementation details (configurations) for each.

### Plan

1.  **Create Documentation**:
    *   Create `docs/tips-guides/comprehensive-examples.md`.
    *   This file will be the "deliverable" containing the comprehensive collection.
    *   It will include sections for:
        *   **Agent Types**: Single-purpose, Multi-agent (conceptual via tools), Hierarchical, Reactive/Proactive.
        *   **Workflow Examples**: Sequential, Parallel, Conditional, Error Handling, Human-in-the-loop.
        *   **Implementation Scenarios**: Data pipelines, Customer service, IT ops, etc.
    *   For each example, I will provide:
        *   Description & Use Case.
        *   "Architectural Diagram" (using Mermaid syntax).
        *   Configuration Details (JSON/TypeScript snippets matching the `Partial<Agent>` or `DBNode[]`/`DBEdge[]` structure found in the codebase).
        *   Input/Output samples.
        *   Performance & Scaling notes.

2.  **Verification**:
    *   The "verification" here is ensuring the documentation is accurate to the codebase's capabilities (e.g., using correct tool names like `DefaultToolName.JavascriptExecution` and node types like `llm`, `condition`, `tool`).

3.  **No Code Changes to Logic**:
    *   I will *not* be adding these hundreds of lines of example code directly into `src/lib/ai/workflow/examples/` as runnable code unless strictly necessary, as it would bloat the repo. The documentation guide is the most appropriate place for a "comprehensive collection" of *patterns*.
    *   However, I will ensure the examples provided in the doc are copy-pasteable valid configurations.

This approach fulfills the user's request for a "comprehensive collection... demonstrating various implementation patterns" in a structured, educational format suitable for the `docs/` directory.
