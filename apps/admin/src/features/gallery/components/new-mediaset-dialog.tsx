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
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  currentMaxOrdering: number;
}

export default function NewMediasetDialog({
  open,
  onOpenChange,
  onSuccess,
  currentMaxOrdering,
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
        deletedAt: null,
      });
      toast.success('Mediaset created');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating mediaset:', error);
      toast.error('Failed to create mediaset');
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Mediaset</DialogTitle>
          <DialogDescription>
            Create a new empty mediaset. You can add media items to it from the
            Media page.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
