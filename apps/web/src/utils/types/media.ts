// types/media.ts

import type { Timestamp } from 'firebase/firestore';
export type MediaType = 'image' | 'video';

export interface AssetFile {
  storagePath: string;
  downloadURL: string | null;
}

export interface AssetPaths {
  original: AssetFile;
  derivatives: { [key: string]: AssetFile };
  poster?: AssetFile;
}

export interface Media {
  id: string;
  mediaSetId: string | null;
  uploadId: string;
  origin: {
    context: 'gallery' | 'exhibition';
    exhibitionId?: string | null; // is this useful???
    role?: 'gallery' | 'feature' | 'attachment'; // is this useful???
  };
  type: MediaType;
  title: string;
  description?: string;
  storagePath: string;
  paths: AssetPaths;
  width?: number;
  height?: number;
  duration?: number; // in seconds, only for video
  mimeType?: string;
  sizeBytes?: number;
  blurHash?: string | null; // only images
  codec?: string | null; // for video (e.g. "vp9")
  bitrate?: number | null; // kbps
  createdAt: Timestamp;
  modifiedAt: Timestamp;
  deletedAt?: Timestamp | null;
  processed: boolean;
  order?: number; // position within mediaset
  flex?: number; // grid flex size (1-4)
}
