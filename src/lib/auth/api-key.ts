import crypto from "node:crypto";
import { pgDb } from "lib/db/pg/db.pg";
import { PlatformApiKeyTable } from "lib/db/pg/schema.pg";
import { eq, and, isNull } from "drizzle-orm";
import logger from "logger";

/**
 * Generate a secure API key with a prefix.
 * Returns the plain key (for the user) and the hashed key (for storage).
 */
export function generateApiKey(name: string, userId: string, teamId?: string) {
  const prefix = "nbd_";
  // Generate 32 bytes of secure random data
  const rawKey = crypto.randomBytes(32).toString("hex");
  const fullKey = `${prefix}${rawKey}`;

  // Hash the full key for storage
  const hash = crypto.createHash("sha256").update(fullKey).digest("hex");
  const shortPrefix = fullKey.slice(0, 10); // "nbd_" + first 6 chars

  return {
    plainKey: fullKey,
    keyHash: hash,
    prefix: shortPrefix,
  };
}

/**
 * Validate an API key and return the associated record if valid.
 */
export async function validateApiKey(fullKey: string) {
  if (!fullKey || !fullKey.startsWith("nbd_")) {
    return null;
  }

  // Hash the incoming key to compare with the database
  const hash = crypto.createHash("sha256").update(fullKey).digest("hex");

  try {
    const [record] = await pgDb
      .select()
      .from(PlatformApiKeyTable)
      .where(
        and(
          eq(PlatformApiKeyTable.keyHash, hash),
          isNull(PlatformApiKeyTable.revokedAt),
        ),
      )
      .limit(1);

    if (record) {
      // Update last used timestamp asynchronously
      pgDb
        .update(PlatformApiKeyTable)
        .set({ lastUsedAt: new Date() })
        .where(eq(PlatformApiKeyTable.id, record.id))
        .catch((err) =>
          logger.error("Failed to update API key lastUsedAt", err),
        );

      return record;
    }
  } catch (error) {
    logger.error("Error validating API key", error);
  }

  return null;
}
