import crypto from "node:crypto";
import { pgDb } from "lib/db/pg/db.pg";
import { PlatformApiKeyTable } from "lib/db/pg/schema.pg";
import { eq, and, isNull, or, gt } from "drizzle-orm";
import logger from "logger";

/**
 * Professional API Key Format:
 * nbd_live_[24_random_base62_chars][6_checksum_chars]
 */

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function generateRandomBase62(length: number): string {
  let result = "";
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += BASE62[randomBytes[i] % 62];
  }
  return result;
}

function calculateChecksum(payload: string): string {
  return crypto
    .createHash("sha256")
    .update(payload + process.env.BETTER_AUTH_SECRET)
    .digest("hex")
    .slice(0, 6);
}

/**
 * Generate a secure API key.
 */
export function generateApiKey(name: string, userId: string, teamId?: string) {
  const prefix = "nbd_live_";
  const randomPart = generateRandomBase62(24);
  const checksum = calculateChecksum(randomPart);

  const fullKey = `${prefix}${randomPart}${checksum}`;

  // Use a faster hash for DB lookups, but keep it secure.
  const keyHash = crypto.createHash("sha256").update(fullKey).digest("hex");

  // Identification prefix for UI (e.g., nbd_live_abc123)
  const shortPrefix = fullKey.slice(0, 15);

  return {
    plainKey: fullKey,
    keyHash,
    prefix: shortPrefix,
  };
}

/**
 * Validate an API key and return the associated record if valid and not expired.
 */
export async function validateApiKey(fullKey: string) {
  if (!fullKey || !fullKey.startsWith("nbd_live_")) {
    return null;
  }

  // Quick checksum check before DB lookup
  const randomPart = fullKey.slice(9, 33);
  const providedChecksum = fullKey.slice(33);

  if (calculateChecksum(randomPart) !== providedChecksum) {
    logger.warn("Invalid API key checksum detected");
    return null;
  }

  const hash = crypto.createHash("sha256").update(fullKey).digest("hex");

  try {
    const [record] = await pgDb
      .select()
      .from(PlatformApiKeyTable)
      .where(
        and(
          eq(PlatformApiKeyTable.keyHash, hash),
          isNull(PlatformApiKeyTable.revokedAt),
          or(
            isNull(PlatformApiKeyTable.expiresAt),
            gt(PlatformApiKeyTable.expiresAt, new Date()),
          ),
        ),
      )
      .limit(1);

    if (record) {
      // Update last used timestamp asynchronously
      pgDb
        .update(PlatformApiKeyTable)
        .set({ lastUsedAt: new Date(), updatedAt: new Date() })
        .where(eq(PlatformApiKeyTable.id, record.id))
        .catch((err) => logger.error("Failed to update API key status", err));

      return record;
    }
  } catch (error) {
    logger.error("Error validating API key", error);
  }

  return null;
}

/**
 * Check if a validated key has the required scope.
 */
export function hasScope(record: any, requiredScope: string): boolean {
  if (!record.scopes || record.scopes.length === 0) return true; // Default to all if none specified? Or none?
  // Professional approach: if scopes are set, they must include the required one.
  return record.scopes.includes(requiredScope) || record.scopes.includes("*");
}
