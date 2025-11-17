// triggers/onUploadImage.ts
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import admin from 'firebase-admin';
// import path from 'path';
import {
  downloadToTmp,
  uploadFromLocal,
  safeUnlink,
  // ensureTokenDownloadURL,
} from '../utils/storage.js';

import { createWebpVariants, generateBlurHash } from '../utils/images.js';
import { createAssetDoc } from '../utils/firestore.js';
import { Media } from '../types/media.js';

function getDb() {
  return admin.firestore();
}

/**
 * Trigger for finalized objects.
 * Processes images: generate WebP variants and blurhash, upload derivatives, create Media doc.
 * We expect uploads to use path: "uploads/originals/<filename>" or similar.
 */
export const onImageFinalize = onObjectFinalized(
  {
    region: 'europe-west3',
  },
  async (event) => {
    const object = event.data;
    if (!object) return;

    try {
      // Guard: only process images
      const contentType = object.contentType ?? '';
      if (!contentType.startsWith('image/')) return;

      const storagePath = object.name!;
      if (!storagePath.startsWith('uploads/images/')) return;
      // download
      const localPath = await downloadToTmp(storagePath);

      // generate webp variants

      const variants = await createWebpVariants(localPath);
      const db = getDb();
      const mediaId = db.collection('media').doc().id;

      const derivativePaths: { [k: string]: string } = {};

      for (const [key, info] of Object.entries(variants)) {
        const dest = `assets/${mediaId}/${key}.webp`;
        await uploadFromLocal(info.path, dest, 'image/webp');
        derivativePaths[key] = dest;
        await safeUnlink(info.path);
      }
      // blurhash
      const blur = await generateBlurHash(localPath);

      // optionally delete original file after processing
      // As requested, delete originals after generating derivatives
      await admin
        .storage()
        .bucket()
        .file(storagePath)
        .delete()
        .catch(() => {});

      const now = admin.firestore.Timestamp.now();
      const doc: Media = {
        id: mediaId,
        mediaSetId: null,
        type: 'image',
        storagePath,
        paths: {
          original: storagePath,
          derivatives: derivativePaths,
        },
        downloadURL: null,
        width: variants['webp_large']?.width ?? 0,
        height: variants['webp_large']?.height ?? 0,
        sizeBytes: object.size ?? undefined,
        blurHash: blur,
        mimeType: contentType,
        createdAt: now,
        modifiedAt: now,
        processed: true,
      };

      await createAssetDoc(doc);
      await safeUnlink(localPath);
    } catch (err) {
      console.error('onImageFinalize error:', err);
      throw err;
    }
  }
);
