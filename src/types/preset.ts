import { AllowedMCPServer } from "app-types/mcp";
import { AppDefaultToolkit } from "lib/ai/tools";
import { z } from "zod";

export const PresetCreateSchema = z.object({
  name: z.string().min(1).max(100),
  allowedMcpServers: z.record(z.string(), z.any()).optional(),
  allowedAppDefaultToolkit: z.array(z.nativeEnum(AppDefaultToolkit)).optional(),
});

export const PresetUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  allowedMcpServers: z.record(z.string(), z.any()).optional(),
  allowedAppDefaultToolkit: z.array(z.nativeEnum(AppDefaultToolkit)).optional(),
});

export type ToolPreset = {
  id: string;
  name: string;
  allowedMcpServers?: Record<string, AllowedMCPServer>;
  allowedAppDefaultToolkit?: AppDefaultToolkit[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ToolPresetRepository = {
  createPreset(
    preset: Omit<ToolPreset, "id" | "createdAt" | "updatedAt">,
  ): Promise<ToolPreset>;
  getPresetsByUserId(userId: string): Promise<ToolPreset[]>;
  getPresetById(id: string): Promise<ToolPreset | null>;
  updatePreset(
    id: string,
    preset: Partial<Omit<ToolPreset, "id" | "createdAt" | "updatedAt">>,
  ): Promise<ToolPreset>;
  deletePreset(id: string): Promise<void>;
};
