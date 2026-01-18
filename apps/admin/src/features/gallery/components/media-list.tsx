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
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { useStorageAssetSrc } from '@/hooks/use-storage-asset-src';
import AssignMediaDialog from './assign-media-dialog';

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

function MediaItem({ media }: { media: Media }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: media.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const thumbnailPath =
    media.type === 'image'
      ? media.paths?.derivatives?.['640w']
      : media.paths?.poster;

  const { src: thumbnailSrc } = useStorageAssetSrc(thumbnailPath);

  async function handleFlexChange(value: string) {
    try {
      const flexValue = parseInt(value);
      await updateDoc(doc(db, 'media', media.id), { flex: flexValue });
      toast.success('Flex updated');
    } catch (error) {
      console.error('Error updating flex:', error);
      toast.error('Failed to update flex');
    }
  }

  return (
    <div ref={setNodeRef} style={style} className='flex items-center gap-3 p-3 bg-muted/50 rounded-lg'>
      <button
        {...attributes}
        {...listeners}
        className='cursor-grab active:cursor-grabbing'
      >
        <GripVertical className='text-muted-foreground h-5 w-5' />
      </button>
      
      <div className='w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0'>
        {thumbnailSrc && (
          <img
            src={thumbnailSrc}
            alt=''
            className='w-full h-full object-cover'
          />
        )}
      </div>

      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium truncate'>
          {media.type === 'image' ? 'Image' : 'Video'}
        </p>
        <p className='text-xs text-muted-foreground truncate'>{media.id}</p>
      </div>

      <Select
        value={media.flex?.toString() || '1'}
        onValueChange={handleFlexChange}
      >
        <SelectTrigger className='w-[100px]'>
          <SelectValue placeholder='Flex' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='1'>Flex 1</SelectItem>
          <SelectItem value='2'>Flex 2</SelectItem>
          <SelectItem value='3'>Flex 3</SelectItem>
          <SelectItem value='4'>Flex 4</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export default function MediaList({ mediasetId, media, onUpdate }: Props) {
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
        toast.success('Order updated');
      } catch (error) {
        console.error('Error updating order:', error);
        toast.error('Failed to update order');
      }
    }
  }

  function handleAssignComplete() {
    setAssignDialogOpen(false);
    // Parent will reload data via onUpdate callback
  }

  if (media.length === 0) {
    return (
      <div className='text-center py-8 space-y-4'>
        <p className='text-muted-foreground text-sm'>
          No media assigned to this mediaset yet.
        </p>
        <Button variant='outline' onClick={() => setAssignDialogOpen(true)}>
          <Plus className='mr-2 h-4 w-4' />
          Add Media
        </Button>
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
        <SortableContext items={media.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <div className='space-y-2'>
            {media.map((m) => (
              <MediaItem key={m.id} media={m} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        variant='outline'
        size='sm'
        onClick={() => setAssignDialogOpen(true)}
        className='w-full'
      >
        <Plus className='mr-2 h-4 w-4' />
        Add More Media
      </Button>

      <AssignMediaDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        mediasetId={mediasetId}
        onSuccess={handleAssignComplete}
      />
    </div>
  );
}
