import { Metadata } from 'next';
import GalleryOrganizer from '@/features/gallery/components/gallery-organizer';

export const metadata: Metadata = {
  title: 'Gallery Organization',
  description: 'Organize home page mediasets and media items',
};

export default function GalleryPage() {
  return <GalleryOrganizer />;
}
