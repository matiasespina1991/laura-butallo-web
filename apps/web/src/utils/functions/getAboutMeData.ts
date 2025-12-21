import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import {
  AboutMeContactData,
  AboutMeData,
  PhotoSetData,
  ContactData,
} from '../types/types';
import db from '../config/firebase';

export async function getAboutMeData(): Promise<AboutMeData | null> {
  const AboutMeContactCollection = collection(db, 'about_me_contact');
  const AboutMeContactQuery = query(
    AboutMeContactCollection,
    where('active', '==', true)
  );
  const aboutMeContactSnapshot = await getDocs(AboutMeContactQuery);

  if (aboutMeContactSnapshot.empty) {
    console.error('No documents found with contact data.');
    return null;
  }

  const firstAboutMeContactDoc: AboutMeContactData | null =
    aboutMeContactSnapshot.docs[0].data() as AboutMeContactData | null;

  if (!firstAboutMeContactDoc) {
    console.error('No contact data found');
    return null;
  }

  const aboutMeData: AboutMeData = firstAboutMeContactDoc.about_me;

  return aboutMeData;
}
