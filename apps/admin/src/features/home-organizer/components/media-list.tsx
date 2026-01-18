'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { useStorageAssetSrc } from '@/hooks/use-storage-asset-src';
import AssignMediaDialog from './assign-media-dialog';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

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

interface Props {
  mediasetId: string;
  media: Media[];
  onUpdate: (media: Media[]) => void;
}

function MediaItem({
  media,
  imageLoadedState,
  onImageLoad
}: {
  media: Media;
  imageLoadedState: Record<string, boolean>;
  onImageLoad: (mediaId: string, loaded: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: media.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const thumbnailPath =
    media.type === 'image'
      ? (media.paths?.derivatives?.webp_thumb?.storagePath ??
        media.paths?.derivatives?.webp_small?.storagePath ??
        media.paths?.original?.storagePath)
      : media.paths?.poster?.storagePath;

  const { src: thumbnailSrc } = useStorageAssetSrc(
    thumbnailPath ? { storagePath: thumbnailPath } : null,
    { preferDirect: false }
  );

  const imageLoaded = imageLoadedState[media.id] || false;

  async function handleFlexChange(value: string) {
    try {
      const flexValue = parseInt(value);
      await updateDoc(doc(db, 'media', media.id), { flex: flexValue });
      toast.success('Flex actualizado');
    } catch (error) {
      console.error('Error updating flex:', error);
      toast.error('Error al actualizar flex');
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await updateDoc(doc(db, 'media', media.id), {
        deletedAt: Timestamp.now()
      });
      toast.success('Media eliminado');
      // Los listeners en tiempo real se encargarán de actualizar los datos
    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error('Error al eliminar media');
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='bg-muted/50 group relative flex flex-col gap-2 rounded-lg p-3'
    >
      <button
        onClick={handleDelete}
        className='bg-background/80 hover:bg-background absolute top-1 right-1 z-10 cursor-pointer rounded-full p-1 opacity-0 transition-opacity group-hover:opacity-100'
        title='Eliminar media'
      >
        <X className='h-3 w-3' />
      </button>
      <div className='flex items-center gap-2'>
        <button
          {...attributes}
          {...listeners}
          className='cursor-grab active:cursor-grabbing'
        >
          <GripVertical className='text-muted-foreground h-4 w-4' />
        </button>
        <p className='text-xs font-medium'>
          {media.type === 'image' ? 'Image' : 'Video'}
        </p>
      </div>

      <div className='bg-muted relative aspect-square w-full overflow-hidden rounded'>
        {!imageLoaded && thumbnailSrc && (
          <Skeleton className='absolute inset-0' />
        )}
        {thumbnailSrc && (
          <img
            src={thumbnailSrc}
            alt=''
            className={cn(
              'h-full w-full object-cover transition-opacity duration-300',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => onImageLoad(media.id, true)}
            onError={() => onImageLoad(media.id, false)}
          />
        )}
      </div>

      {/* <div className='flex items-center gap-2'>
        <span className='text-muted-foreground text-xs'>Flex:</span>
        <Select
          key={media.flex}
          value={media.flex?.toString() || '1'}
          onValueChange={handleFlexChange}
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='1' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='1'>1</SelectItem>
            <SelectItem value='2'>2</SelectItem>
            <SelectItem value='3'>3</SelectItem>
            <SelectItem value='4'>4</SelectItem>
          </SelectContent>
        </Select>
      </div> */}
    </div>
  );
}

export default function MediaList({ mediasetId, media, onUpdate }: Props) {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  // Track loaded state per media ID to persist across re-renders during drag
  const [imageLoadedState, setImageLoadedState] = useState<
    Record<string, boolean>
  >({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  function handleImageLoad(mediaId: string, loaded: boolean) {
    setImageLoadedState((prev) => ({ ...prev, [mediaId]: loaded }));
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = media.findIndex((m) => m.id === active.id);
      const newIndex = media.findIndex((m) => m.id === over.id);

      const reordered = arrayMove(media, oldIndex, newIndex);

      // Update orders in Firestore
      try {
        const updates = reordered.map((m, idx) =>
          updateDoc(doc(db, 'media', m.id), { order: idx })
        );
        await Promise.all(updates);

        onUpdate(reordered.map((m, idx) => ({ ...m, order: idx })));
        toast.success('Orden actualizado');
      } catch (error) {
        console.error('Error updating order:', error);
        toast.error('Error al actualizar orden');
      }
    }
  }

  function handleAssignComplete() {
    setAssignDialogOpen(false);
    // Parent will reload data via onUpdate callback
  }

  if (media.length === 0) {
    return (
      <div className='grid grid-cols-4 gap-3'>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setAssignDialogOpen(true);
          }}
          className='border-muted-foreground/25 hover:border-muted-foreground/40 hover:bg-muted/20 flex h-full min-h-[200px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-3 transition-colors'
        >
          <Plus className='text-muted-foreground h-8 w-8' />
          <span className='text-muted-foreground text-sm font-medium'>
            Agregar Media
          </span>
        </button>
        <AssignMediaDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          mediasetId={mediasetId}
          onSuccess={handleAssignComplete}
        />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={media.slice(0, 4).map((m) => m.id)}
          strategy={rectSortingStrategy}
        >
          <div className='grid grid-cols-4 gap-3'>
            {media.slice(0, 4).map((m) => (
              <MediaItem
                key={m.id}
                media={m}
                imageLoadedState={imageLoadedState}
                onImageLoad={handleImageLoad}
              />
            ))}
            {media.length < 4 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setAssignDialogOpen(true);
                }}
                className='border-muted-foreground/25 hover:border-muted-foreground/40 hover:bg-muted/20 flex h-full min-h-[200px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-3 transition-colors'
              >
                <Plus className='text-muted-foreground h-8 w-8' />
                <span className='text-muted-foreground text-sm font-medium'>
                  Agregar Media
                </span>
              </button>
            )}
          </div>
        </SortableContext>
      </DndContext>

      <AssignMediaDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        mediasetId={mediasetId}
        onSuccess={handleAssignComplete}
      />
    </div>
  );
}
