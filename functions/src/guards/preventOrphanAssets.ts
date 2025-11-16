// guards/preventOrphanAssets.ts
import admin from 'firebase-admin';

export async function isMediaReferenced(mediaId: string): Promise<boolean> {
  const db = admin.firestore();
  const mediaSnap = await db.collection('Media').doc(mediaId).get();
  if (!mediaSnap.exists) return false;
  const media = mediaSnap.data() as any;
  if (!media.mediaSetId) return false;
  const msSnap = await db.collection('MediaSets').doc(media.mediaSetId).get();
  return msSnap.exists && !msSnap.data()?.deletedAt;
}
