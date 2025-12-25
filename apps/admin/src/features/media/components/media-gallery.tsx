'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FileUploader } from '@/components/file-uploader';
import { useStorageAssetSrc } from '@/hooks/use-storage-asset-src';
import { formatBytes } from '@/lib/utils';
import {
  MediaDoc,
  uploadMediaFiles
} from '@/lib/media-upload';

const MAX_UPLOAD_SIZE = 250 * 1024 * 1024;

function getPreviewPath(media: MediaDoc) {
  if (media.type === 'video') {
    return media.paths?.poster?.storagePath ?? null;
  }

  return (
    media.paths?.derivatives?.webp_thumb?.storagePath ??
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

  return (
    <div className='border-border/60 bg-card flex flex-col overflow-hidden rounded-lg border shadow-xs'>
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
        <span className='bg-background/80 text-foreground absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-medium'>
          {media.type === 'video' ? 'Video' : 'Imagen'}
        </span>
      </div>
      <div className='flex flex-1 flex-col gap-1 px-3 py-2'>
        <div className='text-foreground truncate text-sm font-medium'>
          {media.title || 'Sin título'}
        </div>
        <div className='text-muted-foreground flex items-center justify-between text-xs'>
          <span>{media.origin?.context === 'exhibition' ? 'Exhibición' : 'Galería'}</span>
          {typeof media.sizeBytes === 'number' ? (
            <span>{formatBytes(media.sizeBytes, { decimals: 1 })}</span>
          ) : null}
        </div>
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
      <div className='space-y-2'>
        <div className='text-sm font-medium'>Subir nuevos archivos</div>
        <FileUploader
          onUpload={handleUpload}
          progresses={progresses}
          accept={{ 'image/*': [], 'video/*': [] }}
          maxFiles={12}
          maxSize={MAX_UPLOAD_SIZE}
          multiple
        />
        <p className='text-muted-foreground text-xs'>
          Se aceptan imágenes y videos. Tamaño máximo: {formatBytes(MAX_UPLOAD_SIZE)}.
        </p>
      </div>

      {loading ? (
        <div className='text-muted-foreground text-sm'>Cargando galería...</div>
      ) : items.length === 0 ? (
        <div className='text-muted-foreground text-sm'>
          Todavía no hay archivos en la galería.
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {items.map((media) => (
            <MediaCard key={media.id} media={media} />
          ))}
        </div>
      )}
    </div>
  );
}
