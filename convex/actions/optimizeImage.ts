"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import sharp from "sharp";
import { api } from "../_generated/api";

export const optimizeToWebp = action({
  args: {
    projectId: v.id("projects"),
    storageId: v.id("_storage"),
    originalFilename: v.string(),
  },
  handler: async (ctx, args) => {
    const originalUrl = await ctx.storage.getUrl(args.storageId);
    if (!originalUrl) {
      throw new Error("Source file not found in storage.");
    }

    const response = await fetch(originalUrl);
    const arrayBuffer = await response.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Convert & optimize to WebP with Sharp
    const optimizedBuffer = await sharp(inputBuffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();

    // Store optimized WebP back into Convex
    const optimizedBlob = new Blob([optimizedBuffer], { type: "image/webp" });
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
      mimeType: "image/webp",
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
