import { ToolPreset, ToolPresetRepository } from "app-types/preset";
import { eq } from "drizzle-orm";
import { generateUUID } from "lib/utils";
import { pgDb as db } from "../db.pg";
import { ToolPresetTable } from "../schema.pg";

export const pgPresetRepository: ToolPresetRepository = {
  async createPreset(preset) {
    const [result] = await db
      .insert(ToolPresetTable)
      .values({
        id: generateUUID(),
        name: preset.name,
        allowedMcpServers: preset.allowedMcpServers ?? null,
        allowedAppDefaultToolkit:
          (preset.allowedAppDefaultToolkit as string[]) ?? null,
        userId: preset.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return result as unknown as ToolPreset;
  },

  async getPresetsByUserId(userId) {
    const result = await db
      .select()
      .from(ToolPresetTable)
      .where(eq(ToolPresetTable.userId, userId))
      .orderBy(ToolPresetTable.createdAt);
    return result as unknown as ToolPreset[];
  },

  async getPresetById(id) {
    const [result] = await db
      .select()
      .from(ToolPresetTable)
      .where(eq(ToolPresetTable.id, id));
    return (result as unknown as ToolPreset) ?? null;
  },

  async updatePreset(id, preset) {
    const [result] = await db
      .update(ToolPresetTable)
      .set({
        ...(preset.name !== undefined ? { name: preset.name } : {}),
        ...(preset.allowedMcpServers !== undefined
          ? { allowedMcpServers: preset.allowedMcpServers }
          : {}),
        ...(preset.allowedAppDefaultToolkit !== undefined
          ? {
              allowedAppDefaultToolkit:
                preset.allowedAppDefaultToolkit as string[],
            }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(ToolPresetTable.id, id))
      .returning();
    return result as unknown as ToolPreset;
  },

  async deletePreset(id) {
    await db.delete(ToolPresetTable).where(eq(ToolPresetTable.id, id));
  },
};
