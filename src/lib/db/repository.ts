import { pgAgentRepository } from "./pg/repositories/agent-repository.pg";
import { pgArchiveRepository } from "./pg/repositories/archive-repository.pg";
import { pgBookmarkRepository } from "./pg/repositories/bookmark-repository.pg";
import { pgCanvasDocumentRepository } from "./pg/repositories/canvas-document-repository.pg";
import { pgChatExportRepository } from "./pg/repositories/chat-export-repository.pg";
import { pgChatRepository } from "./pg/repositories/chat-repository.pg";
import { pgMcpOAuthRepository } from "./pg/repositories/mcp-oauth-repository.pg";
import { pgMcpRepository } from "./pg/repositories/mcp-repository.pg";
import { pgMcpServerCustomizationRepository } from "./pg/repositories/mcp-server-customization-repository.pg";
import { pgMcpMcpToolCustomizationRepository } from "./pg/repositories/mcp-tool-customization-repository.pg";
import { pgPresetRepository } from "./pg/repositories/preset-repository.pg";
import { pgUserRepository } from "./pg/repositories/user-repository.pg";
import { pgWorkflowRepository } from "./pg/repositories/workflow-repository.pg";

export const chatRepository = pgChatRepository;
export const userRepository = pgUserRepository;
export const mcpRepository = pgMcpRepository;
export const mcpMcpToolCustomizationRepository =
  pgMcpMcpToolCustomizationRepository;
export const mcpServerCustomizationRepository =
  pgMcpServerCustomizationRepository;
export const mcpOAuthRepository = pgMcpOAuthRepository;

export const workflowRepository = pgWorkflowRepository;
export const agentRepository = pgAgentRepository;
export const archiveRepository = pgArchiveRepository;
export const bookmarkRepository = pgBookmarkRepository;
export const chatExportRepository = pgChatExportRepository;
export const canvasDocumentRepository = pgCanvasDocumentRepository;
export const presetRepository = pgPresetRepository;

export { pgAutomationRepository as automationRepository } from "./pg/repositories/automation-repository.pg";
export { pgMemoryRepository as memoryRepository } from "./pg/repositories/memory-repository.pg";
export { pgPromptRepository as promptRepository } from "./pg/repositories/prompt-repository.pg";
export { pgSearchRepository as searchRepository } from "./pg/repositories/search-repository.pg";
export { pgSkillRepository as skillRepository } from "./pg/repositories/skill-repository.pg";
export { pgUsageAnalyticsRepository as usageAnalyticsRepository } from "./pg/repositories/usage-analytics-repository.pg";
