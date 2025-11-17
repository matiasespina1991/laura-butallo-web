// src/index.ts
import { setGlobalOptions } from 'firebase-functions';
import admin from 'firebase-admin';

admin.initializeApp();
setGlobalOptions({ maxInstances: 10 });

// Triggers
export { onImageFinalize } from './triggers/onUploadImage.js';
export { onVideoFinalize } from './triggers/onUploadVideo.js';

// Callable functions
export { generateDownloadUrl } from './callable/generateDownloadUrl.js';
export { regenerateDownloadUrl } from './callable/regenerateDownloadUrl.js';
export { validateDelete } from './callable/validateDelete.js';

// Migration functions
export { migrateArtworksToAssets } from './migration/migrateArtworksToAssets.js';
