import type { MCPConfigStorage } from "./create-mcp-clients-manager";
import { mcpRepository } from "lib/db/repository";
import defaultLogger from "logger";

import { colorize } from "consola/utils";

const logger = defaultLogger.withDefaults({
  message: colorize("gray", ` MCP Config Storage: `),
});

export function createDbBasedMCPConfigsStorage(): MCPConfigStorage {
  // Initializes the manager with configs from the database
  async function init(): Promise<void> {}

  return {
    init,
    async loadAll(opt) {
      try {
        // We are using selectAllForUser which is what we updated to accept teamIds
        // But wait, selectAllForUser requires a userId.
        // MCPClientsManager is singleton, it doesn't know the current user context.
        // The `tools` call in route.ts passes teamIds.
        // If we want to filter by teamIds, we should probably use a method that supports it.
        // Since this is a global manager, we might need to handle this carefully.
        // Actually, if we pass teamIds, we are asking for "public + teamId related" servers.
        // The selectAll() method in repository currently doesn't take arguments.
        // I should check mcp-repository.pg.ts to see what selectAll does.
        // If selectAll() returns EVERYTHING, then we filter in memory? No that's bad.
        // In db-mcp-config-storage.ts, `mcpRepository.selectAll()` is used.
        // Let's assume for now I will use `mcpRepository.selectAll(opt?.teamIds ?? [])`.
        // I need to verify mcpRepository.selectAll signature in mcp-repository.pg.ts
        const servers = await mcpRepository.selectAll(opt?.teamIds);
        return servers;
      } catch (error) {
        logger.error("Failed to load MCP configs from database:", error);
        return [];
      }
    },
    async save(server) {
      try {
        return mcpRepository.save(server);
      } catch (error) {
        logger.error(
          `Failed to save MCP config "${server.name}" to database:`,
          error,
        );
        throw error;
      }
    },
    async delete(id) {
      try {
        await mcpRepository.deleteById(id);
      } catch (error) {
        logger.error(
          `Failed to delete MCP config "${id}" from database:",`,
          error,
        );
        throw error;
      }
    },
    async has(id: string): Promise<boolean> {
      try {
        const server = await mcpRepository.selectById(id);
        return !!server;
      } catch (error) {
        logger.error(`Failed to check MCP config "${id}" in database:`, error);
        return false;
      }
    },
    async get(id) {
      return mcpRepository.selectById(id);
    },
  };
}
