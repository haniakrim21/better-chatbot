import { MCPServerInfo } from "app-types/mcp";
import { mcpClientsManager } from "lib/ai/mcp/mcp-manager";
import { mcpRepository, userRepository } from "lib/db/repository";
import { getCurrentUser } from "lib/auth/permissions";

import { FILE_BASED_MCP_CONFIG } from "lib/const";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser || !currentUser.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // If file based config is enabled, we return the running clients directly
  // avoiding the DB reconciliation logic which would kill file-based services
  if (FILE_BASED_MCP_CONFIG) {
    const clients = await mcpClientsManager.getClients();
    const result = clients.map(({ id, client }) => {
      const info = client.getInfo();
      const mcpInfo: MCPServerInfo = {
        id,
        name: info.name,
        config: info.config, // Owner (file admin) sees config
        userId: currentUser.id, // Mock ownership for UI consistency
        visibility: "private",
        enabled: info.enabled ?? true,
        status: info.status ?? "connected",
        error: info.error,
        toolInfo: info.toolInfo ?? [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return mcpInfo;
    });
    return Response.json(result);
  }

  const teamIds = await userRepository.getTeamsByUserId(currentUser.id);

  const [servers, memoryClients] = await Promise.all([
    mcpRepository.selectAllForUser(currentUser.id, teamIds),
    mcpClientsManager.getClients(),
  ]);

  const memoryMap = new Map(
    memoryClients.map(({ id, client }) => [id, client] as const),
  );

  const addTargets = servers.filter((server) => !memoryMap.has(server.id));

  const serverIds = new Set(servers.map((s) => s.id));
  const removeTargets = memoryClients.filter(({ id }) => !serverIds.has(id));

  if (addTargets.length > 0) {
    // no need to wait for this
    Promise.allSettled(
      addTargets.map((server) => mcpClientsManager.refreshClient(server.id)),
    );
  }
  if (removeTargets.length > 0) {
    // no need to wait for this
    Promise.allSettled(
      removeTargets.map((client) =>
        mcpClientsManager.disconnectClient(client.id),
      ),
    );
  }

  const result = servers.map((server) => {
    const mem = memoryMap.get(server.id);
    const info = mem?.getInfo();
    const isOwner = server.userId === currentUser.id;
    const mcpInfo: MCPServerInfo = {
      ...server,
      description: server.description ?? undefined,
      tags: server.tags ?? undefined,
      // Hide config from non-owners to prevent credential exposure
      config: isOwner ? server.config : undefined,
      enabled: info?.enabled ?? true,
      status: info?.status ?? "connected",
      error: info?.error,
      toolInfo: info?.toolInfo ?? [],
    };
    return mcpInfo;
  });

  return Response.json(result);
}
