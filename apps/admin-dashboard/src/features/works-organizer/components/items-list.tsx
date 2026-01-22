'use client';

import { useState } from 'react';
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
import { GripVertical, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { useStorageAssetSrc } from '@/hooks/use-storage-asset-src';
import { cn } from '@/lib/utils';
import type { MediaSetItem, Media } from '@/types/mediaset';
import AssignMediaDialogV2 from './assign-media-dialog-v2';

interface MediaItemWithData extends MediaSetItem {
  media?: Media;
}

interface Props {
  mediasetId: string;
  category: 'home' | 'caves' | 'landscapes';
  items: MediaItemWithData[];
}

function MediaItemCard({
  item,
  mediasetId
}: {
  item: MediaItemWithData;
  mediasetId: string;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const thumbnailPath =
    item.media?.type === 'image'
      ? (item.media?.paths?.derivatives?.webp_thumb?.storagePath ??
        item.media?.paths?.derivatives?.webp_small?.storagePath ??
        item.media?.paths?.original?.storagePath)
      : item.media?.paths?.poster?.storagePath;

  const { src: thumbnailSrc } = useStorageAssetSrc(
    thumbnailPath ? { storagePath: thumbnailPath } : null,
    { preferDirect: false }
  );

  async function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'mediasets', mediasetId, 'items', item.id));
      toast.success('Media removido del mediaset');
    } catch (error) {
      console.error('Error removing media:', error);
      toast.error('Error al remover media');
    }
  }

  if (!item.media) {
    return (
      <div className='bg-muted flex aspect-square items-center justify-center rounded-lg'>
        <p className='text-muted-foreground text-xs'>Media no encontrado</p>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='bg-muted/50 group relative flex flex-col gap-2 rounded-lg p-3'
    >
      <button
        onClick={handleRemove}
        className='bg-background/80 hover:bg-background absolute top-1 right-1 z-10 cursor-pointer rounded-full p-1 opacity-0 transition-opacity group-hover:opacity-100'
        title='Remover del mediaset'
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
          {item.media.type === 'image' ? 'Image' : 'Video'}
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
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(false)}
          />
        )}
      </div>
    </div>
  );
}

export default function ItemsList({ mediasetId, category, items }: Props) {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((m) => m.id === active.id);
      const newIndex = items.findIndex((m) => m.id === over.id);

      const reordered = arrayMove(items, oldIndex, newIndex);

      // Update orders in Firestore
      try {
        const updates = reordered.map((item, idx) =>
          updateDoc(doc(db, 'mediasets', mediasetId, 'items', item.id), {
            order: idx
          })
        );
        await Promise.all(updates);
        toast.success('Orden actualizado');
      } catch (error) {
        console.error('Error updating order:', error);
        toast.error('Error al actualizar orden');
      }
    }
  }

  function handleAssignComplete() {
    setAssignDialogOpen(false);
  }

  if (items.length === 0) {
    return (
      <>
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
        </div>
        <AssignMediaDialogV2
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          mediasetId={mediasetId}
          category={category}
          currentItemsCount={items.length}
          onSuccess={handleAssignComplete}
        />
      </>
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
          items={items.slice(0, 4).map((m) => m.id)}
          strategy={rectSortingStrategy}
        >
          <div className='grid grid-cols-4 gap-3'>
            {items.slice(0, 4).map((item) => (
              <MediaItemCard
                key={item.id}
                item={item}
                mediasetId={mediasetId}
              />
            ))}
            {items.length < 4 && (
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

      <AssignMediaDialogV2
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        mediasetId={mediasetId}
        category={category}
        currentItemsCount={items.length}
        onSuccess={handleAssignComplete}
      />
    </div>
  );
}
