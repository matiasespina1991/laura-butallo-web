// src/utils/types.ts

import { Timestamp } from 'firebase/firestore';

export interface Artwork {
  created_at: Timestamp;
  id: string;
  index: number;
  images?: Array<string>;
  image_url: string;
  right_image_url_optional: string;
  artist: {
    firstName: string;
    lastName: string;
    middleName: string;
  };
  fingerprints: Array<{
    id: string;
    format: string;
    height: number;
    width: number;
    posX: number;
    posY: number;
    side: string;
  }>;
  medium: string;
  notes: string;
  objectId: string;
  state: string;
  dimensions: string;
  date: string;
  title: string;
}

export interface AboutMeContactData {
  about_me: AboutMeData;
  contact: ContactData;
}
export interface AboutMeData {
  title: string;
  content: string;
}

export interface ContactData {
  contact_email: string;
  whatsapp_number: string;
  instagram_url: string;
}
