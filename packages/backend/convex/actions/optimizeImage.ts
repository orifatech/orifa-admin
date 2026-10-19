"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

export const optimizeToWebp = action({
  args: {
    projectId: v.id("projects"),
    storageId: v.id("_storage"),
    originalFilename: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    assetId: any;
    storageId: any;
    optimizedName: string;
    repoDestinationPath: string;
    sizeBytes: number;
  }> => {
    const originalUrl = await ctx.storage.getUrl(args.storageId);
    if (!originalUrl) {
      throw new Error("Source file not found in storage.");
    }

    const response = await fetch(originalUrl);
    const arrayBuffer = await response.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    let optimizedBuffer: Buffer = inputBuffer;
    let mimeType = "image/webp";

    // Attempt native Sharp optimization if available in current runtime
    try {
      const sharpModule = await import("sharp");
      const sharp = sharpModule.default || sharpModule;
      optimizedBuffer = await sharp(inputBuffer)
        .resize({ width: 1920, withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();
    } catch (err) {
      console.warn(
        "[optimizeToWebp] Native sharp processing bypassed; storing asset directly.",
        err
      );
      // Fallback: keep original buffer, set appropriate extension
      mimeType = response.headers.get("content-type") || "image/webp";
    }

    // Store optimized buffer back into Convex
    const optimizedBlob = new Blob([new Uint8Array(optimizedBuffer)], { type: mimeType });
    const newStorageId = await ctx.storage.store(optimizedBlob);

    // Sanitize filename
    const baseName = args.originalFilename
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-");
    const optimizedName = `${baseName}-${Date.now().toString(36)}.webp`;
    const repoDestinationPath = `public/images/uploads/${optimizedName}`;

    // Register asset record in database
    const assetId = await ctx.runMutation(api.media.registerAsset, {
      projectId: args.projectId,
      storageId: newStorageId,
      originalName: args.originalFilename,
      optimizedName,
      mimeType,
      sizeBytes: optimizedBuffer.byteLength,
      repoDestinationPath,
    });

    return {
      assetId,
      storageId: newStorageId,
      optimizedName,
      repoDestinationPath,
      sizeBytes: optimizedBuffer.byteLength,
    };
  },
});
