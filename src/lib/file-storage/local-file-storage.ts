import fs from "node:fs/promises";
import path from "node:path";
import { FileNotFoundError } from "lib/errors";
import type {
  FileMetadata,
  FileStorage,
  UploadOptions,
} from "./file-storage.interface";
import {
  resolveStoragePrefix,
  sanitizeFilename,
  toBuffer,
} from "./storage-utils";
import { generateUUID } from "lib/utils";

const STORAGE_PREFIX = resolveStoragePrefix();
const PUBLIC_DIR = path.join(process.cwd(), "public");

const buildPaths = (filename: string) => {
  const safeName = sanitizeFilename(filename);
  const id = generateUUID();
  const folder = STORAGE_PREFIX; // e.g. "uploads"

  // Absolute path on disk: /app/public/uploads/id-filename.ext
  const relativePath = path.join(folder, `${id}-${safeName}`);
  const absolutePath = path.join(PUBLIC_DIR, relativePath);

  // Public URL: /uploads/id-filename.ext
  const publicUrl = `/${relativePath}`;

  return { absolutePath, publicUrl, relativePath };
};

const mapMetadata = (key: string, info: { size: number; mtime: Date }) =>
  ({
    key,
    filename: path.basename(key),
    contentType: "application/octet-stream", // Local fs doesn't store mime types easily without external DB or convention
    size: info.size,
    uploadedAt: info.mtime,
  }) satisfies FileMetadata;

export const createLocalFileStorage = (): FileStorage => {
  return {
    async upload(content, options: UploadOptions = {}) {
      const buffer = await toBuffer(content);
      const filename = options.filename ?? "file";

      const { absolutePath, publicUrl, relativePath } = buildPaths(filename);

      // Ensure directory exists
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });

      await fs.writeFile(absolutePath, buffer);

      const metadata: FileMetadata = {
        key: relativePath, // Key is relative path from public root, e.g. "uploads/abc.png"
        filename: path.basename(absolutePath),
        contentType: options.contentType || "application/octet-stream",
        size: buffer.byteLength,
        uploadedAt: new Date(),
      };

      return {
        key: relativePath,
        sourceUrl: publicUrl,
        metadata,
      };
    },

    async createUploadUrl() {
      // Local storage doesn't support "presigned URLs" in the same way,
      // but we return null so the frontend falls back or handles it appropriately.
      // If needed, we could implement a custom API endpoint for this.
      return null;
    },

    async download(key) {
      // Key is expected to be relative path inside public/, e.g. "uploads/abc.png"
      const absolutePath = path.join(PUBLIC_DIR, key);
      try {
        return await fs.readFile(absolutePath);
      } catch (error: any) {
        if (error.code === "ENOENT") {
          throw new FileNotFoundError(key);
        }
        throw error;
      }
    },

    async delete(key) {
      const absolutePath = path.join(PUBLIC_DIR, key);
      try {
        await fs.unlink(absolutePath);
      } catch (error: any) {
        if (error.code !== "ENOENT") {
          throw error;
        }
      }
    },

    async exists(key) {
      const absolutePath = path.join(PUBLIC_DIR, key);
      try {
        await fs.access(absolutePath);
        return true;
      } catch {
        return false;
      }
    },

    async getMetadata(key) {
      const absolutePath = path.join(PUBLIC_DIR, key);
      try {
        const stats = await fs.stat(absolutePath);
        return mapMetadata(key, { size: stats.size, mtime: stats.mtime });
      } catch (error: any) {
        if (error.code === "ENOENT") {
          return null;
        }
        throw error;
      }
    },

    async getSourceUrl(key) {
      // Assuming key is capable of being served from public/
      return `/${key}`;
    },

    async getDownloadUrl(key) {
      return `/${key}`;
    },
  } satisfies FileStorage;
};
