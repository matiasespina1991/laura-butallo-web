'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FileUploader } from '@/components/file-uploader';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useStorageAssetSrc } from '@/hooks/use-storage-asset-src';
import { cn, formatBytes } from '@/lib/utils';
import { IconPhoto, IconVideo } from '@tabler/icons-react';
import { MediaDoc, uploadMediaFiles } from '@/lib/media-upload';
import { toast } from 'sonner';

const MAX_UPLOAD_SIZE = 250 * 1024 * 1024;

function getPreviewPath(media: MediaDoc) {
  if (media.type === 'video') {
    return media.paths?.poster?.storagePath ?? null;
  }

  return (
    media.paths?.derivatives?.webp_medium?.storagePath ??
    media.paths?.derivatives?.webp_small?.storagePath ??
    media.paths?.original?.storagePath ??
    null
  );
}

function MediaCard({ media }: { media: MediaDoc }) {
  const previewPath = useMemo(() => getPreviewPath(media), [media]);
  const { src, hasSource, handleError } = useStorageAssetSrc(
    previewPath ? { storagePath: previewPath } : null,
    { preferDirect: false }
  );
  const [isEditing, setIsEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(media.title ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const titleRef = useRef<HTMLSpanElement | null>(null);
  const draftTitleRef = useRef(media.title ?? '');
  const savingRef = useRef(false);

  useEffect(() => {
    if (!isEditing) {
      const nextTitle = media.title ?? '';
      setLocalTitle(nextTitle);
      draftTitleRef.current = nextTitle;
    }
  }, [media.title, isEditing]);

  useEffect(() => {
    if (!isEditing) return;
    const element = titleRef.current;
    if (!element) return;
    element.focus();
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [isEditing]);

  const saveTitle = async () => {
    if (savingRef.current) return;
    const nextTitle = (draftTitleRef.current ?? '').trim();
    const currentTitle = (media.title ?? '').trim();

    if (nextTitle === currentTitle) {
      setIsEditing(false);
      setLocalTitle(media.title ?? '');
      return;
    }

    savingRef.current = true;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'media', media.id), {
        title: nextTitle
      });
      setLocalTitle(nextTitle);
      setIsEditing(false);
    } catch (error) {
      console.error('[Media] update title error', error);
      toast.error('No se pudo actualizar el título.');
      setIsEditing(true);
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <div className='border-border/60 bg-card flex h-full flex-col overflow-hidden rounded-lg border shadow-xs'>
      <div className='bg-muted relative aspect-[4/3] w-full overflow-hidden'>
        {hasSource ? (
          <img
            src={src}
            alt={media.title || media.id}
            className='h-full w-full object-cover'
            loading='lazy'
            onError={handleError}
          />
        ) : (
          <div className='text-muted-foreground flex h-full items-center justify-center text-xs'>
            {media.processed ? 'Sin vista previa' : 'Procesando…'}
          </div>
        )}
        <span
          className={cn(
            'absolute top-2 left-2 inline-flex items-center justify-center rounded-full p-1.5',
            media.type === 'video'
              ? 'bg-sky-100/80 text-sky-700'
              : 'bg-amber-100/80 text-amber-700'
          )}
        >
          {media.type === 'video' ? (
            <IconVideo className='h-3.5 w-3.5' aria-hidden='true' />
          ) : (
            <IconPhoto className='h-3.5 w-3.5' aria-hidden='true' />
          )}
          <span className='sr-only'>
            {media.type === 'video' ? 'Video' : 'Imagen'}
          </span>
        </span>
      </div>
      <div className='flex flex-1 flex-col gap-1 px-3 py-2'>
        <span
          ref={titleRef}
          contentEditable={isEditing && !isSaving}
          suppressContentEditableWarning
          role='textbox'
          aria-label='Editar título'
          className='text-foreground w-full truncate text-left text-sm font-medium outline-none'
          onClick={(event) => {
            event.stopPropagation();
            if (!isEditing && !isSaving) {
              setIsEditing(true);
            }
          }}
          onInput={(event) => {
            draftTitleRef.current = event.currentTarget.textContent ?? '';
          }}
          onBlur={() => {
            if (isEditing) saveTitle();
          }}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === 'Enter') {
              event.preventDefault();
              saveTitle();
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              setIsEditing(false);
              setLocalTitle(media.title ?? '');
              draftTitleRef.current = media.title ?? '';
            }
          }}
        >
          {isEditing ? draftTitleRef.current : localTitle || 'Sin título'}
        </span>
        <div className='text-muted-foreground flex items-center justify-between text-xs'>
          <span>
            {media.origin?.context === 'exhibition' ? 'Exhibición' : 'Galería'}
          </span>
          {typeof media.sizeBytes === 'number' ? (
            <span>{formatBytes(media.sizeBytes, { decimals: 1 })}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function UploadCard({
  onUpload,
  progresses
}: {
  onUpload: (files: File[]) => Promise<void>;
  progresses: Record<string, number>;
}) {
  return (
    <div className='border-border/60 bg-card flex h-full flex-col overflow-hidden rounded-lg border shadow-xs'>
      <div className='flex flex-1 p-5'>
        <FileUploader
          onUpload={onUpload}
          progresses={progresses}
          accept={{ 'image/*': [], 'video/*': [] }}
          maxFiles={12}
          maxSize={MAX_UPLOAD_SIZE}
          multiple
          containerClassName='flex-1 gap-3'
          className='h-full w-full flex-1'
          compact
        />
      </div>
    </div>
  );
}

export default function MediaGallery() {
  const [items, setItems] = useState<MediaDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [progresses, setProgresses] = useState<Record<string, number>>({});
  const [activeMedia, setActiveMedia] = useState<MediaDoc | null>(null);

  const lightboxImageAsset = useMemo(() => {
    if (!activeMedia || activeMedia.type !== 'image') return null;
    const candidates = [
      activeMedia.paths?.derivatives?.webp_large,
      activeMedia.paths?.derivatives?.webp_medium,
      activeMedia.paths?.derivatives?.webp_small,
      activeMedia.paths?.original
    ];
    const target = candidates.find(
      (item) => item?.storagePath || item?.downloadURL
    );
    return {
      storagePath: target?.storagePath ?? null,
      downloadURL: target?.downloadURL ?? null
    };
  }, [activeMedia]);

  const lightboxVideoAsset = useMemo(() => {
    if (!activeMedia || activeMedia.type !== 'video') return null;
    const candidates = [
      activeMedia.paths?.derivatives?.webm_1080,
      activeMedia.paths?.derivatives?.webm_720,
      activeMedia.paths?.derivatives?.webm_360
    ];
    const target = candidates.find(
      (item) => item?.storagePath || item?.downloadURL
    );
    return {
      storagePath: target?.storagePath ?? null,
      downloadURL: target?.downloadURL ?? null
    };
  }, [activeMedia]);

  const lightboxPosterAsset = useMemo(() => {
    if (!activeMedia || activeMedia.type !== 'video') return null;
    return {
      storagePath: activeMedia.paths?.poster?.storagePath ?? null,
      downloadURL: activeMedia.paths?.poster?.downloadURL ?? null
    };
  }, [activeMedia]);

  const {
    src: lightboxImageSrc,
    hasSource: hasImageSource,
    handleError: handleImageError
  } = useStorageAssetSrc(lightboxImageAsset, { preferDirect: true });
  const {
    src: lightboxVideoSrc,
    hasSource: hasVideoSource,
    handleError: handleVideoError
  } = useStorageAssetSrc(lightboxVideoAsset, { preferDirect: true });
  const { src: lightboxPosterSrc } = useStorageAssetSrc(lightboxPosterAsset, {
    preferDirect: true
  });

  useEffect(() => {
    const mediaQuery = query(
      collection(db, 'media'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(
      mediaQuery,
      (snapshot) => {
        const next = snapshot.docs.map((doc) => {
          const data = doc.data() as Omit<MediaDoc, 'id'>;
          return { id: doc.id, ...data };
        });
        setItems(next);
        setLoading(false);
      },
      () => {
        setItems([]);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const handleUpload = async (files: File[]) => {
    await uploadMediaFiles(
      files,
      { context: 'gallery', role: 'gallery' },
      (fileName, progress) => {
        setProgresses((prev) => ({ ...prev, [fileName]: progress }));
      }
    );
  };

  return (
    <div className='space-y-6'>
      {loading ? (
        <div className='text-muted-foreground text-sm'>Cargando galería...</div>
      ) : null}
      <div className='grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5'>
        <UploadCard onUpload={handleUpload} progresses={progresses} />
        {items.map((media) => (
          <div
            key={media.id}
            role='button'
            tabIndex={0}
            className='cursor-pointer outline-none'
            onClick={() => setActiveMedia(media)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setActiveMedia(media);
              }
            }}
          >
            <MediaCard media={media} />
          </div>
        ))}
      </div>
      {!loading && items.length === 0 ? (
        <div className='text-muted-foreground text-sm'>
          Todavía no hay archivos en la galería.
        </div>
      ) : null}
      <Dialog
        open={Boolean(activeMedia)}
        onOpenChange={(open) => {
          if (!open) setActiveMedia(null);
        }}
      >
        <DialogContent className='h-[min(92vh,860px)] max-w-[min(96vw,1200px)] p-0 sm:max-w-5xl'>
          {activeMedia ? (
            <div className='flex h-full flex-col'>
              <DialogTitle className='sr-only'>
                {activeMedia.title
                  ? `Preview: ${activeMedia.title}`
                  : 'Preview media'}
              </DialogTitle>
              <div className='border-border/60 flex items-center justify-between border-b px-5 py-3'>
                <div className='space-y-0.5'>
                  <div className='text-sm font-semibold'>
                    {activeMedia.title || 'Sin título'}
                  </div>
                  <div className='text-muted-foreground text-xs'>
                    {activeMedia.type === 'video' ? 'Video' : 'Imagen'} ·{' '}
                    {activeMedia.origin?.context === 'exhibition'
                      ? 'Exhibición'
                      : 'Galería'}
                  </div>
                </div>
              </div>
              <div className='flex-1 contain-size'>
                <div className='bg-muted/40 flex h-full items-center justify-center overflow-hidden rounded-lg'>
                  {activeMedia.type === 'video' ? (
                    hasVideoSource ? (
                      <video
                        playsInline
                        autoPlay
                        className='h-full max-h-full w-full max-w-full object-contain'
                        controls
                        poster={lightboxPosterSrc || undefined}
                        src={lightboxVideoSrc}
                        onError={handleVideoError}
                      />
                    ) : (
                      <div className='text-muted-foreground text-sm'>
                        No hay vista previa disponible.
                      </div>
                    )
                  ) : hasImageSource ? (
                    <img
                      src={lightboxImageSrc}
                      alt={activeMedia.title || activeMedia.id}
                      className='max-h-full max-w-full object-contain'
                      loading='lazy'
                      onError={handleImageError}
                    />
                  ) : (
                    <div className='text-muted-foreground text-sm'>
                      No hay vista previa disponible.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
