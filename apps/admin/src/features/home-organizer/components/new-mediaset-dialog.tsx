'use client';

import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMaxOrdering: number;
}

export default function NewMediasetDialog({
  open,
  onOpenChange,
  currentMaxOrdering
}: Props) {
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    try {
      setCreating(true);
      const now = Timestamp.now();
      await addDoc(collection(db, 'mediasets'), {
        ordering: currentMaxOrdering + 1,
        createdAt: now,
        modifiedAt: now,
        publishedAt: now,
        deletedAt: null
      });
      toast.success('Mediaset creado');
      onOpenChange(false);
      // Los listeners en tiempo real se encargarán de actualizar los datos
    } catch (error) {
      console.error('Error creating mediaset:', error);
      toast.error('Error al crear mediaset');
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Nuevo Mediaset</DialogTitle>
          <DialogDescription>
            Creá un nuevo mediaset vacío. Podés agregarle items de media desde esta página.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={creating}
          >
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? 'Creando...' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
