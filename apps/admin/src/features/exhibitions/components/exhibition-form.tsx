'use client';

import { FormInput } from '@/components/forms/form-input';
import { FormTinyMce } from '@/components/forms/form-tinymce';
import { FileUploader } from '@/components/file-uploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { db } from '@/lib/firebase';
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
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { IconTrash } from '@tabler/icons-react';

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

function MediaPreviewCard({
  media,
  onRemove
}: {
  media: MediaDoc;
  onRemove?: () => void;
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
      {onRemove ? (
        <Button
          type='button'
          variant='ghost'
          size='icon'
          onClick={onRemove}
        >
          <IconTrash className='h-4 w-4' />
        </Button>
      ) : null}
    </div>
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
  const [featureProgress, setFeatureProgress] = useState<Record<string, number>>(
    {}
  );
  const [attachmentProgress, setAttachmentProgress] = useState<
    Record<string, number>
  >({});
  const featureMediaId = useWatch({
    control: form.control,
    name: 'featureMediaId'
  });
  const mediaIds =
    useWatch({
      control: form.control,
      name: 'mediaIds'
    }) ?? [];

  useEffect(() => {
    if (!exhibitionId) return;

    let isMounted = true;
    const loadExhibition = async () => {
      try {
        const snap = await getDoc(doc(db, 'exhibitions', exhibitionId));
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
  }, [exhibitionId, form]);

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
        requireProcessed: true
      });
      form.setValue('featureMediaId', mediaDoc.id, { shouldDirty: true });
    } catch (error) {
      console.error('[Exhibitions] feature upload error', error);
      toast.error('No se pudo subir el video destacado.');
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
        results.map((result) =>
          waitForMediaByUploadId(result.uploadId, { requireProcessed: true })
        )
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
        toast.success('Exhibition updated.');
      } else {
        await addDoc(collection(db, 'exhibitions'), {
          title: values.title,
          dateAndLocation: values.dateAndLocation,
          body: values.body,
          featureMediaId: values.featureMediaId ?? null,
          mediaIds: values.mediaIds ?? [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast.success('Exhibition created.');
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
          Add Exhibition
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
              Loading exhibition...
            </div>
          )}
          <div className='flex flex-col gap-8 lg:flex-row lg:items-start'>
            <div className='flex flex-1 flex-col gap-6 lg:flex-[3]'>
              <div className='grid grid-cols-1 gap-6'>
                <FormInput
                  control={form.control}
                  name='title'
                  label='Title'
                  placeholder='Enter exhibition title'
                  required
                />

                <FormInput
                  control={form.control}
                  name='dateAndLocation'
                  label='Date and location'
                  placeholder='April 2025 · Wintercircus Arena, Belgium'
                />
              </div>

              <FormTinyMce
                control={form.control}
                name='body'
                label='Body'
                placeholder='Write the exhibition body...'
              />
            </div>

            <div className='flex flex-1 flex-col gap-6 lg:flex-[1]'>
            <div className='space-y-2'>
              <div className='text-sm font-semibold'>Video destacado</div>
              {featureMedia ? (
                <MediaPreviewCard
                  media={featureMedia}
                  onRemove={removeFeatureMedia}
                />
              ) : null}
              <FileUploader
                onUpload={handleFeatureUpload}
                progresses={featureProgress}
                  accept={{ 'video/*': [] }}
                  maxFiles={1}
                  maxSize={MAX_UPLOAD_SIZE}
                />
              </div>

            <div className='space-y-2'>
              <div className='text-sm font-semibold'>Adjuntos</div>
              {attachmentMedia.length ? (
                <div className='flex flex-wrap gap-3'>
                  {attachmentMedia.map((media) => (
                    <div
                      key={media.id}
                      className='min-w-[220px] flex-[1_1_220px]'
                    >
                      <MediaPreviewCard
                        media={media}
                        onRemove={() => removeAttachment(media.id)}
                      />
                    </div>
                  ))}
                </div>
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
                />
              </div>
            </div>
          </div>

          <Button type='submit' disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save Exhibition'}
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
