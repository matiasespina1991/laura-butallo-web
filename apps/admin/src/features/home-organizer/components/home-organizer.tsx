'use client';

import { Skeleton } from '@/components/ui/skeleton';
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  where,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

import { useEffect, useState } from 'react';
import MediasetItem from './mediaset-item';
import NewMediasetDialog from './new-mediaset-dialog';
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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Media {
  id: string;
  mediaSetIds?: string[];
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
  createdAt: any;
  modifiedAt: any;
  publishedAt: any;
  deletedAt?: any;
}

interface Props {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
}

export default function HomeOrganizer({ dialogOpen, setDialogOpen }: Props) {
  const [mediasets, setMediasets] = useState<MediaSet[]>([]);
  const [allMedia, setAllMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  useEffect(() => {
    setLoading(true);

    // Real-time listener for mediasets
    const mediasetsQuery = query(
      collection(db, 'mediasets'),
      orderBy('ordering', 'asc')
    );
    const unsubscribeMediasets = onSnapshot(
      mediasetsQuery,
      (snapshot) => {
        const loadedMediasets = snapshot.docs
          .map((d) => ({ ...d.data(), id: d.id }) as MediaSet)
          .filter((ms) => !ms.deletedAt);
        setMediasets(loadedMediasets);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading mediasets:', error);
        toast.error('Error al cargar mediasets');
        setLoading(false);
      }
    );

    // Real-time listener for media
    const mediaQuery = query(
      collection(db, 'media'),
      where('processed', '==', true)
    );
    const unsubscribeMedia = onSnapshot(
      mediaQuery,
      (snapshot) => {
        const loadedMedia = snapshot.docs
          .map((d) => ({ ...d.data(), id: d.id }) as Media)
          .filter((m) => !m.deletedAt);
        setAllMedia(loadedMedia);
      },
      (error) => {
        console.error('Error loading media:', error);
        toast.error('Error al cargar media');
      }
    );

    // Cleanup function to unsubscribe from both listeners
    return () => {
      unsubscribeMediasets();
      unsubscribeMedia();
    };
  }, []);

  function getMediaForSet(setId: string) {
    return allMedia
      .filter((m) => m.mediaSetIds?.includes(setId))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = mediasets.findIndex((ms) => ms.id === active.id);
    const newIndex = mediasets.findIndex((ms) => ms.id === over.id);

    const reordered = arrayMove(mediasets, oldIndex, newIndex);
    setMediasets(reordered);

    // Save to Firestore
    try {
      setSaving(true);
      const batch = writeBatch(db);
      reordered.forEach((ms, idx) => {
        batch.update(doc(db, 'mediasets', ms.id), { ordering: idx });
      });
      await batch.commit();
      toast.success('Orden actualizado');
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Error al guardar orden');
      // Los listeners en tiempo real se encargarán de actualizar los datos
    } finally {
      setSaving(false);
    }
  }

  function handleMediaUpdate(updatedMedia: Media[]) {
    setAllMedia((prev) => {
      const others = prev.filter(
        (m) => !updatedMedia.find((um) => um.id === m.id)
      );
      return [...others, ...updatedMedia];
    });
  }

  if (loading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-12 w-full' />
        <Skeleton className='h-64 w-full' />
        <Skeleton className='h-64 w-full' />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {mediasets.length === 0 ? (
        <Card className='p-8 text-center'>
          <p className='text-muted-foreground'>
            No hay mediasets todavía. Creá uno para empezar.
          </p>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={mediasets.map((ms) => ms.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className='space-y-4'>
              {mediasets.map((mediaset, index) => (
                <MediasetItem
                  key={mediaset.id}
                  mediaset={mediaset}
                  index={index}
                  media={getMediaForSet(mediaset.id)}
                  onMediaUpdate={handleMediaUpdate}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <NewMediasetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        currentMaxOrdering={
          mediasets.length > 0
            ? Math.max(...mediasets.map((ms) => ms.ordering))
            : -1
        }
      />
    </div>
  );
}
