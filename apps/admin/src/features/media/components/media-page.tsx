'use client';

import { useCallback, useEffect, useState } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { IconTrash } from '@tabler/icons-react';
import { toast } from 'sonner';

import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { db } from '@/lib/firebase';
import MediaGallery from '@/features/media/components/media-gallery';
import type { MediaDoc } from '@/lib/media-upload';

export default function MediaPage() {
  const [selectedMedia, setSelectedMedia] = useState<MediaDoc | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!selectedMedia) {
      setConfirmOpen(false);
    }
  }, [selectedMedia]);

  const handleDelete = useCallback(async () => {
    if (!selectedMedia) return;
    setIsDeleting(true);
    try {
      await updateDoc(doc(db, 'media', selectedMedia.id), {
        deletedAt: serverTimestamp()
      });
      toast.success('Media eliminada.');
      setSelectedMedia(null);
      setConfirmOpen(false);
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
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button
                type='button'
                variant='destructive'
                disabled={isDeleting}
                className='bg-red-600/80 text-white hover:bg-red-600'
              >
                <IconTrash className='h-4 w-4' />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar media?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción marca el media como eliminado y lo saca de la
                  galería. Podés volver a subirlo más adelante si lo necesitás.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className='bg-red-600/80 text-white hover:bg-red-600'
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
