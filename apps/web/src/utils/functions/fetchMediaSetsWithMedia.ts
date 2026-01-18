import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import db from '@/utils/config/firebase';
import { MediaSet } from '@/utils/types/mediaset';
import { Media } from '@/utils/types/media';

export async function fetchMediaSetsWithMedia(): Promise<
  { mediaset: MediaSet; media: Media[] }[]
> {
  // Traemos todos los mediasets activos
  const mediasetsSnap = await getDocs(
    query(
      collection(db, 'mediasets'),
      where('deletedAt', '==', null),
      orderBy('ordering', 'asc')
    )
  );
  const result: { mediaset: MediaSet; media: Media[] }[] = [];

  const mediasets = mediasetsSnap.docs.map((doc) => doc.data() as MediaSet);

  // Traer todos los media procesados y no eliminados
  const mediaSnap = await getDocs(
    query(
      collection(db, 'media'),
      where('deletedAt', '==', null),
      where('processed', '==', true)
    )
  );
  const allMedia = mediaSnap.docs.map((doc) => doc.data() as Media);

  for (const ms of mediasets) {
    const mediaOfSet = allMedia
      .filter((m) => m.mediaSetId === ms.id)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    result.push({ mediaset: ms, media: mediaOfSet });
  }

  return result;
}
