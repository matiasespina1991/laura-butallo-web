'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2 } from 'lucide-react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import MediaList from './media-list';
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
import { useStorageAssetSrc } from '@/hooks/use-storage-asset-src';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

interface Media {
  id: string;
  mediaSetId: string | null;
  order?: number;
  flex?: number;
  type: 'image' | 'video';
  paths: any;
  processed: boolean;
  deletedAt?: any;
}

interface MediaSet {
  id: string;
  ordering: number;
}

interface Props {
  mediaset: MediaSet;
  index: number;
  media: Media[];
  onMediaUpdate: (media: Media[]) => void;
}

export default function MediasetItem({
  mediaset,
  index,
  media,
  onMediaUpdate
}: Props) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [accordionValue, setAccordionValue] = useState<string>('');

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: mediaset.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  async function handleDelete() {
    try {
      setDeleting(true);
      await updateDoc(doc(db, 'mediasets', mediaset.id), {
        deletedAt: Timestamp.now()
      });
      toast.success('Mediaset eliminado');
      // Los listeners en tiempo real se encargarán de actualizar los datos
    } catch (error) {
      console.error('Error deleting mediaset:', error);
      toast.error('Error al eliminar mediaset');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  }

  const toggleAccordion = () => {
    setAccordionValue(accordionValue === 'item-1' ? '' : 'item-1');
  };

  return (
    <>
      <div ref={setNodeRef} style={style}>
        <Card>
          <Accordion
            type='single'
            collapsible
            value={accordionValue}
            onValueChange={setAccordionValue}
          >
            <AccordionItem value='item-1' className='border-0'>
              <CardHeader
                className='flex cursor-pointer flex-row items-center gap-4 space-y-0'
                onClick={toggleAccordion}
              >
                <button
                  {...attributes}
                  {...listeners}
                  className='cursor-grab active:cursor-grabbing'
                  onClick={(e) => e.stopPropagation()}
                >
                  <GripVertical className='text-muted-foreground h-5 w-5' />
                </button>
                <div className='flex flex-1 items-center gap-3'>
                  {/* Preview thumbnails */}
                  <div
                    className='flex gap-1.5 transition-opacity duration-300'
                    style={{
                      opacity: accordionValue === 'item-1' ? 0 : 1
                    }}
                  >
                    {media.slice(0, 4).map((m) => (
                      <MediaThumbnail key={m.id} media={m} />
                    ))}
                    {media.length === 0 && (
                      <div className='bg-muted text-muted-foreground flex h-12 w-12 items-center justify-center rounded text-xs'>
                        Empty
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
                <AccordionTrigger
                  className='cursor-pointer hover:no-underline'
                  onClick={(e) => e.stopPropagation()}
                />
              </CardHeader>
              <AccordionContent onClick={(e) => e.stopPropagation()}>
                <CardContent>
                  <MediaList
                    mediasetId={mediaset.id}
                    media={media}
                    onUpdate={onMediaUpdate}
                  />
                </CardContent>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Mediaset</AlertDialogTitle>
            <AlertDialogDescription>
              Esto eliminará el mediaset (soft-delete). Los items de media permanecerán sin asignar. Esta acción puede deshacerse limpiando el campo deletedAt en Firestore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function MediaThumbnail({ media }: { media: Media }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const storagePath =
    media.type === 'image'
      ? media.paths?.derivatives?.webp_thumb?.storagePath ||
        media.paths?.derivatives?.webp_small?.storagePath ||
        media.paths?.original?.storagePath
      : media.paths?.poster?.storagePath;

  const { src } = useStorageAssetSrc(storagePath ? { storagePath } : null, {
    preferDirect: false
  });

  if (!src) {
    return <Skeleton className='h-12 w-12 rounded' />;
  }

  return (
    <div className='bg-muted relative h-12 w-12 overflow-hidden rounded'>
      {!imageLoaded && <Skeleton className='absolute inset-0' />}
      <Image
        src={src}
        alt='thumbnail'
        fill
        className={`object-cover transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setImageLoaded(true)}
        sizes='48px'
      />
    </div>
  );
}
