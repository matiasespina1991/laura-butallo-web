import { collection, getDocs, query, where } from 'firebase/firestore';
import { AboutMeContactData, ContactData } from '../types/types';
import db from '../config/firebase';

export async function getContactData(): Promise<ContactData | null> {
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

  const contactData: ContactData = firstAboutMeContactDoc.contact;

  const items = (contactData?.items ?? []).slice().sort((a, b) => {
    const orderA = a.order ?? 0;
    const orderB = b.order ?? 0;
    return orderA - orderB;
  });

  return { items };
}
