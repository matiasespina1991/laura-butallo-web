// triggers/onUploadVideo.ts
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
    timeoutSeconds: 2800,
    cpu: 4,
    maxInstances: 10,
  },
  async (event) => {
    const object = event.data;
    if (!object) return;

    try {
      const contentType = object.contentType ?? '';
      if (!contentType.startsWith('video/')) return;

      const storagePath = object.name!;
      if (!storagePath.startsWith('uploads/videos/')) return;

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
      const resolvedUploadId = typeof uploadId === 'string' ? uploadId : '';
      const mediaId = resolvedUploadId || db.collection('media').doc().id;
      const now = admin.firestore.Timestamp.now();

      // Create initial doc with processed: false
      const initialDoc: Media = {
        id: mediaId,
        mediaSetId: null,
        uploadId: resolvedUploadId || mediaId,
        origin: {
          context: originContext,
          exhibitionId: originExhibitionId,
          role: originRole,
        },
        type: 'video',
        storagePath,
        title: '',
        description: '',
        paths: {
          original: { storagePath, downloadURL: null },
          derivatives: {},
        },
        width: 0,
        height: 0,
        duration: 0,
        mimeType: contentType,
        sizeBytes: object.size ? Number(object.size) : undefined,
        codec: null,
        bitrate: null,
        createdAt: now,
        modifiedAt: now,
        processed: false,
      };

      await createAssetDoc(initialDoc);

      const localPath = await downloadToTmp(storagePath);
      const tmpBase = '/tmp';
      const bucket = admin.storage().bucket();

      const resolutions = [
        { name: '360', height: 360 },
        { name: '720', height: 720 },
        { name: '1080', height: 1080 },
      ];

      // Probe metadata
      const meta = await probeMetadata(localPath);
      const format = meta.format || {};
      const duration = format.duration
        ? Math.round(format.duration)
        : undefined;

      // Generate poster
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

      // Transcode resolutions
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

      // Delete original uploaded file (keeping storagePath for record)
      await bucket
        .file(storagePath)
        .delete()
        .catch(() => {});

      // Update document with derivatives, poster, and processed: true
      await db
        .collection('media')
        .doc(mediaId)
        .update({
          'paths.derivatives': derivativePaths,
          'paths.poster': {
            storagePath: posterStoragePath,
            downloadURL: posterDownloadURL,
          },
          width: meta.streams?.[0]?.width ?? 0,
          height: meta.streams?.[0]?.height ?? 0,
          duration,
          codec: 'vp9',
          bitrate: format.bit_rate ?? null,
          modifiedAt: admin.firestore.Timestamp.now(),
          processed: true,
        } as any);

      await safeUnlink(localPath);
    } catch (err) {
      console.error('onVideoFinalize error:', err);
      throw err;
    }
  }
);
