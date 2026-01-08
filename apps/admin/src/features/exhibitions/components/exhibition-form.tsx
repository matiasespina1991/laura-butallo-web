'use client';

import { FormInput } from '@/components/forms/form-input';
import { FormQuill } from '@/components/forms/form-quill';
import { FileUploader } from '@/components/file-uploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { db } from '@/lib/firebase';
import { resolveSignedUrl } from '@/lib/asset-url';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  MediaDoc,
  uploadMediaFiles,
  waitForMediaByUploadId
} from '@/lib/media-upload';
import { useStorageAssetSrc } from '@/hooks/use-storage-asset-src';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { IconPhoto, IconTrash, IconVideo } from '@tabler/icons-react';
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';

type ExhibitionFormValues = {
  title: string;
  dateAndLocation: string;
  body: string;
  featureMediaId: string | null;
  mediaIds: string[];
};

type ExhibitionFormProps = {
  exhibitionId?: string;
};

const MAX_UPLOAD_SIZE = 250 * 1024 * 1024;
const VIDEO_PROCESSING_TIMEOUT_MS = 20 * 60 * 1000;
const IMAGE_PROCESSING_TIMEOUT_MS = 4 * 60 * 1000;

const uniqueIds = (items: string[]) => Array.from(new Set(items));

const getNextExhibitionOrder = async () => {
  const orderQuery = query(
    collection(db, 'exhibitions'),
    orderBy('order', 'desc'),
    limit(1)
  );
  const snapshot = await getDocs(orderQuery);
  const lastOrder = snapshot.docs[0]?.data()?.order;
  return typeof lastOrder === 'number' ? lastOrder + 1 : 0;
};

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

function getGalleryPreviewPath(media: MediaDoc) {
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

function getEditorImageSource(media: MediaDoc) {
  const derivatives = media.paths?.derivatives ?? {};
  const downloadUrl =
    derivatives.webp_small?.downloadURL ??
    derivatives.webp_medium?.downloadURL ??
    derivatives.webp_large?.downloadURL ??
    media.paths?.original?.downloadURL ??
    null;
  if (downloadUrl) {
    return { url: downloadUrl };
  }

  return {
    storagePath:
      derivatives.webp_small?.storagePath ??
      derivatives.webp_medium?.storagePath ??
      derivatives.webp_large?.storagePath ??
      media.paths?.original?.storagePath ??
      null
  };
}

function MediaPreviewCard({
  media,
  onRemove,
  actions
}: {
  media: MediaDoc;
  onRemove?: () => void;
  actions?: ReactNode;
}) {
  const previewPath = getPreviewPath(media);
  const { src, hasSource, handleError } = useStorageAssetSrc(
    previewPath ? { storagePath: previewPath } : null,
    { preferDirect: false }
  );

  return (
    <div className='border-border/60 bg-card flex min-w-0 items-center gap-3 rounded-lg border px-3 py-2 shadow-xs'>
      <div className='bg-muted flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md'>
        {hasSource ? (
          <img
            src={src}
            alt={media.id}
            className='h-full w-full object-cover'
            loading='lazy'
            onError={handleError}
          />
        ) : (
          <span className='text-muted-foreground text-[11px]'>
            {media.processed ? 'Sin vista previa' : 'Procesando…'}
          </span>
        )}
      </div>
      <div className='flex-1'>
        <div className='text-sm font-medium'>
          {media.type === 'video' ? 'Video' : 'Imagen'}
        </div>
        <div className='text-muted-foreground truncate text-xs'>{media.id}</div>
      </div>
      {actions ? (
        actions
      ) : onRemove ? (
        <Button
          type='button'
          variant='ghost'
          size='icon'
          onClick={onRemove}
          className='cursor-pointer'
        >
          <IconTrash className='h-4 w-4' />
        </Button>
      ) : null}
    </div>
  );
}

function SortableAttachmentCard({
  media,
  onRemove
}: {
  media: MediaDoc;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: media.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition
      }}
      className={cn(isDragging ? 'opacity-70' : null)}
    >
      <MediaPreviewCard
        media={media}
        onRemove={onRemove}
        actions={
          <div className='flex items-center gap-1'>
            <button
              type='button'
              ref={setActivatorNodeRef}
              className='text-muted-foreground hover:text-foreground inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-md transition-colors active:cursor-grabbing'
              aria-label='Reordenar adjunto'
              {...attributes}
              {...listeners}
            >
              <GripVertical className='h-4 w-4' />
            </button>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              onClick={onRemove}
              className='cursor-pointer'
            >
              <IconTrash className='h-4 w-4' />
            </Button>
          </div>
        }
      />
    </div>
  );
}

