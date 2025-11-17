/**
 * Trigger for finalized objects.
 * Processes images: generate WebP variants and blurhash, upload derivatives, create Media doc.
 * We expect uploads to use path: "uploads/originals/<filename>" or similar.
 */
export declare const onImageFinalize: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/storage").StorageEvent>;
