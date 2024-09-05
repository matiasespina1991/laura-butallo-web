import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { Artwork } from '../types/types';
import db from '../config/firebase';

export async function fetchArtworks(): Promise<Artwork[]> {
  const artworksCollection = collection(db, 'artworks');

  const artworksQuery = query(
    artworksCollection,
    orderBy('created_at', 'desc')
  );

  const artworksSnapshot = await getDocs(artworksQuery);

  let artworksList = artworksSnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as Artwork
  );

  // Crear un nuevo array para ordenar los artworks
  let orderedArtworksList: Artwork[] = [];

  for (let artwork of artworksList) {
    if (artwork.index !== undefined && artwork.index !== null) {
      console.log('index', artwork.index);
      console.log('artwork', artwork);
      orderedArtworksList[artwork.index] = artwork;
    } else {
      // Si no tiene 'index', agregarlo al final
      orderedArtworksList.push(artwork);
    }
  }


  // Agregar los artworks que no tienen un índice definido en los espacios vacíos
  const filledArtworksList = orderedArtworksList.flatMap((artwork, index) => {
    if (artwork) {
      return artwork;
    } else {
      // Sacar el primer artwork que no tiene index de artworksList
      return (
        artworksList.find(
          (item) => !item.index && orderedArtworksList.indexOf(item) === -1
        ) || []
      );
    }
  });

  return filledArtworksList;
}
