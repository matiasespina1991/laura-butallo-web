import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
} from 'firebase/firestore';
import db from '@/utils/config/firebase';
import type { MediaSet } from '@/utils/types/mediaset';
import type { Media } from '@/utils/types/media';

type MediaSetItemDoc = {
  mediaId?: string;
  mediaItems?: Array<{ mediaId?: string; order?: number }>;
  flex?: number;
  order?: number;
};

const getOrderedItemMediaIds = (item: MediaSetItemDoc): string[] => {
  const fromArray =
    item.mediaItems
      ?.slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((entry) => entry.mediaId)
      .filter((id): id is string => Boolean(id)) ?? [];

  if (fromArray.length > 0) return fromArray;
  return item.mediaId ? [item.mediaId] : [];
};

export async function fetchCategoryMedia(
  category: string
): Promise<{ mediaset: MediaSet; media: Media[] }[]> {
  // 1. Single query for all mediasets
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

  // 2. All items subcollections IN PARALLEL
  const itemsSnaps = await Promise.all(
    mediasets.map((ms) =>
      getDocs(
        query(
          collection(db, 'mediasets', ms.id, 'items'),
          orderBy('order', 'asc')
        )
      )
    )
  );

  // 3. Collect all unique mediaIds across all items (including carousel mediaItems)
  const allMediaIds = new Set<string>();
  itemsSnaps.forEach((snap) => {
    snap.docs.forEach((d) => {
      const itemData = d.data() as MediaSetItemDoc;
      getOrderedItemMediaIds(itemData).forEach((id) => allMediaIds.add(id));
    });
  });

  // 4. Fetch all media docs IN PARALLEL (single batch)
  const mediaDocs = await Promise.all(
    Array.from(allMediaIds).map((id) => getDoc(doc(db, 'media', id)))
  );

  // 5. id → Media map for O(1) lookup
  const mediaMap = new Map<string, Media>();
  mediaDocs.forEach((d) => {
    if (d.exists()) {
      const data = d.data() as Media;
      if (data.processed && !data.deletedAt) {
        mediaMap.set(d.id, { ...data, id: d.id });
      }
    }
  });

  // 6. Build result preserving order and carousel logic
  const result: { mediaset: MediaSet; media: Media[] }[] = [];

  mediasets.forEach((mediaset, i) => {
    const media: Media[] = [];

    itemsSnaps[i].docs.forEach((itemDoc) => {
      const itemData = itemDoc.data() as MediaSetItemDoc;
      const orderedMediaIds = getOrderedItemMediaIds(itemData);
      if (orderedMediaIds.length === 0) return;

      const orderedMedia = orderedMediaIds
        .map((id) => mediaMap.get(id))
        .filter((m): m is Media => Boolean(m));

      if (!orderedMedia.length) return;

      const primaryMedia = orderedMedia[0];
      media.push({
        ...primaryMedia,
        itemId: itemDoc.id,
        flex: itemData.flex ?? 1,
        isCarouselItem: orderedMedia.length > 1,
        carouselMedia: orderedMedia.length > 1 ? orderedMedia : undefined,
      });
    });

    if (media.length > 0) {
      result.push({ mediaset, media });
    }
  });

  return result;
}
