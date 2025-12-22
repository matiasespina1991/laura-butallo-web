export type ExhibitionRow = {
  id: string;
  title: string;
  dateAndLocation?: string;
  body: string;
  videoCount: number;
};

export type ExhibitionDoc = {
  title: string;
  dateAndLocation?: string;
  body: string;
  mediaIds?: string[];
};
