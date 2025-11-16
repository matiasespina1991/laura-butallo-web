// types/mediaset.ts
export interface MediaSet {
  id: string;
  title: string;
  description?: string;
  ownerUID?: string | null;
  ordering: number;
  createdAt: FirebaseFirestore.Timestamp;
  modifiedAt: FirebaseFirestore.Timestamp;
  publishedAt?: FirebaseFirestore.Timestamp | null;
  deletedAt?: FirebaseFirestore.Timestamp | null;
}
