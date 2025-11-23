export type MediaType = 'image' | 'video';
export interface AssetFile {
    storagePath: string;
    downloadURL: string | null;
}
export interface AssetPaths {
    original: AssetFile;
    derivatives: {
        [key: string]: AssetFile;
    };
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
    duration?: number;
    mimeType?: string;
    sizeBytes?: number;
    blurHash?: string | null;
    codec?: string | null;
    bitrate?: number | null;
    createdAt: FirebaseFirestore.Timestamp;
    modifiedAt: FirebaseFirestore.Timestamp;
    deletedAt?: FirebaseFirestore.Timestamp | null;
    processed: boolean;
}
