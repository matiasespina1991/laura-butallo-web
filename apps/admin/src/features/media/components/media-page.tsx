'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { IconDownload, IconTrash } from '@tabler/icons-react';
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
import { useStorageAssetSrc } from '@/hooks/use-storage-asset-src';

export default function MediaPage() {
  const [selectedMedia, setSelectedMedia] = useState<MediaDoc | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const downloadAsset = selectedMedia?.paths?.original ?? null;
  const {
    src: downloadSrc,
    hasSource: hasDownloadSource,
    forceSigned: resolveDownload
  } = useStorageAssetSrc(downloadAsset, { preferDirect: true });

  const downloadName = useMemo(() => {
    if (!selectedMedia) return 'media';
    const rawPath = downloadAsset?.storagePath ?? '';
    const lastSegment = rawPath ? rawPath.split('/').pop() ?? '' : '';
    const dashed = lastSegment.indexOf('-');
    if (lastSegment) {
      return dashed >= 0 && dashed < lastSegment.length - 1
        ? lastSegment.slice(dashed + 1)
        : lastSegment;
    }
    return (selectedMedia.title ?? selectedMedia.id).trim() || selectedMedia.id;
  }, [downloadAsset?.storagePath, selectedMedia]);

  useEffect(() => {
    if (!selectedMedia) {
      setConfirmOpen(false);
    }
  }, [selectedMedia]);

  useEffect(() => {
    if (!selectedMedia) return;
    if (!downloadAsset?.storagePath || downloadAsset?.downloadURL) return;
    resolveDownload();
  }, [downloadAsset?.downloadURL, downloadAsset?.storagePath, resolveDownload, selectedMedia]);

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
          <div className='flex items-center gap-2'>
            <Button
              asChild
              variant='outline'
              disabled={!hasDownloadSource}
            >
              <a href={downloadSrc} download={downloadName}>
                <IconDownload className='h-4 w-4' />
                Descargar
              </a>
            </Button>
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button
                type='button'
                variant='destructive'
                disabled={isDeleting}
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
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </AlertDialogAction>
              </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
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
