// types/media.ts
export type MediaType = 'image' | 'video';

export interface AssetPaths {
  original: string; // storage path to original file
  derivatives: {
    [key: string]: string; // e.g. "webp_small": "assets/xxxx/webp_small.webp"
  };
  poster?: string; // thumbnail for video
}

export interface Media {
  id: string;
  mediaSetId: string | null;
  type: MediaType;
  storagePath: string;
  paths: AssetPaths;
  downloadURL: string | null;
  width?: number;
  height?: number;
  duration?: number; // in seconds, only for video
  mimeType?: string;
  sizeBytes?: number;
  blurHash?: string | null; // only images
  codec?: string | null; // for video (e.g. "vp9")
  bitrate?: number | null; // kbps
  createdAt: FirebaseFirestore.Timestamp;
  modifiedAt: FirebaseFirestore.Timestamp;
  deletedAt?: FirebaseFirestore.Timestamp | null;
  processed: boolean; // true when derivatives available and asset doc created
}
