import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc
} from 'firebase/firestore';
import db from '@/utils/config/firebase';
import type { MediaSet } from '@/types/mediaset';
import type { Media } from '@/utils/types/media';

export async function fetchCategoryMedia(
  category: string
): Promise<{ mediaset: MediaSet; media: Media[] }[]> {
  // Fetch all mediasets for this category
  const mediasetsSnap = await getDocs(
    query(
      collection(db, 'mediasets'),
      where('category', '==', category),
      orderBy('ordering', 'asc')
    )
  );

  const mediasets = mediasetsSnap.docs
    .map((d) => ({ ...d.data(), id: d.id }) as MediaSet)
    .filter((ms) => !ms.deletedAt);

  const result: { mediaset: MediaSet; media: Media[] }[] = [];

  for (const mediaset of mediasets) {
    // Fetch items for this mediaset
    const itemsSnap = await getDocs(
      query(
        collection(db, 'mediasets', mediaset.id, 'items'),
        orderBy('order', 'asc')
      )
    );

    const media: Media[] = [];

    // Fetch media for each item
    for (const itemDoc of itemsSnap.docs) {
      const itemData = itemDoc.data();
      if (itemData.mediaId) {
        const mediaDocRef = doc(db, 'media', itemData.mediaId);
        const mediaDocSnap = await getDoc(mediaDocRef);

        if (mediaDocSnap.exists()) {
          const mediaData = mediaDocSnap.data() as Media;
          if (mediaData.processed && !mediaData.deletedAt) {
            media.push({
              ...mediaData,
              id: mediaDocSnap.id,
              flex: itemData.flex ?? 1
            });
          }
        }
      }
    }

    if (media.length > 0) {
      result.push({ mediaset, media });
    }
  }

  return result;
}
