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

      const metadata = object.metadata ?? {};
      const uploadId = metadata.uploadId ?? metadata.upload_id ?? '';
      const originContext =
        metadata.originContext === 'exhibition' ? 'exhibition' : 'gallery';
      const originRoleRaw = metadata.originRole ?? metadata.role ?? '';
      const originRole =
        originRoleRaw === 'feature' || originRoleRaw === 'attachment'
          ? originRoleRaw
          : originContext === 'exhibition'
            ? 'attachment'
            : 'gallery';
      const originExhibitionId = metadata.exhibitionId ?? null;

      const db = getDb();
      const mediaId = db.collection('media').doc().id;

      const now = admin.firestore.Timestamp.now();

      // Create initial document so frontend can show processing state.
      // original.downloadURL is intentionally null so frontend can display progress.
      const initialDoc: Media = {
        id: mediaId,
        mediaSetId: null,
        uploadId: uploadId || mediaId,
        origin: {
          context: originContext,
          exhibitionId: originExhibitionId,
          role: originRole,
        },
        title: '',
        description: '',
        type: 'image',
        storagePath,
        paths: {
          original: { storagePath, downloadURL: null },
          derivatives: {},
        },
        width: 0,
        height: 0,
        sizeBytes: object.size ? Number(object.size) : undefined,
        blurHash: null,
        mimeType: contentType,
        createdAt: now,
        modifiedAt: now,
        processed: false,
      };

      // Persist the initial doc immediately.
      await createAssetDoc(initialDoc);

      // Download original to tmp for processing
      const localPath = await downloadToTmp(storagePath);

      try {
        // Generate WebP variants
        const variants = await createWebpVariants(localPath);

        const bucket = admin.storage().bucket();
        const derivativePaths: {
          [k: string]: { storagePath: string; downloadURL: string };
        } = {};

        // Upload each variant and create signed URL
        for (const [key, info] of Object.entries(variants)) {
          const dest = `temp-assets/${mediaId}/${key}.webp`;
          await uploadFromLocal(info.path, dest, 'image/webp');

          const [url] = await bucket.file(dest).getSignedUrl({
            action: 'read',
            expires: '03-01-2500',
          });

          derivativePaths[key] = { storagePath: dest, downloadURL: url };
          await safeUnlink(info.path);
        }

        // Optionally delete the original uploaded file from storage
        // keep the storagePath in the doc so you have a record of the input
        await bucket
          .file(storagePath)
          .delete()
          .catch(() => {});

        const updatePayload: Partial<Media> = {
          paths: {
            original: initialDoc.paths.original,
            derivatives: derivativePaths,
          },
          width: variants['webp_large']?.width ?? initialDoc.width,
          height: variants['webp_large']?.height ?? initialDoc.height,
          modifiedAt: admin.firestore.Timestamp.now(),
          processed: true,
        };

        await db
          .collection('media')
          .doc(mediaId)
          .set(updatePayload, { merge: true });
      } finally {
        // Always try to unlink the downloaded original local file
        await safeUnlink(localPath).catch(() => {});
      }
    } catch (err) {
      console.error('onImageFinalize error:', err);
      // Let function fail so functions logs show the error; initial doc remains with processed:false
      throw err;
    }
  }
);
