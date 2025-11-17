export type MediaType = 'image' | 'video';
export interface AssetPaths {
    original: string;
    derivatives: {
        [key: string]: string;
    };
    poster?: string;
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
