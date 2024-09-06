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

  // Ordenar primero todos los artworks por fecha (created_at), en orden descendente
  artworksList.sort((a, b) => {
    return b.created_at.toDate().getTime() - a.created_at.toDate().getTime();
  });

  // Crear un nuevo array para reubicar los artworks que tienen un índice definido
  const finalOrderedArtworks: (Artwork | undefined)[] = [];

  // Añadir los artworks con `index` en las posiciones indicadas por su `index`
  artworksList.forEach((artwork) => {
    if (
      artwork.index !== undefined &&
      artwork.index !== null &&
      artwork.index >= 1
    ) {
      // Si el `index` existe y está definido, colocarlo en su posición en el array
      finalOrderedArtworks[artwork.index - 1] = artwork;
    }
  });

  // Colocar los artworks sin `index` en los primeros espacios vacíos
  artworksList.forEach((artwork) => {
    if (artwork.index === undefined || artwork.index === null) {
      const nextEmptyIndex = finalOrderedArtworks.findIndex(
        (item) => item === undefined
      );
      if (nextEmptyIndex !== -1) {
        finalOrderedArtworks[nextEmptyIndex] = artwork;
      } else {
        finalOrderedArtworks.push(artwork); // Si no hay espacios vacíos, agregar al final
      }
    }
  });

  // Filtrar cualquier valor `undefined` del array
  return finalOrderedArtworks.filter(
    (artwork) => artwork !== undefined
  ) as Artwork[];
}