type MediaPickerSelectionMode = 'single' | 'multiple';

type MediaPickerDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  selectionMode?: MediaPickerSelectionMode;
  selectedIds?: string[];
  allowedTypes?: Array<MediaDoc['type']>;
  onConfirm: (items: MediaDoc[]) => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
};

function MediaPickerCard({
  media,
  selected,
  onSelect
}: {
  media: MediaDoc;
  selected: boolean;
  onSelect: () => void;
}) {
  const previewPath = getGalleryPreviewPath(media);
  const { src, hasSource, handleError } = useStorageAssetSrc(
    previewPath ? { storagePath: previewPath } : null,
    { preferDirect: false }
  );
  const [isPreviewLoaded, setIsPreviewLoaded] = useState(false);
  const loadStartRef = useRef(0);
  const loadTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setIsPreviewLoaded(false);
    loadStartRef.current = Date.now();
    if (loadTimeoutRef.current !== null) {
      window.clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  }, [src]);

  return (
    <button
      type='button'
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'border-border/60 bg-card group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border text-left shadow-xs transition',
        selected &&
          'ring-offset-background ring-2 ring-[#006cd1]/40 ring-offset-2'
      )}
    >
      <span className='pointer-events-none absolute inset-0 z-0 bg-black/3 opacity-0 transition group-hover:opacity-100' />
      <div className='bg-muted relative z-10 aspect-[4/3] w-full overflow-hidden'>
        {hasSource && src ? (
          <img
            src={src}
            alt={media.title || media.id}
            className={cn(
              'h-full w-full object-cover transition-opacity duration-500',
              isPreviewLoaded ? 'opacity-100' : 'opacity-0'
            )}
            loading='lazy'
            onLoad={() => {
              const elapsed = Date.now() - loadStartRef.current;
              const remaining = Math.max(0, 180 - elapsed);
              if (remaining === 0) {
                setIsPreviewLoaded(true);
                return;
              }
              loadTimeoutRef.current = window.setTimeout(() => {
                setIsPreviewLoaded(true);
                loadTimeoutRef.current = null;
              }, remaining);
            }}
            onError={() => {
              setIsPreviewLoaded(false);
              if (loadTimeoutRef.current !== null) {
                window.clearTimeout(loadTimeoutRef.current);
                loadTimeoutRef.current = null;
              }
              handleError();
            }}
          />
        ) : null}
        {hasSource && src ? (
          <div
            className={cn(
              'bg-muted/50 absolute inset-0 transition-opacity duration-500',
              isPreviewLoaded ? 'opacity-0' : 'animate-pulse opacity-100'
            )}
          />
        ) : null}
        {!hasSource || !src ? (
          <div className='text-muted-foreground flex h-full flex-col items-center justify-center text-xs'>
            {media.processed ? null : (
              <svg
                className='text-muted-foreground mb-2 h-6 w-6 animate-spin'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                ></circle>
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                ></path>
              </svg>
            )}
            {media.processed ? 'Sin vista previa' : <p>Procesando…</p>}
            {media.processed ? '' : 'Este proceso puede tardar varios minutos.'}
          </div>
        ) : null}
        <span
          className={cn(
            'absolute top-2 left-2 z-10 inline-flex items-center justify-center rounded-full p-1.5',
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
      <div className='relative z-10 flex flex-1 flex-col gap-1 px-3 py-2'>
        <div className='text-foreground truncate text-sm font-medium'>
          {media.title || 'Sin título'}
        </div>
        <div className='text-muted-foreground text-xs'>
          {media.origin?.context === 'exhibition' ? 'Exhibición' : 'Galería'}
        </div>
      </div>
    </button>
  );
}

