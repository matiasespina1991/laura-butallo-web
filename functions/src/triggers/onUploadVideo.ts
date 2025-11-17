import { onObjectFinalized } from 'firebase-functions/v2/storage';
import admin from 'firebase-admin';
import {
  downloadToTmp,
  uploadFromLocal,
  safeUnlink,
} from '../utils/storage.js';
import {
  transcodeToWebM,
  generatePoster,
  probeMetadata,
} from '../utils/ffmpeg.js';
import { createAssetDoc } from '../utils/firestore.js';
import { Media } from '../types/media.js';

function getDb() {
  return admin.firestore();
}

export const onVideoFinalize = onObjectFinalized(
  {
    region: 'europe-west3',
    memory: '8GiB',
    timeoutSeconds: 2200,
    cpu: 2,
    maxInstances: 10,
  },
  async (event) => {
    try {
      const object = event.data;
      if (!object) return;
      const contentType = object.contentType ?? '';
      if (!contentType.startsWith('video/')) return;

      const storagePath = object.name!;
      if (!storagePath.startsWith('uploads/videos/')) return;
      const localPath = await downloadToTmp(storagePath);

      const db = getDb();
      const mediaId = db.collection('media').doc().id;
      const tmpBase = '/tmp';
      const bucket = admin.storage().bucket();

      const resolutions = [
        { name: '360', height: 360 },
        { name: '720', height: 720 },
        { name: '1080', height: 1080 },
      ];

      // probe
      const meta = await probeMetadata(localPath);
      const format = meta.format || {};
      const duration = format.duration
        ? Math.round(format.duration)
        : undefined;

      // Poster
      const posterLocal = `${tmpBase}/${Date.now()}-poster.webp`;
      await generatePoster(localPath, posterLocal);
      const posterStoragePath = `temp-assets/${mediaId}/poster.webp`;
      await uploadFromLocal(posterLocal, posterStoragePath, 'image/webp');
      const [posterDownloadURL] = await bucket
        .file(posterStoragePath)
        .getSignedUrl({
          action: 'read',
          expires: '03-01-2500',
        });
      await safeUnlink(posterLocal);

      // Derivatives
      const derivativePaths: {
        [key: string]: { storagePath: string; downloadURL: string | null };
      } = {};
      for (const r of resolutions) {
        const outLocal = `${tmpBase}/${Date.now()}-${r.name}.webm`;
        await transcodeToWebM(localPath, outLocal, r.height);
        const remotePath = `temp-assets/${mediaId}/video_${r.name}.webm`;
        await uploadFromLocal(outLocal, remotePath, 'video/webm');
        const [downloadURL] = await bucket.file(remotePath).getSignedUrl({
          action: 'read',
          expires: '03-01-2500',
        });
        derivativePaths[`webm_${r.name}`] = {
          storagePath: remotePath,
          downloadURL,
        };
        await safeUnlink(outLocal);
      }

      // Original
      const [originalDownloadURL] = await bucket
        .file(storagePath)
        .getSignedUrl({
          action: 'read',
          expires: '03-01-2500',
        });

      // Delete original uploaded file
      await bucket
        .file(storagePath)
        .delete()
        .catch(() => {});

      const now = admin.firestore.Timestamp.now();

      const doc: Media = {
        id: mediaId,
        mediaSetId: null,
        type: 'video',
        storagePath,
        paths: {
          original: { storagePath, downloadURL: originalDownloadURL },
          derivatives: derivativePaths,
          poster: {
            storagePath: posterStoragePath,
            downloadURL: posterDownloadURL,
          },
        },
        width: meta.streams?.[0]?.width,
        height: meta.streams?.[0]?.height,
        duration,
        mimeType: contentType,
        sizeBytes: object.size ?? undefined,
        codec: 'vp9',
        bitrate: format.bit_rate,
        createdAt: now,
        modifiedAt: now,
        processed: true,
      };

      await createAssetDoc(doc);
      await safeUnlink(localPath);
    } catch (err) {
      console.error('onVideoFinalize error:', err);
      throw err;
    }
  }
);
