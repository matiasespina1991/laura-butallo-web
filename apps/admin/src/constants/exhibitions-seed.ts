export type ExhibitionSeed = {
  title: string;
  meta?: string;
  body: string;
  mediaIds?: string[];
};

export const exhibitionsSeed: ExhibitionSeed[] = [
  {
    title: '"Drifting Landscapes" – Exposición de Arte',
    meta: 'Abril de 2025 · Wintercircus Arena, Bélgica',
    body:
      '<p>En DRIFTING LANDSCAPES, la curadora @dianedrubay explora cómo han cambiado (nuestras ideas sobre) los paisajes en un contexto de fragilidad ecológica y acelerado crecimiento tecnológico. La exposición reúne a artistas que conciben el paisaje no como un telón de fondo apacible, sino como un espacio de disrupción: un territorio activo y en disputa, donde la tecnología y el impacto humano colisionan.</p><p>Todas las obras de esta exposición forman parte de la colección personal de NFT de Diane, y todos los artistas participantes son personas a quienes he seguido de cerca (y coleccionado) durante los últimos años.</p>',
    mediaIds: ['E8LksG9GKq7qoQsbtHYt']
  },
  {
    title: 'Art on Tezos – Installation',
    meta: 'November 2025 · Estudio Aquel, Argentina',
    body:
      '<p>The Art on Tezos satellite event in Buenos Aires reminded us what drives this ecosystem: artists coming together, sharing space, and expanding the possibilities of digital art.</p><p>The atmosphere was determined, collaborative, and warm. A brief look back. Organized by @NewtroArts.</p><p>Together with OHDE, we had the opportunity to work on the construction of the impressive CRT tree installation. Our mission was to create the roots of the tree and the mutant decoration that adorned the large structure. It was a joint effort between the team of artists who worked on the televisions and Marian and Flopa, who were in charge of the aerial network of branches.</p>',
    mediaIds: ['CsNx0GADEpqxahMxRs2T']
  }
];
