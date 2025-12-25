import PageContainer from '@/components/layout/page-container';
import MediaGallery from '@/features/media/components/media-gallery';

export const metadata = {
  title: 'Dashboard: Galería'
};

export default function Page() {
  return (
    <PageContainer
      pageTitle='Galería'
      pageDescription='Gestiona imágenes y videos del sitio.'
    >
      <MediaGallery />
    </PageContainer>
  );
}
