import {
  VercelAIMcpToolTag,
  type MCPServerConfig,
  type McpServerInsert,
  type McpServerSelect,
  type VercelAIMcpTool,
} from "app-types/mcp";
import { createMCPClient, type MCPClient } from "./create-mcp-client";
import {
  errorToString,
  generateUUID,
  Locker,
  safeJSONParse,
  toAny,
} from "lib/utils";
import { safe } from "ts-safe";
import { McpServerTable } from "lib/db/pg/schema.pg";
import { createMCPToolId } from "./mcp-tool-id";
import globalLogger from "logger";
import { jsonSchema, ToolCallOptions } from "ai";
import { createMemoryMCPConfigStorage } from "./memory-mcp-config-storage";
import { colorize } from "consola/utils";

/**
 * Interface for storage of MCP server configurations.
 * Implementations should handle persistent storage of server configs.
 *
 * IMPORTANT: When implementing this interface, be aware that:
 * - Storage can be modified externally (e.g., file edited manually)
 * - Concurrent modifications may occur from multiple processes
 * - Implementations should either handle these scenarios or document limitations
 */
export interface MCPConfigStorage {
  init(manager: MCPClientsManager): Promise<void>;
  loadAll(opt?: { teamIds?: string[] }): Promise<McpServerSelect[]>;
  save(server: McpServerInsert): Promise<McpServerSelect>;
  delete(id: string): Promise<void>;
  has(id: string): Promise<boolean>;
  get(id: string): Promise<McpServerSelect | null>;
}

export class MCPClientsManager {
  protected clients = new Map<
    string,
    {
      client: MCPClient;
      name: string;
    }
  >();
  private initializedLock = new Locker();
  private initialized = false;
  private logger = globalLogger.withDefaults({
    message: colorize("dim", `[${generateUUID().slice(0, 4)}] MCP Manager: `),
  });

  // Optional storage for persistent configurations
  constructor(
    private storage: MCPConfigStorage = createMemoryMCPConfigStorage(),
    private autoDisconnectSeconds: number = 60 * 30, // 30 minutes
  ) {
    process.on("SIGINT", this.cleanup.bind(this));
    process.on("SIGTERM", this.cleanup.bind(this));
  }

  private async waitInitialized() {
    if (this.initialized) {
      return;
    }
    if (this.initializedLock.isLocked) {
      await this.initializedLock.wait();
      return;
    }
    await this.init();
  }

  async init() {
    this.logger.info("Initializing MCP clients manager");
    if (this.initializedLock.isLocked) {
      this.logger.info(
        "MCP clients manager already initialized, waiting for lock",
      );
      return this.initializedLock.wait();
    }
    if (this.initialized) {
      this.logger.info("MCP clients manager already initialized");
      return;
    }
    return safe(() => this.initializedLock.lock())
      .ifOk(async () => {
        if (this.storage) {
          await this.storage.init(this);
          const configs = await this.storage.loadAll();
          await Promise.all(
            configs
              .filter((c) => c.enabled !== false)
              .map(({ id, name, config }) =>
                this.addClient(id, name, config).catch((error) => {
                  this.logger.error(
                    `Failed to initialize client ${name}:`,
                    error,
                  );
                }),
              ),
          );
        }
      })
      .watch(() => {
        this.initializedLock.unlock();
        this.initialized = true;
      })
      .unwrap();
  }

  /**
   * Returns all tools from all clients as a flat object
   */
  async tools(opt?: {
    teamIds?: string[];
  }): Promise<Record<string, VercelAIMcpTool>> {
    await this.waitInitialized();

    // If teamIds are provided, we need to ensure we have clients for those team servers
    if (opt?.teamIds?.length && this.storage) {
      const allConfigs = await this.storage.loadAll({ teamIds: opt.teamIds });
      await Promise.all(
        allConfigs
          .filter((c) => c.enabled !== false)
          .map(async ({ id, name, config }) => {
            if (!this.clients.has(id)) {
              await this.addClient(id, name, config).catch((error) => {
                this.logger.error(
                  `Failed to initialize client ${name}:`,
                  error,
                );
              });
            }
          }),
      );
    }
    // Filter clients based on teamIds (and public/owned logic implied by repository) if needed
    // But since tools() returns all initialized tools, and we just initialized team tools,
    // we might receive tools from other users if shared memory?
    // Actually MCPClientsManager is globalSingle, so it holds ALL clients.
    // We should filter the returned tools based on visibility.
    // However, existing logic just returns everything.
    // The safest way is to filter the clients we iterate over.

    let clientsToUse = Array.from(this.clients.entries());

    if (opt?.teamIds?.length && this.storage) {
      // Re-fetch allowed configs for this user context (public + user-owned + team-owned)
      // Optimization: loadAll with teamIds returns exactly what this user should see.
      const allowedConfigs = await this.storage.loadAll({
        teamIds: opt.teamIds,
      });
      const allowedIds = new Set(allowedConfigs.map((c) => c.id));
      clientsToUse = clientsToUse.filter(([id]) => allowedIds.has(id));
    }

    return clientsToUse.reduce(
      (acc, [id, client]) => {
        if (!client.client?.toolInfo?.length) return acc;
        const clientName = client.name;
        return {
          ...acc,
          ...client.client.toolInfo.reduce(
            (bcc, tool) => {
              return {
                ...bcc,
                [createMCPToolId(clientName, tool.name)]:
                  VercelAIMcpToolTag.create({
                    description: tool.description,
                    inputSchema: jsonSchema(
                      toAny({
                        ...tool.inputSchema,
                        properties: tool.inputSchema?.properties ?? {},
                        additionalProperties: false,
                      }),
                    ),
                    _originToolName: tool.name,
                    _mcpServerName: clientName,
                    _mcpServerId: id,
                    execute: (params, options: ToolCallOptions) => {
                      options?.abortSignal?.throwIfAborted();
                      return this.toolCall(id, tool.name, params);
                    },
                  }),
              };
            },
            {} as Record<string, VercelAIMcpTool>,
          ),
        };
      },
      {} as Record<string, VercelAIMcpTool>,
    );
  }
  /**
   * Creates and adds a new client instance to memory only (no storage persistence)
   */
  async addClient(id: string, name: string, serverConfig: MCPServerConfig) {
    if (this.clients.has(id)) {
      const prevClient = this.clients.get(id)!;
      void prevClient.client.disconnect();
    }
    const client = createMCPClient(id, name, serverConfig, {
      autoDisconnectSeconds: this.autoDisconnectSeconds,
    });
    this.clients.set(id, { client, name });
    return client.connect();
  }