function MediaPickerDialog({
  open,
  title,
  description,
  selectionMode = 'single',
  selectedIds = [],
  allowedTypes,
  onConfirm,
  onOpenChange
}: MediaPickerDialogProps) {
  const [items, setItems] = useState<MediaDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [selection, setSelection] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const wasOpenRef = useRef(false);
  const pageSize = 8;

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setSelection(selectedIds);
      setPage(1);
    }
    wasOpenRef.current = open;
  }, [open, selectedIds]);

  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    setLoading(true);
    getDocs(query(collection(db, 'media'), orderBy('createdAt', 'desc')))
      .then((snapshot) => {
        if (!isMounted) return;
        const rows = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data() as Omit<MediaDoc, 'id'>;
            return { ...data, id: docSnap.id };
          })
          .filter((item) => !item.deletedAt);
        setItems(rows);
      })
      .catch((error) => {
        console.error('[Exhibitions] load media picker error', error);
        if (isMounted) setItems([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open]);

  const filteredItems = allowedTypes?.length
    ? items.filter((item) => allowedTypes.includes(item.type))
    : items;

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    if (!open) return;
    setPage((prev) => Math.min(prev, totalPages));
  }, [open, totalPages]);

  const toggleSelection = (id: string) => {
    setSelection((prev) => {
      if (selectionMode === 'single') {
        return prev[0] === id ? [] : [id];
      }
      return prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];
    });
  };

  const selectedItems = filteredItems.filter((item) =>
    selection.includes(item.id)
  );

  const skeletonCards = Array.from({ length: 15 });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[calc(100vh-2rem)] w-[min(96vw,980px)] flex-col overflow-hidden sm:max-w-[980px]'>
        <DialogHeader className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div className='space-y-1'>
            <DialogTitle>{title}</DialogTitle>
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </div>
          {filteredItems.length > pageSize ? (
            <div className='bg-background inline-flex items-center gap-2 self-end rounded-md px-2 py-1 text-xs'>
              <Button
                type='button'
                variant='outline'
                size='icon'
                className='h-7 w-7'
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <span className='min-w-[4.5rem] text-center'>
                {currentPage} / {totalPages}
              </span>
              <Button
                type='button'
                variant='outline'
                size='icon'
                className='h-7 w-7'
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          ) : null}
        </DialogHeader>
        {loading ? (
          <div className='space-y-4'>
            <div className='text-muted-foreground text-sm'>
              Cargando galería...
            </div>
            <div className='grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5'>
              {skeletonCards.map((_, index) => (
                <div
                  key={index}
                  className='border-border/60 bg-card flex h-full flex-col overflow-hidden rounded-lg border shadow-xs'
                >
                  <Skeleton className='aspect-[4/3] w-full' />
                  <div className='flex flex-1 flex-col gap-2 px-3 py-2'>
                    <Skeleton className='h-4 w-3/4' />
                    <Skeleton className='h-3 w-1/2' />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className='text-muted-foreground text-sm'>
            No hay archivos disponibles.
          </div>
        ) : (
          <div className='max-h-[calc(100vh-12rem)] overflow-y-auto'>
            <div
              className={cn(
                'bg-muted/30 grid grid-cols-2 gap-4 rounded-md p-3 sm:bg-transparent sm:p-0',
                'lg:grid-cols-4'
              )}
            >
              {pagedItems.map((media) => (
                <MediaPickerCard
                  key={media.id}
                  media={media}
                  selected={selection.includes(media.id)}
                  onSelect={() => toggleSelection(media.id)}
                />
              ))}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type='button'
            onClick={async () => {
              await onConfirm(selectedItems);
              onOpenChange(false);
            }}
            disabled={selection.length === 0}
          >
            Aceptar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ExhibitionForm({ exhibitionId }: ExhibitionFormProps) {
  const form = useForm<ExhibitionFormValues>({
    defaultValues: {
      title: '',
      dateAndLocation: '',
      body: '',
      featureMediaId: null,
      mediaIds: []
    }
  });
  const router = useRouter();
  const [loading, setLoading] = useState(Boolean(exhibitionId));
  const [saving, setSaving] = useState(false);
  const [featureMedia, setFeatureMedia] = useState<MediaDoc | null>(null);
  const [attachmentMedia, setAttachmentMedia] = useState<MediaDoc[]>([]);
  const [featureProgress, setFeatureProgress] = useState<
    Record<string, number>
  >({});
  const [attachmentProgress, setAttachmentProgress] = useState<
    Record<string, number>
  >({});
  const [isFeaturePickerOpen, setIsFeaturePickerOpen] = useState(false);
  const [isAttachmentPickerOpen, setIsAttachmentPickerOpen] = useState(false);
  const [isEditorPickerOpen, setIsEditorPickerOpen] = useState(false);
  const pendingEditorInsertRef = useRef<((url: string) => void) | null>(null);
  const lastSavedValuesRef = useRef<ExhibitionFormValues | null>(null);
  const hasUnsavedChanges = Boolean(exhibitionId && form.formState.isDirty);
  const featureMediaId = useWatch({
    control: form.control,
    name: 'featureMediaId'
  });
  const mediaIds =
    useWatch({
      control: form.control,
      name: 'mediaIds'
    }) ?? [];
  const orderedAttachmentMedia = mediaIds
    .map((id) => attachmentMedia.find((media) => media.id === id))
    .filter((media): media is MediaDoc => Boolean(media));
  const attachmentIds = orderedAttachmentMedia.map((media) => media.id);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleUndoChanges = () => {
    if (!lastSavedValuesRef.current) return;
    form.reset(lastSavedValuesRef.current);
  };

  useEffect(() => {
    if (!exhibitionId) return;

    let isMounted = true;
    const loadExhibition = async () => {
      try {
        const snap = await getDoc(doc(db, 'exhibitions', exhibitionId));
        if (!snap.exists()) {
          if (isMounted) {
            setLoading(false);
            toast.error('La exhibición no existe.');
          }
          router.replace('/dashboard/exhibitions');
          return;
        }
        const data = snap.data() as {
          title?: string;
          dateAndLocation?: string;
          body?: string;
          featureMediaId?: string | null;
          mediaIds?: string[];
        };
        if (!isMounted) return;
        form.reset({
          title: data?.title ?? '',
          dateAndLocation: data?.dateAndLocation ?? '',
          body: data?.body ?? '',
          featureMediaId: data?.featureMediaId ?? null,
          mediaIds: data?.mediaIds ?? []
        });
        lastSavedValuesRef.current = {
          title: data?.title ?? '',
          dateAndLocation: data?.dateAndLocation ?? '',
          body: data?.body ?? '',
          featureMediaId: data?.featureMediaId ?? null,
          mediaIds: data?.mediaIds ?? []
        };
      } catch (error) {
        console.error('[Exhibitions] load exhibition error', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadExhibition();

    return () => {
      isMounted = false;
    };
  }, [exhibitionId, form, router]);

  useEffect(() => {
    if (!featureMediaId) {
      setFeatureMedia(null);
      return;
    }

    let active = true;
    getDoc(doc(db, 'media', featureMediaId))
      .then((snap) => {
        if (!active || !snap.exists()) return;
        const data = snap.data() as Omit<MediaDoc, 'id'>;
        setFeatureMedia({ id: snap.id, ...data });
      })
      .catch(() => {
        if (active) setFeatureMedia(null);
      });

    return () => {
      active = false;
    };
  }, [featureMediaId]);

  useEffect(() => {
    if (!mediaIds.length) {
      setAttachmentMedia([]);
      return;
    }

    let active = true;
    Promise.all(
      mediaIds.map(async (id) => {
        const snap = await getDoc(doc(db, 'media', id));
        if (!snap.exists()) return null;
        const data = snap.data() as Omit<MediaDoc, 'id'>;
        return { id: snap.id, ...data };
      })
    )
      .then((rows) => {
        if (!active) return;
        setAttachmentMedia(rows.filter(Boolean) as MediaDoc[]);
      })
      .catch(() => {
        if (active) setAttachmentMedia([]);
      });

    return () => {
      active = false;
    };
  }, [mediaIds]);

  const handleFeatureUpload = async (files: File[]) => {
    const [file] = files;
    if (!file) return;
    try {
      const [result] = await uploadMediaFiles(
        [file],
        {
          context: 'exhibition',
          role: 'feature',
          exhibitionId: exhibitionId ?? null
        },
        (fileName, progress) => {
          setFeatureProgress((prev) => ({ ...prev, [fileName]: progress }));
        }
      );
      const mediaDoc = await waitForMediaByUploadId(result.uploadId, {
        requireProcessed: true,
        timeoutMs: file.type.startsWith('video/')
          ? VIDEO_PROCESSING_TIMEOUT_MS
          : IMAGE_PROCESSING_TIMEOUT_MS
      });
      form.setValue('featureMediaId', mediaDoc.id, { shouldDirty: true });
    } catch (error) {
      console.error('[Exhibitions] feature upload error', error);
      toast.error('No se pudo subir el archivo destacado.');
    }
  };

  const handleAttachmentUpload = async (files: File[]) => {
    if (!files.length) return;
    try {
      const results = await uploadMediaFiles(
        files,
        {
          context: 'exhibition',
          role: 'attachment',
          exhibitionId: exhibitionId ?? null
        },
        (fileName, progress) => {
          setAttachmentProgress((prev) => ({ ...prev, [fileName]: progress }));
        }
      );
      const docs = await Promise.all(
        results.map((result, index) => {
          const file = files[index];
          const timeoutMs = file?.type?.startsWith('video/')
            ? VIDEO_PROCESSING_TIMEOUT_MS
            : IMAGE_PROCESSING_TIMEOUT_MS;
          return waitForMediaByUploadId(result.uploadId, {
            requireProcessed: true,
            timeoutMs
          });
        })
      );
      const nextIds = [...(form.getValues('mediaIds') ?? [])];
      docs.forEach((doc) => {
        if (!nextIds.includes(doc.id)) {
          nextIds.push(doc.id);
        }
      });
      form.setValue('mediaIds', nextIds, { shouldDirty: true });
    } catch (error) {
      console.error('[Exhibitions] attachment upload error', error);
      toast.error('No se pudieron subir los adjuntos.');
    }
  };

  const removeFeatureMedia = () => {
    form.setValue('featureMediaId', null, { shouldDirty: true });
  };

  const removeAttachment = (id: string) => {
    const next = (form.getValues('mediaIds') ?? []).filter(
      (item) => item !== id
    );
    form.setValue('mediaIds', next, { shouldDirty: true });
  };

  const handleAttachmentDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const currentIds = form.getValues('mediaIds') ?? [];
    const oldIndex = currentIds.indexOf(active.id as string);
    const newIndex = currentIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const nextIds = arrayMove(currentIds, oldIndex, newIndex);
    form.setValue('mediaIds', nextIds, { shouldDirty: true });
    setAttachmentMedia((prev) => {
      const map = new Map(prev.map((item) => [item.id, item]));
      return nextIds
        .map((id) => map.get(id))
        .filter((item): item is MediaDoc => Boolean(item));
    });
  };

  const handleRequestEditorImage = (insertImage: (url: string) => void) => {
    pendingEditorInsertRef.current = insertImage;
    setIsEditorPickerOpen(true);
  };

  const onSubmit = async (values: ExhibitionFormValues) => {
    setSaving(true);
    try {
      if (exhibitionId) {
        await updateDoc(doc(db, 'exhibitions', exhibitionId), {
          title: values.title,
          dateAndLocation: values.dateAndLocation,
          body: values.body,
          featureMediaId: values.featureMediaId ?? null,
          mediaIds: values.mediaIds ?? [],
          updatedAt: serverTimestamp()
        });
        form.reset(values);
        lastSavedValuesRef.current = values;
        toast.success('Exhibición actualizada.');
      } else {
        const nextOrder = await getNextExhibitionOrder();
        await addDoc(collection(db, 'exhibitions'), {
          title: values.title,
          dateAndLocation: values.dateAndLocation,
          body: values.body,
          featureMediaId: values.featureMediaId ?? null,
          mediaIds: values.mediaIds ?? [],
          order: nextOrder,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast.success('Exhibición creada.');
        router.push('/dashboard/exhibitions');
      }
    } catch (error) {
      console.error('[Exhibitions] update exhibition error', error);
      toast.error('Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          Agregar exhibición
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-8'
        >
          {loading && (
            <div className='text-muted-foreground text-sm'>
              Cargando exhibición...
            </div>
          )}
          <div className='flex flex-col gap-8 lg:flex-row lg:items-start'>
            <div className='flex flex-1 flex-col gap-6 lg:flex-[3]'>
              <div className='grid grid-cols-1 gap-6'>
                <FormInput
                  control={form.control}
                  name='title'
                  label='Título'
                  placeholder='Ingresá el título de la exhibición'
                  required
                />

                <FormInput
                  control={form.control}
                  name='dateAndLocation'
                  label='Fecha y lugar'
                  placeholder='Abril 2025 · Wintercircus Arena, Bélgica'
                />
              </div>

              <FormQuill
                control={form.control}
                name='body'
                label='Texto'
                placeholder='Escribí el texto de la exhibición...'
                onRequestImage={handleRequestEditorImage}
              />
            </div>

            <div className='flex flex-1 flex-col gap-6 lg:flex-[1]'>
              <div className='space-y-2'>
                <div className='flex flex-wrap items-center gap-3'>
                  <div className='text-sm font-semibold'>
                    Foto o video destacado
                  </div>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='h-8 px-3 text-xs'
                    onClick={() => setIsFeaturePickerOpen(true)}
                  >
                    Agregar desde galería
                  </Button>
                </div>
                {featureMedia ? (
                  <MediaPreviewCard
                    media={featureMedia}
                    onRemove={removeFeatureMedia}
                  />
                ) : null}
                <FileUploader
                  onUpload={handleFeatureUpload}
                  progresses={featureProgress}
                  accept={{ 'image/*': [], 'video/*': [] }}
                  maxFiles={1}
                  maxSize={MAX_UPLOAD_SIZE}
                  onPickFromGallery={() => setIsFeaturePickerOpen(true)}
                />
              </div>

              <div className='space-y-2'>
                <div className='flex flex-wrap items-center gap-3'>
                  <div className='text-sm font-semibold'>Adjuntos</div>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='h-8 px-3 text-xs'
                    onClick={() => setIsAttachmentPickerOpen(true)}
                  >
                    Agregar desde galería
                  </Button>
                </div>
                {orderedAttachmentMedia.length ? (
                  <DndContext
                    sensors={sensors}
                    onDragEnd={handleAttachmentDragEnd}
                  >
                    <SortableContext
                      items={attachmentIds}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className='flex flex-col gap-3'>
                        {orderedAttachmentMedia.map((media) => (
                          <div key={media.id}>
                            <SortableAttachmentCard
                              media={media}
                              onRemove={() => removeAttachment(media.id)}
                            />
                          </div>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className='text-muted-foreground text-sm'>
                    No hay adjuntos todavía.
                  </div>
                )}
                <FileUploader
                  onUpload={handleAttachmentUpload}
                  progresses={attachmentProgress}
                  accept={{ 'image/*': [], 'video/*': [] }}
                  maxFiles={10}
                  maxSize={MAX_UPLOAD_SIZE}
                  multiple
                  onPickFromGallery={() => setIsAttachmentPickerOpen(true)}
                />
              </div>
            </div>
          </div>

          {hasUnsavedChanges ? (
            <div className='mb-1 flex items-center text-sm'>
              <span className='text-red-500'>Hay cambios sin guardar.</span>
              <Button
                type='button'
                variant='link'
                className='text-foreground ml-1 h-auto p-0 text-sm underline underline-offset-2'
                onClick={handleUndoChanges}
              >
                Deshacer
              </Button>
              <span>.</span>
            </div>
          ) : null}
          <Button type='submit' disabled={saving || loading}>
            {saving ? 'Guardando...' : 'Guardar exhibición'}
          </Button>
        </Form>
        <MediaPickerDialog
          open={isFeaturePickerOpen}
          onOpenChange={setIsFeaturePickerOpen}
          title='Seleccionar desde la galería'
          description='Seleccioná una foto o un video destacado.'
          selectionMode='single'
          selectedIds={featureMediaId ? [featureMediaId] : []}
          onConfirm={(items) => {
            const nextId = items[0]?.id ?? null;
            form.setValue('featureMediaId', nextId, { shouldDirty: true });
          }}
        />
        <MediaPickerDialog
          open={isAttachmentPickerOpen}
          onOpenChange={setIsAttachmentPickerOpen}
          title='Seleccionar adjuntos desde la galería'
          description='Seleccioná uno o varios elementos de la galería.'
          selectionMode='multiple'
          selectedIds={mediaIds}
          onConfirm={(items) => {
            const current = form.getValues('mediaIds') ?? [];
            const merged = uniqueIds([
              ...current,
              ...items.map((item) => item.id)
            ]);
            form.setValue('mediaIds', merged, { shouldDirty: true });
          }}
        />
        <MediaPickerDialog
          open={isEditorPickerOpen}
          onOpenChange={(open) => {
            if (!open) pendingEditorInsertRef.current = null;
            setIsEditorPickerOpen(open);
          }}
          title='Insertar imagen desde la galería'
          description='Seleccioná una imagen para insertar en el texto.'
          selectionMode='single'
          allowedTypes={['image']}
          onConfirm={async (items) => {
            const media = items[0];
            if (!media) return;
            const source = getEditorImageSource(media);
            try {
              const url =
                source.url ??
                (source.storagePath
                  ? await resolveSignedUrl(source.storagePath)
                  : null);
              if (!url) {
                toast.error('La imagen no tiene un archivo disponible.');
                return;
              }
              pendingEditorInsertRef.current?.(url);
            } catch (error) {
              console.error('[Exhibitions] editor image error', error);
              toast.error('No se pudo cargar la imagen.');
            } finally {
              pendingEditorInsertRef.current = null;
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
