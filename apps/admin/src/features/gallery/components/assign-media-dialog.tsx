'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import MediaPickerDialog, { type MediaDoc } from '@/components/media-picker-dialog';


interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediasetId: string;
  onSuccess: () => void;
}

export default function AssignMediaDialog({
  open,
  onOpenChange,
  mediasetId,
  onSuccess,
}: Props) {
  async function handleConfirm(selectedMedia: MediaDoc[]) {
    if (selectedMedia.length === 0) return;

    try {
      const batch = writeBatch(db);
      
      // Sort by createdAt if available
      const sorted = [...selectedMedia].sort((a, b) => {
        const aTime = (a as any).createdAt?.toMillis?.() || 0;
        const bTime = (b as any).createdAt?.toMillis?.() || 0;
        return aTime - bTime;
      });

      sorted.forEach((media, index) => {
        batch.update(doc(db, 'media', media.id), {
          mediaSetId: mediasetId,
          order: index,
          flex: 1
        });
      });

      await batch.commit();
      
      toast.success(`${selectedMedia.length} media assigned`);
      onSuccess();
    } catch (error) {
      console.error('Error assigning media:', error);
      toast.error('Failed to assign media');
    }
  }

  const filterUnassigned = (media: MediaDoc) => {
    const isUnassigned = !(media as any).mediaSetId || (media as any).mediaSetId === null;
    console.log('[AssignMediaDialog] Media', media.id, 'mediaSetId:', (media as any).mediaSetId, 'isUnassigned:', isUnassigned);
    return isUnassigned;
  };

  return (
    <MediaPickerDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add Media to Mediaset"
      description="Select media items to add to this mediaset"
      selectionMode="multiple"
      filterPredicate={filterUnassigned}
      selectedIds={[]}
      onConfirm={handleConfirm}
    />
  );
}
