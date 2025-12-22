export type Exhibition = {
  id: number;
  title: string;
  meta: string;
  summary: string;
  videoCount: number;
};

export const exhibitions: Exhibition[] = [
  {
    id: 1,
    title: '"Drifting Landscapes" – Exposición de Arte',
    meta: 'Abril de 2025 · Wintercircus Arena, Bélgica',
    summary:
      'La curadora @dianedrubay explora cómo han cambiado los paisajes en un contexto de fragilidad ecológica y crecimiento tecnológico...',
    videoCount: 1
  },
  {
    id: 2,
    title: 'Art on Tezos – Installation',
    meta: 'Noviembre de 2025 · Estudio Aquel, Argentina',
    summary:
      'Artists reunidos en Buenos Aires para compartir espacio y expandir lo posible en el arte digital...',
    videoCount: 1
  }
];
