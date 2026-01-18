'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: 'home' | 'caves' | 'landscapes';
  currentMaxOrdering: number;
}

export default function NewMediasetDialog({
  open,
  onOpenChange,
  category,
  currentMaxOrdering
}: Props) {
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    try {
      setCreating(true);
      await addDoc(collection(db, 'mediasets'), {
        category,
        title: title || null,
        ordering: currentMaxOrdering + 1,
        createdAt: Timestamp.now(),
        modifiedAt: Timestamp.now(),
        publishedAt: null,
        deletedAt: null
      });
      toast.success('Mediaset creado');
      setTitle('');
      onOpenChange(false);
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
            Categoría: {category.charAt(0).toUpperCase() + category.slice(1)}
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid gap-2'>
            <Label htmlFor='title'>Título (opcional)</Label>
            <Input
              id='title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Nombre del mediaset...'
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
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
