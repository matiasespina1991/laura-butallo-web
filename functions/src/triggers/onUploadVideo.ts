// triggers/onUploadVideo.ts
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import admin from 'firebase-admin';
// import path from 'path';
// import fs from 'fs/promises';
import {
  downloadToTmp,
  uploadFromLocal,
  safeUnlink,
} from '../utils/storage.js';
import {
  transcodeToWebM,
  generateThumbnail,
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

      const resolutions = [
        { name: '360', height: 360 },
        { name: '720', height: 720 },
        { name: '1080', height: 1080 },
      ];

      const derivativePaths: { [k: string]: string } = {};

      // probe
      const meta = await probeMetadata(localPath);
      const format = meta.format || {};
      const duration = format.duration
        ? Math.round(format.duration)
        : undefined;
      const sizeBytes = object.size ?? undefined;

      // generate poster
      const posterLocal = `${tmpBase}/${Date.now()}-poster.jpg`;
      await generateThumbnail(localPath, posterLocal);

      const posterStoragePath = `temp-assets/${mediaId}/poster.jpg`;
      await uploadFromLocal(posterLocal, posterStoragePath, 'image/jpeg');
      await safeUnlink(posterLocal);

      // transcode each resolution to WebM VP9+Opus
      for (const r of resolutions) {
        const outLocal = `${tmpBase}/${Date.now()}-${r.name}.webm`;
        await transcodeToWebM(localPath, outLocal, r.height);
        const remotePath = `temp-assets/${mediaId}/video_${r.name}.webm`;
        await uploadFromLocal(outLocal, remotePath, 'video/webm');
        derivativePaths[`webm_${r.name}`] = remotePath;
        await safeUnlink(outLocal);
      }

      // delete original as requested
      await admin
        .storage()
        .bucket()
        .file(storagePath)
        .delete()
        .catch(() => {});

      const now = admin.firestore.Timestamp.now();

      const doc: any = {
        id: mediaId,
        mediaSetId: null,
        type: 'video',
        storagePath,
        paths: {
          original: storagePath,
          derivatives: derivativePaths,
          poster: posterStoragePath,
        },
        downloadURL: null,
        width: meta.streams?.[0]?.width,
        height: meta.streams?.[0]?.height,
        duration,
        mimeType: contentType,
        sizeBytes,
        codec: 'vp9',
        bitrate: format.bit_rate,
        createdAt: now,
        modifiedAt: now,
        processed: true,
      };

      Object.keys(doc).forEach(
        (key) => doc[key] === undefined && delete doc[key]
      );

      await createAssetDoc(doc);
      await safeUnlink(localPath);
    } catch (err) {
      console.error('onVideoFinalize error:', err);
      throw err;
    }
  }
);
