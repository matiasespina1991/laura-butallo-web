'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { IconDownload, IconTrash, IconX } from '@tabler/icons-react';
import { toast } from 'sonner';

import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { db } from '@/lib/firebase';
import MediaGallery from '@/features/gallery/components/media-gallery';
import type { MediaDoc } from '@/lib/media-upload';
import { useStorageAssetSrc } from '@/hooks/use-storage-asset-src';

function SelectedMediaChip({
  onClear,
  className = ''
}: {
  onClear: () => void;
  className?: string;
}) {
  return (
    <div
      className={`text-foreground inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-medium opacity-100 ${className}`}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type='button'
            onClick={onClear}
            className='hover:bg-muted text-foreground inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-transparent transition-colors'
            aria-label='Deseleccionar archivo'
          >
            <IconX className='h-4 w-4' />
          </button>
        </TooltipTrigger>
        <TooltipContent>Quitar seleccion</TooltipContent>
      </Tooltip>
      <span className='whitespace-nowrap'>1 medio seleccionado</span>
    </div>
  );
}

export default function MediaPage() {
  const [selectedMedia, setSelectedMedia] = useState<MediaDoc | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showFloatingActions, setShowFloatingActions] = useState(false);
  const actionBarRef = useRef<HTMLDivElement | null>(null);
  const downloadAsset = selectedMedia?.paths?.original ?? null;
  const {
    src: downloadSrc,
    hasSource: hasDownloadSource,
    forceSigned: resolveDownload
  } = useStorageAssetSrc(downloadAsset, { preferDirect: true });

  const downloadName = useMemo(() => {
    if (!selectedMedia) return 'media';
    const rawPath = downloadAsset?.storagePath ?? '';
    const lastSegment = rawPath ? (rawPath.split('/').pop() ?? '') : '';
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
      setShowFloatingActions(false);
    }
  }, [selectedMedia]);

  useEffect(() => {
    if (!selectedMedia) return;
    const actionBarElement = actionBarRef.current;
    if (!actionBarElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowFloatingActions(!entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(actionBarElement);
    return () => observer.disconnect();
  }, [selectedMedia]);

  useEffect(() => {
    if (!selectedMedia) return;
    if (!downloadAsset?.storagePath || downloadAsset?.downloadURL) return;
    resolveDownload();
  }, [
    downloadAsset?.downloadURL,
    downloadAsset?.storagePath,
    resolveDownload,
    selectedMedia
  ]);

  const handleDelete = useCallback(async () => {
    if (!selectedMedia) return;
    setIsDeleting(true);
    try {
      await updateDoc(doc(db, 'media', selectedMedia.id), {
        deletedAt: serverTimestamp()
      });
      toast.success('Medio eliminado.');
      setSelectedMedia(null);
      setConfirmOpen(false);
    } catch (error) {
      console.error('[Media] delete error', error);
      toast.error('No se pudo eliminar el medio.');
    } finally {
      setIsDeleting(false);
    }
  }, [selectedMedia]);

  const handleClearSelection = useCallback(() => {
    setSelectedMedia(null);
  }, []);

  return (
    <>
      <PageContainer
        pageTitle='Galería'
        pageDescription='Gestiona imágenes y videos del sitio.'
        pageHeaderAction={
          selectedMedia ? (
            <div ref={actionBarRef} className='flex items-center gap-2'>
              <SelectedMediaChip
                onClear={handleClearSelection}
                className='border-0 bg-transparent px-0 shadow-none'
              />
              <Button
                asChild
                variant='outline'
                disabled={!hasDownloadSource}
                className='h-11'
              >
                <a href={downloadSrc} download={downloadName}>
                  <IconDownload className='h-4 w-4' />
                  Descargar
                </a>
              </Button>
              <Button
                type='button'
                variant='destructive'
                disabled={isDeleting}
                onClick={() => setConfirmOpen(true)}
                className='h-11'
              >
                <IconTrash className='h-4 w-4' />
                Eliminar
              </Button>
            </div>
          ) : null
        }
      >
        <MediaGallery
          selectedId={selectedMedia?.id ?? null}
          onSelectionChange={setSelectedMedia}
        />
      </PageContainer>

      {selectedMedia && showFloatingActions ? (
        <div className='pointer-events-none fixed right-6 bottom-6 z-50 flex flex-row gap-2'>
          <SelectedMediaChip
            onClear={handleClearSelection}
            className='border-border bg-background pointer-events-auto border shadow-lg'
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                variant='outline'
                disabled={!hasDownloadSource}
                size='icon'
                className='!bg-background !text-foreground !border-border !hover:bg-background !dark:bg-background !dark:hover:bg-background pointer-events-auto h-11 w-11 rounded-full !opacity-100 shadow-lg'
              >
                <a
                  href={downloadSrc}
                  download={downloadName}
                  aria-label='Descargar'
                >
                  <IconDownload className='h-5 w-5' />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Descargar</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type='button'
                variant='destructive'
                size='icon'
                disabled={isDeleting}
                onClick={() => setConfirmOpen(true)}
                className='!hover:bg-[#ca2a30] !dark:bg-[#ca2a30] !dark:hover:bg-[#ca2a30] pointer-events-auto h-11 w-11 rounded-full !bg-[#ca2a30] !text-white !opacity-100 shadow-lg'
                aria-label='Eliminar'
              >
                <IconTrash className='h-5 w-5' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Eliminar</TooltipContent>
          </Tooltip>
        </div>
      ) : null}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar media?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marca el media como eliminado y lo saca de la galería.
              Podés volver a subirlo más adelante si lo necesitás.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
