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
          onClick={() => {
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
          <MediaCard key={media.id} media={media} />
        ))}
      </div>
      {!loading && items.length === 0 ? (
        <div className='text-muted-foreground text-sm'>
          Todavía no hay archivos en la galería.
        </div>
      ) : null}
    </div>
  );
}
