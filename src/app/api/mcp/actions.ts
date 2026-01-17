"use server";
import { mcpClientsManager } from "lib/ai/mcp/mcp-manager";
import { z } from "zod";

import { McpServerTable } from "lib/db/pg/schema.pg";
import {
  mcpOAuthRepository,
  mcpRepository,
  userRepository,
} from "lib/db/repository";
import {
  canCreateMCP,
  canManageMCPServer,
  canShareMCPServer,
  getCurrentUser,
} from "lib/auth/permissions";
import { FILE_BASED_MCP_CONFIG } from "lib/const";

export async function selectMcpClientsAction() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return [];
  }

  if (FILE_BASED_MCP_CONFIG) {
    const list = await mcpClientsManager.getClients();
    return list.map(({ client, id }) => {
      const info = client.getInfo();
      return {
        ...info,
        id,
        userId: "file-based-user",
        visibility: "private",
        isOwner: true,
        canManage: true,
      };
    });
  }

  // Get all MCP servers the user can access (their own + shared)
  const teamIds = await userRepository.getTeamsByUserId(currentUser.id);
  const accessibleServers = await mcpRepository.selectAllForUser(
    currentUser.id,
    teamIds,
  );
  const accessibleIds = new Set(accessibleServers.map((s) => s.id));

  // Get all active clients and filter to only accessible ones
  const list = await mcpClientsManager.getClients();
  return list
    .filter(({ id }) => accessibleIds.has(id))
    .map(({ client, id }) => {
      const server = accessibleServers.find((s) => s.id === id);
      return {
        ...client.getInfo(),
        id,
        userId: server?.userId,
        visibility: server?.visibility,
        isOwner: server?.userId === currentUser.id,
        canManage: server
          ? server.userId === currentUser.id || currentUser.role === "admin"
          : false,
      };
    });
}

export async function selectMcpClientAction(id: string) {
  const client = await mcpClientsManager.getClient(id);
  if (!client) {
    throw new Error("Client not found");
  }
  return {
    ...client.client.getInfo(),
    id,
  };
}

export async function saveMcpClientAction(
  server: typeof McpServerTable.$inferInsert,
) {
  if (process.env.NOT_ALLOW_ADD_MCP_SERVERS) {
    throw new Error("Not allowed to add MCP servers");
  }

  // Get current user
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("You must be logged in to create MCP connections");
  }

  // Check if user has permission to create/edit MCP connections
  const hasPermission = await canCreateMCP();
  if (!hasPermission) {
    throw new Error("You don't have permission to create MCP connections");
  }
  // Validate name to ensure it only contains alphanumeric characters and hyphens
  const nameSchema = z.string().regex(/^[a-zA-Z0-9\-]+$/, {
    message:
      "Name must contain only alphanumeric characters (A-Z, a-z, 0-9) and hyphens (-)",
  });

  const result = nameSchema.safeParse(server.name);
  if (!result.success) {
    throw new Error(
      "Name must contain only alphanumeric characters (A-Z, a-z, 0-9) and hyphens (-)",
    );
  }

  // Check for duplicate names if creating a featured server
  if (server.visibility === "public") {
    // Only admins can create featured MCP servers
    const canShare = await canShareMCPServer();
    if (!canShare) {
      throw new Error("Only administrators can feature MCP servers");
    }

    // Check if a featured server with this name already exists
    const existing = await mcpRepository.existsByServerName(server.name);
    if (existing && !server.id) {
      throw new Error("A featured MCP server with this name already exists");
    }
  }

  // Add userId to the server object
  const serverWithUser = {
    ...server,
    userId: currentUser.id,
    visibility: server.visibility || "private",
  };

  return mcpClientsManager.persistClient(serverWithUser);
}

export async function existMcpClientByServerNameAction(serverName: string) {
  return await mcpRepository.existsByServerName(serverName);
}

export async function removeMcpClientAction(id: string) {
  if (FILE_BASED_MCP_CONFIG) {
    await mcpClientsManager.removeClient(id);
    return;
  }
  // Get the MCP server to check ownership
  const mcpServer = await mcpRepository.selectById(id);
  if (!mcpServer) {
    throw new Error("MCP server not found");
  }

  // Check if user has permission to delete this specific MCP server
  const canManage = await canManageMCPServer(
    mcpServer.userId,
    mcpServer.visibility,
  );
  if (!canManage) {
    throw new Error("You don't have permission to delete this MCP connection");
  }

  await mcpClientsManager.removeClient(id);
}

export async function refreshMcpClientAction(id: string) {
  await mcpClientsManager.refreshClient(id);
}

export async function authorizeMcpClientAction(id: string) {
  await refreshMcpClientAction(id);
  const client = await mcpClientsManager.getClient(id);
  if (client?.client.status != "authorizing") {
    throw new Error("Not Authorizing");
  }
  return client.client.getAuthorizationUrl()?.toString();
}

export async function checkTokenMcpClientAction(id: string) {
  if (FILE_BASED_MCP_CONFIG) {
    return false;
  }
  const session = await mcpOAuthRepository.getAuthenticatedSession(id);

  // for wait connect to mcp server
  await mcpClientsManager.getClient(id).catch(() => null);

  return !!session?.tokens;
}

export async function callMcpToolAction(
  id: string,
  toolName: string,
  input: unknown,
) {
  return mcpClientsManager.toolCall(id, toolName, input);
}

export async function callMcpToolByServerNameAction(
  serverName: string,
  toolName: string,
  input: unknown,
) {
  return mcpClientsManager.toolCallByServerName(serverName, toolName, input);
}

export async function shareMcpServerAction(
  id: string,
  visibility: "public" | "private",
) {
  if (FILE_BASED_MCP_CONFIG) {
    throw new Error("Sharing is not supported in file-based mode");
  }
  // Only admins can feature MCP servers
  const canShare = await canShareMCPServer();
  if (!canShare) {
    throw new Error("Only administrators can feature MCP servers");
  }

  // Update the visibility of the MCP server
  await mcpRepository.updateVisibility(id, visibility);

  return { success: true };
}

export async function installMcpServerAction(id: string) {
  if (FILE_BASED_MCP_CONFIG) {
    throw new Error("Installation is not supported in file-based mode");
  }
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("You must be logged in to install MCP servers");
  }

  // Fetch the server to be installed
  const server = await mcpRepository.selectById(id);
  if (!server) {
    throw new Error("MCP server not found");
  }

  // Check if user already owns it (optional: prevent installing own server?)
  // If they own it, creating a duplicate might be intended or not.
  // Generally "Install" implies getting it from store.
  // If I already have it, maybe I just want to enable it?
  // For now, allow duplication but maybe warn? Or just append "copy".

  // Create a copy for the current user
  const newServer = {
    name: server.name, // Potential name conflict handling if strictly required
    config: server.config,
    userId: currentUser.id,
    visibility: "private" as const,
    tags: server.tags || [],
    usageCount: 0,
    enabled: true,
  };

  // Persist the new client (this will generate a new ID)
  await mcpClientsManager.persistClient(newServer);

  // Increment usage count of the original server
  await mcpRepository.incrementUsage(id);

  return { success: true };
}
