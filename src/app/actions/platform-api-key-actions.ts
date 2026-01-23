"use server";

import { validatedActionWithUser } from "lib/action-utils";
import { z } from "zod";
import { PlatformApiKeyTable } from "lib/db/pg/schema.pg";
import { pgDb } from "lib/db/pg/db.pg";
import { generateApiKey } from "lib/auth/api-key";
import { eq, and, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { encrypt, decrypt } from "lib/encryption";

const CreatePlatformApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.string().optional(), // Comma-separated or JSON string
  expiresInDays: z.string().optional(), // Optional expiration in days
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
          scopes: PlatformApiKeyTable.scopes,
          expiresAt: PlatformApiKeyTable.expiresAt,
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

      let expiresAt: Date | null = null;
      if (data.expiresInDays) {
        const days = parseInt(data.expiresInDays);
        if (!isNaN(days) && days > 0) {
          expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + days);
        }
      }

      const scopes = data.scopes
        ? data.scopes.split(",").map((s) => s.trim())
        : ["*"]; // Default to full access if none provided

      await pgDb.insert(PlatformApiKeyTable).values({
        userId: userSession.id,
        name: data.name,
        keyHash: keyHash,
        prefix: prefix,
        scopes: scopes,
        expiresAt: expiresAt,
        encryptedKey: encrypt(plainKey),
      });

      revalidatePath("/profile");

      return {
        success: true,
        data: { key: plainKey },
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
        .set({
          revokedAt: new Date(),
          updatedAt: new Date(),
        })
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

export const revealPlatformApiKey = validatedActionWithUser(
  RevokePlatformApiKeySchema, // We can reuse this as it just needs the ID
  async (data, _, userSession) => {
    try {
      const [record] = await pgDb
        .select({
          encryptedKey: PlatformApiKeyTable.encryptedKey,
        })
        .from(PlatformApiKeyTable)
        .where(
          and(
            eq(PlatformApiKeyTable.id, data.id),
            eq(PlatformApiKeyTable.userId, userSession.id),
            isNull(PlatformApiKeyTable.revokedAt),
          ),
        )
        .limit(1);

      if (!record || !record.encryptedKey) {
        return {
          success: false,
          error: record
            ? "This key was created before reveal was supported and cannot be recovered."
            : "Key not found",
        };
      }

      const plainKey = decrypt(record.encryptedKey);

      return {
        success: true,
        data: { key: plainKey },
      };
    } catch (error) {
      console.error("Failed to reveal platform API key:", error);
      return { success: false, error: "Failed to reveal platform API key" };
    }
  },
);
