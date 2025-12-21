// src/utils/types.ts

import { Timestamp } from 'firebase/firestore';

export interface PhotoSetData {
  created_at: Timestamp;
  id: string;
  index: number;
  images?: Array<string>;
  title: string;
}

export interface AboutMeContactData {
  about_me: AboutMeData;
  contact: ContactData;
}
export interface AboutMeData {
  title: string;
  content: string;
  subcontent: AboutMeSubcontent;
}

export interface AboutMeSubcontent {
  education: EducationContent;
}
export interface EducationContent {
  content: string;
  title: string;
}

export interface ContactData {
  contact_email: string;
  whatsapp_number: string;
  instagram_url: string;
  linktree_url: string;
  behance_url: string;
}
