'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  writeBatch,
  getDocs,
  query,
  orderBy
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
  category: 'home' | 'caves' | 'landscapes';
  currentItemsCount: number;
  onSuccess: () => void;
}

export default function AssignMediaDialogV2({
  open,
  onOpenChange,
  mediasetId,
  category,
  currentItemsCount,
  onSuccess
}: Props) {
  const [assignedMediaIds, setAssignedMediaIds] = useState<Set<string>>(
    new Set()
  );

  // Load already assigned media IDs for this category
  async function loadAssignedMedia() {
    try {
      // Get all mediasets for this category
      const mediasetsQuery = query(
        collection(db, 'mediasets'),
        orderBy('ordering', 'asc')
      );
      const mediasetsSnapshot = await getDocs(mediasetsQuery);

      const categoryMediasets = mediasetsSnapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((ms: any) => ms.category === category && !ms.deletedAt);

      const assignedIds = new Set<string>();

      // For each mediaset, get all items
      for (const mediaset of categoryMediasets) {
        const itemsSnapshot = await getDocs(
          collection(db, 'mediasets', mediaset.id, 'items')
        );
        itemsSnapshot.docs.forEach((itemDoc) => {
          const itemData = itemDoc.data();
          if (itemData.mediaId) {
            assignedIds.add(itemData.mediaId);
          }
        });
      }

      setAssignedMediaIds(assignedIds);
    } catch (error) {
      console.error('Error loading assigned media:', error);
      toast.error('Error al cargar medios asignados');
    }
  }

  // Load when dialog opens
  useEffect(() => {
    if (open) {
      loadAssignedMedia();
    }
  }, [open, category]);

  async function handleConfirm(selectedMedia: MediaDoc[]) {
    if (selectedMedia.length === 0) return;

    try {
      // Get current max order for this mediaset
      const itemsSnapshot = await getDocs(
        query(
          collection(db, 'mediasets', mediasetId, 'items'),
          orderBy('order', 'desc')
        )
      );

      const maxOrder =
        itemsSnapshot.docs.length > 0
          ? itemsSnapshot.docs[0].data().order || 0
          : -1;

      const batch = writeBatch(db);

      // Sort by createdAt if available
      const sorted = [...selectedMedia].sort((a, b) => {
        const aTime = (a as any).createdAt?.toMillis?.() || 0;
        const bTime = (b as any).createdAt?.toMillis?.() || 0;
        return aTime - bTime;
      });

      sorted.forEach((media, index) => {
        // Use mediaId as the itemId
        const newItemRef = doc(db, 'mediasets', mediasetId, 'items', media.id);
        batch.set(newItemRef, {
          mediaId: media.id,
          order: maxOrder + 1 + index,
          flex: 1
        });
      });

      await batch.commit();

      toast.success(`${selectedMedia.length} medios asignados`);
      onSuccess();
    } catch (error) {
      console.error('Error assigning media:', error);
      toast.error('Error al asignar medios');
    }
  }

  const filterUnassigned = (media: MediaDoc) => {
    // Filter out media that are already assigned to any mediaset in this category
    return !assignedMediaIds.has(media.id);
  };

  const maxSelection = 4 - currentItemsCount;

  return (
    <MediaPickerDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Agregar Medio a la Fila'
      description={`Mostrando solo medios no asignados a ${category}. Seleccioná los elementos que querés agregar.`}
      selectionMode='multiple'
      filterPredicate={filterUnassigned}
      selectedIds={[]}
      maxSelection={maxSelection}
      onConfirm={handleConfirm}
    />
  );
}
