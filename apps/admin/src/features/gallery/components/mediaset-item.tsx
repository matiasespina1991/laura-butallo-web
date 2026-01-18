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
  onDelete: () => void;
}

export default function MediasetItem({
  mediaset,
  index,
  media,
  onMediaUpdate,
  onDelete
}: Props) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      toast.success('Mediaset deleted');
      onDelete();
    } catch (error) {
      console.error('Error deleting mediaset:', error);
      toast.error('Failed to delete mediaset');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  }

  return (
    <>
      <div ref={setNodeRef} style={style}>
        <Card>
          <Accordion type='single' collapsible>
            <AccordionItem value='item-1' className='border-0'>
              <CardHeader className='flex flex-row items-center gap-4 space-y-0'>
                <button
                  {...attributes}
                  {...listeners}
                  className='cursor-grab active:cursor-grabbing'
                >
                  <GripVertical className='text-muted-foreground h-5 w-5' />
                </button>
                <div className='flex-1'>
                  <CardTitle>Mediaset #{index + 1}</CardTitle>
                  <CardDescription>
                    {media.length} item{media.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
                <AccordionTrigger className='hover:no-underline' />
              </CardHeader>
              <AccordionContent>
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
            <AlertDialogTitle>Delete Mediaset</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft-delete the mediaset. The media items will remain
              unassigned. This action can be undone by clearing the deletedAt
              field in Firestore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
