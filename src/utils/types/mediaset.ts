// types/mediaset.ts
import type { Timestamp } from 'firebase/firestore';

export interface MediaSet {
  id: string;
  title: string;
  description?: string;
  ownerUID?: string | null;
  ordering: number;
  createdAt: Timestamp;
  modifiedAt: Timestamp;
  publishedAt?: Timestamp | null;
  deletedAt?: Timestamp | null;
}
