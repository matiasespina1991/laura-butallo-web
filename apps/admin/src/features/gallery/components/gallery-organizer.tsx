'use client';

import { Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  where,
  writeBatch
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
  createdAt: any;
  modifiedAt: any;
  publishedAt: any;
  deletedAt?: any;
}

export default function GalleryOrganizer() {
  const [mediasets, setMediasets] = useState<MediaSet[]>([]);
  const [allMedia, setAllMedia] = useState<Media[]>([]);
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
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [mediasetsSnap, mediaSnap] = await Promise.all([
        getDocs(
          query(
            collection(db, 'mediasets'),
            orderBy('ordering', 'asc')
          )
        ),
        getDocs(
          query(
            collection(db, 'media'),
            where('processed', '==', true)
          )
        )
      ]);

      const loadedMediasets = mediasetsSnap.docs
        .map((d) => ({ ...d.data(), id: d.id }) as MediaSet)
        .filter((ms) => !ms.deletedAt);
        
      const loadedMedia = mediaSnap.docs
        .map((d) => ({ ...d.data(), id: d.id }) as Media)
        .filter((m) => !m.deletedAt);

      console.log('[GalleryOrganizer] Loaded mediasets:', loadedMediasets.length);
      console.log('[GalleryOrganizer] Loaded media:', loadedMedia.length);
      console.log('[GalleryOrganizer] Sample media:', loadedMedia[0]);

      setMediasets(loadedMediasets);
      setAllMedia(loadedMedia);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load gallery data');
    } finally {
      setLoading(false);
    }
  }

  function getMediaForSet(setId: string) {
    const filtered = allMedia
      .filter((m) => m.mediaSetId === setId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    
    console.log(`[GalleryOrganizer] getMediaForSet(${setId}):`, filtered.length, 'items');
    if (filtered.length === 0 && allMedia.length > 0) {
      console.log(`[GalleryOrganizer] Sample mediaSetId from allMedia:`, allMedia[0].mediaSetId);
    }
    
    return filtered;
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
      toast.success('Mediasets reordered');
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Failed to save order');
      loadData(); // Reload on error
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
      <div className='space-y-4 p-4'>
        <Skeleton className='h-12 w-full' />
        <Skeleton className='h-64 w-full' />
        <Skeleton className='h-64 w-full' />
      </div>
    );
  }

  return (
    <div className='space-y-4 p-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Gallery Organization</h1>
          <p className='text-muted-foreground'>
            Organize mediasets and their items for the home page
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className='mr-2 h-4 w-4' />
          New Mediaset
        </Button>
      </div>

      {mediasets.length === 0 ? (
        <Card className='p-8 text-center'>
          <p className='text-muted-foreground'>
            No mediasets yet. Create one to get started.
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
                  onDelete={loadData}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <NewMediasetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={loadData}
        currentMaxOrdering={
          mediasets.length > 0
            ? Math.max(...mediasets.map((ms) => ms.ordering))
            : -1
        }
      />
    </div>
  );
}