  /**
   * Persists a new client configuration to storage and adds the client instance to memory
   */
  async persistClient(server: typeof McpServerTable.$inferInsert) {
    let id = server.name;
    if (this.storage) {
      const entity = await this.storage.save(server);
      id = entity.id;
    }
    await this.addClient(id, server.name, server.config).catch(async (err) => {
      // If connection fails, disable the server instead of deleting it
      // unless it really didn't have an ID (which shouldn't happen with DB storage easily)
      if (this.storage) {
        this.logger.warn(
          `Failed to connect to new MCP client ${server.name}, disabling it. Error: ${err.message}`,
        );
        // We know 'id' is the persisted ID now.
        // We need to update it to be disabled.
        // The `save` method usually handles update if ID exists, or we might need `storage.save` with updated fields.
        // McpServerTable.$inferInsert usually allows all fields.
        await this.storage.save({
          ...server,
          id,
          enabled: false,
          tags: server.tags ?? undefined,
        });
      } else {
        // Memory storage backup behavior
        if (!server.id) {
          void this.removeClient(id);
        }
      }
      throw err;
    });

    return this.clients.get(id)!;
  }

  /**
   * Removes a client by name, disposing resources and removing from storage
   */
  async removeClient(id: string) {
    if (this.storage) {
      if (await this.storage.has(id)) {
        await this.storage.delete(id);
      }
    }
    this.disconnectClient(id);
  }

  async disconnectClient(id: string) {
    const client = this.clients.get(id);
    this.clients.delete(id);
    if (client) {
      void client.client.disconnect();
    }
  }

  /**
   * Refreshes an existing client with a new configuration or its existing config
   */
  async refreshClient(id: string) {
    await this.waitInitialized();
    const server = await this.storage.get(id);
    if (!server) {
      throw new Error(`Client ${id} not found`);
    }
    this.logger.info(`Refreshing client ${server.name}`);
    await this.addClient(id, server.name, server.config);
    return this.clients.get(id)!;
  }

  async cleanup() {
    const clients = Array.from(this.clients.values());
    this.clients.clear();
    await Promise.allSettled(clients.map(({ client }) => client.disconnect()));
  }

  async getClients() {
    await this.waitInitialized();
    return Array.from(this.clients.entries()).map(([id, { client }]) => ({
      id,
      client: client,
    }));
  }
  async getClient(id: string) {
    await this.waitInitialized();
    const client = this.clients.get(id);
    if (!client) {
      await this.refreshClient(id);
    }

    return this.clients.get(id);
  }
  async toolCallByServerName(
    serverName: string,
    toolName: string,
    input: unknown,
  ) {
    const clients = await this.getClients();
    const client = clients.find((c) => c.client.getInfo().name === serverName);
    if (!client) {
      if (this.storage) {
        const servers = await this.storage.loadAll();
        const server = servers.find((s) => s.name === serverName);
        if (server) {
          return this.toolCall(server.id, toolName, input);
        }
      }
      throw new Error(`Client ${serverName} not found`);
    }
    return this.toolCall(client.id, toolName, input);
  }
  async toolCall(id: string, toolName: string, input: unknown) {
    return safe(() => this.getClient(id))
      .map((client) => {
        if (!client) throw new Error(`Client ${id} not found`);
        return client.client;
      })
      .map((client) => client.callTool(toolName, input))
      .map((res) => {
        if (res?.content && Array.isArray(res.content)) {
          const parsedResult = {
            ...res,
            content: res.content.map((c: any) => {
              if (c?.type === "text" && c?.text) {
                const parsed = safeJSONParse(c.text);
                return {
                  type: "text",
                  text: parsed.success ? parsed.value : c.text,
                };
              }
              return c;
            }),
          };
          return parsedResult;
        }
        return res;
      })
      .ifFail((err) => {
        return {
          isError: true,
          error: {
            message: errorToString(err),
            name: err?.name || "ERROR",
          },
          content: [],
        };
      })
      .unwrap();
  }
}

export function createMCPClientsManager(
  storage?: MCPConfigStorage,
  autoDisconnectSeconds: number = 60 * 30, // 30 minutes
): MCPClientsManager {
  return new MCPClientsManager(storage, autoDisconnectSeconds);
}
