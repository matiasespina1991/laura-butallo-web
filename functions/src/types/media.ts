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
  title: string;
  description?: string;
  type: MediaType;
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
  createdAt: FirebaseFirestore.Timestamp;
  modifiedAt: FirebaseFirestore.Timestamp;
  deletedAt?: FirebaseFirestore.Timestamp | null;
  processed: boolean;
}
