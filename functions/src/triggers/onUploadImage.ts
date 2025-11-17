// triggers/onUploadImage.ts
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import admin from 'firebase-admin';
import {
  downloadToTmp,
  uploadFromLocal,
  safeUnlink,
} from '../utils/storage.js';
import {
  createWebpVariants,
  // , generateBlurHash
} from '../utils/images.js';
import { createAssetDoc } from '../utils/firestore.js';
import { Media } from '../types/media.js';

function getDb() {
  return admin.firestore();
}

export const onImageFinalize = onObjectFinalized(
  {
    region: 'europe-west3',
    timeoutSeconds: 1200,
    memory: '2GiB',
    cpu: 1,
    maxInstances: 10,
  },
  async (event) => {
    const object = event.data;
    if (!object) return;

    try {
      const contentType = object.contentType ?? '';
      if (!contentType.startsWith('image/')) return;

      const storagePath = object.name!;
      if (!storagePath.startsWith('uploads/images/')) return;

      const localPath = await downloadToTmp(storagePath);

      // Generate WebP variants
      const variants = await createWebpVariants(localPath);
      const db = getDb();
      const mediaId = db.collection('media').doc().id;

      const bucket = admin.storage().bucket();
      const derivativePaths: {
        [k: string]: { storagePath: string; downloadURL: string };
      } = {};

      for (const [key, info] of Object.entries(variants)) {
        const dest = `temp-assets/${mediaId}/${key}.webp`;
        await uploadFromLocal(info.path, dest, 'image/webp');

        // Generar signed URL para cada derivada
        const [url] = await bucket.file(dest).getSignedUrl({
          action: 'read',
          expires: '03-01-2500',
        });

        derivativePaths[key] = { storagePath: dest, downloadURL: url };
        await safeUnlink(info.path);
      }

      // Borrar el original subido
      await bucket
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
          original: { storagePath, downloadURL: null }, // original eliminado
          derivatives: derivativePaths,
        },
        width: variants['webp_large']?.width ?? 0,
        height: variants['webp_large']?.height ?? 0,
        sizeBytes: object.size ?? undefined,
        blurHash: null,
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
