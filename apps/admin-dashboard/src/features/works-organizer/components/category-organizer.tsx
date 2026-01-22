'use client';

import { Skeleton } from '@/components/ui/skeleton';
import {
  collection,
  doc,
  getDoc,
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
import MediasetItem from './mediaset-item-v2';
import NewMediasetDialog from './new-mediaset-dialog-v2';
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
import type { MediaSet, MediaSetItem, Media } from '@/types/mediaset';

interface Props {
  category: 'home' | 'caves' | 'landscapes';
}

export default function CategoryOrganizer({ category }: Props) {
  const [mediasets, setMediasets] = useState<MediaSet[]>([]);
  const [itemsByMediaset, setItemsByMediaset] = useState<
    Record<string, MediaSetItem[]>
  >({});
  const [mediaById, setMediaById] = useState<Record<string, Media>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  useEffect(() => {
    setLoading(true);

    // Real-time listener for mediasets of this category
    const mediasetsQuery = query(
      collection(db, 'mediasets'),
      where('category', '==', category),
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

    return () => {
      unsubscribeMediasets();
    };
  }, [category]);

  // Load items for each mediaset
  useEffect(() => {
    if (mediasets.length === 0) return;

    const unsubscribers: (() => void)[] = [];

    mediasets.forEach((mediaset) => {
      const itemsQuery = query(
        collection(db, 'mediasets', mediaset.id, 'items'),
        orderBy('order', 'asc')
      );

      const unsubscribe = onSnapshot(
        itemsQuery,
        async (snapshot) => {
          const items = snapshot.docs.map(
            (d) => ({ ...d.data(), id: d.id }) as MediaSetItem
          );
          setItemsByMediaset((prev) => ({ ...prev, [mediaset.id]: items }));

          // Load media for these items
          const mediaPromises = items.map(async (item) => {
            try {
              console.log(`[CategoryOrganizer] Loading media: ${item.mediaId} for item: ${item.id}`);
              const mediaDocRef = doc(db, 'media', item.mediaId);
              const mediaDocSnap = await getDoc(mediaDocRef);
              if (mediaDocSnap.exists()) {
                const media = {
                  ...mediaDocSnap.data(),
                  id: mediaDocSnap.id
                } as Media;
                console.log(`[CategoryOrganizer] Media found:`, media.id);
                setMediaById((prev) => ({ ...prev, [item.mediaId]: media }));
              } else {
                console.error(`[CategoryOrganizer] Media document does not exist: ${item.mediaId}`);
              }
            } catch (error) {
              console.error(`[CategoryOrganizer] Error loading media ${item.mediaId}:`, error);
            }
          });

          await Promise.all(mediaPromises);
        },
        (error) => {
          console.error(
            `Error loading items for mediaset ${mediaset.id}:`,
            error
          );
        }
      );

      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [mediasets]);

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
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='ml-auto h-10 w-[200px]' />
        <div className='flex items-center gap-3'>
          <Skeleton className='h-6 w-4' />
          <Skeleton className='h-[88px] flex-1' />
        </div>
        <div className='flex items-center gap-3'>
          <Skeleton className='h-6 w-4' />
          <Skeleton className='h-[88px] flex-1' />
        </div>
        <div className='flex items-center gap-3'>
          <Skeleton className='h-6 w-4' />
          <Skeleton className='h-[88px] flex-1' />
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-end'>
        <Button onClick={() => setDialogOpen(true)}>
          Agregar Nuevo Mediaset
        </Button>
      </div>

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
              {mediasets.map((mediaset, index) => {
                const items = itemsByMediaset[mediaset.id] || [];
                const mediaList = items
                  .map((item) => ({
                    ...mediaById[item.mediaId],
                    ...item
                  }))
                  .filter((m) => m.id);

                return (
                  <MediasetItem
                    key={mediaset.id}
                    mediaset={mediaset}
                    index={index}
                    items={items}
                    mediaList={mediaList as any}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <NewMediasetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={category}
        currentMaxOrdering={
          mediasets.length > 0
            ? Math.max(...mediasets.map((ms) => ms.ordering))
            : -1
        }
      />
    </div>
  );
}
