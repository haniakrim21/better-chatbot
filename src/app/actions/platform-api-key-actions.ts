"use server";

import { validatedActionWithUser } from "lib/action-utils";
import { z } from "zod";
import { PlatformApiKeyTable } from "lib/db/pg/schema.pg";
import { pgDb } from "lib/db/pg/db.pg";
import { generateApiKey } from "lib/auth/api-key";
import { eq, and, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const CreatePlatformApiKeySchema = z.object({
  name: z.string().min(1).max(100),
});

const RevokePlatformApiKeySchema = z.object({
  id: z.string().uuid(),
});

export const getPlatformApiKeys = validatedActionWithUser(
  z.object({}),
  async (_, __, userSession) => {
    try {
      const keys = await pgDb
        .select({
          id: PlatformApiKeyTable.id,
          name: PlatformApiKeyTable.name,
          prefix: PlatformApiKeyTable.prefix,
          createdAt: PlatformApiKeyTable.createdAt,
          lastUsedAt: PlatformApiKeyTable.lastUsedAt,
        })
        .from(PlatformApiKeyTable)
        .where(
          and(
            eq(PlatformApiKeyTable.userId, userSession.id),
            isNull(PlatformApiKeyTable.revokedAt),
          ),
        );

      return {
        success: true,
        data: keys,
      };
    } catch (error) {
      console.error("Failed to fetch platform API keys:", error);
      return { success: false, error: "Failed to fetch platform API keys" };
    }
  },
);

export const createPlatformApiKey = validatedActionWithUser(
  CreatePlatformApiKeySchema,
  async (data, _, userSession) => {
    try {
      const { plainKey, keyHash, prefix } = generateApiKey(
        data.name,
        userSession.id,
      );

      await pgDb.insert(PlatformApiKeyTable).values({
        userId: userSession.id,
        name: data.name,
        keyHash: keyHash,
        prefix: prefix,
      });

      revalidatePath("/profile");

      return {
        success: true,
        data: { key: plainKey }, // Only return plain key once
      };
    } catch (error) {
      console.error("Failed to create platform API key:", error);
      return { success: false, error: "Failed to create platform API key" };
    }
  },
);

export const revokePlatformApiKey = validatedActionWithUser(
  RevokePlatformApiKeySchema,
  async (data, _, userSession) => {
    try {
      await pgDb
        .update(PlatformApiKeyTable)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(PlatformApiKeyTable.id, data.id),
            eq(PlatformApiKeyTable.userId, userSession.id),
          ),
        );

      revalidatePath("/profile");
      return { success: true };
    } catch (error) {
      console.error("Failed to revoke platform API key:", error);
      return { success: false, error: "Failed to revoke platform API key" };
    }
  },
);
