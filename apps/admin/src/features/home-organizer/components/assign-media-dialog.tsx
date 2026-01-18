'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import MediaPickerDialog, {
  type MediaDoc
} from '@/components/media-picker-dialog';

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
  onSuccess
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
        const currentMediaSetIds = (media as any).mediaSetIds || [];
        const updatedMediaSetIds = [...currentMediaSetIds];
        
        // Add mediasetId if not already present
        if (!updatedMediaSetIds.includes(mediasetId)) {
          updatedMediaSetIds.push(mediasetId);
        }

        batch.update(doc(db, 'media', media.id), {
          mediaSetIds: updatedMediaSetIds,
          order: index,
          flex: 1
        });
      });

      await batch.commit();

      toast.success(`${selectedMedia.length} media asignados`);
      onSuccess();
    } catch (error) {
      console.error('Error assigning media:', error);
      toast.error('Error al asignar media');
    }
  }

  const filterUnassigned = (media: MediaDoc) => {
    const mediaSetIds = (media as any).mediaSetIds || [];
    const isUnassigned = mediaSetIds.length === 0;
    return isUnassigned;
  };

  return (
    <MediaPickerDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Agregar Media al Mediaset'
      description='Mostrando solo media sin asignar. Seleccioná los elementos que querés agregar.'
      selectionMode='multiple'
      filterPredicate={filterUnassigned}
      selectedIds={[]}
      onConfirm={handleConfirm}
    />
  );
}
