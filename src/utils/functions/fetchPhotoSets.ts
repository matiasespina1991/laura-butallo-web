import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { PhotoSetData } from '../types/types';
import db from '../config/firebase';

export async function fetchPhotoSets(): Promise<PhotoSetData[]> {
  const photoSetsCollection = collection(db, 'artworks');
  const photoSetsQuery = query(
    photoSetsCollection,
    orderBy('created_at', 'desc')
  );
  const photoSetsSnapshot = await getDocs(photoSetsQuery);

  let photoSetsList = photoSetsSnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as PhotoSetData
  );

  photoSetsList.sort((a, b) => {
    return b.created_at.toDate().getTime() - a.created_at.toDate().getTime();
  });

  const finalOrderedPhotoSets: (PhotoSetData | undefined)[] = [];

  photoSetsList.forEach((photoSet) => {
    if (
      photoSet.index !== undefined &&
      photoSet.index !== null &&
      photoSet.index >= 1
    ) {
      finalOrderedPhotoSets[photoSet.index - 1] = photoSet;
    }
  });

  photoSetsList.forEach((photoSet) => {
    if (photoSet.index === undefined || photoSet.index === null) {
      const nextEmptyIndex = finalOrderedPhotoSets.findIndex(
        (item) => item === undefined
      );
      if (nextEmptyIndex !== -1) {
        finalOrderedPhotoSets[nextEmptyIndex] = photoSet;
      } else {
        finalOrderedPhotoSets.push(photoSet);
      }
    }
  });

  return finalOrderedPhotoSets.filter(
    (photoSet) => photoSet !== undefined
  ) as PhotoSetData[];
}
