'use client';

import { useCallback, useState } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { IconTrash } from '@tabler/icons-react';
import { toast } from 'sonner';

import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import MediaGallery from '@/features/media/components/media-gallery';
import type { MediaDoc } from '@/lib/media-upload';

export default function MediaPage() {
  const [selectedMedia, setSelectedMedia] = useState<MediaDoc | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = useCallback(async () => {
    if (!selectedMedia) return;
    const confirmed = window.confirm(
      `Eliminar "${selectedMedia.title || 'Sin título'}"?`
    );
    if (!confirmed) return;
    setIsDeleting(true);
    try {
      await updateDoc(doc(db, 'media', selectedMedia.id), {
        deletedAt: serverTimestamp()
      });
      toast.success('Media eliminada.');
      setSelectedMedia(null);
    } catch (error) {
      console.error('[Media] delete error', error);
      toast.error('No se pudo eliminar el media.');
    } finally {
      setIsDeleting(false);
    }
  }, [selectedMedia]);

  return (
    <PageContainer
      pageTitle='Galería'
      pageDescription='Gestiona imágenes y videos del sitio.'
      pageHeaderAction={
        selectedMedia ? (
          <Button
            type='button'
            variant='destructive'
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <IconTrash className='h-4 w-4' />
            Eliminar
          </Button>
        ) : null
      }
    >
      <MediaGallery
        selectedId={selectedMedia?.id ?? null}
        onSelectionChange={setSelectedMedia}
      />
    </PageContainer>
  );
}
