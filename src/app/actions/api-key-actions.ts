"use server";

import { validatedActionWithUser } from "lib/action-utils";
import { z } from "zod";
import { ApiKeyTable } from "lib/db/pg/schema.pg";
import { pgDb } from "lib/db/pg/db.pg";
import { encrypt, decrypt } from "lib/encryption";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const AddApiKeySchema = z.object({
  provider: z.string().min(1),
  key: z.string().min(1),
  label: z.string().optional(),
});

const RemoveApiKeySchema = z.object({
  id: z.string().uuid(),
});

export const getApiKeys = validatedActionWithUser(
  z.object({}),
  async (_, __, userSession) => {
    try {
      const keys = await pgDb
        .select({
          id: ApiKeyTable.id,
          provider: ApiKeyTable.provider,
          label: ApiKeyTable.label,
          createdAt: ApiKeyTable.createdAt,
          key: ApiKeyTable.key, // We'll mask this in the return
        })
        .from(ApiKeyTable)
        .where(eq(ApiKeyTable.userId, userSession.id));

      const maskedKeys = keys.map((k) => ({
        ...k,
        key: "•".repeat(20) + (tryDecrypt(k.key).slice(-4) || "...."),
      }));

      return {
        success: true,
        data: maskedKeys,
      };
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
      return { success: false, error: "Failed to fetch API keys" };
    }
  },
);

export const addApiKey = validatedActionWithUser(
  AddApiKeySchema,
  async (data, _, userSession) => {
    try {
      const encryptedKey = encrypt(data.key);

      await pgDb
        .insert(ApiKeyTable)
        .values({
          userId: userSession.id,
          provider: data.provider,
          key: encryptedKey,
          label: data.label,
        })
        .onConflictDoUpdate({
          target: [ApiKeyTable.userId, ApiKeyTable.provider],
          set: {
            key: encryptedKey,
            label: data.label,
            updatedAt: new Date(),
          },
        });

      revalidatePath("/profile");
      return { success: true };
    } catch (error) {
      console.error("Failed to add API key:", error);
      return { success: false, error: "Failed to add API key" };
    }
  },
);

export const removeApiKey = validatedActionWithUser(
  RemoveApiKeySchema,
  async (data, _, userSession) => {
    try {
      await pgDb
        .delete(ApiKeyTable)
        .where(
          and(
            eq(ApiKeyTable.id, data.id),
            eq(ApiKeyTable.userId, userSession.id),
          ),
        );

      revalidatePath("/profile");
      return { success: true };
    } catch (error) {
      console.error("Failed to remove API key:", error);
      return { success: false, error: "Failed to remove API key" };
    }
  },
);

function tryDecrypt(key: string) {
  try {
    return decrypt(key);
  } catch (_e) {
    return "";
  }
}
